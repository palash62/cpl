"use client";

import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  GitBranch,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import type { SerializedOptinFunnel } from "@/lib/optin-funnel";
import { PREVIEW_FALLBACK_FIELDS } from "@/lib/optin-page";
import { getOptinTemplate, isOptinTemplateId } from "@/lib/optin-templates";
import { OptinPageLayout } from "@/components/optin/optin-page-layout";
import { OptinFunnelCraftThumbnail } from "@/components/advertiser/optin-funnel-craft-thumbnail";
import { createEmptyCraftState } from "@/modules/page-builder/lib/serialize";
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

export function FunnelStepOverview({ funnel, stepId, appUrl }: FunnelStepOverviewProps) {
  const router = useRouter();
  const stepName = stepId === "thankYou" ? "thank you" : "optin page";
  const publicPath = stepId === "thankYou" ? `/o/${funnel.slug}/thank-you` : `/o/${funnel.slug}`;
  const publicUrl = `${appUrl}${publicPath}`;
  const editHref = `/advertiser/optin-funnels/${funnel.id}/edit?step=${stepId}`;
  const { craftState, themeJson } = resolveThumbnail(funnel, stepId);
  const templatePage = templatePreview(funnel, stepId);
  const hasCraft = craftState?.craft && Object.keys(craftState.craft).length > 1;

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-semibold capitalize text-slate-900">{stepName}</h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
            Overview
          </Badge>
        </div>
      </div>

      <div className="flex-1 space-y-6 p-5">
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
            href={publicPath}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-10 w-10 shrink-0")}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Control</p>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <div className="relative aspect-[4/3] bg-white">
                {templatePage ? (
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
                ) : hasCraft ? (
                  <OptinFunnelCraftThumbnail craftState={craftState} themeJson={themeJson} scale={0.32} />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <p className="text-sm text-slate-500">No page design yet</p>
                    <ButtonLink href={editHref} size="sm">
                      Create from blank
                    </ButtonLink>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-white p-3">
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
                  href={publicPath}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  <Eye className="mr-1.5 h-4 w-4" />
                  Preview
                </a>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="hidden flex-col items-center justify-center px-2 text-center lg:flex">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <GitBranch className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-slate-900">Start split test</p>
            <p className="mt-1 max-w-[180px] text-xs text-slate-500">
              Optimize your lead and sales generation with split tests.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Variation</p>
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
              <Button variant="outline" size="sm" disabled>
                <Plus className="mr-1.5 h-4 w-4" />
                Create variation
              </Button>
              <p className="mt-2 text-xs text-slate-400">A/B testing coming soon</p>
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.info("Step cloning coming in the next phase")}
        >
          <Copy className="mr-1.5 h-4 w-4" />
          Clone funnel step
        </Button>
      </div>
    </div>
  );
}
