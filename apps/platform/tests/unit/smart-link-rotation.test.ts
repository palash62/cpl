import { describe, expect, it } from "vitest";
import { pickCampaignForIpRotation } from "@/lib/smart-link-rotation";

const campaigns = [
  { id: "camp_a1", advertiserId: "adv_1" },
  { id: "camp_a2", advertiserId: "adv_1" },
  { id: "camp_b1", advertiserId: "adv_2" },
];

describe("pickCampaignForIpRotation", () => {
  it("prefers unseen campaigns from a different advertiser", () => {
    const pick = pickCampaignForIpRotation(campaigns, ["camp_a1"], 0);
    expect(pick?.id).toBe("camp_b1");
  });

  it("picks unseen campaign when no different advertiser exists", () => {
    const pool = [
      { id: "camp_a1", advertiserId: "adv_1" },
      { id: "camp_a2", advertiserId: "adv_1" },
    ];
    const pick = pickCampaignForIpRotation(pool, ["camp_a1"], 0);
    expect(pick?.id).toBe("camp_a2");
  });

  it("returns null when only the same campaign remains", () => {
    const pick = pickCampaignForIpRotation(
      [{ id: "camp_a1", advertiserId: "adv_1" }],
      ["camp_a1"],
      0,
    );
    expect(pick).toBeNull();
  });

  it("returns null when all eligible campaigns were shown and no rotation target exists", () => {
    const single = [{ id: "camp_a1", advertiserId: "adv_1" }];
    const pick = pickCampaignForIpRotation(single, ["camp_a1", "camp_a1"], 3);
    expect(pick).toBeNull();
  });

  it("uses rotation cursor within the chosen pool", () => {
    const pool = [
      { id: "camp_a1", advertiserId: "adv_1" },
      { id: "camp_b2", advertiserId: "adv_2" },
      { id: "camp_c1", advertiserId: "adv_3" },
    ];
    const pick = pickCampaignForIpRotation(pool, [], 1);
    expect(pick?.id).toBe("camp_b2");
  });
});
