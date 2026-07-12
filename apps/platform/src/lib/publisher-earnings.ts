import { prisma } from "@/lib/prisma";
import { calculatePublisherPayout } from "@/lib/platform-settings";
import { getPlatformSettingsConfig } from "@/lib/platform-settings-server";
import { shouldCreditPublisherForLead } from "@/lib/publisher-leads";

type PublisherEarningLead = {
  id: string;
  status: string;
  country: string | null;
  publisherId: string;
  trackingLinkId: string | null;
  campaign: { cpl: number | { toString(): string }; advertiserId: string };
  publisher: { role: string } | null;
};

/** Sum wallet-credited earnings for PAID leads only. */
export function sumPublisherEarningsForLeads(
  leads: PublisherEarningLead[],
  creditedByLeadId: Map<string, number>,
  settings: Awaited<ReturnType<typeof getPlatformSettingsConfig>>,
): number {
  let total = 0;

  for (const lead of leads) {
    if (lead.status !== "PAID") continue;
    if (!shouldCreditPublisherForLead(lead)) continue;
    const credited = creditedByLeadId.get(lead.id);
    total +=
      credited ??
      calculatePublisherPayout(Number(lead.campaign.cpl), lead.country, settings).publisherAmount;
  }

  return Math.round(total * 100) / 100;
}

export async function getPublisherEarningsForRange(
  publisherId: string,
  from: Date,
  to: Date,
): Promise<number> {
  const [settings, leads] = await Promise.all([
    getPlatformSettingsConfig(),
    prisma.lead.findMany({
      where: {
        publisherId,
        status: "PAID",
        createdAt: { gte: from, lte: to },
      },
      select: {
        id: true,
        status: true,
        country: true,
        publisherId: true,
        trackingLinkId: true,
        campaign: { select: { cpl: true, advertiserId: true } },
        publisher: { select: { role: true } },
      },
    }),
  ]);

  if (leads.length === 0) return 0;

  const credits = await prisma.ledgerEntry.findMany({
    where: {
      type: "CREDIT",
      referenceType: "lead",
      referenceId: { in: leads.map((lead) => lead.id) },
      wallet: { userId: publisherId },
    },
    select: { referenceId: true, amount: true },
  });

  const creditedByLeadId = new Map(
    credits
      .filter((entry) => entry.referenceId)
      .map((entry) => [entry.referenceId!, Number(entry.amount)]),
  );

  return sumPublisherEarningsForLeads(leads, creditedByLeadId, settings);
}
