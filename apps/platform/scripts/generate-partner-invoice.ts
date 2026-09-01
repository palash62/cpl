/**
 * Generate and email a partner settlement invoice for a calendar month.
 *
 * Usage:
 *   npx tsx apps/platform/scripts/generate-partner-invoice.ts
 *   npx tsx apps/platform/scripts/generate-partner-invoice.ts --month=2026-07
 *   npx tsx apps/platform/scripts/generate-partner-invoice.ts --force
 */
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(import.meta.dirname, "../.env") });

import { generatePartnerInvoice } from "../src/services/partner-invoice.service";
import { isValidPeriodMonth, previousCalendarMonth } from "../src/services/partner-payment.service";

function parseArgs(argv: string[]) {
  let periodMonth = previousCalendarMonth();
  let force = false;

  for (const arg of argv) {
    if (arg.startsWith("--month=")) {
      periodMonth = arg.slice("--month=".length);
    } else if (arg === "--force") {
      force = true;
    }
  }

  return { periodMonth, force };
}

async function main() {
  const { periodMonth, force } = parseArgs(process.argv.slice(2));
  if (!isValidPeriodMonth(periodMonth)) {
    console.error("Invalid --month; expected YYYY-MM");
    process.exit(1);
  }

  const result = await generatePartnerInvoice(periodMonth, { force, sendEmail: true });
  console.log(JSON.stringify(result, null, 2));
  if (result.emailError) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
