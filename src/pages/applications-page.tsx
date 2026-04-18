import { Briefcase } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export function ApplicationsPage() {
  return (
    <div>
      <PageHeader
        title="Applications"
        description="Kanban and table views of every role you're tracking."
      />
      <EmptyState
        icon={Briefcase}
        title="Applications coming in M3"
        description="Create, edit, drag across statuses, filter, search, and archive."
      />
    </div>
  );
}
