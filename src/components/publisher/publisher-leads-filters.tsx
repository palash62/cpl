"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { FilterX, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SMART_LINK_PLATFORMS } from "@/lib/smart-link";

export function PublisherLeadsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [campaignId, setCampaignId] = useState(searchParams.get("campaign") ?? "");
  const [source, setSource] = useState(searchParams.get("source") ?? "all");

  const applyFilters = useCallback(
    (overrides?: Partial<{ campaign: string; source: string }>) => {
      const params = new URLSearchParams(searchParams.toString());
      const campaignValue = (overrides?.campaign ?? campaignId).trim();
      const sourceValue = overrides?.source ?? source;

      if (campaignValue) params.set("campaign", campaignValue);
      else params.delete("campaign");

      if (sourceValue && sourceValue !== "all") params.set("source", sourceValue);
      else params.delete("source");

      params.delete("page");

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [campaignId, source, pathname, router, searchParams],
  );

  function clearFilters() {
    setCampaignId("");
    setSource("all");
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasFilters =
    searchParams.has("campaign") ||
    searchParams.has("source") ||
    searchParams.has("sort") ||
    (searchParams.has("page") && searchParams.get("page") !== "1");

  return (
    <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
      <div className="flex w-full flex-nowrap items-center gap-2 overflow-x-auto">
        <div className="relative min-w-[160px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search campaign..."
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="h-8 w-full rounded-md border-slate-200 bg-white pl-8 text-xs"
          />
        </div>

        <Select
          value={source}
          onValueChange={(v) => {
            const next = v ?? "all";
            setSource(next);
            applyFilters({ source: next });
          }}
        >
          <SelectTrigger className="h-8 w-[140px] rounded-md border-slate-200 bg-white text-xs">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {SMART_LINK_PLATFORMS.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            size="sm"
            onClick={() => applyFilters()}
            disabled={isPending}
            className="h-8 rounded-md bg-[var(--theme-primary)] px-4 text-xs hover:opacity-90"
          >
            {isPending ? "..." : "Search"}
          </Button>
          {hasFilters && (
            <Button
              size="sm"
              variant="outline"
              onClick={clearFilters}
              disabled={isPending}
              className="h-8 gap-1 rounded-md border-slate-200 bg-white px-2.5 text-xs"
            >
              <FilterX className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
