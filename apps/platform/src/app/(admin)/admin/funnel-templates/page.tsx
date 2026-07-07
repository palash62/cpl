"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { OptinFunnelCraftThumbnail } from "@/components/advertiser/optin-funnel-craft-thumbnail";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import { cn } from "@/lib/utils";

type TemplateCard = {
  id: string;
  name: string;
  createdAt: string;
  craftState: CraftSerializedState;
  themeJson: ThemeJson;
};

export default function AdminFunnelTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState("");

  async function loadTemplates() {
    setLoading(true);
    const res = await fetch("/api/v1/admin/optin-funnel-templates");
    const body = await res.json().catch(() => ({}));
    setTemplates(body.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void loadTemplates();
  }, []);

  async function createTemplate() {
    if (name.trim().length < 2) {
      toast.error("Template name must be at least 2 characters.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/v1/admin/optin-funnel-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body?.error?.message ?? "Failed to create template.");
      return;
    }
    const { data } = await res.json();
    toast.success("Template created. Opening builder...");
    router.push(`/admin/funnel-templates/${data.id}/edit`);
  }

  async function deleteTemplate(template: TemplateCard) {
    if (!confirm(`Delete template "${template.name}"? This cannot be undone.`)) return;
    setDeletingId(template.id);
    const res = await fetch(`/api/v1/admin/optin-funnel-templates/${template.id}`, {
      method: "DELETE",
    });
    setDeletingId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body?.error?.message ?? "Failed to delete template.");
      return;
    }
    setTemplates((prev) => prev.filter((t) => t.id !== template.id));
    toast.success("Template deleted.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Funnel Templates</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create and design opt-in page templates. Advertisers will see these when creating a new funnel.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Create new template</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name"
              onKeyDown={(e) => {
                if (e.key === "Enter") void createTemplate();
              }}
            />
          </div>
          <Button onClick={createTemplate} disabled={saving}>
            <Plus className="mr-2 h-4 w-4" />
            {saving ? "Creating..." : "Create & open builder"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
          Existing templates
        </div>
        <div className="p-4">
          {loading ? (
            <p className="text-sm text-slate-500">Loading templates...</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-slate-500">No templates yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className="relative aspect-4/3 overflow-hidden border-b border-slate-100 bg-slate-50">
                    <OptinFunnelCraftThumbnail
                      craftState={{
                        craft: template.craftState,
                        meta: { schemaVersion: 1, editorBreakPoint: "desktop" },
                      }}
                      themeJson={template.themeJson}
                      scale={0.32}
                    />
                  </div>
                  <div className="space-y-3 p-3">
                    <div>
                      <p className="truncate text-sm font-semibold text-slate-900">{template.name}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(template.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/funnel-templates/${template.id}/edit`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1")}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        disabled={deletingId === template.id}
                        onClick={() => void deleteTemplate(template)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
