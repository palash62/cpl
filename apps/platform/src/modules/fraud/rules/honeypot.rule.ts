import type { FraudEvaluationContext } from "../types/context";
import type { FraudConfig } from "../types/config";
import type { RuleOutcome } from "../types/result";

export function honeypotRule(ctx: FraudEvaluationContext, config: FraudConfig): RuleOutcome | null {
  if (!config.enabledRules.honeypot) return null;
  if (!ctx.honeypot) {
    return { rule: "honeypot", passed: true, riskDelta: 0, hardFail: false };
  }
  return {
    rule: "honeypot",
    passed: false,
    riskDelta: config.weights.honeypot,
    hardFail: true,
    details: "Bot detected (honeypot)",
  };
}
