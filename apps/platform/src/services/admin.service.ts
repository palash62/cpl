import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import type { CampaignStatus, UserRole, UserStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  serializePublisherSpecialTierPayouts,
} from "@/lib/publisher-special-payout";
import {
  parsePlatformSettings,
  platformSettingsToUpdates,
  settingsConfigToApi,
} from "@/lib/platform-settings";
import {
  notifyAccountActivated,
  notifyAccountSuspended,
  notifyAdminAlert,
  notifyApproved,
  notifyPublisherCredentials,
  notifyRejected,
  notifyUserById,
} from "@/services/notify.service";

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
            qualityScore: true,
            spamScore: true,
            fraudFlags: true,
            useSpecialTierPayouts: true,
            tier1SpecialPayout: true,
            tier2SpecialPayout: true,
            tier3SpecialPayout: true,
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

  const serialized = data.map((user) => ({
    ...user,
    wallet: user.wallet ? { balance: Number(user.wallet.balance) } : null,
    publisherProfile: user.publisherProfile
      ? {
          ...user.publisherProfile,
          ...serializePublisherSpecialTierPayouts(user.publisherProfile),
        }
      : user.publisherProfile,
  }));

  return { data: serialized, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getAdvertiserDetail(id: string) {
  const user = await prisma.user.findUnique({
    where: { id, role: "ADVERTISER" },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      createdAt: true,
      advertiserProfile: {
        select: {
          company: true,
          industry: true,
          billingInfo: true,
        },
      },
      wallet: {
        select: {
          id: true,
          balance: true,
          holdBalance: true,
          currency: true,
        },
      },
      campaigns: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          name: true,
          status: true,
          cpl: true,
          spent: true,
          createdAt: true,
          _count: { select: { leads: true } },
        },
      },
      deposits: {
        orderBy: { createdAt: "desc" },
        take: 15,
        select: {
          id: true,
          amount: true,
          method: true,
          status: true,
          createdAt: true,
          paymentDetails: true,
        },
      },
      _count: { select: { campaigns: true } },
    },
  });

  if (!user) return null;

  return {
    ...user,
    wallet: user.wallet
      ? {
          ...user.wallet,
          balance: Number(user.wallet.balance),
          holdBalance: Number(user.wallet.holdBalance),
        }
      : null,
    campaigns: user.campaigns.map((campaign) => ({
      ...campaign,
      cpl: Number(campaign.cpl),
      spent: Number(campaign.spent),
    })),
    deposits: user.deposits.map((deposit) => ({
      ...deposit,
      amount: Number(deposit.amount),
    })),
  };
}

export async function getPublisherDetail(id: string) {
  const user = await prisma.user.findUnique({
    where: { id, role: "PUBLISHER" },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      createdAt: true,
      publisherProfile: true,
      wallet: {
        select: {
          id: true,
          balance: true,
          holdBalance: true,
          currency: true,
        },
      },
      _count: { select: { leads: true } },
    },
  });

  if (!user) return null;

  const profile = user.publisherProfile;

  return {
    ...user,
    wallet: user.wallet
      ? {
          ...user.wallet,
          balance: Number(user.wallet.balance),
          holdBalance: Number(user.wallet.holdBalance),
        }
      : null,
    publisherProfile: profile
      ? {
          ...profile,
          ...serializePublisherSpecialTierPayouts(profile),
        }
      : null,
  };
}

export async function updatePublisherSpecialPayout(
  userId: string,
  input: {
    useSpecialTierPayouts: boolean;
    tier1SpecialPayout?: number | null;
    tier2SpecialPayout?: number | null;
    tier3SpecialPayout?: number | null;
  },
  adminId: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId, role: "PUBLISHER" },
    select: { id: true, publisherProfile: { select: { id: true } } },
  });

  if (!user?.publisherProfile) {
    throw new AppError("NOT_FOUND", "Publisher profile not found", 404);
  }

  const data = input.useSpecialTierPayouts
    ? {
        useSpecialTierPayouts: true,
        tier1SpecialPayout: input.tier1SpecialPayout,
        tier2SpecialPayout: input.tier2SpecialPayout,
        tier3SpecialPayout: input.tier3SpecialPayout,
      }
    : {
        useSpecialTierPayouts: false,
        tier1SpecialPayout: null,
        tier2SpecialPayout: null,
        tier3SpecialPayout: null,
      };

  const profile = await prisma.publisherProfile.update({
    where: { id: user.publisherProfile.id },
    data,
  });

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: "publisher.special_payout_updated",
      entityType: "publisher",
      entityId: userId,
      metadata: {
        useSpecialTierPayouts: input.useSpecialTierPayouts,
      },
    },
  });

  return profile;
}

