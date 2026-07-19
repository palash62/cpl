import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const prismaMock = {
  campaign: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/campaign-pixel.server", () => ({
  createPixelToken: vi.fn(() => "pixel-token"),
}));
vi.mock("@/services/notify.service", () => ({
  notifyAdminAlert: vi.fn(),
  notifyApproved: vi.fn(),
  notifyGeneric: vi.fn(),
}));
vi.mock("@/services/optin-page.service", () => ({
  linkOptinPageToCampaign: vi.fn(),
  resolveOptinPageDestination: vi.fn(),
}));

describe("assertValidCampaignBudget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects zero or negative budget", async () => {
    const { assertValidCampaignBudget } = await import("@/services/campaign.service");
    expect(() => assertValidCampaignBudget(0)).toThrow(AppError);
    expect(() => assertValidCampaignBudget(-5)).toThrow(AppError);
  });

  it("allows null for unlimited budget", async () => {
    const { assertValidCampaignBudget } = await import("@/services/campaign.service");
    expect(assertValidCampaignBudget(null)).toBeNull();
  });

  it("allows any positive budget", async () => {
    const { assertValidCampaignBudget } = await import("@/services/campaign.service");
    expect(assertValidCampaignBudget(500)).toBe(500);
    expect(assertValidCampaignBudget(40)).toBe(40);
  });
});

describe("createCampaign budget enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.campaign.create.mockResolvedValue({ id: "camp-1" });
  });

  it("stores a finite budget when provided", async () => {
    const { createCampaign } = await import("@/services/campaign.service");

    await createCampaign({
      advertiserId: "adv-1",
      name: "Test Campaign",
      category: "GENERIC",
      cpl: 1,
      budget: 50,
    });

    expect(prismaMock.campaign.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ budget: 50 }),
      }),
    );
  });

  it("stores null budget for unlimited campaigns", async () => {
    const { createCampaign } = await import("@/services/campaign.service");

    await createCampaign({
      advertiserId: "adv-1",
      name: "Unlimited Campaign",
      category: "GENERIC",
      cpl: 1,
      budget: null,
    });

    expect(prismaMock.campaign.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ budget: null }),
      }),
    );
  });
});

describe("updateCampaignByAdmin budget enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.campaign.findUnique.mockResolvedValue({
      id: "camp-1",
      advertiserId: "adv-1",
      name: "Existing",
      status: "DRAFT",
      spent: 20,
      budget: 50,
      targeting: {},
      _count: { leads: 0 },
    });
    prismaMock.campaign.update.mockResolvedValue({
      id: "camp-1",
      name: "Existing",
      status: "DRAFT",
      advertiser: { id: "adv-1", email: "a@example.com", name: "Adv" },
    });
    prismaMock.auditLog.create.mockResolvedValue({ id: "audit-1" });
  });

  it("updates non-budget fields without budget validation", async () => {
    const { updateCampaignByAdmin } = await import("@/services/campaign.service");

    await updateCampaignByAdmin("camp-1", { name: "Renamed" }, "admin-1", {
      actorRole: "ADMIN",
    });

    expect(prismaMock.campaign.update).toHaveBeenCalled();
  });

  it("allows clearing budget to unlimited on update", async () => {
    const { updateCampaignByAdmin } = await import("@/services/campaign.service");

    await updateCampaignByAdmin("camp-1", { budget: null }, "admin-1", { actorRole: "ADMIN" });

    expect(prismaMock.campaign.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ budget: null }),
      }),
    );
  });

  it("allows budget below spent amount on update", async () => {
    const { updateCampaignByAdmin } = await import("@/services/campaign.service");

    await updateCampaignByAdmin("camp-1", { budget: 10 }, "admin-1", { actorRole: "ADMIN" });

    expect(prismaMock.campaign.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ budget: 10 }),
      }),
    );
  });
});
