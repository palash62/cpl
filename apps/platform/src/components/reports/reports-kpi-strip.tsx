import { BarChart3, CheckCircle2, DollarSign, MousePointerClick, Target, Users, XCircle } from "lucide-react";
import {
  GradientStatCard,
  NeutralStatCard,
  type AccentVariant,
} from "@/components/admin/gradient-stat-card";

export type ReportKpiItem = {
  label: string;
  value: string;
  variant?: "revenue" | "leads" | "approved";
  icon?: "clicks" | "leads" | "approved" | "rejected" | "spend" | "conversion" | "accounts";
};

const iconMap = {
  clicks: MousePointerClick,
  leads: Users,
  approved: CheckCircle2,
  rejected: XCircle,
  spend: DollarSign,
  conversion: Target,
  accounts: BarChart3,
} as const;

const accentMap: Record<NonNullable<ReportKpiItem["icon"]>, AccentVariant> = {
  clicks: "purple",
  leads: "green",
  approved: "green",
  rejected: "red",
  spend: "orange",
  conversion: "purple",
  accounts: "purple",
};

export function ReportsKpiStrip({ items }: { items: ReportKpiItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
      {items.map((item) => {
        const iconKey = item.icon ?? "accounts";
        const Icon = iconMap[iconKey];
        if (item.variant) {
          return (
            <GradientStatCard
              key={item.label}
              label={item.label}
              value={item.value}
              icon={Icon}
              variant={item.variant}
            />
          );
        }
        return (
          <NeutralStatCard
            key={item.label}
            label={item.label}
            value={item.value}
            icon={Icon}
            accent={accentMap[iconKey]}
          />
        );
      })}
    </div>
  );
}
