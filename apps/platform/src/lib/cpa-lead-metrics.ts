import { prisma } from "@/lib/prisma";

export type LeadCpaMetrics = {
  salesCount: number;
  revenue: number;
};

const EMPTY_METRICS: LeadCpaMetrics = { salesCount: 0, revenue: 0 };

export function formatLeadSaleLabel(count: number): string {
  if (count <= 0) return "—";
  return count === 1 ? "1 sale" : `${count} sales`;
}

export function formatLeadRevenue(amount: number): string {
  if (amount <= 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export async function loadCpaMetricsByLeadIds(
  leadIds: string[],
): Promise<Map<string, LeadCpaMetrics>> {
  const map = new Map<string, LeadCpaMetrics>();
  if (leadIds.length === 0) return map;

  const clicks = await prisma.cpaOfferClick.findMany({
    where: { leadId: { in: leadIds } },
    select: {
      leadId: true,
      conversions: {
        select: {
          cpaEarning: { select: { amount: true } },
        },
      },
    },
  });

  for (const click of clicks) {
    if (!click.leadId) continue;
    const current = map.get(click.leadId) ?? { ...EMPTY_METRICS };
    for (const conversion of click.conversions) {
      current.salesCount += 1;
      if (conversion.cpaEarning) {
        current.revenue += Number(conversion.cpaEarning.amount);
      }
    }
    map.set(click.leadId, current);
  }

  return map;
}

export function emptyLeadCpaMetrics(): LeadCpaMetrics {
  return { ...EMPTY_METRICS };
}

export async function loadCpaMetricsByCampaignIds(
  campaignIds: string[],
  dateFrom?: Date,
  dateTo?: Date,
): Promise<Map<string, LeadCpaMetrics>> {
  const map = new Map<string, LeadCpaMetrics>();
  if (campaignIds.length === 0) return map;

  const createdAt: { gte?: Date; lte?: Date } = {};
  if (dateFrom) createdAt.gte = dateFrom;
  if (dateTo) createdAt.lte = dateTo;

  const leads = await prisma.lead.findMany({
    where: {
      campaignId: { in: campaignIds },
      isTest: false,
      ...(Object.keys(createdAt).length > 0 && { createdAt }),
    },
    select: { id: true, campaignId: true },
  });

  if (leads.length === 0) return map;

  const metricsByLeadId = await loadCpaMetricsByLeadIds(leads.map((lead) => lead.id));

  for (const lead of leads) {
    const metrics = metricsByLeadId.get(lead.id);
    if (!metrics) continue;
    const current = map.get(lead.campaignId) ?? { ...EMPTY_METRICS };
    current.salesCount += metrics.salesCount;
    current.revenue += metrics.revenue;
    map.set(lead.campaignId, current);
  }

  return map;
}
