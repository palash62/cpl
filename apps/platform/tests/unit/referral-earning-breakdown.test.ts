import { describe, expect, it } from "vitest";
import { computeReferralMigrationMove } from "@/lib/referral";

describe("computeReferralMigrationMove", () => {
  it("moves min(withdrawable + pending, available) for Marius-style balances", () => {
    const move = computeReferralMigrationMove({
      ledgerWithdrawable: 81.752,
      pendingReferralPayout: 0,
      availableMainBalance: 9.291,
    });
    expect(move).toBeCloseTo(9.291, 3);
  });

  it("includes pending payout so holds can be re-homed", () => {
    const move = computeReferralMigrationMove({
      ledgerWithdrawable: 70,
      pendingReferralPayout: 30,
      availableMainBalance: 50,
    });
    expect(move).toBe(50);
  });

  it("never returns negative", () => {
    expect(
      computeReferralMigrationMove({
        ledgerWithdrawable: -5,
        pendingReferralPayout: -2,
        availableMainBalance: -10,
      }),
    ).toBe(0);
  });
});
