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
      return "GetResponse list ID is invalid. Reload lists and choose the list again.";
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

export type GetResponseCampaignOption = {
  campaignId: string;
  name: string;
};

function getResponseHeaders(apiKey: string): HeadersInit {
  return {
    "X-Auth-Token": `api-key ${apiKey.trim()}`,
    "Content-Type": "application/json",
  };
}

function tokenFromHref(href?: string): string {
  const match = href?.match(/\/campaigns\/([^/?#]+)/i);
  return match?.[1]?.trim() ?? "";
}

function isValidCampaignId(id: string): boolean {
  return id.length > 0;
}

async function fetchGetResponseCampaignDetails(
  apiKey: string,
  campaignRef: string,
): Promise<{ campaignId?: string; name?: string; href?: string } | null> {
  try {
    const res = await fetch(
      `https://api.getresponse.com/v3/campaigns/${encodeURIComponent(campaignRef)}`,
      {
        method: "GET",
        headers: getResponseHeaders(apiKey),
        signal: AbortSignal.timeout(DEFAULT_AUTORESPONDER_PLATFORM_CONFIG.requestTimeoutMs),
      },
    );
    if (!res.ok) return null;
    return (await res.json()) as { campaignId?: string; name?: string; href?: string };
  } catch {
    return null;
  }
}

async function resolveCampaignOption(
  apiKey: string,
  row: { campaignId?: string; name?: string; href?: string },
): Promise<GetResponseCampaignOption | null> {
  const name = row.name?.trim();
  if (!name) return null;

  const raw = row.campaignId?.trim() ?? "";
  const hrefId = tokenFromHref(row.href);

  if (isValidCampaignId(raw)) return { campaignId: raw, name };
  if (isValidCampaignId(hrefId)) return { campaignId: hrefId, name };

  const lookupRef = raw || hrefId;
  if (!lookupRef) return null;

  const detail = await fetchGetResponseCampaignDetails(apiKey, lookupRef);
  const detailToken = detail?.campaignId?.trim() ?? "";
  if (isValidCampaignId(detailToken)) {
    return { campaignId: detailToken, name: detail.name?.trim() || name };
  }

  const detailHrefToken = tokenFromHref(detail?.href);
  if (isValidCampaignId(detailHrefToken)) {
    return { campaignId: detailHrefToken, name: detail.name?.trim() || name };
  }

  return null;
}

export async function normalizeGetResponseConfig(
  config: GetResponseConfig,
): Promise<GetResponseConfig> {
  const apiKey = config.apiKey?.trim();
  const campaignRef = resolveCampaignId(config);
  if (!apiKey || !campaignRef) return config;

  const detail = await fetchGetResponseCampaignDetails(apiKey, campaignRef);
  const detailToken = detail?.campaignId?.trim() ?? "";
  if (isValidCampaignId(detailToken)) {
    return { ...config, campaignId: detailToken };
  }

  const detailHrefToken = tokenFromHref(detail?.href);
  if (isValidCampaignId(detailHrefToken)) {
    return { ...config, campaignId: detailHrefToken };
  }

  const listed = await listGetResponseCampaigns(apiKey);
  if (listed.ok) {
    const byId = listed.campaigns.find((row) => row.campaignId === campaignRef);
    if (byId) return { ...config, campaignId: byId.campaignId };
    const byName = listed.campaigns.find((row) => row.name === campaignRef);
    if (byName) return { ...config, campaignId: byName.campaignId };
  }

  return config;
}

export async function listGetResponseCampaigns(
  apiKey: string,
): Promise<{ ok: true; campaigns: GetResponseCampaignOption[] } | { ok: false; error: string }> {
  const key = apiKey.trim();
  if (!key) {
    return { ok: false, error: "GetResponse API key is required" };
  }

  try {
    const res = await fetch("https://api.getresponse.com/v3/campaigns", {
      method: "GET",
      headers: getResponseHeaders(key),
      signal: AbortSignal.timeout(DEFAULT_AUTORESPONDER_PLATFORM_CONFIG.requestTimeoutMs),
    });

    if (!res.ok) {
      const text = (await res.text()).slice(0, 500);
      return { ok: false, error: formatGetResponseError(text, res.status) };
    }

    const data = (await res.json()) as Array<{
      campaignId?: string;
      name?: string;
      href?: string;
    }>;
    const rows = Array.isArray(data) ? data : [];
    const campaigns = (
      await Promise.all(rows.map((row) => resolveCampaignOption(key, row)))
    ).filter((row): row is GetResponseCampaignOption => row !== null);

    if (campaigns.length === 0) {
      return {
        ok: false,
        error:
          "No usable GetResponse lists found. Check your API key has access to at least one list.",
      };
    }

    return { ok: true, campaigns };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to load GetResponse lists",
    };
  }
}

/** Lightweight check that the list token exists for this API key (used when creating a connection). */
export async function verifyGetResponseConfig(
  config: GetResponseConfig,
): Promise<ProviderSendResult> {
  const apiKey = config.apiKey?.trim();
  const normalized = await normalizeGetResponseConfig(config);
  const campaignId = resolveCampaignId(normalized);

  if (!apiKey || !campaignId) {
    return { ok: false, error: "GetResponse API key and list ID are required" };
  }

  try {
    const res = await fetch(`https://api.getresponse.com/v3/campaigns/${encodeURIComponent(campaignId)}`, {
      method: "GET",
      headers: getResponseHeaders(apiKey),
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
