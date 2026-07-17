"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const REJECTABLE_STATUSES = new Set([
  "CAPTURED",
  "VALIDATING",
  "PENDING",
  "APPROVED",
  "PAID",
]);

type AdminLeadRejectActionProps = {
  leadId: string;
  status: string;
};

export function AdminLeadRejectAction({ leadId, status }: AdminLeadRejectActionProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!REJECTABLE_STATUSES.has(status)) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  async function handleReject() {
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/v1/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          status: "REJECTED",
          reason: reason.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error?.message ?? "Failed to reject lead.");
        setBusy(false);
        return;
      }

      window.location.reload();
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <>
      <Button type="button" variant="destructive" size="sm" onClick={() => setOpen(true)}>
        Reject
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject lead</DialogTitle>
          </DialogHeader>
          {status === "PAID" ? (
            <p className="text-sm text-amber-800">
              This lead was paid. Rejecting will refund the advertiser, claw back publisher and
              referral earnings, and reduce campaign spend.
            </p>
          ) : (
            <p className="text-sm text-slate-600">
              This lead will be marked as rejected. No payment will be processed.
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor={`reject-reason-${leadId}`}>Reason (optional)</Label>
            <textarea
              id={`reject-reason-${leadId}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this lead being rejected?"
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={busy} onClick={() => void handleReject()}>
              {busy ? "Rejecting..." : "Reject lead"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
