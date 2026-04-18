import { format } from "date-fns";
import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDashboardExtras } from "@/lib/db/analytics";

export function TodaysInterviews({
  onOpenApplication,
}: {
  onOpenApplication?: (id: string) => void;
}) {
  const { data, isLoading } = useDashboardExtras();
  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  const list = data?.todaysInterviews ?? [];

  if (list.length === 0) {
    return (
      <div className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        <CalendarClock className="mx-auto mb-1 h-4 w-4" />
        No interviews scheduled today.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {list.map((iv) => (
        <li key={iv.id}>
          <button
            onClick={() => iv.application && onOpenApplication?.(iv.application.id)}
            className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-accent"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{iv.round_label}</span>
                {iv.format && (
                  <Badge variant="outline" className="capitalize">
                    {iv.format}
                  </Badge>
                )}
              </div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                {iv.application?.role_title}
                {iv.application?.company?.name && (
                  <span> @ {iv.application.company.name}</span>
                )}
              </div>
            </div>
            <div className="text-right text-xs font-medium">
              {iv.scheduled_at ? format(new Date(iv.scheduled_at), "HH:mm") : ""}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
