"use client";

import {
  DonutChart,
  LeadsTrendChart,
  PerformanceBarChart,
} from "@/components/dashboard/dashboard-charts";
import { AdminLeadsTrendChart } from "@/components/admin/admin-dashboard-charts";

export function ReportsChartsRow({
  leadsTrend,
  statusMix,
  topCampaigns,
  variant = "advertiser",
}: {
  leadsTrend: Array<{ date: string; count: number }>;
  statusMix: Array<{ name: string; value: number }>;
  topCampaigns: Array<{ name: string; value: number }>;
  variant?: "advertiser" | "admin";
}) {
  const trendChart =
    variant === "admin" ? (
      <AdminLeadsTrendChart data={leadsTrend} />
    ) : (
      <LeadsTrendChart title="Leads over time" data={leadsTrend} />
    );

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {trendChart}
      <DonutChart title="Lead status mix" data={statusMix.length > 0 ? statusMix : [{ name: "No data", value: 1 }]} />
      <PerformanceBarChart
        title="Top campaigns by leads"
        data={topCampaigns.length > 0 ? topCampaigns : [{ name: "No data", value: 0 }]}
      />
    </div>
  );
}

export function AdminEntityBarChart({
  title,
  data,
}: {
  title: string;
  data: Array<{ name: string; value: number }>;
}) {
  return (
    <PerformanceBarChart
      title={title}
      data={data.length > 0 ? data : [{ name: "No data", value: 0 }]}
    />
  );
}
