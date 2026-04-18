import { LayoutDashboard } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Active applications, upcoming interviews, and follow-ups."
      />
      <EmptyState
        icon={LayoutDashboard}
        title="Dashboard coming online in M6"
        description="KPI strip, funnel chart, activity-over-time, source effectiveness, ghost rate, and today's interviews."
      />
    </div>
  );
}
