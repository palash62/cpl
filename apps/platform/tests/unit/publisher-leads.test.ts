import { describe, expect, it } from "vitest";
import { extractLeadCountry } from "@/lib/publisher-leads";

describe("publisher-leads extractLeadCountry re-export", () => {
  it("formats country names through shared helper", () => {
    expect(extractLeadCountry({}, null, "IN")).toBe("India");
  });
});
