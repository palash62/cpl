import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

export async function computePublisherQualityScore(publisherId: string, windowDays = 30) {
  const since = subDays(new Date(), windowDays);
  const leads = await prisma.lead.groupBy({
    by: ["status"],
    where: {
      publisherId,
      createdAt: { gte: since },
      status: { in: ["APPROVED", "PAID", "REJECTED"] },
    },
    _count: { id: true },
  });

  let approved = 0;
  let rejected = 0;
  for (const row of leads) {
    if (row.status === "REJECTED") rejected += row._count.id;
    else approved += row._count.id;
  }

  const total = approved + rejected;
  if (total === 0) return 100;
  return Math.round((approved / total) * 1000) / 10;
}

export async function computePublisherSpamScore(publisherId: string, windowDays = 30) {
  const since = subDays(new Date(), windowDays);
  const agg = await prisma.lead.aggregate({
    where: {
      publisherId,
      createdAt: { gte: since },
      riskScore: { not: null },
    },
    _avg: { riskScore: true },
    _count: { id: true },
  });

  if (agg._count.id === 0) return null;
  return Math.round(agg._avg.riskScore ?? 0);
}

export async function getPublisherSpamScoresByIds(publisherIds: string[], windowDays = 30) {
  if (publisherIds.length === 0) return new Map<string, number>();

  const since = subDays(new Date(), windowDays);
  const rows = await prisma.lead.groupBy({
    by: ["publisherId"],
    where: {
      publisherId: { in: publisherIds },
      createdAt: { gte: since },
      riskScore: { not: null },
    },
    _avg: { riskScore: true },
  });

  return new Map(rows.map((row) => [row.publisherId, Math.round(row._avg.riskScore ?? 0)]));
}

export async function computeCampaignRejectionRate(campaignId: string, sampleSize = 100) {
  const leads = await prisma.lead.findMany({
    where: { campaignId, status: { in: ["APPROVED", "PAID", "REJECTED", "PENDING"] } },
    orderBy: { createdAt: "desc" },
    take: sampleSize,
    select: { status: true },
  });
  if (leads.length < 20) return null;
  const rejected = leads.filter((l) => l.status === "REJECTED").length;
  return rejected / leads.length;
}
