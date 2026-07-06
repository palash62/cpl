"use client";

import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Mail,
  MousePointerClick,
} from "lucide-react";
import { LeadsTrendChart, PerformanceBarChart } from "@/components/dashboard/dashboard-charts";
import { EmailModuleShell } from "../email-module-shell";
import { MOCK_ANALYTICS_BARS, MOCK_OPENS_TREND } from "../email-mock-data";

export function AnalyticsPanel() {
  return (
    <EmailModuleShell
      title="Analytics"
      description="Track email delivery, opens, clicks, and bounces across your campaigns."
      breadcrumbs={[
        { label: "Autoresponder", href: "/advertiser/email" },
        { label: "Analytics" },
      ]}
      stats={[
        { label: "Delivered", value: "98.4%", icon: CheckCircle, accent: "green" },
        { label: "Opens", value: "38.2%", icon: Mail, variant: "leads" },
        { label: "Clicks", value: "7.8%", icon: MousePointerClick, accent: "purple" },
        { label: "Bounces", value: "1.6%", icon: AlertTriangle, accent: "red" },
      ]}
      showToolbar={false}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <LeadsTrendChart title="Open Rate Trend" data={MOCK_OPENS_TREND} />
        <PerformanceBarChart title="Clicks by Day" data={MOCK_ANALYTICS_BARS} />
      </div>
      <div className="premium-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[var(--theme-primary)]" />
          <h3 className="text-base font-semibold text-slate-900">Delivery Overview</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Delivered", value: "8,284", pct: "98.4%" },
            { label: "Opened", value: "3,164", pct: "38.2%" },
            { label: "Clicked", value: "646", pct: "7.8%" },
            { label: "Bounced", value: "136", pct: "1.6%" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50"
            >
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{item.value}</p>
              <p className="text-xs text-[var(--theme-primary)]">{item.pct}</p>
            </div>
          ))}
        </div>
      </div>
    </EmailModuleShell>
  );
}
