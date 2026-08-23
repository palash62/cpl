import type { FraudIntelligenceConfig } from "../types/config";
import { filterWindow, MS, type ContextLeadRow } from "./repositories/context.repo";

export type SourceRiskInsight = {
  source: string;
  sampleSize: number;
  rejectionRate: number | null;
  avgRiskScore: number | null;
  warning: boolean;
};

export function analyzeSourceRisk(
  source: string | null | undefined,
  rows: ContextLeadRow[],
  config: FraudIntelligenceConfig,
  now = new Date(),
): SourceRiskInsight | null {
  if (!source) return null;
  const window = filterWindow(rows, MS.ONE_DAY, now);
  const sampleSize = window.length;
  if (sampleSize === 0) {
    return { source, sampleSize: 0, rejectionRate: null, avgRiskScore: null, warning: false };
  }

  const rejected = window.filter((r) => r.status === "REJECTED").length;
  const withRisk = window.filter((r) => r.riskScore != null);
  const avgRiskScore =
    withRisk.length > 0
      ? Math.round(withRisk.reduce((s, r) => s + (r.riskScore ?? 0), 0) / withRisk.length)
      : null;
  const rejectionRate = rejected / sampleSize;
  const warning = sampleSize >= config.minSampleSize && rejectionRate >= 0.4;

  return {
    source,
    sampleSize,
    rejectionRate: Math.round(rejectionRate * 1000) / 10,
    avgRiskScore,
    warning,
  };
}
