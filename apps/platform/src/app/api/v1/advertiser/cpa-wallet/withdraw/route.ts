import { withAuth } from "@/lib/api-handler";
import { canAdvertiserAccessCpaOffers } from "@/lib/cpa-offers-access";
import { errorResponse } from "@/lib/errors";
import { payoutRequestSchema } from "@/lib/validations";
import { requestCpaPayout } from "@/services/cpa-wallet.service";

export async function POST(request: Request) {
  return withAuth(async (session) => {
    try {
      if (!canAdvertiserAccessCpaOffers(session.user.email)) {
        return Response.json(
          { error: { code: "PERMISSION_DENIED", status: 403 } },
          { status: 403 },
        );
      }

      const body = await request.json();
      const parsed = payoutRequestSchema.safeParse(body);

      if (!parsed.success) {
        return Response.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: parsed.error.message,
              status: 422,
            },
          },
          { status: 422 },
        );
      }

      const payout = await requestCpaPayout(
        session.user.id,
        parsed.data.amount,
        parsed.data.method,
        parsed.data.paymentDetails,
        parsed.data.idempotencyKey,
      );

      return Response.json({ data: payout }, { status: 201 });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
