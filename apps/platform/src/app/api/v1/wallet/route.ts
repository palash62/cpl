import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import {
  createCreditCardDeposit,
  createWiseDeposit,
  getWalletBalance,
} from "@/services/wallet.service";

export async function GET() {
  return withAuth(async (session) => {
    const balance = await getWalletBalance(session.user.id);
    return Response.json(balance ?? { balance: 0, holdBalance: 0, availableBalance: 0, currency: "USD" });
  });
}

export async function POST(request: Request) {
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const amount = Number(body.amount);
      const method = body.method === "WISE" ? "WISE" : "CREDIT_CARD";

      if (!amount || amount <= 0) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: "Amount must be greater than zero", status: 422 } },
          { status: 422 },
        );
      }

      if (amount < 10) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: "Minimum deposit is $10.00", status: 422 } },
          { status: 422 },
        );
      }

      if (method === "WISE") {
        const wiseReference = typeof body.wiseReference === "string" ? body.wiseReference.trim() : "";
        if (!wiseReference) {
          return Response.json(
            { error: { code: "VALIDATION_ERROR", message: "Wise transfer reference is required", status: 422 } },
            { status: 422 },
          );
        }

        const payerName = typeof body.payerName === "string" ? body.payerName.trim() : undefined;
        const note = typeof body.note === "string" ? body.note.trim() : undefined;

        const deposit = await createWiseDeposit(session.user.id, amount, wiseReference, {
          payerName: payerName || undefined,
          note: note || undefined,
        });

        const balance = await getWalletBalance(session.user.id);
        return Response.json({ deposit, balance }, { status: 201 });
      }

      const deposit = await createCreditCardDeposit(session.user.id, amount);
      const balance = await getWalletBalance(session.user.id);
      return Response.json({ deposit, balance }, { status: 201 });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER", "ADMIN"]);
}
