"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Ban, CheckCircle2, Eye, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PublisherProfile = {
  website?: string | null;
  trafficSource?: string | null;
  country?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  rejectionReason?: string | null;
  rejectedAt?: string | Date | null;
  kycStatus?: string | null;
};

type PublisherRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string | Date;
  publisherProfile?: PublisherProfile | null;
};

export function AdminPublisherReviewDialog({ publisher }: { publisher: PublisherRow }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState(publisher.status);

  async function sendDecision(action: "approve" | "reject") {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/v1/admin/publishers/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: publisher.id,
        action,
        reason: action === "reject" ? note.trim() : undefined,
      }),
    });
    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data?.error?.message ?? "Unable to update publisher status");
      return;
    }

    setStatus(action === "approve" ? "ACTIVE" : "SUSPENDED");
    if (action === "approve") {
      setNote("");
    }
  }

  const profile = publisher.publisherProfile;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="h-8 gap-1">View</Button>}>
        <Eye className="h-3.5 w-3.5" />
        View
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Publisher Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{publisher.name}</p>
                <p className="text-xs text-slate-500">{publisher.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {status.toLowerCase()}
                </Badge>
                {profile?.kycStatus && (
                  <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                    {profile.kycStatus.toLowerCase()}
                  </Badge>
                )}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-xs text-slate-500">Joined</p>
                <p className="text-sm font-medium text-slate-900">
                  {format(new Date(publisher.createdAt), "MMM d, yyyy")}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-xs text-slate-500">Traffic source</p>
                <p className="text-sm font-medium text-slate-900">{profile?.trafficSource || "—"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-xs text-slate-500">Website</p>
                <p className="text-sm font-medium text-slate-900">{profile?.website || "—"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-xs text-slate-500">Country</p>
                <p className="text-sm font-medium text-slate-900">{profile?.country || "—"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <MapPin className="h-4 w-4 text-[var(--theme-primary)]" />
              Address details
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                <p className="text-xs text-slate-500">Address line 1</p>
                <p className="text-sm font-medium text-slate-900">{profile?.addressLine1 || "—"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                <p className="text-xs text-slate-500">Address line 2</p>
                <p className="text-sm font-medium text-slate-900">{profile?.addressLine2 || "—"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                <p className="text-xs text-slate-500">City</p>
                <p className="text-sm font-medium text-slate-900">{profile?.city || "—"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                <p className="text-xs text-slate-500">State</p>
                <p className="text-sm font-medium text-slate-900">{profile?.state || "—"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                <p className="text-xs text-slate-500">Postal code</p>
                <p className="text-sm font-medium text-slate-900">{profile?.postalCode || "—"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Users className="h-4 w-4 text-[var(--theme-primary)]" />
              Approval decision
            </div>
            {error && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Rejection note (required if rejecting)"
                rows={2}
                className={cn(
                  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none",
                  "focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/15",
                )}
              />
              <Button
                type="button"
                disabled={loading}
                onClick={() => sendDecision("approve")}
                className="h-10 gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-600/90"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </Button>
              <Button
                type="button"
                disabled={loading}
                onClick={() => sendDecision("reject")}
                className="h-10 gap-1 rounded-xl bg-red-600 hover:bg-red-600/90"
              >
                <Ban className="h-4 w-4" />
                Reject
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Rejecting a publisher will set the account to Suspended and show the note in their
              settings page.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
