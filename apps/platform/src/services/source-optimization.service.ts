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

  return Array.from(grouped.values())
    .map((row) => {
      const decided = row.approvedLeads + row.paidLeads + row.rejectedLeads;
      return {
        ...row,
        approvalRate:
          decided > 0 ? (row.approvedLeads + row.paidLeads) / decided : 0,
      };
    })
    .sort((a, b) => b.totalLeads - a.totalLeads);
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
  const sourceToken = buildSourceToken(advertiserId, publisherId, source);
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
