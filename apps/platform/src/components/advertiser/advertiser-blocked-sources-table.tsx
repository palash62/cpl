"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [loadingToken, setLoadingToken] = useState<string | null>(null);

  async function unblock(sourceToken: string) {
    setLoadingToken(sourceToken);
    try {
      const res = await fetch(
        `/api/v1/advertiser/source-blocks?sourceToken=${encodeURIComponent(sourceToken)}`,
        { method: "DELETE" },
      );
      if (res.ok) router.refresh();
    } finally {
      setLoadingToken(null);
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
                  disabled={loadingToken === block.sourceToken}
                  onClick={() => unblock(block.sourceToken)}
                >
                  {loadingToken === block.sourceToken ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Ban className="h-3.5 w-3.5" />
                  )}
                  Unblock
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
