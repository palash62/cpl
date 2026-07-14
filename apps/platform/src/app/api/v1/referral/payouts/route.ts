import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { payoutRequestSchema } from "@/lib/validations";
import { listPayouts, requestReferralPayout } from "@/services/payout.service";

export async function GET(request: Request) {
  return withAuth(async (session) => {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));

    const result = await listPayouts({
      publisherId: session.user.id,
      kind: "REFERRAL",
      page,
      limit,
    });

    return Response.json(result);
  }, ["ADVERTISER"]);
}

export async function POST(request: Request) {
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const parsed = payoutRequestSchema.safeParse(body);

      if (!parsed.success) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 422 } },
          { status: 422 },
        );
      }

      const payout = await requestReferralPayout(
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
