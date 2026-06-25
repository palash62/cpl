"use client";

import { Calendar, Globe, Layers, Sparkles, Target, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getBidRecommendations,
  formatSummaryDate,
  formatSelectedCountriesSummary,
  type CountryTier,
} from "@/lib/campaign-form";
import { Badge } from "@/components/ui/badge";

type CampaignStatusChoice = "ACTIVE" | "PAUSED";

interface CampaignSummaryPanelProps {
  name: string;
  startMode: "now" | "scheduled";
  startDate: string;
  endMode: "forever" | "scheduled";
  endDate: string;
  vertical: string;
  selectedTiers: CountryTier[];
  totalBudgetValue: number | null;
  dailyBudgetValue: number | null;
  cplValue: number;
  campaignStatus: CampaignStatusChoice | null;
  onStatusChange: (status: CampaignStatusChoice) => void;
  todayLabel: string;
}

export function CampaignSummaryPanel({
  name,
  startMode,
  startDate,
  endMode,
  endDate,
  vertical,
  selectedTiers,
  totalBudgetValue,
  dailyBudgetValue,
  cplValue,
  campaignStatus,
  onStatusChange,
  todayLabel,
}: CampaignSummaryPanelProps) {
  const rows = [
    {
      icon: Calendar,
      label: "Launch",
      value:
        startMode === "now"
          ? `Now · ${todayLabel}`
          : formatSummaryDate(startDate),
    },
    {
      icon: Layers,
      label: "Duration",
      value: endMode === "forever" ? "Runs indefinitely" : `Ends ${formatSummaryDate(endDate)}`,
    },
    {
      icon: Target,
      label: "Vertical",
      value: vertical || "Not selected",
    },
    {
      icon: Globe,
      label: "Geo",
      value: formatSelectedCountriesSummary(selectedTiers),
    },
    {
      icon: Wallet,
      label: "Budget",
      value: totalBudgetValue ? `$${totalBudgetValue} total` : "Unlimited total",
    },
    {
      icon: TrendingUp,
      label: "CPL Bid",
      value: cplValue > 0 ? `$${cplValue.toFixed(2)} / lead` : "Set your bid",
    },
  ];

  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-sm">
      <div
        className="px-5 py-4 text-white"
        style={{ background: "linear-gradient(to right, var(--theme-hero-from), var(--theme-hero-to))" }}
      >
        <p className="text-xs font-medium uppercase tracking-wider text-white/70">Live preview</p>
        <h3 className="mt-1 truncate text-lg font-bold">{name.trim() || "Untitled Campaign"}</h3>
        {dailyBudgetValue ? (
          <p className="mt-1 text-sm text-white/80">${dailyBudgetValue}/day cap</p>
        ) : (
          <p className="mt-1 text-sm text-white/80">No daily cap</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-px bg-slate-100 p-px">
        {rows.map((row) => (
          <div key={row.label} className="bg-white px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <row.icon className="h-3.5 w-3.5" />
              {row.label}
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-900">{row.value}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 px-5 py-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Campaign Status
        </p>
        <div className="flex gap-2">
          {(["ACTIVE", "PAUSED"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onStatusChange(status)}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                campaignStatus === status
                  ? status === "ACTIVE"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm"
                    : "border-amber-300 bg-amber-50 text-amber-800 shadow-sm"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50",
              )}
            >
              {status === "ACTIVE" ? "● Active" : "○ Paused"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface BidRecommendationPanelProps {
  cplValue: number;
}

export function BidRecommendationPanel({ cplValue }: BidRecommendationPanelProps) {
  const bids = getBidRecommendations(cplValue > 0 ? cplValue : 1);
  const hasBid = cplValue > 0;
  const currentPct = hasBid
    ? Math.min(100, Math.round((cplValue / bids.maximum) * 100))
    : 0;

  const tiers = [
    { key: "minimum", label: "Conservative", sub: "Lower volume", amount: bids.minimum, pct: 31 },
    { key: "optimal", label: "Balanced", sub: "Recommended", amount: bids.optimal, pct: 41 },
    { key: "maximum", label: "Aggressive", sub: "Higher volume", amount: bids.maximum, pct: 52 },
  ] as const;

  return (
    <div className="rounded-[18px] border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--theme-primary)]" />
            <h3 className="text-sm font-semibold text-slate-900">Bid Recommendation</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Suggested CPL ranges based on your vertical and targeting
          </p>
        </div>
        {hasBid && (
          <Badge variant="outline" className="shrink-0 border-[var(--theme-primary)]/30 text-[var(--theme-primary)]">
            Your bid
          </Badge>
        )}
      </div>

      <div className="relative mb-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${hasBid ? currentPct : 0}%`,
            background: "var(--theme-gradient-leads)",
          }}
        />
        {hasBid && (
          <div
            className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--theme-primary)] shadow-md transition-all duration-500"
            style={{ left: `calc(${currentPct}% - 8px)` }}
          />
        )}
      </div>

      <div className="space-y-2">
        {tiers.map((tier, index) => {
          const active = hasBid && cplValue >= tier.amount - 0.01;
          return (
            <div
              key={tier.key}
              className={cn(
                "flex items-center justify-between rounded-xl border px-3 py-2.5 transition-colors",
                active
                  ? "border-[var(--theme-primary)]/30 bg-[var(--theme-primary-soft)]"
                  : "border-slate-100 bg-slate-50/50",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{
                    background:
                      index === 0
                        ? "var(--theme-gradient-approved)"
                        : index === 1
                          ? "var(--theme-gradient-leads)"
                          : "var(--theme-gradient-revenue)",
                  }}
                >
                  {tier.pct}%
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{tier.label}</p>
                  <p className="text-xs text-slate-500">{tier.sub}</p>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {hasBid ? `$${tier.amount.toFixed(2)}` : "—"}
              </p>
            </div>
          );
        })}
      </div>

      {!hasBid && (
        <p className="mt-3 text-center text-xs text-slate-500">
          Enter a CPL bid to see where you land on the scale
        </p>
      )}
    </div>
  );
}
