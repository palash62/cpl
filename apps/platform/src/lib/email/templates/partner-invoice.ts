import { buttonHtml, emailLayout } from "@/lib/email/templates/layout";
import { PARTNER_INVOICE_LINE_ITEM, type PartnerInvoiceSnapshot } from "@/lib/partner-invoice-pdf";

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function renderPartnerInvoiceEmail(params: {
  appUrl: string;
  periodLabel: string;
  invoiceNumber: string;
  amountDue: number;
  downloadUrl: string;
  snapshot: PartnerInvoiceSnapshot;
}) {
  const amountFormatted = formatUsd(params.amountDue);
  const body = `<p style="margin:0 0 8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6366f1;">Invoice</p>
    <p style="margin:0 0 12px;font-size:18px;font-weight:600;color:#0f172a;">${params.periodLabel}</p>
    <p style="margin:0 0 12px;">Invoice <strong>${params.invoiceNumber}</strong> is ready.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#64748b;">${PARTNER_INVOICE_LINE_ITEM}</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#059669;">${amountFormatted}</td></tr>
      <tr><td style="padding:6px 0;color:#0f172a;font-weight:600;">Amount due</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#059669;">${amountFormatted}</td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#64748b;">The PDF is attached. You can also download it from the admin profit page.</p>
    ${buttonHtml("Download PDF", params.downloadUrl)}`;

  const text = `Leadvix Invoice — ${params.periodLabel}

Invoice: ${params.invoiceNumber}
${PARTNER_INVOICE_LINE_ITEM}: ${amountFormatted}
Amount due: ${amountFormatted}

Download: ${params.downloadUrl}`;

  return {
    subject: `Leadvix Invoice — ${params.periodLabel} (${amountFormatted} due)`,
    html: emailLayout(body, params.appUrl),
    text,
  };
}
