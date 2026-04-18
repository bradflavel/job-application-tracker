import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useCreateInterview,
  useUpdateInterview,
} from "@/lib/db/interviews";
import type {
  InterviewFormat,
  InterviewOutcome,
  InterviewRow,
} from "@/types/database";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  applicationId: string;
  initial?: InterviewRow;
};

const ROUND_LABELS = [
  "Recruiter screen",
  "Tech 1",
  "Tech 2",
  "Onsite",
  "System design",
  "Behavioral",
  "Hiring manager",
  "Final",
];
const FORMATS: InterviewFormat[] = ["phone", "video", "onsite"];
const OUTCOMES: InterviewOutcome[] = ["pending", "passed", "failed", "cancelled"];

function toLocalDatetime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function InterviewForm({
  open,
  onOpenChange,
  applicationId,
  initial,
}: Props) {
  const [form, setForm] = useState<Partial<InterviewRow>>({});
  const [scheduled, setScheduled] = useState("");
  const create = useCreateInterview();
  const update = useUpdateInterview();

  useEffect(() => {
    if (!open) return;
    setForm(
      initial ?? {
        round_label: "Recruiter screen",
        duration_minutes: 30,
        format: "video",
        outcome: "pending",
      },
    );
    setScheduled(initial ? toLocalDatetime(initial.scheduled_at) : "");
  }, [open, initial]);

  const submitting = create.isPending || update.isPending;

  const set = <K extends keyof InterviewRow>(
    k: K,
    v: InterviewRow[K] | null,
  ) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.round_label?.trim()) {
      toast.error("Round label required");
      return;
    }
    try {
      const payload: Partial<InterviewRow> = {
        ...form,
        scheduled_at: scheduled ? new Date(scheduled).toISOString() : null,
      };
      if (initial) {
        await update.mutateAsync({ id: initial.id, patch: payload });
        toast.success("Interview updated");
      } else {
        await create.mutateAsync({
          application_id: applicationId,
          round_label: payload.round_label!,
          ...payload,
        });
        toast.success("Interview added");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit interview" : "New interview"}
          </DialogTitle>
          <DialogDescription>
            Round label, when it is, prep, and a debrief after.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="round">Round</Label>
              <Input
                id="round"
                list="round-labels"
                required
                value={form.round_label ?? ""}
                onChange={(e) => set("round_label", e.target.value)}
              />
              <datalist id="round-labels">
                {ROUND_LABELS.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label>Format</Label>
              <Select
                value={form.format ?? ""}
                onValueChange={(v) => set("format", (v || null) as InterviewFormat)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f} value={f} className="capitalize">
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scheduled">Scheduled</Label>
              <Input
                id="scheduled"
                type="datetime-local"
                value={scheduled}
                onChange={(e) => setScheduled(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={form.duration_minutes ?? ""}
                onChange={(e) =>
                  set(
                    "duration_minutes",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Outcome</Label>
              <Select
                value={form.outcome ?? "pending"}
                onValueChange={(v) => set("outcome", v as InterviewOutcome)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUTCOMES.map((o) => (
                    <SelectItem key={o} value={o} className="capitalize">
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="prep">
            <TabsList>
              <TabsTrigger value="prep">Prep notes</TabsTrigger>
              <TabsTrigger value="debrief">Debrief</TabsTrigger>
            </TabsList>
            <TabsContent value="prep">
              <Textarea
                rows={6}
                value={form.prep_notes_md ?? ""}
                onChange={(e) => set("prep_notes_md", e.target.value || null)}
                placeholder="Topics to study, questions to ask, STAR stories, people you're meeting…"
              />
            </TabsContent>
            <TabsContent value="debrief">
              <Textarea
                rows={6}
                value={form.debrief_notes_md ?? ""}
                onChange={(e) => set("debrief_notes_md", e.target.value || null)}
                placeholder="What went well, what didn't, vibes, red/green flags, follow-ups…"
              />
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {initial ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
