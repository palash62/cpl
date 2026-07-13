import type { UserRole } from "@prisma/client";

export const VIEW_AS_COOKIE = "cpl-view-as";

const VIEW_AS_TTL_MS = 8 * 60 * 60 * 1000;

export type ViewAsPayload = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  impersonatorId: string;
  exp: number;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad =
    padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function signPayload(payload: ViewAsPayload): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const sig = await hmacBase64Url(body, getSecret());
  return `${body}.${sig}`;
}

async function hmacBase64Url(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return toBase64Url(new Uint8Array(signature));
}

export async function parseViewAsCookie(
  value: string | undefined | null,
): Promise<ViewAsPayload | null> {
  if (!value) return null;

  const dot = value.indexOf(".");
  if (dot <= 0) return null;

  const body = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = await hmacBase64Url(body, getSecret());

  if (!timingSafeEqual(sig, expected)) return null;

  try {
    const payload = JSON.parse(decoder.decode(fromBase64Url(body))) as ViewAsPayload;

    if (!payload.userId || !payload.role || !payload.impersonatorId) return null;
    if (payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function createViewAsCookieValue(
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  },
  impersonatorId: string,
) {
  return signPayload({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    impersonatorId,
    exp: Date.now() + VIEW_AS_TTL_MS,
  });
}

export function viewAsCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: VIEW_AS_TTL_MS / 1000,
  };
}

export function shouldApplyViewAs(pathname: string, referer: string | null, role: UserRole) {
  if (pathname.startsWith("/publisher") && role === "PUBLISHER") return true;
  if (pathname.startsWith("/advertiser") && role === "ADVERTISER") return true;

  const refererPath = referer ? safeRefererPathname(referer) : null;
  if (refererPath?.startsWith("/publisher") && role === "PUBLISHER") return true;
  if (refererPath?.startsWith("/advertiser") && role === "ADVERTISER") return true;

  return false;
}

function safeRefererPathname(referer: string): string | null {
  try {
    return new URL(referer).pathname;
  } catch {
    return null;
  }
}
