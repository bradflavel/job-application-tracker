import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Building2,
  ExternalLink,
  Mail,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  useApplicationsForContact,
  useContact,
  useDeleteContact,
} from "@/lib/db/contacts";
import { ContactForm } from "./contact-form";
import { StatusBadge } from "@/features/applications/status-badge";
import type { AppStatus } from "@/types/database";

type Props = {
  id: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onOpenApplication?: (id: string) => void;
};

export function ContactDetail({
  id,
  open,
  onOpenChange,
  onOpenApplication,
}: Props) {
  const { data: contact, isLoading } = useContact(id ?? undefined);
  const apps = useApplicationsForContact(id ?? undefined);
  const [editing, setEditing] = useState(false);
  const del = useDeleteContact();

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        {isLoading || !contact ? (
          <div className="py-6 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-xl">{contact.name}</DialogTitle>
                  <DialogDescription className="mt-1 space-x-2">
                    {contact.role && <span>{contact.role}</span>}
                    {contact.company && (
                      <Badge variant="outline">
                        <Building2 className="mr-1 h-3 w-3" />
                        {contact.company.name}
                      </Badge>
                    )}
                  </DialogDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={async () => {
                      if (!confirm("Delete this contact?")) return;
                      await del.mutateAsync(contact.id);
                      toast.success("Deleted");
                      onOpenChange(false);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="grid gap-2 text-sm">
              {contact.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    className="text-primary hover:underline"
                    href={`mailto:${contact.email}`}
                  >
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a className="hover:underline" href={`tel:${contact.phone}`}>
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.linkedin_url && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <a
                    className="text-primary hover:underline"
                    href={contact.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {contact.linkedin_url}
                  </a>
                </div>
              )}
              {contact.last_contacted_at && (
                <div className="text-xs text-muted-foreground">
                  Last contacted{" "}
                  {format(new Date(contact.last_contacted_at), "MMM d, yyyy")}
                </div>
              )}
            </div>

            {contact.notes_md && (
              <>
                <Separator />
                <pre className="whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm">
                  {contact.notes_md}
                </pre>
              </>
            )}

            <Separator />
            <div>
              <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                Linked to ({apps.data?.length ?? 0})
              </div>
              {apps.isLoading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : apps.data?.length ? (
                <ul className="space-y-1.5">
                  {apps.data.map((a) => (
                    <li key={a.id}>
                      <button
                        onClick={() => onOpenApplication?.(a.id)}
                        className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        <span>
                          <span className="font-medium">{a.role_title}</span>
                          {a.company?.name && (
                            <span className="ml-2 text-muted-foreground">
                              @ {a.company.name}
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {a.relationship.replace("_", " ")}
                          </Badge>
                          <StatusBadge status={a.status as AppStatus} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Not linked to any applications yet.
                </div>
              )}
            </div>

            <ContactForm
              open={editing}
              onOpenChange={setEditing}
              initial={contact}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
