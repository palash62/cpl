"use client";

import { Link2, Monitor } from "lucide-react";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { getBuilderChrome } from "@/modules/page-builder/lib/builder-chrome";
import { cn } from "@/lib/utils";

type BottomStatusBarProps = {
  pageName: string;
  pageSlug: string;
};

export function BottomStatusBar({ pageSlug }: BottomStatusBarProps) {
  const saveStatus = useBuilderStore((s) => s.saveStatus);
  const breakpoint = useBuilderStore((s) => s.breakpoint);
  const builderConfig = useBuilderStore((s) => s.builderConfig);
  const funnelStep = useBuilderStore((s) => s.funnelStep);
  const chrome = getBuilderChrome(builderConfig.chromeTheme ?? "dark");

  return (
    <footer className={cn("flex h-9 shrink-0 items-center gap-4 px-4 text-xs", chrome.footer)}>
      <div className="flex items-center gap-1.5">
        <Link2 className="h-3 w-3" />
        <span className={cn("font-mono", chrome.footerText)}>
          {builderConfig.publicPathPrefix}
          {pageSlug}
          {funnelStep === "thankYou" ? "/thank-you" : ""}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Monitor className="h-3 w-3" />
        <span className={cn("capitalize", chrome.footerText)}>{breakpoint}</span>
      </div>
      <span className="ml-auto">
        {saveStatus === "saving" && "Saving changes..."}
        {saveStatus === "saved" && "All changes saved"}
        {saveStatus === "error" && "Save failed, retrying..."}
      </span>
    </footer>
  );
}
