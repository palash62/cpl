/**
 * One-time: move shared-wallet referral cash into Wallet.referralBalance.
 * Safe to re-run (skips wallets that already have referralBalance/hold).
 *
 * Usage from repo root:
 *   npx tsx --tsconfig apps/platform/tsconfig.json apps/platform/scripts/migrate-referral-balances.ts
 */
import { migrateSharedReferralBalancesToPot } from "../src/services/referral.service";

async function main() {
  const migrated = await migrateSharedReferralBalancesToPot();
  console.log(`Migrated ${migrated} wallet(s) to separate referral balance.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
