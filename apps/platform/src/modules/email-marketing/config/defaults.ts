import type { EmailMarketingPlatformConfig } from "@/lib/email/ses-settings";
import { DEFAULT_EMAIL_MARKETING_CONFIG } from "@/lib/email/ses-settings";

export { DEFAULT_EMAIL_MARKETING_CONFIG };
export type { EmailMarketingPlatformConfig };

export const MERGE_TAGS = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "campaign_name",
  "company_name",
  "unsubscribe_url",
] as const;

export const QUEUE_NAME = "email-sends";
export const MAX_SEND_ATTEMPTS = 3;
