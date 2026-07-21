/**
 * Gates advertiser CPA Offer Marketplace visibility.
 *
 * CPA_OFFERS_ADVERTISER_ALLOWLIST:
 * - unset / "*" / "" → live (all advertisers)
 * - "a@x.com,b@y.com" → only those emails (case-insensitive)
 */
export const CPA_OFFERS_DEMO_ADVERTISER_EMAIL = "advertiser@cpl.local";

export function getCpaOffersAdvertiserAllowlist(): string[] | "live" {
  const raw = process.env.CPA_OFFERS_ADVERTISER_ALLOWLIST;
  if (raw === undefined) {
    return "live";
  }
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "*") {
    return "live";
  }
  return trimmed
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isCpaMarketplaceLive(): boolean {
  return getCpaOffersAdvertiserAllowlist() === "live";
}

export function canAdvertiserAccessCpaOffers(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  const allowlist = getCpaOffersAdvertiserAllowlist();
  if (allowlist === "live") return true;
  return allowlist.includes(email.trim().toLowerCase());
}
