import { Scale } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export function OffersComparePage() {
  return (
    <div>
      <PageHeader
        title="Offers"
        description="Side-by-side comparison with total comp annualized."
      />
      <EmptyState icon={Scale} title="Offer comparison coming in M4" />
    </div>
  );
}
