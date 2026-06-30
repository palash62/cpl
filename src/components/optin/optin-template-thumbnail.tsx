"use client";

import type { OptinPageContent, PublicOptinPage } from "@/lib/optin-page";
import { PREVIEW_FALLBACK_FIELDS } from "@/lib/optin-page";
import type { OptinTemplateDefinition } from "@/lib/optin-templates";
import { OptinPageLayout } from "@/components/optin/optin-page-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pencil, Check } from "lucide-react";

function templateToPreviewPage(
  template: OptinTemplateDefinition,
  colors?: { primaryColor: string; accentColor: string },
  page?: OptinPageContent | null,
  usePageContent = false,
): PublicOptinPage {
  const title = page?.title ?? template.name;

  return {
    id: "preview",
    slug: page?.slug ?? "preview",
    title,
    destinationUrl: page?.destinationUrl ?? null,
    campaignId: null,
    templateId: template.id,
    headline: usePageContent && page ? page.headline : template.headline,
    subheadline: usePageContent && page ? page.subheadline : template.subheadline,
    description:
      usePageContent && page?.description
        ? page.description
        : "Instant access to proven strategies that turn visitors into customers.",
    ctaText: usePageContent && page ? page.ctaText : "Get Instant Access — It's Free",
    successTitle: usePageContent && page ? page.successTitle : "You're In! 🎉",
    successMessage:
      usePageContent && page
        ? page.successMessage
        : "Check your inbox — your free playbook is on its way.",
    badgeText: usePageContent && page?.badgeText ? page.badgeText : template.badgeText,
    bulletPoints:
      usePageContent && page ? page.bulletPoints : [
        "Proven playbook you can use today",
        "Weekly tips from top marketers",
        "100% free — unsubscribe anytime",
      ],
    primaryColor: colors?.primaryColor ?? page?.primaryColor ?? template.primaryColor,
    accentColor: colors?.accentColor ?? page?.accentColor ?? template.accentColor,
    isPublished: false,
    campaignName: title,
    displayTitle: title,
    fields: PREVIEW_FALLBACK_FIELDS,
    previewMode: true,
  };
}

export function OptinTemplateThumbnail({
  template,
  selected,
  selecting,
  colors,
  pageContent,
  onSelect,
  onEdit,
}: {
  template: OptinTemplateDefinition;
  selected: boolean;
  selecting?: boolean;
  colors?: { primaryColor: string; accentColor: string };
  pageContent?: OptinPageContent | null;
  onSelect: () => void;
  onEdit: () => void;
}) {
  const page = templateToPreviewPage(template, colors, pageContent, selected);

  function handleSelect() {
    if (selecting) return;
    onSelect();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleSelect();
        }
      }}
      className={cn(
        "group cursor-pointer overflow-hidden rounded-2xl border bg-white text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]/40",
        selecting && "cursor-wait opacity-80",
        selected
          ? "border-[var(--theme-primary)] ring-2 ring-[var(--theme-primary)]/25 shadow-md"
          : "border-slate-200 hover:border-slate-300 hover:shadow-md",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[720px] w-[960px] origin-top -translate-x-1/2 scale-[0.34]">
          <OptinPageLayout
            page={page}
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

        {selected && (
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-[var(--theme-primary)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            <Check className="h-3 w-3" />
            Selected
          </div>
        )}

        {selected && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-slate-900/0 opacity-0 transition-all group-hover:bg-slate-900/45 group-hover:opacity-100">
            <Button
              type="button"
              size="sm"
              className="pointer-events-auto scale-95 gap-1.5 opacity-0 shadow-lg transition-all group-hover:scale-100 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="h-4 w-4" />
              Edit page
            </Button>
          </div>
        )}

        {!selected && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-center bg-gradient-to-t from-slate-900/50 to-transparent pb-4 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow">
              Click to select
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 px-4 py-3">
        <p className="font-semibold text-slate-900">{pageContent?.title ?? template.name}</p>
        <p className="mt-0.5 text-xs text-slate-500">{template.name}</p>
        <div className="mt-2 flex items-center gap-2">
          <span
            className="h-4 w-4 rounded-full border border-white shadow-sm"
            style={{ background: page.primaryColor }}
          />
          <span
            className="h-4 w-4 rounded-full border border-white shadow-sm"
            style={{ background: page.accentColor }}
          />
        </div>
      </div>
    </div>
  );
}
