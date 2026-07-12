import { lookupIpCountry as sharedLookupIpCountry } from "@cpl/shared";
import type { RuleOutcome } from "../types/result";
import { DEFAULT_FRAUD_CONFIG } from "../config/defaults";

const VPN_HOSTING_ASN_KEYWORDS = ["hosting", "datacenter", "cloud", "vpn"];
const ELV_VERIFY_URL = "https://apps.emaillistverify.com/api/verifyEmail";

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

/** Map EmailListVerify plain-text status to a fraud rule outcome. */
export function mapEmailListVerifyStatus(status: string): RuleOutcome | null {
  const normalized = status.trim().toLowerCase();

  if (normalized === "ok") return null;

  if (normalized === "disposable") {
    return {
      rule: "disposable_email",
      passed: false,
      riskDelta: DEFAULT_FRAUD_CONFIG.weights.disposable_email,
      hardFail: true,
      details: "Disposable email (EmailListVerify)",
    };
  }

  if (normalized === "role") {
    return {
      rule: "role_email",
      passed: false,
      riskDelta: DEFAULT_FRAUD_CONFIG.weights.role_email,
      hardFail: false,
      details: "Role email (EmailListVerify)",
    };
  }

  if (normalized === "accept_all" || normalized === "ok_for_all") {
    return {
      rule: "role_email",
      passed: false,
      riskDelta: DEFAULT_FRAUD_CONFIG.weights.role_email,
      hardFail: false,
      details: `Catch-all domain (${normalized}, EmailListVerify)`,
    };
  }

  if (
    normalized === "invalid" ||
    normalized === "invalid_mx" ||
    normalized === "email_disabled" ||
    normalized === "dead_server"
  ) {
    return {
      rule: "email_format",
      passed: false,
      riskDelta: 30,
      hardFail: false,
      details: `Invalid email (${normalized}, EmailListVerify)`,
    };
  }

  if (normalized === "unknown") return null;

  return null;
}

/** Optional email validation when FRAUD_EMAIL_API_KEY is set (EmailListVerify). */
export async function checkEmailWithProvider(email: string): Promise<RuleOutcome | null> {
  const apiKey = process.env.FRAUD_EMAIL_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const url = `${ELV_VERIFY_URL}?secret=${encodeURIComponent(apiKey)}&email=${encodeURIComponent(email)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return null;

    const status = await res.text();
    const normalized = status.trim().toLowerCase();

    if (
      normalized === "key_not_valid" ||
      normalized === "incorrect" ||
      normalized === "missing parameters"
    ) {
      console.warn(`[fraud] EmailListVerify error: ${status.trim()}`);
      return null;
    }

    return mapEmailListVerifyStatus(status);
  } catch {
    return null;
  }
}

export async function lookupIpCountry(ip: string): Promise<string | undefined> {
  return sharedLookupIpCountry(ip);
}
