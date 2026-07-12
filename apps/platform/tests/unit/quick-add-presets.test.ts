import { describe, expect, it } from "vitest";
import { getQuickAddPreset } from "@/modules/page-builder/lib/quick-add-presets";

describe("getQuickAddPreset", () => {
  it("returns H2 preset for Headline", () => {
    const preset = getQuickAddPreset("Headline");
    expect(preset?.level).toBe(2);
    expect(preset?.text).toBe("Headline");
    expect(preset?.typography?.fontSize).toBe("2rem");
  });

  it("returns H3 preset for Sub-Headline", () => {
    const preset = getQuickAddPreset("Sub-Headline");
    expect(preset?.level).toBe(3);
    expect(preset?.text).toBe("Sub-headline");
    expect(preset?.typography?.fontSize).toBe("1.25rem");
    expect(preset?.typography?.fontWeight).toBe("600");
  });

  it("returns paragraph preset for Paragraph label", () => {
    const preset = getQuickAddPreset("Paragraph");
    expect(preset?.level).toBeUndefined();
    expect(preset?.text).toBe("Paragraph text");
  });

  it("returns undefined for unknown labels", () => {
    expect(getQuickAddPreset("Button")).toBeUndefined();
  });
});
