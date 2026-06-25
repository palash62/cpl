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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--theme-bg)] p-4">
      <div className="mb-8 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-slate-400">LeadFlow</p>
        <h1 className="mt-1 text-lg font-semibold text-slate-700">Secure Lead Submission</h1>
      </div>
      <LeadForm
        slug={slug}
        campaignName={link.campaign.name}
        fields={link.campaign.fields}
      />
    </div>
  );
}
