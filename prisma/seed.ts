import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  await prisma.platformSetting.upsert({
    where: { key: "platform_fee_percent" },
    create: { key: "platform_fee_percent", value: 10 },
    update: {},
  });
  await prisma.platformSetting.upsert({
    where: { key: "min_payout_amount" },
    create: { key: "min_payout_amount", value: 50 },
    update: {},
  });
  await prisma.platformSetting.upsert({
    where: { key: "duplicate_window_days" },
    create: { key: "duplicate_window_days", value: 30 },
    update: {},
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@cpl.local" },
    create: {
      email: "admin@cpl.local",
      passwordHash,
      name: "Platform Admin",
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      wallet: { create: {} },
    },
    update: { status: "ACTIVE" },
  });

  const advertiser = await prisma.user.upsert({
    where: { email: "advertiser@cpl.local" },
    create: {
      email: "advertiser@cpl.local",
      passwordHash,
      name: "Demo Advertiser",
      role: "ADVERTISER",
      status: "ACTIVE",
      emailVerified: new Date(),
      wallet: { create: { balance: 1000 } },
      advertiserProfile: { create: { company: "Demo Corp" } },
    },
    update: { status: "ACTIVE" },
  });

  const publisher = await prisma.user.upsert({
    where: { email: "publisher@cpl.local" },
    create: {
      email: "publisher@cpl.local",
      passwordHash,
      name: "Demo Publisher",
      role: "PUBLISHER",
      status: "ACTIVE",
      emailVerified: new Date(),
      wallet: { create: {} },
      publisherProfile: { create: { kycStatus: "APPROVED" } },
    },
    update: { status: "ACTIVE" },
  });

  const campaign = await prisma.campaign.upsert({
    where: { id: "seed-campaign-001" },
    create: {
      id: "seed-campaign-001",
      advertiserId: advertiser.id,
      name: "Finance Leads Demo",
      description: "Sample finance lead generation campaign",
      category: "FINANCE",
      cpl: 25,
      budget: 500,
      status: "ACTIVE",
      publisherAccess: "OPEN",
      autoApprove: true,
      targeting: { countries: ["US"] },
      fields: {
        create: [
          { fieldName: "first_name", label: "First Name", fieldType: "text", required: true, sortOrder: 0 },
          { fieldName: "email", label: "Email", fieldType: "email", required: true, sortOrder: 1 },
          { fieldName: "phone", label: "Phone", fieldType: "phone", required: true, sortOrder: 2 },
        ],
      },
    },
    update: { status: "ACTIVE" },
  });

  await prisma.publisherCampaign.upsert({
    where: {
      publisherId_campaignId: {
        publisherId: publisher.id,
        campaignId: campaign.id,
      },
    },
    create: {
      publisherId: publisher.id,
      campaignId: campaign.id,
      status: "APPROVED",
      approvedAt: new Date(),
    },
    update: { status: "APPROVED" },
  });

  const link = await prisma.trackingLink.upsert({
    where: { slug: "demo-link" },
    create: {
      publisherId: publisher.id,
      campaignId: campaign.id,
      slug: "demo-link",
    },
    update: {},
  });

  console.log("Seed complete:");
  console.log("  Admin:      admin@cpl.local / password123");
  console.log("  Advertiser: advertiser@cpl.local / password123");
  console.log("  Publisher:  publisher@cpl.local / password123");
  console.log(`  Demo form:  /t/${link.slug}`);
  console.log("  Admin ID:", admin.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
