import { endOfDay, endOfMonth, parseISO, startOfMonth } from "date-fns";
import type { PartnerInvoice } from "@prisma/client";
import { getPlatformUrl } from "@cpl/shared";
import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/errors";
import {
  getPartnerInvoiceParties,
  invoiceNumberForPeriod,
  type PartnerInvoiceParties,
} from "@/lib/partner-invoice-parties";
import {
  renderPartnerInvoicePdf,
  type PartnerInvoiceSnapshot,
} from "@/lib/partner-invoice-pdf";
import { renderPartnerInvoiceEmail } from "@/lib/email/templates/partner-invoice";
import { getAdminProfitPageData, splitPlatformProfit } from "@/services/admin-profit.service";
import { getAdminAlertEmail, sendEmail } from "@/services/email.service";
import {
  formatPartnerPeriodMonthLabel,
  isValidPeriodMonth,
} from "@/services/partner-payment.service";

export type PartnerInvoiceRecord = {
  id: string;
  invoiceNumber: string;
  periodMonth: string;
  amountDue: number;
  snapshot: PartnerInvoiceSnapshot;
  billFrom: PartnerInvoiceParties["payer"];
  billTo: PartnerInvoiceParties["payee"];
  emailedAt: string | null;
  emailError: string | null;
  createdAt: string;
};

export type GeneratePartnerInvoiceResult = {
  status: "created" | "skipped" | "updated";
  invoice: PartnerInvoiceRecord;
  emailed: boolean;
  emailError?: string;
};

function roundMoney(value: number) {
  return Math.round(value * 10000) / 10000;
}

function monthRange(periodMonth: string): { from: Date; to: Date } {
  const start = startOfMonth(parseISO(`${periodMonth}-01`));
  return { from: start, to: endOfDay(endOfMonth(start)) };
}

function normalizeSnapshot(raw: PartnerInvoiceSnapshot): PartnerInvoiceSnapshot {
  return {
    advertiserPayment: Number(raw.advertiserPayment) || 0,
    publisherPayout: Number(raw.publisherPayout) || 0,
    referralPay: Number(raw.referralPay) || 0,
    platformProfit: Number(raw.platformProfit) || 0,
    adminProfit: Number(raw.adminProfit) || 0,
    partnerProfit: Number(raw.partnerProfit) || 0,
  };
}

