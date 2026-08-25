"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { FilterX, Search } from "lucide-react";
import { defaultCampaignDateFrom, defaultCampaignDateTo } from "@/lib/advertiser-campaigns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdvertiserOption = { id: string; name: string };
type CampaignOption = { id: string; name: string; advertiserId: string };

export function AdminSourceOptimizationFilters({
  advertisers,
  campaigns,
}: {
  advertisers: AdvertiserOption[];
  campaigns: CampaignOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [advertiserId, setAdvertiserId] = useState(
    searchParams.get("advertiserId") ?? "",
  );
  const [campaignId, setCampaignId] = useState(searchParams.get("campaignId") ?? "");
  const [sourceSearch, setSourceSearch] = useState(searchParams.get("q") ?? "");
  const [dateFrom, setDateFrom] = useState(
    searchParams.get("from") ?? defaultCampaignDateFrom(),
  );
  const [dateTo, setDateTo] = useState(
    searchParams.get("to") ?? defaultCampaignDateTo(),
  );

  const campaignOptions = useMemo(() => {
    if (!advertiserId) return campaigns;
    return campaigns.filter((c) => c.advertiserId === advertiserId);
  }, [advertiserId, campaigns]);

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (advertiserId.trim()) params.set("advertiserId", advertiserId.trim());
    if (campaignId.trim()) params.set("campaignId", campaignId.trim());
    if (sourceSearch.trim()) params.set("q", sourceSearch.trim());
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [
    advertiserId,
    campaignId,
    sourceSearch,
    dateFrom,
    dateTo,
    pathname,
    router,
  ]);

  function clearFilters() {
    const from = defaultCampaignDateFrom();
    const to = defaultCampaignDateTo();
    setAdvertiserId("");
    setCampaignId("");
    setSourceSearch("");
    setDateFrom(from);
    setDateTo(to);
    startTransition(() => {
      router.push(`${pathname}?from=${from}&to=${to}`);
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="min-w-[180px] flex-1 space-y-1.5">
        <label className="text-xs font-medium text-slate-600">Advertiser</label>
        <select
          value={advertiserId}
          onChange={(e) => {
            setAdvertiserId(e.target.value);
            setCampaignId("");
          }}
          className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="">All advertisers</option>
          {advertisers.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-[180px] flex-1 space-y-1.5">
        <label className="text-xs font-medium text-slate-600">Campaign</label>
        <select
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
          className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="">All campaigns</option>
          {campaignOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-[160px] flex-1 space-y-1.5">
        <label className="text-xs font-medium text-slate-600">Source</label>
        <Input
          value={sourceSearch}
          onChange={(e) => setSourceSearch(e.target.value)}
          placeholder="SRC-… or original"
          className="h-9"
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
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
      <Button
        type="button"
        size="sm"
        className="h-9 gap-1.5"
        onClick={applyFilters}
        disabled={isPending}
      >
        <Search className="h-3.5 w-3.5" />
        Apply
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-9 gap-1.5"
        onClick={clearFilters}
      >
        <FilterX className="h-3.5 w-3.5" />
        Clear
      </Button>
    </div>
  );
}
