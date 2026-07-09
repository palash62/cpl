"use client";

import { useMemo, useState } from "react";
import { Element, useEditor } from "@craftjs/core";
import { Search, GripVertical } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMPONENT_LIBRARY, craftResolver, type CraftBlockName } from "@/modules/page-builder/blocks";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { isGhlBuilderMode } from "@/modules/page-builder/lib/builder-mode";
import { getBuilderChrome } from "@/modules/page-builder/lib/builder-chrome";
import { ThemeBackgroundSettings } from "@/modules/page-builder/components/editor/theme-background-settings";
import { useActivePageTheme } from "@/modules/page-builder/hooks/use-active-page-theme";
import { DEFAULT_THEME, type ThemeJson } from "@/modules/page-builder/lib/theme";
import { BLOCK_ICONS, CATEGORY_ICONS } from "@/modules/page-builder/lib/block-icons";
import { GhlLeftPanel } from "@/modules/page-builder/components/editor/ghl-left-panel";
import { cn } from "@/lib/utils";

const CANVAS_BLOCKS = new Set(["Section", "Container", "Columns", "Column", "LeadForm"]);

function ThemeManager({ isLight }: { isLight: boolean }) {
  const { theme, setTheme } = useActivePageTheme();

  function update(key: keyof ThemeJson, value: string) {
    setTheme({ ...theme, [key]: value });
  }

  const labelClass = isLight ? "text-slate-600" : "text-slate-400";
  const inputClass = isLight
    ? "h-8 border-slate-200 bg-white text-sm text-slate-900"
    : "h-8 border-white/10 bg-white/5 text-sm text-slate-200";

  return (
    <div className="space-y-4 p-4">
      {[
        { key: "primaryColor" as const, label: "Primary" },
        { key: "secondaryColor" as const, label: "Secondary" },
      ].map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between gap-3">
          <Label className={cn("text-xs", labelClass)}>{label}</Label>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-500">{theme[key]}</span>
            <input
              type="color"
              value={theme[key]}
              onChange={(e) => update(key, e.target.value)}
              className={cn(
                "h-8 w-8 cursor-pointer rounded-md border bg-transparent",
                isLight ? "border-slate-200" : "border-white/10",
              )}
            />
          </div>
        </div>
      ))}
      <ThemeBackgroundSettings labelClass={labelClass} />
      <div className="space-y-1.5">
        <Label className={cn("text-xs", labelClass)}>Font family</Label>
        <Input value={theme.fontFamily} onChange={(e) => update("fontFamily", e.target.value)} className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <Label className={cn("text-xs", labelClass)}>Button style</Label>
        <select
          className={cn("h-8 w-full rounded-md border px-2 text-sm", inputClass)}
          value={theme.buttonStyle}
          onChange={(e) => setTheme({ ...theme, buttonStyle: e.target.value as ThemeJson["buttonStyle"] })}
        >
          <option value="solid">Solid</option>
          <option value="outline">Outline</option>
          <option value="ghost">Ghost</option>
        </select>
      </div>
      <button
        type="button"
        className={cn("text-xs", isLight ? "text-blue-600 hover:text-blue-700" : "text-indigo-400 hover:text-indigo-300")}
        onClick={() => setTheme(DEFAULT_THEME)}
      >
        Reset to defaults
      </button>
    </div>
  );
}

function LayersTree({ isLight }: { isLight: boolean }) {
  const { actions } = useEditor();
  const { nodes, selectedId } = useEditor((state, query) => ({
    nodes: state.nodes,
    selectedId: query.getEvent("selected").first(),
  }));

  const root = nodes.ROOT;
  if (!root) {
    return <p className="p-4 text-xs text-slate-500">No layers yet</p>;
  }

  function renderNode(id: string, depth = 0): React.ReactNode {
    const node = nodes[id];
    if (!node) return null;
    const name = String(node.data.displayName ?? node.data.type ?? "Element");
    const isSelected = selectedId === id;

    return (
      <div key={id}>
        <button
          type="button"
          onClick={() => actions.selectNode(id)}
          className={cn(
            "flex w-full items-center gap-1.5 truncate py-1.5 pr-3 text-left text-xs transition-colors",
            isSelected
              ? isLight
                ? "bg-blue-50 text-blue-800"
                : "bg-indigo-500/20 text-indigo-200"
              : isLight
                ? "text-slate-600 hover:bg-slate-50"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
          )}
          style={{ paddingLeft: 12 + depth * 14 }}
        >
          <span className="h-1 w-1 shrink-0 rounded-full bg-current opacity-60" />
          {name}
        </button>
        {node.data.nodes?.map((childId: string) => renderNode(childId, depth + 1))}
      </div>
    );
  }

  return <div className="max-h-full overflow-auto py-2">{renderNode("ROOT")}</div>;
}

