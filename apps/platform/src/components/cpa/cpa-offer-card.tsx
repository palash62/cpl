"use client";

import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { CpaOfferGeoFlags } from "@/components/cpa/cpa-offer-geo-flags";
import { CpaOfferStatusDot } from "@/components/cpa/cpa-offer-thumb";
import { cn } from "@/lib/utils";
import type { SerializedCpaOffer } from "@/services/cpa-offer.service";

function hasPreviewUrl(url: string) {
  return Boolean(url && url !== "#");
}

type CpaOfferCardProps = {
  offer: SerializedCpaOffer;
  /** Show revenue amount (admin). */
  showRevenue?: boolean;
  /** Show advertiser label (admin). */
  showAdvertiser?: boolean;
  footer?: ReactNode;
  className?: string;
};

export function CpaOfferCard({
  offer,
  showRevenue = false,
  showAdvertiser = false,
  footer,
  className,
}: CpaOfferCardProps) {
  const letter = (offer.name.trim()[0] || "?").toUpperCase();

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        {offer.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={offer.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-100 to-violet-100 text-3xl font-bold text-sky-800/70">
            {letter}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CpaOfferStatusDot status={offer.status} />
            <span className="font-mono text-[11px] text-slate-400" title={offer.id}>
              #{offer.id.slice(-6)}
            </span>
          </div>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
            {offer.name}
          </h3>
          {hasPreviewUrl(offer.previewUrl) ? (
            <a
              href={offer.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-sky-700 hover:underline"
            >
              Preview <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-800">
            {offer.payoutModel}
          </span>
          <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800">
            {offer.category}
          </span>
        </div>

        <CpaOfferGeoFlags country={offer.country} />

        <div className="mt-auto grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
          {showRevenue ? (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Revenue
              </p>
              <p className="font-mono text-sm font-semibold tabular-nums text-slate-900">
                ${offer.revenue}
              </p>
            </div>
          ) : null}
          <div className={showRevenue ? undefined : "col-span-2"}>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Payout</p>
            <p className="font-mono text-sm font-semibold tabular-nums text-emerald-700">
              ${offer.payout}
            </p>
          </div>
        </div>

        {showAdvertiser ? (
          <p className="truncate text-xs text-sky-800">
            <span className="text-slate-400">Advertiser · </span>
            {offer.advertiserLabel}
          </p>
        ) : null}
      </div>

      {footer ? (
        <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/80 px-4 py-3">
          {footer}
        </div>
      ) : null}
    </article>
  );
}

export function CpaOfferCardGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}
