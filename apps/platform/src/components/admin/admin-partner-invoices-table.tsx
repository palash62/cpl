"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileDown, Loader2 } from "lucide-react";
import { formatCurrency } from "@/components/admin/admin-ui";
import { formatPartnerPeriodMonthLabel } from "@/services/partner-payment.service";
import type { PartnerInvoiceRecord } from "@/services/partner-invoice.service";
import { cn } from "@/lib/utils";
import { readApiErrorMessage } from "@/lib/errors";

function formatEmailedAt(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: PartnerInvoiceRecord["status"] }) {
  const paid = status === "PAID";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800",
      )}
    >
      {paid ? "Paid" : "Unpaid"}
    </span>
  );
}

export function AdminPartnerInvoicesTable({
  invoices,
}: {
  invoices: PartnerInvoiceRecord[];
}) {
  const router = useRouter();
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function markPaid(invoice: PartnerInvoiceRecord) {
    const ok = window.confirm(
      `Mark ${invoice.invoiceNumber} as paid?\n\nAmount: ${formatCurrency(invoice.amountDue)}\nOnly continue after you have paid the partner.`,
    );
    if (!ok) return;

    setError("");
    setMarkingId(invoice.id);
    try {
      const res = await fetch(`/api/v1/admin/partner-invoices/${invoice.id}/mark-paid`, {
        method: "POST",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(readApiErrorMessage(data, "Failed to mark invoice paid", res.status));
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to mark invoice paid");
    } finally {
      setMarkingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">Monthly invoices</h2>
        <p className="text-sm text-slate-500">
          Auto-generated on the 1st for the previous month as Unpaid. Download the unpaid PDF,
          pay the partner manually, then mark paid.
        </p>
      </div>

      {error ? (
        <p className="border-b border-amber-100 bg-amber-50 px-5 py-2 text-sm text-amber-800">
          {error}
        </p>
      ) : null}

      {invoices.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-slate-500">
          No monthly invoices yet. Invoices are generated automatically on the 1st of each month.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-50/90 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 pl-5">Month</th>
                <th className="px-4 py-3 text-right">Bill (partner 20%)</th>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Emailed</th>
                <th className="px-4 py-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-t border-slate-100 hover:bg-slate-50/60"
                >
                  <td className="px-4 py-3 pl-5 font-medium text-slate-800">
                    {formatPartnerPeriodMonthLabel(invoice.periodMonth)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                    {formatCurrency(invoice.amountDue)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <span>{formatEmailedAt(invoice.emailedAt)}</span>
                    {invoice.emailError ? (
                      <span
                        className="mt-0.5 block text-xs text-amber-700"
                        title={invoice.emailError}
                      >
                        Email failed
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 pr-5">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/api/v1/admin/partner-invoices/${invoice.id}/download`}
                        className={cn(
                          "inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] px-2.5",
                          "text-[0.8rem] font-medium text-slate-700 hover:bg-slate-100",
                        )}
                      >
                        <FileDown className="h-4 w-4" />
                        Download
                      </a>
                      {invoice.status === "UNPAID" ? (
                        <button
                          type="button"
                          disabled={markingId === invoice.id}
                          onClick={() => void markPaid(invoice)}
                          className={cn(
                            "inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] px-2.5",
                            "text-[0.8rem] font-medium text-emerald-700 hover:bg-emerald-50",
                            "disabled:opacity-60",
                          )}
                        >
                          {markingId === invoice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Mark paid
                        </button>
                      ) : null}
                    </div>
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
