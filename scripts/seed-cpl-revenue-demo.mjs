/**
 * Seed a dedicated lead with CPL $1.00 and CPA revenue $10.00 for UI verification.
 * Run: node scripts/seed-cpl-revenue-demo.mjs
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();

const DEMO_EMAIL = "cpl-revenue-demo@example.com";
const CAMPAIGN_ID = "seed-campaign-001";
const CPL_AMOUNT = 1.0;
const REVENUE_AMOUNT = 10.0;

async function deleteCpaChainForLead(leadId) {
  const clicks = await prisma.cpaOfferClick.findMany({
    where: { leadId },
    select: { id: true },
  });
  if (clicks.length === 0) return;

  const clickIds = clicks.map((c) => c.id);
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

async function findExistingDemoLead() {
  const leads = await prisma.lead.findMany({
    where: {
      campaignId: CAMPAIGN_ID,
      isTest: false,
    },
    select: { id: true, data: true, cpl: true, status: true },
    orderBy: { createdAt: "desc" },
  });

  return leads.find((lead) => {
    if (!lead.data || typeof lead.data !== "object") return false;
    const email = /** @type {Record<string, string>} */ (lead.data).email?.trim().toLowerCase();
    return email === DEMO_EMAIL;
  });
}

async function ensureActiveOffer() {
  const existing = await prisma.cpaOffer.findFirst({
    where: { status: "ACTIVE" },
    select: { id: true },
  });
  if (existing) return existing;

  return prisma.cpaOffer.create({
    data: {
      name: "CPL Revenue Demo Offer",
      network: "Direct",
      category: "Test",
      previewUrl: "https://example.com/p",
      trackingUrl: "https://example.com/t?cid={click_id}",
      revenue: 20,
      payout: 25,
      status: "ACTIVE",
      postbackToken: randomBytes(16).toString("hex"),
    },
    select: { id: true },
  });
}

async function main() {
  const advertiser = await prisma.user.findFirst({
    where: { role: "ADVERTISER", email: "advertiser@cpl.local" },
    select: { id: true, email: true },
  });
  if (!advertiser) throw new Error("Seed advertiser not found (advertiser@cpl.local)");

  const publisher = await prisma.user.findFirst({
    where: { role: "PUBLISHER", email: "publisher@cpl.local" },
    select: { id: true },
  });
  if (!publisher) throw new Error("Seed publisher not found (publisher@cpl.local)");

  const campaign = await prisma.campaign.findUnique({
    where: { id: CAMPAIGN_ID },
    select: { id: true, name: true, advertiserId: true },
  });
  if (!campaign || campaign.advertiserId !== advertiser.id) {
    throw new Error(`Campaign ${CAMPAIGN_ID} not found for demo advertiser`);
  }

  let lead = await findExistingDemoLead();

  if (lead) {
    await deleteCpaChainForLead(lead.id);
    lead = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: "APPROVED",
        cpl: CPL_AMOUNT,
        data: {
          email: DEMO_EMAIL,
          first_name: "CPL",
          last_name: "Revenue Test",
        },
        country: "US",
      },
      select: { id: true, data: true, cpl: true, status: true },
    });
    console.log("✓ Reset existing demo lead:", lead.id);
  } else {
    lead = await prisma.lead.create({
      data: {
        campaignId: CAMPAIGN_ID,
        publisherId: publisher.id,
        status: "APPROVED",
        cpl: CPL_AMOUNT,
        isTest: false,
        data: {
          email: DEMO_EMAIL,
          first_name: "CPL",
          last_name: "Revenue Test",
        },
        country: "US",
      },
      select: { id: true, data: true, cpl: true, status: true },
    });
    console.log("✓ Created demo lead:", lead.id);
  }

  const offer = await ensureActiveOffer();

  const click = await prisma.cpaOfferClick.create({
    data: {
      offerId: offer.id,
      advertiserId: advertiser.id,
      leadId: lead.id,
      src: "cpl-revenue-demo",
      subId: "demo",
    },
    select: { id: true },
  });

  const conversion = await prisma.cpaOfferConversion.create({
    data: {
      offerId: offer.id,
      clickId: click.id,
      advertiserId: advertiser.id,
      clickRecordId: click.id,
      payout: REVENUE_AMOUNT,
      rawQuery: { source: "cpl-revenue-demo" },
    },
  });

  await prisma.cpaEarning.create({
    data: {
      advertiserId: advertiser.id,
      conversionId: conversion.id,
      offerId: offer.id,
      amount: REVENUE_AMOUNT,
      availableAt: new Date(Date.now() + 7 * 86400000),
      status: "PENDING",
    },
  });

  console.log("✓ Attached 1 CPA sale with $10.00 revenue");

  const cpl = Number(lead.cpl);
  if (Math.abs(cpl - CPL_AMOUNT) > 0.001) {
    throw new Error(`Expected lead CPL ${CPL_AMOUNT}, got ${cpl}`);
  }

  const clicks = await prisma.cpaOfferClick.findMany({
    where: { leadId: lead.id },
    select: {
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
  if (salesCount !== 1) throw new Error(`Expected 1 sale, got ${salesCount}`);
  if (Math.abs(revenue - REVENUE_AMOUNT) > 0.001) {
    throw new Error(`Expected revenue $${REVENUE_AMOUNT}, got $${revenue}`);
  }

  console.log("\n--- CPL vs Revenue demo ready ---");
  console.log("Advertiser:", advertiser.email);
  console.log("Lead ID:", lead.id);
  console.log("Email:", DEMO_EMAIL);
  console.log("Campaign:", campaign.name);
  console.log("Expected UI: CPL $1.00 | Sales 1 sale | Revenue $10.00");
  console.log("Open: http://localhost:3010/advertiser/lead-details");
}

main()
  .catch((err) => {
    console.error("SEED FAILED:", err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
