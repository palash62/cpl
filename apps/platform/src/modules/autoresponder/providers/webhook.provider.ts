import { createHmac } from "crypto";
import type { WebhookConfig } from "../types/provider";
import type { LeadAutoresponderPayload, ProviderSendResult } from "../types/payload";
import { DEFAULT_AUTORESPONDER_PLATFORM_CONFIG } from "../config/defaults";

export async function sendWebhook(
  config: WebhookConfig,
  payload: LeadAutoresponderPayload,
): Promise<ProviderSendResult> {
  if (!config.url?.trim()) {
    return { ok: false, error: "Webhook URL is required" };
  }

  const method = config.method ?? "POST";
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(config.headers ?? {}),
  };

  if (config.secret) {
    const sig = createHmac("sha256", config.secret).update(body).digest("hex");
    headers["X-CPL-Signature"] = sig;
  }

  try {
    const res = await fetch(config.url, {
      method,
      headers,
      body,
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
      error: err instanceof Error ? err.message : "Webhook request failed",
    };
  }
}
