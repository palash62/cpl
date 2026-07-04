import type { AutoresponderProvider } from "@prisma/client";

export const AUTORESPONDER_SETTINGS_KEY = "autoresponder_config";

export const DEFAULT_AUTORESPONDER_PLATFORM_CONFIG = {
  maxConnectionsPerAdvertiser: 5,
  enabledProviders: [
    "WEBHOOK",
    "MAILCHIMP",
    "AWEBER",
    "GETRESPONSE",
  ] as AutoresponderProvider[],
  retryDelayMs: 2000,
  requestTimeoutMs: 5000,
};

export const DEFAULT_FIELD_MAPPING: Record<string, string> = {
  email: "email",
  firstName: "first_name",
  lastName: "last_name",
  phone: "phone",
  country: "country",
};
