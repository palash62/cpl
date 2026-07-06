"use client";

import Link from "next/link";
import { Mail, MousePointerClick, Send, UserPlus, Users } from "lucide-react";
import { PageSection } from "@/components/admin/page-section";
import { LeadsTrendChart } from "@/components/dashboard/dashboard-charts";
import { EmailModuleShell } from "../email-module-shell";
import { MOCK_OPENS_TREND, MOCK_RECENT_ACTIVITY, MOCK_SENDS_TREND } from "../email-mock-data";
import { ButtonLink } from "@/components/ui/button-link";

export function DashboardPanel() {
  return (
    <EmailModuleShell
      title="Dashboard"
      description="Overview of your email performance, subscribers, and recent activity."
      breadcrumbs={[
        { label: "Autoresponder", href: "/advertiser/email" },
        { label: "Dashboard" },
      ]}
      stats={[
        { label: "Total Subscribers", value: "1,240", icon: Users, accent: "purple" },
        { label: "Emails Sent", value: "8,420", icon: Send, variant: "leads" },
        { label: "Open Rate", value: "38.2%", icon: Mail, accent: "green", trend: 4.2 },
        { label: "Click Rate", value: "7.8%", icon: MousePointerClick, accent: "orange", trend: -1.1 },
      ]}
      showToolbar={false}
      primaryAction={{ label: "Create Campaign", href: "/advertiser/email/campaigns", icon: Send }}
    >
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/advertiser/email/automations/new">Create automation</ButtonLink>
        <ButtonLink href="/advertiser/email/subscribers" variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          Add subscriber
        </ButtonLink>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <LeadsTrendChart title="Emails Sent" data={MOCK_SENDS_TREND} />
        <LeadsTrendChart title="Opens Over Time" data={MOCK_OPENS_TREND} />
      </div>

      <PageSection title="Recent Activity" description="Latest email events" icon={Mail} gradient="leads">
        <ul className="divide-y divide-slate-100">
          {MOCK_RECENT_ACTIVITY.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
            >
              <div>
                <p className="font-medium text-slate-900">{item.action}</p>
                <p className="text-sm text-slate-500">{item.detail}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-400">{item.time}</span>
            </li>
          ))}
        </ul>
      </PageSection>

      <div
        className="rounded-xl border px-5 py-4"
        style={{
          borderColor: "color-mix(in srgb, var(--theme-primary) 20%, transparent)",
          background: "var(--theme-primary-soft)",
        }}
      >
        <p className="font-semibold text-slate-900">Get started in 3 steps</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
          <li>
            <Link href="/advertiser/email/templates" className="text-[var(--theme-primary)] hover:underline">
              Create or edit an email template
            </Link>
          </li>
          <li>
            <Link href="/advertiser/email/automations/new" className="text-[var(--theme-primary)] hover:underline">
              Build an automation (welcome + follow-ups)
            </Link>
          </li>
          <li>Activate it — leads from your campaigns will receive emails automatically</li>
        </ol>
      </div>
    </EmailModuleShell>
  );
}
