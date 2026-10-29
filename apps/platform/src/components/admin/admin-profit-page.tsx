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
import {
  currentCalendarMonth,
  formatPartnerPaidDate,
  formatPartnerPeriodMonthLabel,
  type PartnerPaymentRecord,
  type PartnerSettlementRow,
  type PartnerSettlementStatus,
  type PartnerSettlementSummary,
} from "@/services/partner-payment.service";
import type { PartnerInvoiceRecord } from "@/services/partner-invoice.service";
import { FileDown } from "lucide-react";
import { cn } from "@/lib/utils";

function moneyClass(value: number) {
  return value >= 0 ? "text-emerald-700" : "text-rose-700";
}

function settlementStatusLabel(status: PartnerSettlementStatus) {
  switch (status) {
    case "unpaid":
    case "partial":
      return "Unpaid";
    case "settled":
      return "Paid";
    case "overpaid":
      return "Overpaid";
  }
}

function settlementStatusClass(status: PartnerSettlementStatus) {
  switch (status) {
    case "unpaid":
    case "partial":
      return "bg-amber-50 text-amber-800";
    case "settled":
      return "bg-emerald-50 text-emerald-800";
    case "overpaid":
      return "bg-violet-50 text-violet-800";
  }
}

export function AdminPartnerSettlementSummary({
  summary,
}: {
  summary: PartnerSettlementSummary;
}) {
  const stillToPay = Math.max(0, summary.remaining);
  const cards = [
    {
      title: "Partner share",
      value: summary.owed,
      description: "Total 20% partner profit for this range",
      accent: "border-t-violet-500",
    },
    {
      title: "Already paid",
      value: summary.paid,
      description: "Marked paid on monthly invoices",
      accent: "border-t-sky-500",
    },
    {
      title: "Still to pay",
      value: stillToPay,
      description: "Partner share minus already paid",
      accent: "border-t-amber-500",
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
        </div>
      ))}
    </div>
  );
}

