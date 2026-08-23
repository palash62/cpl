import type { FraudIntelligenceConfig, FraudIntelligenceVelocityThresholds } from "../types/config";
import type { SignalSeverity, VelocitySignal } from "./types";
import { countInWindow, MS, type ContextLeadRow } from "./repositories/context.repo";

function severityFor(count: number, thresholds: FraudIntelligenceVelocityThresholds): SignalSeverity | null {
  if (count >= thresholds.per1Min * 2 || count >= thresholds.per5Min * 2) return "critical";
  if (count >= thresholds.per1Hour) return "high";
  if (count >= thresholds.per5Min) return "medium";
  if (count >= thresholds.per1Min) return "low";
  return null;
}

function pushIfTriggered(
  out: VelocitySignal[],
  entity: VelocitySignal["entity"],
  rows: ContextLeadRow[],
  thresholds: FraudIntelligenceVelocityThresholds,
  now: Date,
) {
  const windows: Array<{ window: VelocitySignal["window"]; ms: number }> = [
    { window: "1m", ms: MS.ONE_MIN },
    { window: "5m", ms: MS.FIVE_MIN },
    { window: "1h", ms: MS.ONE_HOUR },
  ];

  for (const { window, ms } of windows) {
    const count = countInWindow(rows, ms, now);
    const severity = severityFor(count, thresholds);
    if (!severity) continue;
    // Prefer the tightest window that already trips a threshold
    if (window === "1m" && count < thresholds.per1Min) continue;
    if (window === "5m" && count < thresholds.per5Min) continue;
    if (window === "1h" && count < thresholds.per1Hour) continue;
    out.push({ entity, window, count, severity });
  }
}

export function buildVelocitySignals(input: {
  ipRows: ContextLeadRow[];
  deviceRows: ContextLeadRow[];
  publisherRows: ContextLeadRow[];
  sourceRows: ContextLeadRow[];
  campaignRows: ContextLeadRow[];
  config: FraudIntelligenceConfig;
  now?: Date;
}): VelocitySignal[] {
  const now = input.now ?? new Date();
  const out: VelocitySignal[] = [];
  const { velocity } = input.config;

  if (input.ipRows.length) pushIfTriggered(out, "ip", input.ipRows, velocity.ip, now);
  if (input.deviceRows.length) pushIfTriggered(out, "device", input.deviceRows, velocity.device, now);
  if (input.publisherRows.length) {
    pushIfTriggered(out, "publisher", input.publisherRows, velocity.publisher, now);
  }
  if (input.sourceRows.length) pushIfTriggered(out, "source", input.sourceRows, velocity.source, now);
  if (input.campaignRows.length) {
    pushIfTriggered(out, "campaign", input.campaignRows, velocity.campaign, now);
  }

  return out;
}
