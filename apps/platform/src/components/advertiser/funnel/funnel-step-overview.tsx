"use client";

import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ExternalLink,
  Eye,
  Settings,
  Trash2,
} from "lucide-react";
import type { SerializedOptinFunnel } from "@/lib/optin-funnel";
import { usesBuilderRenderer } from "@/lib/optin-funnel";
import { PREVIEW_FALLBACK_FIELDS } from "@/lib/optin-page";
import { getOptinTemplate, isOptinTemplateId } from "@/lib/optin-templates";
import { OptinPageLayout } from "@/components/optin/optin-page-layout";
import { OptinFunnelCraftThumbnail } from "@/components/advertiser/optin-funnel-craft-thumbnail";
import { DEFAULT_THEME } from "@/modules/page-builder/lib/theme";
import { Badge } from "@/components/ui/badge";
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
import type { FunnelStepId } from "./funnel-types";

type FunnelStepOverviewProps = {
  funnel: SerializedOptinFunnel;
  stepId: FunnelStepId;
  appUrl: string;
  onSettingsClick: () => void;
};

function resolveThumbnail(funnel: SerializedOptinFunnel, stepId: FunnelStepId) {
  const craftState = stepId === "thankYou" ? funnel.thankYouCraftState : funnel.craftState;
  const themeJson = stepId === "thankYou" ? funnel.thankYouThemeJson : funnel.themeJson;
  return { craftState, themeJson: themeJson ?? DEFAULT_THEME };
}

function templatePreview(funnel: SerializedOptinFunnel, stepId: FunnelStepId) {
  if (stepId !== "optin" || !funnel.templateId || !isOptinTemplateId(funnel.templateId)) {
    return null;
  }
  const template = getOptinTemplate(funnel.templateId);
  return {
    id: funnel.id,
    slug: funnel.slug,
    title: funnel.name,
    destinationUrl: funnel.destinationUrl,
    campaignId: funnel.campaignId,
    templateId: funnel.templateId,
    headline: funnel.headline || template.headline,
    subheadline: funnel.subheadline || template.subheadline,
    description: funnel.description ?? "Instant access to proven strategies.",
    ctaText: funnel.ctaText || "Get Instant Access",
    successTitle: funnel.successTitle || "You're In!",
    successMessage: funnel.successMessage || "Check your inbox.",
    badgeText: funnel.badgeText ?? template.badgeText,
    bulletPoints: funnel.bulletPoints,
    primaryColor: funnel.primaryColor || template.primaryColor,
    accentColor: funnel.accentColor || template.accentColor,
    isPublished: funnel.isPublished,
    campaignName: funnel.name,
    displayTitle: funnel.name,
    fields: PREVIEW_FALLBACK_FIELDS,
    previewMode: true,
  };
}

export function FunnelStepOverview({ funnel, stepId, appUrl, onSettingsClick }: FunnelStepOverviewProps) {
  const router = useRouter();
  const stepName = stepId === "thankYou" ? "thank you" : "optin page";
  const publicPath = stepId === "thankYou" ? `/o/${funnel.slug}/thank-you` : `/o/${funnel.slug}`;
  const previewPath = `${publicPath}?preview=1`;
  const publicUrl = `${appUrl}${previewPath}`;
  const editHref = `/advertiser/optin-funnels/${funnel.id}/edit?step=${stepId}`;
  const { craftState, themeJson } = resolveThumbnail(funnel, stepId);
  const templatePage = templatePreview(funnel, stepId);
  const showCraft = usesBuilderRenderer({
    editorType: funnel.editorType,
    craftState: stepId === "thankYou" ? funnel.thankYouCraftState : funnel.craftState,
  });
  const showTemplate = !showCraft && !!templatePage;

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-semibold capitalize text-slate-900">{stepName}</h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
            Overview
          </Badge>
        </div>
      </div>

      <div className="space-y-6 p-5">
        {!funnel.isPublished && (
          <p className="text-sm text-amber-700">
            Please publish your funnel to see it live. Visitors can preview drafts from the editor.
          </p>
        )}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Settings className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input readOnly value={publicUrl} className="h-10 border-slate-200 bg-slate-50 pl-9 pr-10 font-mono text-xs" />
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
                {showCraft ? (
                  <OptinFunnelCraftThumbnail craftState={craftState} themeJson={themeJson} scale={0.28} />
                ) : showTemplate && templatePage ? (
                  <div className="pointer-events-none absolute left-1/2 top-0 h-[720px] w-[960px] origin-top -translate-x-1/2 scale-[0.28]">
                    <OptinPageLayout
                      page={templatePage}
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
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 p-3">
              <DropdownMenu>
                <DropdownMenuTrigger className={cn(buttonVariants({ size: "sm" }))}>
                  Edit
                  <ChevronDown className="ml-1 h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => router.push(editHref)}>
                    Use existing
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(editHref)}>
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
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4">
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
          disabled={stepId === "optin"}
          onClick={() => toast.info("Step deletion coming in the next phase")}
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          Delete funnel step
        </Button>
      </div>
    </div>
  );
}
