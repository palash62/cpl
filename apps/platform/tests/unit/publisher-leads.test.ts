import { describe, expect, it } from "vitest";
import {
  extractLeadCountry,
  formatPublisherLeadPayout,
} from "@/lib/publisher-leads";
import type { PlatformSettingsConfig } from "@/lib/platform-settings";

const settings: PlatformSettingsConfig = {
  publisherPayoutPercent: 70,
  minPayoutAmount: 50,
  minPayoutWise: 50,
  minPayoutBankTransfer: 100,
  minPayoutStripeConnect: 50,
  tier1: { min: 0.7, max: 2.5 },
  tier2: { min: 0.5, max: 1.8 },
  tier3: { min: 0.25, max: 1 },
  globalLinkUrl: null,
  duplicateWindowDays: 30,
};

const lead = {
  status: "PAID",
  country: "US",
  campaign: { cpl: 1 },
};

describe("publisher-leads extractLeadCountry re-export", () => {
  it("formats country names through shared helper", () => {
    expect(extractLeadCountry({}, null, "IN")).toBe("India");
  });

  it("shows the credited $0.70 payout for a paid $1 CPL lead", () => {
    expect(formatPublisherLeadPayout(lead, settings, 0.7).label).toBe("$0.70");
  });

  it("shows a $0.70 estimate only for approved leads", () => {
    expect(
      formatPublisherLeadPayout({ ...lead, status: "APPROVED" }, settings).label,
    ).toBe("$0.70 est.");
    expect(
      formatPublisherLeadPayout({ ...lead, status: "REJECTED" }, settings).label,
    ).toBe("—");
  });
});
