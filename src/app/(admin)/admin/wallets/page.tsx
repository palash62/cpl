import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminWalletsPage() {
  const wallets = await prisma.wallet.findMany({
    include: { user: { select: { name: true, email: true, role: true } } },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Wallets</h2>
      {wallets.map((w) => (
        <Card key={w.id}>
          <CardHeader><CardTitle className="text-base">{w.user.name}</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {w.user.email} · {w.user.role} · ${Number(w.balance).toFixed(2)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
