import { describe, expect, it } from "vitest";
import {
  buildButtonLayoutStyle,
  buttonIconSizePx,
  parseButtonFontSizePx,
} from "@/modules/page-builder/lib/button-layout";

describe("button-layout", () => {
  it("parseButtonFontSizePx defaults and parses px/rem", () => {
    expect(parseButtonFontSizePx(undefined)).toBe(16);
    expect(parseButtonFontSizePx("20px")).toBe(20);
    expect(parseButtonFontSizePx("1.5rem")).toBe(24);
    expect(parseButtonFontSizePx("99px")).toBe(48);
    expect(parseButtonFontSizePx("8px")).toBe(12);
    expect(parseButtonFontSizePx(undefined, "small")).toBe(14);
    expect(parseButtonFontSizePx(undefined, "large")).toBe(20);
  });

  it("buildButtonLayoutStyle uses auto width and scaled padding by default", () => {
    const style = buildButtonLayoutStyle({ fontSizePx: 16 });
    expect(style.fontSize).toBe("16px");
    expect(style.padding).toBe("9px 22px");
    expect(style.width).toBe("auto");
    expect(style.display).toBe("inline-flex");
  });

  it("buildButtonLayoutStyle supports full width", () => {
    const style = buildButtonLayoutStyle({ fontSizePx: 24, fullWidth: true });
    expect(style.width).toBe("100%");
    expect(style.display).toBe("flex");
    expect(style.padding).toBe("13px 32px");
  });

  it("buttonIconSizePx scales with font size", () => {
    expect(buttonIconSizePx(16)).toBe(15);
    expect(buttonIconSizePx(12)).toBe(14);
  });
});
