"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { FilterX, Search } from "lucide-react";
import { defaultCampaignDateFrom, defaultCampaignDateTo } from "@/lib/advertiser-campaigns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CampaignOption = { id: string; name: string; cpl: number };

export function AdvertiserSourceOptimizationFilters({
  campaigns,
}: {
  campaigns: CampaignOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [campaignId, setCampaignId] = useState(searchParams.get("campaign") ?? "");
  const [sourceId, setSourceId] = useState(searchParams.get("source") ?? "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("from") ?? defaultCampaignDateFrom());
  const [dateTo, setDateTo] = useState(searchParams.get("to") ?? defaultCampaignDateTo());

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (campaignId.trim()) params.set("campaign", campaignId.trim());
    if (sourceId.trim()) params.set("source", sourceId.trim());
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [campaignId, sourceId, dateFrom, dateTo, pathname, router]);

  function clearFilters() {
    const from = defaultCampaignDateFrom();
    const to = defaultCampaignDateTo();
    setCampaignId("");
    setSourceId("");
    setDateFrom(from);
    setDateTo(to);
    startTransition(() => {
      router.push(`${pathname}?from=${from}&to=${to}`);
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="min-w-[200px] flex-1 space-y-1.5">
        <label className="text-xs font-medium text-slate-600">Campaign</label>
        <select
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
          className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="">All campaigns</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} (${Number(c.cpl).toFixed(2)})
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-[160px] flex-1 space-y-1.5">
        <label className="text-xs font-medium text-slate-600">Source ID</label>
        <Input
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          placeholder="SRC-…"
          className="h-9"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">From</label>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-9 w-[150px]"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">To</label>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-9 w-[150px]"
        />
      </div>
      <Button type="button" size="sm" className="h-9 gap-1.5" onClick={applyFilters} disabled={isPending}>
        <Search className="h-3.5 w-3.5" />
        Apply
      </Button>
      <Button type="button" size="sm" variant="outline" className="h-9 gap-1.5" onClick={clearFilters}>
        <FilterX className="h-3.5 w-3.5" />
        Clear
      </Button>
    </div>
  );
}
