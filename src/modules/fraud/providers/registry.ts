import type { RuleOutcome } from "../types/result";
import type { FraudConfig } from "../types/config";
import { DEFAULT_FRAUD_CONFIG } from "../config/defaults";

const VPN_HOSTING_ASN_KEYWORDS = ["hosting", "datacenter", "cloud", "vpn"];

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

/** Optional email validation when FRAUD_EMAIL_API_KEY is set (Abstract API style). */
export async function checkEmailWithProvider(email: string): Promise<RuleOutcome | null> {
  const apiKey = process.env.FRAUD_EMAIL_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const url = `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      is_disposable_email?: { value?: boolean };
      is_role_email?: { value?: boolean };
      deliverability?: string;
    };

    if (data.is_disposable_email?.value) {
      return {
        rule: "disposable_email",
        passed: false,
        riskDelta: DEFAULT_FRAUD_CONFIG.weights.disposable_email,
        hardFail: true,
        details: "Disposable email (provider)",
      };
    }

    if (data.is_role_email?.value) {
      return {
        rule: "role_email",
        passed: false,
        riskDelta: DEFAULT_FRAUD_CONFIG.weights.role_email,
        hardFail: false,
        details: "Role email (provider)",
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function lookupIpCountry(ip: string): Promise<string | undefined> {
  const apiKey = process.env.FRAUD_IP_API_KEY?.trim();
  if (!apiKey) return undefined;
  try {
    const res = await fetch(`https://ipinfo.io/${ip}/json?token=${apiKey}`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { country?: string };
    return data.country?.toUpperCase();
  } catch {
    return undefined;
  }
}
