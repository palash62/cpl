"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LandingPageBuilder } from "@/modules/page-builder";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import { normalizeThemeJson } from "@/modules/page-builder/lib/theme";

export default function LandingPageEditPage() {
  const params = useParams();
  const pageId = params.id as string;
  const setPageMeta = useBuilderStore((s) => s.setPageMeta);
  const setTheme = useBuilderStore((s) => s.setTheme);

  const [state, setState] = useState<{
    craftState: CraftSerializedState;
    name: string;
    slug: string;
    campaignId: string | null;
  } | null>(null);

  useEffect(() => {
    useBuilderStore.getState().setBuilderConfig({
      apiBasePath: "/api/v1/advertiser/landing-pages",
      listPath: "/advertiser/landing-pages",
      publicPathPrefix: "/p/",
      label: "Landing Page Builder",
      chromeTheme: "light",
      mode: "page",
      ui: "ghl",
    });
    useBuilderStore.getState().setFunnelStep("optin");
  }, []);

  useEffect(() => {
    fetch(`/api/v1/advertiser/landing-pages/${pageId}`)
      .then((r) => r.json())
      .then((body) => {
        const page = body.data;
        setState({
          craftState: page.craftState.craft,
          name: page.name,
          slug: page.slug,
          campaignId: page.campaignId,
        });
        setPageMeta({ pageId, pageName: page.name, pageSlug: page.slug, campaignId: page.campaignId });
        setTheme(normalizeThemeJson(page.themeJson));
      });
  }, [pageId, setPageMeta, setTheme]);

  if (!state) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        Loading builder...
      </div>
    );
  }

  return (
    <LandingPageBuilder
      pageId={pageId}
      initialCraftState={state.craftState}
      pageName={state.name}
      pageSlug={state.slug}
      campaignId={state.campaignId}
    />
  );
}
