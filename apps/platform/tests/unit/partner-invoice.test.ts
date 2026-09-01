import { describe, it, expect, vi, beforeEach } from "vitest";
import { splitPlatformProfit } from "@/services/admin-profit.service";

const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockUpsert = vi.fn();
const mockUpdate = vi.fn();
const mockGetAdminProfitPageData = vi.fn();
const mockSendEmail = vi.fn();
const mockGetAdminAlertEmail = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    partnerInvoice: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

vi.mock("@/services/admin-profit.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/admin-profit.service")>();
  return {
    ...actual,
    getAdminProfitPageData: (...args: unknown[]) => mockGetAdminProfitPageData(...args),
  };
});

vi.mock("@/services/email.service", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
  getAdminAlertEmail: (...args: unknown[]) => mockGetAdminAlertEmail(...args),
}));

vi.mock("@/lib/partner-invoice-pdf", () => ({
  renderPartnerInvoicePdf: vi.fn().mockResolvedValue(Buffer.from("pdf")),
}));

import {
  buildPartnerInvoiceSnapshot,
  generatePartnerInvoice,
} from "@/services/partner-invoice.service";
import { invoiceNumberForPeriod } from "@/lib/partner-invoice-parties";

describe("Partner invoice service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminAlertEmail.mockResolvedValue("admin@example.com");
    mockSendEmail.mockResolvedValue({ sent: true, provider: "mailgun" });
  });

  it("builds snapshot amount equal to splitPlatformProfit partner share", async () => {
    mockGetAdminProfitPageData.mockResolvedValue({
      summary: {
        advertiserPayment: 1000,
        publisherPayout: 400,
        referralPay: 20,
        platformProfit: 580,
        adminProfit: 464,
        partnerProfit: 116,
      },
      rows: [
        {
          period: "2026-07",
          advertiserPayment: 1000,
          publisherPayout: 400,
          referralPay: 20,
          platformProfit: 580,
          adminProfit: 464,
          partnerProfit: 116,
        },
      ],
    });

    const snapshot = await buildPartnerInvoiceSnapshot("2026-07");
    const split = splitPlatformProfit(580);

    expect(snapshot.partnerProfit).toBe(split.partnerProfit);
    expect(snapshot.partnerProfit).toBe(116);
  });

  it("uses invoice number format INV-YYYY-MM", () => {
    expect(invoiceNumberForPeriod("2026-07")).toBe("INV-2026-07");
  });

  it("skips second generate for the same month when not forced", async () => {
    const existing = {
      id: "inv1",
      invoiceNumber: "INV-2026-07",
      periodMonth: "2026-07",
      amountDue: 100,
      snapshot: {},
      billFrom: {},
      billTo: {},
      emailedAt: new Date("2026-08-01T00:00:00.000Z"),
      emailError: null,
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
    };
    mockFindUnique.mockResolvedValue(existing);

    const result = await generatePartnerInvoice("2026-07");

    expect(result.status).toBe("skipped");
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("creates invoice with partner profit as amount due", async () => {
    const createdRow = {
      id: "new-inv",
      invoiceNumber: "INV-2026-08",
      periodMonth: "2026-08",
      amountDue: 60,
      snapshot: {
        advertiserPayment: 500,
        publisherPayout: 200,
        referralPay: 0,
        platformProfit: 300,
        adminProfit: 240,
        partnerProfit: 60,
      },
      billFrom: { company: "Leadvix", domain: "leadvix.io", email: "a@b.com", name: "X", phone: "1" },
      billTo: { name: "Palash Paul", email: "p@b.com", phone: "2" },
      emailedAt: null,
      emailError: null,
      createdAt: new Date("2026-09-01T00:00:00.000Z"),
    };
    mockFindUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(createdRow);
    mockGetAdminProfitPageData.mockResolvedValue({
      summary: {
        advertiserPayment: 500,
        publisherPayout: 200,
        referralPay: 0,
        platformProfit: 300,
        adminProfit: 240,
        partnerProfit: 60,
      },
      rows: [
        {
          period: "2026-08",
          advertiserPayment: 500,
          publisherPayout: 200,
          referralPay: 0,
          platformProfit: 300,
          adminProfit: 240,
          partnerProfit: 60,
        },
      ],
    });
    mockUpsert.mockResolvedValue(createdRow);
    mockUpdate.mockResolvedValue({});

    const result = await generatePartnerInvoice("2026-08");

    expect(result.status).toBe("created");
    expect(result.invoice.invoiceNumber).toBe("INV-2026-08");
    expect(result.invoice.amountDue).toBe(60);
    expect(mockUpsert).toHaveBeenCalledOnce();
    expect(mockSendEmail).toHaveBeenCalledOnce();
  });
});
