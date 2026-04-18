import { formatPercent, type SourceRow } from "@/lib/analytics";

export function SourceEffectivenessTable({ rows }: { rows: SourceRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        No sources tracked yet — set one on each application.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Source</th>
            <th className="px-3 py-2 font-medium text-right">Apps</th>
            <th className="px-3 py-2 font-medium text-right">Interviewed</th>
            <th className="px-3 py-2 font-medium text-right">Offers</th>
            <th className="px-3 py-2 font-medium text-right">Interview %</th>
            <th className="px-3 py-2 font-medium text-right">Offer %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.source} className="border-t">
              <td className="px-3 py-2 font-medium capitalize">
                {r.source.replaceAll("_", " ")}
              </td>
              <td className="px-3 py-2 text-right">{r.total}</td>
              <td className="px-3 py-2 text-right">{r.reachedInterview}</td>
              <td className="px-3 py-2 text-right">{r.offers}</td>
              <td className="px-3 py-2 text-right">
                {formatPercent(r.interviewRate)}
              </td>
              <td className="px-3 py-2 text-right">
                {formatPercent(r.offerRate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
