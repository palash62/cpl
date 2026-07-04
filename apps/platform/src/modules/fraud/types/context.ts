import type { SubmissionMeta } from "./result";

export type FraudEvaluationContext = {
  campaignId: string;
  publisherId: string;
  data: Record<string, string>;
  ip?: string;
  userAgent?: string;
  country?: string;
  geoCountry?: string;
  deviceFingerprint?: string;
  submissionMeta?: SubmissionMeta;
  honeypot?: string;
  targeting?: Record<string, unknown>;
  existingEmails: string[];
  existingPhones: string[];
  existingIps: string[];
  existingFingerprints: string[];
  ipBlocked: boolean;
  clickIp?: string;
};
