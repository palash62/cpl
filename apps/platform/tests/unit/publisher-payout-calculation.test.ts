import { describe, expect, it } from "vitest";
import { calculatePublisherPayout } from "@cpl/shared";
import type { PayoutCalculationSettings } from "@cpl/shared";

const settings: PayoutCalculationSettings = {
  publisherPayoutPercent: 70,
  tier1: { min: 0.7, max: 2.5 },
  tier2: { min: 0.5, max: 1.8 },
  tier3: { min: 0.25, max: 1.0 },
};

describe("calculatePublisherPayout (@cpl/shared)", () => {
  it("applies 70% for tier1 US lead", () => {
    const result = calculatePublisherPayout(1, "US", settings);
    expect(result.publisherAmount).toBe(0.7);
    expect(result.platformFee).toBe(0.3);
    expect(result.tier).toBe("tier1");
  });

  it("caps publisher payout at CPL when tier floor exceeds CPL", () => {
    const result = calculatePublisherPayout(0.5, "US", settings);
    expect(result.publisherAmount).toBe(0.5);
    expect(result.platformFee).toBe(0);
  });

  it("clamps tier3 lead within tier max", () => {
    const result = calculatePublisherPayout(1, "NG", settings);
    expect(result.publisherAmount).toBe(0.7);
    expect(result.platformFee).toBe(0.3);
    expect(result.tier).toBe("tier3");
  });

  it("uses percent only when country has no tier", () => {
    const result = calculatePublisherPayout(2, "XX", settings);
    expect(result.publisherAmount).toBe(1.4);
    expect(result.platformFee).toBe(0.6);
    expect(result.tier).toBeNull();
  });

  it("returns zero for zero CPL", () => {
    const result = calculatePublisherPayout(0, "US", settings);
    expect(result.publisherAmount).toBe(0);
    expect(result.platformFee).toBe(0);
  });

  it("never returns negative platform fee", () => {
    const result = calculatePublisherPayout(0.5, "US", settings);
    expect(result.platformFee).toBeGreaterThanOrEqual(0);
  });
});

describe("calculatePublisherPayout platform re-export parity", () => {
  it("matches shared module via platform-settings", async () => {
    const { calculatePublisherPayout: platformCalc } = await import("@/lib/platform-settings");
    const shared = calculatePublisherPayout(1.25, "IN", settings);
    const platform = platformCalc(1.25, "IN", {
      ...settings,
      minPayoutAmount: 50,
      minPayoutWise: 50,
      minPayoutBankTransfer: 100,
      minPayoutStripeConnect: 50,
      globalLinkUrl: null,
      duplicateWindowDays: 30,
    });
    expect(platform).toEqual(shared);
  });
});
