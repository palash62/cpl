import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME,
  pageBackgroundLayerStyle,
  pageCanvasShellStyle,
  pageShellStyle,
} from "@/modules/page-builder/lib/theme";

const RED_THEME = {
  ...DEFAULT_THEME,
  backgroundColor: "#ff0000",
  backgroundImage: "https://example.com/bg.jpg",
};

describe("pageBackgroundLayerStyle", () => {
  it("includes page background color and image", () => {
    const style = pageBackgroundLayerStyle(RED_THEME);
    expect(style.backgroundColor).toBe("#ff0000");
    expect(style.backgroundImage).toBe("url(https://example.com/bg.jpg)");
  });

  it("does not include typography CSS vars", () => {
    const style = pageBackgroundLayerStyle(RED_THEME);
    expect(style.fontFamily).toBeUndefined();
    expect(style.color).toBeUndefined();
  });
});

describe("pageCanvasShellStyle", () => {
  it("includes CSS vars and typography without page background", () => {
    const style = pageCanvasShellStyle(RED_THEME, { viewportFill: "720px" });
    expect(style.fontFamily).toBe(RED_THEME.fontFamily);
    expect(style.color).toBe("var(--pb-page-text)");
    expect(style.backgroundColor).toBeUndefined();
    expect(style.backgroundImage).toBeUndefined();
    expect((style as Record<string, string>)["--pb-viewport-fill"]).toBe("720px");
  });
});

describe("pageShellStyle", () => {
  it("still includes background for full-width paths", () => {
    const style = pageShellStyle(RED_THEME);
    expect(style.backgroundColor).toBe("#ff0000");
    expect(style.fontFamily).toBe(RED_THEME.fontFamily);
  });
});
