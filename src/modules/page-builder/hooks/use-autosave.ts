"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";

const AUTOSAVE_MS = 3000;

export function useAutosave(pageId: string) {
  const { query } = useEditor();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    const interval = setInterval(() => {
      const serialized = query.serialize();
      if (serialized === lastSavedRef.current) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const store = useBuilderStore.getState();
        store.setSaveStatus("saving");
        try {
          const res = await fetch(`/api/v1/advertiser/landing-pages/${pageId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              craftState: JSON.parse(serialized),
              themeJson: store.theme,
              autosave: true,
            }),
          });
          if (res.ok) {
            lastSavedRef.current = serialized;
            store.setSaveStatus("saved");
          } else {
            store.setSaveStatus("error");
          }
        } catch {
          store.setSaveStatus("error");
        }
      }, AUTOSAVE_MS);
    }, 1000);

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pageId, query]);
}
