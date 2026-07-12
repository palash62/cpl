import { describe, expect, it } from "vitest";
import { sumPublisherEarningsForLeads } from "@/lib/publisher-earnings";
import type { PlatformSettingsConfig } from "@/lib/platform-settings";

const settings: PlatformSettingsConfig = {
  publisherPayoutPercent: 70,
  minPayoutAmount: 50,
  minPayoutWise: 50,
  minPayoutBankTransfer: 100,
  minPayoutStripeConnect: 50,
  tier1: { min: 0.7, max: 2.5 },
  tier2: { min: 0.5, max: 1.8 },
  tier3: { min: 0.25, max: 1.0 },
  globalLinkUrl: null,
  duplicateWindowDays: 30,
};

const publisher = {
  id: "publisher-1",
  role: "PUBLISHER" as const,
};

function makeLead(id: string, cpl: number, country: string | null = "US") {
  return {
    id,
    status: "PAID",
    country,
    publisherId: publisher.id,
    trackingLinkId: "link-1",
    campaign: { cpl, advertiserId: "advertiser-2" },
    publisher,
  };
}

describe("sumPublisherEarningsForLeads", () => {
  it("sums credited amounts for approved leads in the period", () => {
    const leads = [makeLead("lead-1", 1), makeLead("lead-2", 1)];
    const credited = new Map([
      ["lead-1", 0.65],
      ["lead-2", 0.65],
    ]);

    expect(sumPublisherEarningsForLeads(leads, credited, settings)).toBe(1.3);
  });

  it("uses calculated payout for leads missing ledger credits", () => {
    const leads = [makeLead("lead-1", 1), makeLead("lead-2", 1)];
    const credited = new Map([["lead-1", 0.65]]);

    expect(sumPublisherEarningsForLeads(leads, credited, settings)).toBe(1.35);
  });

  it("matches approved lead count when four leads pay $0.65 each", () => {
    const leads = [
      makeLead("lead-1", 1),
      makeLead("lead-2", 1),
      makeLead("lead-3", 1),
      makeLead("lead-4", 1),
    ];
    const credited = new Map([
      ["lead-1", 0.65],
      ["lead-2", 0.65],
      ["lead-3", 0.65],
      ["lead-4", 0.65],
    ]);

    expect(sumPublisherEarningsForLeads(leads, credited, settings)).toBe(2.6);
  });

  it("skips APPROVED leads without ledger credits", () => {
    const leads = [
      { ...makeLead("lead-1", 1), status: "APPROVED" },
      makeLead("lead-2", 1),
    ];
    const credited = new Map([["lead-2", 0.7]]);

    expect(sumPublisherEarningsForLeads(leads, credited, settings)).toBe(0.7);
  });

  it("skips leads that should not credit the publisher wallet", () => {
    const leads = [
      makeLead("lead-1", 1),
      {
        ...makeLead("lead-2", 1),
        publisherId: "advertiser-2",
        trackingLinkId: null,
        publisher: { role: "ADVERTISER" as const },
        campaign: { cpl: 1, advertiserId: "advertiser-2" },
      },
    ];

    expect(sumPublisherEarningsForLeads(leads, new Map(), settings)).toBe(0.7);
  });
});
