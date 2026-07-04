import { prisma } from "@/lib/prisma";
import type { RuleOutcome } from "../types/result";

export async function saveValidationResults(leadId: string, outcomes: RuleOutcome[]) {
  if (outcomes.length === 0) return;
  await prisma.leadValidationResult.createMany({
    data: outcomes.map((o) => ({
      leadId,
      rule: o.rule,
      passed: o.passed,
      riskDelta: o.riskDelta,
      details: o.details,
    })),
  });
}
