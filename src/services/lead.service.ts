import { prisma } from "@/lib/prisma";
import { validateLead } from "@/lib/lead-validation";
import { Errors } from "@/lib/errors";
import { processLeadPayment } from "@/services/wallet.service";
import { getPlatformSettings } from "@/services/wallet.service";
import { notifyGeneric, notifyRejected } from "@/services/notify.service";
import {
  evaluateLead,
  getFraudConfig,
  recordDeviceSeen,
  refreshPublisherQuality,
  checkCampaignQualityAlert,
} from "@/modules/fraud";
import type { SubmissionMeta } from "@/modules/fraud";
import { dispatchAutoresponderEvent } from "@/modules/autoresponder";
import { dispatchLeadEmailAutomations } from "@/modules/email-marketing";
import type { LeadStatus } from "@prisma/client";
import type { Campaign, CampaignField } from "@prisma/client";

async function notifyForLeadOutcome(leadId: string, status: LeadStatus, reason?: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      campaign: {
        include: { advertiser: { select: { id: true, email: true, name: true } } },
      },
      publisher: { select: { id: true, email: true, name: true } },
    },
  });
  if (!lead) return;

  const campaignName = lead.campaign.name;
  const isOptin = lead.source === "optin";

  if (status === "PENDING") {
    void notifyGeneric(lead.campaign.advertiser, {
      title: "New lead awaiting review",
      message: `A new lead was submitted for campaign "${campaignName}".`,
      actionPath: "/advertiser/lead-details",
      notificationType: "lead.pending",
    });
    return;
  }

  if (status === "REJECTED" && !isOptin) {
    void notifyRejected(
      lead.publisher,
      "Lead",
      reason || "Lead did not pass validation.",
      undefined,
      "lead.rejected",
    );
    return;
  }

  if ((status === "APPROVED" || status === "PAID") && !isOptin) {
    void notifyGeneric(lead.publisher, {
      title: status === "PAID" ? "Lead paid" : "Lead approved",
      message: `A lead for campaign "${campaignName}" was approved and earnings were credited.`,
      actionPath: "/publisher/earnings",
      notificationType: "lead.approved",
    });
  }
}

async function notifyInsufficientLeadFunds(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      campaign: { include: { advertiser: { select: { id: true, email: true, name: true } } } },
    },
  });
  if (!lead) return;

  void notifyGeneric(lead.campaign.advertiser, {
    title: "Insufficient wallet balance",
    message: `A lead for "${lead.campaign.name}" could not be paid because your wallet balance is too low.`,
    actionPath: "/advertiser/wallet",
    notificationType: "lead.payment_failed",
  });
}

async function finalizeLeadStatus(leadId: string, nextStatus: LeadStatus, rejectionReason?: string) {
  if (nextStatus === "REJECTED") {
    void notifyForLeadOutcome(leadId, "REJECTED", rejectionReason);
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { publisherId: true, campaignId: true, campaign: { select: { name: true } } },
    });
    if (lead) {
      void refreshPublisherQuality(lead.publisherId);
      void checkCampaignQualityAlert(lead.campaignId, lead.campaign.name);
    }
    return;
  }

  if (nextStatus === "PENDING") {
    void notifyForLeadOutcome(leadId, "PENDING");
    return;
  }

  if (nextStatus === "APPROVED") {
    try {
      await processLeadPayment(leadId);
      void notifyForLeadOutcome(leadId, "PAID");
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        select: { publisherId: true, campaignId: true, campaign: { select: { name: true } } },
      });
      if (lead) {
        void refreshPublisherQuality(lead.publisherId);
        void checkCampaignQualityAlert(lead.campaignId, lead.campaign.name);
      }
      void dispatchAutoresponderEvent({ leadId, event: "LEAD_APPROVED" });
      void dispatchLeadEmailAutomations({ leadId, event: "LEAD_APPROVED" });
    } catch {
      await prisma.lead.update({
        where: { id: leadId },
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
      void notifyForLeadOutcome(leadId, "PENDING");
      void notifyInsufficientLeadFunds(leadId);
    }
  }
}

function extractCountry(data: Record<string, string>) {
  const countryKeys = ["country", "country_code", "countryCode", "nationality"] as const;
  return countryKeys.map((key) => data[key]?.trim()).find(Boolean) ?? undefined;
}

