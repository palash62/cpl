import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getResolvedStripeConfig } from "@/services/stripe-settings.service";
import { creditWallet, getWalletBalance } from "@/services/wallet.service";
import { notifyGeneric } from "@/services/notify.service";

async function getStripeClient(): Promise<Stripe> {
  const config = await getResolvedStripeConfig();
  if (!config.enabled || !config.secretKey) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }
  return new Stripe(config.secretKey);
}

export async function getStripePublishableKeyForAdvertiser() {
  const config = await getResolvedStripeConfig();
  return {
    enabled: config.enabled,
    publishableKey: config.publishableKey ?? null,
  };
}

export async function createCardPaymentIntent(userId: string, amount: number) {
  const config = await getResolvedStripeConfig();
  if (!config.enabled || !config.publishableKey) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }

  const stripe = await getStripeClient();
  const amountCents = Math.round(amount * 100);

  const deposit = await prisma.deposit.create({
    data: {
      userId,
      amount,
      method: "CREDIT_CARD",
      status: "PENDING",
    },
  });

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        depositId: deposit.id,
        userId,
      },
    });

    await prisma.deposit.update({
      where: { id: deposit.id },
      data: { stripePaymentId: paymentIntent.id },
    });

    if (!paymentIntent.client_secret) {
      throw new Error("STRIPE_CLIENT_SECRET_MISSING");
    }

    return {
      depositId: deposit.id,
      clientSecret: paymentIntent.client_secret,
      publishableKey: config.publishableKey,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    await prisma.deposit.update({
      where: { id: deposit.id },
      data: { status: "FAILED", processedAt: new Date() },
    });
    throw error;
  }
}

export async function confirmCardPayment(userId: string, depositId: string) {
  const deposit = await prisma.deposit.findUnique({ where: { id: depositId } });
  if (!deposit || deposit.userId !== userId) {
    throw new Error("DEPOSIT_NOT_FOUND");
  }
  if (deposit.method !== "CREDIT_CARD") {
    throw new Error("INVALID_DEPOSIT_METHOD");
  }
  if (deposit.status === "COMPLETED") {
    const balance = await getWalletBalance(userId);
    return { deposit, balance, alreadyCompleted: true };
  }
  if (deposit.status !== "PENDING" || !deposit.stripePaymentId) {
    throw new Error("DEPOSIT_NOT_PENDING");
  }

  const stripe = await getStripeClient();
  const paymentIntent = await stripe.paymentIntents.retrieve(deposit.stripePaymentId);

  if (paymentIntent.status !== "succeeded") {
    throw new Error("PAYMENT_NOT_COMPLETED");
  }

  const amount = Number(deposit.amount);
  const expectedCents = Math.round(amount * 100);
  if (paymentIntent.amount !== expectedCents) {
    throw new Error("PAYMENT_AMOUNT_MISMATCH");
  }

  await prisma.$transaction(async (tx) => {
    const current = await tx.deposit.findUniqueOrThrow({ where: { id: depositId } });
    if (current.status === "COMPLETED") return;

    await creditWallet(
      tx,
      userId,
      amount,
      "deposit",
      depositId,
      "Credit card deposit",
    );

    await tx.deposit.update({
      where: { id: depositId },
      data: { status: "COMPLETED", processedAt: new Date() },
    });
  });

  const updated = await prisma.deposit.findUniqueOrThrow({ where: { id: depositId } });
  const balance = await getWalletBalance(userId);

  void notifyGeneric(
    await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    }),
    {
      title: "Deposit received",
      message: `Your credit card deposit of $${amount.toFixed(2)} has been credited to your wallet.`,
      actionPath: "/advertiser/wallet",
      notificationType: "deposit.completed",
    },
  );

  return { deposit: updated, balance, alreadyCompleted: false };
}
