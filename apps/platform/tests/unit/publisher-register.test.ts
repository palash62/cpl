import { beforeEach, describe, expect, it, vi } from "vitest";
import { publisherRegisterSchema } from "@/lib/validations";

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("publisherRegisterSchema", () => {
  it("accepts valid publisher signup data", () => {
    const result = publisherRegisterSchema.safeParse({
      name: "Jane Publisher",
      email: "pub@example.com",
      password: "password123",
      website: "https://example.com",
      trafficSource: "Facebook",
      country: "US",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid website URL", () => {
    const result = publisherRegisterSchema.safeParse({
      name: "Jane Publisher",
      email: "pub@example.com",
      password: "password123",
      website: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("does not include referralRef field", () => {
    const result = publisherRegisterSchema.safeParse({
      name: "Jane Publisher",
      email: "pub@example.com",
      password: "password123",
      referralRef: "ABC123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect("referralRef" in result.data).toBe(false);
    }
  });
});

describe("POST /api/v1/auth/register/publisher", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock("@/lib/prisma", () => ({ prisma: prismaMock }));
    vi.doMock("bcryptjs", () => ({
      default: { hash: vi.fn().mockResolvedValue("hashed") },
    }));
    vi.doMock("@/lib/email-deliverability", () => ({
      validateEmailDeliverability: vi.fn().mockResolvedValue({ ok: true }),
    }));
    vi.doMock("@/services/auth-token.service", () => ({
      createEmailVerificationToken: vi.fn().mockResolvedValue("test-verify-token"),
    }));
    vi.doMock("@/services/smtp-settings.service", () => ({
      getResolvedEmailConfig: vi.fn().mockResolvedValue({ appUrl: "http://localhost:3010" }),
    }));
    vi.doMock("@/services/notify.service", () => ({
      notifyWelcome: vi.fn().mockResolvedValue({ sent: false, skipped: true }),
      notifyEmailVerification: vi.fn().mockResolvedValue({ sent: false, skipped: true }),
      notifyAdminAlert: vi.fn().mockResolvedValue(undefined),
    }));

    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "pub-1",
      email: "pub@example.com",
      name: "Jane Publisher",
      role: "PUBLISHER",
      status: "PENDING",
    });
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => unknown) =>
      callback(prismaMock),
    );
  });

  it("creates PUBLISHER account and returns emailDelivery", async () => {
    const { POST } = await import("@/app/api/v1/auth/register/publisher/route");

    const response = await POST(
      new Request("http://localhost/api/v1/auth/register/publisher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Jane Publisher",
          email: "pub@example.com",
          password: "password123",
          website: "https://example.com",
        }),
      }),
    );

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user).toEqual({
      id: "pub-1",
      email: "pub@example.com",
      role: "PUBLISHER",
      status: "PENDING",
    });
    expect(data.emailDelivery).toEqual({
      verificationSent: false,
      welcomeSent: false,
      skipped: true,
    });
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: "PUBLISHER",
          status: "PENDING",
          publisherProfile: expect.objectContaining({
            create: expect.objectContaining({
              website: "https://example.com",
            }),
          }),
        }),
      }),
    );
  });
});

describe("registerPublisherAccount", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock("@/lib/prisma", () => ({ prisma: prismaMock }));
    vi.doMock("bcryptjs", () => ({
      default: { hash: vi.fn().mockResolvedValue("hashed") },
    }));
    vi.doMock("@/lib/email-deliverability", () => ({
      validateEmailDeliverability: vi.fn().mockResolvedValue({ ok: true }),
    }));
    vi.doMock("@/services/auth-token.service", () => ({
      createEmailVerificationToken: vi.fn().mockResolvedValue("token"),
    }));
    vi.doMock("@/services/smtp-settings.service", () => ({
      getResolvedEmailConfig: vi.fn().mockResolvedValue({ appUrl: "http://localhost:3010" }),
    }));
    vi.doMock("@/services/notify.service", () => ({
      notifyWelcome: vi.fn().mockResolvedValue({ sent: true }),
      notifyEmailVerification: vi.fn().mockResolvedValue({ sent: true }),
      notifyAdminAlert: vi.fn().mockResolvedValue(undefined),
    }));

    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "pub-2",
      email: "newpub@example.com",
      name: "New Pub",
      role: "PUBLISHER",
      status: "PENDING",
    });
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => unknown) =>
      callback(prismaMock),
    );
  });

  it("notifies admin on signup", async () => {
    const { registerPublisherAccount } = await import("@/services/auth.service");
    const { notifyAdminAlert } = await import("@/services/notify.service");

    await registerPublisherAccount({
      name: "New Pub",
      email: "newpub@example.com",
      password: "password123",
    });

    expect(notifyAdminAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New publisher application",
        actionPath: "/admin/publishers",
      }),
    );
  });
});
