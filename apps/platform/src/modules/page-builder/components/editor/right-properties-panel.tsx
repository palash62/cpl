"use client";

import type { ComponentType } from "react";
import { NodeProvider, useEditor } from "@craftjs/core";
import { MousePointer2, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AnimationFields,
  GeneralFields,
  LayoutFields,
  StyleFields,
  TypographyFields,
} from "@/modules/page-builder/components/settings/shared/block-settings";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { getBuilderChrome } from "@/modules/page-builder/lib/builder-chrome";
import { GHL_PROPERTIES_PANEL, GHL_TAB_LIST, GHL_TAB_TRIGGER } from "@/modules/page-builder/lib/builder-panel-styles";
import { cn } from "@/lib/utils";

function GhlStylesPanel() {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Typography</p>
        <TypographyFields />
      </div>
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Margin & padding</p>
        <LayoutFields />
      </div>
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Border & background</p>
        <StyleFields />
      </div>
    </div>
  );
}

function GhlPropertiesBody({ Settings, displayName }: { Settings: ComponentType | null; displayName: string }) {
  const propertiesTab = useBuilderStore((s) => s.propertiesTab);
  const setPropertiesTab = useBuilderStore((s) => s.setPropertiesTab);
  const { actions } = useEditor();

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">{displayName}</h3>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          onClick={() => actions.selectNode()}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <Tabs value={propertiesTab} onValueChange={(v) => setPropertiesTab(v as typeof propertiesTab)}>
        <TabsList className={GHL_TAB_LIST}>
          <TabsTrigger value="general" className={GHL_TAB_TRIGGER}>
            General
          </TabsTrigger>
          <TabsTrigger value="styles" className={GHL_TAB_TRIGGER}>
            Styles
          </TabsTrigger>
          <TabsTrigger value="animations" className={GHL_TAB_TRIGGER}>
            Animations
          </TabsTrigger>
        </TabsList>

        <div className={cn("max-h-[calc(100vh-220px)] overflow-y-auto p-4", GHL_PROPERTIES_PANEL)}>
          <TabsContent value="general" className="mt-0 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Element name</label>
              <input
                readOnly
                value={displayName}
                className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
              />
            </div>
            <GeneralFields />
            {Settings && <Settings />}
          </TabsContent>
          <TabsContent value="styles" className="mt-0">
            {propertiesTab === "styles" && <GhlStylesPanel />}
          </TabsContent>
          <TabsContent value="animations" className="mt-0">
            {propertiesTab === "animations" && <AnimationFields />}
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}

export function RightPropertiesPanel() {
  const chromeTheme = useBuilderStore((s) => s.builderConfig.chromeTheme ?? "dark");
  const mode = useBuilderStore((s) => s.builderConfig.mode);
  const chrome = getBuilderChrome(chromeTheme);
  const isGhl = chromeTheme === "light" && mode === "funnel";

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

  if (isGhl) {
    return (
      <aside className="flex w-[320px] shrink-0 flex-col border-l border-slate-200 bg-white shadow-[-4px_0_24px_rgba(15,23,42,0.04)]">
        {selected ? (
          <NodeProvider id={selected} related>
            <GhlPropertiesBody Settings={Settings} displayName={displayName ?? "Element"} />
          </NodeProvider>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <MousePointer2 className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-900">Select an element</p>
            <p className="mt-1 text-xs text-slate-500">Click any block on the canvas to edit properties.</p>
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside className={cn("flex w-[300px] shrink-0 flex-col", chrome.properties)}>
      <div className="border-b border-inherit px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", chrome.propertiesIcon)}>
            <MousePointer2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className={cn("text-sm font-semibold", chrome.propertiesTitle)}>Properties</h3>
            <p className={cn("text-xs", chrome.propertiesSubtitle)}>
              {selected ? displayName : "No selection"}
            </p>
          </div>
        </div>
      </div>
      <div className={cn("flex-1 overflow-auto p-4", chrome.propertiesPanel)}>
        {Settings ? (
          <Settings />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className={cn("mb-3 flex h-12 w-12 items-center justify-center rounded-full", chrome.propertiesIcon)}>
              <MousePointer2 className="h-5 w-5" />
            </div>
            <p className={cn("text-sm font-medium", chrome.propertiesEmpty)}>Select an element</p>
            <p className={cn("mt-1 max-w-[200px] text-xs", chrome.propertiesEmptyMuted)}>
              Click any block on the canvas to edit its content and styles.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
