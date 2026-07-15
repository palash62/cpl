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

const getWalletBalance = vi.fn();

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/services/wallet.service", () => ({
  getWalletBalance: (...args: unknown[]) => getWalletBalance(...args),
}));
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

describe("assertCampaignBudgetWithinWallet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects missing or non-positive budget", async () => {
    const { assertCampaignBudgetWithinWallet } = await import("@/services/campaign.service");
    await expect(assertCampaignBudgetWithinWallet("adv-1", 0)).rejects.toBeInstanceOf(AppError);
  });

  it("rejects budget over available wallet balance", async () => {
    getWalletBalance.mockResolvedValue({
      balance: 100,
      holdBalance: 20,
      availableBalance: 80,
      currency: "USD",
    });
    const { assertCampaignBudgetWithinWallet } = await import("@/services/campaign.service");

    await expect(assertCampaignBudgetWithinWallet("adv-1", 90)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: expect.stringMatching(/available wallet balance of \$80\.00/i),
    });
  });

  it("uses available balance after holds", async () => {
    getWalletBalance.mockResolvedValue({
      balance: 100,
      holdBalance: 40,
      availableBalance: 60,
      currency: "USD",
    });
    const { assertCampaignBudgetWithinWallet } = await import("@/services/campaign.service");

    await expect(assertCampaignBudgetWithinWallet("adv-1", 60)).resolves.toBe(60);
  });

  it("rejects budget below spent amount", async () => {
    getWalletBalance.mockResolvedValue({
      balance: 200,
      holdBalance: 0,
      availableBalance: 200,
      currency: "USD",
    });
    const { assertCampaignBudgetWithinWallet } = await import("@/services/campaign.service");

    await expect(
      assertCampaignBudgetWithinWallet("adv-1", 40, { spent: 50 }),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: expect.stringMatching(/already spent/i),
    });
  });
});

describe("createCampaign budget enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getWalletBalance.mockResolvedValue({
      balance: 100,
      holdBalance: 0,
      availableBalance: 100,
      currency: "USD",
    });
    prismaMock.campaign.create.mockResolvedValue({ id: "camp-1" });
  });

  it("requires a finite budget and does not fall back to unlimited", async () => {
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

  it("blocks create when budget exceeds available balance", async () => {
    getWalletBalance.mockResolvedValue({
      balance: 30,
      holdBalance: 0,
      availableBalance: 30,
      currency: "USD",
    });
    const { createCampaign } = await import("@/services/campaign.service");

    await expect(
      createCampaign({
        advertiserId: "adv-1",
        name: "Over Budget",
        category: "GENERIC",
        cpl: 1,
        budget: 50,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(prismaMock.campaign.create).not.toHaveBeenCalled();
  });
});

describe("updateCampaignByAdmin budget enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getWalletBalance.mockResolvedValue({
      balance: 100,
      holdBalance: 10,
      availableBalance: 90,
      currency: "USD",
    });
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

  it("checks wallet only when budget is supplied", async () => {
    const { updateCampaignByAdmin } = await import("@/services/campaign.service");

    await updateCampaignByAdmin("camp-1", { name: "Renamed" }, "admin-1", {
      actorRole: "ADMIN",
    });

    expect(getWalletBalance).not.toHaveBeenCalled();
    expect(prismaMock.campaign.update).toHaveBeenCalled();
  });

  it("rejects budget exceeding available balance on update", async () => {
    const { updateCampaignByAdmin } = await import("@/services/campaign.service");

    await expect(
      updateCampaignByAdmin("camp-1", { budget: 120 }, "admin-1", { actorRole: "ADMIN" }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});
