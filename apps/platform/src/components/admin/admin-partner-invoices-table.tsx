import { FileDown } from "lucide-react";
import { formatCurrency } from "@/components/admin/admin-ui";
import { formatPartnerPeriodMonthLabel } from "@/services/partner-payment.service";
import type { PartnerInvoiceRecord } from "@/services/partner-invoice.service";
import { cn } from "@/lib/utils";

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
  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">Monthly invoices</h2>
        <p className="text-sm text-slate-500">
          Generated automatically on the 1st of each month for the previous month. No action
          required.
        </p>
      </div>

      {invoices.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-slate-500">
          No monthly invoices yet. Invoices are generated automatically on the 1st of each month.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50/90 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 pl-5">Month</th>
                <th className="px-4 py-3 text-right">Bill (partner 20%)</th>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Emailed</th>
                <th className="px-4 py-3 pr-5 text-right">Invoice</th>
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
                  <td className="px-4 py-3 pr-5 text-right">
                    <a
                      href={`/api/v1/admin/partner-invoices/${invoice.id}/download`}
                      className={cn(
                        "inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] px-2.5",
                        "text-[0.8rem] font-medium text-slate-700 hover:bg-slate-100",
                      )}
                    >
                      <FileDown className="h-4 w-4" />
                      Download PDF
                    </a>
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
