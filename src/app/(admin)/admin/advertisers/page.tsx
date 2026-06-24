import { listUsers } from "@/services/admin.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserStatusButton } from "@/components/forms/user-status-button";

export const dynamic = "force-dynamic";

export default async function AdminAdvertisersPage() {
  const { data: advertisers } = await listUsers({ role: "ADVERTISER", limit: 50 });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Advertisers</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Advertiser Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {advertisers.map((u) => (
            <div key={u.id} className="flex items-center justify-between border-b py-3 last:border-0">
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
                {u.advertiserProfile?.company && (
                  <p className="text-xs text-muted-foreground">{u.advertiserProfile.company}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm">${Number(u.wallet?.balance ?? 0).toFixed(2)}</span>
                <Badge>{u.status}</Badge>
                <UserStatusButton userId={u.id} currentStatus={u.status} />
              </div>
            </div>
          ))}
          {advertisers.length === 0 && <p className="text-muted-foreground">No advertisers</p>}
        </CardContent>
      </Card>
    </div>
  );
}
