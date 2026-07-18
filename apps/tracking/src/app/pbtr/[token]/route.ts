import { prisma } from "@cpl/database";
import { Prisma } from "@prisma/client";

async function handlePostback(
  request: Request,
  token: string,
) {
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

    const clickIdRaw =
      searchParams.get("click_id") ??
      (typeof body.click_id === "string" ? body.click_id : null);
    const payoutRaw =
      searchParams.get("payout") ??
      (typeof body.payout === "string" || typeof body.payout === "number"
        ? String(body.payout)
        : null);

    let payout: Prisma.Decimal | null = null;
    if (payoutRaw && payoutRaw !== "{payout}") {
      const n = Number(payoutRaw);
      if (Number.isFinite(n) && n >= 0) {
        payout = new Prisma.Decimal(n);
      }
    }

    const clickId =
      clickIdRaw && clickIdRaw !== "{click_id}" ? clickIdRaw.slice(0, 191) : null;

    const rawQuery: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      rawQuery[key] = value;
    });

    const rawPayload: Prisma.InputJsonValue =
      Object.keys(rawQuery).length > 0
        ? rawQuery
        : (body as Prisma.InputJsonValue);

    const event = await prisma.cpaOfferConversion.create({
      data: {
        offerId: offer.id,
        clickId,
        payout: payout ?? undefined,
        rawQuery: rawPayload,
      },
    });

    return Response.json({ ok: true, id: event.id });
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
