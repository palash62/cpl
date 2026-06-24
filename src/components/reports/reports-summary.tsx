import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReportMetric {
  label: string;
  value: string | number;
}

export function ReportsSummary({
  title,
  metrics,
}: {
  title: string;
  metrics: ReportMetric[];
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
