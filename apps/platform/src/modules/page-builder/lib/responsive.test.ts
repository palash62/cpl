import { describe, expect, it } from "vitest";
import {
  blockPropsToStyle,
  expandSpacingShorthand,
  mergeBlockStyles,
  normalizeCssLength,
  normalizeSpacing,
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
});
