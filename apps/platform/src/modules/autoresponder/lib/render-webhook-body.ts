import type { LeadAutoresponderPayload } from "../types/payload";

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

function readPath(payload: LeadAutoresponderPayload, path: string): string {
  const parts = path.split(".");
  let current: unknown = payload;

  for (const part of parts) {
    if (current == null || typeof current !== "object") return "";
    current = (current as Record<string, unknown>)[part];
  }

  if (current == null) return "";
  if (typeof current === "string" || typeof current === "number" || typeof current === "boolean") {
    return String(current);
  }
  return "";
}

/** Escape a value for safe insertion into a JSON string literal context. */
function jsonStringEscape(value: string): string {
  return JSON.stringify(value).slice(1, -1);
}

/**
 * Render an optional webhook body template.
 * Empty template → stringify the default CPL payload.
 * Placeholders use {{email}}, {{campaign.name}}, etc.
 */
export function renderWebhookBody(
  template: string | undefined | null,
  payload: LeadAutoresponderPayload,
): { ok: true; body: string } | { ok: false; error: string } {
  const trimmed = template?.trim() ?? "";
  if (!trimmed) {
    return { ok: true, body: JSON.stringify(payload) };
  }

  const rendered = trimmed.replace(PLACEHOLDER_RE, (_match, path: string) =>
    jsonStringEscape(readPath(payload, path)),
  );

  try {
    const parsed = JSON.parse(rendered) as unknown;
    return { ok: true, body: JSON.stringify(parsed) };
  } catch {
    return {
      ok: false,
      error:
        "Custom JSON body is invalid after placeholders were filled. Check that the template is valid JSON.",
    };
  }
}

export const WEBHOOK_BODY_PLACEHOLDERS = [
  "email",
  "firstName",
  "lastName",
  "phone",
  "country",
  "campaign.id",
  "campaign.name",
  "publisher.id",
  "source",
  "subId",
  "leadId",
  "event",
  "submittedAt",
] as const;
