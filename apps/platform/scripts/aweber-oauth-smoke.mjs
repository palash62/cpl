/**
 * End-to-end automated smoke test for AWeber OAuth (no browser approval).
 */
import { readFileSync } from "fs";
import { createHash, randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const BASE = "http://localhost:3010";
const EMAIL = "advertiser@cpl.local";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq < 0) continue;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  process.env[key] = val;
}

const prisma = new PrismaClient();
const results = [];

function pass(name, detail) {
  results.push({ name, ok: true, detail });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail) {
  results.push({ name, ok: false, detail });
  console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
}

function parseSetCookies(res) {
  if (typeof res.headers.getSetCookie === "function") {
    return res.headers.getSetCookie();
  }
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

function cookieJarFromSet(setCookies, jar = new Map()) {
  for (const raw of setCookies) {
    const part = raw.split(";")[0];
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    jar.set(part.slice(0, eq), part.slice(eq + 1));
  }
  return jar;
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function loginAdvertiser() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) throw new Error(`User not found: ${EMAIL}`);

  const code = String(randomInt(100000, 999999));
  const codeHash = await bcrypt.hash(code, 10);
  await prisma.loginOtpToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  await prisma.loginOtpToken.create({
    data: {
      userId: user.id,
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60_000),
    },
  });

  const jar = new Map();
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  cookieJarFromSet(parseSetCookies(csrfRes), jar);
  const { csrfToken } = await csrfRes.json();

  const signInRes = await fetch(`${BASE}/api/auth/callback/otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(jar),
    },
    body: new URLSearchParams({
      csrfToken,
      email: EMAIL,
      code,
      callbackUrl: `${BASE}/advertiser/integrations`,
      json: "true",
    }),
    redirect: "manual",
  });
  cookieJarFromSet(parseSetCookies(signInRes), jar);

  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: cookieHeader(jar) },
  });
  const session = await sessionRes.json();
  if (!session?.user?.email) throw new Error("Login failed");

  return jar;
}

async function main() {
  const clientId = process.env.AWEBER_CLIENT_ID || "";
  const clientSecret = process.env.AWEBER_CLIENT_SECRET || "";
  const redirect = process.env.AWEBER_REDIRECT_URI || "";

  if (clientId && clientSecret && redirect) {
    pass("env vars loaded", `${clientId.length}-char client id, redirect set`);
  } else {
    fail("env vars loaded", "missing AWEBER_CLIENT_ID/SECRET/REDIRECT_URI");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenRes = await fetch("https://auth.aweber.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: "invalid-test-code",
      redirect_uri: redirect,
    }),
  });
  const tokenBody = await tokenRes.text();
  if (tokenRes.status === 400 && tokenBody.includes("Invalid code")) {
    pass("AWeber client credentials", "token endpoint accepts client auth");
  } else if (tokenBody.includes("invalid_client")) {
    fail("AWeber client credentials", tokenBody.slice(0, 120));
  } else {
    fail("AWeber client credentials", `HTTP ${tokenRes.status}: ${tokenBody.slice(0, 120)}`);
  }

  const unauthAuth = await fetch(
    `${BASE}/api/v1/advertiser/integrations/aweber/authorize`,
    { redirect: "manual" },
  );
  if (unauthAuth.status === 401) {
    pass("authorize requires auth", "401");
  } else {
    fail("authorize requires auth", `HTTP ${unauthAuth.status}`);
  }

  const jar = await loginAdvertiser();
  pass("advertiser login", EMAIL);

  const authRes = await fetch(
    `${BASE}/api/v1/advertiser/integrations/aweber/authorize`,
    { headers: { Cookie: cookieHeader(jar) }, redirect: "manual" },
  );
  cookieJarFromSet(parseSetCookies(authRes), jar);
  const location = authRes.headers.get("location") || "";

  if (authRes.status === 307 && location.includes("auth.aweber.com/oauth2/authorize")) {
    const u = new URL(location);
    const ok =
      u.searchParams.get("client_id") === clientId &&
      u.searchParams.get("redirect_uri") === redirect &&
      u.searchParams.get("response_type") === "code" &&
      u.searchParams.get("scope")?.includes("list.read") &&
      Boolean(u.searchParams.get("state"));
    if (ok) {
      pass("authorize redirect", "AWeber URL with correct params");
    } else {
      fail("authorize redirect", "wrong query params");
    }
  } else {
    fail("authorize redirect", `HTTP ${authRes.status}, location=${location.slice(0, 80)}`);
  }

  const hasStateCookie = [...jar.keys()].some((k) => k.includes("aweber_oauth_state"));
  if (hasStateCookie) {
    pass("state cookie set", "aweber_oauth_state");
  } else {
    fail("state cookie set", "missing");
  }

  const sessionRes = await fetch(
    `${BASE}/api/v1/advertiser/integrations/aweber/session`,
    { headers: { Cookie: cookieHeader(jar) } },
  );
  const sessionJson = await sessionRes.json();
  if (sessionRes.status === 200 && sessionJson?.data?.connected === false) {
    pass("session before connect", "connected=false");
  } else {
    fail("session before connect", JSON.stringify(sessionJson));
  }

  const listsRes = await fetch(
    `${BASE}/api/v1/advertiser/integrations/aweber/lists`,
    { headers: { Cookie: cookieHeader(jar) } },
  );
  const listsBody = await listsRes.text();
  if (listsRes.status === 422 && listsBody.includes("Connect with AWeber")) {
    pass("lists before connect", "422 as expected");
  } else {
    fail("lists before connect", `HTTP ${listsRes.status}: ${listsBody.slice(0, 120)}`);
  }

  const cbRes = await fetch(
    `${BASE}/api/v1/advertiser/integrations/aweber/callback?code=fake&state=bad`,
    { redirect: "manual" },
  );
  const cbLoc = cbRes.headers.get("location") || "";
  if (cbRes.status === 307 && cbLoc.includes("aweber=error")) {
    pass("callback invalid state", "redirects with error");
  } else {
    fail("callback invalid state", `HTTP ${cbRes.status}, location=${cbLoc.slice(0, 100)}`);
  }

  const integrationsPage = await fetch(`${BASE}/advertiser/integrations`, {
    headers: { Cookie: cookieHeader(jar) },
  });
  if (integrationsPage.status === 200) {
    pass("integrations page", "200 for logged-in advertiser");
  } else {
    fail("integrations page", `HTTP ${integrationsPage.status}`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log("\n---");
  console.log(`${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error("ERROR", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
