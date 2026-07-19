/**
 * Live smoke: admin network settings → advertiser S2S → click → pbtr → deliveries.
 * Run: npx tsx scripts/smoke-global-postback-e2e.ts
 */
import { createServer } from "node:http";
import { PrismaClient } from "@prisma/client";
import {
  dispatchCpaConversionPostbacks,
  getCpaNetworkPostbackConfig,
  isPostbackSecurityAuthorized,
} from "../packages/tracking-core/src/cpa-postback-dispatch.ts";
import { resolveCpaClickAttribution } from "../packages/tracking-core/src/cpa-click-attribution.ts";
import { injectClickIdIntoTrackingUrl } from "../packages/shared/src/postback-macros.ts";

const prisma = new PrismaClient();

function startCatcher(port: number): Promise<{
  url: string;
  hits: string[];
  close: () => Promise<void>;
}> {
  const hits: string[] = [];
  const server = createServer((req, res) => {
    const full = `http://127.0.0.1:${port}${req.url ?? "/"}`;
    hits.push(full);
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      resolve({
        url: `http://127.0.0.1:${port}`,
        hits,
        close: () =>
          new Promise((res, rej) => server.close((err) => (err ? rej(err) : res()))),
      });
    });
  });
}

async function main() {
  const adminCatcher = await startCatcher(19876);
  const advCatcher = await startCatcher(19877);

  try {
    await prisma.platformSetting.upsert({
      where: { key: "cpa_network_postback" },
      create: {
        key: "cpa_network_postback",
        value: {
          version: 1,
          useSecurityKey: true,
          securityKey: "testkey123",
          parallelPostbackUrl: `${adminCatcher.url}/admin?offer_id={offer_id}&click_id={click_id}&payout={payout}&aff_id={aff_id}`,
        },
      },
      update: {
        value: {
          version: 1,
          useSecurityKey: true,
          securityKey: "testkey123",
          parallelPostbackUrl: `${adminCatcher.url}/admin?offer_id={offer_id}&click_id={click_id}&payout={payout}&aff_id={aff_id}`,
        },
      },
    });

    const network = await getCpaNetworkPostbackConfig();
    if (!isPostbackSecurityAuthorized(network, "testkey123")) {
      throw new Error("security key accept failed");
    }
    if (isPostbackSecurityAuthorized(network, "wrong")) {
      throw new Error("security key reject failed");
    }

    const advertiser = await prisma.user.findFirst({
      where: { role: "ADVERTISER", status: "ACTIVE" },
      select: { id: true, email: true },
    });
    if (!advertiser) throw new Error("No active advertiser");

    await prisma.advertiserGlobalPostback.upsert({
      where: { advertiserId: advertiser.id },
      create: {
        advertiserId: advertiser.id,
        type: "S2S",
        status: "ACTIVE",
        endpoint: `${advCatcher.url}/adv?click_id={click_id}&payout={payout}&aff_id={aff_id}`,
      },
      update: {
        type: "S2S",
        status: "ACTIVE",
        endpoint: `${advCatcher.url}/adv?click_id={click_id}&payout={payout}&aff_id={aff_id}`,
      },
    });

    const offer = await prisma.cpaOffer.findFirst({
      where: { status: "ACTIVE" },
      select: { id: true, postbackToken: true, name: true, trackingUrl: true },
    });
    if (!offer) throw new Error("No active CPA offer");

    const click = await prisma.cpaOfferClick.create({
      data: {
        offerId: offer.id,
        advertiserId: advertiser.id,
        subId: "smoke-sub",
        src: "smoke",
      },
    });

    const injected = injectClickIdIntoTrackingUrl(
      offer.trackingUrl.includes("?") ? offer.trackingUrl : `${offer.trackingUrl}?x=1`,
      click.id,
      "http://localhost:3001",
    );
    if (!injected.includes(click.id)) {
      throw new Error("click_id not injected into tracking URL");
    }

    const attribution = resolveCpaClickAttribution({
      offerId: offer.id,
      inboundClickId: click.id,
      click: {
        id: click.id,
        offerId: offer.id,
        advertiserId: advertiser.id,
        src: "smoke",
        subId: "smoke-sub",
      },
    });
    if (!attribution.advertiserId) throw new Error("attribution failed");

    const unmatched = resolveCpaClickAttribution({
      offerId: offer.id,
      inboundClickId: "not-a-real-click",
      click: null,
    });
    if (unmatched.advertiserId) throw new Error("unmatched click should not attribute");

    const conversion = await prisma.cpaOfferConversion.create({
      data: {
        offerId: offer.id,
        clickId: attribution.attributedClickId!,
        advertiserId: attribution.advertiserId!,
        clickRecordId: attribution.clickRecordId!,
        payout: 1,
        rawQuery: { smoke: "e2e", secure: "testkey123" },
      },
    });

    await dispatchCpaConversionPostbacks({
      conversionId: conversion.id,
      offerId: offer.id,
      advertiserId: attribution.advertiserId,
      clickId: attribution.attributedClickId,
      payout: "1",
      source: attribution.source,
      subId: attribution.subId,
    });

    await new Promise((r) => setTimeout(r, 250));

    const deliveries = await prisma.cpaPostbackDelivery.findMany({
      where: { conversionId: conversion.id },
    });

    const admin = deliveries.find((d) => d.target === "ADMIN_PARALLEL");
    const adv = deliveries.find((d) => d.target === "ADVERTISER_GLOBAL");

    if (!admin || admin.status !== "SUCCESS") {
      throw new Error(`Admin delivery failed: ${JSON.stringify(admin)}`);
    }
    if (!adv || adv.status !== "SUCCESS") {
      throw new Error(`Advertiser delivery failed: ${JSON.stringify(adv)}`);
    }
    if (adminCatcher.hits.length < 1) throw new Error("Admin catcher got no hits");
    if (advCatcher.hits.length < 1) throw new Error("Advertiser catcher got no hits");

    // Also hit live global /pbtr if tracking is up (optional best-effort)
    let pbtrLive: { status?: number; body?: unknown; skipped?: string } = {};
    try {
      const trackingBase = process.env.TRACKING_URL ?? "http://localhost:3001";
      const missing = await fetch(`${trackingBase}/pbtr?payout=1&secure=testkey123`);
      if (missing.status !== 404) {
        throw new Error(`Expected 404 for missing click_id, got ${missing.status}`);
      }
      const bad = await fetch(
        `${trackingBase}/pbtr?click_id=${click.id}&payout=1&secure=wrong`,
      );
      if (bad.status !== 401) {
        throw new Error(`Expected 401 for wrong secure, got ${bad.status}`);
      }
      const good = await fetch(
        `${trackingBase}/pbtr?click_id=${click.id}&payout=1&secure=testkey123`,
      );
      const body = await good.json().catch(() => null);
      pbtrLive = { status: good.status, body };
      if (!good.ok) throw new Error(`pbtr live failed: ${JSON.stringify(body)}`);
    } catch (error) {
      pbtrLive = {
        skipped:
          error instanceof Error ? error.message : "tracking server not reachable",
      };
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          advertiser: advertiser.email,
          offer: offer.name,
          clickId: click.id,
          conversionId: conversion.id,
          attributed: true,
          securityRejectWorks: true,
          adminHits: adminCatcher.hits,
          advHits: advCatcher.hits,
          deliveries: deliveries.map((d) => ({
            target: d.target,
            status: d.status,
            url: d.url,
          })),
          pbtrLive,
        },
        null,
        2,
      ),
    );
  } finally {
    await adminCatcher.close();
    await advCatcher.close();
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
