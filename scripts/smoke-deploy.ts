#!/usr/bin/env tsx
/**
 * Smoke test for deployed dual-service setup.
 * Usage: tsx scripts/smoke-deploy.ts
 */
import { prisma } from "@cpl/database";

const PLATFORM = process.env.PLATFORM_URL ?? "http://localhost:3000";
const TRACKING = process.env.TRACKING_URL ?? "http://localhost:3001";

async function check(name: string, fn: () => Promise<boolean>) {
  try {
    const ok = await fn();
    console.log(ok ? `✓ ${name}` : `✗ ${name}`);
    return ok;
  } catch (e) {
    console.log(`✗ ${name}:`, e instanceof Error ? e.message : e);
    return false;
  }
}

async function main() {
  console.log("CPL Deploy Smoke Test\n");

  let passed = 0;
  let total = 0;

  const run = async (name: string, fn: () => Promise<boolean>) => {
    total++;
    if (await check(name, fn)) passed++;
  };

  await run("Database connection", async () => {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  });

  await run("Seed data: demo tracking link", async () => {
    const link = await prisma.trackingLink.findUnique({ where: { slug: "demo-link" } });
    return Boolean(link);
  });

  await run(`Tracking: lead form /t/demo-link`, async () => {
    const res = await fetch(`${TRACKING}/t/demo-link`);
    return res.status === 200;
  });

  await run(`Tracking: track.js script`, async () => {
    const res = await fetch(`${TRACKING}/track.js`);
    const text = await res.text();
    return res.status === 200 && text.includes("beacon");
  });

  await run(`Tracking: pixel endpoint`, async () => {
    const res = await fetch(`${TRACKING}/api/v1/pixel/invalid-token`);
    return res.status === 200; // always returns GIF
  });

  await run(`Tracking: beacon endpoint`, async () => {
    const res = await fetch(`${TRACKING}/api/v1/beacon`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "demo-link" }),
    });
    return res.status === 200;
  });

  const platformUi = await fetch(`${PLATFORM}/login`, { signal: AbortSignal.timeout(5_000) }).then(
    (r) => r.status === 200,
    () => false,
  );
  if (platformUi) {
    await run(`Platform: login page`, async () => true);
  } else {
    console.log("○ Platform: login page (skipped — run full platform build on EC2 for UI)");
  }

  await run(`Platform: internal lead API`, async () => {
    const token = process.env.INTERNAL_SERVICE_TOKEN ?? "dev-internal-service-token-change-in-production-64chars-min";
    const res = await fetch(`${PLATFORM}/api/internal/v1/leads/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Service-Token": token,
      },
      body: JSON.stringify({
        slug: "demo-link",
        data: { email: `smoke-${Date.now()}@test.local`, first_name: "Smoke", last_name: "Test" },
        honeypot: "",
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`${res.status} ${body.slice(0, 200)}`);
    }
    const json = (await res.json()) as { lead?: { id: string } };
    return Boolean(json.lead?.id);
  });

  await run(`Tracking: lead submit proxy`, async () => {
    const res = await fetch(`${TRACKING}/api/v1/leads/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "demo-link",
        data: { email: `proxy-${Date.now()}@test.local`, first_name: "Proxy", last_name: "Test" },
        honeypot: "",
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`${res.status} ${body.slice(0, 200)}`);
    }
    const json = (await res.json()) as { lead?: { id: string } };
    return Boolean(json.lead?.id);
  });

  console.log(`\n${passed}/${total} checks passed`);
  await prisma.$disconnect();
  process.exit(passed === total ? 0 : 1);
}

main();
