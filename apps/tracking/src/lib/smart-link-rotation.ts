import type { Campaign } from "@prisma/client";
import { TIER_COUNTRIES, type CountryTier } from "./tiers";

export type CampaignTargetingGeo = {
  trafficMode?: "allow" | "block";
  countries?: string[];
  blacklistedCountries?: string[];
};

export function parseCampaignTargeting(targeting: unknown): CampaignTargetingGeo {
  if (!targeting || typeof targeting !== "object") return {};
  const t = targeting as Record<string, unknown>;
  return {
    trafficMode: t.trafficMode === "block" ? "block" : "allow",
    countries: Array.isArray(t.countries)
      ? t.countries.map((c) => String(c).toUpperCase())
      : [],
    blacklistedCountries: Array.isArray(t.blacklistedCountries)
      ? t.blacklistedCountries.map((c) => String(c).toUpperCase())
      : [],
  };
}

export function campaignAcceptsCountry(targeting: unknown, countryCode?: string): boolean {
  const parsed = parseCampaignTargeting(targeting);
  const trafficMode = parsed.trafficMode ?? "allow";
  const countries = parsed.countries ?? [];
  const blacklistedCountries = parsed.blacklistedCountries ?? [];
  const country = countryCode?.trim().toUpperCase();

  if (!country) {
    // Unknown geo (missing IP lookup / private IP): do not drop country-targeted
    // campaigns, or smart links fall through to the global fallback URL.
    return true;
  }

  if (trafficMode === "block") {
    return !blacklistedCountries.includes(country);
  }

  if (countries.length === 0) return true;
  return countries.includes(country);
}

export function filterCampaignsByCountry<T extends Pick<Campaign, "targeting">>(
  campaigns: T[],
  countryCode?: string,
): T[] {
  return campaigns.filter((c) => campaignAcceptsCountry(c.targeting, countryCode));
}

type RotatableCampaign = Pick<Campaign, "id" | "advertiserId">;

export function pickCampaignForIpRotation<T extends RotatableCampaign>(
  eligible: T[],
  shownCampaignIds: string[],
  rotationCursor: number,
): T | null {
  if (eligible.length === 0) return null;

  const lastShownId = shownCampaignIds[0];
  const lastAdvertiserId = eligible.find((c) => c.id === lastShownId)?.advertiserId;

  let pool = eligible.filter((c) => !shownCampaignIds.includes(c.id));

  if (pool.length === 0) {
    pool = eligible.filter((c) => c.advertiserId !== lastAdvertiserId);
    if (pool.length === 0) pool = eligible.filter((c) => c.id !== lastShownId);
    if (pool.length === 0) pool = eligible;
  } else if (lastAdvertiserId) {
    const differentAdvertiser = pool.filter((c) => c.advertiserId !== lastAdvertiserId);
    if (differentAdvertiser.length > 0) pool = differentAdvertiser;
  }

  const index = rotationCursor % pool.length;
  return pool[index] ?? null;
}

export function campaignExcludesBlockedPublishers(targeting: unknown): boolean {
  if (!targeting || typeof targeting !== "object") return false;
  return Boolean((targeting as Record<string, unknown>).excludeBlockedPublishers);
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
