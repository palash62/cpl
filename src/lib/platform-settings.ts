import { TIER_COUNTRIES, type CountryTier } from "@/lib/campaign-form";

export type TierPayoutRange = {
  min: number;
  max: number;
};

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

export function platformSettingsToUpdates(
  data: Partial<{
    publisherPayoutPercent: number;
    minPayoutAmount: number;
    tier1PayoutMin: number;
    tier1PayoutMax: number;
    tier2PayoutMin: number;
    tier2PayoutMax: number;
    tier3PayoutMin: number;
    tier3PayoutMax: number;
    globalLinkUrl?: string | null;
  }>,
) {
  const updates: Array<{ key: string; value: unknown }> = [];

  if (data.publisherPayoutPercent !== undefined) {
    updates.push({ key: "publisher_payout_percent", value: data.publisherPayoutPercent });
  }
  if (data.minPayoutAmount !== undefined) {
    updates.push({ key: "min_payout_amount", value: data.minPayoutAmount });
  }
  if (data.tier1PayoutMin !== undefined) {
    updates.push({ key: "tier1_payout_min", value: data.tier1PayoutMin });
  }
  if (data.tier1PayoutMax !== undefined) {
    updates.push({ key: "tier1_payout_max", value: data.tier1PayoutMax });
  }
  if (data.tier2PayoutMin !== undefined) {
    updates.push({ key: "tier2_payout_min", value: data.tier2PayoutMin });
  }
  if (data.tier2PayoutMax !== undefined) {
    updates.push({ key: "tier2_payout_max", value: data.tier2PayoutMax });
  }
  if (data.tier3PayoutMin !== undefined) {
    updates.push({ key: "tier3_payout_min", value: data.tier3PayoutMin });
  }
  if (data.tier3PayoutMax !== undefined) {
    updates.push({ key: "tier3_payout_max", value: data.tier3PayoutMax });
  }
  if (data.globalLinkUrl !== undefined) {
    updates.push({ key: "global_link_url", value: data.globalLinkUrl ?? "" });
  }

  return updates;
}

export function settingsConfigToApi(config: PlatformSettingsConfig) {
  return {
    publisherPayoutPercent: config.publisherPayoutPercent,
    minPayoutAmount: config.minPayoutAmount,
    tier1PayoutMin: config.tier1.min,
    tier1PayoutMax: config.tier1.max,
    tier2PayoutMin: config.tier2.min,
    tier2PayoutMax: config.tier2.max,
    tier3PayoutMin: config.tier3.min,
    tier3PayoutMax: config.tier3.max,
    globalLinkUrl: config.globalLinkUrl,
  };
}

export type PayoutTiersDisplay = ReturnType<typeof settingsConfigToApi>;

export const TIER_PAYOUT_ROWS = [
  {
    label: "Tier 1",
    countries: "AU, CA, NZ, GB, US",
    minKey: "tier1PayoutMin" as const,
    maxKey: "tier1PayoutMax" as const,
    tier: "tier1" as const,
  },
  {
    label: "Tier 2",
    countries: "AR, BR, CL, IN, ID, MY, MX, PH, PL, ZA, TH, TR",
    minKey: "tier2PayoutMin" as const,
    maxKey: "tier2PayoutMax" as const,
    tier: "tier2" as const,
  },
  {
    label: "Tier 3",
    countries: "BD, EG, GH, KE, NG, PK, LK, TZ, UG, VN, ZM",
    minKey: "tier3PayoutMin" as const,
    maxKey: "tier3PayoutMax" as const,
    tier: "tier3" as const,
  },
];

export function formatUsd(amount: number) {
  return `$${amount.toFixed(2)}`;
}

export function estimateTierPayout(
  cpl: number,
  tierMin: number,
  tierMax: number,
  publisherPayoutPercent: number,
) {
  if (cpl <= 0) return null;
  const raw = (cpl * publisherPayoutPercent) / 100;
  return Math.min(Math.max(raw, tierMin), tierMax);
}
