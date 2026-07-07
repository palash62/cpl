"use client";

import { Plus } from "lucide-react";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { cn } from "@/lib/utils";

export function ColumnEmptyState({ columnId }: { columnId: string }) {
  const setInsertTargetNodeId = useBuilderStore((s) => s.setInsertTargetNodeId);
  const setLeftPanelSection = useBuilderStore((s) => s.setLeftPanelSection);
  const setLeftPanelOpen = useBuilderStore((s) => s.setLeftPanelOpen);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setInsertTargetNodeId(columnId);
        setLeftPanelSection("quick-add");
        setLeftPanelOpen(true);
      }}
      className={cn(
        "flex min-h-[120px] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200",
        "bg-slate-50/50 text-slate-400 transition hover:border-orange-300 hover:bg-orange-50/30 hover:text-orange-500",
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm">
        <Plus className="h-5 w-5" />
      </span>
      <span className="text-sm font-medium">Add</span>
    </button>
  );
}
