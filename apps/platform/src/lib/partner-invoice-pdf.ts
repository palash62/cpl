import PDFDocument from "pdfkit";
import type { PartnerInvoiceParties } from "@/lib/partner-invoice-parties";
import { formatPartnerPeriodMonthLabel } from "@/services/partner-payment.service";

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

    doc.fontSize(20).fillColor("#0f172a").text("Partner Settlement Invoice", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#64748b");
    doc.text(`Invoice #: ${input.invoiceNumber}`);
    doc.text(`Period: ${periodLabel}`);
    doc.text(`Issue date: ${formatIssueDate(input.issueDate)}`);
    doc.moveDown(1);

    const colY = doc.y;
    doc.fontSize(11).fillColor("#0f172a").text("Payer (Company)", 50, colY);
    doc.fontSize(10).fillColor("#334155");
    doc.text(payer.company, 50, colY + 16);
    doc.text(payer.name);
    doc.text(payer.email);
    doc.text(payer.phone);
    doc.text(payer.domain);

    doc.fontSize(11).fillColor("#0f172a").text("Pay to (Partner)", 300, colY);
    doc.fontSize(10).fillColor("#334155");
    doc.text(payee.name, 300, colY + 16);
    doc.text(payee.email);
    doc.text(payee.phone);

    doc.moveDown(3);
    doc.fontSize(12).fillColor("#0f172a").text("Profit breakdown");
    doc.moveDown(0.5);

    const rows: [string, number][] = [
      ["Advertiser payments", input.snapshot.advertiserPayment],
      ["Less: Publisher payouts", -input.snapshot.publisherPayout],
      ["Less: Referral commissions", -input.snapshot.referralPay],
      ["Platform profit", input.snapshot.platformProfit],
      ["Admin share (80%)", input.snapshot.adminProfit],
      ["Partner share (20%)", input.snapshot.partnerProfit],
    ];

    doc.fontSize(10).fillColor("#334155");
    for (const [label, amount] of rows) {
      const y = doc.y;
      doc.text(label, 50, y, { width: 320 });
      doc.text(formatUsd(Math.abs(amount)), 400, y, { width: 145, align: "right" });
      doc.moveDown(0.3);
    }

    doc.moveDown(1);
    doc
      .strokeColor("#e2e8f0")
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();
    doc.moveDown(0.8);

    doc.fontSize(13).fillColor("#0f172a").text("Amount due (Partner 20%)", 50, doc.y, { continued: true });
    doc.fontSize(13).fillColor("#059669").text(`  ${formatUsd(input.amountDue)}`, { align: "right" });

    doc.moveDown(2);
    doc.fontSize(9).fillColor("#94a3b8").text(
      "This is a platform-generated settlement statement. Record manual partner payments in Admin → Profit → Partner payments.",
      { width: 495 },
    );

    doc.end();
  });
}
