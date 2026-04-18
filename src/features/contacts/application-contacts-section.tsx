import { useState } from "react";
import { toast } from "sonner";
import { Mail, Plus, Unlink, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  useContacts,
  useContactsForApplication,
  useLinkContact,
  useUnlinkContact,
} from "@/lib/db/contacts";
import { ContactForm } from "./contact-form";
import type { ContactRelationship } from "@/types/database";

const RELATIONSHIPS: ContactRelationship[] = [
  "recruiter",
  "referrer",
  "interviewer",
  "hiring_manager",
  "other",
];

function relLabel(r: ContactRelationship) {
  return r.replace("_", " ");
}

export function ApplicationContactsSection({
  applicationId,
  companyId,
}: {
  applicationId: string;
  companyId: string | null;
}) {
  const linked = useContactsForApplication(applicationId);
  const allContacts = useContacts();
  const link = useLinkContact();
  const unlink = useUnlinkContact();
  const [adding, setAdding] = useState(false);
  const [creating, setCreating] = useState(false);

  const linkedIds = new Set(linked.data?.map((c) => c.id) ?? []);

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New contact
        </Button>
        <Button size="sm" onClick={() => setAdding(true)}>
          <UserPlus className="h-4 w-4" /> Link contact
        </Button>
      </div>

      {linked.isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : linked.data?.length ? (
        <ul className="space-y-2">
          {linked.data.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  <Badge variant="outline" className="capitalize">
                    {relLabel(c.relationship)}
                  </Badge>
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                  {c.role && <span>{c.role}</span>}
                  {c.email && (
                    <a
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      href={`mailto:${c.email}`}
                    >
                      <Mail className="h-3 w-3" />
                      {c.email}
                    </a>
                  )}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={async () => {
                  await unlink.mutateAsync({
                    applicationId,
                    contactId: c.id,
                  });
                  toast.success("Unlinked");
                }}
                title="Unlink"
              >
                <Unlink className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          No contacts linked yet.
        </div>
      )}

      <LinkDialog
        open={adding}
        onOpenChange={setAdding}
        excludeIds={linkedIds}
        onConfirm={async (contactId, relationship) => {
          try {
            await link.mutateAsync({
              applicationId,
              contactId,
              relationship,
            });
            toast.success("Contact linked");
            setAdding(false);
          } catch (e) {
            toast.error(
              e instanceof Error ? e.message : "Failed to link contact",
            );
          }
        }}
      />

      <ContactForm
        open={creating}
        onOpenChange={setCreating}
        defaultCompanyId={companyId ?? undefined}
      />

      {/* when no contacts exist yet, the Link dialog will show empty; prompt create */}
      {adding && !allContacts.data?.length && (
        <div className="text-xs text-muted-foreground">
          No contacts exist yet. Create one first.
        </div>
      )}
    </div>
  );
}

function LinkDialog({
  open,
  onOpenChange,
  excludeIds,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  excludeIds: Set<string>;
  onConfirm: (contactId: string, relationship: ContactRelationship) => void;
}) {
  const { data } = useContacts();
  const [contactId, setContactId] = useState<string>("");
  const [rel, setRel] = useState<ContactRelationship>("recruiter");

  const available = (data ?? []).filter((c) => !excludeIds.has(c.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link contact</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Contact</Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a contact" />
              </SelectTrigger>
              <SelectContent>
                {available.length === 0 ? (
                  <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                    No contacts available. Close this dialog and use "New contact" first.
                  </div>
                ) : (
                  available.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.company?.name ? ` — ${c.company.name}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Relationship</Label>
            <Select
              value={rel}
              onValueChange={(v) => setRel(v as ContactRelationship)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">
                    {relLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!contactId}
            onClick={() => onConfirm(contactId, rel)}
          >
            Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
