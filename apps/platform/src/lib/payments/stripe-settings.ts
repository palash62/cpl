export const STRIPE_SETTINGS_KEY = "stripe_config";

export type StripeConfigStored = {
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
};

export type StripeConfig = {
  enabled: boolean;
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  source: "database" | "environment" | "none";
};

export type StripeSettingsApi = {
  publishableKey: string;
  secretKey: string;
  secretKeyConfigured: boolean;
  webhookSecret: string;
  webhookSecretConfigured: boolean;
  enabled: boolean;
  source: StripeConfig["source"];
};

function envConfig(): Omit<StripeConfig, "source"> {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY?.trim();
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  return {
    enabled: Boolean(secretKey && publishableKey),
    publishableKey,
    secretKey,
    webhookSecret,
  };
}

export function parseStripeConfigStored(value: unknown): StripeConfigStored | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  return {
    publishableKey:
      typeof raw.publishableKey === "string" ? raw.publishableKey.trim() : undefined,
    secretKey: typeof raw.secretKey === "string" ? raw.secretKey : undefined,
    webhookSecret:
      typeof raw.webhookSecret === "string" ? raw.webhookSecret : undefined,
  };
}

export function mergeStripeConfig(stored: StripeConfigStored | null): StripeConfig {
  const env = envConfig();

  if (stored?.secretKey && stored.publishableKey) {
    return {
      enabled: true,
      publishableKey: stored.publishableKey,
      secretKey: stored.secretKey,
      webhookSecret: stored.webhookSecret ?? env.webhookSecret,
      source: "database",
    };
  }

  if (env.secretKey && env.publishableKey) {
    return { ...env, source: "environment" };
  }

  return { ...env, enabled: false, source: "none" };
}

export function stripeConfigToApi(
  config: StripeConfig,
  secretKeyConfigured: boolean,
  webhookSecretConfigured: boolean,
): StripeSettingsApi {
  return {
    publishableKey: config.publishableKey ?? "",
    secretKey: "",
    secretKeyConfigured,
    webhookSecret: "",
    webhookSecretConfigured,
    enabled: config.enabled,
    source: config.source,
  };
}

export function normalizeStripeInput(data: {
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
}): StripeConfigStored {
  return {
    publishableKey: data.publishableKey?.trim() || undefined,
    secretKey: data.secretKey?.length ? data.secretKey : undefined,
    webhookSecret: data.webhookSecret?.length ? data.webhookSecret : undefined,
  };
}
