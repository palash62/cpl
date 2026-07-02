"use client";

import Link from "next/link";
import { useEditor } from "@craftjs/core";
import {
  Undo2, Redo2, Save, Eye, Upload, History, ArrowLeft, Loader2, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeviceSwitcher } from "@/modules/page-builder/components/editor/device-switcher";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TopToolbarProps = { pageId: string; pageName: string };

export function TopToolbar({ pageId, pageName }: TopToolbarProps) {
  const { actions, query, canUndo, canRedo } = useEditor((state, query) => ({
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }));

  const saveStatus = useBuilderStore((s) => s.saveStatus);
  const setPreviewOpen = useBuilderStore((s) => s.setPreviewOpen);
  const setVersionHistoryOpen = useBuilderStore((s) => s.setVersionHistoryOpen);

  async function handleSave() {
    const store = useBuilderStore.getState();
    store.setSaveStatus("saving");
    try {
      const json = query.serialize();
      const res = await fetch(`/api/v1/advertiser/landing-pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          craftState: JSON.parse(json),
          themeJson: store.theme,
          autosave: false,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      store.setSaveStatus("saved");
      toast.success("Page saved");
    } catch {
      store.setSaveStatus("error");
      toast.error("Failed to save page");
    }
  }

  async function handlePublish() {
    await handleSave();
    try {
      const res = await fetch(`/api/v1/advertiser/landing-pages/${pageId}/publish`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error?.message ?? "Publish failed");
      }
      toast.success("Page published");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publish failed");
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/[0.08] bg-[#12141c] px-4">
      <Link
        href="/advertiser/landing-pages"
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Exit</span>
      </Link>

      <div className="mx-2 h-6 w-px bg-white/10" />

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{pageName}</p>
        <p className="text-[10px] text-slate-500">Landing Page Builder</p>
      </div>

      <div className="mx-2 hidden h-6 w-px bg-white/10 md:block" />

      <div className="hidden items-center gap-0.5 md:flex">
        <Button
          variant="ghost"
          size="icon"
          disabled={!canUndo}
          onClick={() => actions.history.undo()}
          className="h-8 w-8 text-slate-400 hover:bg-white/10 hover:text-white"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={!canRedo}
          onClick={() => actions.history.redo()}
          className="h-8 w-8 text-slate-400 hover:bg-white/10 hover:text-white"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mx-2 hidden h-6 w-px bg-white/10 md:block" />

      <DeviceSwitcher />

      <div className="flex-1" />

      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        {saveStatus === "saving" && (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </>
        )}
        {saveStatus === "saved" && (
          <>
            <Check className="h-3 w-3 text-emerald-400" />
            <span className="text-emerald-400">Saved</span>
          </>
        )}
        {saveStatus === "idle" && "Auto-save on"}
        {saveStatus === "error" && <span className="text-red-400">Save failed</span>}
      </div>

      <div className="mx-2 h-6 w-px bg-white/10" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setPreviewOpen(true)}
        className="text-slate-300 hover:bg-white/10 hover:text-white"
      >
        <Eye className="mr-1.5 h-4 w-4" />
        Preview
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setVersionHistoryOpen(true)}
        className="hidden text-slate-300 hover:bg-white/10 hover:text-white sm:flex"
      >
        <History className="mr-1.5 h-4 w-4" />
        Versions
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSave}
        className="border-white/10 bg-transparent text-slate-200 hover:bg-white/10"
      >
        <Save className="mr-1.5 h-4 w-4" />
        Save
      </Button>
      <Button
        size="sm"
        onClick={handlePublish}
        className={cn("bg-indigo-600 text-white hover:bg-indigo-500")}
      >
        <Upload className="mr-1.5 h-4 w-4" />
        Publish
      </Button>
    </header>
  );
}
