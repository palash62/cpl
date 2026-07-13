"use client";

import type { MouseEvent, PointerEvent, ReactNode } from "react";
import { useEditor, useNode } from "@craftjs/core";
import { ArrowDown, ArrowUp, Copy, Settings2, Trash2 } from "lucide-react";
import { isGhlBuilderMode } from "@/modules/page-builder/lib/builder-mode";
import { cloneNodeTree } from "@/modules/page-builder/lib/clone-node-tree";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { shouldStretchEditorChrome } from "@/modules/page-builder/lib/responsive";
import type { LayoutProps } from "@/modules/page-builder/types/block-props";
import { cn } from "@/lib/utils";

function stopCraftSelect(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  // Craft attaches selection handlers on mousedown; keep toolbar clicks local.
  e.nativeEvent.stopImmediatePropagation?.();
}

function stopCraftSelectPointer(e: PointerEvent) {
  e.stopPropagation();
  e.nativeEvent.stopImmediatePropagation?.();
}

function onToolbarPointerDown(e: PointerEvent, action: () => void) {
  stopCraftSelectPointer(e);
  action();
}

function GhlNodeChrome({ children }: { children: ReactNode }) {
  const { id, selected, hovered, displayName, parent, layout } = useNode((node) => ({
    selected: node.events.selected,
    hovered: node.events.hovered,
    displayName: String(node.data.displayName ?? node.data.name ?? node.data.type ?? "Element"),
    parent: node.data.parent as string | null,
    layout: (node.data.props as { layout?: LayoutProps } | undefined)?.layout,
  }));

  const { actions, query } = useEditor();
  const setPropertiesTab = useBuilderStore((s) => s.setPropertiesTab);
  const stretch = shouldStretchEditorChrome(displayName, layout);

  function moveSibling(direction: -1 | 1) {
    if (!parent) return;
    const siblings = query.node(parent).get().data.nodes ?? [];
    const index = siblings.indexOf(id);
    if (index < 0) return;
    const next = index + direction;
    if (next < 0 || next >= siblings.length) return;
    // Craft.js same-parent move uses splice-before-remove; moving down needs +1.
    const targetIndex = direction === 1 ? next + 1 : next;
    actions.move(id, parent, targetIndex);
  }

  function duplicateNode() {
    if (!parent) return;
    const siblings = query.node(parent).get().data.nodes ?? [];
    const index = siblings.indexOf(id);
    if (index < 0) return;
    const tree = cloneNodeTree(query.node(id).toNodeTree());
    actions.addNodeTree(tree, parent, index + 1);
    actions.selectNode(tree.rootNodeId);
  }

  function openSettings() {
    actions.selectNode(id);
    setPropertiesTab("general");
  }

  function deleteNode() {
    if (query.node(id).isTopLevelNode()) return;
    actions.delete(id);
  }

  const label = displayName;

  return (
    <div
      data-craft-node={id}
      className={cn(
        "relative",
        stretch && "w-full min-w-0",
        selected && "z-20 ring-2 ring-orange-400 ring-offset-1",
        !selected && hovered && "z-10 ring-1 ring-orange-300 ring-offset-1",
      )}
    >
      {selected && (
        <div
          className="absolute -top-8 left-0 z-50 flex items-center gap-0.5 rounded-md border border-slate-200 bg-white p-0.5 shadow-md"
          onMouseDown={stopCraftSelect}
        >
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100"
            title="Move up"
            onPointerDown={(e) => onToolbarPointerDown(e, () => moveSibling(-1))}
            onMouseDown={stopCraftSelect}
            onClick={(e) => {
              stopCraftSelect(e);
            }}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100"
            title="Move down"
            onPointerDown={(e) => onToolbarPointerDown(e, () => moveSibling(1))}
            onMouseDown={stopCraftSelect}
            onClick={(e) => {
              stopCraftSelect(e);
            }}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100"
            title="Settings"
            onPointerDown={(e) => onToolbarPointerDown(e, openSettings)}
            onMouseDown={stopCraftSelect}
            onClick={(e) => {
              stopCraftSelect(e);
            }}
          >
            <Settings2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100"
            title="Duplicate"
            onPointerDown={(e) => onToolbarPointerDown(e, duplicateNode)}
            onMouseDown={stopCraftSelect}
            onClick={(e) => {
              stopCraftSelect(e);
            }}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded text-red-500 hover:bg-red-50"
            title="Delete"
            onPointerDown={(e) => onToolbarPointerDown(e, deleteNode)}
            onMouseDown={stopCraftSelect}
            onClick={(e) => {
              stopCraftSelect(e);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {children}
      {selected && (
        <span className="pointer-events-none absolute -bottom-6 right-0 z-30 whitespace-nowrap rounded bg-orange-500 px-2 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm">
          {label}
        </span>
      )}
    </div>
  );
}

export function RenderNode({ render }: { render: ReactNode }) {
  const isGhl = useBuilderStore((s) => isGhlBuilderMode(s.builderConfig));

  const { id, selected, hovered, displayName, layout } = useNode((node) => ({
    selected: node.events.selected,
    hovered: node.events.hovered,
    displayName: String(node.data.displayName ?? node.data.name ?? node.data.type ?? "Element"),
    layout: (node.data.props as { layout?: LayoutProps } | undefined)?.layout,
  }));

  if (id === "ROOT") return <>{render}</>;

  if (isGhl) {
    return <GhlNodeChrome>{render}</GhlNodeChrome>;
  }

  const stretch = shouldStretchEditorChrome(displayName, layout);

  return (
    <div
      data-craft-node={id}
      className={cn(
        "relative transition-shadow",
        stretch && "w-full min-w-0",
        selected && "z-10 ring-2 ring-indigo-500 ring-offset-2",
        !selected && hovered && "ring-1 ring-indigo-400/60 ring-offset-1",
      )}
    >
      {render}
    </div>
  );
}
