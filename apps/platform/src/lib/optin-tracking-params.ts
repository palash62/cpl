"use client";

/** Read publisher attribution params forwarded from smart-link redirects. */
export function readOptinTrackingParams(search?: string) {
  const params = new URLSearchParams(
    search ?? (typeof window !== "undefined" ? window.location.search : ""),
  );
  const trackingSlug = params.get("tracking_slug")?.trim() || undefined;
  const source = params.get("src")?.trim() || undefined;
  const subId = params.get("sub_id")?.trim() || undefined;
  return { trackingSlug, source, subId };
}
