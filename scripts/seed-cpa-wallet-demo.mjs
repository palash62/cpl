import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();

async function ensureDemoOffer() {
  const existing = await prisma.cpaOffer.findFirst({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, payout: true },
  });
  if (existing) return existing;

  return prisma.cpaOffer.create({
    data: {
      name: "Wallet Demo Offer",
      network: "Direct",
      category: "Finance",
      previewUrl: "https://example.com/preview",
      trackingUrl: "https://example.com/offer",
      revenue: 35,
      payout: 25,
      status: "ACTIVE",
      postbackToken: randomBytes(16).toString("hex"),
    },
    select: { id: true, name: true, payout: true },
  });
}

async function resolveAdvertiser() {
  const preferredEmail = process.env.ADVERTISER_EMAIL?.trim().toLowerCase();
  if (preferredEmail) {
    const user = await prisma.user.findFirst({
      where: { role: "ADVERTISER", email: preferredEmail },
      select: { id: true, email: true, name: true },
    });
    if (user) return user;
  }

  return prisma.user.findFirst({
    where: { role: "ADVERTISER", email: "advertiser@cpl.local" },
    select: { id: true, email: true, name: true },
  });
}

async function main() {
  const advertiser = await resolveAdvertiser();
  if (!advertiser) {
    throw new Error("No advertiser account found. Run db:seed or set ADVERTISER_EMAIL.");
  }

  const offer = await ensureDemoOffer();
  const payoutAmount = Number(offer.payout);

  await prisma.cpaWallet.upsert({
    where: { advertiserId: advertiser.id },
    create: { advertiserId: advertiser.id },
    update: {},
  });

  async function createEarning(input) {
    const click = await prisma.cpaOfferClick.create({
      data: {
        offerId: offer.id,
        advertiserId: advertiser.id,
        src: input.tag,
        subId: "wallet-demo",
      },
    });

    const conversion = await prisma.cpaOfferConversion.create({
      data: {
        offerId: offer.id,
        clickId: click.id,
        advertiserId: advertiser.id,
        clickRecordId: click.id,
        payout: payoutAmount,
        rawQuery: { source: input.tag },
      },
    });

    const earning = await prisma.cpaEarning.create({
      data: {
        advertiserId: advertiser.id,
        conversionId: conversion.id,
        offerId: offer.id,
        amount: payoutAmount,
        availableAt: input.availableAt,
        status: input.status,
      },
    });

    if (input.creditWallet) {
      await prisma.cpaWallet.update({
        where: { advertiserId: advertiser.id },
        data: { balance: { increment: payoutAmount } },
      });
    }

    return earning;
  }

  const pendingAt = new Date();
  pendingAt.setDate(pendingAt.getDate() + 7);

  const maturedAt = new Date();
  maturedAt.setDate(maturedAt.getDate() - 1);

  const pending = await createEarning({
    tag: "wallet-demo-pending",
    status: "PENDING",
    availableAt: pendingAt,
    creditWallet: false,
  });

  const available = await createEarning({
    tag: "wallet-demo-available",
    status: "AVAILABLE",
    availableAt: maturedAt,
    creditWallet: true,
  });

  console.log(
    JSON.stringify(
      {
        advertiser: advertiser.email,
        offer: offer.name,
        payout: payoutAmount,
        pendingEarningId: pending.id,
        availableEarningId: available.id,
        walletUrl: "http://localhost:3010/advertiser/cpa-offers/wallet",
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error.message ?? error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
