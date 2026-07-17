/**
 * Resolved lead CPL/bid for display, spend totals, and payment.
 * Prefers the snapshotted lead.cpl; falls back to live campaign.cpl for legacy rows.
 */
export function getLeadCpl(lead: {
  cpl?: number | string | { toString(): string } | null;
  campaign?: { cpl?: number | string | { toString(): string } | null } | null;
}): number {
  if (lead.cpl != null && lead.cpl !== "") {
    return Number(lead.cpl);
  }
  if (lead.campaign?.cpl != null && lead.campaign.cpl !== "") {
    return Number(lead.campaign.cpl);
  }
  return 0;
}
