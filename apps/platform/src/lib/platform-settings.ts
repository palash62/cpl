import type { PayoutMethod } from "@prisma/client";
import type { CountryTier, TierPayoutRange } from "@cpl/shared";

export {
  calculatePublisherPayout,
  estimateTierPayout,
  resolveCountryTier,
  TIER_COUNTRIES,
  type CountryTier,
  type TierPayoutRange,
  type PayoutCalculationSettings,
} from "@cpl/shared";

export type PlatformSettingsConfig = {
  publisherPayoutPercent: number;
  /** @deprecated Use method-specific minimums */
  minPayoutAmount: number;
  minPayoutWise: number;
  minPayoutBankTransfer: number;
  minPayoutStripeConnect: number;
  tier1: TierPayoutRange;
  tier2: TierPayoutRange;
  tier3: TierPayoutRange;
  globalLinkUrl: string | null;
  duplicateWindowDays: number;
};

const DEFAULTS: PlatformSettingsConfig = {
  publisherPayoutPercent: 70,
  minPayoutAmount: 50,
  minPayoutWise: 50,
  minPayoutBankTransfer: 100,
  minPayoutStripeConnect: 50,
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

function readNumber(map: Record<string, unknown>, key: string, fallback: number): number {
  const value = Number(map[key]);
  return Number.isFinite(value) ? value : fallback;
}

export function parsePlatformSettings(map: Record<string, unknown>): PlatformSettingsConfig {
  const publisherPayoutPercent = Number(map.publisher_payout_percent);
  const minPayoutAmount = Number(map.min_payout_amount);
  const duplicateWindowDays = Number(map.duplicate_window_days);
  const legacyMin = Number.isFinite(minPayoutAmount) ? minPayoutAmount : DEFAULTS.minPayoutAmount;

  return {
    publisherPayoutPercent: Number.isFinite(publisherPayoutPercent)
      ? publisherPayoutPercent
      : DEFAULTS.publisherPayoutPercent,
    minPayoutAmount: legacyMin,
    minPayoutWise: readNumber(map, "min_payout_wise", legacyMin || DEFAULTS.minPayoutWise),
    minPayoutBankTransfer: readNumber(map, "min_payout_bank_transfer", legacyMin || DEFAULTS.minPayoutBankTransfer),
    minPayoutStripeConnect: readNumber(map, "min_payout_stripe_connect", legacyMin || DEFAULTS.minPayoutStripeConnect),
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

export function getMinPayoutForMethod(
  method: PayoutMethod | string,
  settings: PlatformSettingsConfig,
): number {
  switch (method) {
    case "WISE":
      return settings.minPayoutWise;
    case "BANK_TRANSFER":
      return settings.minPayoutBankTransfer;
    case "STRIPE_CONNECT":
      return settings.minPayoutStripeConnect;
    default:
      return settings.minPayoutAmount;
  }
}

export function platformSettingsToUpdates(
  data: Partial<{
    publisherPayoutPercent: number;
    minPayoutAmount: number;
    minPayoutWise: number;
    minPayoutBankTransfer: number;
    minPayoutStripeConnect: number;
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
  if (data.minPayoutWise !== undefined) {
    updates.push({ key: "min_payout_wise", value: data.minPayoutWise });
  }
  if (data.minPayoutBankTransfer !== undefined) {
    updates.push({ key: "min_payout_bank_transfer", value: data.minPayoutBankTransfer });
  }
  if (data.minPayoutStripeConnect !== undefined) {
    updates.push({ key: "min_payout_stripe_connect", value: data.minPayoutStripeConnect });
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
    minPayoutWise: config.minPayoutWise,
    minPayoutBankTransfer: config.minPayoutBankTransfer,
    minPayoutStripeConnect: config.minPayoutStripeConnect,
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
