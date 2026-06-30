import type { AutoresponderProvider } from "@prisma/client";
import type { ConnectionConfig } from "../types/provider";
import type { LeadAutoresponderPayload } from "../types/payload";
import type { ProviderSendResult } from "../types/payload";
import { sendWebhook } from "./webhook.provider";
import { sendMailchimp } from "./mailchimp.provider";
import { sendAweber } from "./aweber.provider";
import { sendGetResponse } from "./getresponse.provider";

export async function sendViaProvider(
  provider: AutoresponderProvider,
  config: ConnectionConfig,
  payload: LeadAutoresponderPayload,
): Promise<ProviderSendResult> {
  switch (provider) {
    case "WEBHOOK":
      return sendWebhook(config as never, payload);
    case "MAILCHIMP":
      return sendMailchimp(config as never, payload);
    case "AWEBER":
      return sendAweber(config as never, payload);
    case "GETRESPONSE":
      return sendGetResponse(config as never, payload);
    default:
      return { ok: false, error: "Unknown provider" };
  }
}
