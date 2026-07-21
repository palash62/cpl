/**
 * Verify CPL vs revenue demo lead in listLeads.
 * Run: npx tsx scripts/verify-cpl-revenue-demo.ts
 */
import { prisma } from "../src/lib/prisma";
import { getLeadCpl } from "../src/lib/lead-cpl";
import { listLeads } from "../src/services/lead.service";

const DEMO_EMAIL = "cpl-revenue-demo@example.com";
const DEMO_LEAD_ID = process.env.DEMO_LEAD_ID;

async function main() {
  const advertiser = await prisma.user.findFirst({
    where: { email: "advertiser@cpl.local" },
    select: { id: true },
  });
  if (!advertiser) throw new Error("Advertiser not found");

  const { data: leads } = await listLeads({
    advertiserId: advertiser.id,
    page: 1,
    limit: 100,
  });

  const row = leads.find((lead) => {
    if (DEMO_LEAD_ID && lead.id === DEMO_LEAD_ID) return true;
    const data = lead.data as Record<string, string> | null;
    return data?.email?.trim().toLowerCase() === DEMO_EMAIL;
  });

  if (!row) throw new Error(`Demo lead not found (${DEMO_EMAIL})`);

  const cpl = getLeadCpl(row);
  if (Math.abs(cpl - 1) > 0.001) throw new Error(`Expected CPL 1, got ${cpl}`);
  if (row.salesCount !== 1) throw new Error(`Expected salesCount 1, got ${row.salesCount}`);
  if (Math.abs(row.revenue - 10) > 0.001) throw new Error(`Expected revenue 10, got ${row.revenue}`);

  console.log("✓ listLeads verification passed");
  console.log({
    leadId: row.id,
    email: DEMO_EMAIL,
    status: row.status,
    cpl,
    salesCount: row.salesCount,
    revenue: row.revenue,
  });
}

main()
  .catch((e) => {
    console.error("VERIFY FAILED:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
