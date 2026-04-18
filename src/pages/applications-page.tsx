import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LayoutGrid, Plus, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ApplicationForm } from "@/features/applications/application-form";
import { ApplicationDetail } from "@/features/applications/application-detail";
import { KanbanBoard } from "@/features/applications/kanban-board";
import { TableView } from "@/features/applications/table-view";
import {
  ApplicationsToolbar,
  type ToolbarState,
} from "@/features/applications/applications-toolbar";
import type { ApplicationFilters } from "@/lib/db/applications";

type View = "kanban" | "table";

export function ApplicationsPage() {
  const [params, setParams] = useSearchParams();
  const view = (params.get("view") as View) || "kanban";
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [toolbar, setToolbar] = useState<ToolbarState>({
    search: "",
    status: "all",
    source: "",
    tag: "",
  });

  useEffect(() => {
    if (params.get("new") === "1") {
      setCreating(true);
      params.delete("new");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const filters: ApplicationFilters = useMemo(
    () => ({
      search: toolbar.search || undefined,
      statuses: toolbar.status === "all" ? undefined : [toolbar.status],
      source: toolbar.source || undefined,
      tags: toolbar.tag ? [toolbar.tag] : undefined,
      archived: false,
    }),
    [toolbar],
  );

  const setView = (v: View) => {
    params.set("view", v);
    setParams(params, { replace: true });
  };

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Drag across the pipeline, filter, and search."
        actions={
          <>
            <div className="hidden rounded-md border p-0.5 sm:flex">
              <Button
                size="sm"
                variant={view === "kanban" ? "default" : "ghost"}
                onClick={() => setView("kanban")}
              >
                <LayoutGrid className="h-4 w-4" /> Kanban
              </Button>
              <Button
                size="sm"
                variant={view === "table" ? "default" : "ghost"}
                onClick={() => setView("table")}
              >
                <Rows3 className="h-4 w-4" /> Table
              </Button>
            </div>
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> New
            </Button>
          </>
        }
      />
      <ApplicationsToolbar value={toolbar} onChange={setToolbar} />
      {view === "kanban" ? (
        <KanbanBoard filters={filters} onOpen={setOpenId} />
      ) : (
        <TableView filters={filters} onOpen={setOpenId} />
      )}
      <ApplicationForm open={creating} onOpenChange={setCreating} />
      <ApplicationDetail
        id={openId}
        open={!!openId}
        onOpenChange={(v) => !v && setOpenId(null)}
      />
    </div>
  );
}
