import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { getWalletBalance } from "@/services/wallet.service";
import { prisma } from "@/lib/prisma";
import { creditWallet } from "@/services/wallet.service";

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

      if (!amount || amount <= 0) {
        return Response.json({ error: { code: "VALIDATION_ERROR", status: 422 } }, { status: 422 });
      }

      const deposit = await prisma.deposit.create({
        data: {
          userId: session.user.id,
          amount,
          status: "COMPLETED",
          stripePaymentId: body.paymentIntentId ?? `mock_${Date.now()}`,
        },
      });

      await prisma.$transaction(async (tx) => {
        await creditWallet(tx, session.user.id, amount, "deposit", deposit.id, "Wallet deposit");
      });

      const balance = await getWalletBalance(session.user.id);
      return Response.json({ deposit, balance }, { status: 201 });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER", "ADMIN"]);
}
