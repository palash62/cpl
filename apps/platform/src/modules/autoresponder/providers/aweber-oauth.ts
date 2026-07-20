import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getPlatformUrl } from "@cpl/shared";

export const AWEBER_AUTHORIZE_URL = "https://auth.aweber.com/oauth2/authorize";
export const AWEBER_TOKEN_URL = "https://auth.aweber.com/oauth2/token";
export const AWEBER_API_BASE = "https://api.aweber.com/1.0";

export const AWEBER_OAUTH_SCOPES = [
  "account.read",
  "list.read",
  "list.write",
  "subscriber.read",
  "subscriber.write",
].join(" ");

export const AWEBER_STATE_COOKIE = "aweber_oauth_state";
export const AWEBER_SESSION_COOKIE = "aweber_oauth_session";

const STATE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 30 * 60 * 1000;

export type AweberTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
};

export type AweberOAuthSession = {
  advertiserId: string;
  accessToken: string;
  refreshToken: string;
  accountId: string;
  /** Access-token expiry (epoch ms) */
  expiresAt: number;
  /** Cookie payload expiry (epoch ms) */
  exp: number;
};

export type AweberListOption = {
  id: string;
  name: string;
};

function getSigningSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.INTEGRATION_ENCRYPTION_KEY ?? "";
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET or INTEGRATION_ENCRYPTION_KEY is required for AWeber OAuth");
  }
  return secret;
}

export function getAweberClientId() {
  return process.env.AWEBER_CLIENT_ID?.trim() ?? "";
}

export function getAweberClientSecret() {
  return process.env.AWEBER_CLIENT_SECRET?.trim() ?? "";
}

export function getAweberRedirectUri() {
  const override = process.env.AWEBER_REDIRECT_URI?.trim();
  if (override) return override.replace(/\/$/, "");
  return `${getPlatformUrl()}/api/v1/advertiser/integrations/aweber/callback`;
}

export function assertAweberOAuthConfigured() {
  if (!getAweberClientId() || !getAweberClientSecret()) {
    throw new Error(
      "AWeber OAuth is not configured. Set AWEBER_CLIENT_ID and AWEBER_CLIENT_SECRET.",
    );
  }
}

function signPayload(body: string) {
  return createHmac("sha256", getSigningSecret()).update(body).digest("base64url");
}

function encodeSigned(payload: unknown): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${signPayload(body)}`;
}

function decodeSigned<T>(value: string | undefined | null): T | null {
  if (!value) return null;
  const dot = value.indexOf(".");
  if (dot <= 0) return null;
  const body = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = signPayload(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function createAweberStateCookie(advertiserId: string) {
  const nonce = randomBytes(16).toString("hex");
  const value = encodeSigned({
    advertiserId,
    nonce,
    exp: Date.now() + STATE_TTL_MS,
  });
  return {
    name: AWEBER_STATE_COOKIE,
    value,
    nonce,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: STATE_TTL_MS / 1000,
    },
  };
}

export function parseAweberStateCookie(value: string | undefined | null) {
  const payload = decodeSigned<{ advertiserId: string; nonce: string; exp: number }>(value);
  if (!payload?.advertiserId || !payload.nonce) return null;
  if (payload.exp < Date.now()) return null;
  return payload;
}

export function createAweberSessionCookie(session: Omit<AweberOAuthSession, "exp">) {
  const value = encodeSigned({
    ...session,
    exp: Date.now() + SESSION_TTL_MS,
  } satisfies AweberOAuthSession);
  return {
    name: AWEBER_SESSION_COOKIE,
    value,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
    },
  };
}

export function parseAweberSessionCookie(value: string | undefined | null): AweberOAuthSession | null {
  const payload = decodeSigned<AweberOAuthSession>(value);
  if (!payload?.advertiserId || !payload.accessToken || !payload.accountId) return null;
  if (payload.exp < Date.now()) return null;
  return payload;
}

export function clearAweberSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

export function buildAweberAuthorizeUrl(state: string) {
  assertAweberOAuthConfigured();
  const url = new URL(AWEBER_AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", getAweberClientId());
  url.searchParams.set("redirect_uri", getAweberRedirectUri());
  url.searchParams.set("scope", AWEBER_OAUTH_SCOPES);
  url.searchParams.set("state", state);
  return url.toString();
}

async function postToken(body: URLSearchParams): Promise<AweberTokenResponse> {
  assertAweberOAuthConfigured();
  const basic = Buffer.from(
    `${getAweberClientId()}:${getAweberClientSecret()}`,
    "utf8",
  ).toString("base64");

  const res = await fetch(AWEBER_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(text.slice(0, 400) || `AWeber token exchange failed (${res.status})`);
  }

  return JSON.parse(text) as AweberTokenResponse;
}

export async function exchangeAweberCode(code: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getAweberRedirectUri(),
  });
  return postToken(body);
}

export async function refreshAweberAccessToken(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  return postToken(body);
}

export function tokenExpiresAtFromResponse(token: AweberTokenResponse, skewMs = 60_000) {
  const expiresIn = typeof token.expires_in === "number" ? token.expires_in : 3600;
  return Date.now() + expiresIn * 1000 - skewMs;
}

async function aweberApiGet(path: string, accessToken: string) {
  const res = await fetch(`${AWEBER_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text.slice(0, 400) || `AWeber API error (${res.status})`);
  }
  return JSON.parse(text) as Record<string, unknown>;
}

export async function fetchAweberAccountId(accessToken: string): Promise<string> {
  const data = await aweberApiGet("/accounts", accessToken);
  const entries = Array.isArray(data.entries) ? data.entries : [];
  const first = entries[0] as { id?: number | string } | undefined;
  if (!first?.id) {
    throw new Error("No AWeber account found for this authorization");
  }
  return String(first.id);
}

export async function fetchAweberLists(
  accessToken: string,
  accountId: string,
): Promise<AweberListOption[]> {
  const data = await aweberApiGet(`/accounts/${accountId}/lists`, accessToken);
  const entries = Array.isArray(data.entries) ? data.entries : [];
  return entries
    .map((entry) => {
      const row = entry as { id?: number | string; name?: string };
      if (row.id == null) return null;
      return {
        id: String(row.id),
        name: typeof row.name === "string" && row.name.trim() ? row.name.trim() : `List ${row.id}`,
      };
    })
    .filter((row): row is AweberListOption => Boolean(row));
}

/** Refresh access token when expired; returns updated tokens for persistence. */
export async function ensureFreshAweberAccessToken(input: {
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: number;
}): Promise<{
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt: number;
  refreshed: boolean;
}> {
  const expiresAt = input.tokenExpiresAt ?? 0;
  if (expiresAt > Date.now() + 30_000) {
    return {
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      tokenExpiresAt: expiresAt,
      refreshed: false,
    };
  }

  if (!input.refreshToken) {
    return {
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      tokenExpiresAt: expiresAt || Date.now() + 5 * 60_000,
      refreshed: false,
    };
  }

  const token = await refreshAweberAccessToken(input.refreshToken);
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? input.refreshToken,
    tokenExpiresAt: tokenExpiresAtFromResponse(token),
    refreshed: true,
  };
}
