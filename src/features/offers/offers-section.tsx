import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useDeleteOffer,
  useOffersForApplication,
} from "@/lib/db/offers";
import { OfferForm } from "./offer-form";
import type { OfferDecision, OfferRow } from "@/types/database";

const decisionVariant: Record<
  OfferDecision,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  pending: "secondary",
  negotiating: "warning",
  accepted: "success",
  rejected: "destructive",
};

export function OffersSection({ applicationId }: { applicationId: string }) {
  const { data, isLoading } = useOffersForApplication(applicationId);
  const del = useDeleteOffer();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<OfferRow | null>(null);

  const fmt = (n: number | null | undefined, currency: string | null) =>
    n == null
      ? "—"
      : new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: currency ?? "USD",
          maximumFractionDigits: 0,
        }).format(n);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> New offer
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : data?.length ? (
        <ul className="space-y-2">
          {data.map((o) => (
            <li key={o.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">
                    {fmt(o.total_comp_annualized, o.currency)}
                  </span>
                  <span className="text-muted-foreground">total comp / yr</span>
                  <Badge variant={decisionVariant[o.decision]} className="capitalize">
                    {o.decision}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditing(o)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      if (!confirm("Delete this offer?")) return;
                      await del.mutateAsync(o.id);
                      toast.success("Deleted");
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
                <div>
                  <div className="text-muted-foreground">Base</div>
                  <div>{fmt(o.base_salary, o.currency)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Bonus</div>
                  <div>{fmt(o.bonus_target, o.currency)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Signing</div>
                  <div>{fmt(o.signing_bonus, o.currency)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Equity/yr</div>
                  <div>{fmt(o.equity_value_annualized, o.currency)}</div>
                </div>
              </div>
              {(o.received_at || o.deadline_at) && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {o.received_at && <>Received {format(new Date(o.received_at), "MMM d")}</>}
                  {o.received_at && o.deadline_at && " · "}
                  {o.deadline_at && <>Deadline {format(new Date(o.deadline_at), "MMM d")}</>}
                </div>
              )}
              {o.equity_details_md && (
                <div className="mt-2">
                  <div className="text-xs font-medium uppercase text-muted-foreground">
                    Equity
                  </div>
                  <pre className="mt-0.5 whitespace-pre-wrap text-sm">
                    {o.equity_details_md}
                  </pre>
                </div>
              )}
              {o.benefits_md && (
                <div className="mt-2">
                  <div className="text-xs font-medium uppercase text-muted-foreground">
                    Benefits
                  </div>
                  <pre className="mt-0.5 whitespace-pre-wrap text-sm">
                    {o.benefits_md}
                  </pre>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No offers recorded.
        </div>
      )}

      <OfferForm
        open={adding}
        onOpenChange={setAdding}
        applicationId={applicationId}
      />
      <OfferForm
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        applicationId={applicationId}
        initial={editing ?? undefined}
      />
    </div>
  );
}
