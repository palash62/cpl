import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function PublisherCampaignsPage() {
  const session = await auth();
  const joins = await prisma.publisherCampaign.findMany({
    where: { publisherId: session!.user!.id },
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
          cpl: true,
          status: true,
          category: true,
          trackingLinks: {
            where: { publisherId: session!.user!.id },
            select: { slug: true, clickCount: true },
          },
        },
      },
    },
    orderBy: { approvedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="My Campaigns" description="Campaigns you've joined and your tracking links" />
      <div className="grid gap-4 md:grid-cols-2">
        {joins.map((j) => (
          <div key={j.id} className="premium-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{j.campaign.name}</CardTitle>
              <Badge variant="outline">{j.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-lg font-bold text-[var(--theme-primary)]">${Number(j.campaign.cpl).toFixed(2)} per lead</p>
              <p className="text-sm text-slate-500">{j.campaign.category}</p>
              {j.campaign.trackingLinks[0] && (
                <p className="text-xs text-slate-500">
                  Link: /t/{j.campaign.trackingLinks[0].slug} · {j.campaign.trackingLinks[0].clickCount} clicks
                </p>
              )}
            </CardContent>
          </div>
        ))}
        {joins.length === 0 && (
          <div className="premium-card col-span-2">
            <CardContent className="py-12 text-center text-slate-500">
              No campaigns joined yet. Browse the Marketplace to get started.
            </CardContent>
          </div>
        )}
      </div>
    </div>
  );
}
