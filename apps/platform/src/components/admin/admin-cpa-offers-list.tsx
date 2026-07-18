"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHero } from "@/components/admin/page-hero";
import {
  AdminCpaOfferFormDialog,
  type CpaOfferFormValues,
} from "@/components/admin/admin-cpa-offer-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export function AdminCpaOffersList() {
  const [result, setResult] = useState<CpaOfferListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<SerializedCpaOffer | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
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
    if (status !== "ALL") params.set("status", status);
    if (network.trim()) params.set("network", network.trim());
    if (category.trim()) params.set("category", category.trim());
    if (country.trim()) params.set("country", country.trim());

    const res = await fetch(`/api/v1/admin/cpa-offers?${params}`);
    const body = await res.json().catch(() => ({}));
    setResult(body.data ?? null);
    setLoading(false);
  }, [page, q, status, network, category, country]);

  useEffect(() => {
    void loadOffers();
  }, [loadOffers]);

  function openCreate() {
    setEditingOffer(null);
    setDialogOpen(true);
  }

  function openEdit(offer: SerializedCpaOffer) {
    setEditingOffer(offer);
    setDialogOpen(true);
  }

  async function handleSubmit(values: CpaOfferFormValues) {
    setSaving(true);
    try {
      const payload = {
        name: values.name.trim(),
        network: values.network.trim(),
        category: values.category.trim(),
        country: values.country.trim(),
        previewUrl: values.previewUrl.trim(),
        trackingUrl: values.trackingUrl.trim(),
        payout: Number(values.payout),
        status: values.status,
      };

      const res = editingOffer
        ? await fetch(`/api/v1/admin/cpa-offers/${editingOffer.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/v1/admin/cpa-offers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          readApiErrorMessage(
            body,
            editingOffer ? "Failed to update offer." : "Failed to create offer.",
            res.status,
          ),
        );
      }

      toast.success(editingOffer ? "Offer updated" : "Offer created");
      setDialogOpen(false);
      setEditingOffer(null);
      await loadOffers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
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
    <div className="space-y-7">
      <PageHero
        eyebrow="Marketplace"
        title="CPA Offers"
        description="Create and manage CPA offers for the advertiser offer marketplace. Each offer gets a unique postback URL."
        badge={`${total} total`}
      />

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[180px] flex-1 space-y-1">
          <label className="text-xs font-medium text-slate-500">Search</label>
          <Input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="Name, network, category…"
          />
        </div>
        <div className="w-full space-y-1 sm:w-40">
          <label className="text-xs font-medium text-slate-500">Status</label>
          <Select
            value={status}
            onValueChange={(v) => {
              if (!v) return;
              setPage(1);
              setStatus(v);
            }}
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
        <Button onClick={openCreate} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Add offer
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Offer</TableHead>
              <TableHead>Network</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Payout</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                  No CPA offers yet. Create one to populate the marketplace.
                </TableCell>
              </TableRow>
            ) : (
              items.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell>
                    <div className="font-medium text-slate-900">{offer.name}</div>
                    <a
                      href={offer.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1 text-xs text-[var(--theme-primary)] hover:underline"
                    >
                      Preview <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell>{offer.network}</TableCell>
                  <TableCell>{offer.category}</TableCell>
                  <TableCell>{offer.country}</TableCell>
                  <TableCell className="font-mono text-sm">${offer.payout}</TableCell>
                  <TableCell>
                    <Badge
                      variant={offer.status === "ACTIVE" ? "default" : "secondary"}
                      className={
                        offer.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                          : undefined
                      }
                    >
                      {offer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(offer)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={deletingId === offer.id}
                        onClick={() => handleDelete(offer)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages} · {total} result{total === 1 ? "" : "s"}
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

      <AdminCpaOfferFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        loading={saving}
        offer={editingOffer}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
