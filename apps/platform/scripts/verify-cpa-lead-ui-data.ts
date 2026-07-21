/**
 * Verify lead.service returns sales/revenue on listLeads and publisher report.
 * Run from apps/platform: npx tsx ../../scripts/verify-cpa-lead-ui-data.ts
 */
import { prisma } from "../src/lib/prisma";
import { loadCpaMetricsByLeadIds } from "../src/lib/cpa-lead-metrics";
import { listLeads, listAdvertiserPublisherLeadReport } from "../src/services/lead.service";
import { getCampaignPerformanceReport } from "../src/services/report.service";
import { subDays } from "date-fns";

async function main() {
  const advertiser = await prisma.user.findFirst({
    where: { role: "ADVERTISER", email: "advertiser@cpl.local" },
    select: { id: true },
  });
  if (!advertiser) throw new Error("Advertiser not found");

  const leadWithSale = await prisma.cpaOfferClick.findFirst({
    where: { leadId: { not: null }, conversions: { some: {} } },
    select: { leadId: true, advertiserId: true },
    orderBy: { createdAt: "desc" },
  });
  if (!leadWithSale?.leadId) throw new Error("No lead with CPA conversion found");

  const leadId = leadWithSale.leadId;
  const metrics = await loadCpaMetricsByLeadIds([leadId]);
  const direct = metrics.get(leadId);
  if (!direct || direct.salesCount < 1 || direct.revenue <= 0) {
    throw new Error(`loadCpaMetricsByLeadIds failed: ${JSON.stringify(direct)}`);
  }
  console.log("✓ loadCpaMetricsByLeadIds:", direct);

  const { data: leads } = await listLeads({
    advertiserId: advertiser.id,
    page: 1,
    limit: 100,
  });
  const row = leads.find((l) => l.id === leadId);
  if (!row || row.salesCount < 1 || row.revenue <= 0) {
    throw new Error(
      `listLeads missing metrics for ${leadId}: ${JSON.stringify(row ? { salesCount: row.salesCount, revenue: row.revenue } : null)}`,
    );
  }
  console.log("✓ listLeads row:", { leadId: row.id, salesCount: row.salesCount, revenue: row.revenue });

  const from = subDays(new Date(), 365);
  const to = new Date();
  const pubReport = await listAdvertiserPublisherLeadReport({
    advertiserId: advertiser.id,
    dateFrom: from,
    dateTo: to,
  });
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { publisherId: true, campaignId: true },
  });
  const pubRow = pubReport.find((r) => r.publisherId === lead?.publisherId);
  if (!pubRow || pubRow.salesCount < 1 || pubRow.revenue <= 0) {
    throw new Error(`Publisher report missing metrics: ${JSON.stringify(pubRow)}`);
  }
  console.log("✓ listAdvertiserPublisherLeadReport:", {
    publisherId: pubRow.publisherId,
    salesCount: pubRow.salesCount,
    revenue: pubRow.revenue,
  });

  const campaigns = await getCampaignPerformanceReport({
    advertiserId: advertiser.id,
    from,
    to,
  });
  const campRow = campaigns.find((c) => c.campaignId === lead?.campaignId);
  if (!campRow || campRow.salesCount < 1 || campRow.revenue <= 0) {
    throw new Error(`Campaign report missing metrics: ${JSON.stringify(campRow)}`);
  }
  console.log("✓ getCampaignPerformanceReport:", {
    campaignId: campRow.campaignId,
    salesCount: campRow.salesCount,
    revenue: campRow.revenue,
  });

  console.log("\nAll service-layer checks passed.");
}

main()
  .catch((e) => {
    console.error("VERIFY FAILED:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
