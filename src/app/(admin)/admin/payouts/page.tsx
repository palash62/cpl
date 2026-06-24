import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApprovePayoutButton } from "@/components/forms/approve-payout-button";
import { RejectPayoutButton } from "@/components/forms/reject-payout-button";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  const payouts = await prisma.payout.findMany({
    where: { status: "REQUESTED" },
    include: { publisher: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Payouts Queue</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pending Payouts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {payouts.map((p) => (
            <div key={p.id} className="flex items-center justify-between border-b py-3 last:border-0">
              <div>
                <p className="font-medium">{p.publisher.name}</p>
                <p className="text-xs text-muted-foreground">{p.publisher.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">${Number(p.amount).toFixed(2)}</span>
                <Badge>{p.method}</Badge>
                <ApprovePayoutButton payoutId={p.id} />
                <RejectPayoutButton payoutId={p.id} />
              </div>
            </div>
          ))}
          {payouts.length === 0 && <p className="text-muted-foreground">No pending payouts</p>}
        </CardContent>
      </Card>
    </div>
  );
}
