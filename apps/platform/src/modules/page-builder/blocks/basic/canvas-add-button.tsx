"use client";

import { Element, useEditor } from "@craftjs/core";
import { Plus } from "lucide-react";
import { Container, Section } from "@/modules/page-builder/blocks/basic";
import { buildRowElement } from "@/modules/page-builder/lib/build-row-element";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { cn } from "@/lib/utils";

type CanvasAddButtonProps = {
  parentId: string;
  variant: "page" | "section" | "container" | "column";
  className?: string;
};

export function CanvasAddButton({ parentId, variant, className }: CanvasAddButtonProps) {
  const { actions, query } = useEditor();
  const setInsertTargetNodeId = useBuilderStore((s) => s.setInsertTargetNodeId);
  const setLeftPanelSection = useBuilderStore((s) => s.setLeftPanelSection);
  const setLeftPanelOpen = useBuilderStore((s) => s.setLeftPanelOpen);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();

    if (variant === "column") {
      setInsertTargetNodeId(parentId);
      setLeftPanelSection("quick-add");
      setLeftPanelOpen(true);
      return;
    }

    let element;
    if (variant === "page") {
      element = (
        <Element is={Section} canvas>
          <Element is={Container} canvas>
            {buildRowElement(1)}
          </Element>
        </Element>
      );
    } else if (variant === "section") {
      element = (
        <Element is={Container} canvas>
          {buildRowElement(1)}
        </Element>
      );
    } else {
      element = buildRowElement(1);
    }

    const tree = query.parseReactElement(element).toNodeTree();
    const parent = query.node(parentId).get();
    const index = parent.data.nodes?.length ?? 0;
    actions.addNodeTree(tree, parentId, index);
  }

  const label =
    variant === "page"
      ? "Add section"
      : variant === "section"
        ? "Add row"
        : variant === "container"
          ? "Add row"
          : "Add";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200",
        "bg-slate-50/50 text-slate-400 transition hover:border-orange-300 hover:bg-orange-50/30 hover:text-orange-500",
        variant === "page" ? "min-h-[400px]" : "min-h-[120px]",
        className,
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm">
        <Plus className="h-5 w-5" />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
