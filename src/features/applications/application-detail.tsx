import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Archive,
  ArchiveRestore,
  ExternalLink,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  useApplication,
  useArchiveApplication,
  useDeleteApplication,
} from "@/lib/db/applications";
import { StatusBadge } from "./status-badge";
import { ApplicationForm } from "./application-form";
import { StatusHistoryList } from "./status-history-list";
import { InterviewList } from "@/features/interviews/interview-list";
import { OffersSection } from "@/features/offers/offers-section";
import { ApplicationContactsSection } from "@/features/contacts/application-contacts-section";
import { AttachmentsSection } from "@/features/attachments/attachments-section";

type Props = {
  id: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function ApplicationDetail({ id, open, onOpenChange }: Props) {
  const { data: app, isLoading } = useApplication(id ?? undefined);
  const [editing, setEditing] = useState(false);
  const archive = useArchiveApplication();
  const del = useDeleteApplication();

  useEffect(() => {
    if (!open) setEditing(false);
  }, [open]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {isLoading || !app ? (
          <div className="py-6 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-xl">
                    {app.role_title}
                  </DialogTitle>
                  <DialogDescription className="mt-1 flex items-center gap-2">
                    {app.company?.name ?? "No company"}
                    <StatusBadge status={app.status} />
                    {app.archived_at && (
                      <Badge variant="muted">Archived</Badge>
                    )}
                  </DialogDescription>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      archive
                        .mutateAsync({ id: app.id, archive: !app.archived_at })
                        .then(() =>
                          toast.success(app.archived_at ? "Unarchived" : "Archived"),
                        )
                    }
                  >
                    {app.archived_at ? (
                      <ArchiveRestore className="h-4 w-4" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={async () => {
                      if (!confirm("Delete this application?")) return;
                      await del.mutateAsync(app.id);
                      toast.success("Deleted");
                      onOpenChange(false);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <Tabs defaultValue="overview">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="interviews">Interviews</TabsTrigger>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
                <TabsTrigger value="offers">Offer</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="jd">JD</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                  <Field label="Applied">
                    {app.applied_at
                      ? format(new Date(app.applied_at), "MMM d, yyyy")
                      : "—"}
                  </Field>
                  <Field label="Work mode">
                    <span className="capitalize">{app.work_mode ?? "—"}</span>
                  </Field>
                  <Field label="Location">{app.location ?? "—"}</Field>
                  <Field label="Source">{app.source ?? "—"}</Field>
                  <Field label="Priority">{app.priority ?? "—"}</Field>
                  <Field label="Salary">
                    {app.salary_min || app.salary_max
                      ? `${app.salary_min ?? "?"}–${app.salary_max ?? "?"} ${app.currency ?? ""}`
                      : "—"}
                  </Field>
                  {app.posting_url && (
                    <Field label="Posting" className="sm:col-span-3">
                      <a
                        href={app.posting_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        {app.posting_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Field>
                  )}
                </div>
                <Separator />
                <div>
                  <div className="text-xs font-medium uppercase text-muted-foreground">
                    Tags
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {app.tags.length === 0 ? (
                      <span className="text-sm text-muted-foreground">None</span>
                    ) : (
                      app.tags.map((t) => (
                        <Badge key={t} variant="outline">
                          {t}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
                {app.rejection_stage && (
                  <div className="rounded-md border bg-destructive/5 p-3 text-sm">
                    <div className="font-medium">Rejection</div>
                    <div className="text-muted-foreground">
                      {app.rejection_stage.replaceAll("_", " ")} — {app.rejection_reason ?? "no reason given"}
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="interviews">
                <InterviewList applicationId={app.id} />
              </TabsContent>
              <TabsContent value="contacts">
                <ApplicationContactsSection
                  applicationId={app.id}
                  companyId={app.company_id}
                />
              </TabsContent>
              <TabsContent value="offers">
                <OffersSection applicationId={app.id} />
              </TabsContent>
              <TabsContent value="files">
                <AttachmentsSection applicationId={app.id} />
              </TabsContent>
              <TabsContent value="jd">
                <pre className="whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm">
                  {app.jd_snapshot_md || "No job description captured."}
                </pre>
              </TabsContent>
              <TabsContent value="notes">
                <pre className="whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm">
                  {app.notes_md || "No notes yet."}
                </pre>
              </TabsContent>
              <TabsContent value="timeline">
                <StatusHistoryList applicationId={app.id} />
              </TabsContent>
            </Tabs>
            <ApplicationForm
              open={editing}
              onOpenChange={setEditing}
              initial={app}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
