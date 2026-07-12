import { describe, expect, it } from "vitest";
import {
  isAdminFunnelTemplatePreviewPath,
  isAdvertiserFunnelPreviewRequest,
  isPublicPreviewRequest,
} from "@/lib/public-preview-paths";

describe("isAdminFunnelTemplatePreviewPath", () => {
  it("matches admin funnel template preview paths", () => {
    expect(
      isAdminFunnelTemplatePreviewPath(
        "/admin/funnel-templates/cmrf4xmv6001ipg01z17kkekk/preview",
      ),
    ).toBe(true);
    expect(
      isAdminFunnelTemplatePreviewPath(
        "/admin/funnel-templates/cmrf4xmv6001ipg01z17kkekk/preview/",
      ),
    ).toBe(true);
  });

  it("does not match edit or list routes", () => {
    expect(
      isAdminFunnelTemplatePreviewPath(
        "/admin/funnel-templates/cmrf4xmv6001ipg01z17kkekk/edit",
      ),
    ).toBe(false);
    expect(isAdminFunnelTemplatePreviewPath("/admin/funnel-templates")).toBe(false);
  });
});

describe("isAdvertiserFunnelPreviewRequest", () => {
  it("matches opt-in and thank-you preview when preview=1", () => {
    expect(isAdvertiserFunnelPreviewRequest("/o/my-funnel", "1")).toBe(true);
    expect(isAdvertiserFunnelPreviewRequest("/o/my-funnel/thank-you", "1")).toBe(true);
  });

  it("does not match without preview=1", () => {
    expect(isAdvertiserFunnelPreviewRequest("/o/my-funnel", null)).toBe(false);
    expect(isAdvertiserFunnelPreviewRequest("/o/my-funnel", "0")).toBe(false);
    expect(isAdvertiserFunnelPreviewRequest("/o/my-funnel/thank-you", null)).toBe(
      false,
    );
  });

  it("does not match unrelated paths", () => {
    expect(isAdvertiserFunnelPreviewRequest("/advertiser/optin-funnels", "1")).toBe(
      false,
    );
  });
});

describe("isPublicPreviewRequest", () => {
  it("combines admin and advertiser preview rules", () => {
    expect(
      isPublicPreviewRequest(
        "/admin/funnel-templates/abc123/preview",
        null,
      ),
    ).toBe(true);
    expect(isPublicPreviewRequest("/o/slug", "1")).toBe(true);
    expect(isPublicPreviewRequest("/o/slug", null)).toBe(false);
  });
});
