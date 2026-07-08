"use client";

import { Monitor, Tablet, Smartphone } from "lucide-react";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { getBuilderChrome } from "@/modules/page-builder/lib/builder-chrome";
import type { Breakpoint } from "@/modules/page-builder/types/block-props";
import { cn } from "@/lib/utils";

const DEVICES: Array<{ id: Breakpoint; icon: typeof Monitor; label: string }> = [
  { id: "desktop", icon: Monitor, label: "Desktop" },
  { id: "tablet", icon: Tablet, label: "Tablet" },
  { id: "mobile", icon: Smartphone, label: "Mobile" },
];

export function DeviceSwitcher() {
  const breakpoint = useBuilderStore((s) => s.breakpoint);
  const setBreakpoint = useBuilderStore((s) => s.setBreakpoint);
  const setStyleBreakpoint = useBuilderStore((s) => s.setStyleBreakpoint);
  const chrome = getBuilderChrome(useBuilderStore((s) => s.builderConfig.chromeTheme ?? "dark"));

  return (
    <div className={cn("flex items-center gap-0.5 rounded-lg border p-0.5", chrome.deviceSwitcher)}>
      {DEVICES.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          title={label}
          onClick={() => {
            setBreakpoint(id);
            setStyleBreakpoint(id);
          }}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md transition-all",
            breakpoint === id ? chrome.deviceActive : chrome.deviceInactive,
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
