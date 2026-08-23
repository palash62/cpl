import { prisma } from "@/lib/prisma";
import { getFraudConfig } from "@/modules/fraud/config/load-config";
import { toAdvertiserTrustView } from "@/modules/fraud/intelligence/explainability.service";
import type { AdvertiserTrustView, ContextualRiskLevel } from "@/modules/fraud/intelligence/types";

export type AdvertiserLeadQualityMetrics = {
  totalLeads: number;
  trustedLeads: number;
  reviewRecommended: number;
  highRiskLeads: number;
  duplicateIdentityPatterns: number;
  suspiciousVelocity: number;
  leadQualityScore: number;
  breakdown: {
    identityQuality: number;
    behaviorQuality: number;
    networkQuality: number;
  };
};

export async function getAdvertiserLeadQualityMetrics(
  advertiserId: string,
  from?: Date,
  to?: Date,
): Promise<AdvertiserLeadQualityMetrics> {
  const config = await getFraudConfig();
  if (!config.intelligence.advertiserVisibility) {
    return emptyMetrics();
  }

  const rows = await prisma.leadFraudIntelligence.findMany({
    where: {
      lead: {
        isTest: false,
        campaign: { advertiserId },
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
    },
    select: {
      contextualRiskScore: true,
      contextualRiskLevel: true,
      signals: true,
    },
    take: 5000,
  });

  const totalLeads = rows.length;
  if (totalLeads === 0) return emptyMetrics();

  let trustedLeads = 0;
  let reviewRecommended = 0;
  let highRiskLeads = 0;
  let duplicateIdentityPatterns = 0;
  let suspiciousVelocity = 0;
  let identityPenalty = 0;
  let behaviorPenalty = 0;
  let networkPenalty = 0;

  for (const row of rows) {
    const level = row.contextualRiskLevel;
    if (level === "low") trustedLeads += 1;
    else if (level === "medium") reviewRecommended += 1;
    else highRiskLeads += 1;

    const signals = row.signals as {
      flags?: string[];
      clusters?: Array<{ type?: string }>;
      velocity?: Array<{ entity?: string }>;
    };

    if (
      signals.flags?.some((f) => f.includes("EMAILS") || f.includes("IDENTITY")) ||
      signals.clusters?.some((c) => c.type?.includes("DEVICE") || c.type?.includes("IDENTITIES"))
    ) {
      duplicateIdentityPatterns += 1;
      identityPenalty += 1;
    }
    if (
      signals.flags?.some((f) => f.includes("VELOCITY")) ||
      (signals.velocity?.length ?? 0) > 0
    ) {
      suspiciousVelocity += 1;
      behaviorPenalty += 1;
    }
    if (
      signals.flags?.includes("SHARED_IP_LIKELY") ||
      signals.clusters?.some((c) => c.type === "SHARED_IP_PATTERN")
    ) {
      networkPenalty += 0.3;
    }
  }

  const avgContextual =
    rows.reduce((s, r) => s + r.contextualRiskScore, 0) / totalLeads;
  const leadQualityScore = Math.max(0, Math.min(100, Math.round(100 - avgContextual)));

  const identityQuality = Math.max(
    0,
    Math.round(100 - (identityPenalty / totalLeads) * 100),
  );
  const behaviorQuality = Math.max(
    0,
    Math.round(100 - (behaviorPenalty / totalLeads) * 100),
  );
  const networkQuality = Math.max(
    0,
    Math.round(100 - (networkPenalty / totalLeads) * 100),
  );

  return {
    totalLeads,
    trustedLeads,
    reviewRecommended,
    highRiskLeads,
    duplicateIdentityPatterns,
    suspiciousVelocity,
    leadQualityScore,
    breakdown: { identityQuality, behaviorQuality, networkQuality },
  };
}

function emptyMetrics(): AdvertiserLeadQualityMetrics {
  return {
    totalLeads: 0,
    trustedLeads: 0,
    reviewRecommended: 0,
    highRiskLeads: 0,
    duplicateIdentityPatterns: 0,
    suspiciousVelocity: 0,
    leadQualityScore: 100,
    breakdown: { identityQuality: 100, behaviorQuality: 100, networkQuality: 100 },
  };
}

export function trustViewFromIntelligence(row: {
  contextualRiskLevel: string;
  explanation: unknown;
} | null | undefined): AdvertiserTrustView | null {
  if (!row) return null;
  return toAdvertiserTrustView(
    row.contextualRiskLevel as ContextualRiskLevel,
    row.explanation as Parameters<typeof toAdvertiserTrustView>[1],
  );
}
