import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;

const SECRET_KEYS = new Set([
  "apiKey",
  "accessToken",
  "refreshToken",
  "secret",
  "pass",
]);

export const SECRET_CONFIG_KEYS = SECRET_KEYS;
export const MASKED_SECRET = "••••••••";

function getEncryptionKey() {
  const raw = process.env.INTEGRATION_ENCRYPTION_KEY ?? process.env.AUTH_SECRET ?? "";
  if (!raw || raw.length < 16) {
    throw new Error("INTEGRATION_ENCRYPTION_KEY or AUTH_SECRET (min 16 chars) required");
  }
  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(plain: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

export function decryptSecret(value: string): string {
  if (!value.startsWith("enc:")) return value;
  const key = getEncryptionKey();
  const [, ivB64, tagB64, dataB64] = value.split(":");
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function encryptConfigSecrets(config: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...config };
  for (const key of Object.keys(out)) {
    const val = out[key];
    if (SECRET_KEYS.has(key) && typeof val === "string" && val && !val.startsWith("enc:")) {
      out[key] = encryptSecret(val);
    }
  }
  return out;
}

export function decryptConfigSecrets(config: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...config };
  for (const key of Object.keys(out)) {
    const val = out[key];
    if (SECRET_KEYS.has(key) && typeof val === "string" && val.startsWith("enc:")) {
      out[key] = decryptSecret(val);
    }
  }
  return out;
}

export function maskConfigForApi(config: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(config ?? {}) };
  for (const key of Object.keys(out)) {
    if (SECRET_KEYS.has(key) && typeof out[key] === "string" && out[key]) {
      out[key] = MASKED_SECRET;
    }
  }
  return out;
}
