import type { GetResponseConfig } from "../types/provider";
import type { LeadAutoresponderPayload, ProviderSendResult } from "../types/payload";
import { DEFAULT_AUTORESPONDER_PLATFORM_CONFIG } from "../config/defaults";

export async function sendGetResponse(
  config: GetResponseConfig,
  payload: LeadAutoresponderPayload,
): Promise<ProviderSendResult> {
  const { apiKey, campaignId } = config;
  if (!apiKey || !campaignId) {
    return { ok: false, error: "GetResponse apiKey and campaignId are required" };
  }

  const body = {
    email: payload.email,
    name: [payload.firstName, payload.lastName].filter(Boolean).join(" ") || payload.email,
    campaign: { campaignId },
    dayOfCycle: 0,
  };

  try {
    const res = await fetch("https://api.getresponse.com/v3/contacts", {
      method: "POST",
      headers: {
        "X-Auth-Token": `api-key ${apiKey}`,
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
      error: err instanceof Error ? err.message : "GetResponse request failed",
    };
  }
}
