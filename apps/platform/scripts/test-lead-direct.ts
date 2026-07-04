import { submitLead } from "../src/services/lead.service";
import { prisma } from "@/lib/prisma";

async function main() {
  const lead = await submitLead({
    slug: "demo-link",
    data: {
      email: `direct-${Date.now()}@test.local`,
      first_name: "Direct",
      last_name: "Test",
    },
    ip: "127.0.0.1",
  });
  console.log("OK", lead.id, lead.status);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
