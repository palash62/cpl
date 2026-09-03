"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ProfitPeriod } from "@/services/admin-profit.service";
import { cn } from "@/lib/utils";

const PERIODS: { value: ProfitPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "Last Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

export function AdminProfitFilters({ period }: { period: ProfitPeriod }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setPeriod(next: ProfitPeriod) {
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

  return (
    <div className="flex flex-wrap gap-2 rounded-[18px] border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      {PERIODS.map((item) => (
        <button
          key={item.value}
          type="button"
          disabled={isPending}
          onClick={() => setPeriod(item.value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            period === item.value
              ? "bg-[var(--theme-primary)] text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
