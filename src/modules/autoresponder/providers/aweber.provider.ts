import type { AweberConfig } from "../types/provider";
import type { LeadAutoresponderPayload, ProviderSendResult } from "../types/payload";
import { DEFAULT_AUTORESPONDER_PLATFORM_CONFIG } from "../config/defaults";

export async function sendAweber(
  config: AweberConfig,
  payload: LeadAutoresponderPayload,
): Promise<ProviderSendResult> {
  const { accessToken, accountId, listId } = config;
  if (!accessToken || !accountId || !listId) {
    return { ok: false, error: "AWeber accessToken, accountId, and listId are required" };
  }

  const url = `https://api.aweber.com/1.0/accounts/${accountId}/lists/${listId}/subscribers`;
  const body = {
    email: payload.email,
    name: [payload.firstName, payload.lastName].filter(Boolean).join(" ") || undefined,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
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
      error: err instanceof Error ? err.message : "AWeber request failed",
    };
  }
}
