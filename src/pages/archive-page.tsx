import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { TableView } from "@/features/applications/table-view";
import { ApplicationDetail } from "@/features/applications/application-detail";
import {
  ApplicationsToolbar,
  type ToolbarState,
} from "@/features/applications/applications-toolbar";
import type { ApplicationFilters } from "@/lib/db/applications";

export function ArchivePage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [toolbar, setToolbar] = useState<ToolbarState>({
    search: "",
    status: "all",
    source: "",
    tag: "",
  });

  const filters: ApplicationFilters = useMemo(
    () => ({
      search: toolbar.search || undefined,
      statuses: toolbar.status === "all" ? undefined : [toolbar.status],
      source: toolbar.source || undefined,
      tags: toolbar.tag ? [toolbar.tag] : undefined,
      archived: true,
    }),
    [toolbar],
  );

  return (
    <div>
      <PageHeader
        title="Archive"
        description="Rejected, withdrawn, and accepted applications."
      />
      <ApplicationsToolbar value={toolbar} onChange={setToolbar} />
      <TableView filters={filters} onOpen={setOpenId} />
      <ApplicationDetail
        id={openId}
        open={!!openId}
        onOpenChange={(v) => !v && setOpenId(null)}
      />
    </div>
  );
}
