import { withAuth, parsePagination } from "@/lib/api-handler";
import { canAdvertiserAccessCpaOffers } from "@/lib/cpa-offers-access";
import { cpaOfferListQuerySchema } from "@/lib/validations";
import { listActiveCpaOffers } from "@/services/cpa-offer.service";

export async function GET(request: Request) {
  return withAuth(async (session) => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);

    if (!canAdvertiserAccessCpaOffers(session.user.email)) {
      return Response.json({
        data: {
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 1,
        },
      });
    }

    const parsed = cpaOfferListQuerySchema.safeParse({
      q: searchParams.get("q") ?? undefined,
      id: searchParams.get("id") ?? undefined,
      network: searchParams.get("network") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      country: searchParams.get("country") ?? undefined,
      page,
      limit,
    });

    if (!parsed.success) {
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid query",
            status: 422,
          },
        },
        { status: 422 },
      );
    }

    const data = await listActiveCpaOffers(parsed.data);
    return Response.json({ data });
  }, ["ADVERTISER"]);
}
