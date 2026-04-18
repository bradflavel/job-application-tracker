import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { StatusBadge } from "./status-badge";
import type { StatusHistoryRow } from "@/types/database";

export function StatusHistoryList({ applicationId }: { applicationId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["status_history", applicationId],
    queryFn: async (): Promise<StatusHistoryRow[]> => {
      const { data, error } = await supabase
        .from("status_history")
        .select("*")
        .eq("application_id", applicationId)
        .order("changed_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as StatusHistoryRow[];
    },
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!data?.length)
    return <div className="text-sm text-muted-foreground">No status changes yet.</div>;

  return (
    <ol className="space-y-3">
      {data.map((h) => (
        <li key={h.id} className="flex items-start gap-3">
          <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {h.from_status && (
                <>
                  <StatusBadge status={h.from_status} />
                  <span className="text-muted-foreground">→</span>
                </>
              )}
              <StatusBadge status={h.to_status} />
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {format(new Date(h.changed_at), "MMM d, yyyy · HH:mm")}
            </div>
            {h.note && <div className="mt-1 text-sm">{h.note}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