function mapInvoice(row: PartnerInvoice): PartnerInvoiceRecord {
  const snapshot = normalizeSnapshot(row.snapshot as PartnerInvoiceSnapshot);
  const billFrom = row.billFrom as PartnerInvoiceParties["payer"];
  const billTo = row.billTo as PartnerInvoiceParties["payee"];
  return {
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    periodMonth: row.periodMonth,
    amountDue: Number(row.amountDue),
    snapshot,
    billFrom,
    billTo,
    emailedAt: row.emailedAt?.toISOString() ?? null,
    emailError: row.emailError,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function buildPartnerInvoiceSnapshot(
  periodMonth: string,
): Promise<PartnerInvoiceSnapshot> {
  if (!isValidPeriodMonth(periodMonth)) {
    throw Errors.validation("periodMonth must be YYYY-MM", "periodMonth");
  }

  const { from, to } = monthRange(periodMonth);
  const profit = await getAdminProfitPageData(from, to, "month");
  const row = profit.rows.find((r) => r.period === periodMonth);
  if (row) {
    return {
      advertiserPayment: row.advertiserPayment,
      publisherPayout: row.publisherPayout,
      referralPay: row.referralPay,
      platformProfit: row.platformProfit,
      adminProfit: row.adminProfit,
      partnerProfit: row.partnerProfit,
    };
  }

  const split = splitPlatformProfit(profit.summary.platformProfit);
  return {
    advertiserPayment: profit.summary.advertiserPayment,
    publisherPayout: profit.summary.publisherPayout,
    referralPay: profit.summary.referralPay,
    platformProfit: split.platformProfit,
    adminProfit: split.adminProfit,
    partnerProfit: split.partnerProfit,
  };
}

export async function listPartnerInvoices(options?: { limit?: number }): Promise<PartnerInvoiceRecord[]> {
  const rows = await prisma.partnerInvoice.findMany({
    orderBy: { periodMonth: "desc" },
    ...(options?.limit != null ? { take: options.limit } : {}),
  });
  return rows.map(mapInvoice);
}

export async function getPartnerInvoiceById(id: string): Promise<PartnerInvoiceRecord | null> {
  const row = await prisma.partnerInvoice.findUnique({ where: { id } });
  return row ? mapInvoice(row) : null;
}

export async function getPartnerInvoicePdfBuffer(id: string): Promise<Buffer> {
  const invoice = await getPartnerInvoiceById(id);
  if (!invoice) {
    throw Errors.notFound("Partner invoice not found");
  }

  return renderPartnerInvoicePdf({
    invoiceNumber: invoice.invoiceNumber,
    periodMonth: invoice.periodMonth,
    issueDate: new Date(invoice.createdAt),
    amountDue: invoice.amountDue,
    snapshot: invoice.snapshot,
    parties: { payer: invoice.billFrom, payee: invoice.billTo },
  });
}

export async function sendPartnerInvoiceEmail(invoiceId: string): Promise<{
  sent: boolean;
  error?: string;
}> {
  const invoice = await getPartnerInvoiceById(invoiceId);
  if (!invoice) {
    throw Errors.notFound("Partner invoice not found");
  }

  const adminEmail = await getAdminAlertEmail();
  if (!adminEmail) {
    const message = "Admin alert email is not configured";
    await prisma.partnerInvoice.update({
      where: { id: invoiceId },
      data: { emailError: message },
    });
    return { sent: false, error: message };
  }

  const appUrl = getPlatformUrl();
  const downloadUrl = `${appUrl}/api/v1/admin/partner-invoices/${invoiceId}/download`;
  const periodLabel = formatPartnerPeriodMonthLabel(invoice.periodMonth);
  const emailContent = renderPartnerInvoiceEmail({
    appUrl,
    periodLabel,
    invoiceNumber: invoice.invoiceNumber,
    amountDue: invoice.amountDue,
    downloadUrl,
    snapshot: invoice.snapshot,
  });

  const pdfBuffer = await renderPartnerInvoicePdf({
    invoiceNumber: invoice.invoiceNumber,
    periodMonth: invoice.periodMonth,
    issueDate: new Date(invoice.createdAt),
    amountDue: invoice.amountDue,
    snapshot: invoice.snapshot,
    parties: { payer: invoice.billFrom, payee: invoice.billTo },
  });

  const result = await sendEmail({
    to: adminEmail,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
    template: "generic",
    metadata: { kind: "partner_invoice", invoiceId, periodMonth: invoice.periodMonth },
    attachment: {
      filename: `${invoice.invoiceNumber}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    },
  });

  if (result.sent) {
    await prisma.partnerInvoice.update({
      where: { id: invoiceId },
      data: { emailedAt: new Date(), emailError: null },
    });
    return { sent: true };
  }

  const error = result.error ?? "Failed to send partner invoice email";
  await prisma.partnerInvoice.update({
    where: { id: invoiceId },
    data: { emailError: error },
  });
  return { sent: false, error };
}

export async function generatePartnerInvoice(
  periodMonth: string,
  options?: { force?: boolean; sendEmail?: boolean },
): Promise<GeneratePartnerInvoiceResult> {
  if (!isValidPeriodMonth(periodMonth)) {
    throw Errors.validation("periodMonth must be YYYY-MM", "periodMonth");
  }

  const existing = await prisma.partnerInvoice.findUnique({ where: { periodMonth } });
  if (existing && !options?.force) {
    return {
      status: "skipped",
      invoice: mapInvoice(existing),
      emailed: Boolean(existing.emailedAt),
      emailError: existing.emailError ?? undefined,
    };
  }

  const snapshot = await buildPartnerInvoiceSnapshot(periodMonth);
  const amountDue = roundMoney(snapshot.partnerProfit);
  const parties = getPartnerInvoiceParties();
  const invoiceNumber = invoiceNumberForPeriod(periodMonth);

  const row = await prisma.partnerInvoice.upsert({
    where: { periodMonth },
    create: {
      invoiceNumber,
      periodMonth,
      amountDue,
      snapshot,
      billFrom: parties.payer,
      billTo: parties.payee,
    },
    update: {
      invoiceNumber,
      amountDue,
      snapshot,
      billFrom: parties.payer,
      billTo: parties.payee,
    },
  });

  let emailed = false;
  let emailError: string | undefined;
  if (options?.sendEmail !== false) {
    const emailResult = await sendPartnerInvoiceEmail(row.id);
    emailed = emailResult.sent;
    emailError = emailResult.error;
  }

  return {
    status: existing ? "updated" : "created",
    invoice: mapInvoice(row),
    emailed,
    emailError,
  };
}
