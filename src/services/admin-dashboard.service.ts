import { prisma } from "@/lib/prisma";
import { PENDING_PAYOUT_STATUSES } from "@/lib/payout-status";
import { getAdminProfitSnapshots } from "@/services/admin-profit.service";
import {
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";

function leadDisplayName(data: unknown) {
  if (!data || typeof data !== "object") return "Lead";
  const record = data as Record<string, string>;
  const name = [record.first_name, record.last_name].filter(Boolean).join(" ").trim();
  return name || record.email || record.phone || "Lead";
}

async function getRevenueForRange(from: Date, to: Date) {
  const result = await prisma.platformFee.aggregate({
    where: {
      lead: {
        createdAt: { gte: from, lte: to },
        status: { in: ["APPROVED", "PAID"] },
      },
    },
    _sum: { feeAmount: true },
  });
  return Number(result._sum.feeAmount ?? 0);
}

async function getRevenueTrend(days: number) {
  const since = startOfDay(subDays(new Date(), days - 1));
  const fees = await prisma.platformFee.findMany({
    where: { lead: { createdAt: { gte: since }, status: { in: ["APPROVED", "PAID"] } } },
    select: { feeAmount: true, lead: { select: { createdAt: true } } },
  });

  const map = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    map.set(format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd"), 0);
  }

  for (const fee of fees) {
    const key = format(fee.lead.createdAt, "yyyy-MM-dd");
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + Number(fee.feeAmount));
    }
  }

  return Array.from(map.entries()).map(([date, amount]) => ({
    date,
    amount: Math.round(amount * 100) / 100,
  }));
}

