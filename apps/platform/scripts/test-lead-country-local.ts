/**
 * Local smoke test for lead country resolution.
 * Run: npx tsx apps/platform/scripts/test-lead-country-local.ts
 */
import { PrismaClient } from "@prisma/client";
import { extractLeadCountry } from "@/lib/lead-country";
import { listLeads } from "@/services/lead.service";

const prisma = new PrismaClient();

async function main() {
  const campaign = await prisma.campaign.findFirst({
    where: { status: "ACTIVE" },
    select: { id: true, advertiserId: true },
  });
  const publisher = await prisma.user.findFirst({
    where: { role: "PUBLISHER", status: "ACTIVE" },
    select: { id: true },
  });

  if (!campaign || !publisher) {
    throw new Error("Seed data missing. Run: npm run db:seed");
  }

  const marker = `country-test-${Date.now()}`;
  const scenarios = [
    {
      label: "public IP only",
      data: { email: `${marker}-ip@example.com` },
      ip: "8.8.8.8",
      submissionMeta: null,
      funnelIp: null,
    },
    {
      label: "timezone only",
      data: { email: `${marker}-tz@example.com` },
      ip: "unknown",
      submissionMeta: { timezone: "Asia/Kolkata", language: "en-IN" },
      funnelIp: null,
    },
    {
      label: "stored country",
      data: { email: `${marker}-stored@example.com` },
      ip: null,
      country: "CA",
      geoCountry: "CA",
      submissionMeta: null,
      funnelIp: null,
    },
    {
      label: "optin funnel event IP",
      data: { email: `${marker}-funnel@example.com` },
      ip: "unknown",
      submissionMeta: null,
      funnelIp: "8.8.8.8",
      source: "optin",
    },
  ] as const;

  for (const scenario of scenarios) {
    const lead = await prisma.lead.create({
      data: {
        campaignId: campaign.id,
        publisherId: publisher.id,
        status: "PENDING",
        data: scenario.data,
        ip: scenario.ip ?? undefined,
        country: "country" in scenario ? scenario.country : undefined,
        geoCountry: "geoCountry" in scenario ? scenario.geoCountry : undefined,
        submissionMeta: scenario.submissionMeta ?? undefined,
        source: "source" in scenario ? scenario.source : "local-country-test",
      },
    });

    if (scenario.funnelIp) {
      const optinPage = await prisma.advertiserOptinPage.findFirst({
        where: { campaignId: campaign.id },
        select: { id: true },
      });
      if (optinPage) {
        await prisma.funnelEvent.create({
          data: {
            funnelId: optinPage.id,
            campaignId: campaign.id,
            leadId: lead.id,
            eventType: "SUBMIT",
            step: "optin",
            ip: scenario.funnelIp,
          },
        });
      }
    }
  }

  const { data: leads } = await listLeads({
    limit: 20,
  });

  console.log("\nLead country local test\n");
  let passed = 0;
  for (const lead of leads) {
    const country = extractLeadCountry(lead.data, lead.country, lead.geoCountry, lead.submissionMeta);
    const email = (lead.data as { email?: string }).email ?? "—";
    const ok = country !== "—";
    if (ok) passed += 1;
    console.log(`${ok ? "PASS" : "FAIL"} | ${email}`);
    console.log(`       ip=${lead.ip ?? "—"} stored=${lead.country ?? "—"} geo=${lead.geoCountry ?? "—"}`);
    console.log(`       country column => ${country}\n`);
  }

  console.log(`Result: ${passed}/${leads.length} leads show a country`);
  console.log("\nBrowser check:");
  console.log("  1. npm run dev:platform");
  console.log("  2. Login admin@cpl.local / password123");
  console.log("  3. Open http://localhost:3000/admin/leads");
  console.log(`  4. Search emails containing ${marker}\n`);

  if (passed < leads.length) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
