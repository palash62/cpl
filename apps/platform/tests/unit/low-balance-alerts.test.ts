import { describe, expect, it } from "vitest";
import {
  crossedLowBalanceTiers,
  lowBalanceAlertCopy,
  lowBalanceNotificationType,
  parseLowBalanceAlertTiers,
  recoveredLowBalanceTiers,
} from "@/lib/low-balance-alerts";

describe("low-balance-alerts", () => {
  describe("crossedLowBalanceTiers", () => {
    it("fires <50 when crossing from above 50", () => {
      expect(crossedLowBalanceTiers(60, 45)).toEqual([50]);
    });

    it("fires <10 when crossing from above 10", () => {
      expect(crossedLowBalanceTiers(15, 8)).toEqual([10]);
    });

    it("fires =0 when balance hits exactly zero", () => {
      expect(crossedLowBalanceTiers(5, 0)).toEqual([0]);
      expect(crossedLowBalanceTiers(12, 0)).toEqual([10, 0]);
    });

    it("fires all tiers crossed in one debit", () => {
      expect(crossedLowBalanceTiers(60, 0)).toEqual([50, 10, 0]);
    });

    it("does not re-fire already alerted tiers", () => {
      expect(crossedLowBalanceTiers(60, 0, [50])).toEqual([10, 0]);
      expect(crossedLowBalanceTiers(8, 0, [50, 10])).toEqual([0]);
      expect(crossedLowBalanceTiers(5, 0, [50, 10, 0])).toEqual([]);
    });

    it("does not fire when staying within the same band", () => {
      expect(crossedLowBalanceTiers(40, 30)).toEqual([]);
      expect(crossedLowBalanceTiers(8, 5)).toEqual([]);
      expect(crossedLowBalanceTiers(0, 0)).toEqual([]);
    });
  });

  describe("recoveredLowBalanceTiers", () => {
    it("clears tiers after balance recovers above them", () => {
      expect(recoveredLowBalanceTiers(55, [50, 10, 0])).toEqual([]);
      expect(recoveredLowBalanceTiers(25, [50, 10, 0])).toEqual([50]);
      expect(recoveredLowBalanceTiers(5, [50, 10, 0])).toEqual([50, 10]);
      expect(recoveredLowBalanceTiers(0, [50, 10, 0])).toEqual([50, 10, 0]);
    });

    it("clears zero tier when balance goes above zero", () => {
      expect(recoveredLowBalanceTiers(0.01, [0])).toEqual([]);
    });
  });

  describe("parseLowBalanceAlertTiers", () => {
    it("filters invalid values", () => {
      expect(parseLowBalanceAlertTiers([50, 10, 7, "x", 0])).toEqual([50, 10, 0]);
      expect(parseLowBalanceAlertTiers(null)).toEqual([]);
    });
  });

  describe("copy helpers", () => {
    it("builds notification types and messages", () => {
      expect(lowBalanceNotificationType(50)).toBe("wallet.low_balance.50");
      expect(lowBalanceAlertCopy(50, 42).title).toMatch(/below \$50/i);
      expect(lowBalanceAlertCopy(10, 8).title).toMatch(/below \$10/i);
      expect(lowBalanceAlertCopy(0, 0).title).toMatch(/\$0/);
    });
  });
});
