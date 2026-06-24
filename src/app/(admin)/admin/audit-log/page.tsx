import { listAuditLogs } from "@/services/admin.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogPage() {
  const { data: logs } = await listAuditLogs({ limit: 100 });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Audit Log</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex justify-between border-b py-2 text-sm last:border-0">
              <div>
                <span className="font-medium">{log.action}</span>
                <span className="text-muted-foreground"> · {log.entityType}</span>
                {log.actor && (
                  <p className="text-xs text-muted-foreground">{log.actor.name} ({log.actor.email})</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {format(log.createdAt, "MMM d, yyyy HH:mm")}
              </span>
            </div>
          ))}
          {logs.length === 0 && <p className="text-muted-foreground">No audit entries</p>}
        </CardContent>
      </Card>
    </div>
  );
}
