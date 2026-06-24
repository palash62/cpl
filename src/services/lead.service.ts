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

export async function listLeads(filters: {
  campaignId?: string;
  publisherId?: string;
  advertiserId?: string;
  status?: LeadStatus;
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;

  const where = {
    ...(filters.campaignId && { campaignId: filters.campaignId }),
    ...(filters.publisherId && { publisherId: filters.publisherId }),
    ...(filters.status && { status: filters.status }),
    ...(filters.advertiserId && {
      campaign: { advertiserId: filters.advertiserId },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        campaign: { select: { name: true, cpl: true } },
        publisher: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function logClick(slug: string, meta: {
  ip: string;
  userAgent?: string;
  referrer?: string;
  geo?: Record<string, string>;
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
      },
    }),
    prisma.trackingLink.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } },
    }),
  ]);

  return link;
}
