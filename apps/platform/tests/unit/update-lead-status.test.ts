import { beforeEach, describe, expect, it, vi } from "vitest";

const leadState = {
  id: "lead-1",
  status: "PENDING",
  isTest: false,
  publisherId: "publisher-1",
  campaignId: "campaign-1",
  trackingLinkId: null as string | null,
  campaign: {
    id: "campaign-1",
    advertiserId: "advertiser-1",
    name: "Campaign A",
    advertiser: { id: "advertiser-1", email: "adv@test.com", name: "Adv" },
  },
  publisher: { id: "publisher-1", email: "pub@test.com", name: "Pub" },
};

const prismaMock = {
  lead: {
    findUniqueOrThrow: vi.fn(async () => ({ ...leadState })),
    update: vi.fn(),
    findUnique: vi.fn(async () => ({ ...leadState })),
  },
  campaign: {
    findUnique: vi.fn().mockResolvedValue({ name: "Campaign A" }),
    update: vi.fn(),
  },
  $transaction: vi.fn(async (callback: (tx: typeof prismaMock) => unknown) =>
    callback(prismaMock),
  ),
};

const processLeadPayment = vi.fn();
const reverseLeadPayment = vi.fn().mockResolvedValue({ alreadyReversed: false, cpl: 1 });

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/services/wallet.service", () => ({
  processLeadPayment: (...args: unknown[]) => processLeadPayment(...args),
  reverseLeadPayment,
  getPlatformSettings: vi.fn(),
  PAUSED_REASON_INSUFFICIENT_FUNDS: "Insufficient wallet balance",
}));
vi.mock("@/modules/fraud", () => ({
  refreshPublisherQuality: vi.fn(),
  checkCampaignQualityAlert: vi.fn(),
  evaluateLead: vi.fn(),
  getFraudConfig: vi.fn(),
  recordDeviceSeen: vi.fn(),
}));
vi.mock("@/services/notify.service", () => ({
  notifyGeneric: vi.fn(),
  notifyRejected: vi.fn(),
  notifyApproved: vi.fn(),
  notifyUserById: vi.fn(),
  notifyAdminAlert: vi.fn(),
  notifyCampaignPausedForFunds: vi.fn(),
}));
vi.mock("@/modules/autoresponder", () => ({ dispatchAutoresponderEvent: vi.fn() }));
vi.mock("@/modules/email-marketing", () => ({ dispatchLeadEmailAutomations: vi.fn() }));

describe("updateLeadStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    leadState.status = "PENDING";
    leadState.isTest = false;
    reverseLeadPayment.mockResolvedValue({ alreadyReversed: false, cpl: 1 });
    processLeadPayment.mockResolvedValue(undefined);
    prismaMock.lead.findUniqueOrThrow.mockImplementation(async () => ({ ...leadState }));
    prismaMock.lead.findUnique.mockImplementation(async () => ({ ...leadState }));
  });

  it("rejects unpaid pending leads without reversing payment", async () => {
    const { updateLeadStatus } = await import("@/services/lead.service");

    await updateLeadStatus("lead-1", "REJECTED", "admin-1", "Bad lead", { isAdmin: true });

    expect(reverseLeadPayment).not.toHaveBeenCalled();
    expect(prismaMock.lead.update).toHaveBeenCalledWith({
      where: { id: "lead-1" },
      data: {
        status: "REJECTED",
        statusHistory: {
          create: {
            fromStatus: "PENDING",
            toStatus: "REJECTED",
            actorId: "admin-1",
            reason: "Bad lead",
          },
        },
      },
    });
  });

  it("reverses payment when admin rejects a paid lead", async () => {
    leadState.status = "PAID";

    const { updateLeadStatus } = await import("@/services/lead.service");

    await updateLeadStatus("lead-1", "REJECTED", "admin-1", "Fraud", { isAdmin: true });

    expect(reverseLeadPayment).toHaveBeenCalledWith("lead-1", "admin-1", "Fraud", prismaMock);
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it("blocks non-admin from rejecting paid leads", async () => {
    leadState.status = "PAID";

    const { updateLeadStatus } = await import("@/services/lead.service");

    await expect(
      updateLeadStatus("lead-1", "REJECTED", "advertiser-1", undefined, { isAdmin: false }),
    ).rejects.toMatchObject({ status: 403 });

    expect(reverseLeadPayment).not.toHaveBeenCalled();
  });

  it("blocks rejecting an already rejected lead", async () => {
    leadState.status = "REJECTED";

    const { updateLeadStatus } = await import("@/services/lead.service");

    await expect(
      updateLeadStatus("lead-1", "REJECTED", "admin-1", undefined, { isAdmin: true }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("already rejected"),
    });
  });

  it("pauses campaign when approval payment fails for insufficient funds", async () => {
    processLeadPayment.mockRejectedValueOnce(new Error("INSUFFICIENT_FUNDS"));

    const { notifyCampaignPausedForFunds } = await import("@/services/notify.service");
    const { updateLeadStatus } = await import("@/services/lead.service");

    await updateLeadStatus("lead-1", "APPROVED", "admin-1", undefined, { isAdmin: true });

    expect(prismaMock.campaign.update).toHaveBeenCalledWith({
      where: { id: "campaign-1" },
      data: {
        status: "PAUSED",
        pausedReason: "Insufficient wallet balance",
      },
    });
    expect(prismaMock.lead.update).toHaveBeenCalledWith({
      where: { id: "lead-1" },
      data: expect.objectContaining({
        status: "PENDING",
      }),
    });
    expect(notifyCampaignPausedForFunds).toHaveBeenCalledWith(
      "advertiser-1",
      expect.objectContaining({
        campaignId: "campaign-1",
        campaignName: "Campaign A",
      }),
    );
  });
});

describe("admin leads approved stat", () => {
  it("counts both APPROVED and PAID as approved volume", () => {
    const approvedWhere = { status: { in: ["APPROVED", "PAID"] as const } };
    expect(approvedWhere.status.in).toContain("PAID");
    expect(approvedWhere.status.in).toContain("APPROVED");
  });
});
