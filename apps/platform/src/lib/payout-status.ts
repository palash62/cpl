export const PENDING_PAYOUT_STATUSES = ["PENDING", "REQUESTED"] as const;

export function isPendingPayoutStatus(status: string) {
  return (PENDING_PAYOUT_STATUSES as readonly string[]).includes(status);
}

export function payoutStatusLabel(status: string) {
  if (isPendingPayoutStatus(status)) return "pending";
  return status.toLowerCase();
}
