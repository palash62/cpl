"use client";

import type { ComponentType } from "react";
import { useEditor } from "@craftjs/core";
import { MousePointer2, Settings2 } from "lucide-react";
import { BUILDER_PROPERTIES_PANEL } from "@/modules/page-builder/lib/builder-panel-styles";
import { cn } from "@/lib/utils";

export function RightPropertiesPanel() {
  const { selected, Settings, displayName } = useEditor((state, query) => {
    const currentNodeId = query.getEvent("selected").first();
    let settingsPanel: ComponentType | null = null;
    let name: string | null = null;
    if (currentNodeId) {
      const node = query.node(currentNodeId).get();
      settingsPanel = (node?.related?.settings as ComponentType) ?? null;
      name = String(node?.data.displayName ?? node?.data.type ?? "Element");
    }
    return {
      selected: currentNodeId,
      Settings: settingsPanel,
      displayName: name,
    };
  });

  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-l border-white/[0.08] bg-[#12141c]">
      <div className="border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
            <Settings2 className="h-4 w-4 text-indigo-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Properties</h3>
            <p className="text-xs text-slate-300">
              {selected ? displayName : "No selection"}
            </p>
          </div>
        </div>
      </div>
      <div className={cn("flex-1 overflow-auto p-4", BUILDER_PROPERTIES_PANEL)}>
        {Settings ? (
          <Settings />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <MousePointer2 className="h-5 w-5 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-white">Select an element</p>
            <p className="mt-1 max-w-[200px] text-xs text-slate-400">
              Click any block on the canvas to edit its content and styles.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
