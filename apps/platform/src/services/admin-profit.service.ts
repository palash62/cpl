import { prisma } from "@/lib/prisma";
import { REFERRAL_LEVEL_1_RATE, REFERRAL_LEVEL_2_RATE } from "@/lib/referral";

export type AdminProfitSnapshot = {
  advertiserPayment: number;
  publisherPayout: number;
  referralPay: number;
  adminProfit: number;
};

function referralCommissionForAdSpend(
  adSpend: number,
  referredById: string | null | undefined,
  grandparentReferrerId: string | null | undefined,
) {
  let total = 0;
  if (referredById) total += adSpend * REFERRAL_LEVEL_1_RATE;
  if (grandparentReferrerId) total += adSpend * REFERRAL_LEVEL_2_RATE;
  return total;
}

async function getAdvertiserPaymentsForRange(from: Date, to: Date) {
  const rows = await prisma.$queryRaw<{ total: unknown }[]>`
    SELECT COALESCE(SUM(c.cpl), 0) AS total
    FROM leads l
    INNER JOIN campaigns c ON c.id = l.campaign_id
    WHERE l.status = 'PAID'
      AND l.updated_at >= ${from}
      AND l.updated_at <= ${to}
  `;

  return Number(rows[0]?.total ?? 0);
}

async function getPublisherPayoutsForRange(from: Date, to: Date) {
  const result = await prisma.ledgerEntry.aggregate({
    where: {
      type: "CREDIT",
      referenceType: "lead",
      createdAt: { gte: from, lte: to },
      wallet: { user: { role: "PUBLISHER" } },
    },
    _sum: { amount: true },
  });

  return Number(result._sum.amount ?? 0);
}

async function getReferralPayForRange(from: Date, to: Date) {
  const users = await prisma.user.findMany({
    where: {
      campaigns: {
        some: {
          leads: {
            some: { status: "PAID", updatedAt: { gte: from, lte: to } },
          },
        },
      },
    },
    select: {
      referredById: true,
      referredBy: { select: { referredById: true } },
      campaigns: {
        select: {
          leads: {
            where: { status: "PAID", updatedAt: { gte: from, lte: to } },
            select: { campaign: { select: { cpl: true } } },
          },
        },
      },
    },
  });

  return users.reduce((total, user) => {
    const leadSpend = user.campaigns
      .flatMap((campaign) => campaign.leads)
      .reduce((sum, lead) => sum + Number(lead.campaign.cpl), 0);

    return (
      total +
      referralCommissionForAdSpend(leadSpend, user.referredById, user.referredBy?.referredById)
    );
  }, 0);
}

export async function getAdminProfitForRange(from: Date, to: Date): Promise<AdminProfitSnapshot> {
  const [advertiserPayment, publisherPayout, referralPay] = await Promise.all([
    getAdvertiserPaymentsForRange(from, to),
    getPublisherPayoutsForRange(from, to),
    getReferralPayForRange(from, to),
  ]);

  return {
    advertiserPayment,
    publisherPayout,
    referralPay,
    adminProfit: advertiserPayment - publisherPayout - referralPay,
  };
}

export async function getAdminProfitSnapshots(ranges: {
  today: { from: Date; to: Date };
  last7Days: { from: Date; to: Date };
  last30Days: { from: Date; to: Date };
  lifetime: { from: Date; to: Date };
}) {
  const [today, last7Days, last30Days, lifetime] = await Promise.all([
    getAdminProfitForRange(ranges.today.from, ranges.today.to),
    getAdminProfitForRange(ranges.last7Days.from, ranges.last7Days.to),
    getAdminProfitForRange(ranges.last30Days.from, ranges.last30Days.to),
    getAdminProfitForRange(ranges.lifetime.from, ranges.lifetime.to),
  ]);

  return { today, last7Days, last30Days, lifetime };
}
