import { describe, expect, it } from "vitest";
import type { BlockProps } from "@/modules/page-builder/types/block-props";
import {
  blockPropsToStyle,
  expandSpacingShorthand,
  getEditorViewportFill,
  isStretchLayoutValue,
  mergeBlockStyles,
  normalizeCssLength,
  normalizeSpacing,
  publishedSectionLayout,
  resolveColumnsGrid,
  resolveSectionPadding,
  resolveFullWidthForBreakpoint,
  resolveTypographyForBreakpoint,
  resolveGhlAlignDisplay,
  seedBreakpointOverridesBeforeDesktopEdit,
  setFullWidthAtBreakpoint,
  shouldStretchPublishedWrapper,
  shouldUseTextAlignForGhlAlign,
  hasMediaBackground,
  parseBackdropBlurPx,
  splitStylesForBackgroundBlur,
  toTranslucentBackgroundColor,
  backdropBlurStyle,
  isFullWidthLayout,
  withoutStretchLayout,
} from "./responsive";

describe("normalizeCssLength", () => {
  it("adds px to bare numbers", () => {
    expect(normalizeCssLength("100")).toBe("100px");
    expect(normalizeCssLength("0")).toBe("0");
  });

  it("preserves values with units", () => {
    expect(normalizeCssLength("50%")).toBe("50%");
    expect(normalizeCssLength("2rem")).toBe("2rem");
    expect(normalizeCssLength("auto")).toBe("auto");
  });
});

describe("normalizeSpacing", () => {
  it("normalizes all sides in shorthand", () => {
    expect(normalizeSpacing("100 0 0 0")).toBe("100px 0 0 0");
    expect(normalizeSpacing("16")).toBe("16px 16px 16px 16px");
  });
});

describe("expandSpacingShorthand", () => {
  it("expands 1-4 value shorthands", () => {
    expect(expandSpacingShorthand(["10px"])).toEqual(["10px", "10px", "10px", "10px"]);
    expect(expandSpacingShorthand(["10px", "20px"])).toEqual(["10px", "20px", "10px", "20px"]);
    expect(expandSpacingShorthand(["10px", "20px", "30px"])).toEqual(["10px", "20px", "30px", "20px"]);
    expect(expandSpacingShorthand(["10px", "20px", "30px", "40px"])).toEqual([
      "10px",
      "20px",
      "30px",
      "40px",
    ]);
  });
});

describe("blockPropsToStyle", () => {
  it("applies margin top with px normalization", () => {
    const style = blockPropsToStyle({
      layout: { margin: "100 0 0 0" },
    });
    expect(style.margin).toBe("100px 0 0 0");
  });

  it("applies padding with px normalization", () => {
    const style = blockPropsToStyle({
      layout: { padding: "24 16" },
    });
    expect(style.padding).toBe("24px 16px 24px 16px");
  });

  it("normalizes bare fontSize numbers to px", () => {
    const style = blockPropsToStyle({
      typography: { fontSize: "24", fontWeight: "700", color: "#111" },
    });
    expect(style.fontSize).toBe("24px");
    expect(style.fontWeight).toBe("700");
    expect(style.color).toBe("#111");
  });

  it("keeps unitless lineHeight multipliers", () => {
    const style = blockPropsToStyle({
      typography: { lineHeight: "1.5", letterSpacing: "1" },
    });
    expect(style.lineHeight).toBe("1.5");
    expect(style.letterSpacing).toBe("1px");
  });

  it("maps layout textAlign to CSS textAlign", () => {
    const style = blockPropsToStyle({
      layout: { textAlign: "center" },
    });
    expect(style.textAlign).toBe("center");
  });

  it("maps legacy justifyContent to textAlign", () => {
    const style = blockPropsToStyle({
      layout: { justifyContent: "flex-end" },
    });
    expect(style.textAlign).toBe("right");
    expect(style.justifyContent).toBe("flex-end");
  });

  it("centers block horizontally when width is less than 100%", () => {
    const style = blockPropsToStyle({
      layout: {
        width: "50%",
        margin: "20 0 0 0",
        textAlign: "center",
      },
    });
    expect(style.marginTop).toBe("20px");
    expect(style.marginLeft).toBe("auto");
    expect(style.marginRight).toBe("auto");
    expect(style.textAlign).toBe("center");
    expect(style.margin).toBeUndefined();
  });

  it("applies layout.textAlign from blocks that set it in defaults", () => {
    const style = blockPropsToStyle({
      layout: { textAlign: "center", width: "100%" },
    });
    expect(style.textAlign).toBe("center");
    expect(style.margin).toBeUndefined();
  });
});

