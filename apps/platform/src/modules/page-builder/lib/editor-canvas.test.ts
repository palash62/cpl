import { describe, expect, it } from "vitest";
import {
  GHL_DESKTOP_CANVAS_WIDTH,
  getCanvasFrameWidthStyle,
  getCanvasMaxWidth,
  getCanvasViewportFill,
  getCanvasWidthLabel,
  parseBreakpointParam,
  viewportWidthToBreakpoint,
} from "@/modules/page-builder/lib/editor-canvas";

describe("editor-canvas", () => {
  it("parses breakpoint query params", () => {
    expect(parseBreakpointParam("desktop")).toBe("desktop");
    expect(parseBreakpointParam("tablet")).toBe("tablet");
    expect(parseBreakpointParam("mobile")).toBe("mobile");
    expect(parseBreakpointParam(null)).toBe("desktop");
    expect(parseBreakpointParam("invalid")).toBe("desktop");
  });

  it("returns GHL desktop canvas width", () => {
    expect(getCanvasMaxWidth("desktop", true)).toBe(GHL_DESKTOP_CANVAS_WIDTH);
    expect(getCanvasMaxWidth("desktop", false)).toBeUndefined();
    expect(getCanvasMaxWidth("tablet", true)).toBe(768);
    expect(getCanvasMaxWidth("mobile", true)).toBe(375);
  });

  it("matches editor viewport fill heights", () => {
    expect(getCanvasViewportFill("desktop", true)).toBe("720px");
    expect(getCanvasViewportFill("tablet", true)).toBe("600px");
    expect(getCanvasViewportFill("mobile", true)).toBe("640px");
  });

  it("formats canvas width labels for preview toolbar", () => {
    expect(getCanvasWidthLabel("desktop", true)).toBe("960px");
    expect(getCanvasWidthLabel("tablet", true)).toBe("768px");
  });

  it("returns fixed frame width styles for flex centering", () => {
    expect(getCanvasFrameWidthStyle("mobile", true)).toEqual({
      width: 375,
      maxWidth: "100%",
      flexShrink: 0,
    });
    expect(getCanvasFrameWidthStyle("tablet", true)).toEqual({
      width: 768,
      maxWidth: "100%",
      flexShrink: 0,
    });
    expect(getCanvasFrameWidthStyle("desktop", true)).toEqual({
      width: GHL_DESKTOP_CANVAS_WIDTH,
      maxWidth: "100%",
      flexShrink: 0,
    });
    expect(getCanvasFrameWidthStyle("desktop", false)).toEqual({
      width: "100%",
      maxWidth: "100%",
    });
  });

  it("maps viewport widths to breakpoints using layout thresholds", () => {
    expect(viewportWidthToBreakpoint(390)).toBe("mobile");
    expect(viewportWidthToBreakpoint(767)).toBe("mobile");
    expect(viewportWidthToBreakpoint(768)).toBe("tablet");
    expect(viewportWidthToBreakpoint(820)).toBe("tablet");
    expect(viewportWidthToBreakpoint(1280)).toBe("desktop");
    expect(viewportWidthToBreakpoint(1440)).toBe("desktop");
  });
});
