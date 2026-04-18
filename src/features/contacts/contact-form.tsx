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
import { useCompanies } from "@/lib/db/companies";
import { useCreateContact, useUpdateContact } from "@/lib/db/contacts";
import type { ContactRow } from "@/types/database";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: ContactRow;
  defaultCompanyId?: string;
};

const empty: Partial<ContactRow> = {
  name: "",
  email: null,
  phone: null,
  role: null,
  linkedin_url: null,
  notes_md: null,
  company_id: null,
};

export function ContactForm({
  open,
  onOpenChange,
  initial,
  defaultCompanyId,
}: Props) {
  const [form, setForm] = useState<Partial<ContactRow>>(empty);
  const [companyInput, setCompanyInput] = useState("");
  const companies = useCompanies();
  const create = useCreateContact();
  const update = useUpdateContact();

  useEffect(() => {
    if (!open) return;
    const base = initial ?? empty;
    setForm({ ...base, company_id: base.company_id ?? defaultCompanyId ?? null });
    const cid = base.company_id ?? defaultCompanyId ?? null;
    setCompanyInput(
      cid
        ? (companies.data?.find((c) => c.id === cid)?.name ?? "")
        : "",
    );
  }, [open, initial, defaultCompanyId, companies.data]);

  const submitting = create.isPending || update.isPending;

  const set = <K extends keyof ContactRow>(
    k: K,
    v: ContactRow[K] | null,
  ) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      const typedCompany = companyInput.trim();
      let companyId = form.company_id ?? null;
      if (typedCompany) {
        const match = companies.data?.find(
          (c) => c.name.toLowerCase() === typedCompany.toLowerCase(),
        );
        companyId = match ? match.id : null;
      } else {
        companyId = null;
      }
      const payload: Partial<ContactRow> = {
        ...form,
        name: form.name.trim(),
        company_id: companyId,
      };
      if (initial) {
        await update.mutateAsync({ id: initial.id, patch: payload });
        toast.success("Contact updated");
      } else {
        await create.mutateAsync({ ...payload, name: payload.name! });
        toast.success("Contact added");
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
          <DialogTitle>{initial ? "Edit contact" : "New contact"}</DialogTitle>
          <DialogDescription>
            Recruiters, referrers, hiring managers, interviewers.
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email ?? ""}
                onChange={(e) => set("email", e.target.value || null)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone ?? ""}
                onChange={(e) => set("phone", e.target.value || null)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={form.role ?? ""}
                onChange={(e) => set("role", e.target.value || null)}
                placeholder="Recruiter, Eng Manager…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                list="contact-company-list"
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                placeholder="Type to pick"
              />
              <datalist id="contact-company-list">
                {companies.data?.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                type="url"
                value={form.linkedin_url ?? ""}
                onChange={(e) => set("linkedin_url", e.target.value || null)}
                placeholder="https://linkedin.com/in/…"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
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
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {initial ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
