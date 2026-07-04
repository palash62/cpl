import type { FraudDecisionType } from "./config";

export type SubmissionMeta = {
  formDurationMs?: number;
  mouseMoveCount?: number;
  keyPressCount?: number;
  pasteCount?: number;
  timezone?: string;
  language?: string;
  screenWxH?: string;
  platform?: string;
};

export type RuleOutcome = {
  rule: string;
  passed: boolean;
  riskDelta: number;
  hardFail: boolean;
  details?: string;
};

export type FraudEvaluationResult = {
  riskScore: number;
  fraudDecision: FraudDecisionType;
  outcomes: RuleOutcome[];
  hardReject: boolean;
  rejectReason?: string;
  geoCountry?: string;
};
