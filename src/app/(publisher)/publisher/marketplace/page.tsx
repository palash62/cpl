"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

  if (loading) return <p className="text-muted-foreground">Loading marketplace...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Campaign Marketplace</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {campaigns.map((c) => {
          const joined = c.publisherCampaigns?.[0]?.status === "APPROVED";
          return (
            <Card key={c.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{c.name}</CardTitle>
                <Badge variant="secondary">{c.category}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-2xl font-bold text-primary">${Number(c.cpl).toFixed(2)} <span className="text-sm font-normal text-muted-foreground">per lead</span></p>
                <div className="flex gap-2">
                  {!joined ? (
                    <Button size="sm" onClick={() => join(c.id)}>Request Access</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => getLink(c.id)}>Copy Tracking Link</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {campaigns.length === 0 && (
          <Card className="col-span-2">
            <CardContent className="py-12 text-center text-muted-foreground">
              No active campaigns available
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
