import { describe, it, expect, vi, beforeEach } from "vitest";
import { REFERRAL_MIN_PAYOUT } from "@/lib/referral";

const mockPayoutFindUnique = vi.fn();
const mockUserFindUnique = vi.fn();
const mockHoldWalletFunds = vi.fn();
const mockPayoutCreate = vi.fn();
const mockTransaction = vi.fn();
const mockGetReferralBalanceSummary = vi.fn();

vi.mock("@/services/wallet.service", () => ({
  holdWalletFunds: (...args: unknown[]) => mockHoldWalletFunds(...args),
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
      availableBalance: 120,
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

  it("creates a referral payout and holds wallet funds", async () => {
    const payout = await requestReferralPayout("adv-1", 50, "WISE", { email: "a@b.com" });

    expect(mockHoldWalletFunds).toHaveBeenCalledWith(expect.anything(), "adv-1", 50);
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