describe("isFullWidthLayout", () => {
  it("treats unset, 100%, and auto as full width", () => {
    expect(isFullWidthLayout(undefined)).toBe(true);
    expect(isFullWidthLayout("100%")).toBe(true);
    expect(isFullWidthLayout("auto")).toBe(true);
    expect(isFullWidthLayout("50%")).toBe(false);
    expect(isFullWidthLayout("400px")).toBe(false);
  });
});

describe("shouldUseTextAlignForGhlAlign", () => {
  it("uses text align for full-width text blocks", () => {
    expect(shouldUseTextAlignForGhlAlign("Paragraph", "100%")).toBe(true);
    expect(shouldUseTextAlignForGhlAlign("List", undefined)).toBe(true);
    expect(shouldUseTextAlignForGhlAlign("Section", "100%")).toBe(false);
    expect(shouldUseTextAlignForGhlAlign("Paragraph", "400px")).toBe(false);
  });
});

describe("resolveGhlAlignDisplay", () => {
  it("reads typography.textAlign for full-width blocks", () => {
    expect(
      resolveGhlAlignDisplay({ textAlign: "center" }, { width: "100%" }, "100%"),
    ).toBe("center");
    expect(
      resolveGhlAlignDisplay({ textAlign: "right" }, {}, "auto"),
    ).toBe("right");
  });

  it("reads blockAlign for narrow blocks", () => {
    expect(
      resolveGhlAlignDisplay({}, { blockAlign: "center", width: "50%" }, "50%"),
    ).toBe("center");
  });
});

describe("mergeBlockStyles", () => {
  it("merges responsive layout overrides for the active breakpoint", () => {
    const style = mergeBlockStyles(
      {
        layout: { margin: "0", textAlign: "left" },
        responsive: {
          tablet: {
            layout: { margin: "40 0 0 0", textAlign: "center" },
          },
        },
      },
      "tablet",
    );
    expect(style.margin).toBe("40px 0 0 0");
    expect(style.textAlign).toBe("center");
  });

  it("merges responsive typography overrides for the active breakpoint", () => {
    const style = mergeBlockStyles(
      {
        typography: { fontSize: "16px", color: "#111" },
        responsive: {
          mobile: {
            typography: { fontSize: "14", color: "#334155" },
          },
        },
      },
      "mobile",
    );
    expect(style.fontSize).toBe("14px");
    expect(style.color).toBe("#334155");
  });

  it("scales typography on mobile when no explicit responsive override", () => {
    const style = mergeBlockStyles(
      {
        typography: { fontSize: "32px" },
      },
      "mobile",
    );
    expect(style.fontSize).toBe("24px");
  });
});

describe("withoutStretchLayout", () => {
  it("removes viewport stretch minHeight and height values", () => {
    expect(withoutStretchLayout({ minHeight: "100%", padding: "16px" })).toEqual({
      padding: "16px",
    });
    expect(withoutStretchLayout({ height: "100vh", width: "100%" })).toEqual({
      width: "100%",
    });
    expect(withoutStretchLayout({ minHeight: "calc(100vh - 2rem)" })).toBeUndefined();
  });

  it("keeps explicit non-stretch heights", () => {
    expect(withoutStretchLayout({ minHeight: "250px" })).toEqual({ minHeight: "250px" });
  });
});

describe("isStretchLayoutValue", () => {
  it("detects known stretch patterns", () => {
    expect(isStretchLayoutValue("100%")).toBe(true);
    expect(isStretchLayoutValue("720px")).toBe(true);
    expect(isStretchLayoutValue("calc(100dvh - 2rem)")).toBe(true);
    expect(isStretchLayoutValue("250px")).toBe(false);
  });
});

