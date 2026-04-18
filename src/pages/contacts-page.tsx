import { Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export function ContactsPage() {
  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Recruiters, referrers, hiring managers, interviewers."
      />
      <EmptyState icon={Users} title="Contacts coming in M4" />
    </div>
  );
}
