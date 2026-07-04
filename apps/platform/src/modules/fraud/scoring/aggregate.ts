import type { RuleOutcome } from "../types/result";

export function aggregateRiskScore(outcomes: RuleOutcome[]): number {
  const total = outcomes.reduce((sum, o) => sum + o.riskDelta, 0);
  return Math.min(100, Math.max(0, total));
}
