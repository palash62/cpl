import type { AweberConfig } from "../types/provider";
import type { LeadAutoresponderPayload, ProviderSendResult } from "../types/payload";
import { DEFAULT_AUTORESPONDER_PLATFORM_CONFIG } from "../config/defaults";
import { ensureFreshAweberAccessToken } from "./aweber-oauth";

export async function sendAweber(
  config: AweberConfig,
  payload: LeadAutoresponderPayload,
): Promise<ProviderSendResult> {
  const { accountId, listId } = config;
  if (!config.accessToken || !accountId || !listId) {
    return { ok: false, error: "AWeber accessToken, accountId, and listId are required" };
  }

  let accessToken = config.accessToken;
  let refreshedAweberConfig: ProviderSendResult["refreshedAweberConfig"];

  try {
    const fresh = await ensureFreshAweberAccessToken({
      accessToken: config.accessToken,
      refreshToken: config.refreshToken,
      tokenExpiresAt: config.tokenExpiresAt,
    });
    accessToken = fresh.accessToken;
    if (fresh.refreshed) {
      refreshedAweberConfig = {
        accessToken: fresh.accessToken,
        refreshToken: fresh.refreshToken,
        tokenExpiresAt: fresh.tokenExpiresAt,
      };
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "AWeber token refresh failed",
    };
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
      return {
        ok: false,
        httpStatus: res.status,
        error: text || res.statusText,
        refreshedAweberConfig,
      };
    }

    return { ok: true, httpStatus: res.status, refreshedAweberConfig };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "AWeber request failed",
      refreshedAweberConfig,
    };
  }
}
