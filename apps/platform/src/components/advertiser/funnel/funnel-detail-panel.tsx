"use client";

import { useEffect, useMemo, useState } from "react";
import type { SerializedOptinFunnel } from "@/lib/optin-funnel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FunnelDetailHeader } from "./funnel-detail-header";
import { FunnelStepsSidebar } from "./funnel-steps-sidebar";
import { FunnelStepOverview } from "./funnel-step-overview";
import { FunnelAddStepDialog } from "./funnel-add-step-dialog";
import { FunnelSettingsSheet } from "./funnel-settings-sheet";
import {
  advertiserFunnelWorkflow,
  buildFunnelSteps,
  toFunnelWorkflowEntityFromFunnel,
  type FunnelStepId,
} from "./funnel-types";

type FunnelDetailPanelProps = {
  initialFunnel: SerializedOptinFunnel;
  appUrl: string;
};

export function FunnelDetailPanel({ initialFunnel, appUrl }: FunnelDetailPanelProps) {
  const workflow = useMemo(() => advertiserFunnelWorkflow(), []);
  const [funnel, setFunnel] = useState(initialFunnel);
  const entity = useMemo(() => toFunnelWorkflowEntityFromFunnel(funnel), [funnel]);
  const [activeStepId, setActiveStepId] = useState<FunnelStepId>("optin");
  const [addStepOpen, setAddStepOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [funnelName, setFunnelName] = useState(funnel.name);
  const [thankYouEnabled, setThankYouEnabled] = useState(funnel.thankYouEnabled);
  const [destinationUrl, setDestinationUrl] = useState(funnel.destinationUrl ?? "");
  const [thankYouPixelHtml, setThankYouPixelHtml] = useState(funnel.thankYouPixelHtml ?? "");
  const [thankYouUseCampaignPixel] = useState(funnel.thankYouUseCampaignPixel);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  const steps = buildFunnelSteps(thankYouEnabled);

  useEffect(() => {
    let cancelled = false;

    async function refreshFunnel() {
      const res = await fetch(`${workflow.apiBasePath}/${initialFunnel.id}`, {
        cache: "no-store",
      });
      const body = await res.json();
      if (!cancelled && res.ok && body.data) {
        const refreshed = body.data as SerializedOptinFunnel;
        setFunnel(refreshed);
        setFunnelName(refreshed.name);
        setThankYouEnabled(refreshed.thankYouEnabled);
        setDestinationUrl(refreshed.destinationUrl ?? "");
        setThankYouPixelHtml(refreshed.thankYouPixelHtml ?? "");
      }
    }

    void refreshFunnel();

    function onFocus() {
      void refreshFunnel();
    }

    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [initialFunnel.id, workflow.apiBasePath]);

  function isValidHttpUrl(value: string) {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  async function saveSettings(patch?: Partial<{
    thankYouEnabled: boolean;
    destinationUrl: string;
    thankYouPixelHtml: string;
    thankYouUseCampaignPixel: boolean;
  }>) {
    const nextThankYouEnabled = patch?.thankYouEnabled ?? thankYouEnabled;
    const nextDestinationUrl = (patch?.destinationUrl ?? destinationUrl).trim();

    if (!nextThankYouEnabled) {
      if (!nextDestinationUrl) {
        setSettingsMessage("Destination URL is required when thank-you redirect is off.");
        return false;
      }
      if (!isValidHttpUrl(nextDestinationUrl)) {
        setSettingsMessage("Enter a valid destination URL (https://...).");
        return false;
      }
    }

    const trimmedName = funnelName.trim();
    if (trimmedName.length < 2) {
      setSettingsMessage("Funnel name must be at least 2 characters.");
      return false;
    }
    if (trimmedName.length > 80) {
      setSettingsMessage("Funnel name must be 80 characters or fewer.");
      return false;
    }

    setSavingSettings(true);
    setSettingsMessage(null);

    const body = {
      name: trimmedName,
      thankYouEnabled: nextThankYouEnabled,
      destinationUrl: nextDestinationUrl || null,
      thankYouPixelHtml: patch?.thankYouPixelHtml ?? thankYouPixelHtml,
      thankYouUseCampaignPixel: patch?.thankYouUseCampaignPixel ?? thankYouUseCampaignPixel,
    };

    const res = await fetch(`${workflow.apiBasePath}/${funnel.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSavingSettings(false);

    if (!res.ok) {
      setSettingsMessage(data?.error?.message ?? "Unable to save settings");
      return false;
    }

    const saved = data.data as SerializedOptinFunnel;
    setFunnel(saved);
    setFunnelName(saved.name);
    setThankYouEnabled(saved.thankYouEnabled);
    setDestinationUrl(saved.destinationUrl ?? "");
    setSettingsMessage("Settings saved.");
    return true;
  }

  async function handleThankYouToggle(enabled: boolean) {
    if (!enabled && !destinationUrl.trim()) {
      setThankYouEnabled(false);
      setSettingsOpen(true);
      setSettingsMessage("Destination URL is required when thank-you redirect is off.");
      return;
    }

    const ok = await saveSettings({ thankYouEnabled: enabled });
    if (!ok) {
      setThankYouEnabled(funnel.thankYouEnabled);
      return;
    }
    if (enabled) setActiveStepId("thankYou");
  }

  return (
    <div className="space-y-6">
      <FunnelDetailHeader funnelName={funnel.name} backHref={workflow.backHref} />

      <Tabs value="steps">
        <TabsList className="h-auto w-full justify-start rounded-none border-b border-slate-200 bg-transparent p-0">
          <TabsTrigger
            value="steps"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
          >
            Steps
          </TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="mt-6 flex-none">
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <FunnelStepsSidebar
              steps={steps}
              activeStepId={activeStepId}
              onSelectStep={setActiveStepId}
              onAddStep={() => setAddStepOpen(true)}
            />
            <FunnelStepOverview
              entity={entity}
              workflow={workflow}
              stepId={activeStepId}
              appUrl={appUrl}
              onSettingsClick={() => setSettingsOpen(true)}
              onEntityUpdated={(data) => {
                const saved = data as SerializedOptinFunnel;
                setFunnel(saved);
                setFunnelName(saved.name);
                setThankYouEnabled(saved.thankYouEnabled);
                setDestinationUrl(saved.destinationUrl ?? "");
                setThankYouPixelHtml(saved.thankYouPixelHtml ?? "");
              }}
              onStepDeleted={() => setActiveStepId("optin")}
            />
          </div>
        </TabsContent>
      </Tabs>

      <FunnelAddStepDialog open={addStepOpen} onOpenChange={setAddStepOpen} />

      <FunnelSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        name={funnelName}
        onNameChange={setFunnelName}
        urlHint={`/o/${funnel.slug}`}
        description={workflow.settingsDescription}
        thankYouEnabled={thankYouEnabled}
        destinationUrl={destinationUrl}
        thankYouPixelHtml={thankYouPixelHtml}
        saving={savingSettings}
        message={settingsMessage}
        thankYouRedirectHint={workflow.thankYouRedirectHint?.(funnel.slug)}
        onThankYouEnabledChange={(enabled) => void handleThankYouToggle(enabled)}
        onDestinationUrlChange={setDestinationUrl}
        onThankYouPixelHtmlChange={setThankYouPixelHtml}
        onSave={() => void saveSettings()}
      />
    </div>
  );
}
