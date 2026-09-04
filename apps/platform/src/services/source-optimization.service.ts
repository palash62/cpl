import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/errors";
import { getLeadCpl } from "@/lib/lead-cpl";
import { loadCpaMetricsByLeadIds } from "@/lib/cpa-lead-metrics";
import {
  buildSourceToken,
  clampSourceBid,
  formatSourceDisplayId,
  sourceBidLimits,
} from "@cpl/shared";
import { endOfDay, startOfDay } from "date-fns";

export type AdvertiserSourceReportRow = {
  sourceToken: string;
  sourceDisplayId: string;
  campaignId: string | null;
  campaignName: string | null;
  campaignCpl: number | null;
  sourceBid: number | null;
  effectiveCpl: number | null;
  totalLeads: number;
  approvedLeads: number;
  pendingLeads: number;
  rejectedLeads: number;
  paidLeads: number;
  salesCount: number;
  revenue: number;
  estimatedSpend: number;
  approvalRate: number;
  blocked: boolean;
  lastLeadAt: Date | null;
};

export type SourceReportSortField =
  | "leads"
  | "approved"
  | "rejected"
  | "sales"
  | "revenue"
  | "approval"
  | "spend"
  | "bid"
  | "lastLead"
  | "sourceId"
  | "advertiser"
  | "publisher"
  | "originalSource";

export type SourceReportSort = `${SourceReportSortField}_${"asc" | "desc"}`;

const SOURCE_REPORT_SORT_FIELDS = new Set<string>([
  "leads",
  "approved",
  "rejected",
  "sales",
  "revenue",
  "approval",
  "spend",
  "bid",
  "lastLead",
  "sourceId",
  "advertiser",
  "publisher",
  "originalSource",
]);

export const DEFAULT_SOURCE_REPORT_SORT: SourceReportSort = "leads_desc";

export function parseSourceReportSort(value?: string | null): SourceReportSort {
  if (!value) return DEFAULT_SOURCE_REPORT_SORT;
  const match = /^([a-zA-Z]+)_((?:asc|desc))$/.exec(value);
  if (!match) return DEFAULT_SOURCE_REPORT_SORT;
  const [, field, dir] = match;
  if (!SOURCE_REPORT_SORT_FIELDS.has(field)) return DEFAULT_SOURCE_REPORT_SORT;
  return `${field}_${dir}` as SourceReportSort;
}

function compareNullableNumber(a: number | null | undefined, b: number | null | undefined) {
  const av = a ?? Number.NEGATIVE_INFINITY;
  const bv = b ?? Number.NEGATIVE_INFINITY;
  return av - bv;
}

function compareNullableDate(a: Date | null | undefined, b: Date | null | undefined) {
  const av = a?.getTime() ?? 0;
  const bv = b?.getTime() ?? 0;
  return av - bv;
}

function compareString(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

type SortableSourceRow = AdvertiserSourceReportRow & {
  advertiserName?: string;
  publisherName?: string;
  originalSource?: string;
};

export function sortSourceReportRows<T extends SortableSourceRow>(
  rows: T[],
  sort: SourceReportSort = DEFAULT_SOURCE_REPORT_SORT,
): T[] {
  const [field, dir] = sort.split("_") as [SourceReportSortField, "asc" | "desc"];
  const mul = dir === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case "leads":
        cmp = a.totalLeads - b.totalLeads;
        break;
      case "approved":
        cmp =
          a.approvedLeads + a.paidLeads - (b.approvedLeads + b.paidLeads);
        break;
      case "rejected":
        cmp = a.rejectedLeads - b.rejectedLeads;
        break;
      case "sales":
        cmp = a.salesCount - b.salesCount;
        break;
      case "revenue":
        cmp = a.revenue - b.revenue;
        break;
      case "approval":
        cmp = a.approvalRate - b.approvalRate;
        break;
      case "spend":
        cmp = a.estimatedSpend - b.estimatedSpend;
        break;
      case "bid":
        cmp = compareNullableNumber(a.effectiveCpl, b.effectiveCpl);
        break;
      case "lastLead":
        cmp = compareNullableDate(a.lastLeadAt, b.lastLeadAt);
        break;
      case "sourceId":
        cmp = compareString(a.sourceDisplayId, b.sourceDisplayId);
        break;
      case "advertiser":
        cmp = compareString(a.advertiserName ?? "", b.advertiserName ?? "");
        break;
      case "publisher":
        cmp = compareString(a.publisherName ?? "", b.publisherName ?? "");
        break;
      case "originalSource":
        cmp = compareString(a.originalSource ?? "", b.originalSource ?? "");
        break;
      default:
        cmp = a.totalLeads - b.totalLeads;
    }
    if (cmp !== 0) return cmp * mul;
    return compareString(a.sourceDisplayId, b.sourceDisplayId);
  });
}

