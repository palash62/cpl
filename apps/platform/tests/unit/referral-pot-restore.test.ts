import { describe, expect, it } from "vitest";
import { computeReferralPotRestoreGap } from "@/lib/referral";

describe("computeReferralPotRestoreGap", () => {
  it("credits the gap when pot is short of full ledger withdrawable (Marius case)", () => {
    const gap = computeReferralPotRestoreGap({
      referralEarned: 81.752,
      referralPaidOut: 0,
      pendingReferralPayout: 0,
      referralBalance: 9.291,
      referralHoldBalance: 0,
    });

    expect(gap).toBeCloseTo(72.461, 3);
  });

  it("returns zero when pot already matches ledger target", () => {
    const gap = computeReferralPotRestoreGap({
      referralEarned: 81.752,
      referralPaidOut: 0,
      pendingReferralPayout: 0,
      referralBalance: 81.752,
      referralHoldBalance: 0,
    });

    expect(gap).toBe(0);
  });

  it("accounts for pending payout holds in available pot", () => {
    const gap = computeReferralPotRestoreGap({
      referralEarned: 100,
      referralPaidOut: 10,
      pendingReferralPayout: 30,
      referralBalance: 90,
      referralHoldBalance: 30,
    });

    expect(gap).toBe(0);
  });

  it("never returns negative gap", () => {
    expect(
      computeReferralPotRestoreGap({
        referralEarned: 10,
        referralPaidOut: 50,
        pendingReferralPayout: 0,
        referralBalance: 0,
        referralHoldBalance: 0,
      }),
    ).toBe(0);
  });
});
