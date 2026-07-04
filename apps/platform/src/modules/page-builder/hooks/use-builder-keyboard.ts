"use client";

import { useEffect } from "react";
import { useEditor } from "@craftjs/core";

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
          selected.forEach((id) => actions.delete(id));
        }
      }
      if (meta && e.key === "d") {
        e.preventDefault();
        // Duplicate via Craft clone is version-specific; use toolbar duplicate page instead
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [actions, query]);
}
