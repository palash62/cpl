/**
 * Smoke test: fraud detection on lead submit pipeline.
 * Run: npx tsx scripts/test-fraud.ts
 */
import { prisma } from "@/lib/prisma";

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const SLUG = "demo-link";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type SubmitResult = { lead?: { id: string; status: string }; error?: { message: string } };

async function submitLead(body: Record<string, unknown>): Promise<{ status: number; json: SubmitResult }> {
  const res = await fetch(`${BASE}/api/v1/leads/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as SubmitResult;
  return { status: res.status, json };
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`  ✓ ${message}`);
}

async function main() {
  console.log("Fraud detection smoke test\n");

  const unique = Date.now();
  const email = `fraud-test-${unique}@example.com`;
  const phone = `+1555${String(unique).slice(-7)}`;

  // 1. Clean lead stores risk score
  const clean = await submitLead({
    slug: SLUG,
    data: { first_name: "Test", email, phone },
    submissionMeta: {
      formDurationMs: 8000,
      mouseMoveCount: 12,
      keyPressCount: 20,
      pasteCount: 0,
    },
    deviceFingerprint: `fp_test_${unique}`,
  });
  assert(clean.status === 201, `Clean lead accepted (${clean.status})`);
  const leadId = clean.json.lead?.id;
  assert(Boolean(leadId), "Lead id returned");

  await sleep(300);

  const stored = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { validationResults: true },
  });
  assert(stored?.riskScore !== null && stored?.riskScore !== undefined, `riskScore stored (${stored?.riskScore})`);
  assert(Boolean(stored?.fraudDecision), `fraudDecision stored (${stored?.fraudDecision})`);
  assert(
    stored!.validationResults.some((r) => r.rule === "duplicate_email" && r.passed),
    "duplicate_email rule recorded",
  );

  // 2. Duplicate email rejected
  const dup = await submitLead({
    slug: SLUG,
    data: { first_name: "Dup", email, phone: `+1555${String(unique + 1).slice(-7)}` },
    deviceFingerprint: `fp_dup_${unique}`,
  });
  assert(dup.status === 201, "Duplicate submit returns 201");
  assert(dup.json.lead?.status === "REJECTED", `Duplicate email rejected (${dup.json.lead?.status})`);

  await sleep(300);

  const dupLead = await prisma.lead.findUnique({
    where: { id: dup.json.lead!.id },
    include: { validationResults: true },
  });
  assert(
    dupLead!.validationResults.some((r) => r.rule === "duplicate_email" && !r.passed),
    "duplicate_email failed on second submit",
  );

  // 3. Honeypot blocked before DB write
  const bot = await submitLead({
    slug: SLUG,
    data: { first_name: "Bot", email: `bot-${unique}@example.com`, phone: "+15559999999" },
    honeypot: "filled-by-bot",
  });
  assert(bot.status !== 201, `Honeypot blocked (${bot.status})`);

  await sleep(300);

  // 4. Disposable email rejected
  const trash = await submitLead({
    slug: SLUG,
    data: {
      first_name: "Trash",
      email: `trash-${unique}@mailinator.com`,
      phone: `+1555${String(unique + 2).slice(-7)}`,
    },
    deviceFingerprint: `fp_trash_${unique}`,
  });
  assert(trash.status === 201, "Disposable submit returns 201");
  assert(trash.json.lead?.status === "REJECTED", `Disposable email rejected (${trash.json.lead?.status})`);

  await sleep(300);

  // 5. Fast-submit behavioral flags raise risk
  const fast = await submitLead({
    slug: SLUG,
    data: {
      first_name: "Fast",
      email: `fast-${unique}@example.com`,
      phone: `+1555${String(unique + 3).slice(-7)}`,
    },
    submissionMeta: { formDurationMs: 200, mouseMoveCount: 0, keyPressCount: 0, pasteCount: 0 },
    deviceFingerprint: `fp_fast_${unique}`,
  });
  assert(fast.status === 201, "Fast submit returns 201");
  const fastLead = await prisma.lead.findUnique({
    where: { id: fast.json.lead!.id },
    include: { validationResults: true },
  });
  assert((fastLead?.riskScore ?? 0) >= 50, `Fast submit risk elevated (${fastLead?.riskScore})`);
  assert(
    fastLead!.validationResults.some((r) => r.rule === "fast_submit" && !r.passed),
    "fast_submit rule fired",
  );

  // 6. Admin fraud metrics API reachable
  const metricsRes = await fetch(`${BASE}/api/v1/admin/fraud/metrics`);
  assert(
    [200, 401, 307, 403].includes(metricsRes.status),
    `Fraud metrics route exists (${metricsRes.status})`,
  );

  console.log("\nAll fraud smoke checks passed.");
}

main()
  .catch((err) => {
    console.error("\n", err.message ?? err);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
