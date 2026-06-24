import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function PublisherLeadsPage() {
  const session = await auth();
  const leads = await prisma.lead.findMany({
    where: { publisherId: session!.user.id },
    include: { campaign: { select: { name: true, cpl: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Leads</h2>
      {leads.map((l) => (
        <Card key={l.id}>
          <CardHeader className="flex flex-row justify-between">
            <CardTitle className="text-base">{l.campaign.name}</CardTitle>
            <Badge>{l.status}</Badge>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            ${Number(l.campaign.cpl).toFixed(2)} CPL potential
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
