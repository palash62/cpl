import { describe, it, expect, vi, beforeEach } from "vitest";
import { REFERRAL_LEVEL_1_RATE, REFERRAL_LEVEL_2_RATE } from "@/lib/referral";

const mockQueryRaw = vi.fn();
const mockLedgerAggregate = vi.fn();
const mockUserFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
    ledgerEntry: {
      aggregate: (...args: unknown[]) => mockLedgerAggregate(...args),
    },
    user: {
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
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
    mockLedgerAggregate.mockResolvedValue({ _sum: { amount: 400 } });
    mockUserFindMany.mockResolvedValue([
      {
        referredById: "referrer-1",
        referredBy: { referredById: null },
        campaigns: [
          {
            leads: [{ campaign: { cpl: 200 } }],
          },
        ],
      },
    ]);

    const result = await getAdminProfitForRange(from, to);

    const expectedReferral = 200 * REFERRAL_LEVEL_1_RATE;
    expect(result.advertiserPayment).toBe(1000);
    expect(result.publisherPayout).toBe(400);
    expect(result.referralPay).toBe(expectedReferral);
    expect(result.adminProfit).toBe(1000 - 400 - expectedReferral);
  });

  it("includes level-2 referral commission when grandparent referrer exists", async () => {
    mockQueryRaw.mockResolvedValue([{ total: 500 }]);
    mockLedgerAggregate.mockResolvedValue({ _sum: { amount: 150 } });
    mockUserFindMany.mockResolvedValue([
      {
        referredById: "referrer-1",
        referredBy: { referredById: "referrer-2" },
        campaigns: [
          {
            leads: [{ campaign: { cpl: 100 } }],
          },
        ],
      },
    ]);

    const result = await getAdminProfitForRange(new Date(), new Date());
    const expectedReferral =
      100 * REFERRAL_LEVEL_1_RATE + 100 * REFERRAL_LEVEL_2_RATE;

    expect(result.referralPay).toBe(expectedReferral);
    expect(result.adminProfit).toBe(500 - 150 - expectedReferral);
  });

  it("queries publisher ledger credits for lead earnings, not completed withdrawals", async () => {
    mockQueryRaw.mockResolvedValue([{ total: 0 }]);
    mockLedgerAggregate.mockResolvedValue({ _sum: { amount: 0 } });
    mockUserFindMany.mockResolvedValue([]);

    await getAdminProfitForRange(new Date(), new Date());

    expect(mockLedgerAggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: "CREDIT",
          referenceType: "lead",
        }),
      }),
    );
  });
});