async function resolveNextStatus(params: {
  qualityPassed: boolean;
  qualityScore: number;
  autoApprove: boolean;
  fraudDecision: string;
  hardReject: boolean;
  rejectReason?: string;
  useRiskDecision: boolean;
}): Promise<{ status: LeadStatus; reason?: string }> {
  if (!params.qualityPassed || params.hardReject) {
    return { status: "REJECTED", reason: params.rejectReason ?? "Validation failed" };
  }

  if (params.useRiskDecision) {
    if (params.fraudDecision === "auto_reject") {
      return { status: "REJECTED", reason: params.rejectReason ?? "Fraud risk too high" };
    }
    if (params.fraudDecision === "auto_approve" && params.autoApprove) {
      return { status: "APPROVED" };
    }
    return { status: "PENDING" };
  }

  if (params.autoApprove && params.qualityScore >= 80) {
    return { status: "APPROVED" };
  }
  return { status: "PENDING" };
}

async function createAndProcessLead(input: {
  campaignId: string;
  publisherId: string;
  trackingLinkId?: string;
  campaign: Campaign & { fields: CampaignField[] };
  data: Record<string, string>;
  honeypot?: string;
  ip?: string;
  userAgent?: string;
  source?: string;
  subId?: string;
  deviceFingerprint?: string;
  submissionMeta?: SubmissionMeta;
}) {
  const settings = await getPlatformSettings();
  const country = extractCountry(input.data);
  const targeting =
    typeof input.campaign.targeting === "object" && input.campaign.targeting
      ? (input.campaign.targeting as Record<string, unknown>)
      : {};

  const validation = validateLead({
    data: input.data,
    campaignFields: input.campaign.fields,
    existingEmails: [],
    existingPhones: [],
    honeypot: input.honeypot,
  });

  const fraud = await evaluateLead({
    campaignId: input.campaignId,
    publisherId: input.publisherId,
    trackingLinkId: input.trackingLinkId,
    data: input.data,
    ip: input.ip,
    userAgent: input.userAgent,
    country,
    deviceFingerprint: input.deviceFingerprint,
    submissionMeta: input.submissionMeta,
    honeypot: input.honeypot,
    targeting,
    duplicateWindowDays: settings.duplicateWindowDays,
  });

  const fraudConfig = await getFraudConfig();
  const allResults = [
    ...validation.results.map((r) => ({
      rule: r.rule,
      passed: r.passed,
      riskDelta: null as number | null,
      details: r.details,
    })),
    ...fraud.outcomes.map((o) => ({
      rule: o.rule,
      passed: o.passed,
      riskDelta: o.riskDelta,
      details: o.details,
    })),
  ];

  const lead = await prisma.lead.create({
    data: {
      campaignId: input.campaignId,
      publisherId: input.publisherId,
      trackingLinkId: input.trackingLinkId,
      status: "VALIDATING",
      data: input.data,
      score: validation.score,
      riskScore: fraud.riskScore,
      fraudDecision: fraud.fraudDecision,
      deviceFingerprint: input.deviceFingerprint,
      geoCountry: fraud.geoCountry,
      submissionMeta: input.submissionMeta ?? undefined,
      ip: input.ip,
      userAgent: input.userAgent,
      country,
      source: input.source,
      subId: input.subId,
      validationResults: {
        create: allResults.map((r) => ({
          rule: r.rule,
          passed: r.passed,
          riskDelta: r.riskDelta ?? undefined,
          details: r.details,
        })),
      },
      statusHistory: {
        create: { toStatus: "VALIDATING" },
      },
    },
  });

  if (input.deviceFingerprint) {
    await recordDeviceSeen(input.deviceFingerprint, input.campaignId, lead.id);
  }

  const { status: nextStatus, reason } = await resolveNextStatus({
    qualityPassed: validation.passed,
    qualityScore: validation.score,
    autoApprove: input.campaign.autoApprove,
    fraudDecision: fraud.fraudDecision,
    hardReject: fraud.hardReject,
    rejectReason: fraud.rejectReason,
    useRiskDecision: fraudConfig.useRiskDecision,
  });

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      status: nextStatus,
      statusHistory: {
        create: { fromStatus: "VALIDATING", toStatus: nextStatus, reason },
      },
    },
  });

  await finalizeLeadStatus(lead.id, nextStatus, reason);

  if (nextStatus !== "REJECTED") {
    void dispatchAutoresponderEvent({ leadId: lead.id, event: "LEAD_CAPTURED" });
    void dispatchLeadEmailAutomations({ leadId: lead.id, event: "LEAD_CAPTURED" });
  }

  return prisma.lead.findUniqueOrThrow({
    where: { id: lead.id },
    include: { validationResults: true },
  });
}

