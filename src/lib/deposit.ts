import type { DepositMethod } from "@prisma/client";

export function formatDepositMethod(method: DepositMethod | string) {
  if (method === "WISE") return "Wise";
  if (method === "CREDIT_CARD") return "Credit Card";
  if (method === "MANUAL") return "Manual (Admin)";
  return String(method);
}

export function formatAdvertiserOptionLabel(advertiser: {
  name: string;
  email: string;
  advertiserProfile?: { company: string } | null;
}) {
  const company = advertiser.advertiserProfile?.company?.trim();
  const name = advertiser.name.trim();
  const headline = company || name;
  if (headline.toLowerCase() === name.toLowerCase()) {
    return `${headline} · ${advertiser.email}`;
  }
  return `${headline} (${name}) · ${advertiser.email}`;
}

export type WisePaymentDetails = {
  payerName?: string;
  note?: string;
};

export type AdminDepositRow = {
  id: string;
  amount: number;
  method: string;
  status: string;
  wiseReference: string | null;
  paymentDetails: WisePaymentDetails | null;
  rejectionReason: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
    advertiserProfile?: {
      company: string;
      industry?: string | null;
      billingInfo?: unknown;
    } | null;
  };
};

/** Plain-object shape safe to pass from Server Components to Client Components. */
export function serializeAdminDepositRow(deposit: {
  id: string;
  amount: unknown;
  method: string;
  status: string;
  wiseReference?: string | null;
  paymentDetails?: unknown;
  rejectionReason?: string | null;
  createdAt: Date;
  user: AdminDepositRow["user"];
}): AdminDepositRow {
  return {
    id: deposit.id,
    amount: Number(deposit.amount),
    method: deposit.method,
    status: deposit.status,
    wiseReference: deposit.wiseReference ?? null,
    paymentDetails: (deposit.paymentDetails as WisePaymentDetails | null) ?? null,
    rejectionReason: deposit.rejectionReason ?? null,
    createdAt: deposit.createdAt.toISOString(),
    user: deposit.user,
  };
}
