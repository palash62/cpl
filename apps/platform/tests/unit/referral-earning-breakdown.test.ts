import { describe, expect, it } from "vitest";
import { getReferralEarningBreakdown } from "@/lib/referral";

describe("getReferralEarningBreakdown", () => {
  it("shows remain as min(withdrawable, wallet) and used as the gap", () => {
    const result = getReferralEarningBreakdown({
      referralEarned: 81.752,
      withdrawableReferral: 81.752,
      availableBalance: 9.291,
    });

    expect(result.totalReferralEarning).toBe(81.752);
    expect(result.remainReferralEarning).toBe(9.291);
    expect(result.usedInCampaign).toBeCloseTo(72.461, 3);
  });

  it("keeps full withdrawable as remain when wallet has enough", () => {
    const result = getReferralEarningBreakdown({
      referralEarned: 100,
      withdrawableReferral: 80,
      availableBalance: 120,
    });

    expect(result.totalReferralEarning).toBe(100);
    expect(result.remainReferralEarning).toBe(80);
    expect(result.usedInCampaign).toBe(0);
  });

  it("never returns negative used or remain", () => {
    const result = getReferralEarningBreakdown({
      referralEarned: -5,
      withdrawableReferral: -2,
      availableBalance: -10,
    });

    expect(result.totalReferralEarning).toBe(0);
    expect(result.remainReferralEarning).toBe(0);
    expect(result.usedInCampaign).toBe(0);
  });
});
