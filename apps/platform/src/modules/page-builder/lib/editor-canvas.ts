import type { CSSProperties } from "react";
import type { Breakpoint } from "@/modules/page-builder/types/block-props";
import { BREAKPOINT_WIDTHS } from "@/modules/page-builder/lib/responsive";

export const GHL_DESKTOP_CANVAS_WIDTH = 960;

export function parseBreakpointParam(value: string | null | undefined): Breakpoint {
  if (value === "tablet" || value === "mobile") return value;
  return "desktop";
}

export function getCanvasMaxWidth(bp: Breakpoint, isGhl: boolean): number | undefined {
  if (bp === "desktop") return isGhl ? GHL_DESKTOP_CANVAS_WIDTH : undefined;
  return BREAKPOINT_WIDTHS[bp];
}

export function getCanvasViewportFill(bp: Breakpoint, isGhl: boolean): string {
  if (bp === "mobile") return "640px";
  if (bp === "tablet") return "600px";
  return isGhl ? "720px" : "calc(100vh - 12rem)";
}

export function getCanvasWidthLabel(bp: Breakpoint, isGhl: boolean): string {
  const width = getCanvasMaxWidth(bp, isGhl);
  if (width) return `${width}px`;
  return "Full width";
}

/** Fixed canvas width for editor/preview frames — avoids w-full fighting flex centering. */
export function getCanvasFrameWidthStyle(bp: Breakpoint, isGhl: boolean): CSSProperties {
  const fixedWidth = getCanvasMaxWidth(bp, isGhl);
  if (fixedWidth == null) {
    return { width: "100%", maxWidth: "100%" };
  }
  return {
    width: fixedWidth,
    maxWidth: "100%",
    flexShrink: 0,
  };
}

/** Map real viewport width to responsive breakpoint (not canvas simulation widths). */
export function viewportWidthToBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINT_WIDTHS.tablet) return "mobile";
  if (width < BREAKPOINT_WIDTHS.desktop) return "tablet";
  return "desktop";
}
