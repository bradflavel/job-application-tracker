import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
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
  useCreateCompany,
  useUpdateCompany,
  type CompanyLink,
} from "@/lib/db/companies";
import type { CompanyRow, CompanySize, Json } from "@/types/database";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: CompanyRow;
};

const SIZES: CompanySize[] = [
  "seed",
  "startup",
  "scaleup",
  "midmarket",
  "enterprise",
];

const empty: Partial<CompanyRow> = {
  name: "",
  website: null,
  industry: null,
  size: null,
  stage: null,
  hq_location: null,
  notes_md: null,
  links: [],
};

function toLinks(value: Json): CompanyLink[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is CompanyLink =>
      typeof v === "object" &&
      v !== null &&
      "label" in v &&
      "url" in v &&
      typeof (v as CompanyLink).label === "string" &&
      typeof (v as CompanyLink).url === "string",
  );
}

export function CompanyForm({ open, onOpenChange, initial }: Props) {
  const [form, setForm] = useState<Partial<CompanyRow>>(empty);
  const [links, setLinks] = useState<CompanyLink[]>([]);
  const create = useCreateCompany();
  const update = useUpdateCompany();

  useEffect(() => {
    if (open) {
      setForm(initial ?? empty);
      setLinks(initial ? toLinks(initial.links) : []);
    }
  }, [open, initial]);

  const submitting = create.isPending || update.isPending;

  const set = <K extends keyof CompanyRow>(
    key: K,
    value: CompanyRow[K] | null,
  ) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      const payload: Partial<CompanyRow> = {
        ...form,
        name: form.name.trim(),
        links: links as unknown as Json,
      };
      if (initial) {
        await update.mutateAsync({ id: initial.id, patch: payload });
        toast.success("Company updated");
      } else {
        await create.mutateAsync({ ...payload, name: payload.name! });
        toast.success("Company added");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const addLink = () => setLinks((l) => [...l, { label: "", url: "" }]);
  const updateLink = (i: number, patch: Partial<CompanyLink>) =>
    setLinks((l) => l.map((link, idx) => (idx === i ? { ...link, ...patch } : link)));
  const removeLink = (i: number) =>
    setLinks((l) => l.filter((_, idx) => idx !== i));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit company" : "New company"}</DialogTitle>
          <DialogDescription>
            Track notes and research for a company once, reuse across every
            application.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                required
                value={form.name ?? ""}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={form.website ?? ""}
                onChange={(e) => set("website", e.target.value || null)}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={form.industry ?? ""}
                onChange={(e) => set("industry", e.target.value || null)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Size</Label>
              <Select
                value={form.size ?? ""}
                onValueChange={(v) =>
                  set("size", (v || null) as CompanySize | null)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stage">Stage</Label>
              <Input
                id="stage"
                value={form.stage ?? ""}
                onChange={(e) => set("stage", e.target.value || null)}
                placeholder="Pre-IPO, Series C…"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="hq">HQ location</Label>
              <Input
                id="hq"
                value={form.hq_location ?? ""}
                onChange={(e) => set("hq_location", e.target.value || null)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes (markdown)</Label>
              <Textarea
                id="notes"
                rows={5}
                value={form.notes_md ?? ""}
                onChange={(e) => set("notes_md", e.target.value || null)}
                placeholder="Culture, interview loop, team size, products…"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Links</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLink}
                >
                  <Plus className="h-3.5 w-3.5" /> Add link
                </Button>
              </div>
              <div className="space-y-2">
                {links.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    Glassdoor, Levels.fyi, LinkedIn, careers page…
                  </div>
                )}
                {links.map((link, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={link.label}
                      onChange={(e) =>
                        updateLink(i, { label: e.target.value })
                      }
                      placeholder="Label"
                      className="w-40"
                    />
                    <Input
                      value={link.url}
                      onChange={(e) => updateLink(i, { url: e.target.value })}
                      placeholder="https://…"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLink(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
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
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {initial ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
