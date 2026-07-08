"use client";

import { useEffect, useState } from "react";
import { PageRenderer } from "@/modules/page-builder/components/renderer/page-renderer";
import { createEmptyCraftState } from "@/modules/page-builder/lib/serialize";
import { DEFAULT_THEME, type ThemeJson } from "@/modules/page-builder/lib/theme";
import type { PageDocument } from "@/modules/page-builder/types/page-document";

export function OptinFunnelCraftThumbnail({
  craftState,
  themeJson,
  scale = 0.28,
}: {
  craftState: PageDocument | null;
  themeJson?: ThemeJson;
  scale?: number;
}) {
  const [mounted, setMounted] = useState(false);
  const craft = craftState?.craft ?? createEmptyCraftState();
  const theme = themeJson ?? DEFAULT_THEME;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="absolute inset-0 animate-pulse bg-slate-200/80" aria-hidden />
    );
  }

  const frameWidth = 960;
  const frameHeight = 720;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-slate-100">
      <div
        className="absolute left-1/2 top-0 origin-top"
        style={{
          width: frameWidth,
          height: frameHeight,
          transform: `translateX(-50%) scale(${scale})`,
        }}
      >
        <div className="h-full w-full overflow-hidden bg-white">
          <PageRenderer craftState={craft} theme={theme} />
        </div>
      </div>
    </div>
  );
}
