import { useEditor } from "@craftjs/core";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { usePublishedPage } from "@/modules/page-builder/lib/published-page-context";
import { usePublishedBreakpoint } from "@/modules/page-builder/hooks/use-published-breakpoint";
import type { Breakpoint } from "@/modules/page-builder/types/block-props";

/** Editor: device switcher. Preview with ?bp=: URL override. Live: window width. */
export function useRenderBreakpoint(): Breakpoint {
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const editorBreakpoint = useBuilderStore((s) => s.breakpoint);
  const publishedBreakpoint = usePublishedBreakpoint();
  const { breakpoint: contextBreakpoint } = usePublishedPage();

  if (enabled) return editorBreakpoint;
  if (contextBreakpoint) return contextBreakpoint;
  return publishedBreakpoint;
}
