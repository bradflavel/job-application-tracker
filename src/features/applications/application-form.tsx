import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
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
import { useCompanies, useCreateCompany } from "@/lib/db/companies";
import {
  useCreateApplication,
  useUpdateApplication,
} from "@/lib/db/applications";
import { STATUS_ORDER, STATUS_LABELS } from "./status-badge";
import type {
  ApplicationRow,
  AppSource,
  AppStatus,
  WorkMode,
} from "@/types/database";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: ApplicationRow;
};

const SOURCES: { value: AppSource; label: string }[] = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "referral", label: "Referral" },
  { value: "indeed", label: "Indeed" },
  { value: "direct", label: "Direct" },
  { value: "recruiter", label: "Recruiter" },
  { value: "otta", label: "Otta / Welcome to the Jungle" },
  { value: "wellfound", label: "Wellfound" },
  { value: "other", label: "Other" },
];

const WORK_MODES: WorkMode[] = ["remote", "hybrid", "onsite"];

const empty: Partial<ApplicationRow> = {
  role_title: "",
  status: "saved",
  applied_at: null,
  posting_url: null,
  location: null,
  work_mode: null,
  salary_min: null,
  salary_max: null,
  currency: "USD",
  source: null,
  source_detail: null,
  priority: 3,
  tags: [],
  jd_snapshot_md: null,
  notes_md: null,
  company_id: null,
};

export function ApplicationForm({ open, onOpenChange, initial }: Props) {
  const [form, setForm] = useState<Partial<ApplicationRow>>(empty);
  const [companyName, setCompanyName] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const companies = useCompanies();
  const createCompany = useCreateCompany();
  const createApp = useCreateApplication();
  const updateApp = useUpdateApplication();

  useEffect(() => {
    if (open) {
      setForm(initial ?? empty);
      setTagsInput((initial?.tags ?? []).join(", "));
      setCompanyName("");
    }
  }, [open, initial]);

  const submitting = createApp.isPending || updateApp.isPending;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let companyId = form.company_id ?? null;
      const typedName = companyName.trim();
      if (!companyId && typedName) {
        const existing = companies.data?.find(
          (c) => c.name.toLowerCase() === typedName.toLowerCase(),
        );
        companyId = existing
          ? existing.id
          : (await createCompany.mutateAsync({ name: typedName })).id;
      }

      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: Partial<ApplicationRow> = {
        ...form,
        company_id: companyId,
        tags,
      };

      if (initial) {
        await updateApp.mutateAsync({ id: initial.id, patch: payload });
        toast.success("Application updated");
      } else {
        if (!payload.role_title) {
          toast.error("Role title is required");
          return;
        }
        await createApp.mutateAsync({
          role_title: payload.role_title,
          status: (payload.status ?? "saved") as AppStatus,
          ...payload,
        });
        toast.success("Application created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const set = <K extends keyof ApplicationRow>(
    key: K,
    value: ApplicationRow[K] | null,
  ) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit application" : "New application"}
          </DialogTitle>
          <DialogDescription>
            Track a role end-to-end: status, interviews, and notes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="role">Role title *</Label>
              <Input
                id="role"
                required
                value={form.role_title ?? ""}
                onChange={(e) => set("role_title", e.target.value)}
                placeholder="Senior Software Engineer"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                list="companies-list"
                value={
                  companyName ||
                  companies.data?.find((c) => c.id === form.company_id)?.name ||
                  ""
                }
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  const match = companies.data?.find(
                    (c) => c.name.toLowerCase() === e.target.value.toLowerCase(),
                  );
                  set("company_id", match ? match.id : null);
                }}
                placeholder="Type to pick or create"
              />
              <datalist id="companies-list">
                {companies.data?.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status ?? "saved"}
                onValueChange={(v) => set("status", v as AppStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="applied_at">Applied on</Label>
              <Input
                id="applied_at"
                type="date"
                value={form.applied_at ?? ""}
                onChange={(e) => set("applied_at", e.target.value || null)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="url">Posting URL</Label>
              <Input
                id="url"
                type="url"
                value={form.posting_url ?? ""}
                onChange={(e) => set("posting_url", e.target.value || null)}
                placeholder="https://…"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location ?? ""}
                onChange={(e) => set("location", e.target.value || null)}
                placeholder="Remote (US), London, etc."
              />
            </div>

            <div className="space-y-1.5">
              <Label>Work mode</Label>
              <Select
                value={form.work_mode ?? ""}
                onValueChange={(v) => set("work_mode", (v || null) as WorkMode)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_MODES.map((m) => (
                    <SelectItem key={m} value={m} className="capitalize">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select
                value={form.source ?? ""}
                onValueChange={(v) => set("source", (v || null) as AppSource)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="salary_min">Salary min</Label>
              <Input
                id="salary_min"
                type="number"
                value={form.salary_min ?? ""}
                onChange={(e) =>
                  set(
                    "salary_min",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salary_max">Salary max</Label>
              <Input
                id="salary_max"
                type="number"
                value={form.salary_max ?? ""}
                onChange={(e) =>
                  set(
                    "salary_max",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={form.currency ?? ""}
                onChange={(e) => set("currency", e.target.value || null)}
                placeholder="USD"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Priority (1–5)</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={form.priority ?? ""}
                onChange={(e) =>
                  set("priority", e.target.value ? Number(e.target.value) : null)
                }
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="backend, startup, dream-company"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="jd">Job description (markdown)</Label>
              <Textarea
                id="jd"
                rows={5}
                value={form.jd_snapshot_md ?? ""}
                onChange={(e) => set("jd_snapshot_md", e.target.value || null)}
                placeholder="Paste the JD here so it's preserved when the posting disappears."
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes (markdown)</Label>
              <Textarea
                id="notes"
                rows={4}
                value={form.notes_md ?? ""}
                onChange={(e) => set("notes_md", e.target.value || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : !initial ? (
                <Plus className="h-4 w-4" />
              ) : null}
              {initial ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