function buildDateRange(dateFrom?: Date, dateTo?: Date) {
  const createdAt: { gte?: Date; lte?: Date } = {};
  if (dateFrom) createdAt.gte = startOfDay(dateFrom);
  if (dateTo) createdAt.lte = endOfDay(dateTo);
  return createdAt;
}

export async function listAdvertiserSourceReport(filters: {
  advertiserId: string;
  campaignId?: string;
  sourceSearch?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sort?: SourceReportSort | string | null;
}): Promise<AdvertiserSourceReportRow[]> {
  const createdAt = buildDateRange(filters.dateFrom, filters.dateTo);

  const [leads, blocks, bids] = await Promise.all([
    prisma.lead.findMany({
      where: {
        campaign: {
          advertiserId: filters.advertiserId,
          ...(filters.campaignId?.trim() && { id: filters.campaignId.trim() }),
        },
        isTest: false,
        ...(Object.keys(createdAt).length > 0 && { createdAt }),
      },
      select: {
        id: true,
        publisherId: true,
        source: true,
        status: true,
        createdAt: true,
        cpl: true,
        campaignId: true,
        campaign: { select: { id: true, name: true, cpl: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.advertiserSourceBlock.findMany({
      where: { advertiserId: filters.advertiserId },
      select: { sourceToken: true },
    }),
    prisma.campaignSourceBid.findMany({
      where: {
        advertiserId: filters.advertiserId,
        ...(filters.campaignId?.trim() && { campaignId: filters.campaignId.trim() }),
      },
      select: { campaignId: true, sourceToken: true, cpl: true },
    }),
  ]);

  const blockedTokens = new Set(blocks.map((b) => b.sourceToken));
  const bidByKey = new Map(
    bids.map((b) => [`${b.campaignId}:${b.sourceToken}`, Number(b.cpl)] as const),
  );

  const cpaMetricsByLeadId = await loadCpaMetricsByLeadIds(leads.map((l) => l.id));

  type Agg = AdvertiserSourceReportRow;
  const grouped = new Map<string, Agg>();

  for (const lead of leads) {
    const sourceToken = buildSourceToken(
      filters.advertiserId,
      lead.publisherId,
      lead.source,
    );
    const displayId = formatSourceDisplayId(sourceToken);
    if (
      filters.sourceSearch?.trim() &&
      !displayId.toLowerCase().includes(filters.sourceSearch.trim().toLowerCase()) &&
      !sourceToken.toLowerCase().includes(filters.sourceSearch.trim().toLowerCase())
    ) {
      continue;
    }

    const groupKey = filters.campaignId?.trim()
      ? `${lead.campaignId}:${sourceToken}`
      : sourceToken;

    const campaignCpl = Number(lead.campaign.cpl);
    const sourceBid = bidByKey.get(`${lead.campaignId}:${sourceToken}`) ?? null;
    const existing = grouped.get(groupKey) ?? {
      sourceToken,
      sourceDisplayId: displayId,
      campaignId: filters.campaignId?.trim() ? lead.campaignId : null,
      campaignName: filters.campaignId?.trim() ? lead.campaign.name : null,
      campaignCpl: filters.campaignId?.trim() ? campaignCpl : null,
      sourceBid: filters.campaignId?.trim() ? sourceBid : null,
      effectiveCpl: filters.campaignId?.trim() ? (sourceBid ?? campaignCpl) : null,
      totalLeads: 0,
      approvedLeads: 0,
      pendingLeads: 0,
      rejectedLeads: 0,
      paidLeads: 0,
      salesCount: 0,
      revenue: 0,
      estimatedSpend: 0,
      approvalRate: 0,
      blocked: blockedTokens.has(sourceToken),
      lastLeadAt: null,
    };

    const cpl = getLeadCpl(lead);
    existing.totalLeads += 1;
    const leadCpa = cpaMetricsByLeadId.get(lead.id);
    if (leadCpa) {
      existing.salesCount += leadCpa.salesCount;
      existing.revenue += leadCpa.revenue;
    }

    if (lead.status === "APPROVED") {
      existing.approvedLeads += 1;
      existing.estimatedSpend += cpl;
    } else if (lead.status === "PAID") {
      existing.paidLeads += 1;
      existing.estimatedSpend += cpl;
    } else if (lead.status === "REJECTED") {
      existing.rejectedLeads += 1;
    } else {
      existing.pendingLeads += 1;
    }

    if (!existing.lastLeadAt || lead.createdAt > existing.lastLeadAt) {
      existing.lastLeadAt = lead.createdAt;
    }

    grouped.set(groupKey, existing);
  }

  if (filters.campaignId?.trim()) {
    const campaignId = filters.campaignId.trim();
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, advertiserId: filters.advertiserId },
      select: { id: true, name: true, cpl: true },
    });
    if (campaign) {
      for (const bid of bids.filter((b) => b.campaignId === campaignId)) {
        const key = `${campaignId}:${bid.sourceToken}`;
        if (grouped.has(key)) continue;
        if (
          filters.sourceSearch?.trim() &&
          !formatSourceDisplayId(bid.sourceToken)
            .toLowerCase()
            .includes(filters.sourceSearch.trim().toLowerCase())
        ) {
          continue;
        }
        const campaignCpl = Number(campaign.cpl);
        grouped.set(key, {
          sourceToken: bid.sourceToken,
          sourceDisplayId: formatSourceDisplayId(bid.sourceToken),
          campaignId: campaign.id,
          campaignName: campaign.name,
          campaignCpl,
          sourceBid: Number(bid.cpl),
          effectiveCpl: Number(bid.cpl),
          totalLeads: 0,
          approvedLeads: 0,
          pendingLeads: 0,
          rejectedLeads: 0,
          paidLeads: 0,
          salesCount: 0,
          revenue: 0,
          estimatedSpend: 0,
          approvalRate: 0,
          blocked: blockedTokens.has(bid.sourceToken),
          lastLeadAt: null,
        });
      }
    }
  }

  return sortSourceReportRows(
    Array.from(grouped.values()).map((row) => {
      const decided = row.approvedLeads + row.paidLeads + row.rejectedLeads;
      return {
        ...row,
        approvalRate:
          decided > 0 ? (row.approvedLeads + row.paidLeads) / decided : 0,
      };
    }),
    parseSourceReportSort(filters.sort),
  );
}

export type AdminSourceReportRow = AdvertiserSourceReportRow & {
  advertiserId: string;
  advertiserName: string;
  publisherId: string;
  publisherName: string;
  originalSource: string;
};

export async function listAdminSourceReport(filters: {
  advertiserId?: string;
  campaignId?: string;
  sourceSearch?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sort?: SourceReportSort | string | null;
}): Promise<AdminSourceReportRow[]> {
  const createdAt = buildDateRange(filters.dateFrom, filters.dateTo);
  const advertiserId = filters.advertiserId?.trim() || undefined;
  const campaignId = filters.campaignId?.trim() || undefined;

  const leads = await prisma.lead.findMany({
    where: {
      campaign: {
        ...(advertiserId && { advertiserId }),
        ...(campaignId && { id: campaignId }),
      },
      isTest: false,
      ...(Object.keys(createdAt).length > 0 && { createdAt }),
    },
    select: {
      id: true,
      publisherId: true,
      source: true,
      status: true,
      createdAt: true,
      cpl: true,
      campaignId: true,
      campaign: {
        select: {
          id: true,
          name: true,
          cpl: true,
          advertiserId: true,
          advertiser: { select: { id: true, name: true } },
        },
      },
      publisher: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const advertiserIds = [
    ...new Set(leads.map((l) => l.campaign.advertiserId)),
  ];
  const campaignIds = campaignId
    ? [campaignId]
    : [...new Set(leads.map((l) => l.campaignId))];

  const [blockedByAdvertiser, bidsByCampaign, cpaMetricsByLeadId] =
    await Promise.all([
      getBlockedSourceTokensByAdvertiser(advertiserIds),
      getSourceBidsByCampaignIds(campaignIds),
      loadCpaMetricsByLeadIds(leads.map((l) => l.id)),
    ]);

  const search = filters.sourceSearch?.trim().toLowerCase() ?? "";
  const grouped = new Map<string, AdminSourceReportRow>();

  for (const lead of leads) {
    const advId = lead.campaign.advertiserId;
    const sourceToken = buildSourceToken(advId, lead.publisherId, lead.source);
    const displayId = formatSourceDisplayId(sourceToken);
    const originalSource = lead.source?.trim() || "—";

    if (
      search &&
      !displayId.toLowerCase().includes(search) &&
      !sourceToken.toLowerCase().includes(search) &&
      !originalSource.toLowerCase().includes(search)
    ) {
      continue;
    }

    const groupKey = campaignId
      ? `${advId}:${lead.campaignId}:${sourceToken}`
      : `${advId}:${sourceToken}`;

    const campaignCpl = Number(lead.campaign.cpl);
    const sourceBid =
      bidsByCampaign.get(lead.campaignId)?.get(sourceToken) ?? null;
    const blocked = blockedByAdvertiser.get(advId)?.has(sourceToken) ?? false;

    const existing = grouped.get(groupKey) ?? {
      sourceToken,
      sourceDisplayId: displayId,
      advertiserId: advId,
      advertiserName: lead.campaign.advertiser.name,
      publisherId: lead.publisherId,
      publisherName: lead.publisher.name,
      originalSource,
      campaignId: campaignId ? lead.campaignId : null,
      campaignName: campaignId ? lead.campaign.name : null,
      campaignCpl: campaignId ? campaignCpl : null,
      sourceBid: campaignId ? sourceBid : null,
      effectiveCpl: campaignId ? (sourceBid ?? campaignCpl) : null,
      totalLeads: 0,
      approvedLeads: 0,
      pendingLeads: 0,
      rejectedLeads: 0,
      paidLeads: 0,
      salesCount: 0,
      revenue: 0,
      estimatedSpend: 0,
      approvalRate: 0,
      blocked,
      lastLeadAt: null as Date | null,
    };

    if (existing.originalSource === "—" && originalSource !== "—") {
      existing.originalSource = originalSource;
    }

    const cpl = getLeadCpl(lead);
    existing.totalLeads += 1;
    const leadCpa = cpaMetricsByLeadId.get(lead.id);
    if (leadCpa) {
      existing.salesCount += leadCpa.salesCount;
      existing.revenue += leadCpa.revenue;
    }

    if (lead.status === "APPROVED") {
      existing.approvedLeads += 1;
      existing.estimatedSpend += cpl;
    } else if (lead.status === "PAID") {
      existing.paidLeads += 1;
      existing.estimatedSpend += cpl;
    } else if (lead.status === "REJECTED") {
      existing.rejectedLeads += 1;
    } else {
      existing.pendingLeads += 1;
    }

    if (!existing.lastLeadAt || lead.createdAt > existing.lastLeadAt) {
      existing.lastLeadAt = lead.createdAt;
    }

    grouped.set(groupKey, existing);
  }

  return sortSourceReportRows(
    Array.from(grouped.values()).map((row) => {
      const decided = row.approvedLeads + row.paidLeads + row.rejectedLeads;
      return {
        ...row,
        approvalRate:
          decided > 0 ? (row.approvedLeads + row.paidLeads) / decided : 0,
      };
    }),
    parseSourceReportSort(filters.sort),
  );
}

export async function listBlockedSources(advertiserId: string) {
  const blocks = await prisma.advertiserSourceBlock.findMany({
    where: { advertiserId },
    orderBy: { createdAt: "desc" },
  });
  return blocks.map((b) => ({
    ...b,
    sourceDisplayId: formatSourceDisplayId(b.sourceToken),
  }));
}

export async function blockSource(
  advertiserId: string,
  sourceToken: string,
  reason?: string,
) {
  if (!/^[a-f0-9]{64}$/i.test(sourceToken)) {
    throw Errors.validation("Invalid source ID", "sourceToken");
  }

  return prisma.advertiserSourceBlock.upsert({
    where: {
      advertiserId_sourceToken: { advertiserId, sourceToken: sourceToken.toLowerCase() },
    },
    create: {
      advertiserId,
      sourceToken: sourceToken.toLowerCase(),
      reason,
    },
    update: { reason },
  });
}

export async function unblockSource(advertiserId: string, sourceToken: string) {
  return prisma.advertiserSourceBlock.deleteMany({
    where: { advertiserId, sourceToken: sourceToken.toLowerCase() },
  });
}

export async function setSourceBid(input: {
  advertiserId: string;
  campaignId: string;
  sourceToken: string;
  cpl: number;
}) {
  if (!/^[a-f0-9]{64}$/i.test(input.sourceToken)) {
    throw Errors.validation("Invalid source ID", "sourceToken");
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id: input.campaignId, advertiserId: input.advertiserId },
    select: { id: true, cpl: true },
  });
  if (!campaign) throw Errors.notFound("Campaign");

  const campaignCpl = Number(campaign.cpl);
  const limits = sourceBidLimits(campaignCpl);
  if (input.cpl < limits.min || input.cpl > limits.max) {
    throw Errors.validation(
      `Source bid must be between $${limits.min.toFixed(2)} and $${limits.max.toFixed(2)} (50%–200% of campaign CPL $${campaignCpl.toFixed(2)})`,
      "cpl",
    );
  }

  const clamped = clampSourceBid(campaignCpl, input.cpl);
  const token = input.sourceToken.toLowerCase();
  return prisma.campaignSourceBid.upsert({
    where: {
      campaignId_sourceToken: { campaignId: campaign.id, sourceToken: token },
    },
    create: {
      campaignId: campaign.id,
      advertiserId: input.advertiserId,
      sourceToken: token,
      cpl: clamped,
    },
    update: { cpl: clamped },
  });
}

export async function clearSourceBid(input: {
  advertiserId: string;
  campaignId: string;
  sourceToken: string;
}) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: input.campaignId, advertiserId: input.advertiserId },
    select: { id: true },
  });
  if (!campaign) throw Errors.notFound("Campaign");

  return prisma.campaignSourceBid.deleteMany({
    where: {
      campaignId: campaign.id,
      sourceToken: input.sourceToken.toLowerCase(),
    },
  });
}

