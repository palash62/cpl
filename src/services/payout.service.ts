import { prisma } from "@/lib/prisma";
import { debitWallet, getPlatformSettings } from "@/services/wallet.service";
import { Errors } from "@/lib/errors";
import { isPendingPayoutStatus } from "@/lib/payout-status";
import type { PayoutMethod } from "@prisma/client";

export async function requestPayout(
  publisherId: string,
  amount: number,
  method: PayoutMethod,
  idempotencyKey?: string,
) {
  const settings = await getPlatformSettings();

  if (amount < settings.minPayoutAmount) {
    throw Errors.payoutBelowMinimum(settings.minPayoutAmount);
  }

  if (idempotencyKey) {
    const existing = await prisma.payout.findUnique({
      where: { idempotencyKey },
    });
    if (existing) throw Errors.duplicatePayout();
  }

  const wallet = await prisma.wallet.findUniqueOrThrow({
    where: { userId: publisherId },
  });

  if (Number(wallet.balance) < amount) {
    throw Errors.insufficientFunds();
  }

  const payout = await prisma.payout.create({
    data: {
      publisherId,
      amount,
      method,
      idempotencyKey,
      status: "PENDING",
    },
  });

  return payout;
}

export async function approvePayout(payoutId: string, adminId: string) {
  const payout = await prisma.payout.findUniqueOrThrow({
    where: { id: payoutId },
  });

  if (!isPendingPayoutStatus(payout.status)) {
    throw new Error("Payout is not pending approval");
  }

  await prisma.$transaction(async (tx) => {
    await debitWallet(
      tx,
      payout.publisherId,
      Number(payout.amount),
      "payout",
      payoutId,
      "Payout processed",
    );

    await tx.payout.update({
      where: { id: payoutId },
      data: { status: "COMPLETED", processedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "payout.approved",
        entityType: "payout",
        entityId: payoutId,
      },
    });
  });

  return prisma.payout.findUniqueOrThrow({ where: { id: payoutId } });
}

export async function rejectPayout(payoutId: string, adminId: string, reason: string) {
  const payout = await prisma.payout.findUniqueOrThrow({
    where: { id: payoutId },
  });

  if (!isPendingPayoutStatus(payout.status)) {
    throw new Error("Payout is not pending approval");
  }

  const trimmedReason = reason.trim();
  if (!trimmedReason) {
    throw new Error("Rejection note is required");
  }

  await prisma.$transaction(async (tx) => {
    await tx.payout.update({
      where: { id: payoutId },
      data: {
        status: "REJECTED",
        processedAt: new Date(),
        rejectionReason: trimmedReason,
        rejectedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "payout.rejected",
        entityType: "payout",
        entityId: payoutId,
        metadata: { reason: trimmedReason },
      },
    });
  });

  return prisma.payout.findUniqueOrThrow({ where: { id: payoutId } });
}

export async function listPayouts(filters: {
  publisherId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const where = {
    ...(filters.publisherId && { publisherId: filters.publisherId }),
    ...(filters.status && { status: filters.status as never }),
  };

  const [data, total] = await Promise.all([
    prisma.payout.findMany({
      where,
      include: { publisher: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payout.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
