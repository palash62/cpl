import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { referralTransferSchema } from "@/lib/validations";
import { transferReferralEarningsToWallet } from "@/services/referral.service";

export async function POST(request: Request) {
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const parsed = referralTransferSchema.safeParse(body);

      if (!parsed.success) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 422 } },
          { status: 422 },
        );
      }

      const result = await transferReferralEarningsToWallet(
        session.user.id,
        parsed.data.amount,
      );

      return Response.json({ data: result });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
