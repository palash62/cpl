"use client";

import type { LucideIcon } from "lucide-react";
import {
  GradientStatCard,
  NeutralStatCard,
  type GradientVariant,
} from "@/components/admin/gradient-stat-card";

export type EmailStatItem = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: GradientVariant;
  accent?: "purple" | "green" | "orange" | "red";
  trend?: number;
};

interface EmailModuleStatsProps {
  stats: EmailStatItem[];
}

export function EmailModuleStats({ stats }: EmailModuleStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) =>
        stat.variant ? (
          <GradientStatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            variant={stat.variant}
            trend={stat.trend}
          />
        ) : (
          <NeutralStatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            accent={stat.accent ?? "purple"}
            trend={stat.trend}
          />
        ),
      )}
    </div>
  );
}
