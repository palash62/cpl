"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronDown,
  ExternalLink,
  Eye,
  Globe,
  Settings,
  Trash2,
} from "lucide-react";
import type { OptinFunnelEditorType } from "@prisma/client";
import { usesBuilderRenderer } from "@/lib/optin-funnel";
import { OptinFunnelCraftThumbnail } from "@/components/advertiser/optin-funnel-craft-thumbnail";
import { funnelCraftPreviewRevision } from "@/components/optin/funnel-craft-preview-frame";
import { DEFAULT_THEME } from "@/modules/page-builder/lib/theme";
import { createBlankCraftState } from "@/modules/page-builder/lib/serialize";
import { Button, buttonVariants } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  resolvePreviewUrl,
  type FunnelStepId,
  type FunnelWorkflowConfig,
  type FunnelWorkflowEntity,
} from "./funnel-types";

type FunnelStepOverviewProps = {
  entity: FunnelWorkflowEntity;
  workflow: FunnelWorkflowConfig;
  stepId: FunnelStepId;
  appUrl: string;
  onSettingsClick: () => void;
  onConnectDomainClick?: () => void;
  onEntityUpdated?: (data: unknown) => void;
  onStepDeleted?: () => void;
};

function resolveThumbnail(entity: FunnelWorkflowEntity, stepId: FunnelStepId) {
  const craftState = stepId === "thankYou" ? entity.thankYouCraftState : entity.craftState;
  const themeJson = stepId === "thankYou" ? entity.thankYouThemeJson : entity.themeJson;
  return { craftState, themeJson: themeJson ?? DEFAULT_THEME };
}

function craftNodeName(node: unknown): string | null {
  if (!node || typeof node !== "object") return null;
  return (node as { type?: { resolvedName?: string } }).type?.resolvedName ?? null;
}

function isBlankOrStructuralCraft(craftState: FunnelWorkflowEntity["thankYouCraftState"]): boolean {
  const craft = craftState?.craft;
  if (!craft || Object.keys(craft).length <= 1) return true;

  const structural = new Set(["CanvasRoot", "Section", "Container", "Row", "Column"]);
  return !Object.values(craft).some((node) => {
    const name = craftNodeName(node);
    return !!name && !structural.has(name);
  });
}

function looksLikeOptinSkeleton(craftState: FunnelWorkflowEntity["thankYouCraftState"]): boolean {
  const craft = craftState?.craft;
  if (!craft) return false;
  return Object.values(craft).some((node) => craftNodeName(node) === "LeadForm");
}

function hasThankYouDesign(entity: FunnelWorkflowEntity): boolean {
  if (isBlankOrStructuralCraft(entity.thankYouCraftState)) return false;
  if (looksLikeOptinSkeleton(entity.thankYouCraftState)) return false;
  return true;
}

function hasOptinDesign(entity: FunnelWorkflowEntity): boolean {
  if (entity.editorType) {
    return usesBuilderRenderer({
      editorType: entity.editorType as OptinFunnelEditorType,
      craftState: entity.craftState,
    });
  }
  return !isBlankOrStructuralCraft(entity.craftState);
}

export function FunnelStepOverview({
  entity,
  workflow,
  stepId,
  appUrl,
  onSettingsClick,
  onConnectDomainClick,
  onEntityUpdated,
  onStepDeleted,
}: FunnelStepOverviewProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const stepName = stepId === "thankYou" ? "thank you" : "optin page";
  const { previewPath, previewUrl } = resolvePreviewUrl(entity, workflow, stepId, appUrl);
  const editHref = workflow.editPath(entity.id, stepId);
  const { craftState, themeJson } = resolveThumbnail(entity, stepId);
  const thumbnailRevision = funnelCraftPreviewRevision(craftState?.craft, themeJson);

  const showCraft = stepId === "thankYou" ? hasThankYouDesign(entity) : hasOptinDesign(entity);
  const isBlankThankYou = stepId === "thankYou" && !hasThankYouDesign(entity);

  async function patchEntity(body: Record<string, unknown>) {
    const res = await fetch(`${workflow.apiBasePath}/${entity.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message ?? "Unable to update funnel");
    }
    return data.data;
  }

  async function handleCreateFromBlank() {
    if (stepId !== "thankYou") {
      router.push(editHref);
      return;
    }
    setResetting(true);
    try {
      const blank = createBlankCraftState();
      const saved = await patchEntity({
        thankYouEnabled: true,
        thankYouCraftState: blank,
        step: "thankYou",
      });
      onEntityUpdated?.(saved);
      toast.success("Thank you page reset to blank");
      router.push(editHref);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to reset thank you page");
    } finally {
      setResetting(false);
    }
  }

  async function handleDeleteStep() {
    if (stepId !== "thankYou") return;
    if (!window.confirm("Delete the thank you step? This removes its page design.")) return;

    setDeleting(true);
    try {
      const saved = await patchEntity({
        thankYouEnabled: false,
        thankYouCraftState: null,
      });
      onEntityUpdated?.(saved);
      onStepDeleted?.();
      toast.success("Thank you step deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to delete step");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-semibold capitalize text-slate-900">{stepName}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(buttonVariants({ size: "sm" }))}>
              Edit
              <ChevronDown className="ml-1 h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => router.push(editHref)}>
                Use existing
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={resetting}
                onClick={() => void handleCreateFromBlank()}
              >
                Create from blank
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <a
            href={previewPath}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Eye className="mr-1.5 h-4 w-4" />
            Preview
          </a>
          <Button variant="outline" size="sm" className="h-8" onClick={onSettingsClick}>
            <Settings className="mr-1.5 h-4 w-4" />
            Funnel settings
          </Button>
          {onConnectDomainClick && (
            <Button variant="outline" size="sm" className="h-8" onClick={onConnectDomainClick}>
              <Globe className="mr-1.5 h-4 w-4" />
              Connect domain
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6 p-5">
        {workflow.showPublishHint && !entity.isPublished && (
          <p className="text-sm text-amber-700">
            Please publish your funnel to see it live. Visitors can preview drafts from the editor.
          </p>
        )}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Settings className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input readOnly value={previewUrl} className="h-10 border-slate-200 bg-slate-50 pl-9 pr-10 font-mono text-xs" />
          </div>
          <a
            href={previewPath}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-10 w-10 shrink-0")}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Control</p>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="bg-slate-50 p-4">
              <div className="relative mx-auto aspect-[16/10] w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm">
                {showCraft && !isBlankThankYou ? (
                  <OptinFunnelCraftThumbnail
                    key={`${stepId}-${thumbnailRevision}`}
                    craftState={craftState}
                    themeJson={themeJson}
                    scale={0.28}
                    emptyFallback="blank"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <p className="text-sm text-slate-500">No page design yet</p>
                    <ButtonLink href={editHref} size="sm">
                      Create from blank
                    </ButtonLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4">
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
          disabled={stepId === "optin" || deleting}
          onClick={() => void handleDeleteStep()}
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          {deleting ? "Deleting..." : "Delete funnel step"}
        </Button>
      </div>
    </div>
  );
}
