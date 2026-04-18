import type { RejectionBreakdown as Row } from "@/lib/analytics";

export function RejectionBreakdown({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        No rejections yet.
      </div>
    );
  }
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <ul className="space-y-2">
      {rows.map((r) => {
        const pct = total > 0 ? (r.count / total) * 100 : 0;
        return (
          <li key={r.stage} className="space-y-1">
            <div className="flex items-baseline justify-between text-xs">
              <span className="capitalize">{r.stage}</span>
              <span className="text-muted-foreground">
                {r.count} · {Math.round(pct)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-muted">
              <div
                className="h-full rounded bg-destructive/70"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
