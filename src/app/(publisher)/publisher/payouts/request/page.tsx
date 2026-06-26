export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { getWalletBalance, getPlatformSettings } from "@/services/wallet.service";
import { RoleHero } from "@/components/layout/role-hero";
import { PublisherInfoBanner } from "@/components/publisher/publisher-info-banner";
import { PublisherPayoutRequestForm } from "@/components/publisher/publisher-payout-request-form";

export default async function RequestPayoutPage() {
  const session = await auth();
  const [balance, settings] = await Promise.all([
    getWalletBalance(session!.user.id),
    getPlatformSettings(),
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
        Payouts are reviewed by our team before processing. Ensure your payment details are up to
        date and your balance meets the minimum withdrawal amount.
      </PublisherInfoBanner>

      <PublisherPayoutRequestForm
        availableBalance={availableBalance}
        minPayoutAmount={settings.minPayoutAmount}
      />
    </div>
  );
}
