import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { PENDING_PAYOUT_STATUSES } from "@/lib/payout-status";
import {
  generateReferralCode,
  computeReferralMigrationMove,
  REFERRAL_LEVEL_1_RATE,
  REFERRAL_LEVEL_2_RATE,
} from "@/lib/referral";
import { getLeadCpl } from "@/lib/lead-cpl";
import {
  creditReferralBalance,
  releaseWalletHold,
  transferReferralToWallet,
} from "@/services/wallet.service";
import { Errors } from "@/lib/errors";
import { randomUUID } from "crypto";

type ReferralUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
  level: 1 | 2;
  adSpend: number;
  commission: number;
  referredByName?: string;
};

type ReferralCreditResult = {
  referrerId: string;
  level: 1 | 2;
  amount: number;
};

type ReferralCommissionEntry = {
  id: string;
  amount: number;
  description: string | null;
  createdAt: Date;
  referenceId: string | null;
};

export type ReferralBalanceSummary = {
  referralEarned: number;
  referralPaidOut: number;
  pendingReferralPayout: number;
  /** Available ring-fenced referral balance (referralBalance - referralHold). */
  withdrawableReferral: number;
  /** Main wallet available (balance - holdBalance). */
  availableBalance: number;
  totalReferralEarning: number;
  remainReferralEarning: number;
};

async function createUniqueReferralCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const referralCode = generateReferralCode();
    const existing = await prisma.user.findUnique({
      where: { referralCode },
      select: { id: true },
    });
    if (!existing) return referralCode;
  }

  return generateReferralCode(8);
}

export async function ensureReferralCode(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  if (user?.referralCode) return user.referralCode;

  const referralCode = await createUniqueReferralCode();
  const updated = await prisma.user.updateMany({
    where: { id: userId },
    data: { referralCode },
  });

  if (updated.count === 0) {
    return referralCode;
  }

  return referralCode;
}

export async function resolveReferrerId(referralRef?: string | null) {
  if (!referralRef?.trim()) return null;

  const ref = referralRef.trim();
  const byCode = await prisma.user.findUnique({
    where: { referralCode: ref.toUpperCase() },
    select: { id: true, role: true },
  });
  if (byCode) {
    return byCode.role === "ADVERTISER" ? byCode.id : null;
  }

  const byId = await prisma.user.findUnique({
    where: { id: ref },
    select: { id: true, role: true },
  });

  return byId?.role === "ADVERTISER" ? byId.id : null;
}

async function ensureAdvertiserWallet(userId: string, tx: Prisma.TransactionClient) {
  return tx.wallet.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

async function creditReferralIfNotExists(
  tx: Prisma.TransactionClient,
  referrerId: string,
  leadId: string,
  amount: number,
  level: 1 | 2,
): Promise<boolean> {
  const existing = await tx.ledgerEntry.findFirst({
    where: {
      type: "CREDIT",
      referenceType: "referral",
      referenceId: leadId,
      wallet: { userId: referrerId },
    },
    select: { id: true },
  });

  if (existing || amount <= 0) return false;

  await ensureAdvertiserWallet(referrerId, tx);
  await creditReferralBalance(
    tx,
    referrerId,
    amount,
    "referral",
    leadId,
    `Level ${level} referral commission`,
  );

  return true;
}

export async function creditReferralCommissionsForLead(
  tx: Prisma.TransactionClient,
  leadId: string,
  advertiserId: string,
  cpl: number,
): Promise<ReferralCreditResult[]> {
  const advertiser = await tx.user.findUnique({
    where: { id: advertiserId },
    select: {
      referredBy: {
        select: {
          id: true,
          role: true,
          referredBy: { select: { id: true, role: true } },
        },
      },
    },
  });

  if (!advertiser) return [];

  const credited: ReferralCreditResult[] = [];
  const level1 = advertiser.referredBy;

  if (level1?.role === "ADVERTISER") {
    const amount = cpl * REFERRAL_LEVEL_1_RATE;
    const didCredit = await creditReferralIfNotExists(tx, level1.id, leadId, amount, 1);
    if (didCredit) {
      credited.push({ referrerId: level1.id, level: 1, amount });
    }
  }

  const level2 = level1?.referredBy;
  if (level2?.role === "ADVERTISER") {
    const amount = cpl * REFERRAL_LEVEL_2_RATE;
    const didCredit = await creditReferralIfNotExists(tx, level2.id, leadId, amount, 2);
    if (didCredit) {
      credited.push({ referrerId: level2.id, level: 2, amount });
    }
  }

  return credited;
}

export async function reconcileReferralCreditsForLead(leadId: string): Promise<boolean> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        campaign: { select: { advertiserId: true, cpl: true } },
      },
    });

    if (!lead || lead.status !== "PAID") return false;

    const cpl = getLeadCpl(lead);
    let credited = false;

    await prisma.$transaction(async (tx) => {
      const results = await creditReferralCommissionsForLead(
        tx,
        leadId,
        lead.campaign.advertiserId,
        cpl,
      );
      credited = results.length > 0;
    });

    return credited;
  } catch (error) {
    console.error(`Failed to reconcile referral credit for lead ${leadId}`, error);
    return false;
  }
}

