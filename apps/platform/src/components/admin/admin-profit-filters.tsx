"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ProfitPeriod } from "@/services/admin-profit.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PERIODS: { value: ProfitPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "Last Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom" },
];

export function AdminProfitFilters({
  period,
  fromStr,
  toStr,
}: {
  period: ProfitPeriod;
  fromStr: string;
  toStr: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showCustom, setShowCustom] = useState(period === "custom");
  const [dateFrom, setDateFrom] = useState(fromStr);
  const [dateTo, setDateTo] = useState(toStr);

  useEffect(() => {
    setShowCustom(period === "custom");
    setDateFrom(fromStr);
    setDateTo(toStr);
  }, [period, fromStr, toStr]);

  function setPeriod(next: ProfitPeriod) {
    if (next === "custom") {
      setShowCustom(true);
      return;
    }

    setShowCustom(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", next);
    params.delete("from");
    params.delete("to");
    params.delete("group");
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function applyCustomRange() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", "custom");
    params.set("from", dateFrom);
    params.set("to", dateTo);
    params.delete("group");
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const activePeriod = showCustom ? "custom" : period;

  return (
    <div className="space-y-4 rounded-[18px] border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((item) => (
          <button
            key={item.value}
            type="button"
            disabled={isPending}
            onClick={() => setPeriod(item.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              activePeriod === item.value
                ? "bg-[var(--theme-primary)] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {showCustom ? (
        <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">From</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 w-[11.5rem] bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">To</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 w-[11.5rem] bg-white"
            />
          </div>
          <Button
            type="button"
            size="sm"
            onClick={applyCustomRange}
            disabled={isPending || !dateFrom || !dateTo}
            className="h-9 bg-[var(--theme-primary)] hover:opacity-90"
          >
            {isPending ? "Applying..." : "Apply range"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
