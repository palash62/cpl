import type { CampaignTrustDistribution } from "@/modules/fraud/intelligence/campaign-risk.service";

const SIGNAL_LABELS: Record<string, string> = {
  RAPID_IDENTITY_ROTATION: "Rapid submissions / identity rotation",
  MULTIPLE_EMAILS_SAME_DEVICE: "Repeated device identities",
  HIGH_IP_VELOCITY: "High IP velocity",
  HIGH_DEVICE_VELOCITY: "High device velocity",
  IP_VELOCITY: "IP velocity",
  DEVICE_VELOCITY: "Device velocity",
  SHARED_IP_PATTERN: "Shared IP pattern",
  SHARED_IP_LIKELY: "Shared IP activity",
  SAME_DEVICE_MULTIPLE_IDENTITIES: "Multiple identities on device",
  SOURCE_HIGH_REJECTION: "Elevated source rejection",
};

export function CampaignTrustInsights({
  rows,
}: {
  rows: Array<CampaignTrustDistribution & { campaignName: string }>;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-6 py-4 text-sm text-slate-500">
        Campaign trust insights appear once contextual intelligence is available for leads.
      </p>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {rows.map((row) => (
        <div key={row.campaignId} className="px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-slate-900">{row.campaignName}</p>
              <p className="text-sm text-slate-500">{row.total.toLocaleString()} leads analyzed</p>
            </div>
            {row.warning && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                Anomaly warning
              </span>
            )}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm">
            <p>
              High trust: <span className="font-semibold text-emerald-700">{row.highTrustPct}%</span>
            </p>
            <p>
              Medium trust: <span className="font-semibold text-amber-700">{row.mediumTrustPct}%</span>
            </p>
            <p>
              Low trust: <span className="font-semibold text-red-700">{row.lowTrustPct}%</span>
            </p>
          </div>
          {row.topSignals.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Top risk signals:{" "}
              {row.topSignals
                .map((s) => SIGNAL_LABELS[s] ?? s.replace(/_/g, " ").toLowerCase())
                .join(" · ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
