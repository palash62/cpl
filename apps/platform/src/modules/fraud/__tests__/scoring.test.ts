import { describe, it, expect } from "vitest";
import { aggregateRiskScore } from "@/modules/fraud/scoring/aggregate";
import { decideFraud } from "@/modules/fraud/scoring/decide";
import { DEFAULT_FRAUD_CONFIG } from "@/modules/fraud/config/defaults";
import type { RuleOutcome } from "@/modules/fraud/types/result";

describe("aggregateRiskScore", () => {
  it("sums risk deltas and clamps to 0-100", () => {
    const outcomes: RuleOutcome[] = [
      { rule: "duplicate_email", passed: false, riskDelta: 60, hardFail: true },
      { rule: "fast_submit", passed: false, riskDelta: 35, hardFail: false },
    ];
    expect(aggregateRiskScore(outcomes)).toBe(95);
  });

  it("does not go below zero", () => {
    const outcomes: RuleOutcome[] = [
      { rule: "residential_ip", passed: true, riskDelta: -10, hardFail: false },
    ];
    expect(aggregateRiskScore(outcomes)).toBe(0);
  });
});

describe("decideFraud", () => {
  const config = DEFAULT_FRAUD_CONFIG;

  it("auto-rejects on hard fail", () => {
    const outcomes: RuleOutcome[] = [
      { rule: "honeypot", passed: false, riskDelta: 100, hardFail: true, details: "Bot" },
    ];
    const result = decideFraud(100, outcomes, config);
    expect(result.fraudDecision).toBe("auto_reject");
    expect(result.hardReject).toBe(true);
  });

  it("manual review for mid-range score", () => {
    const result = decideFraud(35, [], config);
    expect(result.fraudDecision).toBe("manual_review");
    expect(result.hardReject).toBe(false);
  });

  it("auto-approve for low score", () => {
    const result = decideFraud(10, [], config);
    expect(result.fraudDecision).toBe("auto_approve");
  });

  it("auto-rejects when score exceeds manual review max", () => {
    const result = decideFraud(55, [], config);
    expect(result.fraudDecision).toBe("auto_reject");
    expect(result.hardReject).toBe(true);
  });
});

describe("DEFAULT_FRAUD_CONFIG shadow mode", () => {
  it("defaults useRiskDecision to false for safe rollout", () => {
    expect(DEFAULT_FRAUD_CONFIG.useRiskDecision).toBe(false);
  });
});
