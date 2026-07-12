import { describe, expect, it } from "vitest";
import { getLoginBlock, loginBlockMessage } from "@/lib/auth-login-gate";

describe("auth-login-gate", () => {
  it("blocks unverified pending users", () => {
    expect(
      getLoginBlock({
        status: "PENDING",
        role: "ADVERTISER",
        emailVerified: null,
      }),
    ).toBe("email_not_verified");
  });

  it("blocks verified pending publishers awaiting approval", () => {
    expect(
      getLoginBlock({
        status: "PENDING",
        role: "PUBLISHER",
        emailVerified: new Date(),
      }),
    ).toBe("pending_approval");
  });

  it("allows active users", () => {
    expect(
      getLoginBlock({
        status: "ACTIVE",
        role: "ADVERTISER",
        emailVerified: new Date(),
      }),
    ).toBeNull();
  });

  it("blocks suspended users", () => {
    expect(
      getLoginBlock({
        status: "SUSPENDED",
        role: "ADVERTISER",
        emailVerified: new Date(),
      }),
    ).toBe("suspended");
  });

  it("returns readable messages for each block code", () => {
    expect(loginBlockMessage("email_not_verified")).toContain("Verify your email");
    expect(loginBlockMessage("pending_approval")).toContain("admin approval");
    expect(loginBlockMessage("suspended")).toContain("suspended");
  });
});
