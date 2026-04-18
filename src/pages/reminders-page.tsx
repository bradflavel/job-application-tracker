import { BellRing } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export function RemindersPage() {
  return (
    <div>
      <PageHeader
        title="Reminders"
        description="Follow-ups, thank-yous, deadlines. Daily digest email included."
      />
      <EmptyState icon={BellRing} title="Reminders coming in M7" />
    </div>
  );
}
