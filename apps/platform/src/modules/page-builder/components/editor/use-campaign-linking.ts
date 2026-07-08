"use client";

import { useCallback, useEffect, useState } from "react";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";

export type BuilderCampaign = {
  id: string;
  name: string;
  status?: string;
};

export function useCampaignLinking(pageId: string, initialCampaignId: string | null) {
  const builderConfig = useBuilderStore((s) => s.builderConfig);
  const setPageMeta = useBuilderStore((s) => s.setPageMeta);
  const setSaveStatus = useBuilderStore((s) => s.setSaveStatus);
  const [campaigns, setCampaigns] = useState<BuilderCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(initialCampaignId ?? "");

  useEffect(() => {
    fetch("/api/v1/campaigns?limit=100")
      .then((r) => r.json())
      .then((body) => setCampaigns(body.data ?? []))
      .catch(() => setCampaigns([]));
  }, []);

  useEffect(() => {
    setSelectedCampaignId(initialCampaignId ?? "");
  }, [initialCampaignId]);

  const linkCampaign = useCallback(
    async (nextCampaignId: string) => {
      const previous = selectedCampaignId;
      setSelectedCampaignId(nextCampaignId);
      setSaveStatus("saving");
      try {
        const res = await fetch(`${builderConfig.apiBasePath}/${pageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaignId: nextCampaignId || null }),
        });
        if (!res.ok) throw new Error("campaign-link-failed");
        setPageMeta({ campaignId: nextCampaignId || null });
        setSaveStatus("saved");
        return true;
      } catch {
        setSelectedCampaignId(previous);
        setSaveStatus("error");
        return false;
      }
    },
    [builderConfig.apiBasePath, pageId, selectedCampaignId, setPageMeta, setSaveStatus],
  );

  return {
    campaigns,
    selectedCampaignId,
    linkCampaign,
  };
}
