export type ContextualRiskLevel = "low" | "medium" | "high" | "critical";
export type SignalSeverity = "low" | "medium" | "high" | "critical";
export type TrustLevel = "high" | "medium" | "low";

export type IpContext = {
  leadsLast5Min: number;
  leadsLast1Hour: number;
  leadsLast24Hours: number;
  leadsLast7Days: number;
  uniqueEmails24Hours: number;
  uniquePhones24Hours: number;
  uniqueDevices24Hours: number;
  uniquePublishers24Hours: number;
  uniqueSources24Hours: number;
  uniqueCampaigns24Hours: number;
  sharedIpLikely: boolean;
  suspiciousVelocity: boolean;
};

export type DeviceContext = {
  leadsLastHour: number;
  leadsLast24Hours: number;
  uniqueEmails: number;
  uniquePhones: number;
  uniqueIPs: number;
  uniquePublishers: number;
  uniqueSources: number;
  flags: string[];
};

export type VelocitySignal = {
  entity: "ip" | "device" | "publisher" | "source" | "campaign";
  window: "1m" | "5m" | "1h";
  count: number;
  severity: SignalSeverity;
};

export type ClusterSignal = {
  type: string;
  severity: SignalSeverity;
  evidence: Record<string, unknown>;
};

export type IntelligenceExplanationItem = {
  signal: string;
  severity: SignalSeverity;
  window?: string;
  text: string;
  advertiserSafe: boolean;
};

export type IntelligenceExplanation = {
  summary: string;
  advertiserSummary: string;
  items: IntelligenceExplanationItem[];
};

export type ContextualRiskResult = {
  score: number;
  level: ContextualRiskLevel;
  signals: {
    velocity: VelocitySignal[];
    clusters: ClusterSignal[];
    flags: string[];
  };
  ipContext: IpContext | null;
  deviceContext: DeviceContext | null;
  explanation: IntelligenceExplanation;
  calculatedAt: string;
};

export type AdvertiserTrustView = {
  trustLevel: TrustLevel;
  trustSummary: string;
  trustItems: Array<{ label: string; ok: boolean }>;
};

export type LeadTimelineEntry = {
  leadId: string;
  createdAt: string;
  emailMasked: string | null;
  ip: string | null;
  deviceFingerprint: string | null;
  riskScore: number | null;
  status: string;
  relation: "current" | "same_ip" | "same_device";
};

export type LeadIntelligenceInvestigation = {
  leadId: string;
  contextual: ContextualRiskResult | null;
  pending: boolean;
  timeline: LeadTimelineEntry[];
  riskScore: number | null;
  fraudDecision: string | null;
};
