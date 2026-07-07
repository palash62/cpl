"use client";

import { useEffect, useState } from "react";
import { LayoutTemplate } from "lucide-react";
import { OptinFunnelCraftThumbnail } from "@/components/advertiser/optin-funnel-craft-thumbnail";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import { cn } from "@/lib/utils";

type CreateMode = "blank" | "templates";

type FunnelCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  onCreate: (input: { name: string; editorType: "BUILDER"; pageTemplateId?: string }) => void;
};

type FunnelTemplate = {
  id: string;
  name: string;
  craftState: CraftSerializedState;
  themeJson: ThemeJson;
};

export function FunnelCreateDialog({ open, onOpenChange, loading, onCreate }: FunnelCreateDialogProps) {
  const [mode, setMode] = useState<CreateMode>("blank");
  const [name, setName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templates, setTemplates] = useState<FunnelTemplate[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/v1/advertiser/optin-funnels/templates")
      .then((r) => r.json())
      .then((body) => setTemplates(body.data ?? []))
      .catch(() => setTemplates([]));
  }, [open]);

  function reset() {
    setMode("blank");
    setName("");
    setSelectedTemplate(null);
  }

  function handleClose(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function handleCreate() {
    if (mode === "blank") {
      const trimmed = name.trim();
      if (!trimmed) return;
      onCreate({ name: trimmed, editorType: "BUILDER" });
      return;
    }
    if (mode === "templates" && selectedTemplate) {
      const template = templates.find((t) => t.id === selectedTemplate);
      onCreate({
        name: template?.name ?? "Template Funnel",
        editorType: "BUILDER",
        pageTemplateId: selectedTemplate,
      });
    }
  }

  const canCreate = mode === "blank" ? name.trim().length > 0 : Boolean(selectedTemplate);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create new funnel</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("blank")}
            className={cn(
              "rounded-xl border-2 p-4 text-left transition",
              mode === "blank" ? "border-blue-600 bg-blue-50/50" : "border-slate-200 hover:border-slate-300",
            )}
          >
            <div className="mb-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
              <Label className="text-xs text-slate-500">Funnel name *</Label>
              <Input
                value={name}
                onChange={(e) => {
                  setMode("blank");
                  setName(e.target.value);
                }}
                placeholder="e.g. Sales funnel"
                className="mt-1 h-9 border-slate-200 bg-white"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <p className="font-semibold text-slate-900">From blank</p>
            <p className="mt-1 text-xs text-slate-500">Design from scratch using the funnel builder.</p>
          </button>

          <button
            type="button"
            onClick={() => setMode("templates")}
            className={cn(
              "rounded-xl border-2 p-4 text-left transition",
              mode === "templates" ? "border-blue-600 bg-blue-50/50" : "border-slate-200 hover:border-slate-300",
            )}
          >
            <div className="mb-3 flex h-24 items-center justify-center gap-1 rounded-lg bg-slate-100">
              <div className="h-14 w-10 rounded bg-blue-200" />
              <div className="h-14 w-10 rounded bg-teal-200" />
              <div className="h-14 w-10 rounded bg-violet-200" />
            </div>
            <p className="font-semibold text-slate-900">From templates</p>
            <p className="mt-1 text-xs text-slate-500">Jump start with an awesome prebuilt funnel.</p>
          </button>
        </div>

        {mode === "templates" && (
          <div className="grid max-h-64 gap-3 overflow-y-auto sm:grid-cols-2">
            {templates.length === 0 && (
              <div className="col-span-2 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No templates available yet. Ask admin to create templates.
              </div>
            )}
            {templates.map((template) => (
              <div
                key={template.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedTemplate(template.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedTemplate(template.id);
                  }
                }}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                  selectedTemplate === template.id
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300",
                )}
              >
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-slate-100">
                  <div className="pointer-events-none absolute left-1/2 top-0 w-[480px] origin-top -translate-x-1/2 scale-[0.18]">
                    <OptinFunnelCraftThumbnail
                      craftState={{ craft: template.craftState, meta: { schemaVersion: 1, editorBreakPoint: "desktop" } }}
                      themeJson={template.themeJson}
                      scale={1}
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{template.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">Existing template</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="ghost" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button disabled={!canCreate || loading} onClick={handleCreate}>
            <LayoutTemplate className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
