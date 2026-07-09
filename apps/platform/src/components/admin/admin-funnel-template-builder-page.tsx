"use client";

import { useEffect, useState } from "react";
import { LandingPageBuilder } from "@/modules/page-builder";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { createBlankCraftState, ensureEditorCraftState } from "@/modules/page-builder/lib/serialize";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import { normalizeThemeJson } from "@/modules/page-builder/lib/theme";

type AdminTemplate = {
  id: string;
  slug: string;
  name: string;
  craftState: CraftSerializedState;
  themeJson: ThemeJson;
};

export function AdminFunnelTemplateBuilderPage({ templateId }: { templateId: string }) {
  const setPageMeta = useBuilderStore((s) => s.setPageMeta);
  const setTheme = useBuilderStore((s) => s.setTheme);
  const setBuilderConfig = useBuilderStore((s) => s.setBuilderConfig);

  const [template, setTemplate] = useState<AdminTemplate | null>(null);
  const [craft, setCraft] = useState<CraftSerializedState | null>(null);

  useEffect(() => {
    setBuilderConfig({
      apiBasePath: "/api/v1/admin/optin-funnel-templates",
      listPath: "/admin/funnel-templates",
      detailPath: "/admin/funnel-templates",
      publicPathPrefix: "/o/",
      label: "Optin Funnel Builder",
      chromeTheme: "light",
      mode: "funnel",
      ui: "ghl",
      thankYouEnabled: false,
    });
  }, [setBuilderConfig]);

  useEffect(() => {
    fetch(`/api/v1/admin/optin-funnel-templates/${templateId}`)
      .then((r) => r.json())
      .then((body) => {
        const page = body.data as AdminTemplate;
        setTemplate(page);
        setCraft(ensureEditorCraftState(page.craftState ?? createBlankCraftState()));
        setPageMeta({
          pageId: templateId,
          pageName: page.name,
          pageSlug: page.slug,
          campaignId: null,
        });
        setTheme(normalizeThemeJson(page.themeJson));
      });
  }, [templateId, setPageMeta, setTheme]);

  if (!template || !craft) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        Loading funnel builder...
      </div>
    );
  }

  return (
    <LandingPageBuilder
      key={templateId}
      pageId={templateId}
      initialCraftState={craft}
      pageName={template.name}
      pageSlug={template.slug}
      campaignId={null}
    />
  );
}
