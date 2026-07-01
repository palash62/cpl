"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, MousePointerClick, Send, Users, Zap } from "lucide-react";
import { EmailSubNav } from "./email-sub-nav";
import { ButtonLink } from "@/components/ui/button-link";

type Stats = {
  totalSends: number;
  sentToday: number;
  activeAutomations: number;
  totalContacts: number;
  openRate: number;
  clickRate: number;
};

export function EmailDashboardPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/advertiser/email/stats")
      .then((r) => r.json())
      .then((d) => {
        setStats(d.data);
        setLoading(false);
      });
  }, []);

  const cards = [
    { label: "Subscribers", value: stats?.totalContacts ?? 0, icon: Users },
    { label: "Sent today", value: stats?.sentToday ?? 0, icon: Send },
    { label: "Active automations", value: stats?.activeAutomations ?? 0, icon: Zap },
    { label: "Open rate", value: `${stats?.openRate ?? 0}%`, icon: Mail },
    { label: "Click rate", value: `${stats?.clickRate ?? 0}%`, icon: MousePointerClick },
  ];

  return (
    <div className="space-y-6">
      <EmailSubNav />

      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/advertiser/email/automations/new">Create automation</ButtonLink>
        <ButtonLink href="/advertiser/email/templates" variant="outline">
          Manage templates
        </ButtonLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <card.icon className="h-4 w-4" />
              {card.label}
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {loading ? "—" : card.value}
            </p>
          </div>
        ))}
      </div>

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
    </div>
  );
}
