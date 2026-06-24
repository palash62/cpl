import { listUsers } from "@/services/admin.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserStatusButton } from "@/components/forms/user-status-button";

export const dynamic = "force-dynamic";

export default async function AdminPublishersPage() {
  const { data: publishers } = await listUsers({ role: "PUBLISHER", limit: 50 });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Publishers</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Publisher Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {publishers.map((u) => (
            <div key={u.id} className="flex items-center justify-between border-b py-3 last:border-0">
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
                {u.publisherProfile && (
                  <p className="text-xs text-muted-foreground">KYC: {u.publisherProfile.kycStatus}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm">{u._count.leads} leads</span>
                <span className="text-sm">${Number(u.wallet?.balance ?? 0).toFixed(2)}</span>
                <Badge>{u.status}</Badge>
                <UserStatusButton userId={u.id} currentStatus={u.status} />
              </div>
            </div>
          ))}
          {publishers.length === 0 && <p className="text-muted-foreground">No publishers</p>}
        </CardContent>
      </Card>
    </div>
  );
}
