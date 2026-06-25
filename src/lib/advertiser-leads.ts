export function shortCampaignId(id: string) {
  return id.slice(-8).toUpperCase();
}

export function formatLeadLogData(data: unknown): string {
  if (!data || typeof data !== "object") return "";

  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

export function formatLeadMessage(lead: {
  status: string;
  validationResults: Array<{ passed: boolean; rule: string; details: string | null }>;
  statusHistory: Array<{ reason: string | null; toStatus: string }>;
}): string {
  const reason = lead.statusHistory.find((entry) => entry.reason)?.reason;
  if (reason) return reason;

  if (lead.status === "REJECTED") {
    const failed = lead.validationResults.find((result) => !result.passed);
    return failed?.details ?? failed?.rule ?? "Validation failed";
  }

  if (lead.status === "PENDING") return "Awaiting advertiser review";
  if (lead.status === "APPROVED") return "Lead approved";
  if (lead.status === "PAID") return "Lead paid";
  if (lead.status === "VALIDATING") return "Validating submission";
  if (lead.status === "CAPTURED") return "Lead captured";

  return "—";
}
