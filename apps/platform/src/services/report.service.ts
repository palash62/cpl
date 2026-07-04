import { prisma } from "@/lib/prisma";
import { PENDING_PAYOUT_STATUSES } from "@/lib/payout-status";
import { calculatePublisherPayout } from "@/lib/platform-settings";
import { getPlatformSettingsConfig } from "@/lib/platform-settings-server";
import type { LeadStatus } from "@prisma/client";
import {
  getAdvertiserPeriodRange,
  type AdvertiserPeriod,
} from "@/lib/advertiser-periods";
import {
  calcTrend,
  getPublisherPeriodRange,
  type PublisherPeriod,
} from "@/lib/publisher-periods";
import { startOfDay, subDays, format, endOfMonth, startOfMonth, subMonths, endOfDay } from "date-fns";

export async function getAdminDashboardStats() {
  const [
    totalAdvertisers,
    totalPublishers,
    totalCampaigns,
    totalLeads,
    approvedLeads,
    rejectedLeads,
    revenue,
    recentLeads,
    pendingPayouts,
    openTickets,
    leadsTrend,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "ADVERTISER", status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "PUBLISHER", status: "ACTIVE" } }),
    prisma.campaign.count(),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: { in: ["APPROVED", "PAID"] } } }),
    prisma.lead.count({ where: { status: "REJECTED" } }),
    prisma.platformFee.aggregate({ _sum: { feeAmount: true } }),
    prisma.lead.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        campaign: { select: { name: true } },
        publisher: { select: { name: true } },
      },
    }),
    prisma.payout.count({ where: { status: { in: [...PENDING_PAYOUT_STATUSES] } } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    getLeadsTrend(30),
  ]);

  return {
    totalAdvertisers,
    totalPublishers,
    totalCampaigns,
    totalLeads,
    approvedLeads,
    rejectedLeads,
    revenue: Number(revenue._sum.feeAmount ?? 0),
    recentLeads,
    pendingPayouts,
    openTickets,
    leadsTrend,
  };
}

export async function getAdvertiserDashboardStats(advertiserId: string) {
  const campaigns = await prisma.campaign.findMany({
    where: { advertiserId },
  });

  const campaignIds = campaigns.map((c) => c.id);
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE").length;

  const [totalLeads, approvedLeads, rejectedLeads, pendingLeads] =
    await Promise.all([
      prisma.lead.count({ where: { campaignId: { in: campaignIds } } }),
      prisma.lead.count({
        where: { campaignId: { in: campaignIds }, status: { in: ["APPROVED", "PAID"] } },
      }),
      prisma.lead.count({
        where: { campaignId: { in: campaignIds }, status: "REJECTED" },
      }),
      prisma.lead.findMany({
        where: { campaignId: { in: campaignIds }, status: "PENDING" },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { campaign: { select: { name: true } } },
      }),
    ]);

  const totalSpend = campaigns.reduce((sum, c) => sum + Number(c.spent), 0);
  const avgCpl = approvedLeads > 0 ? totalSpend / approvedLeads : 0;

  return {
    activeCampaigns,
    totalLeads,
    approvedLeads,
    rejectedLeads,
    avgCpl,
    totalSpend,
    pendingLeads,
    leadsTrend: await getLeadsTrend(30, campaignIds),
  };
}

async function getAdvertiserCampaignIds(advertiserId: string) {
  const campaigns = await prisma.campaign.findMany({
    where: { advertiserId },
    select: { id: true },
  });
  return campaigns.map((c) => c.id);
}

