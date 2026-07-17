import { beforeEach, describe, expect, it, vi } from "vitest";

const balances = new Map([
  ["advertiser-wallet", 9],
  ["publisher-wallet", 0.7],
]);
const ledgerEntries: Array<Record<string, unknown>> = [];

const leadRecord = {
  id: "lead-1",
  status: "PAID",
  isTest: false,
  campaignId: "campaign-1",
  campaign: {
    id: "campaign-1",
    advertiserId: "advertiser-1",
    spent: 1,
    budget: 100,
    status: "ACTIVE",
    pausedReason: null as string | null,
  },
};

const prismaMock = {
  lead: {
    findUniqueOrThrow: vi.fn(async () => leadRecord),
  },
  ledgerEntry: {
    findFirst: vi.fn(async (): Promise<{ id: string } | null> => null),
    findMany: vi.fn(async () => [
      {
        type: "DEBIT",
        amount: 1,
        referenceType: "lead",
        referenceId: "lead-1",
        wallet: { userId: "advertiser-1" },
      },
      {
        type: "CREDIT",
        amount: 0.7,
        referenceType: "lead",
        referenceId: "lead-1",
        wallet: { userId: "publisher-1" },
      },
    ]),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      ledgerEntries.push(data);
      return data;
    }),
  },
  wallet: {
    findUniqueOrThrow: vi.fn(async ({ where }: { where: { userId: string } }) => {
      const id =
        where.userId === "advertiser-1" ? "advertiser-wallet" : "publisher-wallet";
      return { id, balance: balances.get(id) ?? 0, lowBalanceAlertTiers: [] };
    }),
    update: vi.fn(
      async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { balance: number; lowBalanceAlertTiers?: number[] };
      }) => {
        balances.set(where.id, data.balance);
      },
    ),
  },
  platformFee: {
    deleteMany: vi.fn(),
  },
  campaign: {
    update: vi.fn(),
  },
  $transaction: vi.fn(async (callback: (tx: typeof prismaMock) => unknown) =>
    callback(prismaMock),
  ),
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

describe("reverseLeadPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    balances.set("advertiser-wallet", 9);
    balances.set("publisher-wallet", 0.7);
    ledgerEntries.length = 0;
    leadRecord.status = "PAID";
    leadRecord.campaign.spent = 1;
    leadRecord.campaign.status = "ACTIVE";
    leadRecord.campaign.pausedReason = null;
    prismaMock.ledgerEntry.findFirst.mockResolvedValue(null);
  });

  it("refunds advertiser and claws back publisher earnings from ledger amounts", async () => {
    const { reverseLeadPayment } = await import("@/services/wallet.service");

    await reverseLeadPayment("lead-1", "admin-1", "Invalid lead");

    expect(balances.get("advertiser-wallet")).toBe(10);
    expect(balances.get("publisher-wallet")).toBe(0);
    expect(ledgerEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "CREDIT",
          amount: 1,
          referenceType: "lead_reversal",
          referenceId: "lead-1",
        }),
        expect.objectContaining({
          type: "DEBIT",
          amount: 0.7,
          referenceType: "lead_reversal",
          referenceId: "lead-1",
        }),
      ]),
    );
    expect(prismaMock.platformFee.deleteMany).toHaveBeenCalledWith({
      where: { leadId: "lead-1" },
    });
    expect(prismaMock.campaign.update).toHaveBeenCalledWith({
      where: { id: "campaign-1" },
      data: { spent: 0 },
    });
  });

  it("reactivates campaign paused for budget when spend drops below budget", async () => {
    leadRecord.campaign.spent = 100;
    leadRecord.campaign.status = "PAUSED";
    leadRecord.campaign.pausedReason = "Budget reached";

    const { reverseLeadPayment } = await import("@/services/wallet.service");

    await reverseLeadPayment("lead-1", "admin-1");

    expect(prismaMock.campaign.update).toHaveBeenCalledWith({
      where: { id: "campaign-1" },
      data: {
        spent: 99,
        status: "ACTIVE",
        pausedReason: null,
      },
    });
  });

  it("is idempotent when reversal entries already exist", async () => {
    prismaMock.ledgerEntry.findFirst.mockResolvedValueOnce({ id: "existing-reversal" });

    const { reverseLeadPayment } = await import("@/services/wallet.service");

    await reverseLeadPayment("lead-1", "admin-1");

    expect(prismaMock.ledgerEntry.create).not.toHaveBeenCalled();
    expect(prismaMock.platformFee.deleteMany).not.toHaveBeenCalled();
  });

  it("refuses to reverse non-paid leads", async () => {
    leadRecord.status = "PENDING";

    const { reverseLeadPayment } = await import("@/services/wallet.service");

    await expect(reverseLeadPayment("lead-1", "admin-1")).rejects.toMatchObject({
      message: expect.stringContaining("not paid"),
    });
  });
});