export async function reconcileAllReferralCredits(): Promise<number> {
  const leads = await prisma.lead.findMany({
    where: { status: "PAID" },
    select: { id: true },
  });

  let credited = 0;
  for (const lead of leads) {
    const didCredit = await reconcileReferralCreditsForLead(lead.id);
    if (didCredit) credited += 1;
  }

  return credited;
}

export async function reconcileReferralCreditsForUser(userId: string): Promise<number> {
  const level1Users = await prisma.user.findMany({
    where: { referredById: userId },
    select: {
      id: true,
      referrals: { select: { id: true } },
    },
  });

  const spenderIds = [
    ...level1Users.map((user) => user.id),
    ...level1Users.flatMap((user) => user.referrals.map((referral) => referral.id)),
  ];

  if (spenderIds.length === 0) return 0;

  const leads = await prisma.lead.findMany({
    where: {
      status: "PAID",
      campaign: { advertiserId: { in: spenderIds } },
    },
    select: { id: true },
  });

  let credited = 0;
  for (const lead of leads) {
    const didCredit = await reconcileReferralCreditsForLead(lead.id);
    if (didCredit) credited += 1;
  }

  return credited;
}

export async function getReferralBalanceSummary(userId: string): Promise<ReferralBalanceSummary> {
  const [credits, debits, pendingPayouts, wallet] = await Promise.all([
    prisma.ledgerEntry.aggregate({
      where: {
        type: "CREDIT",
        referenceType: "referral",
        wallet: { userId },
      },
      _sum: { amount: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: {
        type: "DEBIT",
        referenceType: { in: ["referral_payout", "referral_transfer"] },
        wallet: { userId },
      },
      _sum: { amount: true },
    }),
    prisma.payout.aggregate({
      where: {
        publisherId: userId,
        kind: "REFERRAL",
        status: { in: [...PENDING_PAYOUT_STATUSES] },
      },
      _sum: { amount: true },
    }),
    prisma.wallet.findUnique({ where: { userId } }),
  ]);

  const referralEarned = Number(credits._sum.amount ?? 0);
  const referralPaidOut = Number(debits._sum.amount ?? 0);
  const pendingReferralPayout = Number(pendingPayouts._sum.amount ?? 0);
  const withdrawableReferral = wallet
    ? Math.max(0, Number(wallet.referralBalance) - Number(wallet.referralHoldBalance))
    : 0;
  const availableBalance = wallet
    ? Number(wallet.balance) - Number(wallet.holdBalance)
    : 0;

  return {
    referralEarned,
    referralPaidOut,
    pendingReferralPayout,
    withdrawableReferral,
    availableBalance,
    totalReferralEarning: referralEarned,
    remainReferralEarning: withdrawableReferral,
  };
}

export async function transferReferralEarningsToWallet(userId: string, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw Errors.validation("Enter a valid transfer amount.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADVERTISER") {
    throw Errors.forbidden();
  }

  const referenceId = randomUUID();

  try {
    return await prisma.$transaction(async (tx) => {
      await ensureAdvertiserWallet(userId, tx);
      return transferReferralToWallet(tx, userId, amount, referenceId);
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_FUNDS") {
      throw Errors.insufficientFunds();
    }
    throw error;
  }
}

/**
 * One-time: move min(ledger withdrawable, main available) from main balance
 * into referralBalance. Re-homes pending REFERRAL payout holds onto the pot.
 */
export async function migrateSharedReferralBalancesToPot() {
  const wallets = await prisma.wallet.findMany({
    select: {
      id: true,
      userId: true,
      balance: true,
      holdBalance: true,
      referralBalance: true,
      referralHoldBalance: true,
    },
  });

  let migrated = 0;

  for (const wallet of wallets) {
    if (Number(wallet.referralBalance) > 0 || Number(wallet.referralHoldBalance) > 0) {
      continue;
    }

    const pendingPayouts = await prisma.payout.findMany({
      where: {
        publisherId: wallet.userId,
        kind: "REFERRAL",
        status: { in: [...PENDING_PAYOUT_STATUSES] },
      },
      select: { id: true, amount: true },
    });
    const pendingTotal = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0);

    const [credits, payoutDebits, transferDebits] = await Promise.all([
      prisma.ledgerEntry.aggregate({
        where: {
          type: "CREDIT",
          referenceType: "referral",
          walletId: wallet.id,
        },
        _sum: { amount: true },
      }),
      prisma.ledgerEntry.aggregate({
        where: {
          type: "DEBIT",
          referenceType: "referral_payout",
          walletId: wallet.id,
        },
        _sum: { amount: true },
      }),
      prisma.ledgerEntry.aggregate({
        where: {
          type: "DEBIT",
          referenceType: "referral_transfer",
          walletId: wallet.id,
        },
        _sum: { amount: true },
      }),
    ]);

    const earned = Number(credits._sum.amount ?? 0);
    const paid = Number(payoutDebits._sum.amount ?? 0) + Number(transferDebits._sum.amount ?? 0);
    const ledgerWithdrawable = Math.max(0, earned - paid - pendingTotal);
    if (ledgerWithdrawable <= 0 && pendingTotal <= 0) continue;

    await prisma.$transaction(async (tx) => {
      for (const payout of pendingPayouts) {
        await releaseWalletHold(tx, wallet.userId, Number(payout.amount));
      }

      const fresh = await tx.wallet.findUniqueOrThrow({ where: { id: wallet.id } });
      const available = Number(fresh.balance) - Number(fresh.holdBalance);
      const move = computeReferralMigrationMove({
        ledgerWithdrawable,
        pendingReferralPayout: pendingTotal,
        availableMainBalance: available,
      });
      if (move <= 0 && pendingTotal <= 0) return;

      const newBalance = Number(fresh.balance) - move;
      const newReferralBalance = Number(fresh.referralBalance) + move;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: newBalance,
          referralBalance: newReferralBalance,
          referralHoldBalance: pendingTotal,
        },
      });

      if (move > 0) {
        await tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            type: "DEBIT",
            amount: move,
            balanceAfter: newBalance,
            referenceType: "referral_balance_migration",
            referenceId: wallet.userId,
            description: "Move referral earning from main wallet into referral balance",
          },
        });
        await tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            type: "CREDIT",
            amount: move,
            balanceAfter: newReferralBalance,
            referenceType: "referral_balance_migration",
            referenceId: wallet.userId,
            description: "Seed referral balance from shared wallet",
          },
        });
      }
    });

    migrated += 1;
  }

  return migrated;
}

