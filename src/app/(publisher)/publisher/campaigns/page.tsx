import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      <h2 className="text-2xl font-bold">My Campaigns</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {joins.map((j) => (
          <Card key={j.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{j.campaign.name}</CardTitle>
              <Badge>{j.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-lg font-bold text-primary">${Number(j.campaign.cpl).toFixed(2)} per lead</p>
              <p className="text-sm text-muted-foreground">{j.campaign.category}</p>
              {j.campaign.trackingLinks[0] && (
                <p className="text-xs text-muted-foreground">
                  Link: /t/{j.campaign.trackingLinks[0].slug} · {j.campaign.trackingLinks[0].clickCount} clicks
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {joins.length === 0 && (
          <Card className="col-span-2">
            <CardContent className="py-12 text-center text-muted-foreground">
              No campaigns joined yet. Browse the Marketplace to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
