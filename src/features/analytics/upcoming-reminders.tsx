import { format, formatDistanceToNow, isPast } from "date-fns";
import { BellRing, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import {
  analyticsKeys,
  useDashboardExtras,
} from "@/lib/db/analytics";

export function UpcomingReminders({ onOpenApplication }: { onOpenApplication?: (id: string) => void }) {
  const { data, isLoading } = useDashboardExtras();
  const qc = useQueryClient();

  const complete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reminders")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: analyticsKeys.dashboard() }),
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  const reminders = data?.upcomingReminders ?? [];
  if (reminders.length === 0) {
    return (
      <div className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        <BellRing className="mx-auto mb-1 h-4 w-4" />
        Nothing due in the next 7 days.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {reminders.map((r) => {
        const due = new Date(r.due_at);
        const overdue = isPast(due);
        return (
          <li
            key={r.id}
            className="flex items-start justify-between gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => r.application && onOpenApplication?.(r.application.id)}
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant={overdue ? "destructive" : "outline"}
                  className="capitalize"
                >
                  {r.kind.replace("_", " ")}
                </Badge>
                <span className="truncate font-medium">
                  {r.application?.role_title ?? "—"}
                  {r.application?.company?.name && (
                    <span className="ml-1 text-muted-foreground">
                      @ {r.application.company.name}
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {overdue
                  ? `Overdue · ${formatDistanceToNow(due, { addSuffix: true })}`
                  : `Due ${format(due, "MMM d")} · ${formatDistanceToNow(due, { addSuffix: true })}`}
                {r.note && <span> — {r.note}</span>}
              </div>
            </button>
            <Button
              size="icon"
              variant="ghost"
              title="Mark complete"
              onClick={async () => {
                await complete.mutateAsync(r.id);
                toast.success("Reminder completed");
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
