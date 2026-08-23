export { evaluateLead } from "./services/evaluate.service";
export type { EvaluateLeadInput } from "./services/evaluate.service";

export { getFraudDashboardMetrics, listHighRiskLeads } from "./services/dashboard.service";
export {
  listBlocklistIps,
  addBlocklistIp,
  removeBlocklistIp,
} from "./services/blocklist.service";
export { refreshPublisherQuality, checkCampaignQualityAlert } from "./services/quality.service";
export { getFraudConfig, updateFraudConfig } from "./config/load-config";
export { DEFAULT_FRAUD_CONFIG, FRAUD_SETTINGS_KEY } from "./config/defaults";

export { collectSubmissionSignals, createSignalCollector, attachSignalListeners } from "./client/collect-signals";
export type { FraudEvaluationResult, RuleOutcome, SubmissionMeta } from "./types/result";
export type { FraudConfig, FraudDecisionType, FraudIntelligenceConfig } from "./types/config";

export { recordDeviceSeen } from "./repositories/duplicate.repo";
export { saveValidationResults } from "./repositories/validation.repo";

export {
  scheduleLeadIntelligence,
  computeLeadIntelligence,
  getLeadIntelligenceForAdmin,
  getAdvertiserTrustForLead,
  getCampaignTrustDistribution,
  getPublisherContextualInsight,
  getStoredIntelligence,
} from "./intelligence";
export type {
  ContextualRiskResult,
  AdvertiserTrustView,
  LeadIntelligenceInvestigation,
  TrustLevel,
  ContextualRiskLevel,
} from "./intelligence";
