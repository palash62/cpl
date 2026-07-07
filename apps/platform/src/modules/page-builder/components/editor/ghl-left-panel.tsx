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
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { COMPONENT_LIBRARY, craftResolver, type CraftBlockName } from "@/modules/page-builder/blocks";
import { buildRowElement } from "@/modules/page-builder/lib/build-row-element";
import { useInsertBlock } from "@/modules/page-builder/hooks/use-insert-block";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { BLOCK_ICONS } from "@/modules/page-builder/lib/block-icons";
import { cn } from "@/lib/utils";

const CANVAS_BLOCKS = new Set(["Section", "Container", "Columns", "Column", "LeadForm"]);

const RAIL_ITEMS = [
  { id: "quick-add" as const, label: "Quick Add", icon: LayoutGrid },
  { id: "sections" as const, label: "Sections", icon: Box },
  { id: "rows" as const, label: "Rows", icon: Rows3 },
  { id: "elements" as const, label: "Elements", icon: Type },
  { id: "forms" as const, label: "Forms & Surveys", icon: FormInput },
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
  { name: "BlogPosts", label: "Blog Posts", group: "Blog" },
  { name: "CategoryNavigation", label: "Category Navigation", group: "Blog" },
  { name: "SocialShare", label: "Social Share", group: "Blog" },
  { name: "SubscribeToMailingList", label: "Subscribe to Mailing List", group: "Blog" },
  { name: "ImageSlider", label: "Image Slider", group: "Media" },
  { name: "Video", label: "Video", group: "Media" },
  { name: "Image", label: "Image", group: "Media" },
  { name: "Faq", label: "FAQ", group: "Elements" },
  { name: "PhotoGallery", label: "Photo Gallery", group: "Elements" },
  { name: "LogoShowcase", label: "Logo Showcase", group: "Elements" },
  { name: "Testimonials", label: "Testimonials", group: "Elements" },
  { name: "ProgressBar", label: "Progress Bar", group: "Elements" },
  { name: "SocialIconsGroup", label: "Social Icons", group: "Elements" },
  { name: "Survey", label: "Survey", group: "Custom" },
  { name: "MapBlock", label: "Map", group: "Elements" },
  { name: "Reviews", label: "Reviews", group: "Custom" },
  { name: "NavigationMenu", label: "Navigation Menu", group: "Blocks" },
  { name: "Divider", label: "Divider", group: "Blocks" },
  { name: "CalendarBlock", label: "Calendar", group: "Elements" },
  { name: "Countdown", label: "Countdown", group: "Timer" },
  { name: "MinuteTimer", label: "Minute Timer", group: "Timer" },
  { name: "DayTimer", label: "Day Timer", group: "Timer" },
  { name: "ImageFeature", label: "Image Feature", group: "Blocks" },
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
  const { insertBlock, insertTargetNodeId } = useInsertBlock();
  const Component = craftResolver[name];
  const BlockIcon = Icon ?? BLOCK_ICONS[name];

  function buildElement() {
    if (name === "Columns" && columns) {
      return buildRowElement(columns);
    }
    return <Element is={Component} canvas={CANVAS_BLOCKS.has(name)} />;
  }

  return (
    <div
      ref={(ref) => {
        if (ref && name in craftResolver && !insertTargetNodeId) {
          connectors.create(ref, buildElement());
        }
      }}
      onClick={() => {
        if (insertTargetNodeId) {
          insertBlock(name, columns ? { columns } : undefined);
        }
      }}
      className={cn(
        "group flex min-h-[88px] cursor-grab flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center transition hover:border-blue-300 hover:bg-blue-50/50 active:cursor-grabbing",
        insertTargetNodeId && "cursor-pointer ring-2 ring-orange-200",
      )}
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
      <span className="line-clamp-2 min-h-[2.5em] text-[10px] font-medium leading-tight text-slate-600 group-hover:text-slate-900">
        {label}
      </span>
    </div>
  );
}

function LayersTree() {
  const { nodes, selectedId, actions } = useEditor((state, query) => ({
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
        <button
          type="button"
          onClick={() => actions.selectNode(id)}
          className={cn(
            "block w-full truncate py-1.5 pr-3 text-left text-xs",
            isSelected ? "bg-blue-50 font-medium text-blue-800" : "text-slate-600 hover:bg-slate-50",
          )}
          style={{ paddingLeft: 12 + depth * 14 }}
        >
          {name}
        </button>
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
        !["Section", "Container", "Columns", "LeadForm", "FormInput", "FormTextarea", "FormCheckbox", "FormRadio", "FormSelect", "SubmitButton", "CustomCss"].includes(i.name),
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
      <div className="flex w-[108px] flex-col border-r border-slate-100 bg-slate-50">
        {RAIL_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => setSection(id)}
            className={cn(
              "flex h-10 w-full items-center gap-2 px-3 text-left text-slate-600 hover:bg-white hover:text-blue-600",
              section === id && "bg-white text-blue-600 shadow-sm",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>

      <aside className="flex w-[320px] flex-col">
        <div className="border-b border-slate-100 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {section === "quick-add" ? "Quick Add" : RAIL_ITEMS.find((i) => i.id === section)?.label}
            </p>
            <button
              type="button"
              onClick={() => useBuilderStore.getState().setLeftPanelOpen(false)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              title="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
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
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group}</p>
                  <div className="grid grid-cols-3 gap-2.5">
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
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {section === "sections" ? "Section Blocks" : section === "forms" ? "Form Elements" : "Elements"}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {filteredSectionItems.map((item) => (
                  <GridTile key={item.name + item.label} name={item.name} label={item.label} />
                ))}
              </div>
              {filteredSectionItems.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                  No elements match your search.
                </div>
              )}
            </div>
          )}

          {section === "layers" && <LayersTree />}
          {section === "theme" && <ThemePanel />}
        </div>
      </aside>
    </div>
  );
}
