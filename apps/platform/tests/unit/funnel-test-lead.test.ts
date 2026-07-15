import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatAdvertiserLeadCpl } from "@/lib/advertiser-lead-details";

const prismaMock = {
  campaign: {
    findFirst: vi.fn(),
  },
  advertiserOptinPage: {
    findFirst: vi.fn(),
  },
  lead: {
    create: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
};

const authSession = {
  user: { id: "adv-1", role: "ADVERTISER" as "ADVERTISER" | "ADMIN" },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

vi.mock("@/services/wallet.service", () => ({
  getPlatformSettings: vi.fn(),
  processLeadPayment: vi.fn(),
}));

vi.mock("@/services/notify.service", () => ({
  notifyGeneric: vi.fn(),
  notifyRejected: vi.fn(),
}));

vi.mock("@/modules/fraud", () => ({
  evaluateLead: vi.fn(),
  getFraudConfig: vi.fn(),
  recordDeviceSeen: vi.fn(),
  refreshPublisherQuality: vi.fn(),
  checkCampaignQualityAlert: vi.fn(),
}));

vi.mock("@/modules/autoresponder", () => ({
  dispatchAutoresponderEvent: vi.fn(),
}));

vi.mock("@/modules/email-marketing", () => ({
  dispatchLeadEmailAutomations: vi.fn(),
}));

vi.mock("@/lib/api-handler", () => ({
  withAuth: (handler: (session: typeof authSession) => unknown) => handler(authSession),
}));

vi.mock("@/services/campaign.service", () => ({
  getCampaignById: vi.fn(),
}));

describe("formatAdvertiserLeadCpl", () => {
  it("returns Test for test leads regardless of status", () => {
    expect(formatAdvertiserLeadCpl("PAID", 5, true)).toBe("Test");
    expect(formatAdvertiserLeadCpl("CAPTURED", 5, true)).toBe("Test");
  });

  it("formats currency for paid production leads", () => {
    expect(formatAdvertiserLeadCpl("PAID", 1.5, false)).toBe("$1.50");
  });
});

describe("submitTestCampaignLead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authSession.user = { id: "adv-1", role: "ADVERTISER" };
  });

  it("creates an unpaid test lead and dispatches LEAD_CAPTURED", async () => {
    const { processLeadPayment } = await import("@/services/wallet.service");
    const { dispatchAutoresponderEvent } = await import("@/modules/autoresponder");
    const { submitAdvertiserTestCampaignLead } = await import("@/services/lead.service");

    prismaMock.campaign.findFirst.mockResolvedValue({
      id: "camp-1",
      advertiserId: "adv-1",
      targeting: { optinPageId: "funnel-1" },
      fields: [],
    });

    prismaMock.advertiserOptinPage.findFirst.mockResolvedValue({
      id: "funnel-1",
      slug: "test-funnel",
      advertiserId: "adv-1",
      campaignId: "camp-1",
      formJson: {
        formId: "form-1",
        campaignId: "camp-1",
        fields: [
          { id: "1", type: "email", name: "email", label: "Email", required: true },
          { id: "2", type: "text", name: "first_name", label: "First name", required: true },
        ],
      },
      publishedVersion: null,
    });

    prismaMock.lead.create.mockResolvedValue({
      id: "lead-test-1",
      status: "CAPTURED",
      isTest: true,
      source: "campaign_test",
    });

    const lead = await submitAdvertiserTestCampaignLead({
      campaignId: "camp-1",
      advertiserId: "adv-1",
      data: { email: "test@example.com", first_name: "Ada" },
    });

    expect(lead.isTest).toBe(true);
    expect(prismaMock.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isTest: true,
          campaignId: "camp-1",
          publisherId: "adv-1",
          source: "campaign_test",
          status: "CAPTURED",
          statusHistory: {
            create: expect.objectContaining({
              actorId: "adv-1",
              reason: "Advertiser campaign test lead",
            }),
          },
        }),
      }),
    );
    expect(processLeadPayment).not.toHaveBeenCalled();
    expect(dispatchAutoresponderEvent).toHaveBeenCalledWith({
      leadId: "lead-test-1",
      event: "LEAD_CAPTURED",
    });
  }, 15_000);

  it("lets an admin create a test lead attributed to the campaign advertiser", async () => {
    const { submitTestCampaignLead } = await import("@/services/lead.service");

    prismaMock.campaign.findFirst.mockResolvedValue({
      id: "camp-1",
      advertiserId: "adv-1",
      targeting: {},
      fields: [],
    });
    prismaMock.advertiserOptinPage.findFirst.mockResolvedValue({
      id: "funnel-1",
      slug: "test-funnel",
      advertiserId: "adv-1",
      campaignId: "camp-1",
      formJson: {
        formId: "form-1",
        campaignId: "camp-1",
        fields: [{ id: "1", type: "email", name: "email", label: "Email", required: true }],
      },
      publishedVersion: null,
    });
    prismaMock.lead.create.mockResolvedValue({
      id: "lead-admin-1",
      status: "CAPTURED",
      isTest: true,
    });

    await submitTestCampaignLead({
      campaignId: "camp-1",
      advertiserId: "adv-1",
      actorId: "admin-1",
      actorReason: "Admin campaign test lead",
      data: { email: "admin-test@example.com" },
    });

    expect(prismaMock.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publisherId: "adv-1",
          isTest: true,
          statusHistory: {
            create: expect.objectContaining({
              actorId: "admin-1",
              reason: "Admin campaign test lead",
            }),
          },
        }),
      }),
    );
  });

  it("rejects when the campaign has no attached funnel", async () => {
    const { submitAdvertiserTestCampaignLead } = await import("@/services/lead.service");

    prismaMock.campaign.findFirst.mockResolvedValue({
      id: "camp-1",
      advertiserId: "adv-1",
      targeting: {},
      fields: [],
    });
    prismaMock.advertiserOptinPage.findFirst.mockResolvedValue(null);

    await expect(
      submitAdvertiserTestCampaignLead({
        campaignId: "camp-1",
        advertiserId: "adv-1",
        data: { email: "test@example.com" },
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("Attach a funnel"),
    });
  });

  it("rejects when advertiserId does not match the campaign owner", async () => {
    const { submitTestCampaignLead } = await import("@/services/lead.service");

    prismaMock.campaign.findFirst.mockResolvedValue({
      id: "camp-1",
      advertiserId: "adv-2",
      targeting: {},
      fields: [],
    });
    prismaMock.advertiserOptinPage.findFirst.mockResolvedValue({
      id: "funnel-1",
      formJson: {
        fields: [{ id: "1", type: "email", name: "email", label: "Email", required: true }],
      },
      publishedVersion: null,
    });

    await expect(
      submitTestCampaignLead({
        campaignId: "camp-1",
        advertiserId: "adv-1",
        actorId: "adv-1",
        data: { email: "test@example.com" },
      }),
    ).rejects.toMatchObject({
      message: expect.stringMatching(/permission|forbidden|Campaign/i),
    });
    expect(prismaMock.lead.create).not.toHaveBeenCalled();
  });
});

