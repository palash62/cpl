import { createHmac } from "crypto";
import type { WebhookConfig } from "../types/provider";
import type { LeadAutoresponderPayload, ProviderSendResult } from "../types/payload";
import { DEFAULT_AUTORESPONDER_PLATFORM_CONFIG } from "../config/defaults";
import { assertSafeOutboundUrl } from "@/lib/safe-url";
import { renderWebhookBody } from "../lib/render-webhook-body";

export async function sendWebhook(
  config: WebhookConfig,
  payload: LeadAutoresponderPayload,
): Promise<ProviderSendResult> {
  if (!config.url?.trim()) {
    return { ok: false, error: "Webhook URL is required" };
  }

  let safeUrl: URL;
  try {
    safeUrl = await assertSafeOutboundUrl(config.url.trim());
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Webhook URL is not allowed",
    };
  }

  const rendered = renderWebhookBody(config.bodyTemplate, payload);
  if (!rendered.ok) {
    return { ok: false, error: rendered.error };
  }

  const method = config.method ?? "POST";
  const body = rendered.body;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(config.headers ?? {}),
  };

  if (config.secret) {
    const sig = createHmac("sha256", config.secret).update(body).digest("hex");
    headers["X-CPL-Signature"] = sig;
  }

  try {
    const res = await fetch(safeUrl.toString(), {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(DEFAULT_AUTORESPONDER_PLATFORM_CONFIG.requestTimeoutMs),
      redirect: "manual",
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
