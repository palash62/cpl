"use client";

import Link from "next/link";
import { Link2, Monitor, PlusCircle } from "lucide-react";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { getBuilderChrome } from "@/modules/page-builder/lib/builder-chrome";
import { useCampaignLinking } from "@/modules/page-builder/components/editor/use-campaign-linking";
import { cn } from "@/lib/utils";

type BottomStatusBarProps = {
  pageId: string;
  pageName: string;
  pageSlug: string;
  campaignId: string | null;
};

export function BottomStatusBar({ pageId, pageSlug, campaignId }: BottomStatusBarProps) {
  const saveStatus = useBuilderStore((s) => s.saveStatus);
  const breakpoint = useBuilderStore((s) => s.breakpoint);
  const builderConfig = useBuilderStore((s) => s.builderConfig);
  const funnelStep = useBuilderStore((s) => s.funnelStep);
  const chrome = getBuilderChrome(builderConfig.chromeTheme ?? "dark");
  const { campaigns, selectedCampaignId, linkCampaign } = useCampaignLinking(pageId, campaignId);
  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  const isLight = builderConfig.chromeTheme === "light";

  return (
    <footer className={cn("flex h-9 shrink-0 items-center gap-4 px-4 text-xs", chrome.footer)}>
      <div className="flex items-center gap-1.5">
        <Link2 className="h-3 w-3" />
        <span className={cn("font-mono", chrome.footerText)}>
          {builderConfig.publicPathPrefix}
          {pageSlug}
          {funnelStep === "thankYou" ? "/thank-you" : ""}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Monitor className="h-3 w-3" />
        <span className={cn("capitalize", chrome.footerText)}>{breakpoint}</span>
      </div>
      <div className="flex items-center gap-2">
        <span>Campaign</span>
        <select
          className={cn(
            "h-6 rounded-md border px-2 text-xs",
            selectedCampaignId
              ? isLight
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : isLight
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300",
          )}
          value={selectedCampaignId}
          onChange={(e) => void linkCampaign(e.target.value)}
        >
          <option value="">Select campaign to publish...</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.status ? `(${c.status})` : ""}
            </option>
          ))}
        </select>
        <Link
          href={`/advertiser/campaigns/new?optinPageId=${encodeURIComponent(pageId)}&returnTo=${encodeURIComponent(`/advertiser/optin-funnels/${pageId}/edit`)}`}
          className={cn(
            "inline-flex h-6 items-center gap-1 rounded-md border px-2 font-medium",
            isLight
              ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
          )}
        >
          <PlusCircle className="h-3 w-3" />
          New
        </Link>
      </div>
      <span className="ml-auto">
        {saveStatus === "saving" && "Saving changes..."}
        {saveStatus === "saved" && "All changes saved"}
        {saveStatus === "error" && "Save failed, retrying..."}
        {selectedCampaign?.status && selectedCampaign.status !== "ACTIVE" && (
          <span className="ml-3 text-amber-500">Linked campaign is {selectedCampaign.status.toLowerCase()}</span>
        )}
      </span>
    </footer>
  );
}
