import { getCountryName } from "@/lib/campaign-form";
import { lookupIpCountry, normalizeClientIp } from "@cpl/shared";

const COUNTRY_KEYS = ["country", "country_code", "countryCode", "nationality"];

const TIMEZONE_COUNTRY: Record<string, string> = {
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Asia/Dhaka": "BD",
  "Asia/Karachi": "PK",
  "Asia/Colombo": "LK",
  "Asia/Kathmandu": "NP",
  "Asia/Singapore": "SG",
  "Asia/Tokyo": "JP",
  "Asia/Shanghai": "CN",
  "Asia/Hong_Kong": "HK",
  "Asia/Seoul": "KR",
  "Asia/Bangkok": "TH",
  "Asia/Jakarta": "ID",
  "Asia/Manila": "PH",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Dubai": "AE",
  "Asia/Riyadh": "SA",
  "Asia/Jerusalem": "IL",
  "Europe/London": "GB",
  "Europe/Dublin": "IE",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Lisbon": "PT",
  "Europe/Warsaw": "PL",
  "Europe/Prague": "CZ",
  "Europe/Budapest": "HU",
  "Europe/Bucharest": "RO",
  "Europe/Athens": "GR",
  "Europe/Istanbul": "TR",
  "Europe/Kiev": "UA",
  "Europe/Zurich": "CH",
  "Europe/Vienna": "AT",
  "Europe/Stockholm": "SE",
  "Europe/Oslo": "NO",
  "Europe/Copenhagen": "DK",
  "Europe/Helsinki": "FI",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Mexico_City": "MX",
  "America/Sao_Paulo": "BR",
  "America/Buenos_Aires": "AR",
  "America/Bogota": "CO",
  "America/Lima": "PE",
  "America/Santiago": "CL",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Pacific/Auckland": "NZ",
  "Africa/Johannesburg": "ZA",
  "Africa/Lagos": "NG",
  "Africa/Cairo": "EG",
  "Africa/Nairobi": "KE",
  "Africa/Accra": "GH",
};

export type LeadCountrySource = {
  data?: unknown;
  country?: string | null;
  geoCountry?: string | null;
  submissionMeta?: unknown;
  ip?: string | null;
};

export function countryFromBrowserLanguage(language?: string): string | undefined {
  const match = language?.trim().match(/[-_]([a-z]{2})$/i);
  if (!match) return undefined;
  return match[1].toUpperCase();
}

export function countryFromTimezone(timezone?: string): string | undefined {
  const tz = timezone?.trim();
  if (!tz) return undefined;
  return TIMEZONE_COUNTRY[tz];
}

export function inferCountryFromSubmissionMeta(submissionMeta?: unknown): string | undefined {
  if (!submissionMeta || typeof submissionMeta !== "object") return undefined;
  const meta = submissionMeta as { timezone?: string; language?: string };
  return countryFromTimezone(meta.timezone) ?? countryFromBrowserLanguage(meta.language);
}

export function countryFromLeadData(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const record = data as Record<string, string>;
  for (const key of COUNTRY_KEYS) {
    const value = record[key]?.trim();
    if (value) return value.toUpperCase();
  }
  return undefined;
}

export function formatLeadCountryDisplay(code?: string | null): string {
  if (!code?.trim()) return "—";
  const normalized = code.trim().toUpperCase();
  return getCountryName(normalized);
}

export function extractLeadCountry(
  data: unknown,
  storedCountry?: string | null,
  geoCountry?: string | null,
  submissionMeta?: unknown,
): string {
  if (storedCountry?.trim()) return formatLeadCountryDisplay(storedCountry);

  const fromData = countryFromLeadData(data);
  if (fromData) return formatLeadCountryDisplay(fromData);

  if (geoCountry?.trim()) return formatLeadCountryDisplay(geoCountry);

  const fromMeta = inferCountryFromSubmissionMeta(submissionMeta);
  if (fromMeta) return formatLeadCountryDisplay(fromMeta);

  return "—";
}

export async function resolveMissingLeadCountry(
  lead: LeadCountrySource,
  lookup: (ip: string) => Promise<string | undefined> = lookupIpCountry,
): Promise<string | undefined> {
  if (lead.country?.trim()) return lead.country.trim().toUpperCase();
  if (lead.geoCountry?.trim()) return lead.geoCountry.trim().toUpperCase();

  const fromData = countryFromLeadData(lead.data);
  if (fromData) return fromData;

  const fromMeta = inferCountryFromSubmissionMeta(lead.submissionMeta);
  if (fromMeta) return fromMeta;

  const ip = normalizeClientIp(lead.ip);
  if (!ip) return undefined;

  return lookup(ip);
}

export type LeadCountryFields = LeadCountrySource & { id: string };

export async function enrichLeadsWithCountry<T extends LeadCountryFields>(
  leads: T[],
  lookup: (ip: string) => Promise<string | undefined> = lookupIpCountry,
  resolveIp?: (lead: T) => string | undefined,
): Promise<T[]> {
  const needsResolution = leads.filter((lead) => !lead.country?.trim() && !lead.geoCountry?.trim());
  if (needsResolution.length === 0) return leads;

  const resolvedByLeadId = new Map<string, string>();
  await Promise.all(
    needsResolution.map(async (lead) => {
      const resolved = await resolveMissingLeadCountry(
        {
          ...lead,
          ip: resolveIp?.(lead) ?? lead.ip,
        },
        lookup,
      );
      if (resolved) resolvedByLeadId.set(lead.id, resolved);
    }),
  );

  if (resolvedByLeadId.size === 0) return leads;

  return leads.map((lead) => {
    const resolved = resolvedByLeadId.get(lead.id);
    if (!resolved) return lead;
    return { ...lead, country: resolved, geoCountry: resolved };
  });
}
