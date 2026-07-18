"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ExternalLink, Link2, MoreHorizontal, Search } from "lucide-react";
import { CpaOfferTrackingLinkDialog } from "@/components/advertiser/cpa-offer-tracking-link-dialog";
import { CpaOfferGeoFlags } from "@/components/cpa/cpa-offer-geo-flags";
import { CpaOfferStatusDot, CpaOfferThumb } from "@/components/cpa/cpa-offer-thumb";
import { RoleHero } from "@/components/layout/role-hero";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CpaOfferListResult, SerializedCpaOffer } from "@/services/cpa-offer.service";

const PAGE_SIZE = 25;

type AppliedFilters = {
  offerId: string;
  q: string;
  network: string;
  category: string;
};

const emptyFilters: AppliedFilters = {
  offerId: "",
  q: "",
  network: "",
  category: "",
};

export function AdvertiserCpaOffersMarketplace() {
  const router = useRouter();
  const { data: session } = useSession();
  const advertiserId = session?.user?.id ?? "";

  const [result, setResult] = useState<CpaOfferListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<AppliedFilters>(emptyFilters);
  const [applied, setApplied] = useState<AppliedFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [trackingOffer, setTrackingOffer] = useState<SerializedCpaOffer | null>(null);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
    if (applied.offerId.trim()) params.set("id", applied.offerId.trim());
    if (applied.q.trim()) params.set("q", applied.q.trim());
    if (applied.network.trim()) params.set("network", applied.network.trim());
    if (applied.category.trim()) params.set("category", applied.category.trim());

    const res = await fetch(`/api/v1/advertiser/cpa-offers?${params}`);
    const body = await res.json().catch(() => ({}));
    setResult(body.data ?? null);
    setLoading(false);
  }, [page, applied]);

  useEffect(() => {
    void loadOffers();
  }, [loadOffers]);

  function applyFilters() {
    setPage(1);
    setApplied({ ...draft });
  }

  function clearFilters() {
    setDraft(emptyFilters);
    setApplied(emptyFilters);
    setPage(1);
  }

  const items = result?.items ?? [];
  const totalPages = result?.totalPages ?? 1;
  const total = result?.total ?? 0;

  return (
    <div className="space-y-6">
      <RoleHero
        eyebrow="Advertiser Portal"
        title={`Available Offers (${total})`}
        description="Browse active CPA offers and copy personalized tracking links for your campaigns."
      />

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="w-full space-y-1 sm:w-40">
            <label className="text-xs font-medium text-slate-500">Offer ID</label>
            <Input
              value={draft.offerId}
              onChange={(e) => setDraft((prev) => ({ ...prev, offerId: e.target.value }))}
              placeholder="Offer ID"
            />
          </div>
          <div className="min-w-[200px] flex-1 space-y-1">
            <label className="text-xs font-medium text-slate-500">Offer Title</label>
            <Input
              value={draft.q}
              onChange={(e) => setDraft((prev) => ({ ...prev, q: e.target.value }))}
              placeholder="Offer title"
            />
          </div>
          <div className="w-full space-y-1 sm:w-36">
            <label className="text-xs font-medium text-slate-500">Network</label>
            <Input
              value={draft.network}
              onChange={(e) => setDraft((prev) => ({ ...prev, network: e.target.value }))}
              placeholder="Network"
            />
          </div>
          <div className="w-full space-y-1 sm:w-36">
            <label className="text-xs font-medium text-slate-500">Category</label>
            <Input
              value={draft.category}
              onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))}
              placeholder="Category"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear Filter
            </Button>
            <Button type="button" className="gap-1.5" onClick={applyFilters}>
              <Search className="h-4 w-4" />
              Apply
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-sky-50 hover:bg-sky-50">
              <TableHead className="text-slate-700">ID</TableHead>
              <TableHead className="text-slate-700">Icon</TableHead>
              <TableHead className="text-slate-700">Offer</TableHead>
              <TableHead className="text-slate-700">Payout</TableHead>
              <TableHead className="text-slate-700">Geo</TableHead>
              <TableHead className="text-slate-700">Category</TableHead>
              <TableHead className="text-right text-slate-700">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
                  Loading offers…
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
                  No active offers. Check back later — new CPA offers appear here when published.
                </TableCell>
              </TableRow>
            ) : (
              items.map((offer) => (
                <TableRow key={offer.id} className="h-[52px]">
                  <TableCell className="font-mono text-xs text-slate-700" title={offer.id}>
                    {offer.id.slice(-6)}
                  </TableCell>
                  <TableCell>
                    <CpaOfferThumb name={offer.name} thumbnailUrl={offer.thumbnailUrl} size="sm" />
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <CpaOfferStatusDot status={offer.status} />
                        <span className="truncate font-medium text-slate-900">{offer.name}</span>
                      </div>
                      <a
                        href={offer.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 text-xs text-sky-700 hover:underline"
                      >
                        Preview <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm font-medium text-slate-900">
                    ${offer.payout}
                  </TableCell>
                  <TableCell>
                    <CpaOfferGeoFlags country={offer.country} />
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">{offer.category}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => setTrackingOffer(offer)}
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        Tracking Link
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
                          aria-label="More offer actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/advertiser/cpa-offers/${offer.id}`)}
                          >
                            View details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <p className="text-sm text-slate-500">
            Showing {items.length} of {total} items
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <CpaOfferTrackingLinkDialog
        open={Boolean(trackingOffer)}
        onOpenChange={(open) => {
          if (!open) setTrackingOffer(null);
        }}
        offer={trackingOffer}
        advertiserId={advertiserId}
      />
    </div>
  );
}
