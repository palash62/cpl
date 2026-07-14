import { describe, expect, it } from "vitest";
import { canActorUpdateLeadStatus } from "@/services/lead.service";

describe("canActorUpdateLeadStatus", () => {
  it("allows campaign owner", () => {
    expect(
      canActorUpdateLeadStatus({
        campaignAdvertiserId: "adv-1",
        actorId: "adv-1",
      }),
    ).toBe(true);
  });

  it("rejects other advertisers", () => {
    expect(
      canActorUpdateLeadStatus({
        campaignAdvertiserId: "adv-1",
        actorId: "adv-2",
      }),
    ).toBe(false);
  });

  it("allows admins", () => {
    expect(
      canActorUpdateLeadStatus({
        isAdmin: true,
        campaignAdvertiserId: "adv-1",
        actorId: "admin-1",
      }),
    ).toBe(true);
  });
});
