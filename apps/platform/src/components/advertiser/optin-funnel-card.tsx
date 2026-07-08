"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import type { SerializedOptinFunnel } from "@/lib/optin-funnel";
import { PREVIEW_FALLBACK_FIELDS } from "@/lib/optin-page";
import type { PublicOptinPage } from "@/lib/optin-page";
import { getOptinTemplate, isOptinTemplateId } from "@/lib/optin-templates";
import { OptinPageLayout } from "@/components/optin/optin-page-layout";
import { createEmptyCraftState } from "@/modules/page-builder/lib/serialize";
import { DEFAULT_THEME } from "@/modules/page-builder/lib/theme";
import { OptinFunnelCraftThumbnail } from "@/components/advertiser/optin-funnel-craft-thumbnail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

function funnelToTemplatePreviewPage(funnel: SerializedOptinFunnel): PublicOptinPage | null {
  if (!funnel.templateId || !isOptinTemplateId(funnel.templateId)) {
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
    description:
      funnel.description ?? "Instant access to proven strategies that turn visitors into customers.",
    ctaText: funnel.ctaText || "Get Instant Access — It's Free",
    successTitle: funnel.successTitle || "You're In! 🎉",
    successMessage: funnel.successMessage || "Check your inbox — your free playbook is on its way.",
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

function resolveCraftThumbnail(funnel: SerializedOptinFunnel) {
  if (funnel.craftState?.craft && Object.keys(funnel.craftState.craft).length > 1) {
    return { craftState: funnel.craftState, themeJson: funnel.themeJson ?? DEFAULT_THEME };
  }

  return {
    craftState: {
      craft: createEmptyCraftState(),
      meta: { schemaVersion: 1 as const, editorBreakPoint: "desktop" as const },
    },
    themeJson: funnel.themeJson ?? DEFAULT_THEME,
  };
}

export function OptinFunnelCard({
  funnel,
  onArchive,
}: {
  funnel: SerializedOptinFunnel;
  onArchive: (id: string) => void;
}) {
  const templatePreview = funnelToTemplatePreviewPage(funnel);
  const craftThumbnail = resolveCraftThumbnail(funnel);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
        {templatePreview ? (
          <div className="pointer-events-none absolute left-1/2 top-0 h-[720px] w-[960px] origin-top -translate-x-1/2 scale-[0.28]">
            <OptinPageLayout
              page={templatePreview}
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
          <OptinFunnelCraftThumbnail
            craftState={craftThumbnail.craftState}
            themeJson={craftThumbnail.themeJson}
            scale={0.28}
          />
        )}

        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
          <Badge variant={funnel.isPublished ? "default" : "secondary"}>
            {funnel.isPublished ? "Published" : "Draft"}
          </Badge>
          {funnel.thankYouEnabled && (
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              Thank you page
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-semibold text-slate-900">{funnel.name}</h3>
          <p className="mt-0.5 font-mono text-xs text-slate-500">/o/{funnel.slug}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/advertiser/optin-funnels/${funnel.id}`} size="sm" variant="outline">
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </ButtonLink>
          <a
            href={`/o/${funnel.slug}?preview=1`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-3 text-sm hover:bg-slate-50"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </a>
          <Button size="sm" variant="outline" className="text-red-600" onClick={() => onArchive(funnel.id)}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Archive
          </Button>
        </div>
      </div>
    </div>
  );
}
