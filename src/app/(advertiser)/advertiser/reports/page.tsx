import { auth } from "@/lib/auth";
import { getAdvertiserDashboardStats } from "@/services/report.service";
import { ReportsSummary } from "@/components/reports/reports-summary";

export const dynamic = "force-dynamic";

export default async function AdvertiserReportsPage() {
  const session = await auth();
  const stats = await getAdvertiserDashboardStats(session!.user!.id);

  return (
    <ReportsSummary
      title="Campaign Reports"
      description="Performance metrics across your campaigns"
      metrics={[
        { label: "Active Campaigns", value: stats.activeCampaigns },
        { label: "Total Leads", value: stats.totalLeads },
        { label: "Approved", value: stats.approvedLeads },
        { label: "Rejected", value: stats.rejectedLeads },
        { label: "Total Spend", value: `$${stats.totalSpend.toFixed(2)}` },
        { label: "Avg CPL", value: `$${stats.avgCpl.toFixed(2)}` },
      ]}
    />
  );
}
