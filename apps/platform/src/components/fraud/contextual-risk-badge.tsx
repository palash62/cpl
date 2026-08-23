"use client";

type Level = "low" | "medium" | "high" | "critical" | string | null | undefined;

const LEVEL_STYLES: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export function ContextualRiskBadge({
  level,
  score,
}: {
  level: Level;
  score?: number | null;
}) {
  if (!level) {
    return <span className="text-xs text-slate-400">Analyzing…</span>;
  }
  const style = LEVEL_STYLES[level] ?? "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${style}`}>
      {level}
      {typeof score === "number" ? ` · ${score}` : null}
    </span>
  );
}
