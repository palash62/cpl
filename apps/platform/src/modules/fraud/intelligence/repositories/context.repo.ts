import { prisma } from "@/lib/prisma";

export type ContextLeadRow = {
  id: string;
  createdAt: Date;
  ip: string | null;
  deviceFingerprint: string | null;
  publisherId: string;
  campaignId: string;
  source: string | null;
  status: string;
  riskScore: number | null;
  data: unknown;
};

const CONTEXT_SELECT = {
  id: true,
  createdAt: true,
  ip: true,
  deviceFingerprint: true,
  publisherId: true,
  campaignId: true,
  source: true,
  status: true,
  riskScore: true,
  data: true,
} as const;

export function extractEmail(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const email = (data as Record<string, unknown>).email;
  if (typeof email !== "string" || !email.trim()) return null;
  return email.trim().toLowerCase();
}

export function extractPhone(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const phone = (data as Record<string, unknown>).phone;
  if (typeof phone !== "string" || !phone.trim()) return null;
  return phone.replace(/\D/g, "") || null;
}

export function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}***@${domain}`;
}

function sinceMs(ms: number, from = new Date()) {
  return new Date(from.getTime() - ms);
}

export async function loadLeadsByIp(ip: string, lookbackDays = 7): Promise<ContextLeadRow[]> {
  return prisma.lead.findMany({
    where: {
      ip,
      isTest: false,
      createdAt: { gte: sinceMs(lookbackDays * 24 * 60 * 60 * 1000) },
    },
    select: CONTEXT_SELECT,
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

export async function loadLeadsByDevice(
  deviceFingerprint: string,
  lookbackDays = 7,
): Promise<ContextLeadRow[]> {
  return prisma.lead.findMany({
    where: {
      deviceFingerprint,
      isTest: false,
      createdAt: { gte: sinceMs(lookbackDays * 24 * 60 * 60 * 1000) },
    },
    select: CONTEXT_SELECT,
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

export async function loadLeadsByPublisher(
  publisherId: string,
  lookbackDays = 7,
): Promise<ContextLeadRow[]> {
  return prisma.lead.findMany({
    where: {
      publisherId,
      isTest: false,
      createdAt: { gte: sinceMs(lookbackDays * 24 * 60 * 60 * 1000) },
    },
    select: CONTEXT_SELECT,
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
}

export async function loadLeadsBySource(
  source: string,
  lookbackDays = 7,
): Promise<ContextLeadRow[]> {
  return prisma.lead.findMany({
    where: {
      source,
      isTest: false,
      createdAt: { gte: sinceMs(lookbackDays * 24 * 60 * 60 * 1000) },
    },
    select: CONTEXT_SELECT,
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
}

export async function loadLeadsByCampaign(
  campaignId: string,
  lookbackDays = 7,
): Promise<ContextLeadRow[]> {
  return prisma.lead.findMany({
    where: {
      campaignId,
      isTest: false,
      createdAt: { gte: sinceMs(lookbackDays * 24 * 60 * 60 * 1000) },
    },
    select: CONTEXT_SELECT,
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
}

export function countInWindow(rows: ContextLeadRow[], windowMs: number, now = new Date()) {
  const since = now.getTime() - windowMs;
  return rows.filter((r) => r.createdAt.getTime() >= since).length;
}

export function filterWindow(rows: ContextLeadRow[], windowMs: number, now = new Date()) {
  const since = now.getTime() - windowMs;
  return rows.filter((r) => r.createdAt.getTime() >= since);
}

export function uniqueCount(values: Array<string | null | undefined>) {
  return new Set(values.filter(Boolean) as string[]).size;
}

export const MS = {
  ONE_MIN: 60_000,
  FIVE_MIN: 5 * 60_000,
  ONE_HOUR: 60 * 60_000,
  ONE_DAY: 24 * 60 * 60_000,
  SEVEN_DAYS: 7 * 24 * 60 * 60_000,
} as const;

export async function upsertLeadFraudIntelligence(input: {
  leadId: string;
  contextualRiskScore: number;
  contextualRiskLevel: string;
  signals: unknown;
  explanation: unknown;
  ipContext: unknown;
  deviceContext: unknown;
}) {
  return prisma.leadFraudIntelligence.upsert({
    where: { leadId: input.leadId },
    create: {
      leadId: input.leadId,
      contextualRiskScore: input.contextualRiskScore,
      contextualRiskLevel: input.contextualRiskLevel,
      signals: input.signals as object,
      explanation: input.explanation as object,
      ipContext: input.ipContext as object | undefined,
      deviceContext: input.deviceContext as object | undefined,
      computedAt: new Date(),
    },
    update: {
      contextualRiskScore: input.contextualRiskScore,
      contextualRiskLevel: input.contextualRiskLevel,
      signals: input.signals as object,
      explanation: input.explanation as object,
      ipContext: input.ipContext as object | undefined,
      deviceContext: input.deviceContext as object | undefined,
      computedAt: new Date(),
    },
  });
}

export async function getLeadFraudIntelligence(leadId: string) {
  return prisma.leadFraudIntelligence.findUnique({ where: { leadId } });
}
