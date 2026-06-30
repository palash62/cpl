/**
 * Smoke test: advertiser autoresponder webhook on lead submit.
 * Run: npx tsx scripts/test-autoresponder.ts
 */
import { prisma } from "@/lib/prisma";
import { encryptConfigSecrets } from "@/modules/autoresponder/lib/encrypt-secrets";

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const SLUG = "demo-link";

async function main() {
  process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "test-secret-key-min-32-characters-long";

  const advertiser = await prisma.user.findFirst({
    where: { role: "ADVERTISER", email: "advertiser@cpl.local" },
  });
  if (!advertiser) throw new Error("Seed advertiser not found");

  const connection = await prisma.advertiserAutoresponder.create({
    data: {
      advertiserId: advertiser.id,
      name: `Smoke test ${Date.now()}`,
      provider: "WEBHOOK",
      trigger: "LEAD_CAPTURED",
      config: encryptConfigSecrets({
        url: "https://httpbin.org/post",
      }) as never,
    },
  });

  const unique = Date.now();
  const res = await fetch(`${BASE}/api/v1/leads/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug: SLUG,
      data: {
        first_name: "AR",
        email: `ar-test-${unique}@example.com`,
        phone: `+1555${String(unique).slice(-7)}`,
      },
      submissionMeta: { formDurationMs: 5000, mouseMoveCount: 5, keyPressCount: 10 },
      deviceFingerprint: `fp_ar_${unique}`,
    }),
  });

  if (res.status !== 201) {
    const err = await res.text();
    throw new Error(`Lead submit failed: ${res.status} ${err}`);
  }

  const json = (await res.json()) as { lead: { id: string } };

  let delivery = null;
  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    delivery = await prisma.autoresponderDelivery.findFirst({
      where: { connectionId: connection.id, leadId: json.lead.id },
      orderBy: { createdAt: "desc" },
    });
    if (delivery && delivery.status !== "PENDING") break;
  }

  if (!delivery) throw new Error("No delivery record created");
  if (delivery.status !== "SUCCESS") {
    throw new Error(`Delivery status: ${delivery.status} — ${delivery.error ?? ""}`);
  }

  console.log("Autoresponder smoke test passed:", delivery.id);

  await prisma.advertiserAutoresponder.delete({ where: { id: connection.id } });
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
