import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    include: { advertiser: { select: { name: true } }, _count: { select: { leads: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">All Campaigns</h2>
      {campaigns.map((c) => (
        <Card key={c.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{c.name}</CardTitle>
            <Badge>{c.status}</Badge>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {c.advertiser.name} · ${Number(c.cpl).toFixed(2)} CPL · {c._count.leads} leads
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
