import {
  googleAdsSendTo,
  type PublicPlatformPixelConfig,
} from "@/lib/tracking/platform-pixel-settings";

type FbqFn = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  push?: (...args: unknown[]) => void;
  loaded?: boolean;
  version?: string;
};

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
    dataLayer?: unknown[];
    gtag?: GtagFn;
    __cplPublicTrackingConfig?: PublicPlatformPixelConfig | null;
  }
}

export type LeadConversionPayload = {
  leadId?: string;
};

function safeCall(fn: () => void) {
  try {
    fn();
  } catch {
    // Tracking must never block lead success / redirects.
  }
}

export function setPublicTrackingConfig(config: PublicPlatformPixelConfig | null) {
  if (typeof window === "undefined") return;
  window.__cplPublicTrackingConfig = config;
}

export function getPublicTrackingConfig(): PublicPlatformPixelConfig | null {
  if (typeof window === "undefined") return null;
  return window.__cplPublicTrackingConfig ?? null;
}

export function trackLeadConversion(payload: LeadConversionPayload = {}) {
  const config = getPublicTrackingConfig();
  if (!config) return;

  if (config.meta?.enabled && typeof window !== "undefined" && typeof window.fbq === "function") {
    safeCall(() => {
      if (payload.leadId) {
        window.fbq?.("track", "Lead", {}, { eventID: payload.leadId });
      } else {
        window.fbq?.("track", "Lead");
      }
    });
  }

  if (
    config.googleAds?.enabled &&
    typeof window !== "undefined" &&
    typeof window.gtag === "function"
  ) {
    safeCall(() => {
      window.gtag?.("event", "conversion", {
        send_to: googleAdsSendTo(config.googleAds!),
        ...(payload.leadId ? { transaction_id: payload.leadId } : {}),
      });
    });
  }
}

export function isAcceptedLeadStatus(status: unknown): boolean {
  if (typeof status !== "string") return true;
  return status.toUpperCase() !== "REJECTED";
}
