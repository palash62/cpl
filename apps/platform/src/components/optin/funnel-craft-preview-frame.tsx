"use client";

import type { CSSProperties, ReactNode } from "react";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import { previewContentRevision } from "@/modules/page-builder/lib/preview-revision";
import { cn } from "@/lib/utils";

type FunnelCraftPreviewFrameProps = {
  theme?: ThemeJson;
  fillParent?: boolean;
  viewportFill?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/** Viewport sizing wrapper only — theme background is applied by PageRenderer. */
export function FunnelCraftPreviewFrame({
  fillParent = true,
  viewportFill,
  className,
  style,
  children,
}: FunnelCraftPreviewFrameProps) {
  const fill = viewportFill ?? (fillParent ? "calc(100dvh - 2.5rem)" : "100%");

  return (
    <div
      className={cn("flex w-full flex-1 flex-col", fillParent ? "min-h-0" : "h-full min-h-0", className)}
      style={{
        ["--pb-viewport-fill" as string]: fill,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function funnelCraftPreviewRevision(
  craftState: unknown,
  theme: ThemeJson | null | undefined,
): string {
  return previewContentRevision(craftState, theme);
}
