import PDFDocument from "pdfkit";
import type { PartnerInvoiceParties } from "@/lib/partner-invoice-parties";
import { formatPartnerPeriodMonthLabel } from "@/services/partner-payment.service";

export const PARTNER_INVOICE_LINE_ITEM = "Software development and maintenance";

export type PartnerInvoiceSnapshot = {
  advertiserPayment: number;
  publisherPayout: number;
  referralPay: number;
  platformProfit: number;
  adminProfit: number;
  partnerProfit: number;
};

export type PartnerInvoicePdfInput = {
  invoiceNumber: string;
  periodMonth: string;
  issueDate: Date;
  amountDue: number;
  snapshot: PartnerInvoiceSnapshot;
  parties: PartnerInvoiceParties;
};

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatIssueDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function renderPartnerInvoicePdf(input: PartnerInvoicePdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const { payer, payee } = input.parties;
    const periodLabel = formatPartnerPeriodMonthLabel(input.periodMonth);

    doc.fontSize(20).fillColor("#0f172a").text("Invoice", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#64748b");
    doc.text(`Invoice #: ${input.invoiceNumber}`);
    doc.text(`Period: ${periodLabel}`);
    doc.text(`Issue date: ${formatIssueDate(input.issueDate)}`);
    doc.moveDown(1);

    const colY = doc.y;
    doc.fontSize(11).fillColor("#0f172a").text("Payer", 50, colY);
    doc.fontSize(10).fillColor("#334155");
    doc.text(payer.company, 50, colY + 16);
    doc.text(payer.name);
    doc.text(payer.email);
    doc.text(payer.phone);
    doc.text(payer.domain);

    doc.fontSize(11).fillColor("#0f172a").text("Pay to", 300, colY);
    doc.fontSize(10).fillColor("#334155");
    doc.text(payee.name, 300, colY + 16);
    doc.text(payee.email);
    doc.text(payee.phone);

    doc.moveDown(3);
    const lineItemY = doc.y;
    doc.fontSize(10).fillColor("#64748b");
    doc.text("Description", 50, lineItemY, { width: 320 });
    doc.text("Amount", 400, lineItemY, { width: 145, align: "right" });
    doc.moveDown(0.6);

    const itemY = doc.y;
    doc.fontSize(10).fillColor("#334155");
    doc.text(PARTNER_INVOICE_LINE_ITEM, 50, itemY, { width: 320 });
    doc.text(formatUsd(input.amountDue), 400, itemY, { width: 145, align: "right" });

    doc.moveDown(1);
    doc
      .strokeColor("#e2e8f0")
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();
    doc.moveDown(0.8);

    doc.fontSize(13).fillColor("#0f172a").text("Amount due", 50, doc.y, { continued: true });
    doc.fontSize(13).fillColor("#059669").text(`  ${formatUsd(input.amountDue)}`, { align: "right" });

    doc.moveDown(2);
    doc.fontSize(9).fillColor("#94a3b8").text(
      "This is a platform-generated invoice. Record manual partner payments in Admin → Profit → Partner payments.",
      { width: 495 },
    );

    doc.end();
  });
}
