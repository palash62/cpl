/**
 * Verify admin reports breakdown includes CPA sales/revenue rollup.
 * Run: npx tsx scripts/verify-admin-reports-cpa.ts
 */
import { prisma } from "../src/lib/prisma";
import { getAdminReportsBreakdown } from "../src/services/report.service";
import { subDays } from "date-fns";

const DEMO_EMAIL = "cpl-revenue-demo@example.com";

async function main() {
  const demoLead = await prisma.lead.findFirst({
    where: {
      data: { path: "$.email", equals: DEMO_EMAIL },
    },
    select: {
      id: true,
      publisherId: true,
      campaign: { select: { advertiserId: true } },
    },
  });
  if (!demoLead) {
    throw new Error(`Demo lead not found — run: node scripts/seed-cpl-revenue-demo.mjs`);
  }

  const from = subDays(new Date(), 365);
  const to = new Date();
  const breakdown = await getAdminReportsBreakdown({ from, to });

  const publisherRow = breakdown.publishers.find((r) => r.id === demoLead.publisherId);
  const advertiserRow = breakdown.advertisers.find(
    (r) => r.id === demoLead.campaign.advertiserId,
  );

  if (!publisherRow || publisherRow.salesCount < 1 || publisherRow.revenue < 10) {
    throw new Error(`Publisher row missing CPA metrics: ${JSON.stringify(publisherRow)}`);
  }
  if (!advertiserRow || advertiserRow.salesCount < 1 || advertiserRow.revenue < 10) {
    throw new Error(`Advertiser row missing CPA metrics: ${JSON.stringify(advertiserRow)}`);
  }

  console.log("✓ getAdminReportsBreakdown CPA rollup passed");
  console.log({
    publisher: {
      id: publisherRow.id,
      salesCount: publisherRow.salesCount,
      revenue: publisherRow.revenue,
    },
    advertiser: {
      id: advertiserRow.id,
      salesCount: advertiserRow.salesCount,
      revenue: advertiserRow.revenue,
    },
    totals: {
      salesCount: breakdown.totals.salesCount,
      revenue: breakdown.totals.revenue,
    },
  });
}

main()
  .catch((e) => {
    console.error("VERIFY FAILED:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
