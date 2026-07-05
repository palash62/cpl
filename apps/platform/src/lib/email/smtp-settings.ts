import { PLATFORM_EMAILS } from "@/lib/email/addresses";

export const SMTP_SETTINGS_KEY = "smtp_config";

export type SmtpConfigStored = {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
  adminAlertEmail?: string;
  supportEmail?: string;
  appUrl?: string;
};

export type EmailConfig = {
  enabled: boolean;
  host?: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
  adminAlertEmail?: string;
  supportEmail?: string;
  appUrl: string;
  source: "database" | "environment" | "none";
};

export type SmtpSettingsApi = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  passConfigured: boolean;
  from: string;
  adminAlertEmail: string;
  supportEmail: string;
  appUrl: string;
  enabled: boolean;
  source: EmailConfig["source"];
};

function envConfig(): Omit<EmailConfig, "source"> {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM?.trim() || PLATFORM_EMAILS.fromDisplay;
  const adminAlertEmail = process.env.ADMIN_ALERT_EMAIL?.trim() || PLATFORM_EMAILS.admin;
  const supportEmail = process.env.SUPPORT_EMAIL?.trim() || PLATFORM_EMAILS.support;
  const appUrl =
    process.env.APP_URL?.trim() || process.env.AUTH_URL?.trim() || "http://localhost:3000";

  return {
    enabled: Boolean(host),
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    user,
    pass,
    from,
    adminAlertEmail,
    supportEmail,
    appUrl,
  };
}

export function parseSmtpConfigStored(value: unknown): SmtpConfigStored | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const port = Number(raw.port);
  return {
    host: typeof raw.host === "string" ? raw.host.trim() : undefined,
    port: Number.isFinite(port) ? port : undefined,
    secure: typeof raw.secure === "boolean" ? raw.secure : raw.secure === "true",
    user: typeof raw.user === "string" ? raw.user.trim() : undefined,
    pass: typeof raw.pass === "string" ? raw.pass : undefined,
    from: typeof raw.from === "string" ? raw.from.trim() : undefined,
    adminAlertEmail:
      typeof raw.adminAlertEmail === "string" ? raw.adminAlertEmail.trim() : undefined,
    supportEmail:
      typeof raw.supportEmail === "string" ? raw.supportEmail.trim() : undefined,
    appUrl: typeof raw.appUrl === "string" ? raw.appUrl.trim() : undefined,
  };
}

export function mergeEmailConfig(stored: SmtpConfigStored | null): EmailConfig {
  const env = envConfig();

  if (stored?.host) {
    return {
      enabled: true,
      host: stored.host,
      port: stored.port ?? 587,
      secure: Boolean(stored.secure),
      user: stored.user,
      pass: stored.pass,
      from: stored.from || env.from,
      adminAlertEmail: stored.adminAlertEmail || env.adminAlertEmail,
      supportEmail: stored.supportEmail || env.supportEmail,
      appUrl: stored.appUrl || env.appUrl,
      source: "database",
    };
  }

  if (env.host) {
    return { ...env, source: "environment" };
  }

  return { ...env, enabled: false, source: "none" };
}

export function smtpConfigToApi(config: EmailConfig, passConfigured: boolean): SmtpSettingsApi {
  return {
    host: config.host ?? "",
    port: config.port,
    secure: config.secure,
    user: config.user ?? "",
    pass: "",
    passConfigured,
    from: config.from,
    adminAlertEmail: config.adminAlertEmail ?? "",
    supportEmail: config.supportEmail ?? "",
    appUrl: config.appUrl,
    enabled: config.enabled,
    source: config.source,
  };
}

export function normalizeSmtpInput(data: {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
  adminAlertEmail?: string;
  supportEmail?: string;
  appUrl?: string;
}): SmtpConfigStored {
  return {
    host: data.host?.trim() || undefined,
    port: data.port,
    secure: Boolean(data.secure),
    user: data.user?.trim() || undefined,
    pass: data.pass?.length ? data.pass : undefined,
    from: data.from?.trim() || undefined,
    adminAlertEmail: data.adminAlertEmail?.trim() || undefined,
    supportEmail: data.supportEmail?.trim() || undefined,
    appUrl: data.appUrl?.trim() || undefined,
  };
}