describe("resolveColumnsGrid", () => {
  it("stacks columns on mobile", () => {
    expect(resolveColumnsGrid(3, "mobile")).toBe("1fr");
  });

  it("limits tablet grids to two columns when row has more than two", () => {
    expect(resolveColumnsGrid(3, "tablet")).toBe("repeat(2, 1fr)");
    expect(resolveColumnsGrid(2, "tablet")).toBe("repeat(2, 1fr)");
  });

  it("honors responsive grid overrides", () => {
    expect(
      resolveColumnsGrid(3, "mobile", {
        mobile: { layout: { gridTemplateColumns: "repeat(2, 1fr)" } },
      }),
    ).toBe("repeat(2, 1fr)");
  });
});

describe("shouldStretchPublishedWrapper", () => {
  it("only stretches when width is explicitly 100%", () => {
    expect(shouldStretchPublishedWrapper(undefined)).toBe(false);
    expect(shouldStretchPublishedWrapper({ width: "40%" })).toBe(false);
    expect(shouldStretchPublishedWrapper({ width: "200px" })).toBe(false);
    expect(shouldStretchPublishedWrapper({ width: "100%" })).toBe(true);
  });
});

describe("seedBreakpointOverridesBeforeDesktopEdit", () => {
  it("seeds tablet and mobile with base value when they have no override", () => {
    const props: import("@/modules/page-builder/types/block-props").BlockProps = {
      layout: { width: "200px" },
    };
    seedBreakpointOverridesBeforeDesktopEdit(props, "layout", "width");
    expect(props.responsive?.tablet?.layout?.width).toBe("200px");
    expect(props.responsive?.mobile?.layout?.width).toBe("200px");
  });

  it("does not overwrite an existing tablet or mobile override", () => {
    const props: import("@/modules/page-builder/types/block-props").BlockProps = {
      layout: { width: "200px" },
      responsive: {
        tablet: { layout: { width: "150px" } },
        mobile: { layout: { width: "120px" } },
      },
    };
    seedBreakpointOverridesBeforeDesktopEdit(props, "layout", "width");
    expect(props.responsive?.tablet?.layout?.width).toBe("150px");
    expect(props.responsive?.mobile?.layout?.width).toBe("120px");
  });

  it("no-ops when base value is undefined", () => {
    const props: import("@/modules/page-builder/types/block-props").BlockProps = {
      layout: {},
    };
    seedBreakpointOverridesBeforeDesktopEdit(props, "layout", "width");
    expect(props.responsive).toBeUndefined();
  });
});

describe("resolveSectionPadding", () => {
  it("tightens default section padding on smaller breakpoints", () => {
    expect(resolveSectionPadding({ padding: "40px 20px" }, "mobile")).toEqual({
      padding: "40px 12px",
    });
    expect(resolveSectionPadding({ padding: "40px 20px" }, "tablet")).toEqual({
      padding: "40px 16px",
    });
  });

  it("leaves custom padding untouched", () => {
    expect(resolveSectionPadding({ padding: "24px 8px" }, "mobile")).toEqual({
      padding: "24px 8px",
    });
  });
});

describe("publishedSectionLayout", () => {
  it("top-aligns content without viewport min-height", () => {
    const layout = publishedSectionLayout({ padding: "40px 20px" });
    expect(layout.justifyContent).toBe("flex-start");
    expect(layout.alignItems).toBe("center");
    expect(layout.minHeight).toBeUndefined();
    expect(layout.padding).toBe("40px 20px");
  });
});

describe("getEditorViewportFill", () => {
  it("returns breakpoint-aware editor canvas heights", () => {
    expect(getEditorViewportFill(true, "desktop")).toBe("720px");
    expect(getEditorViewportFill(false, "desktop")).toBe("calc(100vh - 12rem)");
    expect(getEditorViewportFill(true, "tablet")).toBe("600px");
    expect(getEditorViewportFill(true, "mobile")).toBe("640px");
  });
});

