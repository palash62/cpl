import { lookupIpCountry as sharedLookupIpCountry } from "@cpl/shared";
import {
  fetchEmailListVerifyStatus,
  mapEmailListVerifyStatus,
} from "@/lib/email-deliverability";
import type { RuleOutcome } from "../types/result";
import { DEFAULT_FRAUD_CONFIG } from "../config/defaults";

const VPN_HOSTING_ASN_KEYWORDS = ["hosting", "datacenter", "cloud", "vpn"];

export { mapEmailListVerifyStatus };

/** Optional IPinfo lookup when FRAUD_IP_API_KEY is set. */
export async function checkIpWithProvider(ip: string): Promise<RuleOutcome | null> {
  const apiKey = process.env.FRAUD_IP_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const res = await fetch(`https://ipinfo.io/${ip}/json?token=${apiKey}`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      country?: string;
      privacy?: { vpn?: boolean; proxy?: boolean; tor?: boolean; hosting?: boolean };
      org?: string;
    };

    const org = (data.org ?? "").toLowerCase();
    const isHosting =
      data.privacy?.hosting ||
      VPN_HOSTING_ASN_KEYWORDS.some((k) => org.includes(k));
    const isVpn = data.privacy?.vpn || data.privacy?.proxy || data.privacy?.tor || isHosting;

    if (isVpn) {
      return {
        rule: "vpn_proxy",
        passed: false,
        riskDelta: DEFAULT_FRAUD_CONFIG.weights.vpn_proxy,
        hardFail: false,
        details: "VPN, proxy, or hosting IP detected (IPinfo)",
      };
    }

    return {
      rule: "vpn_proxy",
      passed: true,
      riskDelta: DEFAULT_FRAUD_CONFIG.weights.residential_ip,
      hardFail: false,
      details: `Residential IP (${data.country ?? "unknown"})`,
    };
  } catch {
    return null;
  }
}

export function resolveCountryFromIpProvider(data: { country?: string }) {
  return data.country?.toUpperCase();
}

/** Optional email validation when FRAUD_EMAIL_API_KEY is set (EmailListVerify). */
export async function checkEmailWithProvider(email: string): Promise<RuleOutcome | null> {
  const status = await fetchEmailListVerifyStatus(email);
  if (!status) return null;
  return mapEmailListVerifyStatus(status);
}

export async function lookupIpCountry(ip: string): Promise<string | undefined> {
  return sharedLookupIpCountry(ip);
}
