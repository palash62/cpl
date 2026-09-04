"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export function AdminSourceActions({
  advertiserId,
  sourceToken,
  sourceDisplayId,
  blocked,
}: {
  advertiserId: string;
  sourceToken: string;
  sourceDisplayId: string;
  blocked: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(blocked);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsBlocked(blocked);
  }, [blocked]);

  async function confirmToggle() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        isBlocked
          ? `/api/v1/admin/source-blocks?advertiserId=${encodeURIComponent(advertiserId)}&sourceToken=${encodeURIComponent(sourceToken)}`
          : "/api/v1/admin/source-blocks",
        {
          method: isBlocked ? "DELETE" : "POST",
          credentials: "same-origin",
          headers: isBlocked ? undefined : { "Content-Type": "application/json" },
          body: isBlocked
            ? undefined
            : JSON.stringify({ advertiserId, sourceToken }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? "Request failed");
        return;
      }
      setIsBlocked(!isBlocked);
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className={
          isBlocked
            ? "h-8 gap-1 border-red-200 text-red-700 hover:bg-red-50"
            : "h-8 gap-1 border-slate-200 text-slate-600"
        }
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Ban className="h-3.5 w-3.5" />
        )}
        {isBlocked ? "Unblock" : "Block"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isBlocked ? "Unblock source" : "Block source"}
            </DialogTitle>
            <DialogDescription>
              {isBlocked ? (
                <>
                  Unblock source{" "}
                  <span className="font-mono font-medium">{sourceDisplayId}</span>
                  ? Traffic from this source will be accepted again for this
                  advertiser.
                </>
              ) : (
                <>
                  Block source{" "}
                  <span className="font-mono font-medium">{sourceDisplayId}</span>{" "}
                  for this advertiser? New leads from this source will be
                  rejected.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmToggle}
              disabled={loading}
              className={
                isBlocked
                  ? undefined
                  : "bg-red-600 text-white hover:bg-red-700"
              }
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isBlocked ? (
                "Unblock source"
              ) : (
                "Block source"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
