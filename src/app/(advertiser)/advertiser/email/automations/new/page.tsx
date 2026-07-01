import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { RoleHero } from "@/components/layout/role-hero";
import { EmailAutomationWizard } from "@/components/advertiser/email/email-automation-wizard";

export const dynamic = "force-dynamic";

export default async function NewEmailAutomationPage() {
  const session = await getSession();
  const campaigns = await prisma.campaign.findMany({
    where: { advertiserId: session!.user.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <RoleHero eyebrow="Email" title="New automation" description="Set up a welcome sequence or drip campaign." />
      <EmailAutomationWizard campaigns={campaigns} />
    </div>
  );
}
