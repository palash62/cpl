import type { CampaignCategory } from "@prisma/client";

export const URL_TOKENS = [
  { token: "{click_id}", highlight: false },
  { token: "{campaign_id}", highlight: true },
  { token: "{provider_id}", highlight: true },
] as const;

export const VERTICALS = [
  { label: "Make Money Online", category: "GENERIC" as CampaignCategory },
  { label: "Finance", category: "FINANCE" as CampaignCategory },
  { label: "Insurance", category: "INSURANCE" as CampaignCategory },
  { label: "Education", category: "EDUCATION" as CampaignCategory },
  { label: "Real Estate", category: "REAL_ESTATE" as CampaignCategory },
] as const;

export const COUNTRY_BY_CODE: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  GB: "United Kingdom",
  AU: "Australia",
  NZ: "New Zealand",
  IE: "Ireland",
  DE: "Germany",
  FR: "France",
  NL: "Netherlands",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  CH: "Switzerland",
  AT: "Austria",
  BE: "Belgium",
  LU: "Luxembourg",
  SG: "Singapore",
  JP: "Japan",
  IT: "Italy",
  ES: "Spain",
  PT: "Portugal",
  PL: "Poland",
  CZ: "Czech Republic",
  SK: "Slovakia",
  HU: "Hungary",
  RO: "Romania",
  GR: "Greece",
  ZA: "South Africa",
  KR: "South Korea",
  TW: "Taiwan",
  HK: "Hong Kong",
  MY: "Malaysia",
  TH: "Thailand",
  IL: "Israel",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  IN: "India",
  BR: "Brazil",
  MX: "Mexico",
  AR: "Argentina",
  CO: "Colombia",
  CL: "Chile",
  PE: "Peru",
  PH: "Philippines",
  ID: "Indonesia",
  VN: "Vietnam",
  PK: "Pakistan",
  BD: "Bangladesh",
  NG: "Nigeria",
  EG: "Egypt",
  TR: "Turkey",
  UA: "Ukraine",
  GH: "Ghana",
  KE: "Kenya",
  LK: "Sri Lanka",
  TZ: "Tanzania",
  UG: "Uganda",
  ZM: "Zambia",
};

export const TIER_COUNTRIES = {
  tier1: ["AU", "CA", "NZ", "GB", "US"],
  tier2: ["AR", "BR", "CL", "IN", "ID", "MY", "MX", "PH", "PL", "ZA", "TH", "TR"],
  tier3: ["BD", "EG", "GH", "KE", "NG", "PK", "LK", "TZ", "UG", "VN", "ZM"],
} as const;

export type CountryTier = keyof typeof TIER_COUNTRIES;

export const TIER_META: Record<
  CountryTier,
  { label: string; accent: string }
> = {
  tier1: { label: "Tier 1", accent: "border-t-emerald-500" },
  tier2: { label: "Tier 2", accent: "border-t-sky-500" },
  tier3: { label: "Tier 3", accent: "border-t-violet-500" },
};

export function getCountryName(code: string) {
  return COUNTRY_BY_CODE[code] ?? code;
}

export function formatTierCountryList(tier: CountryTier) {
  return TIER_COUNTRIES[tier].map((code) => `${getCountryName(code)} (${code})`);
}

export function countriesFromTiers(tiers: CountryTier[]) {
  return Array.from(new Set(tiers.flatMap((tier) => TIER_COUNTRIES[tier])));
}

export const ALL_TIER_COUNTRY_CODES = Array.from(
  new Set(Object.values(TIER_COUNTRIES).flatMap((codes) => [...codes])),
).sort((a, b) => getCountryName(a).localeCompare(getCountryName(b)));

export function formatSelectedCountriesSummary(codes: string[]) {
  if (codes.length === 0) return "All countries";
  if (codes.length <= 3) {
    return codes.map((code) => getCountryName(code)).join(", ");
  }
  return `${codes.length} countries`;
}

/** @deprecated use formatSelectedCountriesSummary with country codes */
export function formatSelectedCountriesSummaryFromTiers(tiers: CountryTier[]) {
  if (tiers.length === 0) return "All countries";
  return tiers.map((t) => TIER_META[t].label).join(", ");
}

export const DEVICE_TYPES = ["Desktop", "Mobile", "Tablet"] as const;

export const OPERATING_SYSTEMS = [
  "Windows",
  "macOS",
  "iOS",
  "Android",
  "Linux",
  "Chrome OS",
] as const;

export function getBidRecommendations(cpl: number) {
  const base = Number.isFinite(cpl) && cpl > 0 ? cpl : 1;
  return {
    minimum: Math.round(base * 0.31 * 100) / 100,
    optimal: Math.round(base * 0.41 * 100) / 100,
    maximum: Math.round(base * 0.52 * 100) / 100,
  };
}

export function formatSummaryDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export const DEFAULT_LEAD_FIELDS = [
  { fieldName: "first_name", label: "First Name", fieldType: "text", required: true },
  { fieldName: "email", label: "Email", fieldType: "email", required: true },
  { fieldName: "phone", label: "Phone", fieldType: "phone", required: true },
] as const;
