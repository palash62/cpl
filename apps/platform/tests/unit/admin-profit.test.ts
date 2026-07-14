import { describe, it, expect, vi, beforeEach } from "vitest";
import { REFERRAL_LEVEL_1_RATE, REFERRAL_LEVEL_2_RATE } from "@/lib/referral";

const mockQueryRaw = vi.fn();
const mockLedgerAggregate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
    ledgerEntry: {
      aggregate: (...args: unknown[]) => mockLedgerAggregate(...args),
    },
  },
}));

import { getAdminProfitForRange } from "@/services/admin-profit.service";

describe("Admin Profit Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates admin profit as advertiser payment minus publisher and referral payouts", async () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    const to = new Date("2026-01-31T23:59:59.999Z");

    mockQueryRaw.mockResolvedValue([{ total: 1000 }]);
    mockLedgerAggregate
      .mockResolvedValueOnce({ _sum: { amount: 400 } })
      .mockResolvedValueOnce({ _sum: { amount: 20 } });

    const result = await getAdminProfitForRange(from, to);

    expect(result.advertiserPayment).toBe(1000);
    expect(result.publisherPayout).toBe(400);
    expect(result.referralPay).toBe(20);
    expect(result.adminProfit).toBe(1000 - 400 - 20);
  });

  it("uses actual referral ledger credits for referral pay", async () => {
    mockQueryRaw.mockResolvedValue([{ total: 500 }]);
    mockLedgerAggregate
      .mockResolvedValueOnce({ _sum: { amount: 150 } })
      .mockResolvedValueOnce({ _sum: { amount: 100 * REFERRAL_LEVEL_1_RATE + 100 * REFERRAL_LEVEL_2_RATE } });

    const result = await getAdminProfitForRange(new Date(), new Date());

    expect(result.referralPay).toBe(15);
    expect(result.adminProfit).toBe(500 - 150 - 15);
  });

  it("queries publisher ledger credits for lead earnings, not completed withdrawals", async () => {
    mockQueryRaw.mockResolvedValue([{ total: 0 }]);
    mockLedgerAggregate
      .mockResolvedValueOnce({ _sum: { amount: 0 } })
      .mockResolvedValueOnce({ _sum: { amount: 0 } });

    await getAdminProfitForRange(new Date(), new Date());

    expect(mockLedgerAggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          referenceType: "lead",
          wallet: { user: { role: "PUBLISHER" } },
        }),
      }),
    );
  });
});
