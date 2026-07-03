import { describe, expect, it } from "vitest";
import {
  canAdminDeleteCampaign,
  canAdminEditCampaign,
  canTransitionStatus,
  isFullEditCampaign,
} from "@/lib/campaign-lifecycle";

describe("campaign-lifecycle", () => {
  it("allows full edit for draft and pending", () => {
    expect(isFullEditCampaign({ status: "DRAFT", leadCount: 0 })).toBe(true);
    expect(isFullEditCampaign({ status: "PENDING", leadCount: 0 })).toBe(true);
    expect(isFullEditCampaign({ status: "ACTIVE", leadCount: 0 })).toBe(false);
  });

  it("blocks delete for active campaigns", () => {
    expect(canAdminDeleteCampaign({ status: "ACTIVE", leadCount: 0 })).toBe(false);
    expect(canAdminDeleteCampaign({ status: "DRAFT", leadCount: 0 })).toBe(true);
    expect(canAdminDeleteCampaign({ status: "PENDING", leadCount: 5 })).toBe(false);
  });

  it("blocks edit for archived campaigns", () => {
    expect(canAdminEditCampaign({ status: "ARCHIVED", leadCount: 0 })).toBe(false);
    expect(canAdminEditCampaign({ status: "ACTIVE", leadCount: 10 })).toBe(true);
  });

  it("enforces status transitions", () => {
    expect(canTransitionStatus("ACTIVE", "PAUSED")).toBe(true);
    expect(canTransitionStatus("ACTIVE", "DRAFT")).toBe(false);
    expect(canTransitionStatus("PAUSED", "ACTIVE")).toBe(true);
    expect(canTransitionStatus("ARCHIVED", "ACTIVE")).toBe(false);
  });
});
