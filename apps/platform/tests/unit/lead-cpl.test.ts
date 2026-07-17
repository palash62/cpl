import { describe, expect, it } from "vitest";
import { getLeadCpl } from "@/lib/lead-cpl";
import { formatAdvertiserLeadCpl } from "@/lib/advertiser-lead-details";

describe("getLeadCpl", () => {
  it("prefers snapshotted lead.cpl over live campaign.cpl", () => {
    expect(
      getLeadCpl({
        cpl: 1.25,
        campaign: { cpl: 3.5 },
      }),
    ).toBe(1.25);
  });

  it("falls back to campaign.cpl for legacy leads without snapshot", () => {
    expect(
      getLeadCpl({
        cpl: null,
        campaign: { cpl: 2 },
      }),
    ).toBe(2);
  });

  it("returns 0 when neither value is present", () => {
    expect(getLeadCpl({})).toBe(0);
  });
});

describe("formatAdvertiserLeadCpl with snapshot", () => {
  it("formats paid lead using snapshotted cpl after campaign bid change", () => {
    const snapshotted = getLeadCpl({ cpl: 0.8, campaign: { cpl: 2.5 } });
    expect(formatAdvertiserLeadCpl("PAID", snapshotted)).toBe("$0.80");
  });
});