export async function isSourceBlocked(
  advertiserId: string,
  publisherId: string,
  source: string | null | undefined,
): Promise<boolean> {
  const sourceToken = buildSourceToken(advertiserId, publisherId, source).toLowerCase();
  const block = await prisma.advertiserSourceBlock.findUnique({
    where: {
      advertiserId_sourceToken: { advertiserId, sourceToken },
    },
    select: { id: true },
  });
  return Boolean(block);
}

export async function resolveSourceCpl(input: {
  advertiserId: string;
  campaignId: string;
  publisherId: string;
  source: string | null | undefined;
  campaignCpl: number | string | { toString(): string };
}): Promise<number> {
  const sourceToken = buildSourceToken(
    input.advertiserId,
    input.publisherId,
    input.source,
  );
  const bid = await prisma.campaignSourceBid.findUnique({
    where: {
      campaignId_sourceToken: {
        campaignId: input.campaignId,
        sourceToken,
      },
    },
    select: { cpl: true },
  });
  if (bid) return Number(bid.cpl);
  return Number(input.campaignCpl);
}

export async function getBlockedSourceTokensByAdvertiser(
  advertiserIds: string[],
): Promise<Map<string, Set<string>>> {
  if (advertiserIds.length === 0) return new Map();
  const blocks = await prisma.advertiserSourceBlock.findMany({
    where: { advertiserId: { in: advertiserIds } },
    select: { advertiserId: true, sourceToken: true },
  });
  const map = new Map<string, Set<string>>();
  for (const block of blocks) {
    const set = map.get(block.advertiserId) ?? new Set();
    set.add(block.sourceToken);
    map.set(block.advertiserId, set);
  }
  return map;
}

export async function getSourceBidsByCampaignIds(
  campaignIds: string[],
): Promise<Map<string, Map<string, number>>> {
  if (campaignIds.length === 0) return new Map();
  const bids = await prisma.campaignSourceBid.findMany({
    where: { campaignId: { in: campaignIds } },
    select: { campaignId: true, sourceToken: true, cpl: true },
  });
  const map = new Map<string, Map<string, number>>();
  for (const bid of bids) {
    const inner = map.get(bid.campaignId) ?? new Map();
    inner.set(bid.sourceToken, Number(bid.cpl));
    map.set(bid.campaignId, inner);
  }
  return map;
}
