import { auth } from "@/lib/auth";
import { getWalletBalance } from "@/services/wallet.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";

export const dynamic = "force-dynamic";

export default async function EarningsPage() {
  const session = await auth();
  const balance = await getWalletBalance(session!.user.id);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Earnings</h2>
      <Card>
        <CardHeader><CardTitle>Available Balance</CardTitle></CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">${(balance?.availableBalance ?? 0).toFixed(2)}</p>
          <ButtonLink href="/publisher/payouts/request" className="mt-4">Request Payout</ButtonLink>
        </CardContent>
      </Card>
    </div>
  );
}
