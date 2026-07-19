import { prisma } from "@cpl/database";
import { Prisma } from "@prisma/client";
import {
  dispatchCpaConversionPostbacks,
  getCpaNetworkPostbackConfig,
  isPostbackSecurityAuthorized,
  resolveCpaClickAttribution,
} from "@cpl/tracking-core";

async function handlePostback(request: Request, token: string) {
  try {
    const offer = await prisma.cpaOffer.findUnique({
      where: { postbackToken: token },
      select: { id: true, status: true },
    });

    if (!offer || offer.status === "ARCHIVED") {
      return Response.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    let body: Record<string, unknown> = {};
    if (request.method === "POST") {
      try {
        const parsed = await request.json();
        if (parsed && typeof parsed === "object") {
          body = parsed as Record<string, unknown>;
        }
      } catch {
        body = {};
      }
    }

    const getParam = (key: string): string | null => {
      const fromQuery = searchParams.get(key);
      if (fromQuery != null) return fromQuery;
      const fromBody = body[key];
      if (typeof fromBody === "string" || typeof fromBody === "number") {
        return String(fromBody);
      }
      return null;
    };

    const network = await getCpaNetworkPostbackConfig();
    if (!isPostbackSecurityAuthorized(network, getParam("secure"))) {
      return Response.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
    }

    const clickIdRaw = getParam("click_id");
    const payoutRaw = getParam("payout");

    let payout: Prisma.Decimal | null = null;
    if (payoutRaw && payoutRaw !== "{payout}") {
      const n = Number(payoutRaw);
      if (Number.isFinite(n) && n >= 0) {
        payout = new Prisma.Decimal(n);
      }
    }

    const inboundClickId =
      clickIdRaw && clickIdRaw !== "{click_id}" ? clickIdRaw.slice(0, 191) : null;

    let clickRow: {
      id: string;
      offerId: string;
      advertiserId: string;
      src: string | null;
      subId: string | null;
    } | null = null;

    if (inboundClickId) {
      clickRow = await prisma.cpaOfferClick.findUnique({
        where: { id: inboundClickId },
        select: {
          id: true,
          offerId: true,
          advertiserId: true,
          src: true,
          subId: true,
        },
      });
    }

    const attribution = resolveCpaClickAttribution({
      offerId: offer.id,
      inboundClickId,
      click: clickRow,
    });

    const rawQuery: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      rawQuery[key] = value;
    });

    const rawPayload: Prisma.InputJsonValue =
      Object.keys(rawQuery).length > 0
        ? rawQuery
        : (body as Prisma.InputJsonValue);

    // Store attributed platform click id only; keep unmatched network ids in rawQuery.
    const event = await prisma.cpaOfferConversion.create({
      data: {
        offerId: offer.id,
        clickId: attribution.attributedClickId ?? undefined,
        advertiserId: attribution.advertiserId ?? undefined,
        clickRecordId: attribution.clickRecordId ?? undefined,
        payout: payout ?? undefined,
        rawQuery: rawPayload,
      },
    });

    // Best-effort outbound dispatch; do not fail the inbound postback.
    try {
      await dispatchCpaConversionPostbacks({
        conversionId: event.id,
        offerId: offer.id,
        advertiserId: attribution.advertiserId,
        clickId: attribution.attributedClickId,
        payout,
        source: attribution.source,
        subId: attribution.subId,
      });
    } catch (error) {
      console.error("[pbtr] outbound dispatch failed", error);
    }

    return Response.json({
      ok: true,
      id: event.id,
      attributed: Boolean(attribution.advertiserId),
    });
  } catch (error) {
    console.error("[pbtr] postback failed", error);
    return Response.json({ error: { code: "INTERNAL_ERROR" } }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  return handlePostback(request, token);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  return handlePostback(request, token);
}
