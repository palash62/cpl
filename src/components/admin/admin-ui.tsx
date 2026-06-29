import type { UserStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
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

  return (
    <Badge variant="outline" className={cn("font-medium capitalize", styles[status] ?? "border-slate-200 bg-slate-50 text-slate-600")}>
      {status.toLowerCase()}
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
    REQUESTED: "border-amber-200 bg-amber-50 text-amber-700",
    REJECTED: "border-red-200 bg-red-50 text-red-700",
    PROCESSING: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <Badge variant="outline" className={cn("font-medium capitalize", styles[status] ?? "border-slate-200 bg-slate-50 text-slate-600")}>
      {status.toLowerCase()}
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
