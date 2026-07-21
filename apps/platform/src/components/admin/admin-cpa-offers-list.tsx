"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHero } from "@/components/admin/page-hero";
import { CpaOfferCard, CpaOfferCardGrid } from "@/components/cpa/cpa-offer-card";
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

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Loading offers…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
          No CPA offers yet. Create one to populate the marketplace.
        </div>
      ) : (
        <CpaOfferCardGrid>
          {items.map((offer) => (
            <CpaOfferCard
              key={offer.id}
              offer={offer}
              showRevenue
              showAdvertiser
              footer={
                <>
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => router.push(`/admin/cpa-offers/${offer.id}/edit`)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
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
                </>
              }
            />
          ))}
        </CpaOfferCardGrid>
      )}

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
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
  );
}
