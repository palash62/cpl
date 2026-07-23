import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NewAutomationExperience } from "@/components/advertiser/email/automation-builder";

export const dynamic = "force-dynamic";

export default async function NewEmailAutomationPage() {
  const session = await getSession();
  const campaigns = await prisma.campaign.findMany({
    where: { advertiserId: session!.user.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <NewAutomationExperience campaigns={campaigns} />;
}
