"use client";

import { useSyncExternalStore } from "react";
import type { Breakpoint } from "@/modules/page-builder/types/block-props";
import { viewportWidthToBreakpoint } from "@/modules/page-builder/lib/editor-canvas";

/** SSR + first paint: mobile-first so fixed desktop widths (e.g. 933px) don't crop phones. */
export const PUBLISHED_BREAKPOINT_SERVER_SNAPSHOT: Breakpoint = "mobile";

function subscribePublishedBreakpoint(onStoreChange: () => void): () => void {
  window.addEventListener("resize", onStoreChange);
  return () => window.removeEventListener("resize", onStoreChange);
}

function getPublishedBreakpointSnapshot(): Breakpoint {
  return viewportWidthToBreakpoint(window.innerWidth);
}

function getPublishedBreakpointServerSnapshot(): Breakpoint {
  return PUBLISHED_BREAKPOINT_SERVER_SNAPSHOT;
}

export function usePublishedBreakpoint(): Breakpoint {
  return useSyncExternalStore(
    subscribePublishedBreakpoint,
    getPublishedBreakpointSnapshot,
    getPublishedBreakpointServerSnapshot,
  );
}
