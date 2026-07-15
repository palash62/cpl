export function formatLeadDataSummary(data: unknown): string {
  if (!data || typeof data !== "object") return "—";

  const record = data as Record<string, string>;
  const parts: string[] = [];

  const email = record.email?.trim();
  const firstName = record.first_name?.trim() || record.firstName?.trim();
  const lastName = record.last_name?.trim() || record.lastName?.trim();
  const phone = record.phone?.trim();

  if (email) parts.push(email);
  if (firstName || lastName) parts.push([firstName, lastName].filter(Boolean).join(" "));
  if (phone) parts.push(phone);

  if (parts.length > 0) return parts.join(" · ");

  const entries = Object.entries(record)
    .filter(([, v]) => v?.trim())
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${v.trim()}`);

  return entries.length > 0 ? entries.join(" · ") : "—";
}

export function formatAdvertiserLeadCpl(status: string, cpl: number, isTest = false): string {
  if (isTest) {
    return "Test";
  }
  if (status === "PAID" || status === "APPROVED") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cpl);
  }
  if (status === "PENDING" || status === "VALIDATING" || status === "CAPTURED") {
    return "Pending";
  }
  return "—";
}
