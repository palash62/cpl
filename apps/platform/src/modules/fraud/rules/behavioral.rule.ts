import type { FraudEvaluationContext } from "../types/context";
import type { FraudConfig } from "../types/config";
import type { RuleOutcome } from "../types/result";

export function behavioralRule(ctx: FraudEvaluationContext, config: FraudConfig): RuleOutcome[] {
  if (!config.enabledRules.behavioral) return [];

  const meta = ctx.submissionMeta;
  const outcomes: RuleOutcome[] = [];

  if (meta?.formDurationMs !== undefined && meta.formDurationMs < config.minFormDurationMs) {
    outcomes.push({
      rule: "fast_submit",
      passed: false,
      riskDelta: config.weights.fast_submit,
      hardFail: false,
      details: `Form submitted in ${meta.formDurationMs}ms`,
    });
  }

  if (meta && meta.mouseMoveCount !== undefined && meta.mouseMoveCount === 0) {
    outcomes.push({
      rule: "no_mouse",
      passed: false,
      riskDelta: config.weights.no_mouse,
      hardFail: false,
      details: "No mouse movement detected",
    });
  }

  if (
    meta &&
    meta.pasteCount !== undefined &&
    meta.keyPressCount !== undefined &&
    meta.pasteCount > 0 &&
    meta.keyPressCount === 0
  ) {
    outcomes.push({
      rule: "paste_only",
      passed: false,
      riskDelta: config.weights.paste_only,
      hardFail: false,
      details: "Paste-only submission pattern",
    });
  }

  if (ctx.clickIp && ctx.ip && ctx.clickIp === ctx.ip) {
    outcomes.push({
      rule: "click_match",
      passed: true,
      riskDelta: config.weights.click_match,
      hardFail: false,
      details: "Click IP matches submission IP",
    });
  }

  return outcomes;
}
