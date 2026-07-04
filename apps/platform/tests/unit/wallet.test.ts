import { describe, it, expect, vi, beforeEach } from "vitest";
import { creditWallet, debitWallet } from "@/services/wallet.service";

function createMockTx(initialBalance: number) {
  let balance = initialBalance;
  const ledger: Array<{
    type: string;
    amount: number;
    balanceAfter: number;
    referenceType: string;
    referenceId: string;
  }> = [];

  return {
    wallet: {
      findUniqueOrThrow: vi.fn().mockImplementation(async () => ({
        id: "wallet-1",
        balance,
      })),
      update: vi.fn().mockImplementation(async ({ data }: { data: { balance: number } }) => {
        balance = data.balance;
      }),
    },
    ledgerEntry: {
      create: vi.fn().mockImplementation(async ({ data }: { data: typeof ledger[0] }) => {
        ledger.push(data);
      }),
    },
    getBalance: () => balance,
    getLedger: () => ledger,
  };
}

describe("Wallet Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("credits wallet and records ledger entry", async () => {
    const tx = createMockTx(100);
    const newBalance = await creditWallet(tx as never, "user-1", 50, "deposit", "dep-1", "Test deposit");

    expect(newBalance).toBe(150);
    expect(tx.getBalance()).toBe(150);
    expect(tx.ledgerEntry.create).toHaveBeenCalledOnce();
    expect(tx.getLedger()[0]).toMatchObject({
      type: "CREDIT",
      amount: 50,
      balanceAfter: 150,
      referenceType: "deposit",
      referenceId: "dep-1",
    });
  });

  it("debits wallet and records ledger entry", async () => {
    const tx = createMockTx(100);
    const newBalance = await debitWallet(tx as never, "user-1", 30, "lead", "lead-1");

    expect(newBalance).toBe(70);
    expect(tx.getLedger()[0]).toMatchObject({
      type: "DEBIT",
      amount: 30,
      balanceAfter: 70,
    });
  });

  it("rejects debit when insufficient funds", async () => {
    const tx = createMockTx(10);
    await expect(debitWallet(tx as never, "user-1", 50, "lead", "lead-1")).rejects.toThrow(
      "INSUFFICIENT_FUNDS",
    );
    expect(tx.getBalance()).toBe(10);
    expect(tx.ledgerEntry.create).not.toHaveBeenCalled();
  });

  it("maintains ledger integrity across multiple operations", async () => {
    const tx = createMockTx(0);
    await creditWallet(tx as never, "user-1", 100, "deposit", "d1");
    await debitWallet(tx as never, "user-1", 40, "lead", "l1");
    await creditWallet(tx as never, "user-1", 25, "lead", "l2");

    expect(tx.getBalance()).toBe(85);
    expect(tx.getLedger()).toHaveLength(3);
    expect(tx.getLedger()[2].balanceAfter).toBe(85);
  });
});