async function getPaidLeadTotalsByAdvertiser(advertiserIds: string[]) {
  if (advertiserIds.length === 0) return new Map<string, { adSpend: number; leadIds: string[] }>();

  const leads = await prisma.lead.findMany({
    where: {
      status: "PAID",
      campaign: { advertiserId: { in: advertiserIds } },
    },
    select: {
      id: true,
      cpl: true,
      campaign: { select: { advertiserId: true, cpl: true } },
    },
  });

  const totals = new Map<string, { adSpend: number; leadIds: string[] }>();
  for (const lead of leads) {
    const advertiserId = lead.campaign.advertiserId;
    const current = totals.get(advertiserId) ?? { adSpend: 0, leadIds: [] };
    current.adSpend += getLeadCpl(lead);
    current.leadIds.push(lead.id);
    totals.set(advertiserId, current);
  }

  return totals;
}

async function getReferralCommissionsForLeads(referrerId: string, leadIds: string[]) {
  if (leadIds.length === 0) return 0;

  const result = await prisma.ledgerEntry.aggregate({
    where: {
      type: "CREDIT",
      referenceType: "referral",
      referenceId: { in: leadIds },
      wallet: { userId: referrerId },
    },
    _sum: { amount: true },
  });

  return Number(result._sum.amount ?? 0);
}

