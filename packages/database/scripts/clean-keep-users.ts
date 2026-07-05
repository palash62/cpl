/**
 * Wipe all business data; keep only the three seed users (+ profiles/wallets).
 */
import { PrismaClient } from "@prisma/client";

const KEEP_EMAILS = ["admin@cpl.local", "advertiser@cpl.local", "publisher@cpl.local"];

const prisma = new PrismaClient();

async function main() {
  const keepUsers = await prisma.user.findMany({
    where: { email: { in: KEEP_EMAILS } },
    select: { id: true, email: true, role: true },
  });

  if (keepUsers.length !== 3) {
    const found = keepUsers.map((u) => u.email).join(", ");
    throw new Error(`Expected 3 seed users, found ${keepUsers.length}: ${found}`);
  }

  const keepIds = keepUsers.map((u) => u.id);

  await prisma.$transaction(async (tx) => {
    await tx.emailEvent.deleteMany();
    await tx.emailSend.deleteMany();
    await tx.emailAutomationStep.deleteMany();
    await tx.emailAutomation.deleteMany();
    await tx.emailTemplate.deleteMany();
    await tx.emailContact.deleteMany();
    await tx.emailLog.deleteMany();
    await tx.autoresponderDelivery.deleteMany();
    await tx.advertiserAutoresponder.deleteMany();
    await tx.advertiserSendingIdentity.deleteMany();
    await tx.advertiserEmailSettings.deleteMany();
    await tx.landingPageAsset.deleteMany();
    await tx.landingPageVersion.deleteMany();
    await tx.pageTemplateFavorite.deleteMany();
    await tx.landingPage.deleteMany();
    await tx.pageTemplate.deleteMany();
    await tx.funnelEvent.deleteMany();
    await tx.optinFunnelVersion.deleteMany();
    await tx.advertiserOptinPage.deleteMany();
    await tx.pixelEvent.deleteMany();
    await tx.leadDeviceSeen.deleteMany();
    await tx.leadValidationResult.deleteMany();
    await tx.leadStatusHistory.deleteMany();
    await tx.platformFee.deleteMany();
    await tx.lead.deleteMany();
    await tx.click.deleteMany();
    await tx.trackingLink.deleteMany();
    await tx.publisherSmartLink.deleteMany();
    await tx.advertiserPublisherBlock.deleteMany();
    await tx.publisherCampaign.deleteMany();
    await tx.campaignField.deleteMany();
    await tx.campaign.deleteMany();
    await tx.ledgerEntry.deleteMany();
    await tx.deposit.deleteMany();
    await tx.payout.deleteMany();
    await tx.notification.deleteMany();
    await tx.ticketMessage.deleteMany();
    await tx.supportTicket.deleteMany();
    await tx.auditLog.deleteMany();
    await tx.impersonationToken.deleteMany();
    await tx.passwordResetToken.deleteMany();
    await tx.emailVerificationToken.deleteMany();
    await tx.ipBlocklist.deleteMany();

    await tx.user.deleteMany({ where: { id: { notIn: keepIds } } });

    await tx.wallet.updateMany({
      data: { balance: 0, holdBalance: 0 },
    });
  });

  console.log("Database cleaned. Kept users:");
  for (const email of KEEP_EMAILS) {
    console.log(`  - ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
