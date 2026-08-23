import type { FraudIntelligenceConfig } from "../types/config";
import { getLeadFraudIntelligence } from "./repositories/context.repo";
import { prisma } from "@/lib/prisma";
import type { ContextualRiskLevel } from "./types";

export type CampaignTrustDistribution = {
  campaignId: string;
  total: number;
  highTrust: number;
  mediumTrust: number;
  lowTrust: number;
  highTrustPct: number;
  mediumTrustPct: number;
  lowTrustPct: number;
  topSignals: string[];
  warning: boolean;
};

function levelToTrustBucket(level: string): "high" | "medium" | "low" {
  if (level === "low") return "high";
  if (level === "medium") return "medium";
  return "low";
}

export async function getCampaignTrustDistribution(
  campaignId: string,
  config: FraudIntelligenceConfig,
  lookbackDays = 7,
): Promise<CampaignTrustDistribution> {
  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
  const rows = await prisma.leadFraudIntelligence.findMany({
    where: {
      lead: { campaignId, isTest: false, createdAt: { gte: since } },
    },
    select: {
      contextualRiskLevel: true,
      signals: true,
    },
    take: 2000,
  });

  let highTrust = 0;
  let mediumTrust = 0;
  let lowTrust = 0;
  const signalCounts = new Map<string, number>();

  for (const row of rows) {
    const bucket = levelToTrustBucket(row.contextualRiskLevel);
    if (bucket === "high") highTrust += 1;
    else if (bucket === "medium") mediumTrust += 1;
    else lowTrust += 1;

    const signals = row.signals as { flags?: string[]; clusters?: Array<{ type: string }> };
    for (const f of signals?.flags ?? []) {
      signalCounts.set(f, (signalCounts.get(f) ?? 0) + 1);
    }
    for (const c of signals?.clusters ?? []) {
      signalCounts.set(c.type, (signalCounts.get(c.type) ?? 0) + 1);
    }
  }

  const total = rows.length;
  const topSignals = [...signalCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);

  return {
    campaignId,
    total,
    highTrust,
    mediumTrust,
    lowTrust,
    highTrustPct: total ? Math.round((highTrust / total) * 100) : 0,
    mediumTrustPct: total ? Math.round((mediumTrust / total) * 100) : 0,
    lowTrustPct: total ? Math.round((lowTrust / total) * 100) : 0,
    topSignals,
    warning: total >= config.minSampleSize && lowTrust / Math.max(total, 1) >= 0.2,
  };
}

export async function getPublisherContextualInsight(publisherId: string, lookbackDays = 7) {
  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
  const rows = await prisma.leadFraudIntelligence.findMany({
    where: {
      lead: { publisherId, isTest: false, createdAt: { gte: since } },
    },
    select: {
      contextualRiskScore: true,
      contextualRiskLevel: true,
      ipContext: true,
      deviceContext: true,
      signals: true,
    },
    take: 2000,
  });

  if (rows.length === 0) {
    return {
      sampleSize: 0,
      averageContextualRiskScore: null as number | null,
      level: "low" as ContextualRiskLevel,
      summary: "Not enough contextual intelligence data yet for this publisher.",
    };
  }

  const avg = Math.round(
    rows.reduce((s, r) => s + r.contextualRiskScore, 0) / rows.length,
  );
  let sharedIpLeads = 0;
  let deviceReuse = 0;
  let highVelocity = 0;

  for (const row of rows) {
    const ip = row.ipContext as { sharedIpLikely?: boolean } | null;
    const device = row.deviceContext as { flags?: string[] } | null;
    const signals = row.signals as { flags?: string[] };
    if (ip?.sharedIpLikely) sharedIpLeads += 1;
    if (device?.flags?.some((f) => f.includes("MULTIPLE_EMAILS"))) deviceReuse += 1;
    if (signals?.flags?.some((f) => f.includes("VELOCITY"))) highVelocity += 1;
  }

  const sharedPct = Math.round((sharedIpLeads / rows.length) * 100);
  const level: ContextualRiskLevel =
    avg <= 24 ? "low" : avg <= 49 ? "medium" : avg <= 74 ? "high" : "critical";

  const summary =
    sharedPct > 0
      ? `${sharedPct}% of recent leads share IP addresses; device identity reuse on ${deviceReuse} leads; high-velocity flags on ${highVelocity} leads.`
      : `Average contextual risk ${avg}/100 across ${rows.length} recent leads. Device identity reuse on ${deviceReuse} leads.`;

  return {
    sampleSize: rows.length,
    averageContextualRiskScore: avg,
    level,
    summary,
  };
}

export async function getStoredIntelligence(leadId: string) {
  return getLeadFraudIntelligence(leadId);
}
