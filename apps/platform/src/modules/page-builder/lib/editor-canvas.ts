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

/** Map real viewport width to responsive breakpoint (not canvas simulation widths). */
export function viewportWidthToBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINT_WIDTHS.tablet) return "mobile";
  if (width < BREAKPOINT_WIDTHS.desktop) return "tablet";
  return "desktop";
}
