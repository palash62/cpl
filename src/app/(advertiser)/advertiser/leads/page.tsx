import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApproveLeadButton } from "@/components/forms/approve-lead-button";

export default async function AdvertiserLeadsPage() {
  const session = await auth();
  const leads = await prisma.lead.findMany({
    where: { campaign: { advertiserId: session!.user.id } },
    include: { campaign: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Leads</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Leads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {leads.map((lead) => {
            const data = lead.data as Record<string, string>;
            return (
              <div key={lead.id} className="flex items-center justify-between border-b py-3 last:border-0">
                <div>
                  <p className="font-medium">{data.first_name ?? data.email ?? "Lead"}</p>
                  <p className="text-xs text-muted-foreground">{lead.campaign.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{lead.status}</Badge>
                  {lead.status === "PENDING" && <ApproveLeadButton leadId={lead.id} />}
                </div>
              </div>
            );
          })}
          {leads.length === 0 && <p className="text-muted-foreground">No leads yet</p>}
        </CardContent>
      </Card>
    </div>
  );
}
