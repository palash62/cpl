import { getAdminDashboardStats } from "@/services/report.service";
import { prisma } from "@/lib/prisma";
import { ReportsSummary } from "@/components/reports/reports-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const stats = await getAdminDashboardStats();
  const fees = await prisma.platformFee.aggregate({ _sum: { feeAmount: true }, _count: true });
  const payouts = await prisma.payout.groupBy({
    by: ["status"],
    _count: true,
    _sum: { amount: true },
  });

  return (
    <div className="space-y-6">
      <ReportsSummary
        title="Platform Reports"
        metrics={[
          { label: "Total Leads", value: stats.totalLeads },
          { label: "Approved Leads", value: stats.approvedLeads },
          { label: "Rejected Leads", value: stats.rejectedLeads },
          { label: "Platform Revenue", value: `$${stats.revenue.toFixed(2)}` },
          { label: "Active Advertisers", value: stats.totalAdvertisers },
          { label: "Active Publishers", value: stats.totalPublishers },
          { label: "Open Tickets", value: stats.openTickets },
          { label: "Pending Payouts", value: stats.pendingPayouts },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payout Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {payouts.map((p) => (
            <div key={p.status} className="flex justify-between text-sm border-b py-2 last:border-0">
              <span>{p.status}</span>
              <span>{p._count} · ${Number(p._sum.amount ?? 0).toFixed(2)}</span>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-2">
            {fees._count} platform fees collected · ${Number(fees._sum.feeAmount ?? 0).toFixed(2)} total
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
