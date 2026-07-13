import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  payout: {
    findFirst: vi.fn(),
  },
  impersonationToken: { deleteMany: vi.fn() },
  passwordResetToken: { deleteMany: vi.fn() },
  emailVerificationToken: { deleteMany: vi.fn() },
  notification: { deleteMany: vi.fn() },
  ticketMessage: { deleteMany: vi.fn() },
  supportTicket: { deleteMany: vi.fn() },
  auditLog: { create: vi.fn() },
  $transaction: vi.fn(async (callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock)),
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/email-deliverability", () => ({
  validateEmailDeliverability: vi.fn().mockResolvedValue({ ok: true }),
}));
vi.mock("@/services/auth-token.service", () => ({
  createEmailVerificationToken: vi.fn().mockResolvedValue("verify-token"),
}));
vi.mock("@/services/notify.service", () => ({
  notifyAdvertiserCredentials: vi.fn(),
  notifyEmailVerification: vi.fn(),
}));

describe("getUserDeleteEligibility", () => {
  it("blocks admin accounts", async () => {
    const { getUserDeleteEligibility } = await import("@/services/admin.service");
    const result = getUserDeleteEligibility(
      {
        id: "admin-1",
        role: "ADMIN",
        wallet: null,
        _count: {},
      },
      "admin-2",
    );
    expect(result.canDelete).toBe(false);
    expect(result.reason).toMatch(/admin/i);
  });

  it("blocks self-delete", async () => {
    const { getUserDeleteEligibility } = await import("@/services/admin.service");
    const result = getUserDeleteEligibility(
      {
        id: "admin-1",
        role: "ADVERTISER",
        wallet: { balance: 0, holdBalance: 0 },
        _count: {},
      },
      "admin-1",
    );
    expect(result.canDelete).toBe(false);
    expect(result.reason).toMatch(/own account/i);
  });

  it("blocks advertiser with campaigns", async () => {
    const { getUserDeleteEligibility } = await import("@/services/admin.service");
    const result = getUserDeleteEligibility(
      {
        id: "adv-1",
        role: "ADVERTISER",
        wallet: { balance: 0, holdBalance: 0 },
        _count: { campaigns: 2 },
      },
      "admin-1",
    );
    expect(result.canDelete).toBe(false);
    expect(result.reason).toMatch(/2 campaign/i);
  });

  it("blocks publisher with leads", async () => {
    const { getUserDeleteEligibility } = await import("@/services/admin.service");
    const result = getUserDeleteEligibility(
      {
        id: "pub-1",
        role: "PUBLISHER",
        wallet: { balance: 0, holdBalance: 0 },
        _count: { leads: 5 },
      },
      "admin-1",
    );
    expect(result.canDelete).toBe(false);
    expect(result.reason).toMatch(/5 lead/i);
  });

  it("allows empty advertiser account", async () => {
    const { getUserDeleteEligibility } = await import("@/services/admin.service");
    const result = getUserDeleteEligibility(
      {
        id: "adv-1",
        role: "ADVERTISER",
        wallet: { balance: 0, holdBalance: 0 },
        _count: { campaigns: 0, deposits: 0 },
      },
      "admin-1",
    );
    expect(result.canDelete).toBe(true);
  });
});

describe("createAdvertiserAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "adv-new",
      name: "Acme",
      email: "acme@example.com",
      role: "ADVERTISER",
      status: "ACTIVE",
      createdAt: new Date(),
      advertiserProfile: { company: "Acme Corp", industry: null },
    });
  });

  it("creates advertiser with wallet and profile", async () => {
    const { createAdvertiserAccount } = await import("@/services/admin.service");
    const result = await createAdvertiserAccount({
      name: "Acme",
      email: "acme@example.com",
      company: "Acme Corp",
    });

    expect(result.user.email).toBe("acme@example.com");
    expect(result.tempPassword).toHaveLength(12);
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: "ADVERTISER",
          advertiserProfile: { create: { company: "Acme Corp" } },
        }),
      }),
    );
  });

  it("rejects duplicate email", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "existing" });
    const { createAdvertiserAccount } = await import("@/services/admin.service");

    await expect(
      createAdvertiserAccount({
        name: "Acme",
        email: "acme@example.com",
        company: "Acme Corp",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});

describe("deleteManagedUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes eligible user", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "adv-1",
      role: "ADVERTISER",
      email: "test@example.com",
      name: "Test",
      wallet: { balance: 0, holdBalance: 0 },
      _count: { campaigns: 0, leads: 0, deposits: 0, payouts: 0 },
    });
    prismaMock.payout.findFirst.mockResolvedValue(null);
    prismaMock.user.delete.mockResolvedValue({ id: "adv-1" });

    const { deleteManagedUser } = await import("@/services/admin.service");
    const result = await deleteManagedUser("adv-1", "admin-1");

    expect(result.id).toBe("adv-1");
    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: "adv-1" } });
  });

  it("blocks delete when wallet has balance", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "adv-1",
      role: "ADVERTISER",
      email: "test@example.com",
      name: "Test",
      wallet: { balance: 10, holdBalance: 0 },
      _count: { campaigns: 0, leads: 0, deposits: 0, payouts: 0 },
    });

    const { deleteManagedUser } = await import("@/services/admin.service");

    await expect(deleteManagedUser("adv-1", "admin-1")).rejects.toMatchObject({
      code: "USER_DELETE_BLOCKED",
    });
  });
});
