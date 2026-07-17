import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  stripeCustomersCreate,
  stripeCustomersRetrieve,
  stripePaymentIntentsCreate,
  userProfile,
  prismaMock,
} = vi.hoisted(() => {
  const userProfile = {
    id: "user-1",
    email: "advertiser@test.com",
    name: "Test Advertiser",
    stripeCustomerId: null as string | null,
  };

  const stripeCustomersCreate = vi.fn();
  const stripeCustomersRetrieve = vi.fn();
  const stripePaymentIntentsCreate = vi.fn();

  const prismaMock = {
    user: {
      findUniqueOrThrow: vi.fn(async () => ({ ...userProfile })),
      update: vi.fn(),
    },
    deposit: {
      create: vi.fn(async () => ({
        id: "deposit-1",
        userId: "user-1",
        amount: 50,
        method: "CREDIT_CARD",
        status: "PENDING",
      })),
      update: vi.fn(),
    },
  };

  return {
    stripeCustomersCreate,
    stripeCustomersRetrieve,
    stripePaymentIntentsCreate,
    userProfile,
    prismaMock,
  };
});

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/services/stripe-settings.service", () => ({
  getResolvedStripeConfig: vi.fn().mockResolvedValue({
    enabled: true,
    secretKey: "sk_test_123",
    publishableKey: "pk_test_123",
  }),
}));
vi.mock("stripe", () => ({
  default: class MockStripe {
    customers = {
      create: stripeCustomersCreate,
      retrieve: stripeCustomersRetrieve,
    };
    paymentIntents = {
      create: stripePaymentIntentsCreate,
    };
    constructor(_key: string) {}
  },
}));
vi.mock("@/services/wallet.service", () => ({
  creditWallet: vi.fn(),
  getWalletBalance: vi.fn(),
}));
vi.mock("@/services/notify.service", () => ({
  notifyGeneric: vi.fn(),
}));

describe("createCardPaymentIntent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userProfile.stripeCustomerId = null;
    stripeCustomersCreate.mockResolvedValue({ id: "cus_new123" });
    stripeCustomersRetrieve.mockResolvedValue({ id: "cus_existing" });
    stripePaymentIntentsCreate.mockResolvedValue({
      id: "pi_123",
      client_secret: "pi_secret_123",
    });
    prismaMock.user.findUniqueOrThrow.mockImplementation(async () => ({ ...userProfile }));
  });

  it("creates a Stripe customer and attaches customer details to the PaymentIntent", async () => {
    const { createCardPaymentIntent } = await import("@/services/stripe-payment.service");

    const result = await createCardPaymentIntent("user-1", 50);

    expect(stripeCustomersCreate).toHaveBeenCalledWith({
      email: "advertiser@test.com",
      name: "Test Advertiser",
      metadata: { userId: "user-1" },
    });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { stripeCustomerId: "cus_new123" },
    });
    expect(stripePaymentIntentsCreate).toHaveBeenCalledWith({
      amount: 5000,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      customer: "cus_new123",
      receipt_email: "advertiser@test.com",
      metadata: {
        depositId: "deposit-1",
        userId: "user-1",
        userEmail: "advertiser@test.com",
        userName: "Test Advertiser",
      },
    });
    expect(result.clientSecret).toBe("pi_secret_123");
  });

  it("reuses an existing Stripe customer when already stored", async () => {
    userProfile.stripeCustomerId = "cus_existing";

    const { createCardPaymentIntent } = await import("@/services/stripe-payment.service");

    await createCardPaymentIntent("user-1", 25);

    expect(stripeCustomersRetrieve).toHaveBeenCalledWith("cus_existing");
    expect(stripeCustomersCreate).not.toHaveBeenCalled();
    expect(stripePaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_existing",
        receipt_email: "advertiser@test.com",
      }),
    );
  });

  it("still creates the PaymentIntent when Stripe customer resolution fails", async () => {
    stripeCustomersCreate.mockRejectedValueOnce(new Error("Stripe customer API down"));

    const { createCardPaymentIntent } = await import("@/services/stripe-payment.service");

    const result = await createCardPaymentIntent("user-1", 10);

    expect(stripePaymentIntentsCreate).toHaveBeenCalledWith({
      amount: 1000,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        depositId: "deposit-1",
        userId: "user-1",
        userEmail: "advertiser@test.com",
        userName: "Test Advertiser",
      },
    });
    expect(result.clientSecret).toBe("pi_secret_123");
  });
});

describe("resolveStripeCustomerId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stripeCustomersCreate.mockResolvedValue({ id: "cus_recreated" });
  });

  it("recreates the customer when the stored Stripe customer id is invalid", async () => {
    stripeCustomersRetrieve.mockRejectedValueOnce(new Error("No such customer"));

    const { resolveStripeCustomerId } = await import("@/services/stripe-payment.service");

    const customerId = await resolveStripeCustomerId(
      {
        customers: {
          create: stripeCustomersCreate,
          retrieve: stripeCustomersRetrieve,
        },
      } as never,
      {
        id: "user-1",
        email: "advertiser@test.com",
        name: "Test Advertiser",
        stripeCustomerId: "cus_stale",
      },
    );

    expect(customerId).toBe("cus_recreated");
    expect(stripeCustomersCreate).toHaveBeenCalled();
  });
});