async function listRecentReferralCommissions(
  referrerId: string,
  limit = 10,
): Promise<(ReferralCommissionEntry & { spenderName?: string })[]> {
  const entries = await prisma.ledgerEntry.findMany({
    where: {
      type: "CREDIT",
      referenceType: "referral",
      wallet: { userId: referrerId },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      amount: true,
      description: true,
      createdAt: true,
      referenceId: true,
    },
  });

  const leadIds = entries
    .map((entry) => entry.referenceId)
    .filter((id): id is string => Boolean(id));

  const leads =
    leadIds.length > 0
      ? await prisma.lead.findMany({
          where: { id: { in: leadIds } },
          select: {
            id: true,
            campaign: {
              select: {
                advertiser: { select: { name: true } },
              },
            },
          },
        })
      : [];

  const spenderByLeadId = new Map(
    leads.map((lead) => [lead.id, lead.campaign.advertiser.name] as const),
  );

  return entries.map((entry) => {
    const spenderName = entry.referenceId
      ? spenderByLeadId.get(entry.referenceId)
      : undefined;
    const baseDescription = entry.description ?? "Referral commission";
    const description =
      spenderName && !baseDescription.includes(spenderName)
        ? `${baseDescription} from ${spenderName}`
        : baseDescription;

    return {
      id: entry.id,
      amount: Number(entry.amount),
      description,
      createdAt: entry.createdAt,
      referenceId: entry.referenceId,
      spenderName,
    };
  });
}

export type AdminReferralReportRow = {
  referredId: string;
  referredName: string;
  referredEmail: string;
  referredStatus: string;
  joinedAt: Date;
  referrerId: string;
  referrerName: string;
  referrerEmail: string;
  referrerCode: string | null;
  adSpend: number;
  commission: number;
};

