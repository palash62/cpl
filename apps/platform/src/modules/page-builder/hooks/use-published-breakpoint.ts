"use client";

import { useEffect, useState } from "react";
import type { Breakpoint } from "@/modules/page-builder/types/block-props";
import { BREAKPOINT_WIDTHS } from "@/modules/page-builder/lib/responsive";

function widthToBreakpoint(width: number): Breakpoint {
  if (width <= BREAKPOINT_WIDTHS.mobile) return "mobile";
  if (width <= BREAKPOINT_WIDTHS.tablet) return "tablet";
  return "desktop";
}

export function usePublishedBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");

  useEffect(() => {
    function update() {
      setBreakpoint(widthToBreakpoint(window.innerWidth));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return breakpoint;
}
