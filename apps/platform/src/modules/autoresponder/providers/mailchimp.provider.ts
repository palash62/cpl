import { createHash } from "crypto";
import type { MailchimpConfig } from "../types/provider";
import type { LeadAutoresponderPayload, ProviderSendResult } from "../types/payload";
import { DEFAULT_AUTORESPONDER_PLATFORM_CONFIG } from "../config/defaults";

export async function sendMailchimp(
  config: MailchimpConfig,
  payload: LeadAutoresponderPayload,
): Promise<ProviderSendResult> {
  const { apiKey, serverPrefix, listId, tags } = config;
  if (!apiKey || !serverPrefix || !listId) {
    return { ok: false, error: "Mailchimp apiKey, serverPrefix, and listId are required" };
  }

  const subscriberHash = createHash("md5").update(payload.email.toLowerCase()).digest("hex");
  const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`;

  const body = {
    email_address: payload.email,
    status: "subscribed",
    merge_fields: {
      FNAME: payload.firstName ?? "",
      LNAME: payload.lastName ?? "",
      PHONE: payload.phone ?? "",
    },
    tags: tags ?? [],
  };

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `apikey ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(DEFAULT_AUTORESPONDER_PLATFORM_CONFIG.requestTimeoutMs),
    });

    if (!res.ok) {
      const text = (await res.text()).slice(0, 500);
      return { ok: false, httpStatus: res.status, error: text || res.statusText };
    }

    return { ok: true, httpStatus: res.status };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Mailchimp request failed",
    };
  }
}