describe("resolveTypographyForBreakpoint", () => {
  it("returns base typography on desktop", () => {
    const props = { typography: { fontSize: "16px", color: "#000" } };
    expect(resolveTypographyForBreakpoint(props, "desktop")).toEqual({
      fontSize: "16px",
      color: "#000",
    });
  });

  it("merges tablet typography overrides", () => {
    const props = {
      typography: { fontSize: "16px", color: "#000" },
      responsive: { tablet: { typography: { fontSize: "20px" } } },
    };
    expect(resolveTypographyForBreakpoint(props, "tablet")).toEqual({
      fontSize: "20px",
      color: "#000",
    });
  });

  it("merges mobile typography overrides", () => {
    const props = {
      typography: { fontSize: "16px" },
      responsive: { mobile: { typography: { fontSize: "14px" } } },
    };
    expect(resolveTypographyForBreakpoint(props, "mobile")).toEqual({ fontSize: "14px" });
  });
});

describe("resolveFullWidthForBreakpoint", () => {
  it("returns base fullWidth on desktop", () => {
    expect(resolveFullWidthForBreakpoint({ fullWidth: true }, "desktop")).toBe(true);
    expect(resolveFullWidthForBreakpoint({ fullWidth: false }, "desktop")).toBe(false);
  });

  it("uses tablet override when set", () => {
    const props = {
      fullWidth: true,
      responsive: { tablet: { fullWidth: false } },
    };
    expect(resolveFullWidthForBreakpoint(props, "tablet")).toBe(false);
    expect(resolveFullWidthForBreakpoint(props, "desktop")).toBe(true);
  });

  it("uses mobile override when set", () => {
    const props = {
      fullWidth: false,
      responsive: { mobile: { fullWidth: true } },
    };
    expect(resolveFullWidthForBreakpoint(props, "mobile")).toBe(true);
  });
});

describe("setFullWidthAtBreakpoint", () => {
  it("writes tablet override without changing desktop base", () => {
    const props: BlockProps & { fullWidth?: boolean } = { fullWidth: false };
    setFullWidthAtBreakpoint((cb) => cb(props), true, "tablet");
    expect(props.fullWidth).toBe(false);
    expect(props.responsive?.tablet?.fullWidth).toBe(true);
  });

  it("seeds tablet/mobile before desktop edit", () => {
    const props: BlockProps & { fullWidth?: boolean } = { fullWidth: true };
    setFullWidthAtBreakpoint((cb) => cb(props), false, "desktop");
    expect(props.fullWidth).toBe(false);
    expect(props.responsive?.tablet?.fullWidth).toBe(true);
    expect(props.responsive?.mobile?.fullWidth).toBe(true);
  });
});

