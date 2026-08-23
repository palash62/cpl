"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ContextualRiskBadge } from "@/components/fraud/contextual-risk-badge";
import type { LeadIntelligenceInvestigation } from "@/modules/fraud";

export function LeadInvestigationPanel({ leadId }: { leadId: string }) {
  const [data, setData] = useState<LeadIntelligenceInvestigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(recompute = false) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/v1/admin/fraud/intelligence/${leadId}${recompute ? "?recompute=1" : ""}`,
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Failed to load investigation");
        return;
      }
      setData(json.data);
    } catch {
      setError("Failed to load investigation");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(false);
  }, [leadId]);

  if (loading && !data) {
    return <p className="text-sm text-slate-500">Loading contextual intelligence…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  const contextual = data?.contextual;

  return (
    <div className="mt-3 space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Lead Investigation
          </p>
          <div className="mt-1 flex items-center gap-2">
            <ContextualRiskBadge
              level={contextual?.level}
              score={contextual?.score}
            />
            {data?.pending && (
              <span className="text-xs text-slate-400">Pending compute</span>
            )}
          </div>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => void load(true)}>
          Recompute
        </Button>
      </div>

      {contextual?.explanation?.summary && (
        <p className="text-sm text-slate-700">{contextual.explanation.summary}</p>
      )}

      {contextual?.explanation?.items?.length ? (
        <ul className="space-y-2">
          {contextual.explanation.items.map((item) => (
            <li
              key={`${item.signal}-${item.window ?? ""}`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <span className="font-medium text-slate-900">{item.signal}</span>
              <span className="ml-2 text-xs uppercase text-slate-400">{item.severity}</span>
              <p className="mt-1 text-slate-600">{item.text}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {data?.timeline?.length ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Identity timeline
          </p>
          <ol className="space-y-1.5 border-l border-slate-200 pl-4">
            {data.timeline.map((entry) => (
              <li key={entry.leadId} className="relative text-sm">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-400" />
                <span className="text-slate-500">
                  {new Date(entry.createdAt).toLocaleTimeString()}
                </span>{" "}
                <span className="font-medium text-slate-800">
                  {entry.emailMasked ?? "—"}
                </span>
                <span className="ml-2 text-xs uppercase text-slate-400">{entry.relation}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {contextual?.ipContext && (
        <div className="grid gap-2 sm:grid-cols-3 text-xs text-slate-600">
          <p>IP 5m: {contextual.ipContext.leadsLast5Min}</p>
          <p>IP 1h: {contextual.ipContext.leadsLast1Hour}</p>
          <p>IP 24h emails: {contextual.ipContext.uniqueEmails24Hours}</p>
          <p>Devices 24h: {contextual.ipContext.uniqueDevices24Hours}</p>
          <p>Shared IP likely: {contextual.ipContext.sharedIpLikely ? "yes" : "no"}</p>
          <p>Suspicious velocity: {contextual.ipContext.suspiciousVelocity ? "yes" : "no"}</p>
        </div>
      )}
    </div>
  );
}
