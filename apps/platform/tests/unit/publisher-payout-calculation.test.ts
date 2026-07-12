import { describe, expect, it } from "vitest";
import { calculatePublisherPayout } from "@cpl/shared";
import type { PayoutCalculationSettings } from "@cpl/shared";
import { parsePlatformSettings } from "@/lib/platform-settings";

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

  it("applies 70% for low-CPL tier1 US lead without tier floor bump", () => {
    const result = calculatePublisherPayout(0.5, "US", settings);
    expect(result.publisherAmount).toBe(0.35);
    expect(result.platformFee).toBe(0.15);
  });

  it("applies 70% for $0.60 CPL tier1 US lead", () => {
    const result = calculatePublisherPayout(0.6, "US", settings);
    expect(result.publisherAmount).toBe(0.42);
    expect(result.platformFee).toBe(0.18);
  });


  it("does not round fractional-cent publisher payouts", () => {
    const result = calculatePublisherPayout(0.7, "US", {
      ...settings,
      publisherPayoutPercent: 45,
    });
    expect(result.publisherAmount).toBeCloseTo(0.315, 10);
    expect(result.platformFee).toBeCloseTo(0.385, 10);
  });

  it("uses the configured publisher payout percent from admin settings", () => {
    const result = calculatePublisherPayout(1, "US", {
      ...settings,
      publisherPayoutPercent: 65,
    });
    expect(result.publisherAmount).toBe(0.65);
    expect(result.platformFee).toBe(0.35);
  });

  it("never pays more than CPL", () => {
    const result = calculatePublisherPayout(1, "US", {
      ...settings,
      publisherPayoutPercent: 100,
    });
    expect(result.publisherAmount).toBe(1);
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
    const platform = platformCalc(1.25, "IN", settings);
    expect(platform).toEqual(shared);
  });
});

describe("parsePlatformSettings payout compatibility", () => {
  it("treats legacy platform_fee_percent 0 as invalid and defaults to 70%", () => {
    const parsed = parsePlatformSettings({
      publisher_payout_percent: null,
      platform_fee_percent: 0,
    });

    expect(parsed.publisherPayoutPercent).toBe(70);
    expect(calculatePublisherPayout(1, "US", parsed).publisherAmount).toBe(0.7);
  });

  it("converts a legacy 30% platform fee into a 70% publisher payout", () => {
    const parsed = parsePlatformSettings({
      publisher_payout_percent: null,
      platform_fee_percent: 30,
    });

    expect(parsed.publisherPayoutPercent).toBe(70);
    expect(calculatePublisherPayout(1, "US", parsed).publisherAmount).toBe(0.7);
  });

  it("prefers the configured publisher payout over a legacy platform fee", () => {
    const parsed = parsePlatformSettings({
      publisher_payout_percent: 65,
      platform_fee_percent: 30,
    });

    expect(parsed.publisherPayoutPercent).toBe(65);
  });

  it("normalizes reversed tier payout ranges", () => {
    const parsed = parsePlatformSettings({
      tier1_payout_min: 2.5,
      tier1_payout_max: 0.7,
    });

    expect(parsed.tier1).toEqual({ min: 0.7, max: 2.5 });
  });
});
