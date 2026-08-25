import { createHmac } from "crypto";

/** Opaque advertiser-facing source IDs use HMAC so raw `src` tags stay private. */
export const SOURCE_BID_MIN_RATIO = 0.5;
export const SOURCE_BID_MAX_RATIO = 2;
export const SOURCE_BID_ABSOLUTE_FLOOR = 0.01;

export function normalizeSourceTag(source: string | null | undefined): string {
  const trimmed = source?.trim().toLowerCase() ?? "";
  return trimmed || "unknown";
}

export function getSourceTokenSecret(): string {
  return (
    process.env.SOURCE_ID_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    "dev-source-token-secret-change-me"
  );
}

/**
 * Deterministic opaque token for (advertiser, publisher, source).
 * Different publishers with the same raw source get different tokens.
 */
export function buildSourceToken(
  advertiserId: string,
  publisherId: string,
  source: string | null | undefined,
  secret: string = getSourceTokenSecret(),
): string {
  const payload = `${advertiserId}\0${publisherId}\0${normalizeSourceTag(source)}`;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Short display ID shown to advertisers (not reversible to the raw source). */
export function formatSourceDisplayId(sourceToken: string): string {
  return `SRC-${sourceToken.slice(0, 12).toUpperCase()}`;
}

export function clampSourceBid(campaignCpl: number, requestedCpl: number): number {
  const floor = Math.max(SOURCE_BID_ABSOLUTE_FLOOR, campaignCpl * SOURCE_BID_MIN_RATIO);
  const ceiling = Math.max(floor, campaignCpl * SOURCE_BID_MAX_RATIO);
  const value = Number(requestedCpl);
  if (!Number.isFinite(value)) {
    throw new Error("Invalid source bid");
  }
  return Math.min(ceiling, Math.max(floor, Math.round(value * 100) / 100));
}

export function sourceBidLimits(campaignCpl: number): { min: number; max: number } {
  const min = Math.max(SOURCE_BID_ABSOLUTE_FLOOR, campaignCpl * SOURCE_BID_MIN_RATIO);
  const max = Math.max(min, campaignCpl * SOURCE_BID_MAX_RATIO);
  return {
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
  };
}
