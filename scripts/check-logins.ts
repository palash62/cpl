/**
 * Quick login verification for all seed accounts
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const accounts = [
  { email: "admin@cpl.local", password: "password123", expectedRole: "ADMIN", dashboard: "/admin" },
  { email: "advertiser@cpl.local", password: "password123", expectedRole: "ADVERTISER", dashboard: "/advertiser" },
  { email: "publisher@cpl.local", password: "password123", expectedRole: "PUBLISHER", dashboard: "/publisher" },
];

async function testDbAuth(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: false, error: "User not found" };
  if (user.status !== "ACTIVE") return { ok: false, error: `Status: ${user.status}` };
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { ok: false, error: "Invalid password" };
  return { ok: true, role: user.role, name: user.name };
}

async function testHttpLogin(email: string, password: string) {
  const base = "http://localhost:3000";
  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const csrfCookies = csrfRes.headers.getSetCookie?.() ?? [];

  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    callbackUrl: `${base}/login`,
    json: "true",
  });

  const loginRes = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookies.map((c) => c.split(";")[0]).join("; "),
    },
    body: body.toString(),
    redirect: "manual",
  });

  const allCookies = [...csrfCookies, ...(loginRes.headers.getSetCookie?.() ?? [])]
    .map((c) => c.split(";")[0])
    .join("; ");

  const sessionRes = await fetch(`${base}/api/auth/session`, {
    headers: { Cookie: allCookies },
  });
  const session = (await sessionRes.json()) as { user?: { email: string; role: string } };

  if (!session?.user?.email) {
    return { ok: false, error: "No session after login", status: loginRes.status };
  }

  return { ok: true, role: session.user.role, email: session.user.email, cookies: allCookies };
}

async function testDashboardAccess(dashboard: string, cookie: string) {
  const res = await fetch(`http://localhost:3000${dashboard}`, {
    headers: { Cookie: cookie },
    redirect: "manual",
  });
  return res.status === 200 || res.status === 307;
}

async function main() {
  console.log("=== CPL Login Check ===\n");

  let allPassed = true;

  for (const account of accounts) {
    console.log(`--- ${account.email} (${account.expectedRole}) ---`);

    const db = await testDbAuth(account.email, account.password);
    if (db.ok) {
      console.log(`  DB auth:     PASS (role=${db.role}, name=${db.name})`);
      if (db.role !== account.expectedRole) {
        console.log(`  DB role:     FAIL expected ${account.expectedRole}`);
        allPassed = false;
      }
    } else {
      console.log(`  DB auth:     FAIL - ${db.error}`);
      allPassed = false;
    }

    try {
      const http = await testHttpLogin(account.email, account.password);
      if (http.ok) {
        console.log(`  HTTP login:  PASS (role=${http.role})`);
        if (http.role !== account.expectedRole) {
          console.log(`  HTTP role:   FAIL expected ${account.expectedRole}`);
          allPassed = false;
        }
      } else {
        console.log(`  HTTP login:  FAIL - ${http.error}`);
        allPassed = false;
      }
    } catch (e) {
      console.log(`  HTTP login:  FAIL - ${e instanceof Error ? e.message : e}`);
      allPassed = false;
    }

    console.log(`  Dashboard:   ${account.dashboard}`);
    console.log("");
  }

  // Wrong password test
  const bad = await testDbAuth("admin@cpl.local", "wrongpassword");
  console.log("--- Invalid password test ---");
  console.log(`  admin + wrong pass: ${bad.ok ? "FAIL (should reject)" : "PASS (rejected)"}`);
  if (bad.ok) allPassed = false;

  await prisma.$disconnect();
  console.log(allPassed ? "\n✓ All login checks PASSED" : "\n✗ Some login checks FAILED");
  process.exit(allPassed ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
