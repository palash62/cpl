import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  platformSetting: { findUnique: vi.fn() },
  lead: { create: vi.fn(), update: vi.fn(), findUniqueOrThrow: vi.fn() },
  user: { findFirst: vi.fn() },
  advertiserOptinPage: { findUnique: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

vi.mock("@/services/wallet.service", () => ({
  getPlatformSettings: vi.fn().mockResolvedValue({ duplicateWindowDays: 30 }),
  processLeadPayment: vi.fn(),
}));

vi.mock("@/services/notify.service", () => ({
  notifyGeneric: vi.fn(),
  notifyRejected: vi.fn(),
}));

vi.mock("@/modules/fraud", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/fraud")>();
  return {
    ...actual,
    evaluateLead: vi.fn().mockResolvedValue({
      riskScore: 0,
      fraudDecision: "auto_approve",
      outcomes: [],
      hardReject: false,
      geoCountry: undefined,
    }),
    getFraudConfig: vi.fn().mockResolvedValue({
      useRiskDecision: false,
      autoApproveMax: 20,
      manualReviewMax: 50,
      minFormDurationMs: 3000,
      duplicateIpWindowHours: 24,
      enabledRules: {},
      weights: {},
    }),
    recordDeviceSeen: vi.fn(),
    refreshPublisherQuality: vi.fn(),
    checkCampaignQualityAlert: vi.fn(),
  };
});

vi.mock("@/modules/autoresponder", () => ({
  dispatchAutoresponderEvent: vi.fn(),
}));

vi.mock("@/modules/email-marketing", () => ({
  dispatchLeadEmailAutomations: vi.fn(),
}));

describe("submitOptinLead email deliverability gate", () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.FRAUD_EMAIL_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FRAUD_EMAIL_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "disposable",
    }) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalKey === undefined) {
      delete process.env.FRAUD_EMAIL_API_KEY;
    } else {
      process.env.FRAUD_EMAIL_API_KEY = originalKey;
    }
  });

  it("rejects disposable email before creating a lead", async () => {
    const admin = { id: "admin-1" };
    const campaign = {
      id: "camp-1",
      status: "ACTIVE",
      targeting: {},
      fields: [{ fieldName: "email", required: true, fieldType: "email" }],
    };
    const optinPage = {
      isPublished: true,
      campaign,
      publishedVersion: {
        formJson: {
          fields: [{ name: "email", type: "email", required: true, label: "Email" }],
        },
      },
    };

    prismaMock.user.findFirst.mockResolvedValue(admin);
    prismaMock.advertiserOptinPage.findUnique.mockResolvedValue(optinPage);

    const { submitOptinLead } = await import("@/services/lead.service");

    await expect(
      submitOptinLead({
        optinSlug: "test-funnel",
        data: { email: "test@mailinator.com" },
      }),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      field: "email",
      message: expect.stringContaining("Disposable email addresses are not allowed"),
    });

    expect(prismaMock.lead.create).not.toHaveBeenCalled();
  });
});
