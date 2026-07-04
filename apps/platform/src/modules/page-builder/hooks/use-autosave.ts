"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { savePageCraft } from "@/modules/page-builder/lib/save-page";

const AUTOSAVE_MS = 3000;

export function useAutosave(pageId: string) {
  const { query } = useEditor();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");
  const setFlushSave = useBuilderStore((s) => s.setFlushSave);

  useEffect(() => {
    async function flushSave() {
      const serialized = query.serialize();
      if (serialized === lastSavedRef.current) return true;
      const result = await savePageCraft(pageId, serialized, { autosave: true });
      if (result.ok) lastSavedRef.current = serialized;
      return result.ok;
    }

    setFlushSave(flushSave);

    const interval = setInterval(() => {
      const serialized = query.serialize();
      if (serialized === lastSavedRef.current) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const result = await savePageCraft(pageId, serialized, { autosave: true });
        if (result.ok) lastSavedRef.current = serialized;
      }, AUTOSAVE_MS);
    }, 1000);

    return () => {
      setFlushSave(null);
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pageId, query, setFlushSave]);
}
