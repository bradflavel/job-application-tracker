import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useDeleteInterview,
  useInterviewsForApplication,
} from "@/lib/db/interviews";
import { InterviewForm } from "./interview-form";
import type { InterviewOutcome, InterviewRow } from "@/types/database";

const outcomeVariant: Record<InterviewOutcome, React.ComponentProps<typeof Badge>["variant"]> = {
  pending: "secondary",
  passed: "success",
  failed: "destructive",
  cancelled: "muted",
};

export function InterviewList({ applicationId }: { applicationId: string }) {
  const { data, isLoading } = useInterviewsForApplication(applicationId);
  const del = useDeleteInterview();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<InterviewRow | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> New interview
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : data?.length ? (
        <ul className="space-y-2">
          {data.map((iv) => (
            <li
              key={iv.id}
              className="rounded-md border p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{iv.round_label}</span>
                    <Badge variant={outcomeVariant[iv.outcome]} className="capitalize">
                      {iv.outcome}
                    </Badge>
                    {iv.format && (
                      <Badge variant="outline" className="capitalize">
                        {iv.format}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarClock className="h-3 w-3" />
                    {iv.scheduled_at
                      ? format(new Date(iv.scheduled_at), "MMM d, yyyy · HH:mm")
                      : "Not scheduled"}
                    {iv.duration_minutes && <span>· {iv.duration_minutes} min</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditing(iv)}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      if (!confirm("Delete this interview?")) return;
                      await del.mutateAsync(iv.id);
                      toast.success("Deleted");
                    }}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {(iv.prep_notes_md || iv.debrief_notes_md) && (
                <div className="mt-2 space-y-2">
                  {iv.prep_notes_md && (
                    <div>
                      <div className="text-xs font-medium uppercase text-muted-foreground">
                        Prep
                      </div>
                      <pre className="mt-0.5 whitespace-pre-wrap text-sm">
                        {iv.prep_notes_md}
                      </pre>
                    </div>
                  )}
                  {iv.debrief_notes_md && (
                    <div>
                      <div className="text-xs font-medium uppercase text-muted-foreground">
                        Debrief
                      </div>
                      <pre className="mt-0.5 whitespace-pre-wrap text-sm">
                        {iv.debrief_notes_md}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No interviews logged yet.
        </div>
      )}

      <InterviewForm
        open={adding}
        onOpenChange={setAdding}
        applicationId={applicationId}
      />
      <InterviewForm
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        applicationId={applicationId}
        initial={editing ?? undefined}
      />
    </div>
  );
}
