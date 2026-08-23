"use client";

import { useState } from "react";
import type { AdvertiserTrustView, TrustLevel } from "@/modules/fraud";

const TRUST_STYLES: Record<TrustLevel, string> = {
  high: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-red-100 text-red-700",
};

const TRUST_LABELS: Record<TrustLevel, string> = {
  high: "High trust",
  medium: "Medium trust",
  low: "Low trust",
};

export function LeadTrustBadge({
  trust,
}: {
  trust: AdvertiserTrustView | null | undefined;
}) {
  const [open, setOpen] = useState(false);

  if (!trust) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${TRUST_STYLES[trust.trustLevel]}`}
        onClick={() => setOpen((v) => !v)}
      >
        {TRUST_LABELS[trust.trustLevel]}
      </button>
      {open && (
        <div className="min-w-[220px] rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm">
          <p className="text-xs font-medium text-slate-800">Why this lead?</p>
          <p className="mt-1 text-xs text-slate-600">{trust.trustSummary}</p>
          <ul className="mt-2 space-y-1">
            {trust.trustItems.map((item) => (
              <li key={item.label} className="text-xs text-slate-600">
                <span className={item.ok ? "text-emerald-600" : "text-amber-700"}>
                  {item.ok ? "✓" : "⚠"}
                </span>{" "}
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
