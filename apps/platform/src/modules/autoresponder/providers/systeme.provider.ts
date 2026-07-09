import type { SystemeConfig } from "../types/provider";
import type { LeadAutoresponderPayload, ProviderSendResult } from "../types/payload";
import { DEFAULT_AUTORESPONDER_PLATFORM_CONFIG } from "../config/defaults";

type SystemeContactResponse = {
  id?: string | number;
};

function getSystemeHeaders(apiKey: string): HeadersInit {
  return {
    "X-API-Key": apiKey,
    "Content-Type": "application/json",
    accept: "application/json",
  };
}

export async function sendSysteme(
  config: SystemeConfig,
  payload: LeadAutoresponderPayload,
): Promise<ProviderSendResult> {
  const apiKey = config.apiKey?.trim();
  if (!apiKey) {
    return { ok: false, error: "Systeme.io API key is required" };
  }

  const fields: Array<{ slug: string; value: string }> = [];
  if (payload.firstName) fields.push({ slug: "first_name", value: payload.firstName });
  if (payload.lastName) fields.push({ slug: "last_name", value: payload.lastName });
  if (payload.phone) fields.push({ slug: "phone_number", value: payload.phone });

  try {
    const createContactRes = await fetch("https://api.systeme.io/api/contacts", {
      method: "POST",
      headers: getSystemeHeaders(apiKey),
      body: JSON.stringify({
        email: payload.email,
        locale: "en",
        ...(fields.length > 0 ? { fields } : {}),
      }),
      signal: AbortSignal.timeout(DEFAULT_AUTORESPONDER_PLATFORM_CONFIG.requestTimeoutMs),
    });

    if (!createContactRes.ok) {
      const text = (await createContactRes.text()).slice(0, 500);
      return { ok: false, httpStatus: createContactRes.status, error: text || createContactRes.statusText };
    }

    const contact = (await createContactRes.json().catch(() => ({}))) as SystemeContactResponse;
    const contactId = contact.id;
    const tagId = config.tagId?.trim();

    if (!tagId) {
      return { ok: true, httpStatus: createContactRes.status };
    }
    if (!contactId) {
      return {
        ok: false,
        httpStatus: createContactRes.status,
        error: "Systeme.io contact created but contact id missing for tag assignment",
      };
    }

    const assignTagRes = await fetch(`https://api.systeme.io/api/contacts/${encodeURIComponent(String(contactId))}/tags`, {
      method: "POST",
      headers: getSystemeHeaders(apiKey),
      body: JSON.stringify({ tagId: Number(tagId) }),
      signal: AbortSignal.timeout(DEFAULT_AUTORESPONDER_PLATFORM_CONFIG.requestTimeoutMs),
    });

    if (!assignTagRes.ok) {
      const text = (await assignTagRes.text()).slice(0, 500);
      return { ok: false, httpStatus: assignTagRes.status, error: text || assignTagRes.statusText };
    }

    return { ok: true, httpStatus: assignTagRes.status };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Systeme.io request failed",
    };
  }
}
