"use client";

import { useEffect, useState } from "react";
import { Copy, Link2, Store } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/components/admin/admin-ui";
import { PageSection } from "@/components/admin/page-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Campaign {
  id: string;
  name: string;
  cpl: string;
  category: string;
  status: string;
  publisherCampaigns: Array<{ status: string }>;
}

export function PublisherMarketplaceTable() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/marketplace")
      .then((r) => r.json())
      .then((d) => {
        setCampaigns(d.data ?? []);
        setLoading(false);
      });
  }, []);

  async function refresh() {
    const res = await fetch("/api/v1/marketplace");
    const d = await res.json();
    setCampaigns(d.data ?? []);
  }

  async function join(campaignId: string) {
    setActionId(campaignId);
    await fetch("/api/v1/marketplace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", campaignId }),
    });
    await refresh();
    setActionId(null);
    toast.success("Access request submitted");
  }

  async function copyLink(campaignId: string) {
    setActionId(campaignId);
    const res = await fetch("/api/v1/marketplace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "tracking-link", campaignId }),
    });
    const d = await res.json();
    if (d.data?.url) {
      await navigator.clipboard.writeText(d.data.url);
      toast.success("Tracking link copied to clipboard");
    }
    setActionId(null);
  }

  const filtered = campaigns.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <PageSection
        title="Available Campaigns"
        description="Browse campaigns open to publishers"
        icon={Store}
        gradient="approved"
      >
        <div className="space-y-3 p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </PageSection>
    );
  }

  return (
    <PageSection
      title="Available Campaigns"
      description={`${filtered.length} campaign${filtered.length === 1 ? "" : "s"} available`}
      icon={Store}
      gradient="approved"
    >
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
        <Input
          placeholder="Search by name or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 max-w-sm rounded-md border-slate-200 bg-white text-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "var(--theme-primary-soft)" }}
          >
            <Store className="h-7 w-7 text-[var(--theme-primary)]" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No campaigns found</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {search ? "Try a different search term." : "Check back later for new campaigns."}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow
              className="border-none hover:bg-transparent"
              style={{ background: "var(--theme-primary-soft)" }}
            >
              <TableHead className="h-11 px-6 text-slate-600">Campaign</TableHead>
              <TableHead className="h-11 px-4 text-slate-600">Category</TableHead>
              <TableHead className="h-11 px-4 text-right text-slate-600">CPL</TableHead>
              <TableHead className="h-11 px-4 text-slate-600">Status</TableHead>
              <TableHead className="h-11 px-6 text-right text-slate-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => {
              const joined = c.publisherCampaigns?.[0]?.status === "APPROVED";
              const pending = c.publisherCampaigns?.[0]?.status === "PENDING";
              return (
                <TableRow
                  key={c.id}
                  className="border-slate-100 transition-colors hover:bg-blue-50/40"
                >
                  <TableCell className="px-6 py-4 font-medium text-slate-900">{c.name}</TableCell>
                  <TableCell className="px-4 py-4 capitalize text-slate-600">{c.category.toLowerCase()}</TableCell>
                  <TableCell className="px-4 py-4 text-right font-semibold text-[var(--theme-primary)]">
                    {formatCurrency(Number(c.cpl))}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    {joined ? (
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                        Joined
                      </Badge>
                    ) : pending ? (
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                        Pending
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                        Open
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    {!joined ? (
                      <Button
                        size="sm"
                        disabled={actionId === c.id || pending}
                        onClick={() => join(c.id)}
                        className="h-8 rounded-md bg-[var(--theme-primary)] text-xs hover:opacity-90"
                      >
                        {pending ? "Pending" : "Request Access"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionId === c.id}
                        onClick={() => copyLink(c.id)}
                        className="h-8 gap-1 rounded-md border-slate-200 text-xs"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy Link
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </PageSection>
  );
}

export function PublisherCopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/t/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Tracking link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={copy}
      className="h-8 gap-1 rounded-md border-slate-200 text-xs"
    >
      {copied ? <Link2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy Link"}
    </Button>
  );
}
