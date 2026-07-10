import { describe, expect, it } from "vitest";
import {
  blockPropsToStyle,
  expandSpacingShorthand,
  getEditorViewportFill,
  isStretchLayoutValue,
  mergeBlockStyles,
  normalizeCssLength,
  normalizeSpacing,
  resolveColumnsGrid,
  resolveSectionPadding,
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

describe("getEditorViewportFill", () => {
  it("returns breakpoint-aware editor canvas heights", () => {
    expect(getEditorViewportFill(true, "desktop")).toBe("720px");
    expect(getEditorViewportFill(false, "desktop")).toBe("calc(100vh - 12rem)");
    expect(getEditorViewportFill(true, "tablet")).toBe("600px");
    expect(getEditorViewportFill(true, "mobile")).toBe("640px");
  });
});
