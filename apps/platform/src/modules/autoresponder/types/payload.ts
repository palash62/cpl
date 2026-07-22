import type { AutoresponderTrigger } from "@prisma/client";

export type LeadAutoresponderPayload = {
  event: "lead.captured" | "lead.approved";
  leadId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  campaign: { id: string; name: string };
  publisher: { id: string };
  source?: string;
  subId?: string;
  submittedAt: string;
};

export function triggerToPayloadEvent(
  trigger: AutoresponderTrigger,
): LeadAutoresponderPayload["event"] {
  return trigger === "LEAD_APPROVED" ? "lead.approved" : "lead.captured";
}

export type ProviderSendResult = {
  ok: boolean;
  httpStatus?: number;
  error?: string;
  /** When AWeber refreshed tokens, persist these on the connection. */
  refreshedAweberConfig?: {
    accessToken: string;
    refreshToken?: string;
    tokenExpiresAt: number;
  };
};
