import { Building2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export function CompaniesPage() {
  return (
    <div>
      <PageHeader title="Companies" description="Rich notes and saved links per company." />
      <EmptyState icon={Building2} title="Companies coming in M4" />
    </div>
  );
}
