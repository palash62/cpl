import { prisma } from "@/lib/prisma";
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
    prisma.payout.count({ where: { status: "REQUESTED" } }),
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
