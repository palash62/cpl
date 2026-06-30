import { isValidEmail } from "@/lib/validations";
import { DISPOSABLE_EMAIL_DOMAINS, ROLE_EMAIL_PREFIXES } from "../data/disposable-domains";
import type { FraudEvaluationContext } from "../types/context";
import type { FraudConfig } from "../types/config";
import type { RuleOutcome } from "../types/result";
import { checkEmailWithProvider } from "../providers/registry";

export async function emailRule(
  ctx: FraudEvaluationContext,
  config: FraudConfig,
): Promise<RuleOutcome[]> {
  const outcomes: RuleOutcome[] = [];
  const email = ctx.data.email?.toLowerCase().trim();
  if (!email) return outcomes;

  if (!isValidEmail(email)) {
    outcomes.push({
      rule: "email_format",
      passed: false,
      riskDelta: 30,
      hardFail: false,
      details: "Invalid email format",
    });
    return outcomes;
  }

  const domain = email.split("@")[1] ?? "";
  if (config.enabledRules.disposable_email && DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    outcomes.push({
      rule: "disposable_email",
      passed: false,
      riskDelta: config.weights.disposable_email,
      hardFail: true,
      details: `Disposable email domain: ${domain}`,
    });
  } else {
    outcomes.push({ rule: "disposable_email", passed: true, riskDelta: 0, hardFail: false });
  }

  if (config.enabledRules.role_email && ROLE_EMAIL_PREFIXES.some((p) => email.startsWith(p))) {
    outcomes.push({
      rule: "role_email",
      passed: false,
      riskDelta: config.weights.role_email,
      hardFail: false,
      details: "Role-based email address",
    });
  }

  const provider = await checkEmailWithProvider(email);
  if (provider) outcomes.push(provider);

  return outcomes;
}
