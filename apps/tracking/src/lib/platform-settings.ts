import { calculatePublisherPayout, resolveCountryTier } from "@cpl/shared";

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
  const resolvedMin = Number.isFinite(min) ? min : fallback.min;
  const resolvedMax = Number.isFinite(max) ? max : fallback.max;
  return resolvedMin <= resolvedMax
    ? { min: resolvedMin, max: resolvedMax }
    : { min: resolvedMax, max: resolvedMin };
}

function readPercent(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const percent = Number(value);
  return Number.isFinite(percent) && percent >= 0 && percent <= 100 ? percent : null;
}

export function parsePlatformSettings(map: Record<string, unknown>): PlatformSettingsConfig {
  const configuredPublisherPercent = readPercent(map.publisher_payout_percent);
  const legacyPlatformFeePercent = readPercent(map.platform_fee_percent);
  const publisherPayoutPercent =
    configuredPublisherPercent ??
    (legacyPlatformFeePercent === null
      ? DEFAULTS.publisherPayoutPercent
      : 100 - legacyPlatformFeePercent);
  const minPayoutAmount = Number(map.min_payout_amount);
  const duplicateWindowDays = Number(map.duplicate_window_days);

  return {
    publisherPayoutPercent,
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

export { calculatePublisherPayout, resolveCountryTier };
