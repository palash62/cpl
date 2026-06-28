import { prisma } from "@/lib/prisma";
import { validateLead } from "@/lib/lead-validation";
import { Errors } from "@/lib/errors";
import { processLeadPayment } from "@/services/wallet.service";
import { getPlatformSettings } from "@/services/wallet.service";
import type { LeadStatus } from "@prisma/client";
import { subDays } from "date-fns";

export async function submitLead(input: {
  slug: string;
  data: Record<string, string>;
  honeypot?: string;
  ip?: string;
  source?: string;
  subId?: string;
}) {
  if (input.honeypot) {
    throw Errors.duplicateLead();
  }

  const trackingLink = await prisma.trackingLink.findUnique({
    where: { slug: input.slug },
    include: {
      campaign: { include: { fields: true } },
    },
  });

  if (!trackingLink || trackingLink.campaign.status !== "ACTIVE") {
    throw Errors.notFound("Campaign");
  }

  const settings = await getPlatformSettings();
  const since = subDays(new Date(), settings.duplicateWindowDays);

  const existingLeads = await prisma.lead.findMany({
    where: {
      campaignId: trackingLink.campaignId,
      createdAt: { gte: since },
      status: { notIn: ["REJECTED"] },
    },
    select: { data: true },
  });

  const existingEmails = existingLeads
    .map((l) => (l.data as Record<string, string>).email?.toLowerCase())
    .filter(Boolean) as string[];

  const existingPhones = existingLeads
    .map((l) =>
      (l.data as Record<string, string>).phone?.replace(/\D/g, ""),
    )
    .filter(Boolean) as string[];

  const validation = validateLead({
    data: input.data,
    campaignFields: trackingLink.campaign.fields,
    existingEmails,
    existingPhones,
    honeypot: input.honeypot,
  });

  const lead = await prisma.lead.create({
    data: {
      campaignId: trackingLink.campaignId,
      publisherId: trackingLink.publisherId,
      trackingLinkId: trackingLink.id,
      status: "VALIDATING",
      data: input.data,
      score: validation.score,
      ip: input.ip,
      source: input.source,
      subId: input.subId,
      validationResults: {
        create: validation.results.map((r) => ({
          rule: r.rule,
          passed: r.passed,
          details: r.details,
        })),
      },
      statusHistory: {
        create: { toStatus: "VALIDATING" },
      },
    },
  });

  let nextStatus: LeadStatus;

  if (!validation.passed) {
    nextStatus = "REJECTED";
  } else if (trackingLink.campaign.autoApprove && validation.score >= 80) {
    nextStatus = "APPROVED";
  } else {
    nextStatus = "PENDING";
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      status: nextStatus,
      statusHistory: {
        create: { fromStatus: "VALIDATING", toStatus: nextStatus },
      },
    },
  });

  if (nextStatus === "APPROVED") {
    try {
      await processLeadPayment(lead.id);
    } catch {
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          status: "PENDING",
          statusHistory: {
            create: {
              fromStatus: "APPROVED",
              toStatus: "PENDING",
              reason: "Insufficient advertiser funds",
            },
          },
        },
      });
    }
  }

  return prisma.lead.findUniqueOrThrow({
    where: { id: lead.id },
    include: { validationResults: true },
  });
}

export async function updateLeadStatus(
  leadId: string,
  status: "APPROVED" | "REJECTED",
  actorId: string,
  reason?: string,
) {
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });

  if (!["PENDING", "APPROVED"].includes(lead.status) && status === "APPROVED") {
    throw Errors.notFound("Lead");
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status,
      statusHistory: {
        create: {
          fromStatus: lead.status,
          toStatus: status,
          actorId,
          reason,
        },
      },
    },
  });

  if (status === "APPROVED") {
    await processLeadPayment(leadId);
  }

  return prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
}

export type AdvertiserLeadSort =
  | "created_desc"
  | "created_asc"
  | "campaign_asc"
  | "campaign_desc"
  | "campaignId_asc"
  | "campaignId_desc"
  | "logData_asc"
  | "logData_desc"
  | "status_asc"
  | "status_desc"
  | "message_asc"
  | "message_desc";

export async function listLeads(filters: {
  campaignId?: string;
  campaignSearch?: string;
  publisherId?: string;
  advertiserId?: string;
  status?: LeadStatus;
  source?: string;
  sort?: AdvertiserLeadSort;
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const sort = filters.sort ?? "created_desc";

  const campaignWhere =
    filters.advertiserId || filters.campaignSearch?.trim()
      ? {
          ...(filters.advertiserId && { advertiserId: filters.advertiserId }),
          ...(filters.campaignSearch?.trim() && {
            OR: [
              { id: { contains: filters.campaignSearch.trim() } },
              { name: { contains: filters.campaignSearch.trim() } },
            ],
          }),
        }
      : undefined;

  const where = {
    ...(filters.campaignId && { campaignId: filters.campaignId }),
    ...(filters.publisherId && { publisherId: filters.publisherId }),
    ...(filters.status && { status: filters.status }),
    ...(filters.source?.trim() && { source: filters.source.trim() }),
    ...(campaignWhere && { campaign: campaignWhere }),
  };

  const orderBy =
    sort === "created_asc"
      ? { createdAt: "asc" as const }
      : sort === "campaign_asc"
        ? { campaign: { name: "asc" as const } }
        : sort === "campaign_desc"
          ? { campaign: { name: "desc" as const } }
          : sort === "campaignId_asc"
            ? { campaignId: "asc" as const }
            : sort === "campaignId_desc"
              ? { campaignId: "desc" as const }
              : sort === "logData_asc"
                ? { id: "asc" as const }
                : sort === "logData_desc"
                  ? { id: "desc" as const }
                  : sort === "status_asc"
                    ? { status: "asc" as const }
                    : sort === "status_desc"
                      ? { status: "desc" as const }
                      : sort === "message_asc"
                        ? { updatedAt: "asc" as const }
                        : sort === "message_desc"
                          ? { updatedAt: "desc" as const }
                          : { createdAt: "desc" as const };

  const [data, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        campaign: { select: { id: true, name: true, cpl: true } },
        publisher: { select: { name: true, email: true } },
        validationResults: { orderBy: { rule: "asc" } },
        statusHistory: { orderBy: { createdAt: "desc" }, take: 3 },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function logClick(slug: string, meta: {
  ip: string;
  userAgent?: string;
  referrer?: string;
  geo?: Record<string, string>;
  source?: string;
  subId?: string;
}) {
  const link = await prisma.trackingLink.findUnique({ where: { slug } });
  if (!link) return null;

  await prisma.$transaction([
    prisma.click.create({
      data: {
        trackingLinkId: link.id,
        ip: meta.ip,
        userAgent: meta.userAgent,
        referrer: meta.referrer,
        geo: meta.geo,
        source: meta.source,
        subId: meta.subId,
      },
    }),
    prisma.trackingLink.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } },
    }),
  ]);

  return link;
}
