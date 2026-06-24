import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";

export default async function AdvertiserCampaignsPage() {
  const session = await auth();
  const campaigns = await prisma.campaign.findMany({
    where: { advertiserId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { leads: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Campaigns</h2>
        <ButtonLink href="/advertiser/campaigns/new">Create Campaign</ButtonLink>
      </div>
      <div className="grid gap-4">
        {campaigns.map((c) => (
          <Card key={c.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">{c.name}</CardTitle>
              <Badge>{c.status}</Badge>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                ${Number(c.cpl).toFixed(2)} CPL · {c._count.leads} leads · ${Number(c.spent).toFixed(2)} spent
              </div>
              <ButtonLink href={`/advertiser/campaigns/${c.id}`} variant="outline" size="sm">View</ButtonLink>
            </CardContent>
          </Card>
        ))}
        {campaigns.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No campaigns yet. Create your first campaign to start collecting leads.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
