import { describe, expect, it } from "vitest";
import {
  buildSourceToken,
  clampSourceBid,
  formatSourceDisplayId,
  normalizeSourceTag,
  sourceBidLimits,
} from "@cpl/shared";

describe("source token privacy", () => {
  it("normalizes empty source to unknown", () => {
    expect(normalizeSourceTag(null)).toBe("unknown");
    expect(normalizeSourceTag("  FaceBook ")).toBe("facebook");
  });

  it("hides raw source in display id", () => {
    const token = buildSourceToken("adv1", "pub1", "facebook", "test-secret");
    const display = formatSourceDisplayId(token);
    expect(display.startsWith("SRC-")).toBe(true);
    expect(display.toLowerCase()).not.toContain("facebook");
    expect(token).not.toContain("facebook");
  });

  it("gives different tokens for different publishers with same source", () => {
    const a = buildSourceToken("adv1", "pub1", "facebook", "test-secret");
    const b = buildSourceToken("adv1", "pub2", "facebook", "test-secret");
    expect(a).not.toBe(b);
  });

  it("is deterministic for the same inputs", () => {
    const a = buildSourceToken("adv1", "pub1", "tiktok", "test-secret");
    const b = buildSourceToken("adv1", "pub1", "tiktok", "test-secret");
    expect(a).toBe(b);
  });
});

describe("source bid limits", () => {
  it("clamps to 50%–200% of campaign CPL", () => {
    expect(sourceBidLimits(10)).toEqual({ min: 5, max: 20 });
    expect(clampSourceBid(10, 3)).toBe(5);
    expect(clampSourceBid(10, 25)).toBe(20);
    expect(clampSourceBid(10, 12)).toBe(12);
  });
});
