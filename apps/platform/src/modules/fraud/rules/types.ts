import type { FraudEvaluationContext } from "../types/context";
import type { FraudConfig } from "../types/config";
import type { RuleOutcome } from "../types/result";

export type FraudRule = {
  id: string;
  run: (ctx: FraudEvaluationContext, config: FraudConfig) => RuleOutcome | RuleOutcome[] | null;
};
