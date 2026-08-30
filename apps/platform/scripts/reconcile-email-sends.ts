/**
 * Re-queue EmailSend rows stuck in QUEUED after their scheduled_at.
 *
 * Usage (from apps/platform, with .env loaded):
 *   set -a && source .env && set +a
 *   npx tsx scripts/reconcile-email-sends.ts
 *
 * Options:
 *   --dry-run   Print matches only (default if DRY_RUN=1)
 *   --minutes=N Stuck if scheduled_at older than N minutes (default 15)
 */
import { prisma } from "../src/lib/prisma";
import {
  AUTOMATION_DAY_WINDOW_EXPIRED_ERROR,
  isRecoverableAutomationError,
  isWithinAutomationDayWindow,
  nextAutomationRetryAt,
} from "../src/modules/email-marketing/lib/automation-day-window";
import { resolveAutomationDayWindow } from "../src/modules/email-marketing/services/automation-send-retry.service";
import {
  enqueueEmailSend,
  removeEmailSendJob,
  closeEmailQueue,
} from "../src/modules/email-marketing/queue/email-queue";

function parseArgs(argv: string[]) {
  let dryRun = process.env.DRY_RUN === "1";
  let minutes = 15;
  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    const m = arg.match(/^--minutes=(\d+)$/);
    if (m) minutes = Math.max(1, Number(m[1]));
  }
  return { dryRun, minutes };
}

async function main() {
  const { dryRun, minutes } = parseArgs(process.argv.slice(2));
  const cutoff = new Date(Date.now() - minutes * 60_000);

  const stuck = await prisma.emailSend.findMany({
    where: {
      OR: [
        { status: "QUEUED", scheduledAt: { lt: cutoff } },
        {
          status: "FAILED",
          automationId: { not: null },
        },
      ],
    },
    select: {
      id: true,
      advertiserId: true,
      automationId: true,
      scheduledAt: true,
      attemptCount: true,
      error: true,
      status: true,
      createdAt: true,
      step: {
        select: { order: true, delayMinutes: true },
      },
    },
    orderBy: { scheduledAt: "asc" },
    take: 500,
  });

  console.log(
    `[reconcile-email-sends] found ${stuck.length} candidate send(s) (dryRun=${dryRun})`,
  );

  let requeued = 0;
  let expired = 0;
  let skipped = 0;

  for (const send of stuck) {
    const isAutomation = Boolean(send.automationId && send.step);

    if (send.status === "FAILED") {
      if (!isAutomation || !isRecoverableAutomationError(send.error)) {
        skipped += 1;
        continue;
      }
    } else if (send.scheduledAt >= cutoff) {
      skipped += 1;
      continue;
    }

    console.log(
      `  ${send.id} status=${send.status} scheduled=${send.scheduledAt.toISOString()} attempts=${send.attemptCount} error=${send.error ?? "-"}`,
    );

    if (isAutomation && send.automationId && send.step) {
      const window = await resolveAutomationDayWindow({
        automationId: send.automationId,
        stepOrder: send.step.order,
        stepDelayMinutes: send.step.delayMinutes,
        scheduledAt: send.scheduledAt,
      });

      if (!isWithinAutomationDayWindow(window)) {
        if (!dryRun) {
          await prisma.emailSend.update({
            where: { id: send.id },
            data: {
              status: "FAILED",
              error: AUTOMATION_DAY_WINDOW_EXPIRED_ERROR,
            },
          });
        }
        expired += 1;
        continue;
      }

      const retryAt = nextAutomationRetryAt(window) ?? new Date();
      if (dryRun) continue;

      await removeEmailSendJob(send.id);
      await prisma.emailSend.update({
        where: { id: send.id },
        data: {
          status: "QUEUED",
          scheduledAt: retryAt,
        },
      });
      await enqueueEmailSend(send.id, retryAt, { isAutomation: true });
      requeued += 1;
      continue;
    }

    if (dryRun) continue;

    await removeEmailSendJob(send.id);
    await enqueueEmailSend(send.id, new Date(), { isAutomation: false });
    requeued += 1;
  }

  if (!dryRun) {
    console.log(
      `[reconcile-email-sends] re-queued ${requeued}, expired ${expired}, skipped ${skipped}`,
    );
  }

  await closeEmailQueue();
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("[reconcile-email-sends] fatal:", err);
  await closeEmailQueue().catch(() => {});
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
