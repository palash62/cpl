export const SES_SETTINGS_KEY = "ses_config";
export const EMAIL_MARKETING_CONFIG_KEY = "email_marketing_config";

export type SesConfigStored = {
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  fromDomain?: string;
  fromEmail?: string;
  configurationSet?: string;
  appUrl?: string;
};

export type SesConfig = {
  enabled: boolean;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  fromDomain: string;
  fromEmail: string;
  configurationSet?: string;
  appUrl: string;
  source: "database" | "environment" | "none";
};

export type SesSettingsApi = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  secretConfigured: boolean;
  fromDomain: string;
  fromEmail: string;
  configurationSet: string;
  appUrl: string;
  enabled: boolean;
  source: SesConfig["source"];
};

export type EmailMarketingPlatformConfig = {
  enabled: boolean;
  maxAutomationsPerAdvertiser: number;
  maxSendsPerDay: number;
};

export const DEFAULT_EMAIL_MARKETING_CONFIG: EmailMarketingPlatformConfig = {
  enabled: true,
  maxAutomationsPerAdvertiser: 10,
  maxSendsPerDay: 5000,
};

function envSesConfig(): Omit<SesConfig, "source"> {
  const region = process.env.AWS_REGION?.trim() || "us-east-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const fromDomain = process.env.SES_FROM_DOMAIN?.trim() || "";
  const fromEmail =
    process.env.SES_FROM_EMAIL?.trim() ||
    (fromDomain ? `noreply@${fromDomain}` : "noreply@localhost");
  const configurationSet = process.env.SES_CONFIGURATION_SET?.trim();
  const appUrl =
    process.env.APP_URL?.trim() || process.env.AUTH_URL?.trim() || "http://localhost:3000";

  return {
    enabled: Boolean(accessKeyId && secretAccessKey && fromDomain),
    region,
    accessKeyId,
    secretAccessKey,
    fromDomain,
    fromEmail,
    configurationSet,
    appUrl,
  };
}

export function parseSesConfigStored(value: unknown): SesConfigStored | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  return {
    region: typeof raw.region === "string" ? raw.region.trim() : undefined,
    accessKeyId: typeof raw.accessKeyId === "string" ? raw.accessKeyId.trim() : undefined,
    secretAccessKey:
      typeof raw.secretAccessKey === "string" ? raw.secretAccessKey : undefined,
    fromDomain: typeof raw.fromDomain === "string" ? raw.fromDomain.trim() : undefined,
    fromEmail: typeof raw.fromEmail === "string" ? raw.fromEmail.trim() : undefined,
    configurationSet:
      typeof raw.configurationSet === "string" ? raw.configurationSet.trim() : undefined,
    appUrl: typeof raw.appUrl === "string" ? raw.appUrl.trim() : undefined,
  };
}

export function mergeSesConfig(stored: SesConfigStored | null): SesConfig {
  const env = envSesConfig();

  if (stored?.fromDomain && stored.accessKeyId) {
    const fromDomain = stored.fromDomain;
    return {
      enabled: Boolean(stored.secretAccessKey || env.secretAccessKey),
      region: stored.region || env.region,
      accessKeyId: stored.accessKeyId,
      secretAccessKey: stored.secretAccessKey || env.secretAccessKey,
      fromDomain,
      fromEmail: stored.fromEmail || `noreply@${fromDomain}`,
      configurationSet: stored.configurationSet || env.configurationSet,
      appUrl: stored.appUrl || env.appUrl,
      source: "database",
    };
  }

  if (env.enabled) {
    return { ...env, source: "environment" };
  }

  return { ...env, enabled: false, source: "none" };
}

export function sesConfigToApi(config: SesConfig, secretConfigured: boolean): SesSettingsApi {
  return {
    region: config.region,
    accessKeyId: config.accessKeyId ?? "",
    secretAccessKey: "",
    secretConfigured,
    fromDomain: config.fromDomain,
    fromEmail: config.fromEmail,
    configurationSet: config.configurationSet ?? "",
    appUrl: config.appUrl,
    enabled: config.enabled,
    source: config.source,
  };
}

export function normalizeSesInput(data: {
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  fromDomain?: string;
  fromEmail?: string;
  configurationSet?: string;
  appUrl?: string;
}): SesConfigStored {
  return {
    region: data.region?.trim() || undefined,
    accessKeyId: data.accessKeyId?.trim() || undefined,
    secretAccessKey: data.secretAccessKey?.length ? data.secretAccessKey : undefined,
    fromDomain: data.fromDomain?.trim() || undefined,
    fromEmail: data.fromEmail?.trim() || undefined,
    configurationSet: data.configurationSet?.trim() || undefined,
    appUrl: data.appUrl?.trim() || undefined,
  };
}
