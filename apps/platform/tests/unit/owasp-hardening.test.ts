import { describe, expect, it } from "vitest";
import {
  canAdvertiserTransitionStatus,
  canTransitionStatus,
} from "@/lib/campaign-lifecycle";
import {
  assertSafeRelativeRedirect,
  isSafeHttpUrl,
} from "@/lib/safe-url";

describe("campaign advertiser status transitions", () => {
  it("blocks PENDING → ACTIVE for advertisers but allows for admins", () => {
    expect(canAdvertiserTransitionStatus("PENDING", "ACTIVE")).toBe(false);
    expect(canTransitionStatus("PENDING", "ACTIVE")).toBe(true);
  });

  it("allows advertiser pause and resume", () => {
    expect(canAdvertiserTransitionStatus("ACTIVE", "PAUSED")).toBe(true);
    expect(canAdvertiserTransitionStatus("PAUSED", "ACTIVE")).toBe(true);
  });
});

describe("safe redirect helpers", () => {
  it("accepts same-origin relative paths", () => {
    expect(assertSafeRelativeRedirect("/admin", "/")).toBe("/admin");
    expect(assertSafeRelativeRedirect("/advertiser/campaigns", "/")).toBe("/advertiser/campaigns");
  });

  it("rejects protocol-relative and absolute URLs", () => {
    expect(assertSafeRelativeRedirect("//evil.com", "/admin")).toBe("/admin");
    expect(assertSafeRelativeRedirect("https://evil.com", "/admin")).toBe("/admin");
    expect(assertSafeRelativeRedirect("javascript:alert(1)", "/admin")).toBe("/admin");
  });

  it("validates http(s) URLs only", () => {
    expect(isSafeHttpUrl("https://example.com/path")).toBe(true);
    expect(isSafeHttpUrl("http://example.com")).toBe(true);
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("not a url")).toBe(false);
  });
});
