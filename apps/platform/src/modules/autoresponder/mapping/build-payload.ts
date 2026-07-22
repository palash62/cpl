import type { Lead } from "@prisma/client";
import type { AutoresponderTrigger } from "@prisma/client";
import type { LeadAutoresponderPayload } from "../types/payload";
import { triggerToPayloadEvent } from "../types/payload";
import { DEFAULT_FIELD_MAPPING } from "../config/defaults";

type LeadWithRelations = Lead & {
  campaign: { id: string; name: string };
  publisher: { id: string };
};

function pickField(
  data: Record<string, string>,
  mapping: Record<string, string>,
  key: string,
): string | undefined {
  const fieldName = mapping[key] ?? DEFAULT_FIELD_MAPPING[key] ?? key;
  const val = data[fieldName]?.trim();
  return val || undefined;
}

export function buildLeadPayload(
  lead: LeadWithRelations,
  event: AutoresponderTrigger,
  fieldMapping?: Record<string, string> | null,
): LeadAutoresponderPayload | null {
  const data = lead.data as Record<string, string>;
  const mapping = { ...DEFAULT_FIELD_MAPPING, ...(fieldMapping ?? {}) };
  const email = pickField(data, mapping, "email")?.toLowerCase();
  if (!email) return null;

  return {
    event: triggerToPayloadEvent(event),
    leadId: lead.id,
    email,
    firstName: pickField(data, mapping, "firstName"),
    lastName: pickField(data, mapping, "lastName"),
    phone: pickField(data, mapping, "phone"),
    country: lead.country ?? pickField(data, mapping, "country"),
    campaign: { id: lead.campaign.id, name: lead.campaign.name },
    publisher: { id: lead.publisher.id },
    source: lead.source ?? undefined,
    subId: lead.subId ?? undefined,
    submittedAt: lead.createdAt.toISOString(),
  };
}
