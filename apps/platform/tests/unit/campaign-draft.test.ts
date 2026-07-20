import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  user: {
    findFirst: vi.fn(),
  },
  campaign: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
  campaignField: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
};

const notifyAdminAlert = vi.fn();
const notifyGeneric = vi.fn();
const createCampaign = vi.fn();
const resolveOptinPageDestination = vi.fn();
const linkOptinPageToCampaign = vi.fn();

const authSession = {
  user: {
    id: "adv-1",
    name: "Advertiser One",
    role: "ADVERTISER" as const,
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/api-handler", () => ({
  withAuth: (handler: (session: typeof authSession) => unknown) => handler(authSession),
  parsePagination: vi.fn(),
}));
vi.mock("@/services/notify.service", () => ({
  notifyAdminAlert,
  notifyApproved: vi.fn(),
  notifyGeneric,
}));
vi.mock("@/services/campaign.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/campaign.service")>();
  return {
    ...actual,
    createCampaign,
    listCampaigns: vi.fn(),
  };
});
vi.mock("@/services/optin-page.service", () => ({
  resolveOptinPageDestination,
  linkOptinPageToCampaign,
}));
vi.mock("@/lib/campaign-pixel.server", () => ({
  createPixelToken: vi.fn(() => "pixel-token"),
}));

const validAdvertiserBody = {
  name: "Draft Campaign",
  optinPageId: "page-1",
  category: "GENERIC" as const,
  cpl: 1.5,
  targeting: { vertical: "finance" },
};

describe("POST /api/v1/campaigns advertiser draft", () => {
  let POST: typeof import("@/app/api/v1/campaigns/route").POST;

  beforeAll(async () => {
    ({ POST } = await import("@/app/api/v1/campaigns/route"));
  }, 30000);

  beforeEach(() => {
    vi.clearAllMocks();
    authSession.user = {
      id: "adv-1",
      name: "Advertiser One",
      role: "ADVERTISER",
    };
    resolveOptinPageDestination.mockResolvedValue({
      page: { id: "page-1", title: "Landing", slug: "landing" },
      destinationUrl: "https://example.com/landing",
    });
    linkOptinPageToCampaign.mockResolvedValue(undefined);
    createCampaign.mockResolvedValue({
      id: "camp-draft-1",
      name: "Draft Campaign",
      status: "DRAFT",
      pixelToken: "pixel-token",
    });
  });

  it("creates a draft campaign without notifying admin", async () => {
    const response = await POST(
      new Request("http://localhost/api/v1/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validAdvertiserBody, status: "DRAFT" }),
      }),
    );

    expect(response.status).toBe(201);
    expect(createCampaign).toHaveBeenCalledWith(
      expect.objectContaining({ status: "DRAFT" }),
    );
    expect(notifyAdminAlert).not.toHaveBeenCalled();
  });

  it("creates a pending campaign and notifies admin on submit", async () => {
    createCampaign.mockResolvedValue({
      id: "camp-pending-1",
      name: "Draft Campaign",
      status: "PENDING",
      pixelToken: "pixel-token",
    });

    const response = await POST(
      new Request("http://localhost/api/v1/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validAdvertiserBody),
      }),
    );

    expect(response.status).toBe(201);
    expect(createCampaign).toHaveBeenCalledWith(
      expect.objectContaining({ status: "PENDING" }),
    );
    expect(notifyAdminAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Campaign pending review",
        metadata: expect.objectContaining({ campaignId: "camp-pending-1" }),
      }),
    );
  });

  it("rejects advertiser attempts to create as active", async () => {
    const response = await POST(
      new Request("http://localhost/api/v1/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validAdvertiserBody, status: "ACTIVE" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(createCampaign).not.toHaveBeenCalled();
    expect(notifyAdminAlert).not.toHaveBeenCalled();
  });
});

describe("updateCampaignByAdmin draft submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.campaign.findUnique.mockResolvedValue({
      id: "camp-1",
      advertiserId: "adv-1",
      name: "Draft Campaign",
      status: "DRAFT",
      targeting: {},
      _count: { leads: 0 },
    });
    prismaMock.campaign.update.mockResolvedValue({
      id: "camp-1",
      name: "Draft Campaign",
      status: "PENDING",
      advertiser: { id: "adv-1", email: "adv@example.com", name: "Advertiser One" },
    });
    prismaMock.auditLog.create.mockResolvedValue({ id: "audit-1" });
  });

  it("notifies admin when an advertiser submits a draft for review", async () => {
    const { updateCampaignByAdmin } = await import("@/services/campaign.service");

    await updateCampaignByAdmin(
      "camp-1",
      { status: "PENDING" },
      "adv-1",
      { actorRole: "ADVERTISER" },
    );

    expect(notifyAdminAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Campaign pending review",
        message: expect.stringContaining("Draft Campaign"),
      }),
    );
  });

  it("does not notify admin when an admin changes draft status", async () => {
    const { updateCampaignByAdmin } = await import("@/services/campaign.service");

    await updateCampaignByAdmin(
      "camp-1",
      { status: "PENDING" },
      "admin-1",
      { actorRole: "ADMIN" },
    );

    expect(notifyAdminAlert).not.toHaveBeenCalled();
  });
});