export function AdminPartnerOngoingMonth({
  rows,
  currentMonth = currentCalendarMonth(),
}: {
  rows: PartnerSettlementRow[];
  currentMonth?: string;
}) {
  const row = rows.find((r) => r.periodMonth === currentMonth);
  const owed = row?.owed ?? 0;
  const paid = row?.paid ?? 0;
  const stillToPay = Math.max(0, row?.remaining ?? owed - paid);

  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">Ongoing</h2>
        <p className="text-sm text-slate-500">
          Accruing this month. Invoice is created on the 1st for the previous month.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50/90 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 pl-5">Month</th>
              <th className="px-4 py-3">Partner share</th>
              <th className="px-4 py-3">Already paid</th>
              <th className="px-4 py-3">Still to pay</th>
              <th className="px-4 py-3 pr-5">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100">
              <td className="px-4 py-3 pl-5 font-medium text-slate-800">
                {formatPartnerPeriodMonthLabel(currentMonth)}
              </td>
              <td className={cn("px-4 py-3", moneyClass(owed))}>{formatCurrency(owed)}</td>
              <td className="px-4 py-3 text-slate-700">{formatCurrency(paid)}</td>
              <td className={cn("px-4 py-3 font-semibold", moneyClass(stillToPay))}>
                {formatCurrency(stillToPay)}
              </td>
              <td className="px-4 py-3 pr-5">
                <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-800">
                  Ongoing
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminPartnerSettlementTable({
  rows,
  currentMonth = currentCalendarMonth(),
}: {
  rows: PartnerSettlementRow[];
  currentMonth?: string;
}) {
  const visibleRows = rows.filter(
    (row) => row.periodMonth !== currentMonth && (row.owed > 0 || row.paid > 0),
  );

  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">Partner settlement</h2>
        <p className="text-sm text-slate-500">
          Completed months in this range (current month is under Ongoing)
        </p>
      </div>
      {visibleRows.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-slate-500">
          No partner share or payments in this range.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50/90 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 pl-5">Month</th>
                <th className="px-4 py-3">Partner share</th>
                <th className="px-4 py-3">Already paid</th>
                <th className="px-4 py-3">Still to pay</th>
                <th className="px-4 py-3 pr-5">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const stillToPay = Math.max(0, row.remaining);
                return (
                  <tr key={row.periodMonth} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3 pl-5 font-medium text-slate-800">
                      {formatPartnerPeriodMonthLabel(row.periodMonth)}
                    </td>
                    <td className={cn("px-4 py-3", moneyClass(row.owed))}>
                      {formatCurrency(row.owed)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(row.paid)}</td>
                    <td className={cn("px-4 py-3 font-semibold", moneyClass(stillToPay))}>
                      {formatCurrency(stillToPay)}
                    </td>
                    <td className="px-4 py-3 pr-5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          settlementStatusClass(row.status),
                        )}
                      >
                        {settlementStatusLabel(row.status)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function invoiceNumberFromPaymentNote(note: string | null): string | null {
  if (!note) return null;
  const match = note.match(/\bINV-\d{4}-\d{2}\b/);
  return match?.[0] ?? null;
}

type HistoryRow =
  | {
      kind: "invoice";
      key: string;
      periodMonth: string;
      amount: number;
      paidAt: string | null;
      invoiceId: string;
      invoiceNumber: string;
    }
  | {
      kind: "payment";
      key: string;
      periodMonth: string;
      amount: number;
      paidAt: string;
      invoiceNumber: null;
      method: string | null;
      note: string | null;
      createdByName: string | null;
    };

export function AdminPartnerPaymentHistory({
  invoices,
  payments,
}: {
  invoices: PartnerInvoiceRecord[];
  payments: PartnerPaymentRecord[];
}) {
  const paidInvoices = invoices
    .filter((invoice) => invoice.status === "PAID")
    .slice()
    .sort((a, b) => b.periodMonth.localeCompare(a.periodMonth));

  const coveredInvoiceNumbers = new Set(paidInvoices.map((invoice) => invoice.invoiceNumber));

  const orphanPayments = payments.filter((payment) => {
    const invoiceNumber = invoiceNumberFromPaymentNote(payment.note);
    return !invoiceNumber || !coveredInvoiceNumbers.has(invoiceNumber);
  });

  const rows: HistoryRow[] = [
    ...paidInvoices.map(
      (invoice): HistoryRow => ({
        kind: "invoice",
        key: `invoice-${invoice.id}`,
        periodMonth: invoice.periodMonth,
        amount: invoice.amountDue,
        paidAt: invoice.paidAt,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      }),
    ),
    ...orphanPayments.map(
      (payment): HistoryRow => ({
        kind: "payment",
        key: `payment-${payment.id}`,
        periodMonth: payment.periodMonth,
        amount: payment.amount,
        paidAt: payment.paidAt,
        invoiceNumber: null,
        method: payment.method,
        note: payment.note,
        createdByName: payment.createdByName,
      }),
    ),
  ].sort((a, b) => {
    const byMonth = b.periodMonth.localeCompare(a.periodMonth);
    if (byMonth !== 0) return byMonth;
    return (b.paidAt ?? "").localeCompare(a.paidAt ?? "");
  });

  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">History</h2>
        <p className="text-sm text-slate-500">
          Paid invoices and payments (newest due month first)
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-slate-500">
          No paid invoices or partner payments yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="bg-slate-50/90 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 pl-5">Due month</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Paid date</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3 pl-5 font-medium text-slate-800">
                    {formatPartnerPeriodMonthLabel(row.periodMonth)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {formatCurrency(row.amount)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {row.invoiceNumber || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatPartnerPaidDate(row.paidAt)}
                  </td>
                  <td className="max-w-[240px] truncate px-4 py-3 text-slate-600">
                    {row.kind === "invoice"
                      ? "Marked paid"
                      : [row.method, row.note, row.createdByName]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3 pr-5 text-right">
                    {row.kind === "invoice" ? (
                      <a
                        href={`/api/v1/admin/partner-invoices/${row.invoiceId}/download`}
                        className={cn(
                          "inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] px-2.5",
                          "text-[0.8rem] font-medium text-slate-700 hover:bg-slate-100",
                        )}
                      >
                        <FileDown className="h-4 w-4" />
                        Download
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
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
