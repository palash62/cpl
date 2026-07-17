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

describe("bid change 1.45 -> 1.20 (Battery prof scenario)", () => {
  it("keeps historical paid lead at $1.45 after campaign bid becomes $1.20", () => {
    const campaignAfterEdit = { cpl: 1.2 };
    const oldPaidLead = { cpl: 1.45, campaign: campaignAfterEdit, status: "PAID" };
    const newLead = { cpl: 1.2, campaign: campaignAfterEdit, status: "APPROVED" };

    expect(getLeadCpl(oldPaidLead)).toBe(1.45);
    expect(formatAdvertiserLeadCpl(oldPaidLead.status, getLeadCpl(oldPaidLead))).toBe("$1.45");

    expect(getLeadCpl(newLead)).toBe(1.2);
    expect(formatAdvertiserLeadCpl(newLead.status, getLeadCpl(newLead))).toBe("$1.20");
  });

  it("shows the bug when lead.cpl is missing (falls back to live bid)", () => {
    const brokenLegacyLead = { cpl: null, campaign: { cpl: 1.2 }, status: "PAID" };
    expect(getLeadCpl(brokenLegacyLead)).toBe(1.2);
    expect(formatAdvertiserLeadCpl("PAID", getLeadCpl(brokenLegacyLead))).toBe("$1.20");
  });

  it("restores correct paid value from ledger amount used as snapshot", () => {
    const ledgerDebitAmount = 1.45;
    const repairedLead = { cpl: ledgerDebitAmount, campaign: { cpl: 1.2 }, status: "PAID" };
    expect(formatAdvertiserLeadCpl("PAID", getLeadCpl(repairedLead))).toBe("$1.45");
  });
});
