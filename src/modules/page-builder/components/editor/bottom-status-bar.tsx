"use client";

import { useEffect, useState } from "react";
import { Link2, Monitor } from "lucide-react";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { cn } from "@/lib/utils";

type BottomStatusBarProps = {
  pageId: string;
  pageName: string;
  pageSlug: string;
  campaignId: string | null;
};

type Campaign = { id: string; name: string };

export function BottomStatusBar({ pageId, pageSlug, campaignId }: BottomStatusBarProps) {
  const saveStatus = useBuilderStore((s) => s.saveStatus);
  const breakpoint = useBuilderStore((s) => s.breakpoint);
  const setPageMeta = useBuilderStore((s) => s.setPageMeta);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selected, setSelected] = useState(campaignId ?? "");

  useEffect(() => {
    fetch("/api/v1/campaigns?limit=100")
      .then((r) => r.json())
      .then((body) => setCampaigns(body.data ?? []));
  }, []);

  useEffect(() => {
    setSelected(campaignId ?? "");
  }, [campaignId]);

  async function linkCampaign(id: string) {
    setSelected(id);
    await fetch(`/api/v1/advertiser/landing-pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId: id || null }),
    });
    setPageMeta({ campaignId: id || null });
  }

  return (
    <footer className="flex h-9 shrink-0 items-center gap-4 border-t border-white/[0.08] bg-[#12141c] px-4 text-xs">
      <div className="flex items-center gap-1.5 text-slate-500">
        <Link2 className="h-3 w-3" />
        <span className="font-mono text-slate-400">/p/{pageSlug}</span>
      </div>
      <div className="flex items-center gap-1.5 text-slate-500">
        <Monitor className="h-3 w-3" />
        <span className="capitalize text-slate-400">{breakpoint}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-slate-500">Campaign</span>
        <select
          className={cn(
            "h-6 rounded-md border px-2 text-xs",
            selected
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-amber-500/30 bg-amber-500/10 text-amber-300",
          )}
          value={selected}
          onChange={(e) => linkCampaign(e.target.value)}
        >
          <option value="">Select campaign to publish...</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <span className="ml-auto text-slate-500">
        {saveStatus === "saving" && "Saving changes..."}
        {saveStatus === "saved" && "All changes saved"}
      </span>
    </footer>
  );
}
