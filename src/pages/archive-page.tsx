import { Archive } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export function ArchivePage() {
  return (
    <div>
      <PageHeader
        title="Archive"
        description="Rejected, withdrawn, and accepted applications."
      />
      <EmptyState icon={Archive} title="Archive coming in M3" />
    </div>
  );
}
