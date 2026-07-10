import { describe, expect, it, vi } from "vitest";
import {
  enrichLeadsWithCountry,
  extractLeadCountry,
  inferCountryFromSubmissionMeta,
  resolveMissingLeadCountry,
} from "@/lib/lead-country";

describe("inferCountryFromSubmissionMeta", () => {
  it("infers India from timezone", () => {
    expect(inferCountryFromSubmissionMeta({ timezone: "Asia/Kolkata" })).toBe("IN");
  });

  it("infers from browser language region", () => {
    expect(inferCountryFromSubmissionMeta({ language: "en-IN" })).toBe("IN");
  });
});

describe("extractLeadCountry", () => {
  it("prefers stored country and formats display name", () => {
    expect(extractLeadCountry({ country: "CA" }, "US", "IN")).toBe("United States");
  });

  it("reads country from form data keys", () => {
    expect(extractLeadCountry({ countryCode: "GB" }, null, null)).toBe("United Kingdom");
  });

  it("falls back to geo country", () => {
    expect(extractLeadCountry({}, null, "DE")).toBe("Germany");
  });

  it("falls back to submission meta timezone", () => {
    expect(extractLeadCountry({}, null, null, { timezone: "Asia/Kolkata" })).toBe("India");
  });

  it("returns dash when no country is available", () => {
    expect(extractLeadCountry({}, null, null)).toBe("—");
  });
});

describe("resolveMissingLeadCountry", () => {
  it("uses timezone before IP lookup", async () => {
    const lookup = vi.fn();
    await expect(
      resolveMissingLeadCountry(
        { submissionMeta: { timezone: "Asia/Kolkata" }, ip: "8.8.8.8" },
        lookup,
      ),
    ).resolves.toBe("IN");
    expect(lookup).not.toHaveBeenCalled();
  });

  it("looks up public IP when no other signal exists", async () => {
    const lookup = vi.fn().mockResolvedValue("US");
    await expect(
      resolveMissingLeadCountry({ ip: "8.8.8.8" }, lookup),
    ).resolves.toBe("US");
  });
});

describe("enrichLeadsWithCountry", () => {
  it("fills missing countries for table display", async () => {
    const lookup = vi.fn().mockResolvedValue("IN");
    const enriched = await enrichLeadsWithCountry(
      [
        {
          id: "lead-1",
          ip: "203.0.113.10",
          country: null,
          geoCountry: null,
          submissionMeta: null,
        },
      ],
      lookup,
    );

    expect(enriched[0]?.country).toBe("IN");
    expect(extractLeadCountry(undefined, enriched[0]?.country, enriched[0]?.geoCountry)).toBe(
      "India",
    );
  });
});
