import { formatLeadMessage } from "@/lib/advertiser-leads";

export function shortLeadId(id: string) {
  return id.slice(-8).toUpperCase();
}

const COUNTRY_KEYS = ["country", "country_code", "countryCode", "nationality"];

export function extractLeadCountry(
  data: unknown,
  storedCountry?: string | null,
): string {
  if (storedCountry?.trim()) return storedCountry.trim();

  if (!data || typeof data !== "object") return "—";

  const record = data as Record<string, string>;
  for (const key of COUNTRY_KEYS) {
    const value = record[key]?.trim();
    if (value) return value;
  }

  return "—";
}

export function parseUserAgent(userAgent?: string | null): { device: string; os: string } {
  if (!userAgent?.trim()) {
    return { device: "—", os: "—" };
  }

  const ua = userAgent;
  const isTablet = /ipad|tablet|kindle|playbook/i.test(ua);
  const isMobile = isTablet || /mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua);
  const device = isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop";

  let os = "Unknown";
  if (/windows nt/i.test(ua)) os = "Windows";
  else if (/mac os x|macintosh/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod|ios/i.test(ua)) os = "iOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/cros/i.test(ua)) os = "Chrome OS";

  return { device, os };
}

export function formatPublisherLeadPayout(
  status: string,
  cpl: number,
): { label: string; className: string } {
  if (status === "PAID" || status === "APPROVED") {
    return {
      label: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cpl),
      className: "font-semibold text-emerald-700",
    };
  }

  if (status === "PENDING" || status === "VALIDATING" || status === "CAPTURED") {
    return { label: "Pending", className: "text-amber-700" };
  }

  return { label: "—", className: "text-slate-400" };
}

export function formatLeadRejectReason(lead: {
  status: string;
  validationResults: Array<{ passed: boolean; rule: string; details: string | null }>;
  statusHistory: Array<{ reason: string | null; toStatus: string }>;
}): string {
  if (lead.status !== "REJECTED") return "—";
  return formatLeadMessage(lead);
}
