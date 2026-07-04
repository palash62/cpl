import { TIER_COUNTRIES, type CountryTier } from "./tiers";

export type TierPayoutRange = { min: number; max: number };

export type PlatformSettingsConfig = {
  publisherPayoutPercent: number;
  minPayoutAmount: number;
  tier1: TierPayoutRange;
  tier2: TierPayoutRange;
  tier3: TierPayoutRange;
  globalLinkUrl: string | null;
  duplicateWindowDays: number;
};

const DEFAULTS: PlatformSettingsConfig = {
  publisherPayoutPercent: 70,
  minPayoutAmount: 50,
  tier1: { min: 0.7, max: 2.5 },
  tier2: { min: 0.5, max: 1.8 },
  tier3: { min: 0.25, max: 1.0 },
  globalLinkUrl: null,
  duplicateWindowDays: 30,
};

function readRange(map: Record<string, unknown>, prefix: string, fallback: TierPayoutRange): TierPayoutRange {
  const min = Number(map[`${prefix}_payout_min`]);
  const max = Number(map[`${prefix}_payout_max`]);
  return {
    min: Number.isFinite(min) ? min : fallback.min,
    max: Number.isFinite(max) ? max : fallback.max,
  };
}

export function parsePlatformSettings(map: Record<string, unknown>): PlatformSettingsConfig {
  const publisherPayoutPercent = Number(map.publisher_payout_percent);
  const minPayoutAmount = Number(map.min_payout_amount);
  const duplicateWindowDays = Number(map.duplicate_window_days);

  return {
    publisherPayoutPercent: Number.isFinite(publisherPayoutPercent)
      ? publisherPayoutPercent
      : DEFAULTS.publisherPayoutPercent,
    minPayoutAmount: Number.isFinite(minPayoutAmount) ? minPayoutAmount : DEFAULTS.minPayoutAmount,
    tier1: readRange(map, "tier1", DEFAULTS.tier1),
    tier2: readRange(map, "tier2", DEFAULTS.tier2),
    tier3: readRange(map, "tier3", DEFAULTS.tier3),
    globalLinkUrl:
      typeof map.global_link_url === "string" && map.global_link_url.trim()
        ? map.global_link_url.trim()
        : null,
    duplicateWindowDays: Number.isFinite(duplicateWindowDays)
      ? duplicateWindowDays
      : DEFAULTS.duplicateWindowDays,
  };
}

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

function tierRange(settings: PlatformSettingsConfig, tier: CountryTier): TierPayoutRange {
  if (tier === "tier1") return settings.tier1;
  if (tier === "tier2") return settings.tier2;
  return settings.tier3;
}

export function calculatePublisherPayout(
  cpl: number,
  countryCode: string | null | undefined,
  settings: PlatformSettingsConfig,
) {
  let publisherAmount = (cpl * settings.publisherPayoutPercent) / 100;
  const tier = resolveCountryTier(countryCode);

  if (tier) {
    const range = tierRange(settings, tier);
    publisherAmount = Math.min(Math.max(publisherAmount, range.min), range.max);
  }

  publisherAmount = Math.round(publisherAmount * 100) / 100;
  const platformFee = Math.round((cpl - publisherAmount) * 100) / 100;

  return { publisherAmount, platformFee, tier };
}
