"use client";

import { useCallback, useEffect, useState } from "react";
import { LandingPageBuilder } from "@/modules/page-builder";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { createEmptyCraftState } from "@/modules/page-builder/lib/serialize";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import { buildCraftFromOptinTemplate } from "@/lib/optin-funnel-craft-templates";
import { isOptinTemplateId } from "@/lib/optin-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SerializedOptinFunnel } from "@/lib/optin-funnel";

type FunnelAnalytics = {
  views: number;
  submits: number;
  thankYouViews: number;
  pixelFires: number;
  submitRate: number;
};

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

export function OptinFunnelBuilderPage({ funnelId }: { funnelId: string }) {
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
  const [analytics, setAnalytics] = useState<FunnelAnalytics | null>(null);
  const [thankYouEnabled, setThankYouEnabled] = useState(false);
  const [destinationUrl, setDestinationUrl] = useState("");
  const [thankYouPixelHtml, setThankYouPixelHtml] = useState("");
  const [thankYouUseCampaignPixel, setThankYouUseCampaignPixel] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  useEffect(() => {
    setBuilderConfig({
      apiBasePath: "/api/v1/advertiser/optin-funnels",
      listPath: "/advertiser/optin-funnels",
      publicPathPrefix: "/o/",
      label: "Optin Funnel Builder",
    });
    setFunnelStep("optin");
  }, [setBuilderConfig, setFunnelStep]);

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
    Promise.all([
      fetch(`/api/v1/advertiser/optin-funnels/${funnelId}`).then((r) => r.json()),
      fetch(`/api/v1/advertiser/optin-funnels/${funnelId}/analytics`).then((r) => r.json()),
    ]).then(([funnelRes, analyticsRes]) => {
      const page = funnelRes.data as SerializedOptinFunnel;
      setFunnel(page);
      setOptinCraft(resolveOptinCraft(page));
      setThankYouCraft(resolveThankYouCraft(page));
      setThankYouEnabled(page.thankYouEnabled);
      setDestinationUrl(page.destinationUrl ?? "");
      setThankYouPixelHtml(page.thankYouPixelHtml ?? "");
      setThankYouUseCampaignPixel(page.thankYouUseCampaignPixel);
      setAnalytics(analyticsRes.data ?? null);
      setPageMeta({
        pageId: funnelId,
        pageName: page.name,
        pageSlug: page.slug,
        campaignId: page.campaignId,
      });
      setTheme(page.themeJson as ThemeJson);
      setThankYouTheme(page.thankYouThemeJson as ThemeJson);
    });
  }, [funnelId, setPageMeta, setTheme, setThankYouTheme]);

  const switchStep = useCallback(
    async (step: "optin" | "thankYou") => {
      if (step === funnelStep) return;
      await useBuilderStore.getState().flushSave?.();
      setFunnelStep(step);
    },
    [funnelStep, setFunnelStep],
  );

  async function saveFunnelSettings(patch?: Partial<{
    thankYouEnabled: boolean;
    destinationUrl: string;
    thankYouPixelHtml: string;
    thankYouUseCampaignPixel: boolean;
  }>) {
    setSavingSettings(true);
    setSettingsMessage(null);

    const body = {
      thankYouEnabled: patch?.thankYouEnabled ?? thankYouEnabled,
      destinationUrl: (patch?.destinationUrl ?? destinationUrl).trim() || null,
      thankYouPixelHtml: patch?.thankYouPixelHtml ?? thankYouPixelHtml,
      thankYouUseCampaignPixel: patch?.thankYouUseCampaignPixel ?? thankYouUseCampaignPixel,
    };

    const res = await fetch(`/api/v1/advertiser/optin-funnels/${funnelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    setSavingSettings(false);

    if (!res.ok) {
      setSettingsMessage(data?.error?.message ?? "Unable to save settings");
      return;
    }

    const saved = data.data as SerializedOptinFunnel;
    setFunnel(saved);
    setDestinationUrl(saved.destinationUrl ?? "");
    setSettingsMessage("Settings saved.");
    setSettingsOpen(false);
  }

  async function toggleThankYou(enabled: boolean) {
    setThankYouEnabled(enabled);
    await saveFunnelSettings({ thankYouEnabled: enabled });
    if (enabled) await switchStep("thankYou");
  }

  if (!funnel || !optinCraft || !thankYouCraft) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        Loading funnel builder...
      </div>
    );
  }

  const activeCraft = funnelStep === "thankYou" ? thankYouCraft : optinCraft;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 bg-[#12141c] px-4 py-2">
        <Button
          size="sm"
          variant={funnelStep === "optin" ? "default" : "outline"}
          onClick={() => void switchStep("optin")}
        >
          Optin Page
        </Button>
        <Button
          size="sm"
          variant={funnelStep === "thankYou" ? "default" : "outline"}
          onClick={() => void switchStep("thankYou")}
        >
          Thank You Page
        </Button>

        <label className="ml-2 flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-xs text-slate-200">
          <input
            type="checkbox"
            checked={thankYouEnabled}
            disabled={savingSettings}
            onChange={(e) => void toggleThankYou(e.target.checked)}
          />
          Redirect after submit
        </label>

        <Button size="sm" variant="ghost" className="text-slate-300" onClick={() => setSettingsOpen((v) => !v)}>
          Funnel settings
        </Button>

        {analytics && (
          <div className="ml-auto hidden text-xs text-slate-400 md:flex md:gap-4">
            <span>Views: {analytics.views}</span>
            <span>Submits: {analytics.submits}</span>
            <span>Thank you: {analytics.thankYouViews}</span>
            <span>{analytics.submitRate.toFixed(1)}% submit rate</span>
          </div>
        )}
      </div>

      {settingsOpen && (
        <div className="shrink-0 border-b border-white/10 bg-[#1a1d27] px-4 py-4 text-sm text-slate-200">
          <div className="mx-auto grid max-w-3xl gap-4">
            {!thankYouEnabled && (
              <div className="space-y-2">
                <Label className="text-slate-300">Destination URL (after submit)</Label>
                <Input
                  type="url"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://example.com/thank-you"
                  className="border-white/10 bg-[#0f1117] text-slate-100"
                />
                <p className="text-xs text-slate-400">
                  Used when thank-you page is off. Leave empty to show an on-page success message instead.
                </p>
              </div>
            )}

            {thankYouEnabled && (
              <p className="text-xs text-slate-400">
                With thank-you page enabled, visitors go to your Thank You Page tab after submit. Use
                Destination URL only when thank-you redirect is turned off.
              </p>
            )}

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={thankYouUseCampaignPixel}
                onChange={(e) => setThankYouUseCampaignPixel(e.target.checked)}
              />
              Fire campaign conversion pixel on thank-you page
            </label>

            <div className="space-y-2">
              <Label className="text-slate-300">Custom pixel / tracking code (HTML)</Label>
              <textarea
                value={thankYouPixelHtml}
                onChange={(e) => setThankYouPixelHtml(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2 font-mono text-xs"
                placeholder="<script>...</script> or <img src='...' />"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" disabled={savingSettings} onClick={() => void saveFunnelSettings()}>
                Save funnel settings
              </Button>
              {settingsMessage && (
                <p
                  className={`text-sm ${
                    settingsMessage.includes("Unable") ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {settingsMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {funnelStep === "thankYou" && !thankYouEnabled && (
        <div className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
          Turn on &quot;Redirect after submit&quot; to send visitors to this page after they opt in.
        </div>
      )}

      <div className={cn("min-h-0 flex-1", funnelStep === "thankYou" && !thankYouEnabled && "opacity-60")}>
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
