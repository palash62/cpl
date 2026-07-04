"use client";

import type { CampaignStatus } from "@prisma/client";
import { Calendar, Globe, Layers, Sparkles, Target, TrendingUp, Wallet, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getBidRecommendationsFromTiers,
  formatSummaryDate,
  formatSelectedCountriesSummary,
} from "@/lib/campaign-form";
import {
  TIER_PAYOUT_ROWS,
  formatUsd,
  estimateTierPayout,
  type PayoutTiersDisplay,
} from "@/lib/platform-settings";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CampaignStatusChoice = CampaignStatus;

interface CampaignSummaryPanelProps {
  name: string;
  startMode: "now" | "scheduled";
  startDate: string;
  endMode: "forever" | "scheduled";
  endDate: string;
  vertical: string;
  selectedCountries: string[];
  totalBudgetValue: number | null;
  dailyBudgetValue: number | null;
  cplValue: number;
  todayLabel: string;
  mode?: "advertiser" | "admin";
  status?: CampaignStatusChoice;
  onStatusChange?: (status: CampaignStatusChoice) => void;
  autoApprove?: boolean;
  onAutoApproveChange?: (value: boolean) => void;
  statusOptions?: string[];
  statusDisabled?: boolean;
  autoApproveDisabled?: boolean;
}

export function CampaignSummaryPanel({
  name,
  startMode,
  startDate,
  endMode,
  endDate,
  vertical,
  selectedCountries,
  totalBudgetValue,
  dailyBudgetValue,
  cplValue,
  todayLabel,
  mode = "advertiser",
  status = "ACTIVE",
  onStatusChange,
  autoApprove = false,
  onAutoApproveChange,
  statusOptions,
  statusDisabled = false,
  autoApproveDisabled = false,
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
      value: formatSelectedCountriesSummary(selectedCountries),
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
          {mode === "admin" ? "Launch settings" : "Submission"}
        </p>
        {mode === "admin" ? (
          <div className="space-y-3">
            <Select
              value={status}
              onValueChange={(value) => value && onStatusChange?.(value as CampaignStatusChoice)}
              disabled={statusDisabled}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(statusOptions ?? ["ACTIVE", "PENDING", "PAUSED", "DRAFT"]).map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => onAutoApproveChange?.(e.target.checked)}
                disabled={autoApproveDisabled}
                className="h-4 w-4 rounded border-slate-300 accent-[var(--theme-primary)] disabled:cursor-not-allowed"
              />
              Auto-approve leads
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              Your campaign will be submitted for admin review. Once approved, it goes live as Active.
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => onAutoApproveChange?.(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-[var(--theme-primary)]"
              />
              Auto-approve leads
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

interface BidRecommendationPanelProps {
  cplValue: number;
  payoutTiers: PayoutTiersDisplay;
  selectedCountries: string[];
}

export function BidRecommendationPanel({
  cplValue,
  payoutTiers,
  selectedCountries,
}: BidRecommendationPanelProps) {
  const bids = getBidRecommendationsFromTiers(payoutTiers, selectedCountries);
  const hasBid = cplValue > 0;
  const currentPct = hasBid
    ? Math.min(100, Math.round((cplValue / bids.maximum) * 100))
    : 0;

  const tiers = [
    {
      key: "minimum",
      label: "Conservative",
      sub: `Publisher payout from ${formatUsd(bids.payoutMin)}`,
      amount: bids.minimum,
    },
    {
      key: "optimal",
      label: "Balanced",
      sub: "Mid-tier payout target",
      amount: bids.optimal,
    },
    {
      key: "maximum",
      label: "Aggressive",
      sub: `Publisher payout up to ${formatUsd(bids.payoutMax)}`,
      amount: bids.maximum,
    },
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
            Suggested CPL bids based on tier payout ranges ({payoutTiers.publisherPayoutPercent}% publisher share)
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
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{tier.label}</p>
                  <p className="text-xs text-slate-500">{tier.sub}</p>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-900">${tier.amount.toFixed(2)}</p>
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

interface TierPayoutInfoPanelProps {
  payoutTiers: PayoutTiersDisplay;
  cplValue?: number;
  compact?: boolean;
}

function TierPayoutChip({
  label,
  shortLabel,
  countries,
  min,
  max,
  estimate,
  hasCpl,
}: {
  label: string;
  shortLabel: string;
  countries: string;
  min: number;
  max: number;
  estimate: number | null;
  hasCpl: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-left shadow-sm transition-colors hover:border-[var(--theme-primary)]/30 hover:bg-[var(--theme-primary-soft)]/40"
      >
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          {shortLabel}
        </span>
        <span className="truncate text-xs font-semibold text-[var(--theme-primary)]">
          {formatUsd(min)}–{formatUsd(max)}
        </span>
        {hasCpl && estimate !== null && (
          <span className="hidden shrink-0 text-[10px] text-slate-500 sm:inline">
            → {formatUsd(estimate)}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-center">
        <p className="font-medium">{label}</p>
        <p className="mt-0.5 text-[11px] opacity-90">{countries}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function TierPayoutInfoPanel({
  payoutTiers,
  cplValue = 0,
}: TierPayoutInfoPanelProps) {
  const hasCpl = cplValue > 0;

  return (
    <TooltipProvider delay={200}>
      <div className="rounded-lg border border-slate-200/80 bg-gradient-to-r from-slate-50/80 to-white px-2.5 py-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <div className="flex shrink-0 items-center gap-1 text-slate-500">
            <Coins className="h-3.5 w-3.5 text-[var(--theme-primary)]" />
            <span className="text-[11px] font-semibold uppercase tracking-wide">Payouts</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
            {TIER_PAYOUT_ROWS.map((row) => {
              const min = payoutTiers[row.minKey];
              const max = payoutTiers[row.maxKey];
              const estimate = estimateTierPayout(
                cplValue,
                min,
                max,
                payoutTiers.publisherPayoutPercent,
              );
              return (
                <TierPayoutChip
                  key={row.label}
                  label={row.label}
                  shortLabel={row.label.replace("Tier ", "T")}
                  countries={row.countries}
                  min={min}
                  max={max}
                  estimate={estimate}
                  hasCpl={hasCpl}
                />
              );
            })}
          </div>
          <span className="shrink-0 text-[10px] text-slate-400">
            {payoutTiers.publisherPayoutPercent}% CPL
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
