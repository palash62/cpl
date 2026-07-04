import { prisma } from "@cpl/database";
import { notFound } from "next/navigation";
import { sanitizeTrackingParam } from "@cpl/shared";
import { LeadForm } from "@/components/forms/lead-form";

export default async function PublicLeadFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ src?: string; sub_id?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const source = sanitizeTrackingParam(query.src);
  const subId = sanitizeTrackingParam(query.sub_id);

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
    <div className="form-page">
      <div className="form-header">
        <p>LeadFlow</p>
        <h1>Secure Lead Submission</h1>
      </div>
      <LeadForm
        slug={slug}
        campaignName={link.campaign.name}
        fields={link.campaign.fields}
        source={source}
        subId={subId}
      />
    </div>
  );
}
