export type FraudDecisionType = "auto_approve" | "manual_review" | "auto_reject";

export type FraudRuleWeights = {
  duplicate_email: number;
  duplicate_phone: number;
  duplicate_ip: number;
  duplicate_device: number;
  vpn_proxy: number;
  disposable_email: number;
  role_email: number;
  geo_mismatch: number;
  device_os_mismatch: number;
  fast_submit: number;
  no_mouse: number;
  paste_only: number;
  honeypot: number;
  residential_ip: number;
  click_match: number;
};

export type FraudIntelligenceVelocityThresholds = {
  per1Min: number;
  per5Min: number;
  per1Hour: number;
};

export type FraudIntelligenceConfig = {
  enabled: boolean;
  /** When true (default), contextual scores never affect lead status or fraudDecision. */
  observationOnly: boolean;
  advertiserVisibility: boolean;
  minSampleSize: number;
  velocity: {
    ip: FraudIntelligenceVelocityThresholds;
    device: FraudIntelligenceVelocityThresholds;
    publisher: FraudIntelligenceVelocityThresholds;
    source: FraudIntelligenceVelocityThresholds;
    campaign: FraudIntelligenceVelocityThresholds;
  };
  contextualWeights: {
    sharedIpOnly: number;
    sharedIpManyEmails: number;
    sameIpSameDeviceManyEmails: number;
    rapidIdentityRotation: number;
    highIpVelocity: number;
    highDeviceVelocity: number;
    publisherHighRiskConcentration: number;
    sourceHighRejection: number;
  };
  levels: {
    lowMax: number;
    mediumMax: number;
    highMax: number;
  };
  identity: {
    multiEmailDeviceThreshold: number;
    multiPhoneDeviceThreshold: number;
    rapidRotationEmails: number;
    rapidRotationWindowMinutes: number;
    sharedIpDeviceMin: number;
    sharedIpEmailMaxRatio: number;
  };
};

export type FraudConfig = {
  useRiskDecision: boolean;
  autoApproveMax: number;
  manualReviewMax: number;
  minFormDurationMs: number;
  duplicateIpWindowHours: number;
  enabledRules: Record<string, boolean>;
  weights: FraudRuleWeights;
  intelligence: FraudIntelligenceConfig;
};