export async function updateUserStatus(userId: string, status: UserStatus, adminId: string) {
  const previous = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, status: true, role: true },
  });

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

  if (previous && previous.status !== status) {
    void (async () => {
      if (status === "ACTIVE") {
        await notifyAccountActivated(previous);
      } else if (status === "SUSPENDED") {
        await notifyAccountSuspended(previous);
      }
    })();
  }

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

  void notifyPublisherCredentials({
    id: user.id,
    email: user.email,
    name: user.name,
    tempPassword,
  });

  return { user, tempPassword };
}

export async function approvePublisher(userId: string, adminId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: "ACTIVE" },
    select: { id: true, email: true, name: true },
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

  void notifyApproved(user, "Publisher account", undefined, "publisher.approved");

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
    select: { id: true, email: true, name: true },
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

  void notifyRejected(user, "Publisher account", reason, undefined, "publisher.rejected");

  return user;
}

export async function approveCampaign(campaignId: string, adminId: string) {
  const existing = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { status: true },
  });

  if (!existing) {
    throw new AppError("CAMPAIGN_NOT_FOUND", "Campaign not found", 404);
  }

  if (existing.status !== "PENDING") {
    throw new AppError(
      "CAMPAIGN_INVALID_STATUS",
      "Only pending campaigns can be approved",
      422,
    );
  }

  const campaign = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: "ACTIVE",
      rejectionReason: null,
      rejectedAt: null,
    },
    include: { advertiser: { select: { id: true, email: true, name: true } } },
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

  void notifyApproved(
    campaign.advertiser,
    `Campaign "${campaign.name}"`,
    "Your campaign is now active and can receive traffic.",
    "campaign.approved",
  );

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
    include: { advertiser: { select: { id: true, email: true, name: true } } },
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

  void notifyRejected(
    campaign.advertiser,
    `Campaign "${campaign.name}"`,
    reason,
    undefined,
    "campaign.rejected",
  );

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
    minPayoutWise?: number;
    minPayoutBankTransfer?: number;
    minPayoutStripeConnect?: number;
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const walletPath =
    user?.role === "PUBLISHER" ? "/publisher/earnings" : "/advertiser/wallet";

  void notifyUserById(userId, {
    title: "Wallet adjustment",
    message: `An admin ${type === "CREDIT" ? "credited" : "debited"} $${amount.toFixed(2)} to your wallet. Reason: ${reason}`,
    actionPath: walletPath,
    notificationType: "wallet.adjusted",
  });
}

export async function sendAdminBulkEmail(input: {
  userIds: string[];
  subject: string;
  message: string;
  actorId: string;
}) {
  const uniqueIds = Array.from(new Set(input.userIds));
  const users = await prisma.user.findMany({
    where: {
      id: { in: uniqueIds },
      role: { in: ["ADVERTISER", "PUBLISHER"] },
      status: "ACTIVE",
    },
    select: { id: true, email: true, name: true, role: true },
  });

  if (users.length === 0) {
    throw new AppError("VALIDATION_ERROR", "No active recipients found for the selected users", 422);
  }

  const { getResolvedEmailConfig } = await import("@/services/smtp-settings.service");
  const { sendEmail, getSupportEmail } = await import("@/services/email.service");
  const { renderGenericEmail } = await import("@/lib/email/templates");

  const config = await getResolvedEmailConfig();
  const supportEmail = await getSupportEmail();
  const htmlMessage = input.message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("<br/>");

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const user of users) {
    const rendered = renderGenericEmail({
      appUrl: config.appUrl,
      recipientName: user.name,
      title: input.subject,
      message: htmlMessage || input.message,
    });

    const result = await sendEmail({
      to: user.email,
      subject: input.subject,
      html: rendered.html,
      text: rendered.text,
      template: "generic",
      replyTo: supportEmail ?? undefined,
      metadata: {
        kind: "admin_bulk_email",
        userId: user.id,
        role: user.role,
      },
    });

    if (result.skipped) skipped += 1;
    else if (result.sent) sent += 1;
    else failed += 1;
  }

  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: "email.bulk_sent",
      entityType: "email",
      entityId: input.actorId,
      metadata: {
        subject: input.subject,
        recipientCount: users.length,
        sent,
        failed,
        skipped,
        userIds: users.map((user) => user.id),
      },
    },
  });

  return {
    recipientCount: users.length,
    sent,
    failed,
    skipped,
    notFound: uniqueIds.length - users.length,
  };
}
