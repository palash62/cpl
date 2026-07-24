"use client";

import { Suspense } from "react";
import { formatCurrency } from "@/components/admin/admin-ui";
import { UsersTablePagination } from "@/components/admin/users-table-pagination";
import { ExportCsvButton } from "@/components/reports/export-csv-button";
import {
  formatProfitDateDisplay,
  formatProfitPeriodLabel,
  type AdminProfitPageData,
  type ProfitGroupBy,
} from "@/services/admin-profit.service";
import { cn } from "@/lib/utils";

function moneyClass(value: number) {
  return value >= 0 ? "text-emerald-700" : "text-rose-700";
}

export function AdminProfitSummaryCards({
  summary,
}: {
  summary: AdminProfitPageData["summary"];
}) {
  const cards = [
    {
      title: "Platform profit",
      value: summary.platformProfit,
      description: "Advertiser payments − publisher payouts − referral pay",
      detail: `${formatCurrency(summary.advertiserPayment)} − ${formatCurrency(summary.publisherPayout)} − ${formatCurrency(summary.referralPay)}`,
      accent: "border-t-emerald-500",
    },
    {
      title: "Admin profit",
      value: summary.adminProfit,
      description: "Platform profit × 80%",
      detail: `${formatCurrency(summary.platformProfit)} × 80%`,
      accent: "border-t-sky-500",
    },
    {
      title: "Partner profit",
      value: summary.partnerProfit,
      description: "Remaining share · Platform profit × 20%",
      detail: `${formatCurrency(summary.platformProfit)} × 20%`,
      accent: "border-t-violet-500",
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className={cn(
            "rounded-[18px] border border-slate-200/80 border-t-[3px] bg-white p-5 shadow-sm",
            card.accent,
          )}
        >
          <p className="text-sm font-medium text-slate-600">{card.title}</p>
          <p className={cn("mt-2 text-2xl font-bold", moneyClass(card.value))}>
            {formatCurrency(card.value)}
          </p>
          <p className="mt-2 text-xs text-slate-500">{card.description}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">{card.detail}</p>
        </div>
      ))}
    </div>
  );
}

export function AdminProfitReportTable({
  allRows,
  pageRows,
  groupBy,
  fromStr,
  toStr,
  page,
  totalPages,
  total,
}: {
  allRows: AdminProfitPageData["rows"];
  pageRows: AdminProfitPageData["rows"];
  groupBy: ProfitGroupBy;
  fromStr: string;
  toStr: string;
  page: number;
  totalPages: number;
  total: number;
}) {
  const headers = [
    "Period",
    "Advertiser payments",
    "Publisher payouts",
    "Referral pay",
    "Platform profit",
    "Admin profit (80%)",
    "Partner profit (20%)",
  ];

  const fromLabel = formatProfitDateDisplay(fromStr);
  const toLabel = formatProfitDateDisplay(toStr);

  const csvRows = allRows.map((row) => [
    formatProfitPeriodLabel(row.period, groupBy),
    row.advertiserPayment,
    row.publisherPayout,
    row.referralPay,
    row.platformProfit,
    row.adminProfit,
    row.partnerProfit,
  ]);

  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Profit report</h2>
          <p className="text-sm text-slate-500">
            Breakdown for {fromLabel} → {toLabel}
          </p>
        </div>
        <ExportCsvButton
          filename={`admin-profit-${fromStr}-${toStr}.csv`}
          headers={headers}
          rows={csvRows}
        />
      </div>

      {total === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-slate-500">No profit data for this range.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50/90 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  {headers.map((header) => (
                    <th key={header} className="px-4 py-3 first:pl-5 last:pr-5">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.period} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3 pl-5 font-medium text-slate-800">
                      {formatProfitPeriodLabel(row.period, groupBy)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(row.advertiserPayment)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(row.publisherPayout)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(row.referralPay)}</td>
                    <td className={cn("px-4 py-3 font-semibold", moneyClass(row.platformProfit))}>
                      {formatCurrency(row.platformProfit)}
                    </td>
                    <td className={cn("px-4 py-3 font-semibold", moneyClass(row.adminProfit))}>
                      {formatCurrency(row.adminProfit)}
                    </td>
                    <td className={cn("px-4 py-3 pr-5 font-semibold", moneyClass(row.partnerProfit))}>
                      {formatCurrency(row.partnerProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Suspense fallback={null}>
            <UsersTablePagination page={page} totalPages={totalPages} total={total} />
          </Suspense>
        </>
      )}
    </div>
  );
}
