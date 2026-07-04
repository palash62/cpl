import type { UserStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { isPendingPayoutStatus, payoutStatusLabel } from "@/lib/payout-status";
import { cn } from "@/lib/utils";

export const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-indigo-100 text-indigo-700",
  "bg-violet-100 text-violet-700",
  "bg-cyan-100 text-cyan-700",
  "bg-sky-100 text-sky-700",
];

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const styles: Record<UserStatus, string> = {
    ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
    SUSPENDED: "border-red-200 bg-red-50 text-red-700",
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <Badge variant="outline" className={cn("font-medium capitalize", styles[status])}>
      {status === "SUSPENDED" ? "blocked" : status.toLowerCase()}
    </Badge>
  );
}

export function LeadStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    CAPTURED: "border-slate-200 bg-slate-50 text-slate-600",
    VALIDATING: "border-blue-200 bg-blue-50 text-blue-700",
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    REJECTED: "border-red-200 bg-red-50 text-red-700",
    PAID: "border-violet-200 bg-violet-50 text-violet-700",
  };

  return (
    <Badge variant="outline" className={cn("font-medium capitalize", styles[status] ?? "border-slate-200 bg-slate-50 text-slate-600")}>
      {status.toLowerCase()}
    </Badge>
  );
}

export function DepositStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    FAILED: "border-red-200 bg-red-50 text-red-700",
  };

  const labels: Record<string, string> = {
    COMPLETED: "approved",
    PENDING: "pending",
    FAILED: "rejected",
  };

  return (
    <Badge variant="outline" className={cn("font-medium capitalize", styles[status] ?? "border-slate-200 bg-slate-50 text-slate-600")}>
      {labels[status] ?? status.toLowerCase()}
    </Badge>
  );
}

export function CampaignStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    PAUSED: "border-amber-200 bg-amber-50 text-amber-700",
    DRAFT: "border-slate-200 bg-slate-50 text-slate-600",
    COMPLETED: "border-red-200 bg-red-50 text-red-700",
    ARCHIVED: "border-red-200 bg-red-50 text-red-700",
  };

  const labels: Record<string, string> = {
    COMPLETED: "stopped",
    ARCHIVED: "rejected",
    PAUSED: "paused",
    PENDING: "pending review",
  };

  return (
    <Badge variant="outline" className={cn("font-medium capitalize", styles[status] ?? "border-indigo-200 bg-indigo-50 text-indigo-700")}>
      {labels[status] ?? status.toLowerCase()}
    </Badge>
  );
}

export function PayoutStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    REQUESTED: "border-amber-200 bg-amber-50 text-amber-700",
    REJECTED: "border-red-200 bg-red-50 text-red-700",
    PROCESSING: "border-blue-200 bg-blue-50 text-blue-700",
    FAILED: "border-red-200 bg-red-50 text-red-700",
  };

  const styleKey = isPendingPayoutStatus(status) ? "PENDING" : status;

  return (
    <Badge variant="outline" className={cn("font-medium capitalize", styles[styleKey] ?? "border-slate-200 bg-slate-50 text-slate-600")}>
      {payoutStatusLabel(status)}
    </Badge>
  );
}

export function KycStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    REJECTED: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <Badge variant="outline" className={cn("text-xs font-medium capitalize", styles[status] ?? "border-slate-200 bg-slate-50 text-slate-600")}>
      KYC: {status.toLowerCase()}
    </Badge>
  );
}

export function spamScoreLevel(score: number): "low" | "medium" | "high" {
  if (score > 50) return "high";
  if (score > 20) return "medium";
  return "low";
}

export function SpamScoreBadge({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) {
    return <span className="text-sm text-slate-400">N/A</span>;
  }

  const level = spamScoreLevel(score);
  const styles = {
    low: "border-emerald-200 bg-emerald-50 text-emerald-700",
    medium: "border-amber-200 bg-amber-50 text-amber-800",
    high: "border-red-200 bg-red-50 text-red-700",
  } as const;

  return (
    <Badge variant="outline" className={cn("font-semibold tabular-nums", styles[level])}>
      {score}
    </Badge>
  );
}

const SPAM_SCORE_GUIDE = [
  { range: "0–20", label: "Low risk", level: "low" as const, action: "Generally safe to approve" },
  { range: "21–50", label: "Review", level: "medium" as const, action: "Check recent leads before approving" },
  { range: "51+", label: "High risk", level: "high" as const, action: "Consider rejecting the publisher" },
];

const spamGuideStyles = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-red-200 bg-red-50 text-red-700",
} as const;

export function SpamScoreGuide({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span className="font-medium text-slate-700">Score guide:</span>
        {SPAM_SCORE_GUIDE.map((item) => (
          <span
            key={item.range}
            className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium", spamGuideStyles[item.level])}
          >
            {item.range} {item.label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-sm font-semibold text-slate-900">Spam score guide</p>
      <p className="mt-1 text-xs text-slate-500">
        30-day average lead risk (0 = safe, 100 = risky). Same scale as Fraud Center lead scores.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {SPAM_SCORE_GUIDE.map((item) => (
          <div
            key={item.range}
            className={cn("rounded-lg border px-3 py-2.5", spamGuideStyles[item.level])}
          >
            <p className="text-sm font-bold">{item.range}</p>
            <p className="text-xs font-semibold">{item.label}</p>
            <p className="mt-1 text-[11px] opacity-90">{item.action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
