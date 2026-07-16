import { describe, expect, it, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  loginOtpToken: {
    updateMany: vi.fn(),
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { checkLoginOtp, consumeLoginOtp, createLoginOtp } from "@/services/auth-token.service";

describe("login otp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a hashed otp and invalidates previous tokens", async () => {
    prismaMock.loginOtpToken.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.loginOtpToken.create.mockResolvedValue({ id: "otp_1" });

    const result = await createLoginOtp("user_1");

    expect(result.code).toMatch(/^\d{6}$/);
    expect(result.expiresMinutes).toBe(10);
    expect(prismaMock.loginOtpToken.updateMany).toHaveBeenCalled();
    expect(prismaMock.loginOtpToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user_1",
          codeHash: expect.any(String),
        }),
      }),
    );
  });

  it("consumes a valid otp for advertiser accounts", async () => {
    const code = "123456";
    const codeHash = await bcrypt.hash(code, 10);

    prismaMock.user.findUnique.mockResolvedValue({
      id: "user_1",
      email: "advertiser@cpl.local",
      name: "Advertiser",
      role: "ADVERTISER",
      status: "ACTIVE",
      tokenVersion: 0,
      emailVerified: new Date(),
    });
    prismaMock.loginOtpToken.findFirst.mockResolvedValue({
      id: "otp_1",
      attempts: 0,
      codeHash,
    });
    prismaMock.loginOtpToken.update.mockResolvedValue({});

    const user = await consumeLoginOtp("advertiser@cpl.local", code);

    expect(user?.role).toBe("ADVERTISER");
    expect(prismaMock.loginOtpToken.update).toHaveBeenCalledWith({
      where: { id: "otp_1" },
      data: { usedAt: expect.any(Date) },
    });
  });

  it("checks otp without consuming it", async () => {
    const code = "654321";
    const codeHash = await bcrypt.hash(code, 10);

    prismaMock.user.findUnique.mockResolvedValue({
      id: "user_2",
      email: "publisher@cpl.local",
      name: "Publisher",
      role: "PUBLISHER",
      status: "ACTIVE",
      tokenVersion: 0,
      emailVerified: new Date(),
    });
    prismaMock.loginOtpToken.findFirst.mockResolvedValue({
      id: "otp_2",
      attempts: 0,
      codeHash,
    });

    const user = await checkLoginOtp("publisher@cpl.local", code);

    expect(user?.role).toBe("PUBLISHER");
    expect(prismaMock.loginOtpToken.update).not.toHaveBeenCalled();
  });

  it("consumes a valid otp for admin accounts", async () => {
    const code = "111222";
    const codeHash = await bcrypt.hash(code, 10);

    prismaMock.user.findUnique.mockResolvedValue({
      id: "admin_1",
      email: "admin@cpl.local",
      name: "Admin",
      role: "ADMIN",
      status: "ACTIVE",
      tokenVersion: 0,
      emailVerified: new Date(),
    });
    prismaMock.loginOtpToken.findFirst.mockResolvedValue({
      id: "otp_admin",
      attempts: 0,
      codeHash,
    });
    prismaMock.loginOtpToken.update.mockResolvedValue({});

    const user = await consumeLoginOtp("admin@cpl.local", code);

    expect(user?.role).toBe("ADMIN");
    expect(prismaMock.loginOtpToken.update).toHaveBeenCalledWith({
      where: { id: "otp_admin" },
      data: { usedAt: expect.any(Date) },
    });
  });
});
