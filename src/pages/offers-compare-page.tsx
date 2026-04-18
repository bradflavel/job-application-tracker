import { useState } from "react";
import { differenceInDays, format } from "date-fns";
import { Scale, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { useActiveOffers } from "@/lib/db/offers";
import { ApplicationDetail } from "@/features/applications/application-detail";
import type { OfferDecision } from "@/types/database";

const decisionVariant: Record<
  OfferDecision,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  pending: "secondary",
  negotiating: "warning",
  accepted: "success",
  rejected: "destructive",
};

export function OffersComparePage() {
  const { data, isLoading } = useActiveOffers();
  const [openApp, setOpenApp] = useState<string | null>(null);

  const fmt = (n: number | null | undefined, currency: string | null) =>
    n == null
      ? "—"
      : new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: currency ?? "USD",
          maximumFractionDigits: 0,
        }).format(n);

  const highest = (data ?? []).reduce(
    (max, o) => Math.max(max, o.total_comp_annualized ?? 0),
    0,
  );

  return (
    <div>
      <PageHeader
        title="Offers"
        description="Side-by-side comparison of active offers, with total comp annualized."
      />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : !data?.length ? (
        <EmptyState
          icon={Scale}
          title="No active offers yet"
          description="Offers you've marked pending, negotiating, or accepted show up here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((o) => {
            const total = o.total_comp_annualized ?? 0;
            const isHighest = total === highest && highest > 0;
            const daysLeft = o.deadline_at
              ? differenceInDays(new Date(o.deadline_at), new Date())
              : null;
            return (
              <button
                key={o.id}
                onClick={() => o.application && setOpenApp(o.application.id)}
                className={`rounded-lg border bg-card p-4 text-left shadow-sm transition hover:shadow ${
                  isHighest
                    ? "border-emerald-500/60 ring-1 ring-emerald-500/30"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">
                      {o.application?.company?.name ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {o.application?.role_title ?? "—"}
                    </div>
                  </div>
                  <Badge
                    variant={decisionVariant[o.decision]}
                    className="capitalize"
                  >
                    {o.decision}
                  </Badge>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <div className="text-2xl font-bold">
                    {fmt(total, o.currency)}
                  </div>
                  {isHighest && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-500">
                      <TrendingUp className="h-3 w-3" />
                      highest
                    </span>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
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
                    <div className="text-muted-foreground">Equity / yr</div>
                    <div>{fmt(o.equity_value_annualized, o.currency)}</div>
                  </div>
                </div>
                {o.deadline_at && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Decision by {format(new Date(o.deadline_at), "MMM d, yyyy")}
                    {daysLeft !== null && (
                      <span
                        className={`ml-1 font-medium ${
                          daysLeft < 3
                            ? "text-destructive"
                            : daysLeft < 7
                              ? "text-amber-500"
                              : ""
                        }`}
                      >
                        ({daysLeft >= 0 ? `${daysLeft}d left` : "overdue"})
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <ApplicationDetail
        id={openApp}
        open={!!openApp}
        onOpenChange={(v) => !v && setOpenApp(null)}
      />
    </div>
  );
}
