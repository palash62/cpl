"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, ExternalLink } from "lucide-react";
import { RoleHero } from "@/components/layout/role-hero";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SerializedCpaOffer } from "@/services/cpa-offer.service";

function CopyUrlField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={value}
          className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs text-slate-700"
        />
        <Button
          type="button"
          onClick={copy}
          className="h-10 shrink-0 gap-2 rounded-lg bg-[var(--theme-primary)] px-4 hover:opacity-90"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

export function AdvertiserCpaOfferDetail({ offerId }: { offerId: string }) {
  const [offer, setOffer] = useState<SerializedCpaOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/v1/advertiser/cpa-offers/${offerId}`);
      const body = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok) {
        setError(body?.error?.message ?? "Offer not found");
        setOffer(null);
        setLoading(false);
        return;
      }
      setOffer(body.data ?? null);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [offerId]);

  if (loading) {
    return <p className="py-12 text-center text-sm text-slate-500">Loading offer…</p>;
  }

  if (error || !offer) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-sm text-slate-600">{error || "Offer not found"}</p>
        <Link
          href="/advertiser/cpa-offers"
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}
        >
          Back to marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/advertiser/cpa-offers"
          className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Offer Marketplace
        </Link>
        <RoleHero
          eyebrow="CPA Offer"
          title={offer.name}
          description={`${offer.network} · ${offer.category} · ${offer.country}`}
        />
        <div className="mt-3">
          <Badge className="bg-emerald-100 px-3 py-1 text-sm text-emerald-800 hover:bg-emerald-100">
            ${offer.payout} payout
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Offer details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Network</dt>
              <dd className="font-medium text-slate-900">{offer.network}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Category</dt>
              <dd className="font-medium text-slate-900">{offer.category}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Country</dt>
              <dd className="font-medium text-slate-900">{offer.country}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Payout</dt>
              <dd className="font-mono font-medium text-slate-900">${offer.payout}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Status</dt>
              <dd>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  {offer.status}
                </Badge>
              </dd>
            </div>
          </dl>
          <a
            href={offer.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--theme-primary)] hover:underline"
          >
            Open preview <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </section>

        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Tracking & postback</h2>
          <CopyUrlField label="Tracking URL" value={offer.trackingUrl} />
          <CopyUrlField label="Postback URL" value={offer.postbackUrl} />
          <p className="text-xs text-slate-500">
            Give the postback URL to the network. Macros {"{click_id}"} and {"{payout}"} are
            replaced on each conversion fire.
          </p>
        </section>
      </div>
    </div>
  );
}
