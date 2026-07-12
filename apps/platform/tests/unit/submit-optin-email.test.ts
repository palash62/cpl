import { afterEach, describe, expect, it, vi } from "vitest";
import { Errors } from "@/lib/errors";

const submitOptinLead = vi.fn();

vi.mock("@/services/lead.service", () => ({
  submitOptinLead,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    advertiserOptinPage: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

describe("POST /api/v1/leads/submit-optin email validation", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 422 when email deliverability validation fails", async () => {
    submitOptinLead.mockRejectedValue(
      Errors.validation(
        "Disposable email addresses are not allowed. Use a permanent email address.",
        "email",
      ),
    );

    const { POST } = await import("@/app/api/v1/leads/submit-optin/route");
    const res = await POST(
      new Request("http://localhost/api/v1/leads/submit-optin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optinSlug: "test-funnel",
          data: { email: "test@mailinator.com", first_name: "Test" },
        }),
      }),
    );

    const body = await res.json();
    expect(res.status).toBe(422);
    expect(body.error.message).toContain("Disposable email addresses are not allowed");
    expect(body.error.field).toBe("email");
  });
});
