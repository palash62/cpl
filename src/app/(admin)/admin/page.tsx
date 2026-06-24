import {
  Users,
  Megaphone,
  FileText,
  CheckCircle,
  XCircle,
  DollarSign,
  Building2,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { LeadsTrendChart } from "@/components/dashboard/dashboard-charts";
import { getAdminDashboardStats } from "@/services/report.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <p className="text-muted-foreground">Platform overview and key metrics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Advertisers" value={stats.totalAdvertisers} icon={Building2} trend={12} />
        <StatCard label="Total Publishers" value={stats.totalPublishers} icon={Users} trend={8} />
        <StatCard label="Total Campaigns" value={stats.totalCampaigns} icon={Megaphone} />
        <StatCard label="Total Leads" value={stats.totalLeads} icon={FileText} trend={15} />
        <StatCard label="Approved Leads" value={stats.approvedLeads} icon={CheckCircle} trend={10} />
        <StatCard label="Rejected Leads" value={stats.rejectedLeads} icon={XCircle} />
        <StatCard label="Revenue" value={`$${stats.revenue.toFixed(2)}`} icon={DollarSign} trend={18} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LeadsTrendChart title="Leads Trend (30 days)" data={stats.leadsTrend} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending Payouts</span>
              <Badge variant="secondary">{stats.pendingPayouts}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Open Tickets</span>
              <Badge variant="secondary">{stats.openTickets}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <div>
                  <p className="text-sm font-medium">{lead.campaign.name}</p>
                  <p className="text-xs text-muted-foreground">{lead.publisher.name}</p>
                </div>
                <Badge>{lead.status}</Badge>
              </div>
            ))}
            {stats.recentLeads.length === 0 && (
              <p className="text-sm text-muted-foreground">No leads yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
