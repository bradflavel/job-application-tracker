import { useMemo, useState } from "react";
import { Clock, Ghost, LineChart, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { ActivityChart } from "@/components/charts/activity-chart";
import { SourceEffectivenessTable } from "@/components/charts/source-effectiveness-table";
import { RejectionBreakdown } from "@/components/charts/rejection-breakdown";
import { KpiStrip, type Kpi } from "@/features/analytics/kpi-strip";
import { useAnalyticsBundle } from "@/lib/db/analytics";
import {
  computeActivity,
  computeFunnel,
  computeKpis,
  computeRejectionBreakdown,
  computeResponseMetrics,
  computeSourceEffectiveness,
  filterApplicationsByRange,
  formatPercent,
  type DateRange,
} from "@/lib/analytics";

const RANGES: { value: DateRange; label: string }[] = [
  { value: "30d", label: "30 days" },
  { value: "60d", label: "60 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

export function AnalyticsPage() {
  const { data, isLoading } = useAnalyticsBundle();
  const [range, setRange] = useState<DateRange>("90d");

  const computed = useMemo(() => {
    if (!data) return null;
    const apps = filterApplicationsByRange(data.applications, range);
    return {
      apps,
      funnel: computeFunnel(apps),
      activity: computeActivity(data.applications, range),
      source: computeSourceEffectiveness(apps),
      rejection: computeRejectionBreakdown(apps),
      kpis: computeKpis(apps, data.interviews, data.offers, data.statusHistory),
      response: computeResponseMetrics(apps, data.statusHistory),
    };
  }, [data, range]);

  const extrasList: Kpi[] = computed
    ? [
        {
          label: "Median time to response",
          value:
            computed.response.medianDays === null
              ? "—"
              : `${computed.response.medianDays.toFixed(1)} d`,
          hint: "Applied → first status change",
          icon: Clock,
        },
        {
          label: "Ghost rate",
          value: formatPercent(computed.response.ghostRate),
          hint: `${computed.response.ghosted} stalled · >21 days in applied`,
          icon: Ghost,
          accent:
            computed.response.ghostRate > 0.5 ? "destructive" : "warning",
        },
        {
          label: "Pending response",
          value: String(computed.response.pendingResponse),
          hint: "Still waiting after apply",
          icon: TrendingUp,
        },
        {
          label: "Applications (range)",
          value: String(computed.apps.length),
          hint: RANGES.find((r) => r.value === range)?.label,
          icon: LineChart,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Funnel conversion, activity, sources, rejections."
        actions={
          <div className="flex rounded-md border p-0.5">
            {RANGES.map((r) => (
              <Button
                key={r.value}
                size="sm"
                variant={range === r.value ? "default" : "ghost"}
                onClick={() => setRange(r.value)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        }
      />

      {isLoading || !computed ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <>
          <KpiStrip kpis={extrasList} />

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Funnel</CardTitle>
                <CardDescription>
                  Applied → Screen → Interview → Offer → Accepted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FunnelChart stages={computed.funnel} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Applications / week</CardTitle>
                <CardDescription>
                  Volume of new applications over time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityChart data={computed.activity} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Source effectiveness</CardTitle>
              <CardDescription>
                Which channels actually get you interviews and offers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SourceEffectivenessTable rows={computed.source} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Rejection stages</CardTitle>
              <CardDescription>
                Where applications tend to fall out. Ghosting counted separately.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RejectionBreakdown rows={computed.rejection} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
