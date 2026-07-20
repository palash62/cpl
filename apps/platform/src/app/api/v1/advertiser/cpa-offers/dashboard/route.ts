import { withAuth } from "@/lib/api-handler";
import { canAdvertiserAccessCpaOffers } from "@/lib/cpa-offers-access";
import { errorResponse } from "@/lib/errors";
import {
  getAdvertiserCpaDashboardSnapshot,
  type CpaDashboardRange,
} from "@/services/cpa-offer.service";

const RANGES: CpaDashboardRange[] = ["today", "yesterday", "last7d", "thisMonth", "lastMonth"];

export async function GET(request: Request) {
  return withAuth(async (session) => {
    try {
      if (!canAdvertiserAccessCpaOffers(session.user.email)) {
        return Response.json({
          data: {
            range: "last7d" satisfies CpaDashboardRange,
            rangeLabel: "Last 7 Days",
            from: "",
            to: "",
            metrics: {
              hits: 0,
              clicks: 0,
              hitsClicksChangePct: 0,
              conversionsApproved: 0,
              conversionsPending: 0,
              conversionsRejected: 0,
              conversionsChangePct: 0,
              revenue: "0.00",
              payout: "0.00",
              profit: "0.00",
              revenueChangePct: 0,
              payoutChangePct: 0,
              profitChangePct: 0,
            },
            series: [],
            newOffers: [],
          },
        });
      }

      const { searchParams } = new URL(request.url);
      const raw = searchParams.get("range") ?? "last7d";
      const range = (RANGES.includes(raw as CpaDashboardRange) ? raw : "last7d") as CpaDashboardRange;

      const data = await getAdvertiserCpaDashboardSnapshot(session.user.id, range);
      return Response.json({ data });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}

