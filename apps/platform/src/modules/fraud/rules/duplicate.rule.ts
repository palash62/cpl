import type { FraudEvaluationContext } from "../types/context";
import type { FraudConfig } from "../types/config";
import type { RuleOutcome } from "../types/result";

export function duplicateRule(ctx: FraudEvaluationContext, config: FraudConfig): RuleOutcome[] {
  const outcomes: RuleOutcome[] = [];
  const email = ctx.data.email?.toLowerCase().trim();

  if (config.enabledRules.duplicate_email && email) {
    const dup = ctx.existingEmails.includes(email);
    outcomes.push({
      rule: "duplicate_email",
      passed: !dup,
      riskDelta: dup ? config.weights.duplicate_email : 0,
      hardFail: dup,
      details: dup ? "Email already submitted for this campaign" : undefined,
    });
  }

  const phone = ctx.data.phone?.replace(/\D/g, "");
  if (config.enabledRules.duplicate_phone && phone) {
    const dup = ctx.existingPhones.includes(phone);
    outcomes.push({
      rule: "duplicate_phone",
      passed: !dup,
      riskDelta: dup ? config.weights.duplicate_phone : 0,
      hardFail: dup,
      details: dup ? "Phone already submitted for this campaign" : undefined,
    });
  }

  if (config.enabledRules.duplicate_ip && ctx.ip) {
    const dup = ctx.existingIps.includes(ctx.ip);
    outcomes.push({
      rule: "duplicate_ip",
      passed: !dup,
      riskDelta: dup ? config.weights.duplicate_ip : 0,
      hardFail: false,
      details: dup ? "Same IP submitted recently for this campaign" : undefined,
    });
  }

  if (config.enabledRules.duplicate_device && ctx.deviceFingerprint) {
    const dup = ctx.existingFingerprints.includes(ctx.deviceFingerprint);
    outcomes.push({
      rule: "duplicate_device",
      passed: !dup,
      riskDelta: dup ? config.weights.duplicate_device : 0,
      hardFail: false,
      details: dup ? "Device already used for this campaign" : undefined,
    });
  }

  return outcomes;
}
