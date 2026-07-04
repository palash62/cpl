import { getFraudConfig } from "../config/load-config";
import { runAllRules } from "../rules";
import { aggregateRiskScore } from "../scoring/aggregate";
import { decideFraud } from "../scoring/decide";
import { isIpBlocked } from "../repositories/blocklist.repo";
import {
  getLatestClickIp,
  loadDuplicateContext,
} from "../repositories/duplicate.repo";
import { lookupIpCountry } from "../providers/registry";
import type { FraudEvaluationContext } from "../types/context";
import type { FraudEvaluationResult, SubmissionMeta } from "../types/result";

export type EvaluateLeadInput = {
  campaignId: string;
  publisherId: string;
  trackingLinkId?: string;
  data: Record<string, string>;
  ip?: string;
  userAgent?: string;
  country?: string;
  deviceFingerprint?: string;
  submissionMeta?: SubmissionMeta;
  honeypot?: string;
  targeting?: Record<string, unknown>;
  duplicateWindowDays: number;
};

export async function evaluateLead(input: EvaluateLeadInput): Promise<FraudEvaluationResult> {
  const config = await getFraudConfig();
  const ipBlocked = input.ip ? await isIpBlocked(input.ip) : false;

  const { existingEmails, existingPhones, existingIps, existingFingerprints } =
    await loadDuplicateContext(
      input.campaignId,
      input.duplicateWindowDays,
      config.duplicateIpWindowHours,
    );

  const geoCountry = input.ip ? await lookupIpCountry(input.ip) : undefined;
  const clickIp = await getLatestClickIp(input.trackingLinkId);

  const ctx: FraudEvaluationContext = {
    campaignId: input.campaignId,
    publisherId: input.publisherId,
    data: input.data,
    ip: input.ip,
    userAgent: input.userAgent,
    country: input.country,
    geoCountry,
    deviceFingerprint: input.deviceFingerprint,
    submissionMeta: input.submissionMeta,
    honeypot: input.honeypot,
    targeting: input.targeting,
    existingEmails,
    existingPhones,
    existingIps,
    existingFingerprints,
    ipBlocked,
    clickIp,
  };

  const outcomes = await runAllRules(ctx, config);
  const riskScore = aggregateRiskScore(outcomes);
  const decision = decideFraud(riskScore, outcomes, config);

  return {
    riskScore,
    fraudDecision: decision.fraudDecision,
    outcomes,
    hardReject: decision.hardReject,
    rejectReason: decision.rejectReason,
    geoCountry,
  };
}
