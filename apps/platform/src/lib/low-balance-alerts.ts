/** Wallet balance alert tiers: notify once when crossing below each level. */
export const LOW_BALANCE_TIERS = [50, 10, 0] as const;
export type LowBalanceTier = (typeof LOW_BALANCE_TIERS)[number];

export function parseLowBalanceAlertTiers(raw: unknown): LowBalanceTier[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set<number>(LOW_BALANCE_TIERS);
  return raw.filter((v): v is LowBalanceTier => typeof v === "number" && allowed.has(v));
}

/**
 * Tiers newly crossed on this debit (previous → next), excluding already-alerted tiers.
 * Order: 50, then 10, then 0.
 */
export function crossedLowBalanceTiers(
  previousBalance: number,
  nextBalance: number,
  alreadyAlerted: readonly number[] = [],
): LowBalanceTier[] {
  const alerted = new Set(alreadyAlerted);
  const crossed: LowBalanceTier[] = [];

  if (previousBalance >= 50 && nextBalance < 50 && !alerted.has(50)) {
    crossed.push(50);
  }
  if (previousBalance >= 10 && nextBalance < 10 && !alerted.has(10)) {
    crossed.push(10);
  }
  if (previousBalance > 0 && nextBalance === 0 && !alerted.has(0)) {
    crossed.push(0);
  }

  return crossed;
}

/** After a credit, drop tiers the balance has recovered above. */
export function recoveredLowBalanceTiers(
  nextBalance: number,
  alreadyAlerted: readonly number[],
): LowBalanceTier[] {
  return alreadyAlerted.filter((tier) => {
    if (tier === 0) return nextBalance <= 0;
    return nextBalance < tier;
  }) as LowBalanceTier[];
}

export function lowBalanceNotificationType(tier: LowBalanceTier): string {
  return `wallet.low_balance.${tier}`;
}

export function lowBalanceAlertCopy(tier: LowBalanceTier, balance: number): {
  title: string;
  message: string;
} {
  const formatted = `$${balance.toFixed(2)}`;
  if (tier === 0) {
    return {
      title: "Wallet balance is $0",
      message: `Your wallet balance is ${formatted}. Add funds so your campaigns can continue paying for leads.`,
    };
  }
  if (tier === 10) {
    return {
      title: "Wallet balance below $10",
      message: `Your wallet balance is ${formatted} (below $10). Top up soon to avoid interrupted lead payments.`,
    };
  }
  return {
    title: "Wallet balance below $50",
    message: `Your wallet balance is ${formatted} (below $50). Consider adding funds to keep campaigns running smoothly.`,
  };
}
