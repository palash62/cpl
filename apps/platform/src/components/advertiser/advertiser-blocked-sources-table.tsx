"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatUserDateTime } from "@/lib/user-timezone";

type BlockedSource = {
  id: string;
  sourceToken: string;
  sourceDisplayId: string;
  reason: string | null;
  createdAt: Date | string;
};

export function AdvertiserBlockedSourcesTable({
  blocks,
  timezone,
}: {
  blocks: BlockedSource[];
  timezone: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<BlockedSource | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirmUnblock() {
    if (!pending) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/advertiser/source-blocks?sourceToken=${encodeURIComponent(pending.sourceToken)}`,
        { method: "DELETE", credentials: "same-origin" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? "Could not unblock source");
        return;
      }
      setPending(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (blocks.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        No blocked sources yet.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Source ID</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Blocked</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {blocks.map((block) => (
            <TableRow key={block.id}>
              <TableCell className="font-mono text-sm font-medium">
                {block.sourceDisplayId}
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {block.reason?.trim() || "—"}
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {formatUserDateTime(new Date(block.createdAt), timezone)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 border-red-200 text-red-700 hover:bg-red-50"
                  disabled={loading}
                  onClick={() => {
                    setError(null);
                    setPending(block);
                  }}
                >
                  <Ban className="h-3.5 w-3.5" />
                  Unblock
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={pending != null}
        onOpenChange={(next) => {
          if (!next) setPending(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unblock source</DialogTitle>
            <DialogDescription>
              Unblock source{" "}
              <span className="font-mono font-medium">
                {pending?.sourceDisplayId}
              </span>
              ? Traffic from this source will be accepted again across your
              campaigns.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPending(null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={confirmUnblock} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Unblock source"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
