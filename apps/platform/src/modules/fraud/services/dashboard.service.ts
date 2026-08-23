import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function getFraudDashboardMetrics() {
  const [
    duplicateLeads,
    vpnLeads,
    disposableEmails,
    highRiskDevices,
    suspiciousPublishers,
    blockedIps,
    riskAgg,
    lowScoreLeads,
    rejectedLeads,
    suspendedUsers,
  ] = await Promise.all([
    prisma.leadValidationResult.count({
      where: {
        rule: { in: ["duplicate_email", "duplicate_phone", "duplicate_ip", "duplicate_device"] },
        passed: false,
      },
    }),
    prisma.leadValidationResult.count({
      where: { rule: "vpn_proxy", passed: false },
    }),
    prisma.leadValidationResult.count({
      where: { rule: "disposable_email", passed: false },
    }),
    prisma.lead.count({ where: { riskScore: { gte: 51 } } }),
    prisma.publisherProfile.count({
      where: {
        OR: [{ qualityScore: { lt: 50 } }, { spamScore: { gte: 51 } }],
      },
    }),
    prisma.ipBlocklist.count(),
    prisma.lead.aggregate({ _avg: { riskScore: true }, where: { riskScore: { not: null } } }),
    prisma.lead.count({ where: { riskScore: { gte: 51 }, status: { not: "REJECTED" } } }),
    prisma.lead.count({ where: { status: "REJECTED" } }),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
  ]);

  const avgRisk = riskAgg._avg.riskScore ?? 0;

  return {
    duplicateLeads,
    vpnLeads,
    disposableEmails,
    highRiskDevices,
    suspiciousPublishers,
    blockedIps,
    spamScoreAvg: Math.round(avgRisk),
    lowScoreLeads,
    rejectedLeads,
    suspendedUsers,
  };
}

function leadHasSignal(
  intelligence: { signals: unknown } | null | undefined,
  signal: string,
): boolean {
  if (!intelligence?.signals || typeof intelligence.signals !== "object") return false;
  const signals = intelligence.signals as {
    flags?: string[];
    clusters?: Array<{ type?: string }>;
    velocity?: Array<{ entity?: string }>;
  };
  if (signals.flags?.includes(signal)) return true;
  if (signals.clusters?.some((c) => c.type === signal)) return true;
  if (signal === "HIGH_IP_VELOCITY" && signals.velocity?.some((v) => v.entity === "ip")) return true;
  if (signal === "HIGH_DEVICE_VELOCITY" && signals.velocity?.some((v) => v.entity === "device")) {
    return true;
  }
  return false;
}

const highRiskInclude = {
  campaign: { select: { name: true } },
  publisher: { select: { name: true, email: true } },
  validationResults: { orderBy: { rule: "asc" as const } },
  fraudIntelligence: true,
} satisfies Prisma.LeadInclude;

export async function listHighRiskLeads(
  page = 1,
  limit = 20,
  minRisk = 21,
  filters?: {
    contextualRiskLevel?: string;
    signal?: string;
  },
) {
  const skip = (page - 1) * limit;
  const where: Prisma.LeadWhereInput = {
    riskScore: { gte: minRisk },
  };

  if (filters?.contextualRiskLevel) {
    where.fraudIntelligence = {
      is: { contextualRiskLevel: filters.contextualRiskLevel },
    };
  } else if (filters?.signal) {
    where.fraudIntelligence = { isNot: null };
  }

  if (filters?.signal) {
    const candidates = await prisma.lead.findMany({
      where,
      include: highRiskInclude,
      orderBy: { riskScore: "desc" },
      take: 300,
    });
    const filtered = candidates.filter((lead) =>
      leadHasSignal(lead.fraudIntelligence, filters.signal!),
    );
    const total = filtered.length;
    const data = filtered.slice(skip, skip + limit);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  const [data, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: highRiskInclude,
      orderBy: { riskScore: "desc" },
      skip,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
}
