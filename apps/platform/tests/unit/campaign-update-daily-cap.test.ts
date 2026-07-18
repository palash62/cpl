import { describe, expect, it } from "vitest";
import { adminUpdateCampaignSchema } from "@/lib/validations";

describe("adminUpdateCampaignSchema dailyCap", () => {
  it("accepts null dailyCap so edit can clear daily budget", () => {
    const parsed = adminUpdateCampaignSchema.safeParse({
      name: "Battery prof 1",
      cpl: 1.2,
      budget: 500,
      category: "GENERIC",
      dailyCap: null,
      status: "ACTIVE",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.dailyCap).toBeNull();
    }
  });

  it("accepts a positive dailyCap", () => {
    const parsed = adminUpdateCampaignSchema.safeParse({ dailyCap: 25 });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.dailyCap).toBe(25);
    }
  });

  it("accepts omitted dailyCap", () => {
    const parsed = adminUpdateCampaignSchema.safeParse({ name: "Only name" });
    expect(parsed.success).toBe(true);
  });
});
