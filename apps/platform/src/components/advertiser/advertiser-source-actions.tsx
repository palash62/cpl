"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Ban, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { sourceBidLimits } from "@cpl/shared";

export function AdvertiserSourceActions({
  sourceToken,
  sourceDisplayId,
  blocked,
  campaignId,
  campaignCpl,
  currentBid,
}: {
  sourceToken: string;
  sourceDisplayId: string;
  blocked: boolean;
  campaignId: string | null;
  campaignCpl: number | null;
  currentBid: number | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bidOpen, setBidOpen] = useState(false);
  const [bidValue, setBidValue] = useState(
    String(currentBid ?? campaignCpl ?? ""),
  );
  const [error, setError] = useState<string | null>(null);

  const limits =
    campaignCpl != null && campaignCpl > 0 ? sourceBidLimits(campaignCpl) : null;

  async function handleBlockToggle() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        blocked
          ? `/api/v1/advertiser/source-blocks?sourceToken=${encodeURIComponent(sourceToken)}`
          : "/api/v1/advertiser/source-blocks",
        {
          method: blocked ? "DELETE" : "POST",
          headers: blocked ? undefined : { "Content-Type": "application/json" },
          body: blocked ? undefined : JSON.stringify({ sourceToken }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? "Request failed");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveBid() {
    if (!campaignId) return;
    setLoading(true);
    setError(null);
    try {
      const cpl = parseFloat(bidValue);
      const res = await fetch("/api/v1/advertiser/source-bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, sourceToken, cpl }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? "Could not save bid");
        return;
      }
      setBidOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleResetBid() {
    if (!campaignId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/advertiser/source-bids?campaignId=${encodeURIComponent(campaignId)}&sourceToken=${encodeURIComponent(sourceToken)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? "Could not reset bid");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {error && <span className="w-full text-right text-xs text-red-600">{error}</span>}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={handleBlockToggle}
        className={
          blocked
            ? "h-8 gap-1 border-red-200 text-red-700 hover:bg-red-50"
            : "h-8 gap-1 border-slate-200 text-slate-600"
        }
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
        {blocked ? "Unblock" : "Block"}
      </Button>

      {campaignId && campaignCpl != null && (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            disabled={loading || blocked}
            onClick={() => {
              setBidValue(String(currentBid ?? campaignCpl));
              setBidOpen(true);
            }}
          >
            <ArrowUp className="h-3.5 w-3.5" />
            <ArrowDown className="h-3.5 w-3.5" />
            Bid
          </Button>
          {currentBid != null && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-slate-500"
              disabled={loading || blocked}
              onClick={handleResetBid}
              title="Reset to campaign CPL"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </>
      )}

      <Dialog open={bidOpen} onOpenChange={setBidOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust source bid</DialogTitle>
            <DialogDescription>
              Set CPL for <span className="font-mono font-medium">{sourceDisplayId}</span>.
              Allowed range is 50%–200% of campaign CPL
              {campaignCpl != null ? ` ($${campaignCpl.toFixed(2)})` : ""}.
              Blocked sources ignore bid settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Source CPL ($)</label>
            <Input
              type="number"
              step="0.01"
              min={limits?.min}
              max={limits?.max}
              value={bidValue}
              onChange={(e) => setBidValue(e.target.value)}
            />
            {limits && (
              <p className="text-xs text-slate-500">
                Min ${limits.min.toFixed(2)} · Max ${limits.max.toFixed(2)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBidOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSaveBid} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save bid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
