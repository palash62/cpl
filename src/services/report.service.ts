import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, format } from "date-fns";

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
