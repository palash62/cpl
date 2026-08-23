import type { AdvertiserLeadQualityMetrics } from "@/modules/fraud/intelligence/advertiser-metrics.service";

export function LeadQualityMetricsStrip({ metrics }: { metrics: AdvertiserLeadQualityMetrics }) {
  if (metrics.totalLeads === 0) {
    return (
      <div className="rounded-[18px] border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
        Lead Quality metrics will appear after contextual intelligence is computed on new leads.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Lead Quality Score
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {metrics.leadQualityScore}
            <span className="text-lg font-semibold text-slate-400"> / 100</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Presentation metric based on contextual patterns — separate from fraud riskScore.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="text-xs text-slate-500">Identity</p>
            <p className="font-semibold text-slate-900">{metrics.breakdown.identityQuality}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Behavior</p>
            <p className="font-semibold text-slate-900">{metrics.breakdown.behaviorQuality}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Network</p>
            <p className="font-semibold text-slate-900">{metrics.breakdown.networkQuality}</p>
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Metric label="Total leads" value={metrics.totalLeads} />
        <Metric label="Trusted" value={metrics.trustedLeads} />
        <Metric label="Review recommended" value={metrics.reviewRecommended} />
        <Metric label="High risk" value={metrics.highRiskLeads} />
        <Metric label="Identity patterns" value={metrics.duplicateIdentityPatterns} />
        <Metric label="Suspicious velocity" value={metrics.suspiciousVelocity} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-slate-900">{value.toLocaleString()}</p>
    </div>
  );
}