export async function getAdvertiserMetricsForRange(
  advertiserId: string,
  from: Date,
  to: Date,
) {
  const campaignIds = await getAdvertiserCampaignIds(advertiserId);
  if (campaignIds.length === 0) {
    return { leads: 0, spent: 0, cpl: 0, clicks: 0 };
  }

  const [leads, approvedLeads, clicks] = await Promise.all([
    prisma.lead.count({
      where: { campaignId: { in: campaignIds }, createdAt: { gte: from, lte: to } },
    }),
    prisma.lead.findMany({
      where: {
        campaignId: { in: campaignIds },
        status: { in: ["APPROVED", "PAID"] },
        createdAt: { gte: from, lte: to },
      },
      include: { campaign: { select: { cpl: true } } },
    }),
    prisma.trackingLink.aggregate({
      where: { campaignId: { in: campaignIds } },
      _sum: { clickCount: true },
    }),
  ]);

  const spent = approvedLeads.reduce((sum, lead) => sum + Number(lead.campaign.cpl), 0);
  const cpl = leads > 0 ? spent / leads : 0;

  return {
    leads,
    spent,
    cpl,
    clicks: clicks._sum.clickCount ?? 0,
  };
}

export async function getAdvertiserDashboardData(
  advertiserId: string,
  period: AdvertiserPeriod = "last30",
) {
  const { from, to, prevFrom, prevTo } = getAdvertiserPeriodRange(period);
  const campaignIds = await getAdvertiserCampaignIds(advertiserId);

  const [
    activeCampaigns,
    current,
    previous,
    pendingLeads,
    wallet,
    summaryRows,
  ] = await Promise.all([
    prisma.campaign.count({
      where: { advertiserId, status: "ACTIVE" },
    }),
    getAdvertiserMetricsForRange(advertiserId, from, to),
    getAdvertiserMetricsForRange(advertiserId, prevFrom, prevTo),
    prisma.lead.findMany({
      where: { campaign: { advertiserId }, status: "PENDING" },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { campaign: { select: { name: true } } },
    }),
    prisma.wallet.findUnique({ where: { userId: advertiserId } }),
    getAdvertiserSummaryRows(advertiserId),
  ]);

  return {
    period,
    activeCampaigns,
    walletBalance: Number(wallet?.balance ?? 0),
    stats: {
      leads: current.leads,
      clicks: current.clicks,
      cpl: current.cpl,
      spent: current.spent,
      leadsTrend: calcTrend(current.leads, previous.leads),
      clicksTrend: calcTrend(current.clicks, previous.clicks),
      cplTrend: calcTrend(current.cpl, previous.cpl),
      spentTrend: calcTrend(current.spent, previous.spent),
    },
    pendingLeads,
    summaryRows,
    leadsTrend: campaignIds.length ? await getLeadsTrend(30, campaignIds) : [],
  };
}

async function getAdvertiserSummaryRows(advertiserId: string) {
  const now = new Date();
  const periods = [
    { label: "Today", from: startOfDay(now), to: endOfDay(now) },
    { label: "Yesterday", from: startOfDay(subDays(now, 1)), to: endOfDay(subDays(now, 1)) },
    { label: "Last 7 Days", from: startOfDay(subDays(now, 6)), to: endOfDay(now) },
    { label: "Last 30 Days", from: startOfDay(subDays(now, 29)), to: endOfDay(now) },
    { label: "This Month", from: startOfMonth(now), to: endOfDay(now) },
    {
      label: "Last Month",
      from: startOfMonth(subMonths(now, 1)),
      to: endOfMonth(subMonths(now, 1)),
    },
  ];

  return Promise.all(
    periods.map(async (p) => {
      const metrics = await getAdvertiserMetricsForRange(advertiserId, p.from, p.to);
      return { label: p.label, ...metrics };
    }),
  );
}

async function getPublisherMetricsForRange(publisherId: string, from: Date, to: Date) {
  const links = await prisma.trackingLink.findMany({
    where: { publisherId },
  });
  const clicks = links.reduce((sum, l) => sum + l.clickCount, 0);

  const [totalLeads, approvedLeads, earningsAgg] = await Promise.all([
    prisma.lead.count({
      where: { publisherId, createdAt: { gte: from, lte: to } },
    }),
    prisma.lead.count({
      where: {
        publisherId,
        status: { in: ["APPROVED", "PAID"] },
        createdAt: { gte: from, lte: to },
      },
    }),
    prisma.ledgerEntry.aggregate({
      where: {
        type: "CREDIT",
        createdAt: { gte: from, lte: to },
        wallet: { userId: publisherId },
      },
      _sum: { amount: true },
    }),
  ]);

  const conversionRate = clicks > 0 ? (totalLeads / clicks) * 100 : 0;
  const earnings = Number(earningsAgg._sum.amount ?? 0);

  return { clicks, totalLeads, approvedLeads, conversionRate, earnings };
}

