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

export async function listPublisherLedger(
  userId: string,
  options: { page?: number; limit?: number } = {},
) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(50, Math.max(1, options.limit ?? 10));
  const skip = (page - 1) * limit;

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    return {
      data: [],
      meta: { total: 0, page, limit, totalPages: 1 },
      totalEarned: 0,
    };
  }

  const where = { walletId: wallet.id, type: "CREDIT" as const };

  const [entries, total, totalEarned] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.ledgerEntry.count({ where }),
    prisma.ledgerEntry.aggregate({
      where,
      _sum: { amount: true },
    }),
  ]);

  return {
    data: entries.map((entry) => ({
      id: entry.id,
      amount: Number(entry.amount),
      balanceAfter: Number(entry.balanceAfter),
      referenceType: entry.referenceType,
      referenceId: entry.referenceId,
      description: entry.description,
      createdAt: entry.createdAt,
    })),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    totalEarned: Number(totalEarned._sum.amount ?? 0),
  };
}

export async function listUserDeposits(
  userId: string,
  options: { page?: number; limit?: number } = {},
) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(50, Math.max(1, options.limit ?? 10));
  const skip = (page - 1) * limit;

  const where = { userId };

  const [deposits, total, totalRecharged] = await Promise.all([
    prisma.deposit.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.deposit.count({ where }),
    prisma.deposit.aggregate({
      where: { ...where, status: "COMPLETED" },
      _sum: { amount: true },
    }),
  ]);

  const depositIds = deposits.map((deposit) => deposit.id);
  const ledgerEntries =
    depositIds.length > 0
      ? await prisma.ledgerEntry.findMany({
          where: {
            referenceType: "deposit",
            referenceId: { in: depositIds },
            type: "CREDIT",
          },
          select: { referenceId: true, balanceAfter: true },
        })
      : [];

  const balanceAfterByDeposit = new Map(
    ledgerEntries.map((entry) => [entry.referenceId, Number(entry.balanceAfter)]),
  );

  return {
    data: deposits.map((deposit) => ({
      id: deposit.id,
      amount: Number(deposit.amount),
      status: deposit.status,
      paymentId: deposit.stripePaymentId,
      createdAt: deposit.createdAt,
      balanceAfter: balanceAfterByDeposit.get(deposit.id) ?? null,
    })),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    totalRecharged: Number(totalRecharged._sum.amount ?? 0),
  };
}