async function getLeadsTrend(days: number) {
  const since = startOfDay(subDays(new Date(), days - 1));
  const leads = await prisma.lead.findMany({
    where: { createdAt: { gte: since } },
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

export async function getAdminControlCenterData(adminUserId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const sevenDaysStart = startOfDay(subDays(now, 6));
  const thirtyDaysStart = startOfDay(subDays(now, 29));
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const [
    totalAdvertisers,
    totalPublishers,
    activeCampaigns,
    totalCampaigns,
    todaysLeads,
    todaysApprovedLeads,
    todaysRejectedLeads,
    pendingLeads,
    totalLeads,
    approvedLeads,
    rejectedLeads,
    revenueToday,
    revenueMonth,
    revenue7d,
    revenue30d,
    revenueLastMonth,
    revenueLifetime,
    pendingPayoutsCount,
    pendingPayoutsAmount,
    completedPayoutsMonth,
    openTickets,
    urgentTickets,
    recentClosedTickets,
    draftCampaigns,
    pendingAdvertisers,
    pendingPublisherKyc,
    duplicateLeadFlags,
    lowScoreLeads,
    suspendedUsers,
    walletAggregate,
    recentLeads,
    recentAuditLogs,
    recentNotifications,
    topCampaignsRaw,
    leadsTrend,
    revenueTrend,
    dbHealthy,
    adminProfitSnapshots,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "ADVERTISER", status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "PUBLISHER", status: "ACTIVE" } }),
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    prisma.campaign.count(),
    prisma.lead.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.lead.count({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
        status: { in: ["APPROVED", "PAID"] },
      },
    }),
    prisma.lead.count({
      where: { createdAt: { gte: todayStart, lte: todayEnd }, status: "REJECTED" },
    }),
    prisma.lead.count({
      where: { status: { in: ["PENDING", "VALIDATING", "CAPTURED"] } },
    }),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: { in: ["APPROVED", "PAID"] } } }),
    prisma.lead.count({ where: { status: "REJECTED" } }),
    getRevenueForRange(todayStart, todayEnd),
    getRevenueForRange(monthStart, todayEnd),
    getRevenueForRange(sevenDaysStart, todayEnd),
    getRevenueForRange(thirtyDaysStart, todayEnd),
    getRevenueForRange(lastMonthStart, lastMonthEnd),
    getRevenueForRange(new Date(0), todayEnd),
    prisma.payout.count({ where: { status: { in: [...PENDING_PAYOUT_STATUSES] } } }),
    prisma.payout.aggregate({
      where: { status: { in: [...PENDING_PAYOUT_STATUSES] } },
      _sum: { amount: true },
    }),
    prisma.payout.count({
      where: { status: "COMPLETED", processedAt: { gte: monthStart } },
    }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.supportTicket.count({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS"] },
        priority: { in: ["HIGH", "URGENT"] },
      },
    }),
    prisma.supportTicket.findMany({
      where: { status: { in: ["RESOLVED", "CLOSED"] } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, subject: true, status: true, updatedAt: true },
    }),
    prisma.campaign.count({ where: { status: "DRAFT" } }),
    prisma.user.count({ where: { role: "ADVERTISER", status: "PENDING" } }),
    prisma.publisherProfile.count({ where: { kycStatus: "PENDING" } }),
    prisma.leadValidationResult.count({
      where: { rule: { in: ["duplicate_email", "duplicate_phone"] }, passed: false },
    }),
    prisma.lead.count({ where: { score: { lt: 50 }, status: { not: "REJECTED" } } }),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    prisma.wallet.aggregate({ _sum: { balance: true, holdBalance: true } }),
    prisma.lead.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        campaign: {
          select: {
            name: true,
            advertiser: { select: { name: true } },
          },
        },
        publisher: { select: { name: true } },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { actor: { select: { name: true } } },
    }),
    prisma.notification.findMany({
      where: { userId: adminUserId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.campaign.findMany({
      orderBy: { spent: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        spent: true,
        cpl: true,
        advertiser: { select: { name: true } },
        _count: { select: { leads: true } },
      },
    }),
    getLeadsTrend(30),
    getRevenueTrend(30),
    prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    getAdminProfitSnapshots({
      today: { from: todayStart, to: todayEnd },
      last7Days: { from: sevenDaysStart, to: todayEnd },
      last30Days: { from: thirtyDaysStart, to: todayEnd },
      lifetime: { from: new Date(0), to: todayEnd },
    }),
  ]);

  const [topAdvertisersRaw, topPublishersRaw] = await Promise.all([
    prisma.campaign.findMany({
      orderBy: { spent: "desc" },
      take: 8,
      select: {
        advertiserId: true,
        spent: true,
        advertiser: { select: { name: true } },
        _count: { select: { leads: true } },
      },
    }),
    prisma.lead.groupBy({
      by: ["publisherId"],
      where: { status: { in: ["APPROVED", "PAID"] } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  const publisherIds = topPublishersRaw.map((p) => p.publisherId);
  const publishers = publisherIds.length
    ? await prisma.user.findMany({
        where: { id: { in: publisherIds } },
        select: {
          id: true,
          name: true,
          wallet: { select: { balance: true } },
        },
      })
    : [];
  const publisherMap = new Map(publishers.map((p) => [p.id, p]));

  const advertiserMap = new Map<
    string,
    { name: string; spend: number; leads: number; campaigns: number }
  >();
  for (const row of topAdvertisersRaw) {
    const existing = advertiserMap.get(row.advertiserId);
    if (existing) {
      existing.spend += Number(row.spent);
      existing.leads += row._count.leads;
      existing.campaigns += 1;
    } else {
      advertiserMap.set(row.advertiserId, {
        name: row.advertiser.name,
        spend: Number(row.spent),
        leads: row._count.leads,
        campaigns: 1,
      });
    }
  }

  const topAdvertisers = Array.from(advertiserMap.values())
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  const topPublishers = topPublishersRaw.map((row) => {
    const publisher = publisherMap.get(row.publisherId);
    return {
      name: publisher?.name ?? "Unknown",
      approvedLeads: row._count.id,
      earnings: Number(publisher?.wallet?.balance ?? 0),
    };
  });

  const topCampaigns = topCampaignsRaw.map((c) => ({
    id: c.id,
    name: c.name,
    advertiser: c.advertiser.name,
    leads: c._count.leads,
    revenue: Number(c.spent),
    cpl: Number(c.cpl),
  }));

  const reviewedLeads = approvedLeads + rejectedLeads;
  const approvalRate = reviewedLeads > 0 ? (approvedLeads / reviewedLeads) * 100 : 0;
  const conversionRate = totalLeads > 0 ? (approvedLeads / totalLeads) * 100 : 0;

  const actionItems = [
    {
      id: "leads",
      label: "Leads awaiting approval",
      count: pendingLeads,
      href: "/admin/leads",
      action: "Review Leads",
      critical: pendingLeads > 0,
    },
    {
      id: "withdrawals",
      label: "Withdrawal requests",
      count: pendingPayoutsCount,
      href: "/admin/payouts",
      action: "Process Withdrawals",
      critical: pendingPayoutsCount > 0,
    },
    {
      id: "campaigns",
      label: "Campaigns awaiting launch",
      count: draftCampaigns,
      href: "/admin/campaigns",
      action: "Review Campaigns",
      critical: draftCampaigns > 0,
    },
    {
      id: "advertisers",
      label: "Advertiser verification",
      count: pendingAdvertisers,
      href: "/admin/advertisers",
      action: "Verify Advertiser",
      critical: pendingAdvertisers > 0,
    },
    {
      id: "publishers",
      label: "Publisher KYC verification",
      count: pendingPublisherKyc,
      href: "/admin/publishers",
      action: "Verify Publisher",
      critical: pendingPublisherKyc > 0,
    },
    {
      id: "support",
      label: "Open support tickets",
      count: openTickets,
      href: "/admin/support",
      action: "Open Support",
      critical: urgentTickets > 0,
    },
  ].filter((item) => item.count > 0);

  const approvalLanes = [
    {
      id: "campaigns",
      title: "Campaign Approval",
      count: draftCampaigns,
      status: draftCampaigns > 0 ? "Pending" : "Clear",
      href: "/admin/campaigns",
    },
    {
      id: "leads",
      title: "Lead Approval",
      count: pendingLeads,
      status: pendingLeads > 0 ? "Pending" : "Clear",
      href: "/admin/leads",
    },
    {
      id: "publishers",
      title: "Publisher Approval",
      count: pendingPublisherKyc,
      status: pendingPublisherKyc > 0 ? "Pending" : "Clear",
      href: "/admin/publishers",
    },
    {
      id: "advertisers",
      title: "Advertiser Verification",
      count: pendingAdvertisers,
      status: pendingAdvertisers > 0 ? "Pending" : "Clear",
      href: "/admin/advertisers",
    },
    {
      id: "withdrawals",
      title: "Withdrawal Approval",
      count: pendingPayoutsCount,
      status: pendingPayoutsCount > 0 ? "Pending" : "Clear",
      href: "/admin/payouts",
    },
  ];

  const leadStatusData = [
    { name: "Approved", value: approvedLeads, color: "#22C55E" },
    { name: "Pending", value: pendingLeads, color: "#F97316" },
    { name: "Rejected", value: rejectedLeads, color: "#EF4444" },
  ].filter((d) => d.value > 0);

  const platformData = [
    { name: "Advertisers", value: totalAdvertisers },
    { name: "Publishers", value: totalPublishers },
    { name: "Campaigns", value: totalCampaigns },
    { name: "Leads", value: totalLeads },
  ];

  return {
    platformStatus: dbHealthy ? ("Operational" as const) : ("Degraded" as const),
    summary: {
      todaysLeads,
      pendingLeads,
      pendingWithdrawals: pendingPayoutsCount,
      openTickets,
      urgentTickets,
    },
    actionItems,
    businessOverview: {
      revenueToday,
      revenueMonth,
      activeCampaigns,
      totalAdvertisers,
      totalPublishers,
      todaysLeads,
      todaysApprovedLeads,
      todaysRejectedLeads,
      conversionRate,
      approvalRate,
    },
    revenue: {
      today: revenueToday,
      last7Days: revenue7d,
      last30Days: revenue30d,
      lastMonth: revenueLastMonth,
      lifetime: revenueLifetime,
      trend: revenueTrend,
    },
    adminProfit: adminProfitSnapshots,
    approvalLanes,
    analytics: {
      leadsTrend,
      revenueTrend,
      leadStatusData,
      platformData,
    },
    topPerformers: {
      advertisers: topAdvertisers,
      publishers: topPublishers,
      campaigns: topCampaigns,
    },
    recentActivities: recentAuditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      actorName: log.actor.name,
      createdAt: log.createdAt,
    })),
    recentLeads: recentLeads.map((lead) => ({
      id: lead.id,
      name: leadDisplayName(lead.data),
      status: lead.status,
      createdAt: lead.createdAt,
      campaign: lead.campaign.name,
      publisher: lead.publisher.name,
      advertiser: lead.campaign.advertiser.name,
    })),
    platformHealth: {
      database: dbHealthy ? "Healthy" : "Down",
      api: "Healthy",
      email: "Healthy",
      backgroundJobs: "Healthy",
      cache: "Healthy",
    },
    support: {
      openTickets,
      urgentTickets,
      recentClosed: recentClosedTickets,
    },
    fraud: {
      duplicateLeads: duplicateLeadFlags,
      lowScoreLeads,
      suspendedUsers,
      rejectedLeads,
    },
    financial: {
      walletBalance: Number(walletAggregate._sum.balance ?? 0),
      holdBalance: Number(walletAggregate._sum.holdBalance ?? 0),
      pendingPayoutsCount,
      pendingPayoutsAmount: Number(pendingPayoutsAmount._sum.amount ?? 0),
      completedPayoutsMonth,
      platformRevenue: revenueLifetime,
      commissionEarned: revenueLifetime,
      adminProfit: adminProfitSnapshots.lifetime.adminProfit,
      advertiserPayment: adminProfitSnapshots.lifetime.advertiserPayment,
      publisherPayout: adminProfitSnapshots.lifetime.publisherPayout,
      referralPay: adminProfitSnapshots.lifetime.referralPay,
    },
    notifications: recentNotifications,
    legacy: {
      totalCampaigns,
      totalLeads,
      approvedLeads,
      rejectedLeads,
      pendingPayouts: pendingPayoutsCount,
      openTickets,
      leadsTrend,
      revenue: revenueLifetime,
    },
  };
}

export type AdminControlCenterData = Awaited<ReturnType<typeof getAdminControlCenterData>>;
