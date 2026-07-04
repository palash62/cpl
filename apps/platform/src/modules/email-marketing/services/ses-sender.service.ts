import {
  SESv2Client,
  SendEmailCommand,
  type SendEmailCommandInput,
} from "@aws-sdk/client-sesv2";
import { getResolvedSesConfig } from "@/services/ses-settings.service";

let cachedClient: SESv2Client | null = null;
let cachedKey: string | null = null;

function getClient(config: Awaited<ReturnType<typeof getResolvedSesConfig>>) {
  const key = [config.region, config.accessKeyId, config.secretAccessKey].join("|");
  if (cachedClient && cachedKey === key) return cachedClient;

  cachedClient = new SESv2Client({
    region: config.region,
    credentials:
      config.accessKeyId && config.secretAccessKey
        ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          }
        : undefined,
  });
  cachedKey = key;
  return cachedClient;
}

export type MarketingEmailInput = {
  to: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  listUnsubscribeUrl: string;
};

export type MarketingEmailResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

export async function sendMarketingEmail(
  input: MarketingEmailInput,
): Promise<MarketingEmailResult> {
  const config = await getResolvedSesConfig();

  if (!config.enabled) {
    console.info("[email-marketing] SES not configured — skipping send to", input.to);
    return { ok: false, error: "SES not configured" };
  }

  const from = `"${input.fromName.replace(/"/g, '\\"')}" <${input.fromEmail}>`;

  const commandInput: SendEmailCommandInput = {
    FromEmailAddress: from,
    Destination: { ToAddresses: [input.to] },
    Content: {
      Simple: {
        Subject: { Data: input.subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: input.html, Charset: "UTF-8" },
          ...(input.text ? { Text: { Data: input.text, Charset: "UTF-8" } } : {}),
        },
        Headers: [
          {
            Name: "List-Unsubscribe",
            Value: `<${input.listUnsubscribeUrl}>`,
          },
          {
            Name: "List-Unsubscribe-Post",
            Value: "List-Unsubscribe=One-Click",
          },
        ],
      },
    },
    ...(input.replyTo ? { ReplyToAddresses: [input.replyTo] } : {}),
    ...(config.configurationSet
      ? { ConfigurationSetName: config.configurationSet }
      : {}),
  };

  try {
    const client = getClient(config);
    const result = await client.send(new SendEmailCommand(commandInput));
    return { ok: true, messageId: result.MessageId ?? "unknown" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "SES send failed";
    console.error("[email-marketing] SES error:", message);
    return { ok: false, error: message };
  }
}

export function buildFromAddress(fromName: string, fromEmail: string): { fromName: string; fromEmail: string } {
  return { fromName, fromEmail };
}

export async function getDefaultFromEmail(): Promise<string> {
  const config = await getResolvedSesConfig();
  return config.fromEmail;
}
