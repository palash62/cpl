"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/components/admin/admin-ui";
import {
  formatPartnerPeriodMonthLabel,
  previousCalendarMonth,
} from "@/services/partner-payment.service";
import type { PartnerInvoiceRecord } from "@/services/partner-invoice.service";

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

export function AdminPartnerInvoicesTable({
  invoices,
}: {
  invoices: PartnerInvoiceRecord[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const defaultMonth = previousCalendarMonth();

  async function handleGenerate() {
    setError(null);
    setSuccess(null);
    const periodLabel = formatPartnerPeriodMonthLabel(defaultMonth);
    if (
      !window.confirm(
        `Generate and email the partner invoice for ${periodLabel}? Existing invoice for that month will be skipped unless you force-regenerate from the API.`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/partner-invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodMonth: defaultMonth }),
      });
      const json = (await res.json()) as {
        data?: { status: string; emailed: boolean; emailError?: string };
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(json.error?.message ?? "Failed to generate invoice");
      }
      const status = json.data?.status ?? "created";
      if (status === "skipped") {
        setSuccess(`Invoice for ${periodLabel} already exists.`);
      } else if (json.data?.emailed) {
        setSuccess(`Invoice for ${periodLabel} generated and emailed.`);
      } else {
        setSuccess(
          `Invoice for ${periodLabel} generated. Email failed: ${json.data?.emailError ?? "unknown error"}`,
        );
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate invoice");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[18px] border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Partner invoices</h2>
          <p className="text-sm text-slate-500">
            Monthly settlement statements (partner 20% share). Auto-generated on the 1st for the
            previous month.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={loading} onClick={handleGenerate}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Generate {formatPartnerPeriodMonthLabel(defaultMonth)}
        </Button>
      </div>

      {error ? (
        <p className="px-5 pt-4 text-sm text-rose-600">{error}</p>
      ) : null}
      {success ? (
        <p className="px-5 pt-4 text-sm text-emerald-700">{success}</p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">Period</th>
              <th className="px-5 py-3">Invoice #</th>
              <th className="px-5 py-3 text-right">Amount due</th>
              <th className="px-5 py-3">Emailed</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  No partner invoices yet.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {formatPartnerPeriodMonthLabel(invoice.periodMonth)}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">{invoice.invoiceNumber}</td>
                  <td className="px-5 py-3 text-right font-medium text-emerald-700">
                    {formatCurrency(invoice.amountDue)}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{formatEmailedAt(invoice.emailedAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <a
                      href={`/api/v1/admin/partner-invoices/${invoice.id}/download`}
                      className="inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <FileDown className="h-4 w-4" />
                      Download PDF
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
