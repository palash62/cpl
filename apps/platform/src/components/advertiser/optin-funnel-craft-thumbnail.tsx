"use client";

import { useEffect, useState } from "react";
import { PageRenderer } from "@/modules/page-builder/components/renderer/page-renderer";
import { createBlankCraftState } from "@/modules/page-builder/lib/serialize";
import { DEFAULT_THEME, type ThemeJson } from "@/modules/page-builder/lib/theme";
import type { PageDocument } from "@/modules/page-builder/types/page-document";
import {
  FunnelCraftPreviewFrame,
  funnelCraftPreviewRevision,
} from "@/components/optin/funnel-craft-preview-frame";

export function OptinFunnelCraftThumbnail({
  craftState,
  themeJson,
  scale = 0.28,
  emptyFallback = "blank",
}: {
  craftState: PageDocument | null;
  themeJson?: ThemeJson;
  scale?: number;
  /** Prefer blank canvas when craft is missing — never the optin skeleton with a lead form. */
  emptyFallback?: "blank" | "none";
}) {
  const [mounted, setMounted] = useState(false);
  const craft =
    craftState?.craft ??
    (emptyFallback === "blank" ? createBlankCraftState() : null);
  const theme = themeJson ?? DEFAULT_THEME;
  const revision = funnelCraftPreviewRevision(craft, theme);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="absolute inset-0 animate-pulse bg-slate-200/80" aria-hidden />
    );
  }

  if (!craft) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-sm text-slate-500">
        No preview
      </div>
    );
  }

  const frameWidth = 960;
  const frameHeight = 720;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        key={revision}
        className="absolute left-1/2 top-0 origin-top"
        style={{
          width: frameWidth,
          height: frameHeight,
          transform: `translateX(-50%) scale(${scale})`,
        }}
      >
        <FunnelCraftPreviewFrame
          theme={theme}
          fillParent
          viewportFill={`${frameHeight}px`}
          className="h-full min-h-0"
          style={{ minHeight: frameHeight }}
        >
          <PageRenderer craftState={craft} theme={theme} fillParent />
        </FunnelCraftPreviewFrame>
      </div>
    </div>
  );
}
