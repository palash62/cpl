import { getPlatformUrl, getTrackingUrl } from "./env";
import { buildTrackingUrl } from "./smart-link";

export function buildSmartLinkUrl(
  slug: string,
  params?: { src?: string; subId?: string },
  trackingBaseUrl?: string,
) {
  const base = `${trackingBaseUrl ?? getTrackingUrl()}/s/${slug}`;
  return params ? buildTrackingUrl(base, params) : base;
}

export function buildTrackingFormUrl(
  slug: string,
  params?: { src?: string; subId?: string },
  trackingBaseUrl?: string,
) {
  const base = `${trackingBaseUrl ?? getTrackingUrl()}/t/${slug}`;
  return params ? buildTrackingUrl(base, params) : base;
}

export function buildPixelUrl(pixelToken: string, trackingBaseUrl?: string) {
  const base = `${trackingBaseUrl ?? getTrackingUrl()}/api/v1/pixel/${pixelToken}`;
  return `${base}?lead_id={lead_id}&txn_id={txn_id}`;
}

export function buildPixelSnippet(pixelUrl: string) {
  return `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none" />`;
}

export function buildTrackingScriptUrl() {
  return `${getTrackingUrl()}/track.js`;
}

export function buildPlatformLeadSubmitUrl() {
  return `${getPlatformUrl()}/api/internal/v1/leads/submit`;
}

export { getPlatformUrl, getTrackingUrl };
