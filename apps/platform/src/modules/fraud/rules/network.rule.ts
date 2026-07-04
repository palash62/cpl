import type { FraudEvaluationContext } from "../types/context";
import type { FraudConfig } from "../types/config";
import type { RuleOutcome } from "../types/result";
import { checkIpWithProvider } from "../providers/registry";

export async function networkRule(
  ctx: FraudEvaluationContext,
  config: FraudConfig,
): Promise<RuleOutcome[]> {
  const outcomes: RuleOutcome[] = [];

  if (config.enabledRules.blocklist && ctx.ipBlocked) {
    outcomes.push({
      rule: "ip_blocklist",
      passed: false,
      riskDelta: 100,
      hardFail: true,
      details: "IP is blocklisted",
    });
    return outcomes;
  }

  if (!ctx.ip || !config.enabledRules.vpn_proxy) return outcomes;

  const provider = await checkIpWithProvider(ctx.ip);
  if (provider) {
    outcomes.push(provider);
  } else {
    outcomes.push({
      rule: "vpn_proxy",
      passed: true,
      riskDelta: config.weights.residential_ip,
      hardFail: false,
      details: "No VPN/proxy signals (builtin)",
    });
  }

  return outcomes;
}
