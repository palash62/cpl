/**
 * Smoke test: CPA sales/revenue attribution via leadId
 * Run: node scripts/smoke-cpa-lead-sales.mjs
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();
const TRACKING_URL = process.env.TRACKING_URL ?? "http://localhost:3001";

async function main() {
  const advertiser = await prisma.user.findFirst({
    where: { role: "ADVERTISER", email: "advertiser@cpl.local" },
    select: { id: true, email: true },
  });
  if (!advertiser) throw new Error("Seed advertiser not found");

  const lead = await prisma.lead.findFirst({
    where: {
      isTest: false,
      campaign: { advertiserId: advertiser.id },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      publisherId: true,
      campaignId: true,
      campaign: { select: { name: true } },
    },
  });
  if (!lead) throw new Error("No lead found for advertiser — create a lead first");

  let offer = await prisma.cpaOffer.findFirst({
    where: { status: "ACTIVE" },
    select: { id: true, payout: true },
  });
  if (!offer) {
    offer = await prisma.cpaOffer.create({
      data: {
        name: "Smoke Test Offer",
        network: "Direct",
        category: "Test",
        previewUrl: "https://example.com/p",
        trackingUrl: "https://example.com/t?cid={click_id}",
        revenue: 20,
        payout: 15,
        status: "ACTIVE",
        postbackToken: randomBytes(16).toString("hex"),
      },
      select: { id: true, payout: true },
    });
  }

  const payout = Number(offer.payout);
  const tag = `smoke-${Date.now()}`;

  // Clean prior smoke data for this lead (optional single conversion test)
  const existingClicks = await prisma.cpaOfferClick.findMany({
    where: { leadId: lead.id, src: { startsWith: "smoke-" } },
    select: { id: true },
  });
  if (existingClicks.length > 0) {
    const clickIds = existingClicks.map((c) => c.id);
    const conversions = await prisma.cpaOfferConversion.findMany({
      where: { clickRecordId: { in: clickIds } },
      select: { id: true },
    });
    const convIds = conversions.map((c) => c.id);
    if (convIds.length) {
      await prisma.cpaEarning.deleteMany({ where: { conversionId: { in: convIds } } });
      await prisma.cpaOfferConversion.deleteMany({ where: { id: { in: convIds } } });
    }
    await prisma.cpaOfferClick.deleteMany({ where: { id: { in: clickIds } } });
  }

  // 1) Test tracking redirect accepts lead_id
  const trackingRes = await fetch(
    `${TRACKING_URL}/cpa/${offer.id}?adv_id=${advertiser.id}&lead_id=${lead.id}&src=${tag}`,
    { redirect: "manual" },
  );
  if (trackingRes.status !== 302) {
    throw new Error(`Tracking redirect expected 302, got ${trackingRes.status}`);
  }

  const click = await prisma.cpaOfferClick.findFirst({
    where: { leadId: lead.id, src: tag },
    select: { id: true, leadId: true },
  });
  if (!click?.leadId) {
    throw new Error("Tracking route did not persist leadId on click");
  }
  console.log("✓ Tracking route stored leadId on click:", click.id);

  // 2) Simulate postback — conversion + earning
  const conversion = await prisma.cpaOfferConversion.create({
    data: {
      offerId: offer.id,
      clickId: click.id,
      advertiserId: advertiser.id,
      clickRecordId: click.id,
      payout,
      rawQuery: { smoke: tag },
    },
  });
  await prisma.cpaEarning.create({
    data: {
      advertiserId: advertiser.id,
      conversionId: conversion.id,
      offerId: offer.id,
      amount: payout,
      availableAt: new Date(Date.now() + 7 * 86400000),
      status: "PENDING",
    },
  });
  console.log("✓ Created conversion + earning for lead:", lead.id);

  // 3) Verify aggregation query (same logic as loadCpaMetricsByLeadIds)
  const clicks = await prisma.cpaOfferClick.findMany({
    where: { leadId: { in: [lead.id] } },
    select: {
      leadId: true,
      conversions: { select: { cpaEarning: { select: { amount: true } } } },
    },
  });
  let salesCount = 0;
  let revenue = 0;
  for (const row of clicks) {
    for (const conv of row.conversions) {
      salesCount += 1;
      if (conv.cpaEarning) revenue += Number(conv.cpaEarning.amount);
    }
  }
  if (salesCount < 1) throw new Error(`Expected salesCount >= 1, got ${salesCount}`);
  if (revenue < payout) throw new Error(`Expected revenue >= ${payout}, got ${revenue}`);
  console.log(`✓ Aggregated metrics: ${salesCount} sale(s), $${revenue.toFixed(2)} revenue`);

  console.log("\n--- Test lead for UI verification ---");
  console.log("Advertiser:", advertiser.email);
  console.log("Lead ID:", lead.id);
  console.log("Campaign:", lead.campaign.name);
  console.log("Publisher:", lead.publisherId);
  console.log("Check: http://localhost:3010/advertiser/lead-details");
  console.log("Check: http://localhost:3010/advertiser/lead-report");
  console.log("Check: http://localhost:3010/advertiser/reports");
}

main()
  .catch((err) => {
    console.error("SMOKE TEST FAILED:", err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
