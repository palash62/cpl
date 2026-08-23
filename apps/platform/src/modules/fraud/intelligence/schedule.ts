import { computeLeadIntelligence } from "./compute.service";

/**
 * Fire-and-forget scheduler. Never throws to caller.
 * Does not affect lead status, riskScore, or fraudDecision.
 */
export function scheduleLeadIntelligence(leadId: string): void {
  void computeLeadIntelligence(leadId).catch((err) => {
    console.error("[fraud-intelligence] compute failed", { leadId, err });
  });
}