describe("background blur helpers", () => {
  it("parseBackdropBlurPx extracts px from blur() value", () => {
    expect(parseBackdropBlurPx("blur(20px)")).toBe(20);
    expect(parseBackdropBlurPx("blur( 12px )")).toBe(12);
    expect(parseBackdropBlurPx("")).toBe(0);
    expect(parseBackdropBlurPx(undefined)).toBe(0);
  });

  it("hasMediaBackground detects image, gradient, and video", () => {
    expect(hasMediaBackground({ backgroundImage: "https://example.com/a.jpg" })).toBe(true);
    expect(hasMediaBackground({ backgroundGradient: "linear-gradient(#000, #fff)" })).toBe(true);
    expect(hasMediaBackground({ backgroundVideo: "https://example.com/v.mp4" })).toBe(true);
    expect(hasMediaBackground({ backgroundColor: "#fff" })).toBe(false);
  });

  it("splitStylesForBackgroundBlur moves image bg to layer with filter blur", () => {
    const baseStyle = blockPropsToStyle({
      style: {
        backgroundImage: "https://example.com/bg.jpg",
        backgroundSize: "cover",
        backdropFilter: "blur(20px)",
      },
    });
    const { wrapperStyle, backgroundLayerStyle, blurPx } = splitStylesForBackgroundBlur(baseStyle, {
      backgroundImage: "https://example.com/bg.jpg",
      backdropFilter: "blur(20px)",
    });

    expect(blurPx).toBe(20);
    expect(wrapperStyle.backgroundImage).toBeUndefined();
    expect(wrapperStyle.backdropFilter).toBeUndefined();
    expect(backgroundLayerStyle?.backgroundImage).toBe("url(https://example.com/bg.jpg)");
    expect(backgroundLayerStyle?.backgroundSize).toBe("cover");
    expect(backgroundLayerStyle?.filter).toBe("blur(20px)");
    expect(backgroundLayerStyle?.transform).toBe("scale(1.08)");
  });

  it("splitStylesForBackgroundBlur leaves wrapper unchanged when blur is zero", () => {
    const baseStyle = blockPropsToStyle({
      style: {
        backgroundImage: "https://example.com/bg.jpg",
        backdropFilter: "",
      },
    });
    const result = splitStylesForBackgroundBlur(baseStyle, {
      backgroundImage: "https://example.com/bg.jpg",
    });

    expect(result.blurPx).toBe(0);
    expect(result.backgroundLayerStyle).toBeUndefined();
    expect(result.wrapperStyle.backgroundImage).toBe("url(https://example.com/bg.jpg)");
  });

  it("toTranslucentBackgroundColor converts hex to rgba", () => {
    expect(toTranslucentBackgroundColor("#d35555")).toBe("rgba(211, 85, 85, 0.72)");
    expect(toTranslucentBackgroundColor("rgba(255,255,255,0.5)")).toBe("rgba(255, 255, 255, 0.5)");
  });

  it("backdropBlurStyle includes webkit prefix", () => {
    expect(backdropBlurStyle(12)).toEqual({
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
    });
  });

  it("splitStylesForBackgroundBlur moves solid color to frosted glass layer", () => {
    const baseStyle = blockPropsToStyle({
      style: {
        backgroundColor: "#d35555",
        backdropFilter: "blur(20px)",
        borderRadius: "8px",
      },
    });
    const { wrapperStyle, backgroundLayerStyle, blurPx } = splitStylesForBackgroundBlur(baseStyle, {
      backgroundColor: "#d35555",
      backdropFilter: "blur(20px)",
    });

    expect(blurPx).toBe(20);
    expect(wrapperStyle.backgroundColor).toBeUndefined();
    expect(wrapperStyle.backdropFilter).toBeUndefined();
    expect(backgroundLayerStyle?.backgroundColor).toBe("rgba(211, 85, 85, 0.72)");
    expect(backgroundLayerStyle?.backdropFilter).toBe("blur(20px)");
    expect(backgroundLayerStyle?.WebkitBackdropFilter).toBe("blur(20px)");
    expect(backgroundLayerStyle?.borderRadius).toBe("8px");
  });

  it("splitStylesForBackgroundBlur keeps opaque color when blur is zero", () => {
    const baseStyle = blockPropsToStyle({
      style: {
        backgroundColor: "#d35555",
        backdropFilter: "",
      },
    });
    const result = splitStylesForBackgroundBlur(baseStyle, {
      backgroundColor: "#d35555",
    });

    expect(result.blurPx).toBe(0);
    expect(result.backgroundLayerStyle).toBeUndefined();
    expect(result.wrapperStyle.backgroundColor).toBe("#d35555");
  });

  it("splitStylesForBackgroundBlur applies backdrop blur on wrapper when no background set", () => {
    const baseStyle = blockPropsToStyle({
      style: {
        backdropFilter: "blur(12px)",
      },
    });
    const result = splitStylesForBackgroundBlur(baseStyle, {
      backdropFilter: "blur(12px)",
    });

    expect(result.blurPx).toBe(12);
    expect(result.backgroundLayerStyle).toBeUndefined();
    expect(result.wrapperStyle.backdropFilter).toBe("blur(12px)");
    expect(result.wrapperStyle.WebkitBackdropFilter).toBe("blur(12px)");
  });

  it("splitStylesForBackgroundBlur strips backdropFilter for video blur", () => {
    const baseStyle = blockPropsToStyle({
      style: {
        backgroundColor: "#000",
        backdropFilter: "blur(16px)",
      },
    });
    const result = splitStylesForBackgroundBlur(baseStyle, {
      backgroundVideo: "https://example.com/v.mp4",
      backdropFilter: "blur(16px)",
    });

    expect(result.blurPx).toBe(16);
    expect(result.backgroundLayerStyle).toBeUndefined();
    expect(result.wrapperStyle.backdropFilter).toBeUndefined();
  });
});
