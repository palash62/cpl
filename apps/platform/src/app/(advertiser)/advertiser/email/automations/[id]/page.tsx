import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AutomationBuilderShell } from "@/components/advertiser/email/automation-builder/automation-builder-shell";

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

  return <AutomationBuilderShell automationId={id} campaigns={campaigns} />;
}
