import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  campaign: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

vi.mock("@/services/notify.service", () => ({
  notifyAccountActivated: vi.fn(),
  notifyAccountSuspended: vi.fn(),
  notifyAdminAlert: vi.fn(),
  notifyApproved: vi.fn(),
  notifyCampaignApproved: vi.fn(),
  notifyCampaignRejected: vi.fn(),
  notifyEmailVerification: vi.fn(),
  notifyAdvertiserCredentials: vi.fn(),
  notifyPublisherCredentials: vi.fn(),
  notifyRejected: vi.fn(),
  notifyUserById: vi.fn(),
}));

vi.mock("@/services/auth-token.service", () => ({
  createEmailVerificationToken: vi.fn(),
}));

vi.mock("@/lib/email-deliverability", () => ({
  validateEmailDeliverability: vi.fn(),
}));

describe("campaign decision emails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("approves a pending campaign and notifies the advertiser", async () => {
    const { notifyCampaignApproved, notifyCampaignRejected } = await import(
      "@/services/notify.service"
    );
    const { approveCampaign } = await import("@/services/admin.service");

    prismaMock.campaign.findUnique.mockResolvedValue({ status: "PENDING" });
    prismaMock.campaign.update.mockResolvedValue({
      id: "camp-1",
      name: "Finance Leads",
      status: "ACTIVE",
      advertiser: { id: "adv-1", email: "adv@example.com", name: "Ada Adv" },
    });
    prismaMock.auditLog.create.mockResolvedValue({});

    const campaign = await approveCampaign("camp-1", "admin-1");

    expect(campaign.status).toBe("ACTIVE");
    expect(notifyCampaignApproved).toHaveBeenCalledWith(
      { id: "adv-1", email: "adv@example.com", name: "Ada Adv" },
      { campaignId: "camp-1", campaignName: "Finance Leads" },
    );
    expect(notifyCampaignRejected).not.toHaveBeenCalled();
  });

  it("rejects a pending campaign and notifies the advertiser with the reason", async () => {
    const { notifyCampaignApproved, notifyCampaignRejected } = await import(
      "@/services/notify.service"
    );
    const { rejectCampaign } = await import("@/services/admin.service");

    prismaMock.campaign.findUnique.mockResolvedValue({ status: "PENDING" });
    prismaMock.campaign.update.mockResolvedValue({
      id: "camp-1",
      name: "Finance Leads",
      status: "ARCHIVED",
      advertiser: { id: "adv-1", email: "adv@example.com", name: "Ada Adv" },
    });
    prismaMock.auditLog.create.mockResolvedValue({});

    await rejectCampaign("camp-1", "admin-1", "Missing landing page details");

    expect(notifyCampaignRejected).toHaveBeenCalledWith(
      { id: "adv-1", email: "adv@example.com", name: "Ada Adv" },
      {
        campaignId: "camp-1",
        campaignName: "Finance Leads",
        reason: "Missing landing page details",
      },
    );
    expect(notifyCampaignApproved).not.toHaveBeenCalled();
  });

  it("does not email when rejecting a non-pending campaign", async () => {
    const { notifyCampaignRejected } = await import("@/services/notify.service");
    const { rejectCampaign } = await import("@/services/admin.service");

    prismaMock.campaign.findUnique.mockResolvedValue({ status: "ACTIVE" });

    await expect(rejectCampaign("camp-1", "admin-1", "Too late")).rejects.toMatchObject({
      code: "CAMPAIGN_INVALID_STATUS",
    });
    expect(prismaMock.campaign.update).not.toHaveBeenCalled();
    expect(notifyCampaignRejected).not.toHaveBeenCalled();
  });
});
