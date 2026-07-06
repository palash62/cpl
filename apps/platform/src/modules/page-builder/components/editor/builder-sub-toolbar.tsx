"use client";

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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { cn } from "@/lib/utils";

export function BuilderSubToolbar() {
  const { actions, canUndo, canRedo } = useEditor((_, query) => ({
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }));

  const pageSlug = useBuilderStore((s) => s.pageSlug);
  const builderConfig = useBuilderStore((s) => s.builderConfig);
  const funnelStep = useBuilderStore((s) => s.funnelStep);
  const leftPanelOpen = useBuilderStore((s) => s.leftPanelOpen);
  const setLeftPanelOpen = useBuilderStore((s) => s.setLeftPanelOpen);
  const setLeftPanelSection = useBuilderStore((s) => s.setLeftPanelSection);
  const setVersionHistoryOpen = useBuilderStore((s) => s.setVersionHistoryOpen);

  const publicPath = `${builderConfig.publicPathPrefix}${pageSlug}${funnelStep === "thankYou" ? "/thank-you" : ""}`;

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
      <div className="flex items-center gap-1 border-b border-slate-100 px-3 py-1.5">
        <Button
          size="sm"
          className="h-8 bg-slate-900 text-white hover:bg-slate-800"
          onClick={() => {
            setLeftPanelSection("quick-add");
            setLeftPanelOpen(!leftPanelOpen);
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Elements
        </Button>

        <div className="mx-1 h-6 w-px bg-slate-200" />

        {tools.slice(1).map(({ icon: Icon, label, onClick }) => (
          <button
            key={label}
            type="button"
            title={label}
            onClick={onClick}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}

        <div className="flex-1" />

        <button
          type="button"
          disabled={!canUndo}
          onClick={() => actions.history.undo()}
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={() => actions.history.redo()}
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30"
        >
          <Redo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setVersionHistoryOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
        >
          <History className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-3 px-4 py-2 text-xs text-slate-500">
        <span className="truncate font-mono text-slate-600">{publicPath}</span>
        <button type="button" className="shrink-0 text-blue-600 hover:underline">
          Connect Domain
        </button>
      </div>
    </div>
  );
}
