import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  const trendUp = trend !== undefined && trend >= 0;

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          {trend !== undefined && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trendUp ? "text-green-600" : "text-red-600",
              )}
            >
              {trendUp ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
