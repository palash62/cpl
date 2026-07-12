import { beforeEach, describe, expect, it, vi } from "vitest";

const balances = new Map([
  ["advertiser-wallet", 10],
  ["publisher-wallet", 0],
]);
const ledgerEntries: Array<Record<string, unknown>> = [];

const prismaMock = {
  platformSetting: {
    findMany: vi.fn().mockResolvedValue([
      { key: "publisher_payout_percent", value: 70 },
      { key: "tier1_payout_min", value: 0.7 },
      { key: "tier1_payout_max", value: 2.5 },
    ]),
  },
  lead: {
    findUniqueOrThrow: vi.fn().mockResolvedValue({
      id: "lead-1",
      publisherId: "publisher-1",
      country: "US",
      campaignId: "campaign-1",
      campaign: {
        id: "campaign-1",
        advertiserId: "advertiser-1",
        name: "One dollar CPL",
        cpl: 1,
        spent: 0,
        budget: 100,
      },
      publisher: { role: "PUBLISHER" },
    }),
    update: vi.fn(),
  },
  wallet: {
    findUniqueOrThrow: vi.fn(async ({ where }: { where: { userId: string } }) => {
      const id =
        where.userId === "advertiser-1" ? "advertiser-wallet" : "publisher-wallet";
      return { id, balance: balances.get(id) ?? 0 };
    }),
    update: vi.fn(
      async ({ where, data }: { where: { id: string }; data: { balance: number } }) => {
        balances.set(where.id, data.balance);
      },
    ),
    upsert: vi.fn().mockResolvedValue({ id: "publisher-wallet" }),
  },
  ledgerEntry: {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      ledgerEntries.push(data);
      return data;
    }),
  },
  platformFee: { create: vi.fn() },
  campaign: { update: vi.fn() },
  $transaction: vi.fn(async (callback: (tx: typeof prismaMock) => unknown) =>
    callback(prismaMock),
  ),
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/services/notify.service", () => ({
  notifyAdminAlert: vi.fn(),
  notifyApproved: vi.fn(),
  notifyGeneric: vi.fn(),
  notifyRejected: vi.fn(),
  notifyUserById: vi.fn(),
}));

describe("processLeadPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    balances.set("advertiser-wallet", 10);
    balances.set("publisher-wallet", 0);
    ledgerEntries.length = 0;
  });

  it("credits $0.70 to the publisher for a $1 CPL at 70%", async () => {
    const { processLeadPayment } = await import("@/services/wallet.service");

    await processLeadPayment("lead-1");

    expect(balances.get("advertiser-wallet")).toBe(9);
    expect(balances.get("publisher-wallet")).toBe(0.7);
    expect(ledgerEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "DEBIT",
          amount: 1,
          referenceType: "lead",
          referenceId: "lead-1",
        }),
        expect.objectContaining({
          type: "CREDIT",
          amount: 0.7,
          referenceType: "lead",
          referenceId: "lead-1",
        }),
      ]),
    );
    expect(prismaMock.platformFee.create).toHaveBeenCalledWith({
      data: {
        leadId: "lead-1",
        feeAmount: 0.3,
        feePercent: 30,
      },
    });
    expect(prismaMock.lead.update).toHaveBeenCalledWith({
      where: { id: "lead-1" },
      data: { status: "PAID" },
    });
  });
});