export async function submitLead(input: {
  slug: string;
  data: Record<string, string>;
  honeypot?: string;
  ip?: string;
  userAgent?: string;
  source?: string;
  subId?: string;
  deviceFingerprint?: string;
  submissionMeta?: SubmissionMeta;
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

  return createAndProcessLead({
    campaignId: trackingLink.campaignId,
    publisherId: trackingLink.publisherId,
    trackingLinkId: trackingLink.id,
    campaign: trackingLink.campaign,
    data: input.data,
    honeypot: input.honeypot,
    ip: input.ip,
    userAgent: input.userAgent,
    source: input.source,
    subId: input.subId,
    deviceFingerprint: input.deviceFingerprint,
    submissionMeta: input.submissionMeta,
  });
}

export async function submitOptinLead(input: {
  optinSlug: string;
  data: Record<string, string>;
  honeypot?: string;
  ip?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  submissionMeta?: SubmissionMeta;
}) {
  if (input.honeypot) {
    throw Errors.duplicateLead();
  }

  const optinPage = await prisma.advertiserOptinPage.findUnique({
    where: { slug: input.optinSlug },
    include: {
      campaign: { include: { fields: true } },
    },
  });

  if (
    !optinPage?.isPublished ||
    !optinPage.campaign ||
    optinPage.campaign.status !== "ACTIVE"
  ) {
    throw Errors.notFound("Optin page");
  }

  return createAndProcessLead({
    campaignId: optinPage.campaign.id,
    publisherId: optinPage.advertiserId,
    campaign: optinPage.campaign,
    data: input.data,
    honeypot: input.honeypot,
    ip: input.ip,
    userAgent: input.userAgent,
    source: "optin",
    deviceFingerprint: input.deviceFingerprint,
    submissionMeta: input.submissionMeta,
  });
}

export async function submitLandingLead(input: {
  landingPageSlug: string;
  data: Record<string, string>;
  honeypot?: string;
  ip?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  submissionMeta?: SubmissionMeta;
}) {
  if (input.honeypot) {
    throw Errors.duplicateLead();
  }

  const page = await prisma.landingPage.findUnique({
    where: { slug: input.landingPageSlug },
    include: {
      publishedVersion: true,
      campaign: { include: { fields: true } },
    },
  });

  if (
    !page?.publishedVersion ||
    page.status !== "PUBLISHED" ||
    !page.campaign ||
    page.campaign.status !== "ACTIVE"
  ) {
    throw Errors.notFound("Landing page");
  }

  const formJson = page.publishedVersion.formJson as {
    fields: Array<{
      name: string;
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      pattern?: string;
      type: string;
    }>;
  } | null;

  if (formJson?.fields) {
    for (const field of formJson.fields) {
      const value = input.data[field.name]?.trim() ?? "";
      if (field.required && !value) {
        throw Errors.validation(`${field.name} is required`, field.name);
      }
      if (field.minLength && value.length < field.minLength) {
        throw Errors.validation(`${field.name} is too short`, field.name);
      }
      if (field.maxLength && value.length > field.maxLength) {
        throw Errors.validation(`${field.name} is too long`, field.name);
      }
      if (field.pattern && value && !new RegExp(field.pattern).test(value)) {
        throw Errors.validation(`${field.name} is invalid`, field.name);
      }
      if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw Errors.validation("Invalid email address", field.name);
      }
    }
  }

  return createAndProcessLead({
    campaignId: page.campaign.id,
    publisherId: page.advertiserId,
    campaign: page.campaign,
    data: input.data,
    honeypot: input.honeypot,
    ip: input.ip,
    userAgent: input.userAgent,
    source: "landing_page",
    deviceFingerprint: input.deviceFingerprint,
    submissionMeta: input.submissionMeta,
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
    await finalizeLeadStatus(leadId, "APPROVED");
  } else {
    void notifyForLeadOutcome(leadId, "REJECTED", reason);
    void refreshPublisherQuality(lead.publisherId);
    const campaign = await prisma.campaign.findUnique({
      where: { id: lead.campaignId },
      select: { name: true },
    });
    if (campaign) void checkCampaignQualityAlert(lead.campaignId, campaign.name);
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
  publisherSearch?: string;
  advertiserId?: string;
  status?: LeadStatus;
  source?: string;
  minRiskScore?: number;
  sort?: AdvertiserLeadSort;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const sort = filters.sort ?? "created_desc";

  const createdAt: { gte?: Date; lte?: Date } = {};
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    from.setHours(0, 0, 0, 0);
    createdAt.gte = from;
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    createdAt.lte = to;
  }

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
    ...(filters.publisherSearch?.trim() && {
      publisherId: { contains: filters.publisherSearch.trim() },
    }),
    ...(filters.status && { status: filters.status }),
    ...(filters.source?.trim() && { source: filters.source.trim() }),
    ...(filters.minRiskScore !== undefined && { riskScore: { gte: filters.minRiskScore } }),
    ...(Object.keys(createdAt).length > 0 && { createdAt }),
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

export type AdvertiserPublisherLeadReportRow = {
  publisherId: string;
  totalLeads: number;
  approvedLeads: number;
  pendingLeads: number;
  rejectedLeads: number;
  paidLeads: number;
  estimatedSpend: number;
  payoutMin: number | null;
  payoutMax: number | null;
  lastLeadAt: Date | null;
};

export async function listAdvertiserPublisherLeadReport(filters: {
  advertiserId: string;
  publisherSearch?: string;
  campaignSearch?: string;
  dateFrom?: Date;
  dateTo?: Date;
  payoutMin?: number;
  payoutMax?: number;
}) {
  const campaignWhere: {
    advertiserId: string;
    id?: { contains: string };
    cpl?: { gte?: number; lte?: number };
  } = {
    advertiserId: filters.advertiserId,
    ...(filters.campaignSearch?.trim() && {
      id: { contains: filters.campaignSearch.trim() },
    }),
  };

  if (filters.payoutMin !== undefined || filters.payoutMax !== undefined) {
    campaignWhere.cpl = {
      ...(filters.payoutMin !== undefined && { gte: filters.payoutMin }),
      ...(filters.payoutMax !== undefined && { lte: filters.payoutMax }),
    };
  }

  const createdAt: { gte?: Date; lte?: Date } = {};
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    from.setHours(0, 0, 0, 0);
    createdAt.gte = from;
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    createdAt.lte = to;
  }

  const leads = await prisma.lead.findMany({
    where: {
      campaign: campaignWhere,
      ...(filters.publisherSearch?.trim() && {
        publisherId: { contains: filters.publisherSearch.trim() },
      }),
      ...(Object.keys(createdAt).length > 0 && { createdAt }),
    },
    select: {
      publisherId: true,
      status: true,
      createdAt: true,
      campaign: { select: { cpl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const grouped = new Map<string, AdvertiserPublisherLeadReportRow>();

  for (const lead of leads) {
    const existing = grouped.get(lead.publisherId) ?? {
      publisherId: lead.publisherId,
      totalLeads: 0,
      approvedLeads: 0,
      pendingLeads: 0,
      rejectedLeads: 0,
      paidLeads: 0,
      estimatedSpend: 0,
      payoutMin: null,
      payoutMax: null,
      lastLeadAt: null,
    };

    const cpl = Number(lead.campaign.cpl);
    existing.payoutMin = existing.payoutMin === null ? cpl : Math.min(existing.payoutMin, cpl);
    existing.payoutMax = existing.payoutMax === null ? cpl : Math.max(existing.payoutMax, cpl);

    existing.totalLeads += 1;
    if (lead.status === "APPROVED") {
      existing.approvedLeads += 1;
      existing.estimatedSpend += Number(lead.campaign.cpl);
    } else if (lead.status === "PAID") {
      existing.paidLeads += 1;
      existing.estimatedSpend += Number(lead.campaign.cpl);
    } else if (lead.status === "REJECTED") {
      existing.rejectedLeads += 1;
    } else {
      existing.pendingLeads += 1;
    }

    if (!existing.lastLeadAt || lead.createdAt > existing.lastLeadAt) {
      existing.lastLeadAt = lead.createdAt;
    }

    grouped.set(lead.publisherId, existing);
  }

  return Array.from(grouped.values()).sort((a, b) => b.totalLeads - a.totalLeads);
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
