export const dynamic = "force-dynamic";

import { format } from "date-fns";
import { Gift, Info, Share2, TrendingUp, Users, Wallet } from "lucide-react";
import { getSession } from "@/lib/session";
import {
  REFERRAL_LEVELS,
  REFERRAL_MIN_PAYOUT,
  REFERRAL_RATES_SUMMARY,
  REFERRAL_STEPS,
} from "@/lib/referral";
import { getAdvertiserReferralData } from "@/services/referral.service";
import { GradientStatCard, NeutralStatCard } from "@/components/admin/gradient-stat-card";
import { PageSection } from "@/components/admin/page-section";
import { formatCurrency, UserStatusBadge } from "@/components/admin/admin-ui";
import { ReferralLinkPanel } from "@/components/advertiser/referral-link-panel";
import { RoleHero } from "@/components/layout/role-hero";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default async function AdvertiserReferralLinkPage() {
  const session = await getSession();
  const data = await getAdvertiserReferralData(session!.user.id);

  return (
    <div className="space-y-7">
      <RoleHero
        eyebrow="Advertiser Portal"
        title="Referral Link"
        description={`Refer & earn passive income. ${REFERRAL_RATES_SUMMARY}.`}
        action={{ label: "Copy Link", href: "#referral-link", icon: Share2 }}
      />

      <div
        className="flex gap-3 rounded-xl border px-4 py-3 text-sm text-slate-700"
        style={{
          borderColor: "color-mix(in srgb, var(--theme-primary) 20%, transparent)",
          background: "var(--theme-primary-soft)",
        }}
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--theme-primary)]" />
        <p>
          Earn commissions by referring others to the platform. Level 1 pays{" "}
          <strong>{REFERRAL_LEVELS[0].rate}</strong> of direct referral ad spend. Level 2 pays{" "}
          <strong>{REFERRAL_LEVELS[1].rate}</strong> from users your referrals refer. Minimum payout
          threshold is {formatCurrency(REFERRAL_MIN_PAYOUT)}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GradientStatCard
          variant="leads"
          label="Total Referrals"
          value={data.stats.totalReferrals}
          icon={Users}
        />
        <NeutralStatCard
          label="Level 1 Referrals"
          value={data.stats.level1Count}
          icon={Users}
          accent="green"
        />
        <NeutralStatCard
          label="Level 2 Referrals"
          value={data.stats.level2Count}
          icon={TrendingUp}
          accent="purple"
        />
        <GradientStatCard
          variant="revenue"
          label="Total Commission"
          value={formatCurrency(data.stats.totalCommission)}
          icon={Wallet}
        />
      </div>

      <PageSection
        title="Your Referral Link"
        description="Copy and share your unique link to start earning"
        icon={Share2}
        gradient="approved"
        contentClassName="p-6"
      >
        <div id="referral-link" className="scroll-mt-24">
          <ReferralLinkPanel referralCode={data.referralCode} />
        </div>
      </PageSection>

      <div className="grid gap-4 lg:grid-cols-2">
        {REFERRAL_LEVELS.map((tier) => (
          <div key={tier.level} className="premium-card overflow-hidden">
            <div className="h-1" style={{ background: tier.gradient }} />
            <div className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {tier.label}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">{tier.title}</h3>
                </div>
                <div
                  className="rounded-xl px-4 py-2 text-2xl font-bold text-white shadow-sm"
                  style={{ background: tier.gradient }}
                >
                  {tier.rate}
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">{tier.description}</p>
            </div>
          </div>
        ))}
      </div>

      <PageSection
        title="How It Works"
        description="Three simple steps to start earning referral income"
        icon={Gift}
        gradient="leads"
        contentClassName="p-6"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {REFERRAL_STEPS.map((step) => (
            <div
              key={step.step}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-5"
            >
              <div
                className="mb-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: "var(--theme-gradient-revenue)" }}
              >
                {step.step}
              </div>
              <h3 className="font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </PageSection>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="premium-card p-5">
          <p className="text-sm font-semibold text-slate-900">Level 1 earnings</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {formatCurrency(data.stats.level1Commission)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {REFERRAL_LEVELS[0].rate} of direct referral ad spend
          </p>
        </div>
        <div className="premium-card p-5">
          <p className="text-sm font-semibold text-slate-900">Level 2 earnings</p>
          <p className="mt-2 text-2xl font-bold text-violet-600">
            {formatCurrency(data.stats.level2Commission)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {REFERRAL_LEVELS[1].rate} of indirect referral ad spend
          </p>
        </div>
      </div>

      <PageSection
        title="Referred Users"
        description="Users who joined using your referral link"
        icon={Users}
        gradient="revenue"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow
                className="border-none hover:bg-transparent"
                style={{ background: "var(--theme-primary-soft)" }}
              >
                <TableHead className="h-11 px-6 text-slate-600">User</TableHead>
                <TableHead className="h-11 px-4 text-slate-600">Role</TableHead>
                <TableHead className="h-11 px-4 text-slate-600">Level</TableHead>
                <TableHead className="h-11 px-4 text-slate-600">Joined</TableHead>
                <TableHead className="h-11 px-4 text-slate-600">Status</TableHead>
                <TableHead className="h-11 px-4 text-right text-slate-600">Ad Spend</TableHead>
                <TableHead className="h-11 px-4 text-right text-slate-600">Your Commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.referrals.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="px-6 py-16 text-center text-slate-500">
                    No referrals yet. Copy your link above and share it to start earning.
                  </TableCell>
                </TableRow>
              ) : (
                data.referrals.map((referral) => (
                  <TableRow
                    key={`${referral.id}-${referral.level}`}
                    className="border-slate-100 transition-colors hover:bg-blue-50/40"
                  >
                    <TableCell className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{referral.name}</p>
                        <p className="text-xs text-slate-500">{referral.email}</p>
                        {referral.level === 2 && referral.referredByName && (
                          <p className="mt-1 text-xs text-slate-400">
                            via {referral.referredByName}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Badge variant="outline" className="capitalize">
                        {referral.role.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-medium",
                          referral.level === 1
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-violet-200 bg-violet-50 text-violet-700",
                        )}
                      >
                        Level {referral.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-slate-600">
                      {format(referral.createdAt, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <UserStatusBadge status={referral.status as "ACTIVE" | "PENDING" | "SUSPENDED"} />
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right text-sm font-medium tabular-nums text-slate-700">
                      {formatCurrency(referral.adSpend)}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right text-sm font-semibold tabular-nums text-emerald-600">
                      {formatCurrency(referral.commission)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </PageSection>
    </div>
  );
}
