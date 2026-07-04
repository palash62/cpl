import { format } from "date-fns";
import { CheckCircle, Clock, FileText, Megaphone, ShieldAlert, Users, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/admin/page-hero";
import { PageSection } from "@/components/admin/page-section";
import { GradientStatCard, NeutralStatCard } from "@/components/admin/gradient-stat-card";
import { LeadStatusBadge } from "@/components/admin/admin-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export const dynamic = "force-dynamic";

function riskLabel(score: number | null) {
  if (score === null) return <span className="text-slate-400">—</span>;
  const cls =
    score > 50
      ? "bg-red-100 text-red-700"
      : score > 20
        ? "bg-amber-100 text-amber-800"
        : "bg-emerald-100 text-emerald-700";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {score}
    </span>
  );
}

export default async function AdminLeadsPage() {
  const leads = await prisma.lead.findMany({
    include: {
      campaign: { select: { name: true } },
      publisher: { select: { name: true } },
      validationResults: { where: { passed: false }, take: 3 },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const approved = leads.filter((l) => l.status === "APPROVED").length;
  const pending = leads.filter((l) => l.status === "PENDING").length;
  const rejected = leads.filter((l) => l.status === "REJECTED").length;
  const highRisk = leads.filter((l) => (l.riskScore ?? 0) > 50).length;

  return (
    <div className="space-y-7">
      <PageHero
        eyebrow="Lead Management"
        title="All Leads"
        description="Review and manage lead submissions across all campaigns"
        badge={`${leads.length} recent lead${leads.length === 1 ? "" : "s"}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <GradientStatCard variant="leads" label="Total Leads" value={leads.length} icon={FileText} />
        <NeutralStatCard label="Approved" value={approved} icon={CheckCircle} accent="green" />
        <NeutralStatCard label="Pending Review" value={pending} icon={Clock} accent="orange" />
        <NeutralStatCard label="Rejected" value={rejected} icon={XCircle} accent="red" />
        <NeutralStatCard label="High Risk" value={highRisk} icon={ShieldAlert} accent="red" />
      </div>

      <PageSection
        title="Lead Queue"
        description="Recent lead submissions — risk score 0 = safe, 100 = risky"
        icon={FileText}
        gradient="leads"
      >
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--theme-primary-soft)" }}>
              <FileText className="h-7 w-7 text-[var(--theme-primary)]" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No leads yet</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">Leads will appear here once publishers start generating traffic.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-none hover:bg-transparent" style={{ background: "var(--theme-primary-soft)" }}>
                <TableHead className="h-11 px-6 text-slate-600">Campaign</TableHead>
                <TableHead className="h-11 px-4 text-slate-600">Publisher</TableHead>
                <TableHead className="h-11 px-4 text-slate-600">Risk</TableHead>
                <TableHead className="h-11 px-4 text-slate-600">Flags</TableHead>
                <TableHead className="h-11 px-4 text-slate-600">Submitted</TableHead>
                <TableHead className="h-11 px-4 text-slate-600">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((l) => (
                <TableRow key={l.id} className="border-slate-100 transition-colors hover:bg-violet-50/40">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-3.5 w-3.5 text-[var(--theme-primary)]" />
                      <span className="font-medium text-slate-900">{l.campaign.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="text-sm text-slate-700">{l.publisher.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">{riskLabel(l.riskScore)}</TableCell>
                  <TableCell className="px-4 py-4">
                    {l.validationResults.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {l.validationResults.map((r) => (
                          <span
                            key={r.id}
                            className="rounded bg-rose-50 px-1.5 py-0.5 font-mono text-[10px] text-rose-700"
                          >
                            {r.rule}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-slate-500">
                    {format(new Date(l.createdAt), "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <LeadStatusBadge status={l.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="border-t border-slate-100 px-6 py-4">
          <Link href="/admin/fraud" className="text-sm font-medium text-[var(--theme-primary)] hover:underline">
            Open Fraud Center for high-risk review →
          </Link>
        </div>
      </PageSection>
    </div>
  );
}