function DraggableItem({
  name,
  label,
  chrome,
  isLight,
}: {
  name: CraftBlockName;
  label: string;
  chrome: ReturnType<typeof getBuilderChrome>;
  isLight: boolean;
}) {
  const { connectors } = useEditor();
  const Component = craftResolver[name];
  const Icon = BLOCK_ICONS[name];

  return (
    <div
      ref={(ref) => {
        if (ref && Component) {
          connectors.create(ref, <Element is={Component} canvas={CANVAS_BLOCKS.has(name)} />);
        }
      }}
      className={cn(
        "group flex cursor-grab items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all active:cursor-grabbing active:scale-[0.98]",
        chrome.sidebarItem,
      )}
    >
      <GripVertical className="h-3 w-3 shrink-0 text-slate-400" />
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md group-hover:opacity-90",
          isLight ? "bg-blue-100 text-blue-600 group-hover:bg-blue-200" : "bg-indigo-500/15 text-indigo-400 group-hover:bg-indigo-500/25",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className={cn("truncate text-xs font-medium", chrome.sidebarItemText)}>{label}</span>
    </div>
  );
}

export function LeftComponentPanel() {
  const builderConfig = useBuilderStore((s) => s.builderConfig);

  if (isGhlBuilderMode(builderConfig)) {
    return <GhlLeftPanel />;
  }

  return <ClassicLeftComponentPanel />;
}

function ClassicLeftComponentPanel() {
  const leftTab = useBuilderStore((s) => s.leftTab);
  const setLeftTab = useBuilderStore((s) => s.setLeftTab);
  const chromeTheme = useBuilderStore((s) => s.builderConfig.chromeTheme ?? "dark");
  const chrome = getBuilderChrome(chromeTheme);
  const isLight = chromeTheme === "light";
  const [query, setQuery] = useState("");

  const filteredLibrary = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMPONENT_LIBRARY;
    return COMPONENT_LIBRARY.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => item.label.toLowerCase().includes(q) || item.name.toLowerCase().includes(q),
      ),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  return (
    <aside className={cn("flex w-[280px] shrink-0 flex-col", chrome.sidebar)}>
      <Tabs value={leftTab} onValueChange={(v) => setLeftTab(v as typeof leftTab)} className="flex min-h-0 flex-1 flex-col">
        <TabsList className={cn("h-11 w-full shrink-0 rounded-none bg-transparent p-1", chrome.sidebarTabs)}>
          {(["components", "layers", "theme"] as const).map((tab) => (
            <TabsTrigger key={tab} value={tab} className={cn("flex-1 rounded-md text-xs capitalize", chrome.sidebarTab)}>
              {tab === "components" && isLight ? "Quick Add" : tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="components" className="m-0 flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className={cn("shrink-0 border-b p-3", isLight ? "border-slate-100" : "border-white/[0.06]")}>
            <div className="relative">
              <Search className={cn("absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2", chrome.sidebarMuted)} />
              <Input
                placeholder="Search blocks..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={cn("h-8 pl-8 text-sm", chrome.sidebarInput)}
              />
            </div>
            <p className={cn("mt-2 text-[10px]", chrome.sidebarMuted)}>Drag blocks onto the canvas</p>
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto p-3">
            {filteredLibrary.map((group) => {
              const CatIcon = CATEGORY_ICONS[group.category] ?? Search;
              return (
                <div key={group.category}>
                  <div className="mb-2 flex items-center gap-1.5">
                    <CatIcon className={cn("h-3 w-3", isLight ? "text-blue-600" : "text-indigo-400")} />
                    <p className={cn("text-[10px] font-semibold uppercase tracking-widest", chrome.sidebarMuted)}>
                      {group.category}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {group.items.map((item) => (
                      <DraggableItem key={item.name} name={item.name} label={item.label} chrome={chrome} isLight={isLight} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="layers" className="m-0 min-h-0 flex-1 overflow-auto">
          <LayersTree isLight={isLight} />
        </TabsContent>

        <TabsContent value="theme" className="m-0 min-h-0 flex-1 overflow-auto">
          <ThemeManager isLight={isLight} />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
