export const TIER_COUNTRIES = {
  tier1: ["AU", "CA", "NZ", "GB", "US"],
  tier2: ["AR", "BR", "CL", "IN", "ID", "MY", "MX", "PH", "PL", "ZA", "TH", "TR"],
  tier3: ["BD", "EG", "GH", "KE", "NG", "PK", "LK", "TZ", "UG", "VN", "ZM"],
} as const;

export type CountryTier = keyof typeof TIER_COUNTRIES;
