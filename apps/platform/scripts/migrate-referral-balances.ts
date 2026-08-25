/**
 * One-time referral balance scripts (run on prod after deploy):
 *
 * 1. migrateSharedReferralBalancesToPot — first deploy only (may be skipped if already run)
 * 2. restoreFullReferralPotBalances — top up pot to full earned (~$81 for Marius)
 *
 * Usage from repo root:
 *   npx tsx --tsconfig apps/platform/tsconfig.json apps/platform/scripts/migrate-referral-balances.ts
 */
import {
  migrateSharedReferralBalancesToPot,
  restoreFullReferralPotBalances,
} from "../src/services/referral.service";

async function main() {
  const migrated = await migrateSharedReferralBalancesToPot();
  console.log(`Step 1: migrated ${migrated} wallet(s) from shared main balance.`);

  const restored = await restoreFullReferralPotBalances();
  console.log(`Step 2: restored full referral pot on ${restored} wallet(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
