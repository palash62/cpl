import { prisma } from "@/lib/prisma";
import type { CampaignStatus, UserRole, UserStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export async function listUsers(filters: {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;

  const where: Prisma.UserWhereInput = {
    ...(filters.role && { role: filters.role }),
    ...(filters.status && { status: filters.status }),
  };

  if (filters.search?.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { name: { contains: term } },
      { email: { contains: term } },
      ...(filters.role === "ADVERTISER"
        ? [{ advertiserProfile: { company: { contains: term } } }]
        : []),
    ];
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      from.setHours(0, 0, 0, 0);
      where.createdAt.gte = from;
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      where.createdAt.lte = to;
    }
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        advertiserProfile: { select: { company: true } },
        publisherProfile: { select: { kycStatus: true } },
        wallet: { select: { balance: true } },
        _count: { select: { campaigns: true, leads: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function updateUserStatus(userId: string, status: UserStatus, adminId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status },
  });

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: "user.status_changed",
      entityType: "user",
      entityId: userId,
      metadata: { status },
    },
  });

  return user;
}

export async function getPlatformSettingsRecord() {
  const settings = await prisma.platformSetting.findMany();
  const map: Record<string, unknown> = {};
  for (const s of settings) map[s.key] = s.value;
  return {
    platformFeePercent: Number(map.platform_fee_percent ?? 10),
    minPayoutAmount: Number(map.min_payout_amount ?? 50),
    holdPeriodDays: Number(map.hold_period_days ?? 0),
    duplicateWindowDays: Number(map.duplicate_window_days ?? 30),
  };
}

export async function updatePlatformSettings(
  data: {
    platformFeePercent?: number;
    minPayoutAmount?: number;
    holdPeriodDays?: number;
    duplicateWindowDays?: number;
  },
  adminId: string,
) {
  const updates: Array<{ key: string; value: unknown }> = [];
  if (data.platformFeePercent !== undefined) {
    updates.push({ key: "platform_fee_percent", value: data.platformFeePercent });
  }
  if (data.minPayoutAmount !== undefined) {
    updates.push({ key: "min_payout_amount", value: data.minPayoutAmount });
  }
  if (data.holdPeriodDays !== undefined) {
    updates.push({ key: "hold_period_days", value: data.holdPeriodDays });
  }
  if (data.duplicateWindowDays !== undefined) {
    updates.push({ key: "duplicate_window_days", value: data.duplicateWindowDays });
  }

  for (const u of updates) {
    await prisma.platformSetting.upsert({
      where: { key: u.key },
      create: { key: u.key, value: u.value as never },
      update: { value: u.value as never },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: "settings.updated",
      entityType: "platform_settings",
      entityId: "global",
      metadata: data,
    },
  });

  return getPlatformSettingsRecord();
}

export type CampaignSort = "cpl_asc" | "cpl_desc" | "created_desc";

export async function listCampaigns(filters: {
  search?: string;
  status?: CampaignStatus | "STOP";
  cplMin?: number;
  cplMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
  sort?: CampaignSort;
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;

  const where: Prisma.CampaignWhereInput = {};

  if (filters.status === "STOP") {
    where.status = { in: ["COMPLETED", "ARCHIVED"] };
  } else if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search?.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { name: { contains: term } },
      { advertiser: { name: { contains: term } } },
      { advertiser: { email: { contains: term } } },
    ];
  }

  if (filters.cplMin !== undefined || filters.cplMax !== undefined) {
    where.cpl = {};
    if (filters.cplMin !== undefined) where.cpl.gte = filters.cplMin;
    if (filters.cplMax !== undefined) where.cpl.lte = filters.cplMax;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      from.setHours(0, 0, 0, 0);
      where.createdAt.gte = from;
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      where.createdAt.lte = to;
    }
  }

  const orderBy: Prisma.CampaignOrderByWithRelationInput =
    filters.sort === "cpl_asc"
      ? { cpl: "asc" }
      : filters.sort === "cpl_desc"
        ? { cpl: "desc" }
        : { createdAt: "desc" };

  const [data, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: {
        advertiser: { select: { name: true } },
        _count: { select: { leads: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaign.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function listAuditLogs(filters: { page?: number; limit?: number }) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count(),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function adjustWallet(
  userId: string,
  amount: number,
  type: "CREDIT" | "DEBIT",
  reason: string,
  adminId: string,
) {
  const { creditWallet, debitWallet } = await import("@/services/wallet.service");

  await prisma.$transaction(async (tx) => {
    if (type === "CREDIT") {
      await creditWallet(tx, userId, amount, "adjustment", adminId, reason);
    } else {
      await debitWallet(tx, userId, amount, "adjustment", adminId, reason);
    }

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "wallet.adjusted",
        entityType: "wallet",
        entityId: userId,
        metadata: { amount, type, reason },
      },
    });
  });
}
