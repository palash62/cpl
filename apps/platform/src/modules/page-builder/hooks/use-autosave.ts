"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { savePageCraft } from "@/modules/page-builder/lib/save-page";

const AUTOSAVE_MS = 3000;

function buildSaveFingerprint(serialized: string): string {
  const store = useBuilderStore.getState();
  const theme = store.funnelStep === "thankYou" ? store.thankYouTheme : store.theme;
  return `${serialized}::${JSON.stringify(theme)}`;
}

export function useAutosave(pageId: string) {
  const { query } = useEditor();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");
  const setFlushSave = useBuilderStore((s) => s.setFlushSave);

  useEffect(() => {
    async function flushSave() {
      const serialized = query.serialize();
      const fingerprint = buildSaveFingerprint(serialized);
      if (fingerprint === lastSavedRef.current) return true;
      const result = await savePageCraft(pageId, serialized, { autosave: true });
      if (result.ok) lastSavedRef.current = fingerprint;
      return result.ok;
    }

    lastSavedRef.current = buildSaveFingerprint(query.serialize());
    setFlushSave(flushSave);

    const interval = setInterval(() => {
      const serialized = query.serialize();
      const fingerprint = buildSaveFingerprint(serialized);
      if (fingerprint === lastSavedRef.current) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const nextSerialized = query.serialize();
        const nextFingerprint = buildSaveFingerprint(nextSerialized);
        if (nextFingerprint === lastSavedRef.current) return;
        const result = await savePageCraft(pageId, nextSerialized, { autosave: true });
        if (result.ok) lastSavedRef.current = nextFingerprint;
      }, AUTOSAVE_MS);
    }, 1000);

    return () => {
      setFlushSave(null);
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pageId, query, setFlushSave]);
}
