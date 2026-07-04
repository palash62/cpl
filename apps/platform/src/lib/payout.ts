export function formatPayoutMethod(method: string) {
  return method.toLowerCase().replace(/_/g, " ");
}

export function formatPublisherOptionLabel(publisher: {
  name: string;
  email: string;
  publisherProfile?: { website: string | null } | null;
}) {
  const website = publisher.publisherProfile?.website?.trim();
  if (website) {
    return `${publisher.name} · ${website}`;
  }
  return `${publisher.name} · ${publisher.email}`;
}

export type AdminPayoutRow = {
  id: string;
  amount: unknown;
  method: string;
  status: string;
  rejectionReason?: string | null;
  rejectedAt?: string | Date | null;
  processedAt?: string | Date | null;
  createdAt: string | Date;
  publisher: {
    name: string;
    email: string;
    wallet?: { balance: unknown; holdBalance: unknown; currency: string } | null;
    publisherProfile?: {
      website?: string | null;
      country?: string | null;
      city?: string | null;
      state?: string | null;
      kycStatus: string;
    } | null;
  };
};

const payoutPublisherSelect = {
  name: true,
  email: true,
  wallet: { select: { balance: true, holdBalance: true, currency: true } },
  publisherProfile: {
    select: {
      website: true,
      country: true,
      city: true,
      state: true,
      kycStatus: true,
    },
  },
} as const;

export { payoutPublisherSelect };
