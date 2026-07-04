import { prisma } from "@/lib/prisma";
import {
  generateReferralCode,
  REFERRAL_LEVEL_1_RATE,
  REFERRAL_LEVEL_2_RATE,
} from "@/lib/referral";

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

  // Session can occasionally reference a stale/deleted user row.
  // Avoid crashing dashboard rendering on missing records.
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

function sumAdSpend(
  campaigns: Array<{ spent: unknown }>,
  deposits: Array<{ amount: unknown; status: string }>,
) {
  const campaignSpend = campaigns.reduce((sum, campaign) => sum + Number(campaign.spent), 0);
  const depositSpend = deposits
    .filter((deposit) => deposit.status === "COMPLETED")
    .reduce((sum, deposit) => sum + Number(deposit.amount), 0);

  return campaignSpend + depositSpend;
}

function mapReferralRow(
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: Date;
    campaigns: Array<{ spent: unknown }>;
    deposits: Array<{ amount: unknown; status: string }>;
    referredBy?: { name: string } | null;
  },
  level: 1 | 2,
): ReferralUserRow {
  const adSpend = sumAdSpend(user.campaigns, user.deposits);
  const rate = level === 1 ? REFERRAL_LEVEL_1_RATE : REFERRAL_LEVEL_2_RATE;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    level,
    adSpend,
    commission: adSpend * rate,
    referredByName: user.referredBy?.name,
  };
}

const referralUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  campaigns: { select: { spent: true } },
  deposits: { select: { amount: true, status: true } },
} as const;

export async function getAdvertiserReferralData(userId: string) {
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

  const level1Rows = level1Users.map((user) => mapReferralRow(user, 1));
  const level2Rows = level1Users.flatMap((user) =>
    user.referrals.map((referral) =>
      mapReferralRow({ ...referral, referredBy: { name: user.name } }, 2),
    ),
  );

  const rows = [...level1Rows, ...level2Rows].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  const level1Commission = level1Rows.reduce((sum, row) => sum + row.commission, 0);
  const level2Commission = level2Rows.reduce((sum, row) => sum + row.commission, 0);

  return {
    referralCode,
    stats: {
      totalReferrals: rows.length,
      level1Count: level1Rows.length,
      level2Count: level2Rows.length,
      level1Commission,
      level2Commission,
      totalCommission: level1Commission + level2Commission,
    },
    referrals: rows,
  };
}
