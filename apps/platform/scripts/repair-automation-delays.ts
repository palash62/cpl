/**
 * Repair automation step delays stored as duplicate absolute values (0, 1440, 1440…).
 *
 * Usage (from apps/platform, with .env loaded):
 *   set -a && source .env && set +a
 *   npx tsx scripts/repair-automation-delays.ts --dry-run
 *   npx tsx scripts/repair-automation-delays.ts
 *   npx tsx scripts/repair-automation-delays.ts --requeue
 */
import { prisma } from "../src/lib/prisma";
import { repairCumulativeStepDelays } from "../src/modules/email-marketing/lib/automation-step-delays";
import {
  closeEmailQueue,
  enqueueEmailSend,
  removeEmailSendJob,
} from "../src/modules/email-marketing/queue/email-queue";

function parseArgs(argv: string[]) {
  let dryRun = true;
  let requeue = false;
  for (const arg of argv) {
    if (arg === "--apply") dryRun = false;
    if (arg === "--dry-run") dryRun = true;
    if (arg === "--requeue") requeue = true;
  }
  return { dryRun, requeue: requeue && !dryRun };
}

async function main() {
  const { dryRun, requeue } = parseArgs(process.argv.slice(2));
  console.log(
    `[repair-automation-delays] dryRun=${dryRun} requeue=${requeue}`,
  );

  const automations = await prisma.emailAutomation.findMany({
    include: {
      steps: {
        where: { type: "SEND_EMAIL" },
        orderBy: { order: "asc" },
        select: { id: true, order: true, delayMinutes: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  let automationsChanged = 0;
  let stepsUpdated = 0;
  let sendsRequeued = 0;

  for (const automation of automations) {
    if (automation.steps.length === 0) continue;

    const before = automation.steps.map((s) => s.delayMinutes);
    const { steps: repaired, changed } = repairCumulativeStepDelays(
      automation.steps,
    );
    if (!changed) continue;

    automationsChanged += 1;
    const after = repaired.map((s) => s.delayMinutes);
    console.log(
      `\n${automation.name} (${automation.id}) status=${automation.status}`,
    );
    for (let i = 0; i < repaired.length; i += 1) {
      console.log(
        `  step ${repaired[i]!.order}: ${before[i]} -> ${after[i]} min`,
      );
    }

    if (dryRun) continue;

    for (const step of repaired) {
      if (step.delayMinutes === automation.steps.find((s) => s.id === step.id)?.delayMinutes) {
        continue;
      }
      await prisma.emailAutomationStep.update({
        where: { id: step.id },
        data: { delayMinutes: step.delayMinutes },
      });
      stepsUpdated += 1;
    }

    if (!requeue || automation.status !== "ACTIVE") continue;

    const queuedSends = await prisma.emailSend.findMany({
      where: {
        automationId: automation.id,
        status: "QUEUED",
      },
      include: {
        step: { select: { delayMinutes: true } },
      },
    });

    for (const send of queuedSends) {
      if (!send.step) continue;
      const expectedAt = new Date(
        send.createdAt.getTime() + send.step.delayMinutes * 60_000,
      );
      const driftMs = Math.abs(send.scheduledAt.getTime() - expectedAt.getTime());
      if (driftMs < 60_000) continue;

      console.log(
        `  requeue send ${send.id}: ${send.scheduledAt.toISOString()} -> ${expectedAt.toISOString()}`,
      );
      await removeEmailSendJob(send.id);
      await prisma.emailSend.update({
        where: { id: send.id },
        data: { scheduledAt: expectedAt },
      });
      await enqueueEmailSend(send.id, expectedAt, { isAutomation: true });
      sendsRequeued += 1;
    }
  }

  console.log(
    `\n[repair-automation-delays] automations=${automationsChanged} stepsUpdated=${stepsUpdated} sendsRequeued=${sendsRequeued}`,
  );

  await closeEmailQueue();
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("[repair-automation-delays] fatal:", err);
  await closeEmailQueue().catch(() => {});
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
