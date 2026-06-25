import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";

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
      <PageHeader title="My Leads" description="Track leads you've generated across campaigns" />
      <div className="grid gap-4 md:grid-cols-2">
        {leads.map((l) => (
          <div key={l.id} className="premium-card">
            <CardHeader className="flex flex-row justify-between">
              <CardTitle className="text-base">{l.campaign.name}</CardTitle>
              <Badge variant="outline">{l.status}</Badge>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">
              ${Number(l.campaign.cpl).toFixed(2)} CPL potential
            </CardContent>
          </div>
        ))}
        {leads.length === 0 && (
          <div className="premium-card col-span-2">
            <CardContent className="py-12 text-center text-slate-500">No leads yet</CardContent>
          </div>
        )}
      </div>
    </div>
  );
}
