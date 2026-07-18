"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { RoleHero } from "@/components/layout/role-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CpaOfferListResult } from "@/services/cpa-offer.service";

const PAGE_SIZE = 12;

export function AdvertiserCpaOffersMarketplace() {
  const [result, setResult] = useState<CpaOfferListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [network, setNetwork] = useState("");
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [page, setPage] = useState(1);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
    if (q.trim()) params.set("q", q.trim());
    if (network.trim()) params.set("network", network.trim());
    if (category.trim()) params.set("category", category.trim());
    if (country.trim()) params.set("country", country.trim());

    const res = await fetch(`/api/v1/advertiser/cpa-offers?${params}`);
    const body = await res.json().catch(() => ({}));
    setResult(body.data ?? null);
    setLoading(false);
  }, [page, q, network, category, country]);

  useEffect(() => {
    void loadOffers();
  }, [loadOffers]);

  const items = result?.items ?? [];
  const totalPages = result?.totalPages ?? 1;
  const total = result?.total ?? 0;

  return (
    <div className="space-y-6">
      <RoleHero
        eyebrow="Advertiser Portal"
        title="Offer Marketplace"
        description="Browse active CPA offers. Open an offer for tracking and postback URLs."
      />

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="relative min-w-[200px] flex-1 space-y-1">
          <label className="text-xs font-medium text-slate-500">Search</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="Search offers…"
            />
          </div>
        </div>
        <div className="w-full space-y-1 sm:w-36">
          <label className="text-xs font-medium text-slate-500">Network</label>
          <Input
            value={network}
            onChange={(e) => {
              setPage(1);
              setNetwork(e.target.value);
            }}
            placeholder="Network"
          />
        </div>
        <div className="w-full space-y-1 sm:w-36">
          <label className="text-xs font-medium text-slate-500">Category</label>
          <Input
            value={category}
            onChange={(e) => {
              setPage(1);
              setCategory(e.target.value);
            }}
            placeholder="Category"
          />
        </div>
        <div className="w-full space-y-1 sm:w-28">
          <label className="text-xs font-medium text-slate-500">Country</label>
          <Input
            value={country}
            onChange={(e) => {
              setPage(1);
              setCountry(e.target.value);
            }}
            placeholder="US"
          />
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-slate-500">Loading offers…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-16 text-center">
          <p className="font-medium text-slate-900">No active offers</p>
          <p className="mt-1 text-sm text-slate-500">
            Check back later — new CPA offers appear here when published.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((offer) => (
            <Link
              key={offer.id}
              href={`/advertiser/cpa-offers/${offer.id}`}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[var(--theme-primary)]/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-slate-900 group-hover:text-[var(--theme-primary)]">
                  {offer.name}
                </h3>
                <Badge className="shrink-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  ${offer.payout}
                </Badge>
              </div>
              <dl className="mt-3 space-y-1.5 text-sm text-slate-600">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Network</dt>
                  <dd className="font-medium text-slate-800">{offer.network}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Category</dt>
                  <dd>{offer.category}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Country</dt>
                  <dd>{offer.country}</dd>
                </div>
              </dl>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--theme-primary)]">
                View details <ExternalLink className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages} · {total} offer{total === 1 ? "" : "s"}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
