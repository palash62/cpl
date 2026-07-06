"use client";

import { useMemo, useState } from "react";
import { Element, useEditor } from "@craftjs/core";
import {
  Search,
  LayoutGrid,
  Rows3,
  Layers,
  Palette,
  FormInput,
  Box,
  Type,
  MousePointerClick,
  FileText,
  Image,
  Code,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { COMPONENT_LIBRARY, craftResolver, type CraftBlockName } from "@/modules/page-builder/blocks";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { BLOCK_ICONS } from "@/modules/page-builder/lib/block-icons";
import { cn } from "@/lib/utils";

const CANVAS_BLOCKS = new Set(["Section", "Container", "Columns", "LeadForm"]);

const RAIL_ITEMS = [
  { id: "quick-add" as const, label: "Quick Add", icon: LayoutGrid },
  { id: "sections" as const, label: "Sections", icon: Box },
  { id: "rows" as const, label: "Rows", icon: Rows3 },
  { id: "elements" as const, label: "Elements", icon: Type },
  { id: "forms" as const, label: "Forms", icon: FormInput },
  { id: "layers" as const, label: "Layers", icon: Layers },
  { id: "theme" as const, label: "Theme", icon: Palette },
];

const QUICK_ADD_ITEMS: Array<{ name: CraftBlockName; label: string; group: string }> = [
  { name: "Columns", label: "1 Column", group: "Rows" },
  { name: "Columns", label: "2 Column", group: "Rows" },
  { name: "Columns", label: "3 Column", group: "Rows" },
  { name: "Columns", label: "4 Column", group: "Rows" },
  { name: "Heading", label: "Headline", group: "Text" },
  { name: "Paragraph", label: "Sub-Headline", group: "Text" },
  { name: "Paragraph", label: "Paragraph", group: "Text" },
  { name: "List", label: "Bullet list", group: "Text" },
  { name: "CtaButton", label: "Button", group: "Form" },
  { name: "LeadForm", label: "Form", group: "Form" },
  { name: "Section", label: "Section", group: "Layout" },
  { name: "HtmlBlock", label: "Custom HTML", group: "Advanced" },
];

const ROW_COLUMNS = [1, 2, 3, 4, 5, 6];

function GridTile({
  name,
  label,
  columns,
  icon: Icon,
}: {
  name: CraftBlockName;
  label: string;
  columns?: number;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const { connectors } = useEditor();
  const Component = craftResolver[name];
  const BlockIcon = Icon ?? BLOCK_ICONS[name];

  return (
    <div
      ref={(ref) => {
        if (ref && Component) {
          const element =
            name === "Columns" && columns ? (
              <Element is={Component} columns={columns} canvas />
            ) : (
              <Element is={Component} canvas={CANVAS_BLOCKS.has(name)} />
            );
          connectors.create(ref, element);
        }
      }}
      className="group flex cursor-grab flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-center transition hover:border-blue-300 hover:bg-blue-50/50 active:cursor-grabbing"
    >
      <div className="flex h-10 w-full items-center justify-center rounded-md bg-slate-50 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600">
        {name === "Columns" && columns ? (
          <div className="flex h-6 w-full max-w-[48px] gap-0.5 px-1">
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="flex-1 rounded-sm bg-current opacity-60" />
            ))}
          </div>
        ) : (
          <BlockIcon className="h-5 w-5" />
        )}
      </div>
      <span className="text-[11px] font-medium leading-tight text-slate-600 group-hover:text-slate-900">
        {label}
      </span>
    </div>
  );
}

function ListDraggable({ name, label }: { name: CraftBlockName; label: string }) {
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
      className="flex cursor-grab items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-blue-300 hover:bg-blue-50/50 active:cursor-grabbing"
    >
      <Icon className="h-4 w-4 text-blue-600" />
      <span className="text-sm text-slate-700">{label}</span>
    </div>
  );
}

function LayersTree() {
  const { nodes, selectedId } = useEditor((state, query) => ({
    nodes: state.nodes,
    selectedId: query.getEvent("selected").first(),
  }));

  function renderNode(id: string, depth = 0): React.ReactNode {
    const node = nodes[id];
    if (!node) return null;
    const name = String(node.data.displayName ?? node.data.type ?? "Element");
    const isSelected = selectedId === id;

    return (
      <div key={id}>
        <div
          className={cn(
            "truncate py-1.5 pr-3 text-xs",
            isSelected ? "bg-blue-50 font-medium text-blue-800" : "text-slate-600 hover:bg-slate-50",
          )}
          style={{ paddingLeft: 12 + depth * 14 }}
        >
          {name}
        </div>
        {node.data.nodes?.map((childId: string) => renderNode(childId, depth + 1))}
      </div>
    );
  }

  return <div className="py-2">{renderNode("ROOT")}</div>;
}

