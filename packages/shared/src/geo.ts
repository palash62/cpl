const HEADER_COUNTRY_KEYS = [
  "cf-ipcountry",
  "x-vercel-ip-country",
  "cloudfront-viewer-country",
  "x-appengine-country",
] as const;

const CLIENT_IP_HEADERS = [
  "cf-connecting-ip",
  "true-client-ip",
  "x-real-ip",
  "x-forwarded-for",
] as const;

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

const countryCache = new Map<string, string | undefined>();

export function normalizeClientIp(ip?: string | null): string | undefined {
  const trimmed = ip?.trim();
  if (!trimmed || trimmed.toLowerCase() === "unknown") return undefined;
  return trimmed;
}

export function isPrivateOrLocalIp(ip: string): boolean {
  const normalized = ip.trim().toLowerCase();
  if (normalized === "unknown" || normalized === "localhost") return true;
  if (PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(normalized))) return true;

  const parts = normalized.split(".");
  if (parts.length === 4) {
    const second = Number(parts[1]);
    if (parts[0] === "172" && second >= 16 && second <= 31) return true;
  }

  return false;
}

export function countryFromRequestHeaders(
  headers: { get(name: string): string | null },
): string | undefined {
  for (const key of HEADER_COUNTRY_KEYS) {
    const value = headers.get(key)?.trim().toUpperCase();
    if (value && value !== "XX" && /^[A-Z]{2}$/.test(value)) {
      return value;
    }
  }
  return undefined;
}

async function lookupIpinfo(ip: string, apiKey: string): Promise<string | undefined> {
  try {
    const res = await fetch(`https://ipinfo.io/${ip}/json?token=${apiKey}`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { country?: string };
    return data.country?.trim().toUpperCase() || undefined;
  } catch {
    return undefined;
  }
}

async function lookupIpWhoIs(ip: string): Promise<string | undefined> {
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { success?: boolean; country_code?: string };
    if (!data.success) return undefined;
    return data.country_code?.trim().toUpperCase() || undefined;
  } catch {
    return undefined;
  }
}

async function lookupIpApiFree(ip: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode`,
      { signal: AbortSignal.timeout(2500) },
    );
    if (!res.ok) return undefined;
    const data = (await res.json()) as { status?: string; countryCode?: string };
    if (data.status !== "success") return undefined;
    return data.countryCode?.trim().toUpperCase() || undefined;
  } catch {
    return undefined;
  }
}

export async function lookupIpCountry(ip: string): Promise<string | undefined> {
  const normalized = normalizeClientIp(ip);
  if (!normalized || isPrivateOrLocalIp(normalized)) return undefined;

  if (countryCache.has(normalized)) {
    return countryCache.get(normalized);
  }

  const apiKey = process.env.FRAUD_IP_API_KEY?.trim();
  let country = apiKey ? await lookupIpinfo(normalized, apiKey) : undefined;
  if (!country) {
    country = await lookupIpWhoIs(normalized);
  }
  if (!country) {
    country = await lookupIpApiFree(normalized);
  }

  countryCache.set(normalized, country);
  return country;
}

export function getClientIp(headers: { get(name: string): string | null }): string {
  for (const key of CLIENT_IP_HEADERS) {
    if (key === "x-forwarded-for") {
      const forwarded = normalizeClientIp(headers.get(key)?.split(",")[0]);
      if (forwarded) return forwarded;
      continue;
    }
    const direct = normalizeClientIp(headers.get(key));
    if (direct) return direct;
  }
  return "unknown";
}
