import { describe, expect, it } from "vitest";
import { resolveLeadEmail, withResolvedLeadEmail } from "@/lib/lead-email";

describe("resolveLeadEmail", () => {
  it("prefers data.email when present", () => {
    expect(
      resolveLeadEmail({ email: "User@Example.com", work_email: "other@test.com" }),
    ).toBe("user@example.com");
  });

  it("uses email-type field definition when data.email is missing", () => {
    expect(
      resolveLeadEmail(
        { email_address: "Lead@Company.com", first_name: "Jane" },
        [{ fieldName: "first_name", fieldType: "text" }, { fieldName: "email_address", fieldType: "email" }],
      ),
    ).toBe("lead@company.com");
  });

  it("falls back to keys containing email", () => {
    expect(resolveLeadEmail({ workEmail: "Work@Company.com" })).toBe("work@company.com");
  });

  it("returns undefined when no email is present", () => {
    expect(resolveLeadEmail({ first_name: "Jane" })).toBeUndefined();
  });
});

describe("withResolvedLeadEmail", () => {
  it("adds normalized email key from alternate field names", () => {
    expect(
      withResolvedLeadEmail(
        { email_address: "Lead@Company.com" },
        [{ fieldName: "email_address", fieldType: "email" }],
      ),
    ).toEqual({ email_address: "Lead@Company.com", email: "lead@company.com" });
  });
});
