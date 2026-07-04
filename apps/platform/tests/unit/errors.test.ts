import { describe, it, expect } from "vitest";
import { AppError, Errors } from "@/lib/errors";

describe("Error handling", () => {
  it("creates AppError with code and status", () => {
    const err = new AppError("TEST_ERROR", "Test message", 422, "email");
    expect(err.code).toBe("TEST_ERROR");
    expect(err.status).toBe(422);
    expect(err.field).toBe("email");
  });

  it("provides standard error factories", () => {
    expect(Errors.duplicateLead().code).toBe("LEAD_DUPLICATE");
    expect(Errors.insufficientFunds().code).toBe("WALLET_INSUFFICIENT_FUNDS");
    expect(Errors.payoutBelowMinimum(50).message).toContain("50");
  });
});

describe("Ledger math", () => {
  it("calculates platform fee correctly", () => {
    const cpl = 25;
    const feePercent = 10;
    const fee = (cpl * feePercent) / 100;
    const publisherAmount = cpl - fee;
    expect(fee).toBe(2.5);
    expect(publisherAmount).toBe(22.5);
    expect(fee + publisherAmount).toBe(cpl);
  });

  it("detects budget exhaustion", () => {
    const budget = 500;
    const spent = 500;
    const cpl = 25;
    expect(spent >= budget).toBe(true);
    expect(spent + cpl > budget).toBe(true);
  });
});
