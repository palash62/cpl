import type { FraudEvaluationContext } from "../types/context";
import type { FraudConfig } from "../types/config";
import type { RuleOutcome } from "../types/result";

function normalizeCountry(code?: string) {
  return code?.trim().toUpperCase() ?? "";
}

export function geoRule(ctx: FraudEvaluationContext, config: FraudConfig): RuleOutcome | null {
  if (!config.enabledRules.geo_mismatch) return null;

  const targeting = ctx.targeting ?? {};
  const allowed = Array.isArray(targeting.countries)
    ? (targeting.countries as string[]).map((c) => c.toUpperCase())
  : [];

  const declared = normalizeCountry(ctx.country);
  const ipCountry = normalizeCountry(ctx.geoCountry);

  if (allowed.length > 0 && declared && !allowed.includes(declared)) {
    return {
      rule: "geo_mismatch",
      passed: false,
      riskDelta: config.weights.geo_mismatch,
      hardFail: true,
      details: `Country ${declared} not allowed for campaign`,
    };
  }

  if (declared && ipCountry && declared !== ipCountry) {
    return {
      rule: "geo_mismatch",
      passed: false,
      riskDelta: config.weights.geo_mismatch,
      hardFail: false,
      details: `Declared ${declared} but IP geo is ${ipCountry}`,
    };
  }

  return { rule: "geo_mismatch", passed: true, riskDelta: 0, hardFail: false };
}
