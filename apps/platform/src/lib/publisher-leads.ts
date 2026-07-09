import { formatLeadMessage } from "@/lib/advertiser-leads";
import {
  calculatePublisherPayout,
  type PlatformSettingsConfig,
} from "@/lib/platform-settings";

/** True when a PAID lead should credit the assigned publisher wallet. */
export function shouldCreditPublisherForLead(lead: {
  publisherId: string;
  trackingLinkId?: string | null;
  campaign: { advertiserId: string };
  publisher?: { role: string } | null;
}): boolean {
  if (lead.publisher?.role === "PUBLISHER") return true;
  if (lead.trackingLinkId) return true;
  return lead.publisherId !== lead.campaign.advertiserId;
}

/** True when a lead should earn publisher payout (smart-link or non-advertiser attribution). */
export function isPublisherEarningLead(lead: {
  publisherId: string;
  trackingLinkId?: string | null;
  campaign: { advertiserId: string };
  publisher?: { role: string } | null;
}): boolean {
  return shouldCreditPublisherForLead(lead);
}

/** @deprecated Use isPublisherEarningLead */
export function isPublisherAttributedLead(lead: {
  publisherId: string;
  trackingLinkId?: string | null;
  campaign: { advertiserId: string };
  publisher?: { role: string } | null;
}): boolean {
  return isPublisherEarningLead(lead);
}

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
  lead: {
    status: string;
    country: string | null;
    campaign: { cpl: number | string | { toString(): string } };
  },
  settings: PlatformSettingsConfig,
  creditedAmount?: number,
): { label: string; className: string } {
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

  if (lead.status === "PAID" || lead.status === "APPROVED") {
    const amount =
      creditedAmount ??
      calculatePublisherPayout(Number(lead.campaign.cpl), lead.country, settings).publisherAmount;
    return {
      label: currency.format(amount),
      className: "font-semibold text-emerald-700",
    };
  }

  if (lead.status === "PENDING" || lead.status === "VALIDATING" || lead.status === "CAPTURED") {
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
