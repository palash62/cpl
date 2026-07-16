import type { Breakpoint } from "@/modules/page-builder/types/block-props";

/** Pure priority for editor / preview override / live published width. */
export function resolveRenderBreakpoint(options: {
  editorEnabled: boolean;
  editorBreakpoint: Breakpoint;
  contextBreakpoint?: Breakpoint | null;
  publishedBreakpoint: Breakpoint;
}): Breakpoint {
  if (options.editorEnabled) return options.editorBreakpoint;
  if (options.contextBreakpoint) return options.contextBreakpoint;
  return options.publishedBreakpoint;
}
