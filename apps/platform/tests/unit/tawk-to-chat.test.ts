import { describe, expect, it } from "vitest";
import { isPlatformBackendPath } from "@/lib/platform-backend-path";

describe("isPlatformBackendPath", () => {
  it("allows admin, advertiser, and publisher shells", () => {
    expect(isPlatformBackendPath("/admin")).toBe(true);
    expect(isPlatformBackendPath("/admin/cpa-offers")).toBe(true);
    expect(isPlatformBackendPath("/advertiser")).toBe(true);
    expect(isPlatformBackendPath("/advertiser/global-postback")).toBe(true);
    expect(isPlatformBackendPath("/publisher")).toBe(true);
    expect(isPlatformBackendPath("/publisher/leads")).toBe(true);
  });

  it("denies public funnel and lead-capture destinations", () => {
    expect(isPlatformBackendPath("/o/my-funnel")).toBe(false);
    expect(isPlatformBackendPath("/o/my-funnel/thank-you")).toBe(false);
    expect(isPlatformBackendPath("/p/landing")).toBe(false);
    expect(isPlatformBackendPath("/domains/example.com")).toBe(false);
    expect(isPlatformBackendPath("/domains/example.com/thank-you")).toBe(false);
    expect(isPlatformBackendPath("/login")).toBe(false);
    expect(isPlatformBackendPath("/register")).toBe(false);
    expect(isPlatformBackendPath("/")).toBe(false);
    expect(isPlatformBackendPath(null)).toBe(false);
  });

  it("does not match path prefixes that only look similar", () => {
    expect(isPlatformBackendPath("/administrator")).toBe(false);
    expect(isPlatformBackendPath("/advertisers")).toBe(false);
    expect(isPlatformBackendPath("/publishers")).toBe(false);
  });
});
