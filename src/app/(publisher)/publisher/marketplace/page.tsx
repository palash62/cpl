"use client";

import { useEffect, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

interface Campaign {
  id: string;
  name: string;
  cpl: string;
  category: string;
  status: string;
  publisherCampaigns: Array<{ status: string }>;
}

export default function MarketplacePage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/marketplace")
      .then((r) => r.json())
      .then((d) => {
        setCampaigns(d.data ?? []);
        setLoading(false);
      });
  }, []);

  async function join(campaignId: string) {
    await fetch("/api/v1/marketplace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", campaignId }),
    });
    const res = await fetch("/api/v1/marketplace");
    const d = await res.json();
    setCampaigns(d.data ?? []);
  }

  async function getLink(campaignId: string) {
    const res = await fetch("/api/v1/marketplace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "tracking-link", campaignId }),
    });
    const d = await res.json();
    if (d.data?.url) navigator.clipboard.writeText(d.data.url);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Campaign Marketplace" description="Browse and join available campaigns" />
        <p className="text-slate-500">Loading marketplace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Campaign Marketplace" description="Browse and join available campaigns" />
      <div className="grid gap-4 md:grid-cols-2">
        {campaigns.map((c) => {
          const joined = c.publisherCampaigns?.[0]?.status === "APPROVED";
          return (
            <div key={c.id} className="premium-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{c.name}</CardTitle>
                <Badge variant="secondary">{c.category}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-2xl font-bold text-[var(--theme-primary)]">
                  ${Number(c.cpl).toFixed(2)} <span className="text-sm font-normal text-slate-500">per lead</span>
                </p>
                <div className="flex gap-2">
                  {!joined ? (
                    <Button size="sm" className="bg-[var(--theme-primary)] hover:opacity-90" onClick={() => join(c.id)}>
                      Request Access
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => getLink(c.id)}>
                      Copy Tracking Link
                    </Button>
                  )}
                </div>
              </CardContent>
            </div>
          );
        })}
        {campaigns.length === 0 && (
          <div className="premium-card col-span-2">
            <CardContent className="py-12 text-center text-slate-500">
              No active campaigns available
            </CardContent>
          </div>
        )}
      </div>
    </div>
  );
}
