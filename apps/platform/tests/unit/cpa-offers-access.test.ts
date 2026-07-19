import { afterEach, describe, expect, it } from "vitest";
import {
  CPA_OFFERS_DEMO_ADVERTISER_EMAIL,
  canAdvertiserAccessCpaOffers,
  getCpaOffersAdvertiserAllowlist,
  isCpaMarketplaceLive,
} from "@/lib/cpa-offers-access";

const ENV_KEY = "CPA_OFFERS_ADVERTISER_ALLOWLIST";

describe("cpa-offers-access", () => {
  const previous = process.env[ENV_KEY];

  afterEach(() => {
    if (previous === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = previous;
    }
  });

  it("defaults to demo advertiser when env is unset", () => {
    delete process.env[ENV_KEY];
    expect(getCpaOffersAdvertiserAllowlist()).toEqual([CPA_OFFERS_DEMO_ADVERTISER_EMAIL]);
    expect(isCpaMarketplaceLive()).toBe(false);
    expect(canAdvertiserAccessCpaOffers("advertiser@cpl.local")).toBe(true);
    expect(canAdvertiserAccessCpaOffers("ADVERTISER@CPL.LOCAL")).toBe(true);
    expect(canAdvertiserAccessCpaOffers("other@example.com")).toBe(false);
    expect(canAdvertiserAccessCpaOffers(null)).toBe(false);
  });

  it("treats * as live for all advertisers", () => {
    process.env[ENV_KEY] = "*";
    expect(isCpaMarketplaceLive()).toBe(true);
    expect(canAdvertiserAccessCpaOffers("anyone@example.com")).toBe(true);
  });

  it("treats empty string as live", () => {
    process.env[ENV_KEY] = "   ";
    expect(isCpaMarketplaceLive()).toBe(true);
    expect(canAdvertiserAccessCpaOffers("anyone@example.com")).toBe(true);
  });

  it("supports comma-separated allowlist", () => {
    process.env[ENV_KEY] = "a@x.com, B@Y.com ";
    expect(isCpaMarketplaceLive()).toBe(false);
    expect(canAdvertiserAccessCpaOffers("a@x.com")).toBe(true);
    expect(canAdvertiserAccessCpaOffers("b@y.com")).toBe(true);
    expect(canAdvertiserAccessCpaOffers("c@z.com")).toBe(false);
  });
});
