import PDFDocument from "pdfkit";
import { addMonths, parseISO, startOfMonth } from "date-fns";
import type { PartnerInvoiceParties } from "@/lib/partner-invoice-parties";
import { formatPartnerPeriodMonthLabel } from "@/services/partner-payment.service";

export const PARTNER_INVOICE_LINE_ITEM = "Software development and maintenance";

export type PartnerInvoicePaymentStatus = "UNPAID" | "PAID";

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
  status: PartnerInvoicePaymentStatus;
  paidAt?: Date | null;
  snapshot: PartnerInvoiceSnapshot;
  parties: PartnerInvoiceParties;
};

const PAGE = {
  left: 50,
  right: 545,
  width: 495,
};

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function dueDateForPeriod(periodMonth: string): Date {
  return startOfMonth(addMonths(parseISO(`${periodMonth}-01`), 1));
}

function drawRoundedRect(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  doc.moveTo(x + r, y);
  doc.lineTo(x + w - r, y);
  doc.quadraticCurveTo(x + w, y, x + w, y + r);
  doc.lineTo(x + w, y + h - r);
  doc.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  doc.lineTo(x + r, y + h);
  doc.quadraticCurveTo(x, y + h, x, y + h - r);
  doc.lineTo(x, y + r);
  doc.quadraticCurveTo(x, y, x + r, y);
  doc.closePath();
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
    const dueDate = dueDateForPeriod(input.periodMonth);
    const isPaid = input.status === "PAID";
    const statusLabel = isPaid ? "Paid" : "Unpaid";
    const amountLabel = isPaid ? "Amount paid" : "Amount due";

    // Header bar
    doc.rect(0, 0, 595, 72).fill("#0f172a");
    doc
      .fillColor("#ffffff")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text(payer.company.toUpperCase(), PAGE.left, 24, { width: 260 });
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#94a3b8")
      .text(payer.domain, PAGE.left, 50, { width: 260 });
    doc
      .fillColor("#ffffff")
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("INVOICE", 320, 28, { width: 225, align: "right" });

    // Meta block (right)
    let y = 96;
    doc.font("Helvetica").fontSize(9).fillColor("#64748b");
    const metaLeft = 320;
    const metaWidth = 225;
    const metaRows: Array<[string, string, string?]> = [
      ["Invoice #", input.invoiceNumber],
      ["Due month", periodLabel],
      ["Issue date", formatLongDate(input.issueDate)],
      ["Due date", formatLongDate(dueDate)],
      ["Status", statusLabel, isPaid ? "#059669" : "#b45309"],
    ];
    if (isPaid && input.paidAt) {
      metaRows.push(["Paid date", formatLongDate(input.paidAt)]);
    }
    for (const [label, value, valueColor] of metaRows) {
      doc.fillColor("#64748b").text(label, metaLeft, y, { width: 90 });
      doc
        .fillColor(valueColor ?? "#0f172a")
        .font(label === "Status" ? "Helvetica-Bold" : "Helvetica")
        .text(value, metaLeft + 90, y, { width: metaWidth - 90, align: "right" });
      doc.font("Helvetica");
      y += 14;
    }

    // Parties
    const partiesY = 96;
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#94a3b8").text("BILL FROM", PAGE.left, partiesY);
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text(payer.company, PAGE.left, partiesY + 14);
    doc.font("Helvetica").fontSize(9).fillColor("#334155");
    doc.text(payer.name, PAGE.left, partiesY + 30);
    doc.text(payer.email);
    doc.text(payer.phone);
    doc.text(payer.domain);

    const payToX = 190;
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#94a3b8").text("PAY TO", payToX, partiesY);
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text(payee.name, payToX, partiesY + 14);
    doc.font("Helvetica").fontSize(9).fillColor("#334155");
    doc.text(payee.email, payToX, partiesY + 30);
    doc.text(payee.phone, payToX);

    // Divider under parties / meta
    const tableTop = Math.max(y, partiesY + 90) + 16;
    doc
      .strokeColor("#e2e8f0")
      .lineWidth(1)
      .moveTo(PAGE.left, tableTop)
      .lineTo(PAGE.right, tableTop)
      .stroke();

    // Line-item table header
    const headerY = tableTop + 14;
    const rowH = 28;
    const colDescX = PAGE.left;
    const colDescW = 340;
    const colAmtX = PAGE.left + colDescW;
    const colAmtW = PAGE.width - colDescW;

    doc.rect(PAGE.left, headerY, PAGE.width, rowH).fill("#f8fafc");
    doc
      .strokeColor("#e2e8f0")
      .rect(PAGE.left, headerY, PAGE.width, rowH)
      .stroke();
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#64748b")
      .text("DESCRIPTION", colDescX + 12, headerY + 9, { width: colDescW - 24 })
      .text("AMOUNT", colAmtX + 8, headerY + 9, { width: colAmtW - 20, align: "right" });

    // Line item row
    const itemY = headerY + rowH;
    doc
      .strokeColor("#e2e8f0")
      .rect(PAGE.left, itemY, PAGE.width, rowH + 8)
      .stroke();
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#0f172a")
      .text(PARTNER_INVOICE_LINE_ITEM, colDescX + 12, itemY + 12, { width: colDescW - 24 })
      .text(formatUsd(input.amountDue), colAmtX + 8, itemY + 12, {
        width: colAmtW - 20,
        align: "right",
      });
    doc
      .fontSize(8)
      .fillColor("#64748b")
      .text(`Partner share (20%) · ${periodLabel}`, colDescX + 12, itemY + 26, {
        width: colDescW - 24,
      });

    // Totals box
    const totalsY = itemY + rowH + 28;
    const boxW = 220;
    const boxX = PAGE.right - boxW;
    const boxH = 52;
    drawRoundedRect(doc, boxX, totalsY, boxW, boxH, 6);
    doc.fillColor("#f8fafc").fill();
    drawRoundedRect(doc, boxX, totalsY, boxW, boxH, 6);
    doc.strokeColor("#e2e8f0").stroke();

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#64748b")
      .text(amountLabel.toUpperCase(), boxX + 14, totalsY + 12, { width: boxW - 28 });
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(isPaid ? "#059669" : "#0f172a")
      .text(formatUsd(input.amountDue), boxX + 14, totalsY + 26, {
        width: boxW - 28,
        align: "right",
      });

    // PAID stamp
    if (isPaid) {
      doc.save();
      doc.translate(300, 420);
      doc.rotate(-18);
      doc
        .lineWidth(2.5)
        .strokeColor("#059669")
        .fillColor("#059669");
      drawRoundedRect(doc, -54, -22, 108, 44, 6);
      doc.stroke();
      doc
        .font("Helvetica-Bold")
        .fontSize(22)
        .fillColor("#059669")
        .opacity(0.85)
        .text("PAID", -54, -8, { width: 108, align: "center" });
      doc.restore();
      doc.opacity(1);
    }

    // Footer
    const footerY = 760;
    doc
      .strokeColor("#e2e8f0")
      .moveTo(PAGE.left, footerY)
      .lineTo(PAGE.right, footerY)
      .stroke();
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#94a3b8")
      .text(
        isPaid
          ? `Marked paid in Admin → Profit after manual partner payment. ${payer.company} · ${payer.domain}`
          : `Please pay the partner manually, then mark this invoice as paid in Admin → Profit. ${payer.company} · ${payer.domain}`,
        PAGE.left,
        footerY + 10,
        { width: PAGE.width, align: "center" },
      );

    doc.end();
  });
}
