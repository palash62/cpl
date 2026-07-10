"use client";

import type { CSSProperties, ReactNode } from "react";
import { themePageBackgroundStyle, type ThemeJson } from "@/modules/page-builder/lib/theme";
import { cn } from "@/lib/utils";

type FunnelCraftPreviewFrameProps = {
  theme: ThemeJson;
  fillParent?: boolean;
  viewportFill?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export function FunnelCraftPreviewFrame({
  theme,
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
        ...themePageBackgroundStyle(theme),
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
  const serialized = craftState ? JSON.stringify(craftState) : "";
  const craftKey = serialized
    ? `${serialized.length}:${serialized.slice(0, 64)}:${serialized.slice(-64)}`
    : "0";
  const themeKey = theme
    ? `${theme.backgroundColor}|${theme.backgroundImage ?? ""}|${theme.primaryColor}`
    : "";
  return `${craftKey}:${themeKey}`;
}
