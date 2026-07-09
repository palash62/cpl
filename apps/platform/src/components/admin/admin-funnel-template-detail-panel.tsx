"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink, Eye, Settings, Trash2 } from "lucide-react";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import { DEFAULT_THEME } from "@/modules/page-builder/lib/theme";
import { createBlankCraftState } from "@/modules/page-builder/lib/serialize";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FunnelDetailHeader } from "@/components/advertiser/funnel/funnel-detail-header";
import { FunnelAddStepDialog } from "@/components/advertiser/funnel/funnel-add-step-dialog";
import { FunnelStepsSidebar } from "@/components/advertiser/funnel/funnel-steps-sidebar";
import { buildFunnelSteps, type FunnelStepId } from "@/components/advertiser/funnel/funnel-types";
import { OptinFunnelCraftThumbnail } from "@/components/advertiser/optin-funnel-craft-thumbnail";
import { AdminFunnelTemplateSettingsSheet } from "@/components/admin/admin-funnel-template-settings-sheet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type AdminTemplate = {
  id: string;
  slug: string;
  name: string;
  craftState: CraftSerializedState;
  themeJson: ThemeJson;
  thankYouEnabled: boolean;
  destinationUrl: string | null;
  thankYouPixelHtml: string | null;
  thankYouUseCampaignPixel: boolean;
  thankYouCraftState: CraftSerializedState | null;
  thankYouThemeJson: ThemeJson | null;
};

export function AdminFunnelTemplateDetailPanel({
  initialTemplate,
  appUrl,
}: {
  initialTemplate: AdminTemplate;
  appUrl: string;
}) {
  const [template, setTemplate] = useState(initialTemplate);
  const [activeStepId, setActiveStepId] = useState<FunnelStepId>("optin");
  const [addStepOpen, setAddStepOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [thankYouEnabled, setThankYouEnabled] = useState(initialTemplate.thankYouEnabled);
  const [destinationUrl, setDestinationUrl] = useState(initialTemplate.destinationUrl ?? "");
  const [thankYouPixelHtml, setThankYouPixelHtml] = useState(initialTemplate.thankYouPixelHtml ?? "");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [deletingStep, setDeletingStep] = useState(false);
  const [resettingStep, setResettingStep] = useState(false);
  const router = useRouter();

  const steps = buildFunnelSteps(thankYouEnabled);
  const previewPath =
    activeStepId === "thankYou"
      ? `/admin/funnel-templates/${template.id}/preview?step=thankYou`
      : `/admin/funnel-templates/${template.id}/preview`;
  const previewUrl = `${appUrl}${previewPath}`;
  const editHref = `/admin/funnel-templates/${template.id}/edit?step=${activeStepId}`;

  const craftState = activeStepId === "thankYou" ? template.thankYouCraftState : template.craftState;
  const themeJson =
    activeStepId === "thankYou"
      ? (template.thankYouThemeJson ?? template.themeJson ?? DEFAULT_THEME)
      : (template.themeJson ?? DEFAULT_THEME);

  function isValidHttpUrl(value: string) {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  async function patchTemplate(body: Record<string, unknown>) {
    const res = await fetch(`/api/v1/admin/optin-funnel-templates/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message ?? "Unable to update template");
    }
    const updated = data.data as AdminTemplate;
    setTemplate(updated);
    setThankYouEnabled(updated.thankYouEnabled);
    setDestinationUrl(updated.destinationUrl ?? "");
    setThankYouPixelHtml(updated.thankYouPixelHtml ?? "");
    return updated;
  }

  async function saveSettings(patch?: Partial<{
    thankYouEnabled: boolean;
    destinationUrl: string;
    thankYouPixelHtml: string;
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

    setSavingSettings(true);
    setSettingsMessage(null);
    try {
      await patchTemplate({
        thankYouEnabled: nextThankYouEnabled,
        destinationUrl: nextDestinationUrl || null,
        thankYouPixelHtml: patch?.thankYouPixelHtml ?? thankYouPixelHtml,
      });
      setSettingsMessage("Settings saved.");
      return true;
    } catch (error) {
      setSettingsMessage(error instanceof Error ? error.message : "Unable to save settings");
      return false;
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleThankYouToggle(enabled: boolean) {
    const ok = await saveSettings({ thankYouEnabled: enabled });
    if (!ok) return;
    if (enabled) setActiveStepId("thankYou");
    if (!enabled && activeStepId === "thankYou") setActiveStepId("optin");
  }

  async function handleCreateFromBlank() {
    if (activeStepId !== "thankYou") {
      router.push(editHref);
      return;
    }
    setResettingStep(true);
    try {
      await patchTemplate({
        thankYouEnabled: true,
        thankYouCraftState: createBlankCraftState(),
        step: "thankYou",
      });
      toast.success("Thank you page reset to blank");
      router.push(editHref);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reset thank you page");
    } finally {
      setResettingStep(false);
    }
  }

  async function handleDeleteStep() {
    if (activeStepId !== "thankYou") return;
    if (!window.confirm("Delete the thank you step? This removes its page design.")) return;
    setDeletingStep(true);
    try {
      await patchTemplate({
        thankYouEnabled: false,
        thankYouCraftState: null,
      });
      setActiveStepId("optin");
      toast.success("Thank you step deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete step");
    } finally {
      setDeletingStep(false);
    }
  }

  return (
    <div className="space-y-6">
      <FunnelDetailHeader funnelName={template.name} backHref="/admin/funnel-templates" />

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

            <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <h2 className="text-lg font-semibold capitalize text-slate-900">
                  {activeStepId === "thankYou" ? "thank you" : "optin page"}
                </h2>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  Overview
                </Badge>
              </div>

              <div className="space-y-6 p-5">
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
                        <OptinFunnelCraftThumbnail
                          craftState={{
                            craft: craftState ?? createBlankCraftState(),
                            meta: { schemaVersion: 1, editorBreakPoint: "desktop" },
                          }}
                          themeJson={themeJson}
                          scale={0.28}
                          emptyFallback="blank"
                        />
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
                          <DropdownMenuItem disabled={resettingStep} onClick={() => void handleCreateFromBlank()}>
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
                      <Button variant="outline" size="sm" className="h-8" onClick={() => setSettingsOpen(true)}>
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
                  disabled={activeStepId === "optin" || deletingStep}
                  onClick={() => void handleDeleteStep()}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  {deletingStep ? "Deleting..." : "Delete funnel step"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <FunnelAddStepDialog open={addStepOpen} onOpenChange={setAddStepOpen} />
      <AdminFunnelTemplateSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        templateName={template.name}
        templateSlug={template.slug}
        thankYouEnabled={thankYouEnabled}
        destinationUrl={destinationUrl}
        thankYouPixelHtml={thankYouPixelHtml}
        saving={savingSettings}
        message={settingsMessage}
        onThankYouEnabledChange={(enabled) => void handleThankYouToggle(enabled)}
        onDestinationUrlChange={setDestinationUrl}
        onThankYouPixelHtmlChange={setThankYouPixelHtml}
        onSave={() => void saveSettings()}
      />
    </div>
  );
}
