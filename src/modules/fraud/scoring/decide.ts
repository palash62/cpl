import type { FraudConfig, FraudDecisionType } from "../types/config";
import type { RuleOutcome } from "../types/result";

export function decideFraud(
  riskScore: number,
  outcomes: RuleOutcome[],
  config: FraudConfig,
): { fraudDecision: FraudDecisionType; hardReject: boolean; rejectReason?: string } {
  const hardFail = outcomes.find((o) => o.hardFail && !o.passed);
  if (hardFail) {
    return {
      fraudDecision: "auto_reject",
      hardReject: true,
      rejectReason: hardFail.details ?? hardFail.rule,
    };
  }

  if (riskScore > config.manualReviewMax) {
    return { fraudDecision: "auto_reject", hardReject: true, rejectReason: "Risk score too high" };
  }
  if (riskScore > config.autoApproveMax) {
    return { fraudDecision: "manual_review", hardReject: false };
  }
  return { fraudDecision: "auto_approve", hardReject: false };
}
