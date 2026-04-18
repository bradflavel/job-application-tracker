import { LineChart } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export function AnalyticsPage() {
  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Funnel, activity over time, source effectiveness, ghost rate, time-to-response."
      />
      <EmptyState icon={LineChart} title="Analytics coming in M6" />
    </div>
  );
}
