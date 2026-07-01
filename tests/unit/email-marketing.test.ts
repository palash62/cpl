import { describe, expect, it } from "vitest";
import { renderTemplate, wrapLinksForTracking } from "@/modules/email-marketing/lib/render-template";
import { signTrackingToken, verifyTrackingToken } from "@/modules/email-marketing/lib/tokens";

describe("renderTemplate", () => {
  it("substitutes merge tags", () => {
    const result = renderTemplate("Hello {{first_name}} {{last_name}}!", {
      first_name: "Jane",
      last_name: "Doe",
    });
    expect(result).toBe("Hello Jane Doe!");
  });

  it("replaces missing tags with empty string", () => {
    expect(renderTemplate("Hi {{first_name}}", {})).toBe("Hi ");
  });
});

describe("wrapLinksForTracking", () => {
  it("wraps http links", () => {
    const html = '<a href="https://example.com">Click</a>';
    const out = wrapLinksForTracking(html, "send123", "https://app.test", "tok");
    expect(out).toContain("/api/v1/email/track/click/send123/tok");
    expect(out).toContain(encodeURIComponent("https://example.com"));
  });
});

describe("tracking tokens", () => {
  it("signs and verifies", () => {
    process.env.AUTH_SECRET = "test-secret-key-min-32-characters!!";
    const token = signTrackingToken("send-abc");
    expect(verifyTrackingToken("send-abc", token)).toBe(true);
    expect(verifyTrackingToken("send-abc", "wrong")).toBe(false);
  });
});
