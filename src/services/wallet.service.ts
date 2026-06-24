import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function getPlatformSettings() {
  const settings = await prisma.platformSetting.findMany();
  const map: Record<string, unknown> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  return {
    platformFeePercent: Number(map.platform_fee_percent ?? 10),
    minPayoutAmount: Number(map.min_payout_amount ?? 50),
    holdPeriodDays: Number(map.hold_period_days ?? 0),
    duplicateWindowDays: Number(map.duplicate_window_days ?? 30),
  };
}

export async function creditWallet(
  tx: Prisma.TransactionClient,
  userId: string,
  amount: number,
  referenceType: string,
  referenceId: string,
  description?: string,
) {
  const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });
  const newBalance = Number(wallet.balance) + amount;

  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  });

  await tx.ledgerEntry.create({
    data: {
      walletId: wallet.id,
      type: "CREDIT",
      amount,
      balanceAfter: newBalance,
      referenceType,
      referenceId,
      description,
    },
  });

  return newBalance;
}

export async function debitWallet(
  tx: Prisma.TransactionClient,
  userId: string,
  amount: number,
  referenceType: string,
  referenceId: string,
  description?: string,
) {
  const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });
  const current = Number(wallet.balance);

  if (current < amount) {
    throw new Error("INSUFFICIENT_FUNDS");
  }

  const newBalance = current - amount;

  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  });

  await tx.ledgerEntry.create({
    data: {
      walletId: wallet.id,
      type: "DEBIT",
      amount,
      balanceAfter: newBalance,
      referenceType,
      referenceId,
      description,
    },
  });

  return newBalance;
}

export async function processLeadPayment(leadId: string) {
  const lead = await prisma.lead.findUniqueOrThrow({
    where: { id: leadId },
    include: { campaign: true },
  });

  const settings = await getPlatformSettings();
  const cpl = Number(lead.campaign.cpl);
  const fee = (cpl * settings.platformFeePercent) / 100;
  const publisherAmount = cpl - fee;

  await prisma.$transaction(async (tx) => {
    await debitWallet(
      tx,
      lead.campaign.advertiserId,
      cpl,
      "lead",
      leadId,
      `Lead payment for campaign ${lead.campaign.name}`,
    );

    await creditWallet(
      tx,
      lead.publisherId,
      publisherAmount,
      "lead",
      leadId,
      `Earnings from lead`,
    );

    await tx.platformFee.create({
      data: {
        leadId,
        feeAmount: fee,
        feePercent: settings.platformFeePercent,
      },
    });

    const spent = Number(lead.campaign.spent) + cpl;
    const budget = Number(lead.campaign.budget);
    const updateData: Prisma.CampaignUpdateInput = { spent };

    if (spent >= budget) {
      updateData.status = "PAUSED";
    }

    await tx.campaign.update({
      where: { id: lead.campaignId },
      data: updateData,
    });

    await tx.lead.update({
      where: { id: leadId },
      data: { status: "PAID" },
    });
  });
}

export async function getWalletBalance(userId: string) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) return null;

  return {
    balance: Number(wallet.balance),
    holdBalance: Number(wallet.holdBalance),
    availableBalance: Number(wallet.balance) - Number(wallet.holdBalance),
    currency: wallet.currency,
  };
}
