import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  const session = await auth();
  const payouts = await prisma.payout.findMany({
    where: { publisherId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Payout History</h2>
        <ButtonLink href="/publisher/payouts/request">Request Payout</ButtonLink>
      </div>
      {payouts.map((p) => (
        <Card key={p.id}>
          <CardHeader className="flex flex-row justify-between">
            <CardTitle className="text-base">${Number(p.amount).toFixed(2)}</CardTitle>
            <Badge>{p.status}</Badge>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{p.method}</CardContent>
        </Card>
      ))}
    </div>
  );
}
