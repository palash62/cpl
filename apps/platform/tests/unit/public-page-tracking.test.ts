import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPublicTrackingConfig,
  isAcceptedLeadStatus,
  setPublicTrackingConfig,
  trackLeadConversion,
} from "@/lib/tracking/public-page-tracking";

describe("public page tracking", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      fbq: vi.fn(),
      gtag: vi.fn(),
      __cplPublicTrackingConfig: null,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores and clears public tracking config", () => {
    const config = {
      meta: { enabled: true, pixelId: "1234567890" },
      googleAds: null,
    };
    setPublicTrackingConfig(config);
    expect(getPublicTrackingConfig()).toEqual(config);
    setPublicTrackingConfig(null);
    expect(getPublicTrackingConfig()).toBeNull();
  });

  it("treats non-REJECTED statuses as accepted", () => {
    expect(isAcceptedLeadStatus("NEW")).toBe(true);
    expect(isAcceptedLeadStatus(undefined)).toBe(true);
    expect(isAcceptedLeadStatus("REJECTED")).toBe(false);
    expect(isAcceptedLeadStatus("rejected")).toBe(false);
  });

  it("dispatches Meta Lead and Google conversion events", () => {
    setPublicTrackingConfig({
      meta: { enabled: true, pixelId: "1234567890" },
      googleAds: {
        enabled: true,
        conversionId: "AW-987654321",
        conversionLabel: "leadLabel",
      },
    });

    trackLeadConversion({ leadId: "lead_1" });

    expect(window.fbq).toHaveBeenCalledWith(
      "track",
      "Lead",
      {},
      { eventID: "lead_1" },
    );
    expect(window.gtag).toHaveBeenCalledWith("event", "conversion", {
      send_to: "AW-987654321/leadLabel",
      transaction_id: "lead_1",
    });
  });

  it("skips disabled providers and swallows tracking errors", () => {
    setPublicTrackingConfig({
      meta: null,
      googleAds: {
        enabled: true,
        conversionId: "AW-1",
        conversionLabel: "x",
      },
    });
    window.gtag = vi.fn(() => {
      throw new Error("boom");
    });

    expect(() => trackLeadConversion({ leadId: "lead_2" })).not.toThrow();
    expect(window.fbq).not.toHaveBeenCalled();
  });
});
