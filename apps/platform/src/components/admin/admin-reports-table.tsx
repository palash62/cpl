"use client";

import type { AdminEntityReportRow } from "@/services/report.service";
import { formatCurrency } from "@/components/admin/admin-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

export function AdminReportsTable({
  rows,
  mode,
}: {
  rows: AdminEntityReportRow[];
  mode: "publisher" | "advertiser";
}) {
  if (rows.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-sm font-medium text-slate-700">No matching accounts</p>
        <p className="mt-1 text-xs text-slate-500">Try a different search or date range.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-100 hover:bg-transparent">
            <TableHead className="h-10 min-w-[180px] px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Account
            </TableHead>
            <TableHead className="h-10 px-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Clicks
            </TableHead>
            <TableHead className="h-10 px-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Leads
            </TableHead>
            <TableHead className="h-10 px-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Approved
            </TableHead>
            <TableHead className="h-10 px-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Pending
            </TableHead>
            <TableHead className="h-10 px-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Rejected
            </TableHead>
            <TableHead className="h-10 px-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Conv.
            </TableHead>
            <TableHead className="h-10 px-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Approval
            </TableHead>
            <TableHead className="h-10 min-w-[100px] px-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              {mode === "publisher" ? "Earnings" : "Spend"}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className="border-slate-100 hover:bg-slate-50/80">
              <TableCell className="px-4 py-3">
                <p className="text-sm font-medium text-slate-900">{row.name}</p>
                <p className="text-xs text-slate-500">{row.email}</p>
              </TableCell>
              <TableCell className="px-3 py-3 text-right text-sm text-slate-700">
                {row.clicks.toLocaleString()}
              </TableCell>
              <TableCell className="px-3 py-3 text-right text-sm font-semibold text-slate-900">
                {row.leads.toLocaleString()}
              </TableCell>
              <TableCell className="px-3 py-3 text-right text-sm text-emerald-700">
                {row.approvedLeads.toLocaleString()}
              </TableCell>
              <TableCell className="px-3 py-3 text-right text-sm text-amber-700">
                {row.pendingLeads.toLocaleString()}
              </TableCell>
              <TableCell className="px-3 py-3 text-right text-sm text-red-600">
                {row.rejectedLeads.toLocaleString()}
              </TableCell>
              <TableCell className="px-3 py-3 text-right text-sm font-medium text-[var(--theme-primary)]">
                {formatPercent(row.conversionRate)}
              </TableCell>
              <TableCell className="px-3 py-3 text-right text-sm text-slate-600">
                {formatPercent(row.approvalRate)}
              </TableCell>
              <TableCell className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                {formatCurrency(mode === "publisher" ? row.earnings : row.spend)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdminReportsSummaryBar({
  totals,
  rowCount,
  mode,
}: {
  totals: {
    clicks: number;
    leads: number;
    approvedLeads: number;
    conversionRate: number;
    approvalRate: number;
    spend: number;
    earnings: number;
  };
  rowCount: number;
  mode: "publisher" | "advertiser";
}) {
  const items = [
    { label: "Clicks", value: totals.clicks.toLocaleString() },
    { label: "Leads", value: totals.leads.toLocaleString() },
    { label: "Approved", value: totals.approvedLeads.toLocaleString() },
    { label: "Conversion", value: formatPercent(totals.conversionRate) },
    { label: "Approval", value: formatPercent(totals.approvalRate) },
    {
      label: mode === "publisher" ? "Earnings" : "Spend",
      value: formatCurrency(mode === "publisher" ? totals.earnings : totals.spend),
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6">
      <p className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-700">{rowCount}</span>{" "}
        {mode === "publisher" ? "publishers" : "advertisers"}
        <span className="mx-2 text-slate-300">·</span>
        Conv. = leads ÷ clicks · Approval = approved ÷ leads · Earnings/Spend from paid leads
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {items.map((item) => (
          <div key={item.label} className="text-xs">
            <span className="text-slate-500">{item.label}: </span>
            <span className="font-semibold text-slate-800">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