describe("campaign test-lead API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authSession.user = { id: "adv-1", role: "ADVERTISER" };
  });

  it("returns forbidden when the campaign belongs to another advertiser", async () => {
    const { getCampaignById } = await import("@/services/campaign.service");
    const { POST } = await import("@/app/api/v1/campaigns/[id]/test-leads/route");
    vi.mocked(getCampaignById).mockResolvedValue({
      id: "camp-1",
      advertiserId: "adv-2",
    } as Awaited<ReturnType<typeof getCampaignById>>);

    const response = await POST(
      new Request("http://localhost/api/v1/campaigns/camp-1/test-leads", {
        method: "POST",
        body: JSON.stringify({ data: { email: "test@example.com" } }),
      }),
      { params: Promise.resolve({ id: "camp-1" }) },
    );

    expect(response.status).toBe(403);
    expect(prismaMock.lead.create).not.toHaveBeenCalled();
  });

  it("lets an admin submit a test lead for any campaign", async () => {
    authSession.user = { id: "admin-1", role: "ADMIN" };
    const { getCampaignById } = await import("@/services/campaign.service");
    const { POST } = await import("@/app/api/v1/campaigns/[id]/test-leads/route");

    vi.mocked(getCampaignById).mockResolvedValue({
      id: "camp-1",
      advertiserId: "adv-1",
    } as Awaited<ReturnType<typeof getCampaignById>>);

    prismaMock.campaign.findFirst.mockResolvedValue({
      id: "camp-1",
      advertiserId: "adv-1",
      targeting: {},
      fields: [],
    });
    prismaMock.advertiserOptinPage.findFirst.mockResolvedValue({
      id: "funnel-1",
      formJson: {
        fields: [{ id: "1", type: "email", name: "email", label: "Email", required: true }],
      },
      publishedVersion: null,
    });
    prismaMock.lead.create.mockResolvedValue({
      id: "lead-admin-api-1",
      status: "CAPTURED",
      isTest: true,
    });

    const response = await POST(
      new Request("http://localhost/api/v1/campaigns/camp-1/test-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { email: "admin@example.com" } }),
      }),
      { params: Promise.resolve({ id: "camp-1" }) },
    );

    expect(response.status).toBe(201);
    expect(prismaMock.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publisherId: "adv-1",
          isTest: true,
          statusHistory: {
            create: expect.objectContaining({
              actorId: "admin-1",
              reason: "Admin campaign test lead",
            }),
          },
        }),
      }),
    );
  });
});

describe("updateLeadStatus test guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects approving a test lead", async () => {
    const { updateLeadStatus } = await import("@/services/lead.service");

    prismaMock.lead.findUniqueOrThrow.mockResolvedValue({
      id: "lead-test-1",
      status: "PENDING",
      isTest: true,
      publisherId: "adv-1",
      campaignId: "camp-1",
      campaign: { advertiserId: "adv-1" },
    });

    await expect(updateLeadStatus("lead-test-1", "APPROVED", "adv-1")).rejects.toMatchObject({
      message: expect.stringContaining("Test leads"),
    });
    expect(prismaMock.lead.update).not.toHaveBeenCalled();
  });
});
