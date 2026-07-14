import { describe, it, expect, vi, beforeEach } from "vitest";
import { REFERRAL_LEVEL_1_RATE, REFERRAL_LEVEL_2_RATE } from "@/lib/referral";

const mockFindFirst = vi.fn();
const mockUserFindUnique = vi.fn();
const mockWalletUpsert = vi.fn();
const mockCreditWallet = vi.fn();

vi.mock("@/services/wallet.service", () => ({
  creditWallet: (...args: unknown[]) => mockCreditWallet(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    ledgerEntry: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
    wallet: {
      upsert: (...args: unknown[]) => mockWalletUpsert(...args),
    },
  },
}));

import { creditReferralCommissionsForLead } from "@/services/referral.service";

describe("creditReferralCommissionsForLead", () => {
  const tx = {
    ledgerEntry: { findFirst: mockFindFirst },
    user: { findUnique: mockUserFindUnique },
    wallet: { upsert: mockWalletUpsert },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindFirst.mockResolvedValue(null);
    mockWalletUpsert.mockResolvedValue({ id: "wallet-1" });
    mockCreditWallet.mockResolvedValue(100);
  });

  it("credits level 1 commission for direct advertiser referrer", async () => {
    mockUserFindUnique.mockResolvedValue({
      referredBy: {
        id: "referrer-1",
        role: "ADVERTISER",
        referredBy: null,
      },
    });

    const result = await creditReferralCommissionsForLead(
      tx as never,
      "lead-1",
      "advertiser-1",
      100,
    );

    expect(result).toEqual([{ referrerId: "referrer-1", level: 1, amount: 100 * REFERRAL_LEVEL_1_RATE }]);
    expect(mockCreditWallet).toHaveBeenCalledTimes(1);
  });

  it("credits level 1 and level 2 commissions when grandparent exists", async () => {
    mockUserFindUnique.mockResolvedValue({
      referredBy: {
        id: "referrer-1",
        role: "ADVERTISER",
        referredBy: { id: "referrer-2", role: "ADVERTISER" },
      },
    });

    const result = await creditReferralCommissionsForLead(
      tx as never,
      "lead-1",
      "advertiser-1",
      200,
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ referrerId: "referrer-1", level: 1, amount: 20 });
    expect(result[1]).toEqual({ referrerId: "referrer-2", level: 2, amount: 10 });
  });

  it("skips non-advertiser referrers", async () => {
    mockUserFindUnique.mockResolvedValue({
      referredBy: {
        id: "referrer-1",
        role: "PUBLISHER",
        referredBy: { id: "referrer-2", role: "ADVERTISER" },
      },
    });

    const result = await creditReferralCommissionsForLead(
      tx as never,
      "lead-1",
      "advertiser-1",
      100,
    );

    expect(result).toEqual([{ referrerId: "referrer-2", level: 2, amount: 5 }]);
    expect(mockCreditWallet).toHaveBeenCalledTimes(1);
  });

  it("is idempotent when commission already exists", async () => {
    mockUserFindUnique.mockResolvedValue({
      referredBy: {
        id: "referrer-1",
        role: "ADVERTISER",
        referredBy: null,
      },
    });
    mockFindFirst.mockResolvedValue({ id: "existing-entry" });

    const result = await creditReferralCommissionsForLead(
      tx as never,
      "lead-1",
      "advertiser-1",
      100,
    );

    expect(result).toEqual([]);
    expect(mockCreditWallet).not.toHaveBeenCalled();
  });
});
