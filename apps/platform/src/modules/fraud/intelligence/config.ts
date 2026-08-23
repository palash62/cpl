import type { FraudIntelligenceConfig } from "../types/config";

export const DEFAULT_INTELLIGENCE_CONFIG: FraudIntelligenceConfig = {
  enabled: true,
  observationOnly: true,
  advertiserVisibility: true,
  minSampleSize: 20,
  velocity: {
    ip: { per1Min: 3, per5Min: 5, per1Hour: 10 },
    device: { per1Min: 3, per5Min: 5, per1Hour: 8 },
    publisher: { per1Min: 20, per5Min: 40, per1Hour: 100 },
    source: { per1Min: 10, per5Min: 25, per1Hour: 60 },
    campaign: { per1Min: 15, per5Min: 40, per1Hour: 120 },
  },
  contextualWeights: {
    sharedIpOnly: 5,
    sharedIpManyEmails: 25,
    sameIpSameDeviceManyEmails: 45,
    rapidIdentityRotation: 55,
    highIpVelocity: 20,
    highDeviceVelocity: 25,
    publisherHighRiskConcentration: 30,
    sourceHighRejection: 25,
  },
  levels: {
    lowMax: 24,
    mediumMax: 49,
    highMax: 74,
  },
  identity: {
    multiEmailDeviceThreshold: 3,
    multiPhoneDeviceThreshold: 3,
    rapidRotationEmails: 5,
    rapidRotationWindowMinutes: 5,
    sharedIpDeviceMin: 3,
    sharedIpEmailMaxRatio: 0.4,
  },
};
