import { prisma } from "@/lib/prisma";
import {
  AUTOMATION_DAY_WINDOW_EXPIRED_ERROR,
  computeAutomationDayWindow,
  isWithinAutomationDayWindow,
  nextAutomationRetryAt,
  type AutomationDayWindow,
} from "../lib/automation-day-window";

export type AutomationSendRetryResult =
  | { deferred: false }
  | { deferred: true; until: Date };

export async function resolveAutomationDayWindow(input: {
  automationId: string;
  stepOrder: number;
  stepDelayMinutes: number;
  scheduledAt: Date;
}): Promise<AutomationDayWindow> {
  const nextStep = await prisma.emailAutomationStep.findFirst({
    where: {
      automationId: input.automationId,
      order: { gt: input.stepOrder },
      type: "SEND_EMAIL",
    },
    orderBy: { order: "asc" },
    select: { delayMinutes: true },
  });

  return computeAutomationDayWindow({
    scheduledAt: input.scheduledAt,
    stepDelayMinutes: input.stepDelayMinutes,
    nextStepDelayMinutes: nextStep?.delayMinutes ?? null,
  });
}

export async function deferAutomationSendRetry(input: {
  sendId: string;
  automationId: string;
  stepOrder: number;
  stepDelayMinutes: number;
  scheduledAt: Date;
  attemptCount: number;
  error: string;
  broadcastId?: string | null;
}): Promise<AutomationSendRetryResult> {
  const window = await resolveAutomationDayWindow({
    automationId: input.automationId,
    stepOrder: input.stepOrder,
    stepDelayMinutes: input.stepDelayMinutes,
    scheduledAt: input.scheduledAt,
  });

  const now = new Date();
  if (!isWithinAutomationDayWindow(window, now)) {
    await prisma.emailSend.update({
      where: { id: input.sendId },
      data: {
        status: "FAILED",
        error: AUTOMATION_DAY_WINDOW_EXPIRED_ERROR,
        attemptCount: input.attemptCount + 1,
      },
    });
    return { deferred: false };
  }

  const retryAt = nextAutomationRetryAt(window, now);
  if (!retryAt) {
    await prisma.emailSend.update({
      where: { id: input.sendId },
      data: {
        status: "FAILED",
        error: AUTOMATION_DAY_WINDOW_EXPIRED_ERROR,
        attemptCount: input.attemptCount + 1,
      },
    });
    return { deferred: false };
  }

  await prisma.emailSend.update({
    where: { id: input.sendId },
    data: {
      status: "QUEUED",
      scheduledAt: retryAt,
      error: input.error,
      attemptCount: input.attemptCount + 1,
    },
  });

  return { deferred: true, until: retryAt };
}
