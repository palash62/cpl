"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderPlus, LayoutTemplate, Plus } from "lucide-react";
import type { SerializedOptinFunnel } from "@/lib/optin-funnel";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { FunnelModuleShell } from "./funnel-module-shell";
import { FunnelListToolbar } from "./funnel-list-toolbar";
import { FunnelRowActions } from "./funnel-row-actions";
import { FunnelCreateDialog } from "./funnel-create-dialog";
import { formatFunnelDate, funnelStepCount } from "./funnel-types";

const PAGE_SIZES = [15, 25, 50] as const;

export function FunnelListPanel({ initialFunnels }: { initialFunnels: SerializedOptinFunnel[] }) {
  const router = useRouter();
  const [funnels, setFunnels] = useState(initialFunnels);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(15);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return funnels;
    return funnels.filter((f) => f.name.toLowerCase().includes(q) || f.slug.toLowerCase().includes(q));
  }, [funnels, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, filtered.length);

  async function createFunnel(input: {
    name: string;
    editorType: "BUILDER";
    pageTemplateId?: string;
  }) {
    setLoading(true);
    const res = await fetch("/api/v1/advertiser/optin-funnels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body?.error?.message ?? "Failed to create funnel");
      return;
    }
    const { data } = await res.json();
    setCreateOpen(false);
    router.push(`/advertiser/optin-funnels/${data.id}`);
  }

  async function duplicateFunnel(id: string) {
    const res = await fetch(`/api/v1/advertiser/optin-funnels/${id}/duplicate`, { method: "POST" });
    if (!res.ok) {
      toast.error("Duplicate failed");
      return;
    }
    const { data } = await res.json();
    setFunnels((prev) => [data, ...prev]);
    toast.success("Funnel duplicated");
  }

  async function archiveFunnel(id: string) {
    if (!confirm("Archive this funnel?")) return;
    const res = await fetch(`/api/v1/advertiser/optin-funnels/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Archive failed");
      return;
    }
    setFunnels((prev) => prev.filter((f) => f.id !== id));
    toast.success("Funnel archived");
  }

  return (
    <FunnelModuleShell
      title="Funnels"
      description="Create and manage funnels to generate leads, appointments and receive payments."
      action={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" disabled>
            <FolderPlus className="h-4 w-4" />
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New funnel
          </Button>
        </div>
      }
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <FunnelListToolbar search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} />

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <LayoutTemplate className="h-7 w-7 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-slate-900">
              {funnels.length === 0 ? "No funnels yet" : "No funnels match your search"}
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {funnels.length === 0
                ? "Create your first funnel to start capturing leads with beautiful opt-in pages."
                : "Try a different search term."}
            </p>
            {funnels.length === 0 && (
              <Button className="mt-6" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first funnel
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Name
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Last updated
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Funnel steps
                </TableHead>
                <TableHead className="w-12 px-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((funnel) => (
                <TableRow key={funnel.id}>
                  <TableCell className="px-4 font-medium">
                    <Link
                      href={`/advertiser/optin-funnels/${funnel.id}`}
                      className="text-slate-900 hover:text-blue-600"
                    >
                      {funnel.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-500">{formatFunnelDate(funnel.updatedAt)}</TableCell>
                  <TableCell className="text-slate-500">
                    {funnelStepCount(funnel.thankYouEnabled)} Step{funnelStepCount(funnel.thankYouEnabled) === 1 ? "" : "s"}
                  </TableCell>
                  <TableCell className="px-4">
                    <FunnelRowActions
                      funnelId={funnel.id}
                      slug={funnel.slug}
                      isPublished={funnel.isPublished}
                      onDuplicate={() => void duplicateFunnel(funnel.id)}
                      onArchive={() => void archiveFunnel(funnel.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-end gap-4 border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v) as (typeof PAGE_SIZES)[number]);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span>
              {rangeStart} – {rangeEnd} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="flex h-8 min-w-8 items-center justify-center rounded-md border border-slate-200 px-2 text-slate-700">
                {currentPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <FunnelCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        loading={loading}
        onCreate={createFunnel}
      />
    </FunnelModuleShell>
  );
}
