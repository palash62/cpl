"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SourceReportSort } from "@/services/source-optimization.service";

const SORT_MAP: Record<
  string,
  { asc: SourceReportSort; desc: SourceReportSort }
> = {
  advertiser: { asc: "advertiser_asc", desc: "advertiser_desc" },
  publisher: { asc: "publisher_asc", desc: "publisher_desc" },
  sourceId: { asc: "sourceId_asc", desc: "sourceId_desc" },
  originalSource: { asc: "originalSource_asc", desc: "originalSource_desc" },
  leads: { asc: "leads_asc", desc: "leads_desc" },
  approved: { asc: "approved_asc", desc: "approved_desc" },
  rejected: { asc: "rejected_asc", desc: "rejected_desc" },
  sales: { asc: "sales_asc", desc: "sales_desc" },
  revenue: { asc: "revenue_asc", desc: "revenue_desc" },
  approval: { asc: "approval_asc", desc: "approval_desc" },
  spend: { asc: "spend_asc", desc: "spend_desc" },
  bid: { asc: "bid_asc", desc: "bid_desc" },
  lastLead: { asc: "lastLead_asc", desc: "lastLead_desc" },
};

export function AdminSourceOptimizationSortHeader({
  field,
  label,
  align = "left",
}: {
  field: keyof typeof SORT_MAP;
  label: string;
  align?: "left" | "right" | "center";
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "leads_desc";
  const { asc, desc } = SORT_MAP[field];

  const isAsc = current === asc;
  const isDesc = current === desc;
  const active = isAsc || isDesc;
  const nextSort = isAsc ? desc : asc;

  const params = new URLSearchParams(searchParams.toString());
  params.set("sort", nextSort);
  params.delete("page");

  const alignClass =
    align === "right"
      ? "justify-end text-right"
      : align === "center"
        ? "justify-center text-center"
        : "";

  return (
    <Link
      href={`${pathname}?${params.toString()}`}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:text-slate-900",
        alignClass,
        active && "text-[var(--theme-primary)]",
      )}
    >
      {label}
      {active ? (
        isAsc ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
      )}
    </Link>
  );
}
