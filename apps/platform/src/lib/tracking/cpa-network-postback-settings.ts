export const CPA_NETWORK_POSTBACK_SETTINGS_KEY = "cpa_network_postback";

export type CpaNetworkPostbackConfig = {
  version: 1;
  useSecurityKey: boolean;
  securityKey: string;
  parallelPostbackUrl: string;
};

export const DEFAULT_CPA_NETWORK_POSTBACK_CONFIG: CpaNetworkPostbackConfig = {
  version: 1,
  useSecurityKey: false,
  securityKey: "",
  parallelPostbackUrl: "",
};

function coerceString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

export function parseCpaNetworkPostbackConfig(value: unknown): CpaNetworkPostbackConfig {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_CPA_NETWORK_POSTBACK_CONFIG };
  }
  const raw = value as Record<string, unknown>;
  return {
    version: 1,
    useSecurityKey: Boolean(raw.useSecurityKey),
    securityKey: coerceString(raw.securityKey).slice(0, 120),
    parallelPostbackUrl: coerceString(raw.parallelPostbackUrl).slice(0, 2000),
  };
}

export function normalizeCpaNetworkPostbackInput(input: {
  useSecurityKey?: boolean;
  securityKey?: string;
  parallelPostbackUrl?: string;
}): CpaNetworkPostbackConfig {
  const useSecurityKey = Boolean(input.useSecurityKey);
  const securityKey = (input.securityKey ?? "").trim().slice(0, 120);
  const parallelPostbackUrl = (input.parallelPostbackUrl ?? "").trim().slice(0, 2000);

  if (useSecurityKey && securityKey.length < 6) {
    throw new Error("Postback security key must be at least 6 characters when enabled.");
  }

  if (parallelPostbackUrl) {
    let parsed: URL;
    try {
      parsed = new URL(parallelPostbackUrl);
    } catch {
      throw new Error("Enter a valid parallel postback URL.");
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Parallel postback URL must start with http:// or https://");
    }
  }

  return {
    version: 1,
    useSecurityKey,
    securityKey: useSecurityKey ? securityKey : securityKey,
    parallelPostbackUrl,
  };
}
