import type { FraudIntelligenceConfig } from "../types/config";
import type { ClusterSignal, DeviceContext, IpContext } from "./types";
import {
  extractEmail,
  filterWindow,
  MS,
  uniqueCount,
  type ContextLeadRow,
} from "./repositories/context.repo";

export function buildClusterSignals(input: {
  ipContext: IpContext | null;
  deviceContext: DeviceContext | null;
  publisherRows: ContextLeadRow[];
  sourceRows: ContextLeadRow[];
  config: FraudIntelligenceConfig;
  now?: Date;
}): ClusterSignal[] {
  const { ipContext, deviceContext, config } = input;
  const now = input.now ?? new Date();
  const signals: ClusterSignal[] = [];

  // Pattern A: same IP + many emails + same device
  if (
    ipContext &&
    deviceContext &&
    ipContext.uniqueEmails24Hours >= config.identity.multiEmailDeviceThreshold &&
    deviceContext.uniqueEmails >= config.identity.multiEmailDeviceThreshold &&
    !ipContext.sharedIpLikely
  ) {
    signals.push({
      type: "SAME_IP_SAME_DEVICE_MULTIPLE_EMAILS",
      severity:
        ipContext.uniqueEmails24Hours >= 8 || deviceContext.flags.includes("RAPID_IDENTITY_ROTATION")
          ? "high"
          : "medium",
      evidence: {
        uniqueEmails: ipContext.uniqueEmails24Hours,
        uniqueDevices: ipContext.uniqueDevices24Hours,
        window: "24h",
      },
    });
  }

  // Pattern B: same device + many emails + rapid submissions
  if (deviceContext?.flags.includes("RAPID_IDENTITY_ROTATION")) {
    signals.push({
      type: "SAME_DEVICE_MULTIPLE_IDENTITIES",
      severity: "critical",
      evidence: {
        uniqueEmails: deviceContext.uniqueEmails,
        window: `${config.identity.rapidRotationWindowMinutes}m`,
        leadsLastHour: deviceContext.leadsLastHour,
      },
    });
  } else if (
    deviceContext &&
    deviceContext.uniqueEmails >= config.identity.multiEmailDeviceThreshold
  ) {
    signals.push({
      type: "SAME_DEVICE_MULTIPLE_IDENTITIES",
      severity: deviceContext.uniqueEmails >= 8 ? "high" : "medium",
      evidence: {
        uniqueEmails: deviceContext.uniqueEmails,
        window: "24h",
      },
    });
  }

  // Pattern C: publisher high-risk concentration
  const pubWindow = filterWindow(input.publisherRows, MS.ONE_DAY, now);
  if (pubWindow.length >= config.minSampleSize) {
    const highRisk = pubWindow.filter((r) => (r.riskScore ?? 0) >= 51).length;
    const ratio = highRisk / pubWindow.length;
    if (ratio >= 0.35) {
      signals.push({
        type: "PUBLISHER_HIGH_RISK_CONCENTRATION",
        severity: ratio >= 0.55 ? "high" : "medium",
        evidence: {
          highRiskRatio: Math.round(ratio * 100),
          sampleSize: pubWindow.length,
          window: "24h",
        },
      });
    }
  }

  // Pattern D: source rejection / risk concentration
  const sourceWindow = filterWindow(input.sourceRows, MS.ONE_DAY, now);
  if (sourceWindow.length >= config.minSampleSize) {
    const rejected = sourceWindow.filter((r) => r.status === "REJECTED").length;
    const ratio = rejected / sourceWindow.length;
    if (ratio >= 0.4) {
      signals.push({
        type: "SOURCE_HIGH_REJECTION",
        severity: ratio >= 0.6 ? "high" : "medium",
        evidence: {
          rejectionRatio: Math.round(ratio * 100),
          sampleSize: sourceWindow.length,
          uniqueEmails: uniqueCount(sourceWindow.map((r) => extractEmail(r.data))),
          window: "24h",
        },
      });
    }
  }

  // Shared IP pattern (observational, low severity)
  if (ipContext?.sharedIpLikely && ipContext.leadsLast24Hours >= 3) {
    signals.push({
      type: "SHARED_IP_PATTERN",
      severity: "low",
      evidence: {
        uniqueDevices: ipContext.uniqueDevices24Hours,
        uniqueEmails: ipContext.uniqueEmails24Hours,
        leads: ipContext.leadsLast24Hours,
        window: "24h",
      },
    });
  }

  return signals;
}
