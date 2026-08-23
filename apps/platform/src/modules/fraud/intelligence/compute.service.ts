import { prisma } from "@/lib/prisma";
import { getFraudConfig } from "../config/load-config";
import { buildIpContext } from "./ip-context.service";
import { buildDeviceContext } from "./device-context.service";
import { buildVelocitySignals } from "./velocity.service";
import { buildClusterSignals } from "./identity-cluster.service";
import { computeContextualRiskScore } from "./contextual-score.service";
import { buildExplanation, toAdvertiserTrustView } from "./explainability.service";
import {
  extractEmail,
  loadLeadsByCampaign,
  loadLeadsByDevice,
  loadLeadsByIp,
  loadLeadsByPublisher,
  loadLeadsBySource,
  maskEmail,
  upsertLeadFraudIntelligence,
  getLeadFraudIntelligence,
  MS,
} from "./repositories/context.repo";
import type {
  AdvertiserTrustView,
  ContextualRiskResult,
  LeadIntelligenceInvestigation,
  LeadTimelineEntry,
} from "./types";
import { analyzeSourceRisk } from "./source-risk.service";

/**
 * Observation-only: never called from resolveNextStatus / decideFraud.
 * Safe to fail — errors are logged by scheduleLeadIntelligence.
 */
export async function computeLeadIntelligence(leadId: string): Promise<ContextualRiskResult | null> {
  const config = await getFraudConfig();
  if (!config.intelligence.enabled) return null;

  // observationOnly is enforced: this function never mutates lead status/decision.
  void config.intelligence.observationOnly;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      ip: true,
      deviceFingerprint: true,
      publisherId: true,
      campaignId: true,
      source: true,
      createdAt: true,
      riskScore: true,
      fraudDecision: true,
      validationResults: { select: { rule: true, passed: true } },
    },
  });
  if (!lead) return null;

  const now = lead.createdAt;
  const [ipRows, deviceRows, publisherRows, sourceRows, campaignRows] = await Promise.all([
    lead.ip ? loadLeadsByIp(lead.ip) : Promise.resolve([]),
    lead.deviceFingerprint
      ? loadLeadsByDevice(lead.deviceFingerprint)
      : Promise.resolve([]),
    loadLeadsByPublisher(lead.publisherId),
    lead.source ? loadLeadsBySource(lead.source) : Promise.resolve([]),
    loadLeadsByCampaign(lead.campaignId),
  ]);

  const ipContext = lead.ip ? buildIpContext(ipRows, config.intelligence, now) : null;
  const deviceContext = lead.deviceFingerprint
    ? buildDeviceContext(deviceRows, config.intelligence, now)
    : null;

  const velocity = buildVelocitySignals({
    ipRows,
    deviceRows,
    publisherRows,
    sourceRows,
    campaignRows,
    config: config.intelligence,
    now,
  });

  const clusters = buildClusterSignals({
    ipContext,
    deviceContext,
    publisherRows,
    sourceRows,
    config: config.intelligence,
    now,
  });

  // Attach source insight into cluster evidence path already covered; keep for aggregates.
  void analyzeSourceRisk(lead.source, sourceRows, config.intelligence, now);

  const { score, level, flags } = computeContextualRiskScore({
    ipContext,
    deviceContext,
    velocity,
    clusters,
    config: config.intelligence,
  });

  const explanation = buildExplanation({
    score,
    level,
    ipContext,
    deviceContext,
    velocity,
    clusters,
    flags,
  });

  const result: ContextualRiskResult = {
    score,
    level,
    signals: { velocity, clusters, flags },
    ipContext,
    deviceContext,
    explanation,
    calculatedAt: new Date().toISOString(),
  };

  await upsertLeadFraudIntelligence({
    leadId,
    contextualRiskScore: score,
    contextualRiskLevel: level,
    signals: result.signals,
    explanation: result.explanation,
    ipContext,
    deviceContext,
  });

  return result;
}

