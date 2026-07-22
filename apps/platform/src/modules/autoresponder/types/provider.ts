export type WebhookConfig = {
  url: string;
  method?: "POST" | "PUT";
  headers?: Record<string, string>;
  secret?: string;
  /** Optional JSON template with {{placeholders}}. Empty → default CPL payload. */
  bodyTemplate?: string;
};

export type MailchimpConfig = {
  apiKey: string;
  serverPrefix: string;
  listId: string;
  tags?: string[];
};

export type AweberConfig = {
  /** Filled from OAuth session on create/update when omitted from the form */
  accessToken?: string;
  accountId?: string;
  listId: string;
  refreshToken?: string;
  /** Access-token expiry (epoch ms) */
  tokenExpiresAt?: number;
};

export type GetResponseConfig = {
  apiKey: string;
  /** GetResponse list token (API name: campaignId) */
  campaignId: string;
  /** Alias accepted from forms / older configs */
  listId?: string;
};

export type SystemeConfig = {
  apiKey: string;
  /** Optional tag id to attach after contact creation */
  tagId?: string;
};

export type ConnectionConfig =
  | WebhookConfig
  | MailchimpConfig
  | AweberConfig
  | GetResponseConfig
  | SystemeConfig;
