import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BellRing,
  Briefcase,
  CalendarClock,
  Scale,
  TrendingUp,
} from "lucide-react";
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
import { KpiStrip, type Kpi } from "@/features/analytics/kpi-strip";
import { UpcomingReminders } from "@/features/analytics/upcoming-reminders";
import { TodaysInterviews } from "@/features/analytics/todays-interviews";
import { ApplicationDetail } from "@/features/applications/application-detail";
import { useAnalyticsBundle } from "@/lib/db/analytics";
import {
  computeActivity,
  computeFunnel,
  computeKpis,
  formatPercent,
} from "@/lib/analytics";

export function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useAnalyticsBundle();
  const [openApp, setOpenApp] = useState<string | null>(null);

  const { kpiList, funnelStages, activity } = useMemo(() => {
    if (!data) {
      return {
        kpiList: [] as Kpi[],
        funnelStages: [],
        activity: [],
      };
    }
    const kpis = computeKpis(
      data.applications,
      data.interviews,
      data.offers,
      data.statusHistory,
    );
    const list: Kpi[] = [
      {
        label: "Active",
        value: String(kpis.activeCount),
        hint: "Not archived, not closed",
        icon: Briefcase,
      },
      {
        label: "Interviews · 7d",
        value: String(kpis.interviewsThisWeek),
        hint: "Scheduled this week",
        icon: CalendarClock,
        accent: "warning",
      },
      {
        label: "Pending offers",
        value: String(kpis.pendingOffers),
        hint: "Awaiting decision",
        icon: Scale,
        accent: "success",
      },
      {
        label: "Response rate",
        value: formatPercent(kpis.responseRate),
        hint: "Applied → moved past applied",
        icon: TrendingUp,
      },
    ];
    const funnel = computeFunnel(data.applications);
    const act = computeActivity(data.applications, "90d");
    return { kpiList: list, funnelStages: funnel, activity: act };
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Where things stand this week."
        actions={
          <Button variant="outline" onClick={() => navigate("/analytics")}>
            <TrendingUp className="h-4 w-4" /> Full analytics
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <>
          <KpiStrip kpis={kpiList} />

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Funnel</CardTitle>
                <CardDescription>Applied → Accepted, all-time.</CardDescription>
              </CardHeader>
              <CardContent>
                <FunnelChart stages={funnelStages} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Applications / week</CardTitle>
                <CardDescription>Last 90 days.</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityChart data={activity} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    Today's interviews
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TodaysInterviews onOpenApplication={setOpenApp} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  <div className="flex items-center gap-2">
                    <BellRing className="h-4 w-4" />
                    Upcoming reminders
                  </div>
                </CardTitle>
                <CardDescription>Next 7 days + overdue.</CardDescription>
              </CardHeader>
              <CardContent>
                <UpcomingReminders onOpenApplication={setOpenApp} />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <ApplicationDetail
        id={openApp}
        open={!!openApp}
        onOpenChange={(v) => !v && setOpenApp(null)}
      />
    </div>
  );
}