export async function getAdminReferralReport(options?: { q?: string }) {
  const q = options?.q?.trim();

  const [referredUsers, globalReferred, totalCommissionAgg, pendingPayoutAgg] = await Promise.all([
    prisma.user.findMany({
      where: {
        referredById: { not: null },
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { email: { contains: q } },
                { referredBy: { name: { contains: q } } },
                { referredBy: { email: { contains: q } } },
                { referredBy: { referralCode: { contains: q.toUpperCase() } } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        referredBy: {
          select: {
            id: true,
            name: true,
            email: true,
            referralCode: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { referredById: { not: null } },
      select: { referredById: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: {
        type: "CREDIT",
        referenceType: "referral",
      },
      _sum: { amount: true },
    }),
    prisma.payout.aggregate({
      where: {
        kind: "REFERRAL",
        status: { in: [...PENDING_PAYOUT_STATUSES] },
      },
      _sum: { amount: true },
    }),
  ]);

  const referredIds = referredUsers.map((user) => user.id);
  const spendTotals = await getPaidLeadTotalsByAdvertiser(referredIds);

  const rows: AdminReferralReportRow[] = await Promise.all(
    referredUsers.map(async (user) => {
      const referrer = user.referredBy!;
      const totals = spendTotals.get(user.id) ?? { adSpend: 0, leadIds: [] };
      const commission = await getReferralCommissionsForLeads(referrer.id, totals.leadIds);

      return {
        referredId: user.id,
        referredName: user.name,
        referredEmail: user.email,
        referredStatus: user.status,
        joinedAt: user.createdAt,
        referrerId: referrer.id,
        referrerName: referrer.name,
        referrerEmail: referrer.email,
        referrerCode: referrer.referralCode,
        adSpend: totals.adSpend,
        commission,
      };
    }),
  );

  const activeReferrers = new Set(
    globalReferred.map((user) => user.referredById).filter((id): id is string => Boolean(id)),
  ).size;

  return {
    stats: {
      activeReferrers,
      totalReferred: globalReferred.length,
      totalCommission: Number(totalCommissionAgg._sum.amount ?? 0),
      pendingReferralPayout: Number(pendingPayoutAgg._sum.amount ?? 0),
      filteredCommission: rows.reduce((sum, row) => sum + row.commission, 0),
      filteredAdSpend: rows.reduce((sum, row) => sum + row.adSpend, 0),
    },
    rows,
  };
}

const referralUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

export async function getAdvertiserReferralData(userId: string) {
  await reconcileReferralCreditsForUser(userId);

  const referralCode = await ensureReferralCode(userId);

  const level1Users = await prisma.user.findMany({
    where: { referredById: userId },
    select: {
      ...referralUserSelect,
      referrals: {
        select: {
          ...referralUserSelect,
          referredBy: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const allSpenderIds = [
    ...level1Users.map((user) => user.id),
    ...level1Users.flatMap((user) => user.referrals.map((referral) => referral.id)),
  ];
  const spendTotals = await getPaidLeadTotalsByAdvertiser(allSpenderIds);

  const level1Rows: ReferralUserRow[] = await Promise.all(
    level1Users.map(async (user) => {
      const totals = spendTotals.get(user.id) ?? { adSpend: 0, leadIds: [] };
      const commission = await getReferralCommissionsForLeads(userId, totals.leadIds);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        level: 1 as const,
        adSpend: totals.adSpend,
        commission,
      };
    }),
  );

  const level2Rows: ReferralUserRow[] = await Promise.all(
    level1Users.flatMap((user) =>
      user.referrals.map(async (referral) => {
        const totals = spendTotals.get(referral.id) ?? { adSpend: 0, leadIds: [] };
        const commission = await getReferralCommissionsForLeads(userId, totals.leadIds);

        return {
          id: referral.id,
          name: referral.name,
          email: referral.email,
          role: referral.role,
          status: referral.status,
          createdAt: referral.createdAt,
          level: 2 as const,
          adSpend: totals.adSpend,
          commission,
          referredByName: user.name,
        };
      }),
    ),
  );

  const rows = [...level1Rows, ...level2Rows].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  const level1Commission = level1Rows.reduce((sum, row) => sum + row.commission, 0);
  const level2Commission = level2Rows.reduce((sum, row) => sum + row.commission, 0);
  const balance = await getReferralBalanceSummary(userId);
  const commissionHistory = await listRecentReferralCommissions(userId);

  return {
    referralCode,
    stats: {
      totalReferrals: rows.length,
      level1Count: level1Rows.length,
      level2Count: level2Rows.length,
      level1Commission,
      level2Commission,
      totalCommission: level1Commission + level2Commission,
      ...balance,
    },
    referrals: rows,
    commissionHistory,
  };
}
