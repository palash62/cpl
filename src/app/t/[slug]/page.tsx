import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { LeadForm } from "@/components/forms/lead-form";

export default async function PublicLeadFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const link = await prisma.trackingLink.findUnique({
    where: { slug },
    include: {
      campaign: {
        include: { fields: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!link || link.campaign.status !== "ACTIVE") {
    notFound();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <LeadForm
        slug={slug}
        campaignName={link.campaign.name}
        fields={link.campaign.fields}
      />
    </div>
  );
}
