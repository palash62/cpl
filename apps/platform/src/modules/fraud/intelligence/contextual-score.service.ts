import type { FraudIntelligenceConfig } from "../types/config";
import type {
  ClusterSignal,
  ContextualRiskLevel,
  DeviceContext,
  IpContext,
  VelocitySignal,
} from "./types";

export function scoreToLevel(score: number, config: FraudIntelligenceConfig): ContextualRiskLevel {
  if (score <= config.levels.lowMax) return "low";
  if (score <= config.levels.mediumMax) return "medium";
  if (score <= config.levels.highMax) return "high";
  return "critical";
}

export function computeContextualRiskScore(input: {
  ipContext: IpContext | null;
  deviceContext: DeviceContext | null;
  velocity: VelocitySignal[];
  clusters: ClusterSignal[];
  config: FraudIntelligenceConfig;
}): { score: number; level: ContextualRiskLevel; flags: string[] } {
  const { ipContext, deviceContext, velocity, clusters, config } = input;
  const w = config.contextualWeights;
  let score = 0;
  const flags: string[] = [];

  if (ipContext) {
    if (ipContext.sharedIpLikely && !ipContext.suspiciousVelocity) {
      score += w.sharedIpOnly;
      flags.push("SHARED_IP_LIKELY");
    } else if (
      ipContext.uniqueEmails24Hours >= config.identity.multiEmailDeviceThreshold &&
      ipContext.uniqueDevices24Hours <= 2
    ) {
      score += w.sharedIpManyEmails;
      flags.push("IP_MANY_EMAILS");
    }

    if (ipContext.suspiciousVelocity) {
      score += w.highIpVelocity;
      flags.push("IP_VELOCITY");
    }
  }

  if (deviceContext) {
    if (deviceContext.flags.includes("RAPID_IDENTITY_ROTATION")) {
      score += w.rapidIdentityRotation;
      flags.push(...deviceContext.flags);
    } else if (deviceContext.flags.includes("MULTIPLE_EMAILS_SAME_DEVICE")) {
      if (ipContext && ipContext.uniqueDevices24Hours <= 2) {
        score += w.sameIpSameDeviceManyEmails;
      } else {
        score += Math.round(w.sameIpSameDeviceManyEmails * 0.7);
      }
      flags.push(...deviceContext.flags);
    } else if (deviceContext.flags.length) {
      flags.push(...deviceContext.flags);
    }

    if (velocity.some((v) => v.entity === "device" && (v.severity === "high" || v.severity === "critical"))) {
      score += w.highDeviceVelocity;
      flags.push("DEVICE_VELOCITY");
    }
  }

  for (const cluster of clusters) {
    if (cluster.type === "PUBLISHER_HIGH_RISK_CONCENTRATION") {
      score += w.publisherHighRiskConcentration;
      flags.push(cluster.type);
    }
    if (cluster.type === "SOURCE_HIGH_REJECTION") {
      score += w.sourceHighRejection;
      flags.push(cluster.type);
    }
    if (cluster.type === "SAME_DEVICE_MULTIPLE_IDENTITIES" && cluster.severity === "critical") {
      score = Math.max(score, 75);
    }
  }

  for (const v of velocity) {
    if (v.severity === "critical") score += 15;
    else if (v.severity === "high") score += 8;
  }

  score = Math.min(100, Math.max(0, Math.round(score)));
  return { score, level: scoreToLevel(score, config), flags: [...new Set(flags)] };
}
