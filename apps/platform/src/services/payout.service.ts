import { prisma } from "@/lib/prisma";
import {
  debitWalletForPayout,
  getPlatformSettings,
  holdWalletFunds,
  releaseWalletHold,
} from "@/services/wallet.service";
import { Errors } from "@/lib/errors";
import { getMinPayoutForMethod } from "@/lib/platform-settings";
import { isPendingPayoutStatus, PENDING_PAYOUT_STATUSES } from "@/lib/payout-status";
import { payoutPublisherSelect } from "@/lib/payout";
import type { PayoutPaymentDetails } from "@/lib/payout-payment-details";
import type { Prisma, PayoutMethod } from "@prisma/client";
import {
  notifyAdminAlert,
  notifyApproved,
  notifyRejected,
} from "@/services/notify.service";

export const PUBLISHER_PAYOUT_REQUEST_COOLDOWN_DAYS = 7;

export type PublisherPayoutRequestEligibility = {
  canRequest: boolean;
  lastRequestAt?: Date;
  nextAllowedAt?: Date;
};

export async function getPublisherPayoutRequestEligibility(
  publisherId: string,
): Promise<PublisherPayoutRequestEligibility> {
  const since = new Date();
  since.setDate(since.getDate() - PUBLISHER_PAYOUT_REQUEST_COOLDOWN_DAYS);

  const recent = await prisma.payout.findFirst({
    where: {
      publisherId,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (!recent) {
    return { canRequest: true };
  }

  const nextAllowedAt = new Date(recent.createdAt);
  nextAllowedAt.setDate(nextAllowedAt.getDate() + PUBLISHER_PAYOUT_REQUEST_COOLDOWN_DAYS);

  return {
    canRequest: false,
    lastRequestAt: recent.createdAt,
    nextAllowedAt,
  };
}

export async function requestPayout(
  publisherId: string,
  amount: number,
  method: PayoutMethod,
  paymentDetails: PayoutPaymentDetails,
  idempotencyKey?: string,
) {
  const settings = await getPlatformSettings();
  const minAmount = getMinPayoutForMethod(method, settings);

  if (amount < minAmount) {
    throw Errors.payoutBelowMinimum(minAmount);
  }

  if (idempotencyKey) {
    const existing = await prisma.payout.findUnique({
      where: { idempotencyKey },
    });
    if (existing) throw Errors.duplicatePayout();
  }

  const eligibility = await getPublisherPayoutRequestEligibility(publisherId);
  if (!eligibility.canRequest && eligibility.nextAllowedAt) {
    throw Errors.payoutWeeklyLimit(eligibility.nextAllowedAt);
  }

  const wallet = await prisma.wallet.findUniqueOrThrow({
    where: { userId: publisherId },
  });

  const available = Number(wallet.balance) - Number(wallet.holdBalance);
  if (available < amount) {
    throw Errors.insufficientFunds();
  }

  const payout = await prisma.$transaction(async (tx) => {
    await holdWalletFunds(tx, publisherId, amount);

    return tx.payout.create({
      data: {
        publisherId,
        amount,
        method,
        paymentDetails: paymentDetails as Prisma.InputJsonValue,
        idempotencyKey,
        status: "PENDING",
      },
      include: { publisher: { select: { id: true, name: true, email: true } } },
    });
  });

  void notifyAdminAlert({
    title: "New payout request",
    message: `${payout.publisher.name} requested ${method} payout of $${amount.toFixed(2)}.`,
    actionPath: "/admin/payouts",
    metadata: { payoutId: payout.id },
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
    await debitWalletForPayout(
      tx,
      payout.publisherId,
      Number(payout.amount),
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

  const updated = await prisma.payout.findUniqueOrThrow({
    where: { id: payoutId },
    include: { publisher: { select: { id: true, name: true, email: true } } },
  });

  void notifyApproved(
    updated.publisher,
    "Payout request",
    `$${Number(updated.amount).toFixed(2)} has been processed to your payment method.`,
    "payout.approved",
  );

  return updated;
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
    await releaseWalletHold(tx, payout.publisherId, Number(payout.amount));

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

  const updated = await prisma.payout.findUniqueOrThrow({
    where: { id: payoutId },
    include: { publisher: { select: { id: true, name: true, email: true } } },
  });

  void notifyRejected(
    updated.publisher,
    "Payout request",
    trimmedReason,
    undefined,
    "payout.rejected",
  );

  return updated;
}

export async function listPendingPayouts() {
  return prisma.payout.findMany({
    where: { status: { in: [...PENDING_PAYOUT_STATUSES] } },
    include: { publisher: { select: payoutPublisherSelect } },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAdminPayouts(options: {
  publisherId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(50, Math.max(1, options.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Prisma.PayoutWhereInput = {};

  if (options.publisherId) {
    where.publisherId = options.publisherId;
  }

  if (options.status && options.status !== "all") {
    where.status = options.status as never;
  }

  if (options.dateFrom || options.dateTo) {
    where.createdAt = {};
    if (options.dateFrom) {
      const from = new Date(options.dateFrom);
      from.setHours(0, 0, 0, 0);
      where.createdAt.gte = from;
    }
    if (options.dateTo) {
      const to = new Date(options.dateTo);
      to.setHours(23, 59, 59, 999);
      where.createdAt.lte = to;
    }
  }

  const [data, total] = await Promise.all([
    prisma.payout.findMany({
      where,
      include: { publisher: { select: payoutPublisherSelect } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.payout.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function listPayoutPublisherOptions() {
  return prisma.user.findMany({
    where: { role: "PUBLISHER" },
    select: {
      id: true,
      name: true,
      email: true,
      publisherProfile: { select: { website: true } },
    },
    orderBy: { name: "asc" },
  });
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
