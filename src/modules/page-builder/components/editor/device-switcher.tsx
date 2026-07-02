"use client";

import { Monitor, Tablet, Smartphone } from "lucide-react";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
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

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 p-0.5">
      {DEVICES.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          title={label}
          onClick={() => setBreakpoint(id)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md transition-all",
            breakpoint === id
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:bg-white/10 hover:text-white",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
