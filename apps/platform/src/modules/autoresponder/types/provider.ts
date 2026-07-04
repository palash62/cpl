export type WebhookConfig = {
  url: string;
  method?: "POST" | "PUT";
  headers?: Record<string, string>;
  secret?: string;
};

export type MailchimpConfig = {
  apiKey: string;
  serverPrefix: string;
  listId: string;
  tags?: string[];
};

export type AweberConfig = {
  accessToken: string;
  accountId: string;
  listId: string;
};

export type GetResponseConfig = {
  apiKey: string;
  campaignId: string;
};

export type ConnectionConfig =
  | WebhookConfig
  | MailchimpConfig
  | AweberConfig
  | GetResponseConfig;
