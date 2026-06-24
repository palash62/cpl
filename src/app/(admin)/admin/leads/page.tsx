import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const leads = await prisma.lead.findMany({
    include: { campaign: { select: { name: true } }, publisher: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">All Leads</h2>
      <Card>
        <CardHeader><CardTitle className="text-base">Lead Queue</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {leads.map((l) => (
            <div key={l.id} className="flex justify-between border-b py-2 last:border-0">
              <span className="text-sm">{l.campaign.name} · {l.publisher.name}</span>
              <Badge>{l.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
