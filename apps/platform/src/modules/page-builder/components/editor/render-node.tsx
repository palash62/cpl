"use client";

import type { ReactNode } from "react";
import { useEditor, useNode } from "@craftjs/core";
import { ArrowUp, Settings2, Trash2 } from "lucide-react";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { cn } from "@/lib/utils";

function GhlNodeChrome({ children }: { children: ReactNode }) {
  const { id, selected, hovered, displayName } = useNode((node) => ({
    selected: node.events.selected,
    hovered: node.events.hovered,
    displayName: String(node.data.displayName ?? node.data.type ?? "Element"),
  }));

  const { actions } = useEditor();
  const setPropertiesTab = useBuilderStore((s) => s.setPropertiesTab);

  return (
    <div
      data-craft-node={id}
      className={cn(
        "relative",
        selected && "z-20 ring-2 ring-orange-400 ring-offset-1",
        !selected && hovered && "z-10 ring-1 ring-orange-300 ring-offset-1",
      )}
    >
      {selected && (
        <div className="absolute -top-8 left-0 z-30 flex items-center gap-0.5 rounded-md border border-slate-200 bg-white p-0.5 shadow-md">
          <button type="button" className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100" title="Move up">
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100"
            title="Settings"
            onClick={() => setPropertiesTab("general")}
          >
            <Settings2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded text-red-500 hover:bg-red-50"
            title="Delete"
            onClick={() => actions.delete(id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {children}
      {selected && (
        <span className="absolute -bottom-5 right-0 z-30 rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {displayName}
        </span>
      )}
    </div>
  );
}

export function RenderNode({ render }: { render: ReactNode }) {
  const isGhl = useBuilderStore(
    (s) => s.builderConfig.chromeTheme === "light" && s.builderConfig.mode === "funnel",
  );

  const { id, selected, hovered } = useNode((node) => ({
    selected: node.events.selected,
    hovered: node.events.hovered,
  }));

  if (id === "ROOT") return <>{render}</>;

  if (isGhl) {
    return <GhlNodeChrome>{render}</GhlNodeChrome>;
  }

  return (
    <div
      data-craft-node={id}
      className={cn(
        "relative transition-shadow",
        selected && "z-10 ring-2 ring-indigo-500 ring-offset-2",
        !selected && hovered && "ring-1 ring-indigo-400/60 ring-offset-1",
      )}
    >
      {render}
    </div>
  );
}
