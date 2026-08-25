import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUserFindUnique = vi.fn();
const mockTransaction = vi.fn();
const mockTransferReferralToWallet = vi.fn();
const mockWalletUpsert = vi.fn();

vi.mock("@/services/wallet.service", () => ({
  creditReferralBalance: vi.fn(),
  releaseWalletHold: vi.fn(),
  transferReferralToWallet: (...args: unknown[]) => mockTransferReferralToWallet(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
    wallet: {
      upsert: (...args: unknown[]) => mockWalletUpsert(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

import { transferReferralEarningsToWallet } from "@/services/referral.service";

describe("transferReferralEarningsToWallet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserFindUnique.mockResolvedValue({ role: "ADVERTISER" });
    mockWalletUpsert.mockResolvedValue({ id: "w1" });
    mockTransferReferralToWallet.mockResolvedValue({
      referralBalance: 50,
      availableReferral: 50,
    });
    mockTransaction.mockImplementation(async (fn: (tx: {
      wallet: { upsert: typeof mockWalletUpsert };
    }) => Promise<unknown>) =>
      fn({
        wallet: { upsert: mockWalletUpsert },
      }),
    );
  });

  it("rejects non-positive amounts", async () => {
    await expect(transferReferralEarningsToWallet("adv-1", 0)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("transfers via wallet helper for advertisers", async () => {
    const result = await transferReferralEarningsToWallet("adv-1", 25);

    expect(mockTransferReferralToWallet).toHaveBeenCalledWith(
      expect.anything(),
      "adv-1",
      25,
      expect.any(String),
    );
    expect(result.availableReferral).toBe(50);
  });

  it("maps insufficient funds errors", async () => {
    mockTransferReferralToWallet.mockRejectedValue(new Error("INSUFFICIENT_FUNDS"));

    await expect(transferReferralEarningsToWallet("adv-1", 25)).rejects.toMatchObject({
      code: "WALLET_INSUFFICIENT_FUNDS",
    });
  });
});
