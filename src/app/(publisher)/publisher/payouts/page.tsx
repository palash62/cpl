import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  const session = await auth();
  const payouts = await prisma.payout.findMany({
    where: { publisherId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Payout History" description="Track your payout requests and status">
        <ButtonLink href="/publisher/payouts/request">Request Payout</ButtonLink>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2">
        {payouts.map((p) => (
          <div key={p.id} className="premium-card">
            <CardHeader className="flex flex-row justify-between">
              <CardTitle className="text-base">${Number(p.amount).toFixed(2)}</CardTitle>
              <Badge variant="outline">{p.status}</Badge>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">{p.method}</CardContent>
          </div>
        ))}
        {payouts.length === 0 && (
          <div className="premium-card col-span-2">
            <CardContent className="py-12 text-center text-slate-500">No payout history yet</CardContent>
          </div>
        )}
      </div>
    </div>
  );
}
