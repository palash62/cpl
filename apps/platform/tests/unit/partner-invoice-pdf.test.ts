import { describe, it, expect } from "vitest";
import { renderPartnerInvoicePdf, PARTNER_INVOICE_LINE_ITEM } from "@/lib/partner-invoice-pdf";
import { getPartnerInvoiceParties } from "@/lib/partner-invoice-parties";

describe("Partner invoice PDF", () => {
  it("renders a valid PDF buffer", async () => {
    const parties = getPartnerInvoiceParties();
    const buffer = await renderPartnerInvoicePdf({
      invoiceNumber: "INV-2026-08",
      periodMonth: "2026-08",
      issueDate: new Date("2026-09-01T00:00:00.000Z"),
      amountDue: 123.45,
      status: "UNPAID",
      snapshot: {
        advertiserPayment: 1000,
        publisherPayout: 400,
        referralPay: 20,
        platformProfit: 580,
        adminProfit: 464,
        partnerProfit: 123.45,
      },
      parties,
    });

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(100);
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
    expect(PARTNER_INVOICE_LINE_ITEM).toBe("Software development and maintenance");
    const asText = buffer.toString("latin1");
    expect(asText).toContain("INVOICE");
    expect(asText).toContain("INV-2026-08");
  });

  it("renders paid status invoice PDF", async () => {
    const parties = getPartnerInvoiceParties();
    const buffer = await renderPartnerInvoicePdf({
      invoiceNumber: "INV-2026-08",
      periodMonth: "2026-08",
      issueDate: new Date("2026-09-01T00:00:00.000Z"),
      amountDue: 123.45,
      status: "PAID",
      paidAt: new Date("2026-09-15T00:00:00.000Z"),
      snapshot: {
        advertiserPayment: 1000,
        publisherPayout: 400,
        referralPay: 20,
        platformProfit: 580,
        adminProfit: 464,
        partnerProfit: 123.45,
      },
      parties,
    });

    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
    const asText = buffer.toString("latin1");
    expect(asText).toContain("PAID");
    expect(asText).toContain("Amount paid");
  });
});
