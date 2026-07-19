"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHero } from "@/components/admin/page-hero";
import { AdminCpaOffersSubNav } from "@/components/admin/admin-cpa-offers-sub-nav";
import { CpaOfferGeoFlags } from "@/components/cpa/cpa-offer-geo-flags";
import { CpaOfferStatusDot, CpaOfferThumb } from "@/components/cpa/cpa-offer-thumb";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { readApiErrorMessage } from "@/lib/errors";
import type { CpaOfferListResult, SerializedCpaOffer } from "@/services/cpa-offer.service";

const PAGE_SIZE = 20;

type AppliedFilters = {
  offerId: string;
  q: string;
  status: string;
  network: string;
  category: string;
  country: string;
};

const emptyFilters: AppliedFilters = {
  offerId: "",
  q: "",
  status: "ALL",
  network: "",
  category: "",
  country: "",
};

function hasPreviewUrl(url: string) {
  return Boolean(url && url !== "#");
}

export function AdminCpaOffersList() {
  const router = useRouter();
  const [result, setResult] = useState<CpaOfferListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [draft, setDraft] = useState<AppliedFilters>(emptyFilters);
  const [applied, setApplied] = useState<AppliedFilters>(emptyFilters);
  const [showExtraFilters, setShowExtraFilters] = useState(false);
  const [page, setPage] = useState(1);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
    if (applied.offerId.trim()) params.set("id", applied.offerId.trim());
    if (applied.q.trim()) params.set("q", applied.q.trim());
    if (applied.status !== "ALL") params.set("status", applied.status);
    if (applied.network.trim()) params.set("network", applied.network.trim());
    if (applied.category.trim()) params.set("category", applied.category.trim());
    if (applied.country.trim()) params.set("country", applied.country.trim());

    const res = await fetch(`/api/v1/admin/cpa-offers?${params}`);
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

  async function handleDelete(offer: SerializedCpaOffer) {
    if (!window.confirm(`Delete "${offer.name}"?`)) return;
    setDeletingId(offer.id);
    try {
      const res = await fetch(`/api/v1/admin/cpa-offers/${offer.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(readApiErrorMessage(body, "Failed to delete offer.", res.status));
      }
      toast.success("Offer deleted");
      await loadOffers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  const items = result?.items ?? [];
  const totalPages = result?.totalPages ?? 1;
  const total = result?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Marketplace"
        title={`All Offers (${total})`}
        description="Create and manage CPA offers for the advertiser marketplace. Each offer gets a unique postback URL."
      />

      <AdminCpaOffersSubNav />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ButtonLink href="/admin/cpa-offers/new" className="gap-2">
          <Plus className="h-4 w-4" />
          Add New
        </ButtonLink>
      </div>

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
          <div className="w-full space-y-1 sm:w-40">
            <label className="text-xs font-medium text-slate-500">Status</label>
            <Select
              value={draft.status}
              onValueChange={(v) => v && setDraft((prev) => ({ ...prev, status: v }))}
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowExtraFilters((v) => !v)}
            >
              Filters
            </Button>
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button type="button" className="gap-1.5" onClick={applyFilters}>
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </div>

        {showExtraFilters ? (
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row">
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
            <div className="w-full space-y-1 sm:w-28">
              <label className="text-xs font-medium text-slate-500">Country</label>
              <Input
                value={draft.country}
                onChange={(e) => setDraft((prev) => ({ ...prev, country: e.target.value }))}
                placeholder="US"
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-sky-50 hover:bg-sky-50">
              <TableHead className="text-slate-700">ID</TableHead>
              <TableHead className="text-slate-700">Offer</TableHead>
              <TableHead className="text-slate-700">Revenue</TableHead>
              <TableHead className="text-slate-700">Payout</TableHead>
              <TableHead className="text-slate-700">Geo</TableHead>
              <TableHead className="text-slate-700">Category</TableHead>
              <TableHead className="text-slate-700">Advertiser</TableHead>
              <TableHead className="text-right text-slate-700">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-slate-500">
                  Loading offers…
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-slate-500">
                  No CPA offers yet. Create one to populate the marketplace.
                </TableCell>
              </TableRow>
            ) : (
              items.map((offer) => (
                <TableRow key={offer.id} className="h-[52px]">
                  <TableCell>
                    <div className="flex items-center gap-2 font-mono text-xs text-slate-700">
                      <CpaOfferStatusDot status={offer.status} />
                      <span title={offer.id}>{offer.id.slice(-6)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <CpaOfferThumb name={offer.name} thumbnailUrl={offer.thumbnailUrl} />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-900">{offer.name}</div>
                        {hasPreviewUrl(offer.previewUrl) ? (
                          <a
                            href={offer.previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 inline-flex items-center gap-1 text-xs text-sky-700 hover:underline"
                          >
                            Preview <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">${offer.revenue}</TableCell>
                  <TableCell className="font-mono text-sm">${offer.payout}</TableCell>
                  <TableCell>
                    <CpaOfferGeoFlags country={offer.country} />
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">{offer.category}</TableCell>
                  <TableCell className="text-sm text-sky-800">{offer.advertiserLabel}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
                        aria-label="Offer actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/cpa-offers/${offer.id}/edit`)}
                        >
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={deletingId === offer.id}
                          onClick={() => handleDelete(offer)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
    </div>
  );
}
