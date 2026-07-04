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

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-0 origin-top"
        style={{
          width: 960,
          height: 720,
          transform: `translateX(-50%) scale(${scale})`,
        }}
      >
        <PageRenderer craftState={craft} theme={theme} />
      </div>
    </div>
  );
}
