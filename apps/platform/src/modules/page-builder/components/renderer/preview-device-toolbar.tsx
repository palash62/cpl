"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import {
  getCanvasWidthLabel,
  parseBreakpointParam,
} from "@/modules/page-builder/lib/editor-canvas";
import type { Breakpoint } from "@/modules/page-builder/types/block-props";
import { cn } from "@/lib/utils";

const DEVICES: Array<{ id: Breakpoint; icon: typeof Monitor; label: string }> = [
  { id: "desktop", icon: Monitor, label: "Desktop" },
  { id: "tablet", icon: Tablet, label: "Tablet" },
  { id: "mobile", icon: Smartphone, label: "Mobile" },
];

type PreviewDeviceToolbarProps = {
  isGhl?: boolean;
};

export function PreviewDeviceToolbar({ isGhl = true }: PreviewDeviceToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const breakpoint = parseBreakpointParam(searchParams.get("bp"));

  function setBreakpoint(id: Breakpoint) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("bp", id);
    if (!params.has("frame")) params.set("frame", "1");
    router.replace(`${pathname}?${params.toString()}`);
  }

  const widthLabel = getCanvasWidthLabel(breakpoint, isGhl);

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2">
      <p className="text-xs text-slate-500">
        Canvas <span className="font-medium text-slate-700">{widthLabel}</span> — matches editor
      </p>
      <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        {DEVICES.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => setBreakpoint(id)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-all",
              breakpoint === id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
