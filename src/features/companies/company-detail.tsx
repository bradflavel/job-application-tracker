import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useCompany, useDeleteCompany, type CompanyLink } from "@/lib/db/companies";
import { CompanyForm } from "./company-form";
import { StatusBadge } from "@/features/applications/status-badge";
import type { ApplicationRow, AppStatus, Json } from "@/types/database";

type Props = {
  id: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onOpenApplication?: (id: string) => void;
};

function toLinks(value: Json | undefined | null): CompanyLink[] {
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

export function CompanyDetail({ id, open, onOpenChange, onOpenApplication }: Props) {
  const { data: company, isLoading } = useCompany(id ?? undefined);
  const [editing, setEditing] = useState(false);
  const del = useDeleteCompany();

  const apps = useQuery({
    queryKey: ["company-apps", id],
    enabled: !!id && open,
    queryFn: async (): Promise<
      Pick<
        ApplicationRow,
        "id" | "role_title" | "status" | "applied_at" | "archived_at"
      >[]
    > => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("applications")
        .select("id, role_title, status, applied_at, archived_at")
        .eq("company_id", id)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as typeof data;
    },
  });

  if (!open) return null;

  const links = toLinks(company?.links);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading || !company ? (
          <div className="py-6 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-xl">{company.name}</DialogTitle>
                  <DialogDescription className="mt-1 space-x-2">
                    {company.industry && <span>{company.industry}</span>}
                    {company.size && (
                      <Badge variant="outline" className="capitalize">
                        {company.size}
                      </Badge>
                    )}
                    {company.stage && <span>{company.stage}</span>}
                    {company.hq_location && <span>· {company.hq_location}</span>}
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
                      if (!confirm("Delete this company? Applications will keep their history but lose the link."))
                        return;
                      await del.mutateAsync(company.id);
                      toast.success("Company deleted");
                      onOpenChange(false);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                {company.website}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {links.length > 0 && (
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground">
                  Links
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {links.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
                    >
                      {link.label || link.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {company.notes_md && (
              <>
                <Separator />
                <pre className="whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm">
                  {company.notes_md}
                </pre>
              </>
            )}

            <Separator />
            <div>
              <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                Applications ({apps.data?.length ?? 0})
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
                        <span className="font-medium">{a.role_title}</span>
                        <span className="flex items-center gap-2">
                          {a.archived_at && <Badge variant="muted">Archived</Badge>}
                          <StatusBadge status={a.status as AppStatus} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No applications yet for this company.
                </div>
              )}
            </div>

            <CompanyForm
              open={editing}
              onOpenChange={setEditing}
              initial={company}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
