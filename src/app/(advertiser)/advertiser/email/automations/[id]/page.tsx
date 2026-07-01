import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { RoleHero } from "@/components/layout/role-hero";
import { EmailAutomationWizard } from "@/components/advertiser/email/email-automation-wizard";
import { EmailAutomationStats } from "@/components/advertiser/email/email-automation-stats";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditEmailAutomationPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  const campaigns = await prisma.campaign.findMany({
    where: { advertiserId: session!.user.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <RoleHero eyebrow="Email" title="Edit automation" description="Update steps, triggers, and sender details." />
      <EmailAutomationStats automationId={id} />
      <EmailAutomationWizard automationId={id} campaigns={campaigns} />
    </div>
  );
}
