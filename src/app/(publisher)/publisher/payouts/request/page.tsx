export const dynamic = "force-dynamic";

import { getSession } from "@/lib/session";
import { getPublisherPayoutRequestEligibility } from "@/services/payout.service";
import { getWalletBalance, getPlatformSettings } from "@/services/wallet.service";
import { RoleHero } from "@/components/layout/role-hero";
import { PublisherInfoBanner } from "@/components/publisher/publisher-info-banner";
import { PublisherPayoutRequestForm } from "@/components/publisher/publisher-payout-request-form";

export default async function RequestPayoutPage() {
  const session = await getSession();
  const [balance, settings, payoutEligibility] = await Promise.all([
    getWalletBalance(session!.user.id),
    getPlatformSettings(),
    getPublisherPayoutRequestEligibility(session!.user.id),
  ]);

  const availableBalance = balance?.availableBalance ?? 0;

  return (
    <div className="space-y-6">
      <RoleHero
        eyebrow="Publisher Portal"
        title="Request Payout"
        description="Withdraw your available earnings to your preferred payment method."
      />

      <PublisherInfoBanner>
        Payouts are reviewed by our team before processing. You can submit one payout request per
        week. Ensure your payment details are up to date and your balance meets the minimum
        withdrawal amount.
      </PublisherInfoBanner>

      <PublisherPayoutRequestForm
        availableBalance={availableBalance}
        minPayoutAmount={settings.minPayoutAmount}
        payoutEligibility={{
          canRequest: payoutEligibility.canRequest,
          lastRequestAt: payoutEligibility.lastRequestAt?.toISOString() ?? null,
          nextAllowedAt: payoutEligibility.nextAllowedAt?.toISOString() ?? null,
        }}
      />
    </div>
  );
}
