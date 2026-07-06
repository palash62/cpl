"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LandingPageBuilder } from "@/modules/page-builder";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { createEmptyCraftState } from "@/modules/page-builder/lib/serialize";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import { buildCraftFromOptinTemplate } from "@/lib/optin-funnel-craft-templates";
import { isOptinTemplateId } from "@/lib/optin-templates";
import { cn } from "@/lib/utils";
import type { SerializedOptinFunnel } from "@/lib/optin-funnel";
import type { FunnelStepId } from "@/components/advertiser/funnel/funnel-types";

function resolveOptinCraft(funnel: SerializedOptinFunnel): CraftSerializedState {
  if (funnel.craftState?.craft && Object.keys(funnel.craftState.craft).length > 1) {
    return funnel.craftState.craft;
  }
  if (funnel.templateId && isOptinTemplateId(funnel.templateId)) {
    return buildCraftFromOptinTemplate(funnel.templateId);
  }
  return createEmptyCraftState();
}

function resolveThankYouCraft(funnel: SerializedOptinFunnel): CraftSerializedState {
  if (funnel.thankYouCraftState?.craft && Object.keys(funnel.thankYouCraftState.craft).length > 1) {
    return funnel.thankYouCraftState.craft;
  }
  return createEmptyCraftState();
}

function parseStepParam(value: string | null): FunnelStepId {
  return value === "thankYou" ? "thankYou" : "optin";
}

export function OptinFunnelBuilderPage({ funnelId }: { funnelId: string }) {
  const searchParams = useSearchParams();
  const stepParam = parseStepParam(searchParams.get("step"));

  const setPageMeta = useBuilderStore((s) => s.setPageMeta);
  const setTheme = useBuilderStore((s) => s.setTheme);
  const setThankYouTheme = useBuilderStore((s) => s.setThankYouTheme);
  const setBuilderConfig = useBuilderStore((s) => s.setBuilderConfig);
  const setCraftSavedListener = useBuilderStore((s) => s.setCraftSavedListener);
  const funnelStep = useBuilderStore((s) => s.funnelStep);
  const setFunnelStep = useBuilderStore((s) => s.setFunnelStep);

  const [funnel, setFunnel] = useState<SerializedOptinFunnel | null>(null);
  const [optinCraft, setOptinCraft] = useState<CraftSerializedState | null>(null);
  const [thankYouCraft, setThankYouCraft] = useState<CraftSerializedState | null>(null);

  useEffect(() => {
    setBuilderConfig({
      apiBasePath: "/api/v1/advertiser/optin-funnels",
      listPath: "/advertiser/optin-funnels",
      detailPath: `/advertiser/optin-funnels/${funnelId}`,
      publicPathPrefix: "/o/",
      label: "Optin Funnel Builder",
      chromeTheme: "light",
      mode: "funnel",
      thankYouEnabled: funnel?.thankYouEnabled ?? false,
    });
  }, [funnelId, funnel?.thankYouEnabled, setBuilderConfig]);

  useEffect(() => {
    setFunnelStep(stepParam);
  }, [stepParam, setFunnelStep]);

  useEffect(() => {
    setCraftSavedListener((step, craft) => {
      if (step === "optin") {
        setOptinCraft(craft);
        setFunnel((current) =>
          current
            ? {
                ...current,
                craftState: {
                  craft,
                  meta: current.craftState?.meta ?? { schemaVersion: 1, editorBreakPoint: "desktop" },
                },
              }
            : current,
        );
      } else {
        setThankYouCraft(craft);
        setFunnel((current) =>
          current
            ? {
                ...current,
                thankYouCraftState: {
                  craft,
                  meta: current.thankYouCraftState?.meta ?? {
                    schemaVersion: 1,
                    editorBreakPoint: "desktop",
                  },
                },
              }
            : current,
        );
      }
    });

    return () => setCraftSavedListener(null);
  }, [setCraftSavedListener]);

  useEffect(() => {
    fetch(`/api/v1/advertiser/optin-funnels/${funnelId}`)
      .then((r) => r.json())
      .then((funnelRes) => {
        const page = funnelRes.data as SerializedOptinFunnel;
        setFunnel(page);
        setOptinCraft(resolveOptinCraft(page));
        setThankYouCraft(resolveThankYouCraft(page));
        setPageMeta({
          pageId: funnelId,
          pageName: page.name,
          pageSlug: page.slug,
          campaignId: page.campaignId,
        });
        setTheme(page.themeJson as ThemeJson);
        setThankYouTheme(page.thankYouThemeJson as ThemeJson);
        setBuilderConfig({
          apiBasePath: "/api/v1/advertiser/optin-funnels",
          listPath: "/advertiser/optin-funnels",
          detailPath: `/advertiser/optin-funnels/${funnelId}`,
          publicPathPrefix: "/o/",
          label: "Optin Funnel Builder",
          chromeTheme: "light",
          mode: "funnel",
          thankYouEnabled: page.thankYouEnabled,
        });
      });
  }, [funnelId, setPageMeta, setTheme, setThankYouTheme, setBuilderConfig]);

  const switchStep = useCallback(
    async (step: FunnelStepId) => {
      if (step === funnelStep) return;
      await useBuilderStore.getState().flushSave?.();
      setFunnelStep(step);
    },
    [funnelStep, setFunnelStep],
  );

  useEffect(() => {
    if (funnelStep !== stepParam) {
      void switchStep(stepParam);
    }
  }, [stepParam, funnelStep, switchStep]);

  if (!funnel || !optinCraft || !thankYouCraft) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        Loading funnel builder...
      </div>
    );
  }

  const activeCraft = funnelStep === "thankYou" ? thankYouCraft : optinCraft;
  const thankYouDisabled = funnelStep === "thankYou" && !funnel.thankYouEnabled;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {thankYouDisabled && (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Enable thank-you redirect in funnel settings to edit this page.
        </div>
      )}

      <div className={cn("min-h-0 flex-1", thankYouDisabled && "pointer-events-none opacity-50")}>
        <LandingPageBuilder
          key={`${funnelId}-${funnelStep}`}
          pageId={funnelId}
          initialCraftState={activeCraft}
          pageName={funnel.name}
          pageSlug={funnel.slug}
          campaignId={funnel.campaignId}
        />
      </div>
    </div>
  );
}
