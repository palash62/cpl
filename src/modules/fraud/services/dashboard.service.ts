import { prisma } from "@/lib/prisma";

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
    prisma.publisherProfile.count({ where: { qualityScore: { lt: 50 } } }),
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

export async function listHighRiskLeads(page = 1, limit = 20, minRisk = 21) {
  const skip = (page - 1) * limit;
  const where = { riskScore: { gte: minRisk } as const };

  const [data, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        campaign: { select: { name: true } },
        publisher: { select: { name: true, email: true } },
        validationResults: { orderBy: { rule: "asc" } },
      },
      orderBy: { riskScore: "desc" },
      skip,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
}
