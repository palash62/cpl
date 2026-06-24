import { auth } from "@/lib/auth";
import { getWalletBalance } from "@/services/wallet.service";
import WalletPageClient from "./wallet-client";

export default async function WalletPage() {
  const session = await auth();
  const balance = await getWalletBalance(session!.user.id);

  return (
    <WalletPageClient
      initialBalance={
        balance ?? { balance: 0, availableBalance: 0, currency: "USD" }
      }
    />
  );
}
