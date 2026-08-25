import { describe, it, expect, vi, beforeEach } from "vitest";
import { REFERRAL_MIN_PAYOUT } from "@/lib/referral";

const mockPayoutFindUnique = vi.fn();
const mockUserFindUnique = vi.fn();
const mockHoldReferralFunds = vi.fn();
const mockPayoutCreate = vi.fn();
const mockTransaction = vi.fn();
const mockGetReferralBalanceSummary = vi.fn();

vi.mock("@/services/wallet.service", () => ({
  holdReferralFunds: (...args: unknown[]) => mockHoldReferralFunds(...args),
  holdWalletFunds: vi.fn(),
  debitWalletForPayout: vi.fn(),
  debitReferralForPayout: vi.fn(),
  releaseWalletHold: vi.fn(),
  releaseReferralHold: vi.fn(),
  getPlatformSettings: vi.fn(),
}));

vi.mock("@/services/referral.service", () => ({
  getReferralBalanceSummary: (...args: unknown[]) => mockGetReferralBalanceSummary(...args),
}));

vi.mock("@/services/notify.service", () => ({
  notifyAdminAlert: vi.fn(),
  notifyApproved: vi.fn(),
  notifyRejected: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    payout: {
      findUnique: (...args: unknown[]) => mockPayoutFindUnique(...args),
      create: (...args: unknown[]) => mockPayoutCreate(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

import { requestReferralPayout } from "@/services/payout.service";

describe("requestReferralPayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPayoutFindUnique.mockResolvedValue(null);
    mockUserFindUnique.mockResolvedValue({ role: "ADVERTISER" });
    mockGetReferralBalanceSummary.mockResolvedValue({
      withdrawableReferral: 100,
      availableBalance: 5,
    });
    mockTransaction.mockImplementation(async (fn: (tx: {
      payout: { create: typeof mockPayoutCreate };
    }) => Promise<unknown>) =>
      fn({
        payout: { create: mockPayoutCreate },
      }),
    );
    mockPayoutCreate.mockResolvedValue({
      id: "payout-1",
      publisher: { id: "adv-1", name: "Advertiser", email: "adv@example.com" },
    });
  });

  it("rejects amounts below referral minimum payout", async () => {
    await expect(
      requestReferralPayout("adv-1", REFERRAL_MIN_PAYOUT - 1, "WISE", { email: "a@b.com" }),
    ).rejects.toMatchObject({ code: "PAYOUT_BELOW_MINIMUM" });
  });

  it("rejects amounts above withdrawable referral balance", async () => {
    mockGetReferralBalanceSummary.mockResolvedValue({
      withdrawableReferral: 40,
      availableBalance: 100,
    });

    await expect(
      requestReferralPayout("adv-1", 50, "WISE", { email: "a@b.com" }),
    ).rejects.toMatchObject({ code: "WALLET_INSUFFICIENT_FUNDS" });
  });

  it("allows payout when referral pot is enough even if main wallet is low", async () => {
    mockGetReferralBalanceSummary.mockResolvedValue({
      withdrawableReferral: 81.752,
      availableBalance: 9.291,
    });

    const payout = await requestReferralPayout("adv-1", 30, "WISE", { email: "a@b.com" });

    expect(mockHoldReferralFunds).toHaveBeenCalledWith(expect.anything(), "adv-1", 30);
    expect(payout.id).toBe("payout-1");
  });

  it("creates a referral payout and holds referral funds", async () => {
    const payout = await requestReferralPayout("adv-1", 50, "WISE", { email: "a@b.com" });

    expect(mockHoldReferralFunds).toHaveBeenCalledWith(expect.anything(), "adv-1", 50);
    expect(mockPayoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publisherId: "adv-1",
          kind: "REFERRAL",
          amount: 50,
        }),
      }),
    );
    expect(payout.id).toBe("payout-1");
  });
});
