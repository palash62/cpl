import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CampaignCategory, CampaignStatus, PublisherAccess } from "@prisma/client";

export interface CreateCampaignInput {
  advertiserId: string;
  name: string;
  description?: string;
  category: CampaignCategory;
  cpl: number;
  budget: number;
  dailyCap?: number;
  monthlyCap?: number;
  publisherAccess?: PublisherAccess;
  autoApprove?: boolean;
  targeting?: Record<string, unknown>;
  fields?: Array<{
    fieldName: string;
    label: string;
    fieldType: string;
    required?: boolean;
    validationRules?: Record<string, unknown>;
    sortOrder?: number;
  }>;
}

export async function createCampaign(input: CreateCampaignInput) {
  return prisma.campaign.create({
    data: {
      advertiserId: input.advertiserId,
      name: input.name,
      description: input.description,
      category: input.category,
      cpl: input.cpl,
      budget: input.budget,
      dailyCap: input.dailyCap,
      monthlyCap: input.monthlyCap,
      publisherAccess: input.publisherAccess ?? "APPROVAL_REQUIRED",
      autoApprove: input.autoApprove ?? false,
      targeting: (input.targeting ?? {}) as Prisma.InputJsonValue,
      fields: input.fields
        ? {
            create: input.fields.map((f, i) => ({
              fieldName: f.fieldName,
              label: f.label,
              fieldType: f.fieldType,
              required: f.required ?? true,
              validationRules: f.validationRules as Prisma.InputJsonValue | undefined,
              sortOrder: f.sortOrder ?? i,
            })),
          }
        : undefined,
    },
    include: { fields: true },
  });
}

export async function listCampaigns(filters: {
  advertiserId?: string;
  status?: CampaignStatus;
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const where = {
    ...(filters.advertiserId && { advertiserId: filters.advertiserId }),
    ...(filters.status && { status: filters.status }),
  };

  const [data, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: { fields: true, advertiser: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaign.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getCampaignById(id: string) {
  return prisma.campaign.findUnique({
    where: { id },
    include: {
      fields: { orderBy: { sortOrder: "asc" } },
      advertiser: { select: { id: true, name: true, email: true } },
      publisherCampaigns: {
        include: { publisher: { select: { id: true, name: true, email: true } } },
      },
    },
  });
}

export async function updateCampaignStatus(id: string, status: CampaignStatus) {
  return prisma.campaign.update({ where: { id }, data: { status } });
}

export async function joinCampaign(publisherId: string, campaignId: string) {
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
  });

  const status =
    campaign.publisherAccess === "OPEN" ? "APPROVED" : "PENDING";

  return prisma.publisherCampaign.upsert({
    where: {
      publisherId_campaignId: { publisherId, campaignId },
    },
    create: {
      publisherId,
      campaignId,
      status,
      approvedAt: status === "APPROVED" ? new Date() : undefined,
    },
    update: {},
  });
}

export async function createTrackingLink(publisherId: string, campaignId: string) {
  const slug = `${publisherId.slice(-6)}-${campaignId.slice(-6)}-${Date.now().toString(36)}`;

  return prisma.trackingLink.create({
    data: { publisherId, campaignId, slug },
  });
}

export async function getMarketplaceCampaigns(publisherId: string) {
  return prisma.campaign.findMany({
    where: { status: "ACTIVE" },
    include: {
      fields: true,
      publisherCampaigns: {
        where: { publisherId },
      },
    },
    orderBy: { cpl: "desc" },
  });
}
