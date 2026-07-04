import {
  mergeEmailConfig,
  type EmailConfig,
} from "@/lib/email/smtp-settings";

/** Sync env-only config (legacy). Prefer getResolvedEmailConfig() for sending mail. */
export function getEmailConfig(): EmailConfig {
  return mergeEmailConfig(null);
}

export type { EmailConfig };