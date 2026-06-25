import { auth } from "@/lib/auth";
import { getWalletBalance } from "@/services/wallet.service";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function EarningsPage() {
  const session = await auth();
  const balance = await getWalletBalance(session!.user.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Earnings" description="View your available balance and request payouts" />
      <div className="premium-card max-w-md">
        <CardHeader><CardTitle>Available Balance</CardTitle></CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-slate-900">${(balance?.availableBalance ?? 0).toFixed(2)}</p>
          <ButtonLink href="/publisher/payouts/request" className="mt-4 bg-[var(--theme-primary)] hover:opacity-90">
            Request Payout
          </ButtonLink>
        </CardContent>
      </div>
    </div>
  );
}