function ThemePanel() {
  const theme = useBuilderStore((s) => s.theme);
  const setTheme = useBuilderStore((s) => s.setTheme);

  return (
    <div className="space-y-4 p-4">
      {[
        { key: "primaryColor" as const, label: "Primary" },
        { key: "secondaryColor" as const, label: "Secondary" },
        { key: "backgroundColor" as const, label: "Background" },
      ].map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-slate-600">{label}</span>
          <input
            type="color"
            value={theme[key]}
            onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
            className="h-8 w-8 cursor-pointer rounded border border-slate-200"
          />
        </div>
      ))}
    </div>
  );
}

export function GhlLeftPanel() {
  const section = useBuilderStore((s) => s.leftPanelSection);
  const setSection = useBuilderStore((s) => s.setLeftPanelSection);
  const open = useBuilderStore((s) => s.leftPanelOpen);
  const [query, setQuery] = useState("");

  const sectionItems = useMemo(() => {
    if (section === "sections") {
      return COMPONENT_LIBRARY.find((g) => g.category === "Basic")?.items.filter((i) =>
        ["Section", "Container", "Spacer", "Divider"].includes(i.name),
      ) ?? [];
    }
    if (section === "elements") {
      return COMPONENT_LIBRARY.flatMap((g) => g.items).filter((i) =>
        !["Section", "Container", "Columns", "LeadForm", "FormInput", "FormTextarea", "FormCheckbox", "FormRadio", "FormSelect", "SubmitButton"].includes(i.name),
      );
    }
    if (section === "forms") {
      return COMPONENT_LIBRARY.flatMap((g) => g.items).filter((i) =>
        ["LeadForm", "CtaButton", "SubmitButton", "FormInput", "FormTextarea", "FormCheckbox", "FormRadio", "FormSelect"].includes(i.name),
      );
    }
    return [];
  }, [section]);

  const filteredSectionItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sectionItems;
    return sectionItems.filter((i) => i.label.toLowerCase().includes(q));
  }, [sectionItems, query]);

  const quickAddGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = q
      ? QUICK_ADD_ITEMS.filter((i) => i.label.toLowerCase().includes(q))
      : QUICK_ADD_ITEMS;
    const groups = new Map<string, typeof QUICK_ADD_ITEMS>();
    for (const item of items) {
      const list = groups.get(item.group) ?? [];
      list.push(item);
      groups.set(item.group, list);
    }
    return groups;
  }, [query]);

  if (!open) {
    return (
      <div className="flex w-12 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
        {RAIL_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => {
              setSection(id);
              useBuilderStore.getState().setLeftPanelOpen(true);
            }}
            className={cn(
              "flex h-11 w-full items-center justify-center text-slate-500 hover:bg-white hover:text-blue-600",
              section === id && "bg-white text-blue-600 shadow-sm",
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex shrink-0 border-r border-slate-200 bg-white">
      <div className="flex w-12 flex-col border-r border-slate-100 bg-slate-50">
        {RAIL_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => setSection(id)}
            className={cn(
              "flex h-11 w-full items-center justify-center text-slate-500 hover:bg-white hover:text-blue-600",
              section === id && "bg-white text-blue-600 shadow-sm",
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <aside className="flex w-[300px] flex-col">
        <div className="border-b border-slate-100 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 rounded-full border-slate-200 bg-slate-50 pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {section === "quick-add" && (
            <div className="space-y-5">
              {Array.from(quickAddGroups.entries()).map(([group, items]) => (
                <div key={group}>
                  <p className="mb-2 text-xs font-semibold text-slate-500">{group}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {items.map((item, idx) => (
                      <GridTile
                        key={`${item.name}-${item.label}-${idx}`}
                        name={item.name}
                        label={item.label}
                        columns={
                          item.group === "Rows"
                            ? parseInt(item.label, 10) || 1
                            : undefined
                        }
                        icon={
                          item.label === "Headline"
                            ? () => <span className="text-lg font-bold">H</span>
                            : item.label === "Sub-Headline"
                              ? () => <span className="text-sm font-bold">T</span>
                              : item.label === "Paragraph"
                                ? () => <span className="text-sm">¶</span>
                                : item.label === "Custom HTML"
                                  ? Code
                                  : item.label === "Form"
                                    ? FileText
                                    : item.label === "Button"
                                      ? MousePointerClick
                                      : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === "rows" && (
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-500">Rows</p>
              <div className="grid grid-cols-3 gap-2">
                {ROW_COLUMNS.map((n) => (
                  <GridTile key={n} name="Columns" label={`${n} Column`} columns={n} />
                ))}
              </div>
            </div>
          )}

          {(section === "sections" || section === "elements" || section === "forms") && (
            <div className="space-y-2">
              {filteredSectionItems.map((item) => (
                <ListDraggable key={item.name + item.label} name={item.name} label={item.label} />
              ))}
            </div>
          )}

          {section === "layers" && <LayersTree />}
          {section === "theme" && <ThemePanel />}
        </div>
      </aside>
    </div>
  );
}
