"use client";

import type { ReactElement } from "react";
import { useCallback } from "react";
import { Element, useEditor } from "@craftjs/core";
import { craftResolver, type CraftBlockName } from "@/modules/page-builder/blocks";
import { buildRowElement } from "@/modules/page-builder/lib/build-row-element";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";

const CANVAS_BLOCKS = new Set(["Section", "Container", "Columns", "Column", "LeadForm"]);

export function useInsertBlock() {
  const { actions, query } = useEditor();
  const insertTargetNodeId = useBuilderStore((s) => s.insertTargetNodeId);
  const setInsertTargetNodeId = useBuilderStore((s) => s.setInsertTargetNodeId);

  const insertBlock = useCallback(
    (name: CraftBlockName, options?: { columns?: number }) => {
      const targetId = insertTargetNodeId ?? query.getEvent("selected").first();
      if (!targetId) return false;

      const targetNode = query.node(targetId).get();
      const isCanvas = targetNode?.data?.isCanvas === true;
      if (!isCanvas) return false;

      let element: ReactElement;
      if (name === "Columns" && options?.columns) {
        element = buildRowElement(options.columns);
      } else {
        const Component = craftResolver[name];
        element = <Element is={Component} canvas={CANVAS_BLOCKS.has(name)} {...(options ?? {})} />;
      }

      const tree = query.parseReactElement(element).toNodeTree();
      const index = targetNode.data.nodes?.length ?? 0;
      actions.addNodeTree(tree, targetId, index);
      actions.selectNode(tree.rootNodeId);
      setInsertTargetNodeId(null);
      return true;
    },
    [actions, query, insertTargetNodeId, setInsertTargetNodeId],
  );

  return { insertBlock, insertTargetNodeId, setInsertTargetNodeId };
}
