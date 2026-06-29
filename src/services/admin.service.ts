import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import type { CampaignStatus, UserRole, UserStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  parsePlatformSettings,
  platformSettingsToUpdates,
  settingsConfigToApi,
} from "@/lib/platform-settings";

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
        publisherProfile: {
          select: {
            kycStatus: true,
            website: true,
            trafficSource: true,
            country: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            postalCode: true,
            rejectionReason: true,
            rejectedAt: true,
          },
        },
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

function generateTempPassword() {
  return crypto
    .randomBytes(10)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 12);
}

export async function createPublisherAccount(data: {
  name: string;
  email: string;
  website?: string;
  trafficSource?: string;
  country?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  status?: UserStatus;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });

  if (existing) {
    throw new AppError("AUTH_EMAIL_EXISTS", "Email already registered", 422);
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  const status = data.status ?? "ACTIVE";

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: "PUBLISHER",
      status,
      wallet: { create: {} },
      publisherProfile: {
        create: {
          website: data.website || undefined,
          trafficSource: data.trafficSource || undefined,
          country: data.country || undefined,
          addressLine1: data.addressLine1 || undefined,
          addressLine2: data.addressLine2 || undefined,
          city: data.city || undefined,
          state: data.state || undefined,
          postalCode: data.postalCode || undefined,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      publisherProfile: { select: { website: true, trafficSource: true } },
    },
  });

  return { user, tempPassword };
}

export async function approvePublisher(userId: string, adminId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: "ACTIVE" },
  });

  await prisma.publisherProfile.updateMany({
    where: { userId },
    data: { rejectionReason: null, rejectedAt: null },
  });

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: "publisher.approved",
      entityType: "user",
      entityId: userId,
      metadata: { status: "ACTIVE" },
    },
  });

  return user;
}

export async function rejectPublisher(
  userId: string,
  adminId: string,
  reason: string,
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: "SUSPENDED" },
  });

  await prisma.publisherProfile.updateMany({
    where: { userId },
    data: { rejectionReason: reason, rejectedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: "publisher.rejected",
      entityType: "user",
      entityId: userId,
      metadata: { status: "SUSPENDED", reason },
    },
  });

  return user;
}

export async function approveCampaign(campaignId: string, adminId: string) {
  const campaign = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: "ACTIVE",
      rejectionReason: null,
      rejectedAt: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: "campaign.approved",
      entityType: "campaign",
      entityId: campaignId,
      metadata: { status: "ACTIVE" },
    },
  });

  return campaign;
}

export async function rejectCampaign(
  campaignId: string,
  adminId: string,
  reason: string,
) {
  const campaign = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: "ARCHIVED",
      rejectionReason: reason,
      rejectedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: "campaign.rejected",
      entityType: "campaign",
      entityId: campaignId,
      metadata: { status: "ARCHIVED", reason },
    },
  });

  return campaign;
}

export async function getPlatformSettingsRecord() {
  const settings = await prisma.platformSetting.findMany();
  const map: Record<string, unknown> = {};
  for (const s of settings) map[s.key] = s.value;
  return parsePlatformSettings(map);
}

export async function updatePlatformSettings(
  data: {
    publisherPayoutPercent?: number;
    minPayoutAmount?: number;
    tier1PayoutMin?: number;
    tier1PayoutMax?: number;
    tier2PayoutMin?: number;
    tier2PayoutMax?: number;
    tier3PayoutMin?: number;
    tier3PayoutMax?: number;
    globalLinkUrl?: string | null;
  },
  adminId: string,
) {
  const updates = platformSettingsToUpdates(data);

  for (const u of updates) {
    await prisma.platformSetting.upsert({
      where: { key: u.key },
      create: { key: u.key, value: u.value as never },
      update: { value: u.value as never },
    });
  }

  if (updates.length > 0) {
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: "settings.updated",
        entityType: "platform_settings",
        entityId: "global",
        metadata: data,
      },
    });
  }

  return getPlatformSettingsRecord();
}

export async function getPlatformSettingsResponse() {
  const config = await getPlatformSettingsRecord();
  return settingsConfigToApi(config);
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
        advertiser: { select: { name: true, email: true } },
        fields: { orderBy: { sortOrder: "asc" } },
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
