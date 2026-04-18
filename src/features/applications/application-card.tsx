import { formatDistanceToNow } from "date-fns";
import { Building2, ExternalLink, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ApplicationWithCompany } from "@/lib/db/applications";

type Props = {
  app: ApplicationWithCompany;
  onClick?: () => void;
};

export function ApplicationCard({ app, onClick }: Props) {
  const daysInStage = app.updated_at
    ? formatDistanceToNow(new Date(app.updated_at), { addSuffix: false })
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-md border bg-card p-3 text-left shadow-sm transition hover:border-primary/40 hover:shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{app.role_title}</div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{app.company?.name ?? "—"}</span>
          </div>
        </div>
        {app.priority ? (
          <div className="flex items-center gap-0.5 text-xs text-amber-500">
            <Star className="h-3 w-3 fill-current" />
            {app.priority}
          </div>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {app.tags.slice(0, 3).map((t) => (
          <Badge key={t} variant="outline" className="px-1.5 py-0 text-[10px]">
            {t}
          </Badge>
        ))}
        {app.tags.length > 3 && (
          <span className="text-[10px] text-muted-foreground">
            +{app.tags.length - 3}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{daysInStage ? `${daysInStage} in stage` : ""}</span>
        {app.posting_url && (
          <a
            href={app.posting_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-0.5 hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </button>
  );
}
