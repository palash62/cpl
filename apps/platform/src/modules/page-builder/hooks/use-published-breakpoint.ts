"use client";

import { useEffect, useState } from "react";
import type { Breakpoint } from "@/modules/page-builder/types/block-props";
import { viewportWidthToBreakpoint } from "@/modules/page-builder/lib/editor-canvas";

export function usePublishedBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");

  useEffect(() => {
    function update() {
      setBreakpoint(viewportWidthToBreakpoint(window.innerWidth));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return breakpoint;
}
