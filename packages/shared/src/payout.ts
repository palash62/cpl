export const TIER_COUNTRIES = {
  tier1: ["AU", "CA", "NZ", "GB", "US"],
  tier2: ["AR", "BR", "CL", "IN", "ID", "MY", "MX", "PH", "PL", "ZA", "TH", "TR"],
  tier3: ["BD", "EG", "GH", "KE", "NG", "PK", "LK", "TZ", "UG", "VN", "ZM"],
} as const;

export type CountryTier = keyof typeof TIER_COUNTRIES;

export type TierPayoutRange = {
  min: number;
  max: number;
};

/** Settings required for publisher payout calculation. */
export type PayoutCalculationSettings = {
  publisherPayoutPercent: number;
  tier1: TierPayoutRange;
  tier2: TierPayoutRange;
  tier3: TierPayoutRange;
};

export function resolveCountryTier(countryCode: string | null | undefined): CountryTier | null {
  if (!countryCode?.trim()) return null;
  const code = countryCode.trim().toUpperCase();
  for (const tier of ["tier1", "tier2", "tier3"] as CountryTier[]) {
    if ((TIER_COUNTRIES[tier] as readonly string[]).includes(code)) {
      return tier;
    }
  }
  return null;
}

export function calculatePublisherPayout(
  cpl: number,
  countryCode: string | null | undefined,
  settings: PayoutCalculationSettings,
) {
  const tier = resolveCountryTier(countryCode);

  if (cpl <= 0) {
    return { publisherAmount: 0, platformFee: 0, tier };
  }

  // Publisher payout = CPL × admin-configured publisher payout percent.
  const publisherAmount =
    Math.round(
      Math.min(cpl, (cpl * settings.publisherPayoutPercent) / 100) * 100,
    ) / 100;
  const platformFee = Math.round(Math.max(0, cpl - publisherAmount) * 100) / 100;

  return { publisherAmount, platformFee, tier };
}

export function estimateTierPayout(
  cpl: number,
  tierMin: number,
  tierMax: number,
  publisherPayoutPercent: number,
) {
  if (cpl <= 0) return null;
  const raw = (cpl * publisherPayoutPercent) / 100;
  return Math.min(Math.max(raw, tierMin), tierMax, cpl);
}
