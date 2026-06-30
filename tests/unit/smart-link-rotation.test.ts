import { describe, it, expect } from "vitest";
import {
  campaignAcceptsCountry,
  filterCampaignsByCountry,
  pickCampaignForIpRotation,
} from "@/lib/smart-link-rotation";

const campaign = (id: string, advertiserId: string, targeting: object) => ({
  id,
  advertiserId,
  targeting,
});

describe("campaignAcceptsCountry", () => {
  it("allows all countries when allow list is empty", () => {
    expect(campaignAcceptsCountry({ trafficMode: "allow", countries: [] }, "US")).toBe(true);
  });

  it("restricts to allow list", () => {
    const t = { trafficMode: "allow", countries: ["US", "CA"] };
    expect(campaignAcceptsCountry(t, "US")).toBe(true);
    expect(campaignAcceptsCountry(t, "GB")).toBe(false);
  });

  it("blocks blacklisted countries", () => {
    const t = { trafficMode: "block", blacklistedCountries: ["IN"] };
    expect(campaignAcceptsCountry(t, "US")).toBe(true);
    expect(campaignAcceptsCountry(t, "IN")).toBe(false);
  });

  it("with unknown country only accepts open campaigns in allow mode", () => {
    expect(campaignAcceptsCountry({ trafficMode: "allow", countries: ["US"] }, undefined)).toBe(
      false,
    );
    expect(campaignAcceptsCountry({ trafficMode: "allow", countries: [] }, undefined)).toBe(true);
  });
});

describe("pickCampaignForIpRotation", () => {
  const eligible = [
    campaign("c1", "adv1", {}),
    campaign("c2", "adv2", {}),
    campaign("c3", "adv1", {}),
  ];

  it("picks unseen campaign on repeat visit", () => {
    const pick = pickCampaignForIpRotation(eligible, ["c1"], 0);
    expect(pick?.id).not.toBe("c1");
  });

  it("prefers different advertiser when possible", () => {
    const pick = pickCampaignForIpRotation(eligible, ["c1"], 0);
    expect(pick?.advertiserId).not.toBe("adv1");
  });

  it("cycles when all campaigns were shown", () => {
    const pick = pickCampaignForIpRotation(eligible, ["c1", "c2", "c3"], 0);
    expect(pick?.id).not.toBe("c1");
  });
});

describe("filterCampaignsByCountry", () => {
  it("filters by visitor country", () => {
    const list = [
      campaign("c1", "a1", { trafficMode: "allow", countries: ["US"] }),
      campaign("c2", "a2", { trafficMode: "allow", countries: ["GB"] }),
    ];
    const filtered = filterCampaignsByCountry(list, "US");
    expect(filtered.map((c) => c.id)).toEqual(["c1"]);
  });
});
