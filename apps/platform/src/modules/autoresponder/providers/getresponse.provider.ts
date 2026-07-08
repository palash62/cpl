import type { GetResponseConfig } from "../types/provider";
import type { LeadAutoresponderPayload, ProviderSendResult } from "../types/payload";
import { DEFAULT_AUTORESPONDER_PLATFORM_CONFIG } from "../config/defaults";

function resolveCampaignId(config: GetResponseConfig): string {
  const raw = (config.campaignId || config.listId || "").trim();
  return raw;
}

function formatGetResponseError(text: string, status: number): string {
  try {
    const json = JSON.parse(text) as {
      message?: string;
      code?: number;
      codeDescription?: string;
    };
    if (json.message?.toLowerCase().includes("campaign is invalid")) {
      return (
        "GetResponse list ID is invalid. Use the alphanumeric campaign token from " +
        "GetResponse → Lists / Campaigns (not the numeric campaign number)."
      );
    }
    if (json.message) return `GetResponse: ${json.message}`;
    if (json.codeDescription) return `GetResponse: ${json.codeDescription}`;
  } catch {
    // keep raw text below
  }
  return text.slice(0, 300) || `GetResponse request failed (${status})`;
}

export async function sendGetResponse(
  config: GetResponseConfig,
  payload: LeadAutoresponderPayload,
): Promise<ProviderSendResult> {
  const apiKey = config.apiKey?.trim();
  const campaignId = resolveCampaignId(config);

  if (!apiKey || !campaignId) {
    return { ok: false, error: "GetResponse API key and list ID are required" };
  }

  if (/^\d+$/.test(campaignId)) {
    return {
      ok: false,
      error:
        "GetResponse list ID looks numeric. Use the alphanumeric campaign token shown under the list name in GetResponse (API → Campaigns), not the 8-digit number.",
    };
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

    // 202 = queued successfully; 409 = contact already on the list
    if (res.ok || res.status === 202 || res.status === 409) {
      return { ok: true, httpStatus: res.status };
    }

    const text = (await res.text()).slice(0, 500);
    return { ok: false, httpStatus: res.status, error: formatGetResponseError(text, res.status) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "GetResponse request failed",
    };
  }
}

/** Lightweight check that the list token exists for this API key (used when creating a connection). */
export async function verifyGetResponseConfig(
  config: GetResponseConfig,
): Promise<ProviderSendResult> {
  const apiKey = config.apiKey?.trim();
  const campaignId = resolveCampaignId(config);

  if (!apiKey || !campaignId) {
    return { ok: false, error: "GetResponse API key and list ID are required" };
  }

  if (/^\d+$/.test(campaignId)) {
    return {
      ok: false,
      error:
        "GetResponse list ID looks numeric. Use the alphanumeric campaign token shown under the list name in GetResponse, not the 8-digit number.",
    };
  }

  try {
    const res = await fetch(`https://api.getresponse.com/v3/campaigns/${encodeURIComponent(campaignId)}`, {
      method: "GET",
      headers: {
        "X-Auth-Token": `api-key ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(DEFAULT_AUTORESPONDER_PLATFORM_CONFIG.requestTimeoutMs),
    });

    if (res.ok) return { ok: true, httpStatus: res.status };

    const text = (await res.text()).slice(0, 500);
    return { ok: false, httpStatus: res.status, error: formatGetResponseError(text, res.status) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "GetResponse verification failed",
    };
  }
}
