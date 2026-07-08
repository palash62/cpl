"use client";

import { useEffect } from "react";
import { useEditor } from "@craftjs/core";
import { cloneNodeTree } from "@/modules/page-builder/lib/clone-node-tree";

export function useBuilderKeyboard() {
  const { actions, query } = useEditor();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        actions.history.undo();
      }
      if (meta && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        actions.history.redo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const selected = query.getEvent("selected").all();
        if (selected.length && !selected.includes("ROOT")) {
          e.preventDefault();
          selected.forEach((id) => {
            if (!query.node(id).isTopLevelNode()) actions.delete(id);
          });
        }
      }
      if (meta && e.key === "d") {
        e.preventDefault();
        const selected = query.getEvent("selected").first();
        if (!selected || selected === "ROOT") return;
        const node = query.node(selected).get();
        const parent = node.data.parent;
        if (!parent) return;
        const siblings = query.node(parent).get().data.nodes ?? [];
        const index = siblings.indexOf(selected);
        if (index < 0) return;
        const tree = cloneNodeTree(query.node(selected).toNodeTree());
        actions.addNodeTree(tree, parent, index + 1);
        actions.selectNode(tree.rootNodeId);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [actions, query]);
}
