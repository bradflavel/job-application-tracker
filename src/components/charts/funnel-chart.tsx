import { formatPercent, type FunnelStage } from "@/lib/analytics";

export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(...stages.map((s) => s.count), 1);
  return (
    <div className="space-y-2">
      {stages.map((stage, i) => {
        const width = (stage.count / max) * 100;
        return (
          <div key={stage.label} className="space-y-1">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-medium">{stage.label}</span>
              <span className="text-muted-foreground">
                {stage.count}
                {i > 0 && stage.rateFromPrevious !== null && (
                  <span className="ml-2">
                    · {formatPercent(stage.rateFromPrevious)} from prev
                  </span>
                )}
              </span>
            </div>
            <div className="h-6 overflow-hidden rounded bg-muted">
              <div
                className="h-full rounded bg-primary/80 transition-all"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
