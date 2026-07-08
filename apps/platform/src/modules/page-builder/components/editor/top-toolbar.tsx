"use client";

import { useRouter } from "next/navigation";
import { useEditor } from "@craftjs/core";
import {
  Undo2, Redo2, Save, Eye, Upload, History, ArrowLeft, Loader2, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeviceSwitcher } from "@/modules/page-builder/components/editor/device-switcher";
import { FunnelStepsPopover } from "@/components/advertiser/funnel/funnel-steps-popover";
import { buildFunnelSteps } from "@/components/advertiser/funnel/funnel-types";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { getBuilderChrome } from "@/modules/page-builder/lib/builder-chrome";
import { isAdminTemplateBuilder, isGhlBuilderMode } from "@/modules/page-builder/lib/builder-mode";
import { savePageCraft } from "@/modules/page-builder/lib/save-page";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TopToolbarProps = { pageId: string; pageName: string; pageSlug: string };

export function TopToolbar({ pageId, pageName, pageSlug }: TopToolbarProps) {
  const router = useRouter();
  const { actions, query, canUndo, canRedo } = useEditor((state, query) => ({
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }));

  const saveStatus = useBuilderStore((s) => s.saveStatus);
  const setPreviewOpen = useBuilderStore((s) => s.setPreviewOpen);
  const setVersionHistoryOpen = useBuilderStore((s) => s.setVersionHistoryOpen);
  const builderConfig = useBuilderStore((s) => s.builderConfig);
  const funnelStep = useBuilderStore((s) => s.funnelStep);
  const chrome = getBuilderChrome(builderConfig.chromeTheme ?? "dark");

  const backHref =
    builderConfig.mode === "funnel" && builderConfig.detailPath
      ? builderConfig.detailPath
      : builderConfig.listPath;

  const stepLabel = funnelStep === "thankYou" ? "thank you" : "optin page";
  const isFunnel = builderConfig.mode === "funnel";
  const isAdminTemplate = isAdminTemplateBuilder(builderConfig);
  const isGhl = isGhlBuilderMode(builderConfig);

  async function handleSave() {
    const json = query.serialize();
    const result = await savePageCraft(pageId, json, { autosave: false });
    if (!result.ok) {
      toast.error(result.errorMessage ?? "Failed to save page");
      return false;
    }
    toast.success("Page saved");
    return true;
  }

  async function handlePublish() {
    const ok = await handleSave();
    if (!ok) return;
    try {
      const res = await fetch(`${builderConfig.apiBasePath}/${pageId}/publish`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error?.message ?? "Publish failed");
      }
      toast.success("Page published");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publish failed");
    }
  }

  async function handleBack() {
    await useBuilderStore.getState().flushSave?.();
    router.push(backHref);
  }

  async function handlePreview() {
    if (isAdminTemplate) {
      await useBuilderStore.getState().flushSave?.();
      window.open(`/admin/funnel-templates/${pageId}/preview`, "_blank", "noopener,noreferrer");
      return;
    }
    if (isFunnel) {
      await useBuilderStore.getState().flushSave?.();
      const thankYouSuffix = funnelStep === "thankYou" ? "/thank-you" : "";
      const previewPath = `${builderConfig.publicPathPrefix}${pageSlug}${thankYouSuffix}?preview=1`;
      window.open(previewPath, "_blank", "noopener,noreferrer");
      return;
    }
    setPreviewOpen(true);
  }

  return (
    <header className={cn("flex h-12 shrink-0 items-center gap-2 px-3", chrome.toolbar)}>
      <button
        type="button"
        onClick={handleBack}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors",
          chrome.toolbarLink,
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className={cn("mx-1.5 h-5 w-px", chrome.toolbarDivider)} />

      {isFunnel && !isAdminTemplate ? (
        <FunnelStepsPopover
          funnelId={pageId}
          steps={buildFunnelSteps(builderConfig.thankYouEnabled ?? false)}
          currentStepId={funnelStep}
          currentStepLabel={stepLabel}
        />
      ) : (
        <div className="min-w-0">
          <p className={cn("truncate text-sm font-semibold", chrome.toolbarTitle)}>{pageName}</p>
          <p className={cn("text-[10px]", chrome.toolbarSubtitle)}>
            {isAdminTemplate ? "Funnel template" : builderConfig.label}
          </p>
        </div>
      )}

      <div className={cn("mx-1.5 h-5 w-px", chrome.toolbarDivider)} />

      {!isGhl && (
        <>
          <div className="hidden items-center gap-0.5 md:flex">
            <Button
              variant="ghost"
              size="icon"
              disabled={!canUndo}
              onClick={() => actions.history.undo()}
              className={cn("h-8 w-8", chrome.toolbarGhost)}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={!canRedo}
              onClick={() => actions.history.redo()}
              className={cn("h-8 w-8", chrome.toolbarGhost)}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          <div className={cn("mx-2 hidden h-6 w-px md:block", chrome.toolbarDivider)} />
        </>
      )}

      <DeviceSwitcher />

      <div className="flex-1" />

      <div className={cn("flex items-center gap-1.5 text-xs", chrome.toolbarSubtitle)}>
        {saveStatus === "saving" && (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </>
        )}
        {saveStatus === "saved" && (
          <>
            <Check className="h-3 w-3 text-emerald-500" />
            <span className="text-emerald-600">Saved</span>
          </>
        )}
        {saveStatus === "idle" && "Autosave on"}
        {saveStatus === "error" && <span className="text-red-500">Save failed</span>}
      </div>

      <div className={cn("mx-1.5 h-5 w-px", chrome.toolbarDivider)} />

      <Button variant="ghost" size="sm" onClick={() => void handlePreview()} className={chrome.toolbarGhost}>
        <Eye className="mr-1.5 h-4 w-4" />
        Preview
      </Button>
      {!isAdminTemplate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setVersionHistoryOpen(true)}
          className={cn("hidden sm:flex", chrome.toolbarGhost, isGhl && "!hidden")}
        >
          <History className="mr-1.5 h-4 w-4" />
          Versions
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={handleSave} className={chrome.toolbarOutline}>
        <Save className="mr-1.5 h-4 w-4" />
        Save
      </Button>
      {!isAdminTemplate && (
        <Button size="sm" onClick={handlePublish} className={chrome.toolbarPublish}>
          <Upload className="mr-1.5 h-4 w-4" />
          Publish
        </Button>
      )}
    </header>
  );
}
