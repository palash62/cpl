"use client";

import { useEffect, useState } from "react";
import { useEditor } from "@craftjs/core";
import {
  Plus,
  Layers,
  Code,
  Type,
  Image,
  LayoutTemplate,
  Undo2,
  Redo2,
  History,
  Link2,
  Settings,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { isAdminTemplateBuilder } from "@/modules/page-builder/lib/builder-mode";
import { cn } from "@/lib/utils";

export function BuilderSubToolbar() {
  const { actions, canUndo, canRedo } = useEditor((_, query) => ({
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }));

  const pageSlug = useBuilderStore((s) => s.pageSlug);
  const builderConfig = useBuilderStore((s) => s.builderConfig);
  const isAdminTemplate = isAdminTemplateBuilder(builderConfig);
  const funnelStep = useBuilderStore((s) => s.funnelStep);
  const leftPanelOpen = useBuilderStore((s) => s.leftPanelOpen);
  const setLeftPanelOpen = useBuilderStore((s) => s.setLeftPanelOpen);
  const setLeftPanelSection = useBuilderStore((s) => s.setLeftPanelSection);
  const setVersionHistoryOpen = useBuilderStore((s) => s.setVersionHistoryOpen);
  const setPageSettingsOpen = useBuilderStore((s) => s.setPageSettingsOpen);
  const saveStatus = useBuilderStore((s) => s.saveStatus);
  const pageId = useBuilderStore((s) => s.pageId);
  const setPageMeta = useBuilderStore((s) => s.setPageMeta);
  const campaignId = useBuilderStore((s) => s.campaignId);
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string; status?: string }>>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");

  const publicPath = `${builderConfig.publicPathPrefix}${pageSlug}${funnelStep === "thankYou" ? "/thank-you" : ""}`;

  useEffect(() => {
    fetch("/api/v1/campaigns?limit=100")
      .then((r) => r.json())
      .then((body) => setCampaigns(body.data ?? []))
      .catch(() => setCampaigns([]));
  }, []);

  useEffect(() => {
    setSelectedCampaignId(campaignId ?? "");
  }, [campaignId]);

  async function linkCampaign(campaignId: string) {
    if (!pageId) return;
    setSelectedCampaignId(campaignId);
    const res = await fetch(`${builderConfig.apiBasePath}/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId: campaignId || null }),
    });
    if (res.ok) {
      setPageMeta({ campaignId: campaignId || null });
    }
  }

  const tools = [
    { icon: Plus, label: "Add", onClick: () => { setLeftPanelSection("quick-add"); setLeftPanelOpen(true); } },
    { icon: Layers, label: "Layers", onClick: () => { setLeftPanelSection("layers"); setLeftPanelOpen(true); } },
    { icon: LayoutTemplate, label: "Sections", onClick: () => { setLeftPanelSection("sections"); setLeftPanelOpen(true); } },
    { icon: Code, label: "Code", onClick: () => { setLeftPanelSection("elements"); setLeftPanelOpen(true); } },
    { icon: Type, label: "Text", onClick: () => { setLeftPanelSection("quick-add"); setLeftPanelOpen(true); } },
    { icon: Image, label: "Media", onClick: () => { setLeftPanelSection("elements"); setLeftPanelOpen(true); } },
  ];

  return (
    <div className="flex shrink-0 flex-col border-b border-slate-200 bg-white">
      <div className="flex items-center gap-1 border-b border-slate-100 px-2.5 py-1.5">
        <Button
          size="sm"
          className="h-7 rounded-md bg-slate-900 px-3 text-[11px] font-semibold text-white hover:bg-slate-800"
          onClick={() => {
            setLeftPanelSection("quick-add");
            setLeftPanelOpen(!leftPanelOpen);
          }}
        >
          <Plus className="mr-1.5 h-3 w-3" />
          Add Elements
        </Button>

        <div className="mx-1 h-6 w-px bg-slate-200" />

        {tools.slice(1).map(({ icon: Icon, label, onClick }) => (
          <button
            key={label}
            type="button"
            title={label}
            onClick={onClick}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}

        <div className="flex-1" />

        <button
          type="button"
          disabled={!canUndo}
          onClick={() => actions.history.undo()}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={() => actions.history.redo()}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setVersionHistoryOpen(true)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
          title="Version history"
        >
          <History className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setPageSettingsOpen(true)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
          title="Page settings"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-1.5 px-2 text-[11px] text-slate-500">
          {saveStatus === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {saveStatus === "saved" && <Check className="h-3.5 w-3.5 text-green-600" />}
          <span>
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Save failed" : "Autosave on"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-slate-600">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate font-mono text-slate-600">
            {isAdminTemplate ? `Template: ${pageSlug}` : publicPath}
          </span>
          {!isAdminTemplate && (
            <button type="button" className="shrink-0 text-blue-600 hover:underline">
              Connect Domain
            </button>
          )}
        </div>
        {!isAdminTemplate && (
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 shadow-sm">
            <Link2 className="h-4 w-4 text-blue-600" />
            <span className="text-[12px] font-semibold text-slate-700">Campaign</span>
            <select
              className="h-8 min-w-[230px] rounded-md border border-blue-200 bg-blue-50 px-2.5 text-[12px] font-medium text-slate-800 focus:border-blue-400 focus:outline-none"
              value={selectedCampaignId}
              onChange={(e) => linkCampaign(e.target.value)}
            >
              <option value="">Select campaign...</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.status ? `(${c.status})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex-1" />
      </div>
    </div>
  );
}
