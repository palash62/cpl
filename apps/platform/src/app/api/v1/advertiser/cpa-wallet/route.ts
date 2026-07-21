import { withAuth } from "@/lib/api-handler";
import { canAdvertiserAccessCpaOffers } from "@/lib/cpa-offers-access";
import { errorResponse } from "@/lib/errors";
import { getCpaWalletSnapshot } from "@/services/cpa-wallet.service";

export async function GET() {
  return withAuth(async (session) => {
    try {
      if (!canAdvertiserAccessCpaOffers(session.user.email)) {
        return Response.json({
          data: {
            balances: {
              balance: 0,
              holdBalance: 0,
              availableBalance: 0,
              pendingBalance: 0,
              currency: "USD",
            },
            activity: [],
            summary: {
              last7d: { earnings: 0, withdrawals: 0 },
              last30d: { earnings: 0, withdrawals: 0 },
            },
          },
        });
      }

      const data = await getCpaWalletSnapshot(session.user.id);
      return Response.json({ data });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