export async function getPublisherDashboardData(
  publisherId: string,
  period: PublisherPeriod = "last30",
) {
  const { from, to, prevFrom, prevTo } = getPublisherPeriodRange(period);
  const [current, previous, wallet, recentLeads, topCampaignGroups, leadsTrend] =
    await Promise.all([
      getPublisherMetricsForRange(publisherId, from, to),
      getPublisherMetricsForRange(publisherId, prevFrom, prevTo),
      prisma.wallet.findUnique({ where: { userId: publisherId } }),
      prisma.lead.findMany({
        where: { publisherId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { campaign: { select: { name: true, cpl: true } } },
      }),
      prisma.lead.groupBy({
        by: ["campaignId"],
        where: { publisherId, status: { in: ["APPROVED", "PAID"] } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      getPublisherLeadsTrend(30, publisherId),
    ]);

  const campaignIds = topCampaignGroups.map((g) => g.campaignId);
  const campaigns = campaignIds.length
    ? await prisma.campaign.findMany({
        where: { id: { in: campaignIds } },
        select: { id: true, name: true, cpl: true },
      })
    : [];
  const campaignMap = new Map(campaigns.map((c) => [c.id, c]));

  const topCampaigns = topCampaignGroups.map((group) => {
    const campaign = campaignMap.get(group.campaignId);
    const cpl = Number(campaign?.cpl ?? 0);
    return {
      campaignId: group.campaignId,
      name: campaign?.name ?? "Unknown",
      approvedLeads: group._count.id,
      earnings: group._count.id * cpl * 0.9,
    };
  });

  const availableBalance = wallet
    ? Number(wallet.balance) - Number(wallet.holdBalance)
    : 0;

  return {
    period,
    availableBalance,
    walletBalance: Number(wallet?.balance ?? 0),
    stats: {
      clicks: current.clicks,
      totalLeads: current.totalLeads,
      approvedLeads: current.approvedLeads,
      conversionRate: current.conversionRate,
      earnings: current.earnings,
      clicksTrend: calcTrend(current.clicks, previous.clicks),
      leadsTrend: calcTrend(current.totalLeads, previous.totalLeads),
      approvedTrend: calcTrend(current.approvedLeads, previous.approvedLeads),
      conversionTrend: calcTrend(current.conversionRate, previous.conversionRate),
      earningsTrend: calcTrend(current.earnings, previous.earnings),
    },
    recentLeads,
    topCampaigns,
    leadsTrend,
  };
}

export async function getPublisherDashboardStats(publisherId: string) {
  const links = await prisma.trackingLink.findMany({
    where: { publisherId },
  });

  const clicks = links.reduce((sum, l) => sum + l.clickCount, 0);

  const [totalLeads, approvedLeads, wallet] = await Promise.all([
    prisma.lead.count({ where: { publisherId } }),
    prisma.lead.count({
      where: { publisherId, status: { in: ["APPROVED", "PAID"] } },
    }),
    prisma.wallet.findUnique({ where: { userId: publisherId } }),
  ]);

  const conversionRate = clicks > 0 ? (totalLeads / clicks) * 100 : 0;
  const earnings = Number(wallet?.balance ?? 0);

  const recentLeads = await prisma.lead.findMany({
    where: { publisherId },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { campaign: { select: { name: true, cpl: true } } },
  });

  const topCampaigns = await prisma.lead.groupBy({
    by: ["campaignId"],
    where: { publisherId, status: { in: ["APPROVED", "PAID"] } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  return {
    clicks,
    totalLeads,
    approvedLeads,
    conversionRate,
    earnings,
    recentLeads,
    topCampaigns,
  };
}

async function getPublisherLeadsTrend(days: number, publisherId: string) {
  const since = startOfDay(subDays(new Date(), days));
  const leads = await prisma.lead.findMany({
    where: {
      publisherId,
      createdAt: { gte: since },
    },
    select: { createdAt: true },
  });

  const map = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    map.set(format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd"), 0);
  }

  for (const lead of leads) {
    const key = format(lead.createdAt, "yyyy-MM-dd");
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  }

  return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
}

async function getLeadsTrend(days: number, campaignIds?: string[]) {
  const since = startOfDay(subDays(new Date(), days));
  const leads = await prisma.lead.findMany({
    where: {
      createdAt: { gte: since },
      ...(campaignIds && { campaignId: { in: campaignIds } }),
    },
    select: { createdAt: true },
  });

  const map = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    map.set(format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd"), 0);
  }

  for (const lead of leads) {
    const key = format(lead.createdAt, "yyyy-MM-dd");
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  }

  return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
}

export type AdminEntityReportRow = {
  id: string;
  name: string;
  email: string;
  clicks: number;
  leads: number;
  approvedLeads: number;
  rejectedLeads: number;
  pendingLeads: number;
  conversionRate: number;
  approvalRate: number;
  spend: number;
  earnings: number;
};

export type AdminReportsBreakdown = {
  totals: {
    clicks: number;
    leads: number;
    approvedLeads: number;
    rejectedLeads: number;
    pendingLeads: number;
    conversionRate: number;
    approvalRate: number;
    spend: number;
    earnings: number;
  };
  publishers: AdminEntityReportRow[];
  advertisers: AdminEntityReportRow[];
};

function isApprovedLeadStatus(status: LeadStatus) {
  return status === "APPROVED" || status === "PAID";
}

function isRejectedLeadStatus(status: LeadStatus) {
  return status === "REJECTED";
}

function isPendingLeadStatus(status: LeadStatus) {
  return status === "PENDING" || status === "CAPTURED" || status === "VALIDATING";
}

function buildReportRow(
  user: { id: string; name: string; email: string },
  stats: {
    clicks: number;
    leads: number;
    approvedLeads: number;
    rejectedLeads: number;
    pendingLeads: number;
    spend: number;
    earnings: number;
  },
): AdminEntityReportRow {
  const { clicks, leads, approvedLeads, rejectedLeads, pendingLeads, spend, earnings } = stats;
  const conversionRate = clicks > 0 ? Math.round((leads / clicks) * 10000) / 100 : 0;
  const approvalRate = leads > 0 ? Math.round((approvedLeads / leads) * 10000) / 100 : 0;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    clicks,
    leads,
    approvedLeads,
    rejectedLeads,
    pendingLeads,
    spend: Math.round(spend * 100) / 100,
    earnings: Math.round(earnings * 100) / 100,
    conversionRate,
    approvalRate,
  };
}

type LeadBucket = {
  leads: number;
  approvedLeads: number;
  rejectedLeads: number;
  pendingLeads: number;
  spend: number;
  earnings: number;
};

function emptyBucket(): LeadBucket {
  return {
    leads: 0,
    approvedLeads: 0,
    rejectedLeads: 0,
    pendingLeads: 0,
    spend: 0,
    earnings: 0,
  };
}

function applyLeadToBucket(
  bucket: LeadBucket,
  status: LeadStatus,
  spendAmount: number,
  earningsAmount: number,
) {
  bucket.leads += 1;
  if (isRejectedLeadStatus(status)) {
    bucket.rejectedLeads += 1;
  } else if (isApprovedLeadStatus(status)) {
    bucket.approvedLeads += 1;
    if (status === "PAID") {
      bucket.spend += spendAmount;
      bucket.earnings += earningsAmount;
    }
  } else if (isPendingLeadStatus(status)) {
    bucket.pendingLeads += 1;
  }
}

export async function getAdminReportsBreakdown(filters?: {
  search?: string;
  from?: Date;
  to?: Date;
  sort?: "leads" | "clicks" | "conversion" | "spend";
}): Promise<AdminReportsBreakdown> {
  const search = filters?.search?.trim();
  const dateRange =
    filters?.from && filters?.to
      ? { createdAt: { gte: filters.from, lte: filters.to } }
      : undefined;

  const userSearch = search
    ? {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      }
    : undefined;

  const [publishers, advertisers, platformSettings, leads, clicks] = await Promise.all([
    prisma.user.findMany({
      where: { role: "PUBLISHER", ...userSearch },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "ADVERTISER", ...userSearch },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    getPlatformSettingsConfig(),
    prisma.lead.findMany({
      where: dateRange,
      select: {
        id: true,
        publisherId: true,
        status: true,
        country: true,
        campaign: { select: { advertiserId: true, cpl: true } },
      },
    }),
    prisma.click.findMany({
      where: dateRange,
      select: {
        trackingLink: {
          select: { publisherId: true, campaign: { select: { advertiserId: true } } },
        },
      },
    }),
  ]);

  const paidLeadIds = leads.filter((lead) => lead.status === "PAID").map((lead) => lead.id);
  const [publisherCredits, advertiserDebits] =
    paidLeadIds.length > 0
      ? await Promise.all([
          prisma.ledgerEntry.findMany({
            where: { type: "CREDIT", referenceType: "lead", referenceId: { in: paidLeadIds } },
            select: {
              referenceId: true,
              amount: true,
              wallet: { select: { userId: true } },
            },
          }),
          prisma.ledgerEntry.findMany({
            where: { type: "DEBIT", referenceType: "lead", referenceId: { in: paidLeadIds } },
            select: {
              referenceId: true,
              amount: true,
              wallet: { select: { userId: true } },
            },
          }),
        ])
      : [[], []];

  const earningsByLeadId = new Map(
    publisherCredits.map((entry) => [entry.referenceId!, Number(entry.amount)]),
  );
  const earningsByPublisherId = new Map<string, number>();
  for (const entry of publisherCredits) {
    const userId = entry.wallet.userId;
    earningsByPublisherId.set(userId, (earningsByPublisherId.get(userId) ?? 0) + Number(entry.amount));
  }

  const spendByLeadId = new Map(
    advertiserDebits.map((entry) => [entry.referenceId!, Number(entry.amount)]),
  );
  const spendByAdvertiserId = new Map<string, number>();
  for (const entry of advertiserDebits) {
    const userId = entry.wallet.userId;
    spendByAdvertiserId.set(userId, (spendByAdvertiserId.get(userId) ?? 0) + Number(entry.amount));
  }

  function resolveLeadAmounts(lead: (typeof leads)[number]) {
    if (lead.status !== "PAID") {
      return { spend: 0, earnings: 0 };
    }

    const ledgerSpend = spendByLeadId.get(lead.id);
    const ledgerEarnings = earningsByLeadId.get(lead.id);
    if (ledgerSpend !== undefined && ledgerEarnings !== undefined) {
      return { spend: ledgerSpend, earnings: ledgerEarnings };
    }

    const cpl = Number(lead.campaign.cpl);
    const { publisherAmount } = calculatePublisherPayout(cpl, lead.country, platformSettings);
    return { spend: cpl, earnings: publisherAmount };
  }

  const publisherClickMap = new Map<string, number>();
  const advertiserClickMap = new Map<string, number>();
  for (const click of clicks) {
    const { publisherId, campaign } = click.trackingLink;
    publisherClickMap.set(publisherId, (publisherClickMap.get(publisherId) ?? 0) + 1);
    advertiserClickMap.set(
      campaign.advertiserId,
      (advertiserClickMap.get(campaign.advertiserId) ?? 0) + 1,
    );
  }

  const publisherLeadMap = new Map<string, LeadBucket>();
  const advertiserLeadMap = new Map<string, LeadBucket>();

  for (const lead of leads) {
    const amounts = resolveLeadAmounts(lead);

    const publisherBucket = publisherLeadMap.get(lead.publisherId) ?? emptyBucket();
    applyLeadToBucket(publisherBucket, lead.status, amounts.spend, amounts.earnings);
    publisherLeadMap.set(lead.publisherId, publisherBucket);

    const advertiserBucket = advertiserLeadMap.get(lead.campaign.advertiserId) ?? emptyBucket();
    applyLeadToBucket(advertiserBucket, lead.status, amounts.spend, amounts.earnings);
    advertiserLeadMap.set(lead.campaign.advertiserId, advertiserBucket);
  }

  for (const [publisherId, earnings] of earningsByPublisherId) {
    const bucket = publisherLeadMap.get(publisherId) ?? emptyBucket();
    bucket.earnings = earnings;
    publisherLeadMap.set(publisherId, bucket);
  }
  for (const [advertiserId, spend] of spendByAdvertiserId) {
    const bucket = advertiserLeadMap.get(advertiserId) ?? emptyBucket();
    bucket.spend = spend;
    advertiserLeadMap.set(advertiserId, bucket);
  }

  const sortKey = filters?.sort ?? "leads";
  const sortRows = (rows: AdminEntityReportRow[]) => {
    const sorted = [...rows];
    if (sortKey === "clicks") sorted.sort((a, b) => b.clicks - a.clicks || b.leads - a.leads);
    else if (sortKey === "conversion")
      sorted.sort((a, b) => b.conversionRate - a.conversionRate || b.leads - a.leads);
    else if (sortKey === "spend")
      sorted.sort((a, b) => b.spend - a.spend || b.leads - a.leads);
    else sorted.sort((a, b) => b.leads - a.leads || b.clicks - a.clicks);
    return sorted;
  };

  const publisherRows = sortRows(
    publishers.map((publisher) => {
      const bucket = publisherLeadMap.get(publisher.id) ?? emptyBucket();
      return buildReportRow(publisher, {
        clicks: publisherClickMap.get(publisher.id) ?? 0,
        leads: bucket.leads,
        approvedLeads: bucket.approvedLeads,
        rejectedLeads: bucket.rejectedLeads,
        pendingLeads: bucket.pendingLeads,
        spend: bucket.spend,
        earnings: bucket.earnings,
      });
    }),
  );

  const advertiserRows = sortRows(
    advertisers.map((advertiser) => {
      const bucket = advertiserLeadMap.get(advertiser.id) ?? emptyBucket();
      return buildReportRow(advertiser, {
        clicks: advertiserClickMap.get(advertiser.id) ?? 0,
        leads: bucket.leads,
        approvedLeads: bucket.approvedLeads,
        rejectedLeads: bucket.rejectedLeads,
        pendingLeads: bucket.pendingLeads,
        spend: bucket.spend,
        earnings: 0,
      });
    }),
  );

  const totalClicks = publisherRows.reduce((sum, row) => sum + row.clicks, 0);
  const totalLeads = publisherRows.reduce((sum, row) => sum + row.leads, 0);
  const totalApproved = publisherRows.reduce((sum, row) => sum + row.approvedLeads, 0);

  return {
    totals: {
      clicks: totalClicks,
      leads: totalLeads,
      approvedLeads: totalApproved,
      rejectedLeads: publisherRows.reduce((sum, row) => sum + row.rejectedLeads, 0),
      pendingLeads: publisherRows.reduce((sum, row) => sum + row.pendingLeads, 0),
      spend: advertiserRows.reduce((sum, row) => sum + row.spend, 0),
      earnings: publisherRows.reduce((sum, row) => sum + row.earnings, 0),
      conversionRate: totalClicks > 0 ? Math.round((totalLeads / totalClicks) * 10000) / 100 : 0,
      approvalRate: totalLeads > 0 ? Math.round((totalApproved / totalLeads) * 10000) / 100 : 0,
    },
    publishers: publisherRows,
    advertisers: advertiserRows,
  };
}
