/** Platform sender/recipient addresses for leadvix.io (overridable via env). */
export const PLATFORM_EMAILS = {
  noreply: process.env.SES_FROM_EMAIL?.trim() || "noreply@mg.leadvix.io",
  support: process.env.SUPPORT_EMAIL?.trim() || "support@leadvix.io",
  admin: process.env.ADMIN_ALERT_EMAIL?.trim() || "admin@leadvix.io",
  fromDisplay:
    process.env.MAILGUN_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    "LeadVix <noreply@mg.leadvix.io>",
} as const;

export function formatSupportFrom(email: string) {
  return `LeadVix <${email.trim()}>`;
}