export async function getLeadIntelligenceForAdmin(
  leadId: string,
  options?: { recompute?: boolean },
): Promise<LeadIntelligenceInvestigation> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      ip: true,
      deviceFingerprint: true,
      riskScore: true,
      fraudDecision: true,
      createdAt: true,
      data: true,
      status: true,
    },
  });

  if (!lead) {
    return {
      leadId,
      contextual: null,
      pending: true,
      timeline: [],
      riskScore: null,
      fraudDecision: null,
    };
  }

  let stored = await getLeadFraudIntelligence(leadId);
  if (options?.recompute || !stored) {
    await computeLeadIntelligence(leadId);
    stored = await getLeadFraudIntelligence(leadId);
  }

  const since = new Date(lead.createdAt.getTime() - MS.ONE_DAY);
  const related = await prisma.lead.findMany({
    where: {
      isTest: false,
      createdAt: { gte: since, lte: new Date(lead.createdAt.getTime() + MS.ONE_HOUR) },
      OR: [
        lead.ip ? { ip: lead.ip } : undefined,
        lead.deviceFingerprint ? { deviceFingerprint: lead.deviceFingerprint } : undefined,
      ].filter(Boolean) as Array<{ ip?: string; deviceFingerprint?: string }>,
    },
    select: {
      id: true,
      createdAt: true,
      ip: true,
      deviceFingerprint: true,
      riskScore: true,
      status: true,
      data: true,
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  const timeline: LeadTimelineEntry[] = related.map((r) => {
    let relation: LeadTimelineEntry["relation"] = "same_ip";
    if (r.id === lead.id) relation = "current";
    else if (
      lead.deviceFingerprint &&
      r.deviceFingerprint === lead.deviceFingerprint
    ) {
      relation = "same_device";
    } else if (lead.ip && r.ip === lead.ip) {
      relation = "same_ip";
    }
    return {
      leadId: r.id,
      createdAt: r.createdAt.toISOString(),
      emailMasked: maskEmail(extractEmail(r.data)),
      ip: r.ip,
      deviceFingerprint: r.deviceFingerprint,
      riskScore: r.riskScore,
      status: r.status,
      relation,
    };
  });

  const contextual: ContextualRiskResult | null = stored
    ? {
        score: stored.contextualRiskScore,
        level: stored.contextualRiskLevel as ContextualRiskResult["level"],
        signals: stored.signals as ContextualRiskResult["signals"],
        ipContext: (stored.ipContext as ContextualRiskResult["ipContext"]) ?? null,
        deviceContext: (stored.deviceContext as ContextualRiskResult["deviceContext"]) ?? null,
        explanation: stored.explanation as ContextualRiskResult["explanation"],
        calculatedAt: stored.computedAt.toISOString(),
      }
    : null;

  return {
    leadId,
    contextual,
    pending: !stored,
    timeline,
    riskScore: lead.riskScore,
    fraudDecision: lead.fraudDecision,
  };
}

export async function getAdvertiserTrustForLead(leadId: string): Promise<AdvertiserTrustView | null> {
  const config = await getFraudConfig();
  if (!config.intelligence.advertiserVisibility) return null;

  const [stored, lead] = await Promise.all([
    getLeadFraudIntelligence(leadId),
    prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        validationResults: { select: { rule: true, passed: true } },
      },
    }),
  ]);

  if (!stored) return null;

  const explanation = stored.explanation as ContextualRiskResult["explanation"];
  const vpnDetected = lead?.validationResults.some((r) => r.rule === "vpn_proxy" && !r.passed);
  const emailFailed = lead?.validationResults.some(
    (r) => (r.rule === "email_format" || r.rule === "disposable_email") && !r.passed,
  );

  return toAdvertiserTrustView(
    stored.contextualRiskLevel as ContextualRiskResult["level"],
    explanation,
    { vpnDetected, emailOk: !emailFailed },
  );
}
