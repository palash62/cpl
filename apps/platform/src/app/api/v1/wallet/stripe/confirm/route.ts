import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { confirmCardPayment } from "@/services/stripe-payment.service";

export async function POST(request: Request) {
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const depositId = typeof body.depositId === "string" ? body.depositId.trim() : "";

      if (!depositId) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: "Deposit ID is required", status: 422 } },
          { status: 422 },
        );
      }

      const result = await confirmCardPayment(session.user.id, depositId);
      return Response.json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "STRIPE_NOT_CONFIGURED") {
          return Response.json(
            {
              error: {
                code: "STRIPE_NOT_CONFIGURED",
                message: "Credit card payments are not configured. Contact support.",
                status: 422,
              },
            },
            { status: 422 },
          );
        }
        if (error.message === "PAYMENT_NOT_COMPLETED") {
          return Response.json(
            {
              error: {
                code: "PAYMENT_NOT_COMPLETED",
                message: "Payment was not completed. Please try again.",
                status: 422,
              },
            },
            { status: 422 },
          );
        }
      }
      return errorResponse(error);
    }
  }, ["ADVERTISER", "ADMIN"]);
}
