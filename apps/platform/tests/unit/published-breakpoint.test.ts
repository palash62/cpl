import { describe, expect, it } from "vitest";
import { PUBLISHED_BREAKPOINT_SERVER_SNAPSHOT } from "@/modules/page-builder/hooks/use-published-breakpoint";
import { viewportWidthToBreakpoint } from "@/modules/page-builder/lib/editor-canvas";
import { resolveRenderBreakpoint } from "@/modules/page-builder/lib/resolve-render-breakpoint";

describe("usePublishedBreakpoint", () => {
  it("uses mobile as the SSR / getServerSnapshot default", () => {
    expect(PUBLISHED_BREAKPOINT_SERVER_SNAPSHOT).toBe("mobile");
  });

  it("still maps client viewport widths with existing thresholds", () => {
    expect(viewportWidthToBreakpoint(390)).toBe("mobile");
    expect(viewportWidthToBreakpoint(820)).toBe("tablet");
    expect(viewportWidthToBreakpoint(1280)).toBe("desktop");
  });
});

describe("resolveRenderBreakpoint", () => {
  it("prefers editor device switcher while editing", () => {
    expect(
      resolveRenderBreakpoint({
        editorEnabled: true,
        editorBreakpoint: "tablet",
        contextBreakpoint: "mobile",
        publishedBreakpoint: "desktop",
      }),
    ).toBe("tablet");
  });

  it("prefers explicit preview ?bp= over live published width", () => {
    expect(
      resolveRenderBreakpoint({
        editorEnabled: false,
        editorBreakpoint: "desktop",
        contextBreakpoint: "mobile",
        publishedBreakpoint: "desktop",
      }),
    ).toBe("mobile");
  });

  it("falls back to published window-width breakpoint on live pages", () => {
    expect(
      resolveRenderBreakpoint({
        editorEnabled: false,
        editorBreakpoint: "desktop",
        contextBreakpoint: undefined,
        publishedBreakpoint: "mobile",
      }),
    ).toBe("mobile");
  });
});
