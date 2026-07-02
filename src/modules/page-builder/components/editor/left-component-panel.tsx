"use client";

import { useMemo, useState } from "react";
import { Element, useEditor } from "@craftjs/core";
import { Search, GripVertical } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMPONENT_LIBRARY, craftResolver, type CraftBlockName } from "@/modules/page-builder/blocks";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { DEFAULT_THEME, type ThemeJson } from "@/modules/page-builder/lib/theme";
import { BLOCK_ICONS, CATEGORY_ICONS } from "@/modules/page-builder/lib/block-icons";
import { cn } from "@/lib/utils";

const CANVAS_BLOCKS = new Set(["Section", "Container", "Columns", "LeadForm"]);

function ThemeManager() {
  const theme = useBuilderStore((s) => s.theme);
  const setTheme = useBuilderStore((s) => s.setTheme);

  function update(key: keyof ThemeJson, value: string) {
    setTheme({ ...theme, [key]: value });
  }

  return (
    <div className="space-y-4 p-4">
      {[
        { key: "primaryColor" as const, label: "Primary" },
        { key: "secondaryColor" as const, label: "Secondary" },
        { key: "backgroundColor" as const, label: "Background" },
      ].map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between gap-3">
          <Label className="text-xs text-slate-400">{label}</Label>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-500">{theme[key]}</span>
            <input
              type="color"
              value={theme[key]}
              onChange={(e) => update(key, e.target.value)}
              className="h-8 w-8 cursor-pointer rounded-md border border-white/10 bg-transparent"
            />
          </div>
        </div>
      ))}
      <div className="space-y-1.5">
        <Label className="text-xs text-slate-400">Font family</Label>
        <Input
          value={theme.fontFamily}
          onChange={(e) => update("fontFamily", e.target.value)}
          className="h-8 border-white/10 bg-white/5 text-sm text-slate-200"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-slate-400">Button style</Label>
        <select
          className="h-8 w-full rounded-md border border-white/10 bg-white/5 px-2 text-sm text-slate-200"
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
        className="text-xs text-indigo-400 hover:text-indigo-300"
        onClick={() => setTheme(DEFAULT_THEME)}
      >
        Reset to defaults
      </button>
    </div>
  );
}

function LayersTree() {
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
        <div
          className={cn(
            "flex items-center gap-1.5 truncate py-1.5 pr-3 text-xs transition-colors",
            isSelected ? "bg-indigo-500/20 text-indigo-200" : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
          )}
          style={{ paddingLeft: 12 + depth * 14 }}
        >
          <span className="h-1 w-1 shrink-0 rounded-full bg-current opacity-60" />
          {name}
        </div>
        {node.data.nodes?.map((childId: string) => renderNode(childId, depth + 1))}
      </div>
    );
  }

  return <div className="max-h-full overflow-auto py-2">{renderNode("ROOT")}</div>;
}

function DraggableItem({ name, label }: { name: CraftBlockName; label: string }) {
  const { connectors } = useEditor();
  const Component = craftResolver[name];
  const Icon = BLOCK_ICONS[name];

  return (
    <div
      ref={(ref) => {
        if (ref && Component) {
          connectors.create(
            ref,
            <Element is={Component} canvas={CANVAS_BLOCKS.has(name)} />,
          );
        }
      }}
      className="group flex cursor-grab items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-2 text-left transition-all hover:border-indigo-500/40 hover:bg-indigo-500/10 active:cursor-grabbing active:scale-[0.98]"
    >
      <GripVertical className="h-3 w-3 shrink-0 text-slate-600 group-hover:text-indigo-400" />
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/15 text-indigo-400 group-hover:bg-indigo-500/25">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="truncate text-xs font-medium text-slate-300 group-hover:text-white">{label}</span>
    </div>
  );
}

export function LeftComponentPanel() {
  const leftTab = useBuilderStore((s) => s.leftTab);
  const setLeftTab = useBuilderStore((s) => s.setLeftTab);
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
    <aside className="flex w-[280px] shrink-0 flex-col border-r border-white/[0.08] bg-[#12141c]">
      <Tabs value={leftTab} onValueChange={(v) => setLeftTab(v as typeof leftTab)} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="h-11 w-full shrink-0 rounded-none border-b border-white/[0.08] bg-transparent p-1">
          {(["components", "layers", "theme"] as const).map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="flex-1 rounded-md text-xs capitalize text-slate-400 data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="components" className="m-0 flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-white/[0.06] p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search blocks..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-8 border-white/10 bg-white/5 pl-8 text-sm text-slate-200 placeholder:text-slate-500"
              />
            </div>
            <p className="mt-2 text-[10px] text-slate-500">Drag blocks onto the canvas</p>
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto p-3">
            {filteredLibrary.map((group) => {
              const CatIcon = CATEGORY_ICONS[group.category] ?? Search;
              return (
                <div key={group.category}>
                  <div className="mb-2 flex items-center gap-1.5">
                    <CatIcon className="h-3 w-3 text-indigo-400" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      {group.category}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {group.items.map((item) => (
                      <DraggableItem key={item.name} name={item.name} label={item.label} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="layers" className="m-0 min-h-0 flex-1 overflow-auto">
          <LayersTree />
        </TabsContent>

        <TabsContent value="theme" className="m-0 min-h-0 flex-1 overflow-auto">
          <ThemeManager />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
