"use client";

import { useState } from "react";
import { LayoutTemplate, Sparkles } from "lucide-react";
import { listOptinTemplates } from "@/lib/optin-templates";
import { OptinPageLayout } from "@/components/optin/optin-page-layout";
import { PREVIEW_FALLBACK_FIELDS } from "@/lib/optin-page";
import type { OptinTemplateDefinition } from "@/lib/optin-templates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type CreateMode = "blank" | "ai" | "templates";

type FunnelCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  onCreate: (input: { name: string; editorType: "BUILDER"; templateId?: string }) => void;
};

function templatePreview(template: OptinTemplateDefinition) {
  return {
    id: "preview",
    slug: "preview",
    title: template.name,
    destinationUrl: null,
    campaignId: null,
    templateId: template.id,
    headline: template.headline,
    subheadline: template.subheadline,
    description: "Instant access to proven strategies that turn visitors into customers.",
    ctaText: "Get Instant Access — It's Free",
    successTitle: "You're In!",
    successMessage: "Check your inbox — your free playbook is on its way.",
    badgeText: template.badgeText,
    bulletPoints: ["Proven playbook you can use today"],
    primaryColor: template.primaryColor,
    accentColor: template.accentColor,
    isPublished: false,
    campaignName: template.name,
    displayTitle: template.name,
    fields: PREVIEW_FALLBACK_FIELDS,
    previewMode: true,
  };
}

export function FunnelCreateDialog({ open, onOpenChange, loading, onCreate }: FunnelCreateDialogProps) {
  const [mode, setMode] = useState<CreateMode>("blank");
  const [name, setName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const templates = listOptinTemplates();

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
        templateId: selectedTemplate,
      });
    }
  }

  const canCreate =
    mode === "blank"
      ? name.trim().length > 0
      : mode === "templates"
        ? Boolean(selectedTemplate)
        : false;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create new funnel</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-3">
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
            disabled
            className="relative rounded-xl border-2 border-slate-200 p-4 text-left opacity-60"
          >
            <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100">
              <Sparkles className="h-8 w-8 text-violet-500" />
            </div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-900">Build with AI</p>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                Beta
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">Coming soon</p>
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
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedTemplate(template.id)}
                className={cn(
                  "flex gap-3 rounded-lg border p-3 text-left transition",
                  selectedTemplate === template.id
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300",
                )}
              >
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-slate-100">
                  <div className="pointer-events-none absolute left-1/2 top-0 h-[360px] w-[480px] origin-top -translate-x-1/2 scale-[0.18]">
                    <OptinPageLayout
                      page={templatePreview(template)}
                      thumbnail
                      data={{}}
                      setData={() => {}}
                      honeypot=""
                      setHoneypot={() => {}}
                      error=""
                      status="idle"
                      onSubmit={(e) => e.preventDefault()}
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{template.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{template.description}</p>
                </div>
              </button>
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
