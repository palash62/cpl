import type { SystemeConfig } from "../types/provider";
import type { LeadAutoresponderPayload, ProviderSendResult } from "../types/payload";
import { DEFAULT_AUTORESPONDER_PLATFORM_CONFIG } from "../config/defaults";

type SystemeContactResponse = {
  id?: string | number;
};

type SystemeErrorResponse = {
  detail?: string;
  title?: string;
  violations?: Array<{ message?: string; propertyPath?: string }>;
};

function getSystemeHeaders(apiKey: string): HeadersInit {
  return {
    "X-API-Key": apiKey,
    "Content-Type": "application/json",
    accept: "application/json",
  };
}

function formatSystemeError(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as SystemeErrorResponse;
    const violation = parsed.violations?.find((item) => item.message)?.message;
    if (violation) return violation;
    if (parsed.detail) return parsed.detail;
    if (parsed.title) return parsed.title;
  } catch {
    // Fall back to raw body below.
  }
  return body.trim() || `Systeme.io request failed (${status})`;
}

/** Lightweight check that the API key (and optional tag) are valid before saving a connection. */
export async function verifySystemeConfig(config: SystemeConfig): Promise<ProviderSendResult> {
  const apiKey = config.apiKey?.trim();
  const tagId = config.tagId?.trim();

  if (!apiKey) {
    return { ok: false, error: "Systeme.io API key is required" };
  }

  try {
    const contactsRes = await fetch("https://api.systeme.io/api/contacts?limit=10", {
      method: "GET",
      headers: getSystemeHeaders(apiKey),
      signal: AbortSignal.timeout(DEFAULT_AUTORESPONDER_PLATFORM_CONFIG.requestTimeoutMs),
    });

    if (!contactsRes.ok) {
      const text = (await contactsRes.text()).slice(0, 500);
      if (contactsRes.status === 401 || contactsRes.status === 403) {
        return { ok: false, httpStatus: contactsRes.status, error: "Systeme.io API key is invalid or expired" };
      }
      return {
        ok: false,
        httpStatus: contactsRes.status,
        error: formatSystemeError(contactsRes.status, text),
      };
    }

    if (!tagId) {
      return { ok: true, httpStatus: contactsRes.status };
    }

    const tagRes = await fetch(`https://api.systeme.io/api/tags/${encodeURIComponent(tagId)}`, {
      method: "GET",
      headers: getSystemeHeaders(apiKey),
      signal: AbortSignal.timeout(DEFAULT_AUTORESPONDER_PLATFORM_CONFIG.requestTimeoutMs),
    });

    if (!tagRes.ok) {
      const text = (await tagRes.text()).slice(0, 500);
      return {
        ok: false,
        httpStatus: tagRes.status,
        error:
          tagRes.status === 404
            ? `Systeme.io tag ID ${tagId} was not found in your account`
            : formatSystemeError(tagRes.status, text),
      };
    }

    return { ok: true, httpStatus: tagRes.status };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Systeme.io verification failed",
    };
  }
}

export function buildSystemeTestEmail(advertiserEmail?: string | null): string {
  const stamp = Date.now();
  if (advertiserEmail?.includes("@")) {
    const [local, domain] = advertiserEmail.split("@");
    if (local && domain) {
      return `${local}+cpl-test-${stamp}@${domain}`;
    }
  }
  return `cpl-test-${stamp}@mailinator.com`;
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
  if (payload.lastName) fields.push({ slug: "surname", value: payload.lastName });
  if (payload.phone) fields.push({ slug: "phone_number", value: payload.phone });
  if (payload.country) fields.push({ slug: "country", value: payload.country });

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
      return {
        ok: false,
        httpStatus: createContactRes.status,
        error: formatSystemeError(createContactRes.status, text),
      };
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
      return {
        ok: false,
        httpStatus: assignTagRes.status,
        error: formatSystemeError(assignTagRes.status, text),
      };
    }

    return { ok: true, httpStatus: assignTagRes.status };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Systeme.io request failed",
    };
  }
}
