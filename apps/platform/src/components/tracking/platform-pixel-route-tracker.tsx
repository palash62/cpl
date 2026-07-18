"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Fires Meta PageView on App Router client navigations.
 * Skips the first mount — the base pixel script already tracks the initial load.
 */
function PlatformPixelRouteTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirst = useRef(true);
  const search = searchParams.toString();

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (typeof window.fbq === "function") {
      try {
        window.fbq("track", "PageView");
      } catch {
        // Tracking must never break navigation.
      }
    }
  }, [pathname, search]);

  return null;
}

export function PlatformPixelRouteTracker() {
  return (
    <Suspense fallback={null}>
      <PlatformPixelRouteTrackerInner />
    </Suspense>
  );
}
