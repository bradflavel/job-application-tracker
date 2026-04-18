import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Archive, Trash2 } from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import {
  useApplications,
  useBulkUpdateApplications,
  type ApplicationFilters,
  type ApplicationWithCompany,
} from "@/lib/db/applications";

type Props = {
  filters: ApplicationFilters;
  onOpen: (id: string) => void;
};

export function TableView({ filters, onOpen }: Props) {
  const { data, isLoading } = useApplications(filters);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "updated_at", desc: true },
  ]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const bulkUpdate = useBulkUpdateApplications();

  const columns = useMemo<ColumnDef<ApplicationWithCompany>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() ? "indeterminate" : false)
            }
            onCheckedChange={(v) => {
              const next: Record<string, boolean> = {};
              (data ?? []).forEach((r) => (next[r.id] = !!v));
              setSelected(next);
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={!!selected[row.original.id]}
            onCheckedChange={(v) =>
              setSelected((s) => ({ ...s, [row.original.id]: !!v }))
            }
          />
        ),
      },
      {
        id: "role_title",
        header: "Role",
        accessorFn: (r) => r.role_title,
        cell: ({ row }) => (
          <button
            onClick={() => onOpen(row.original.id)}
            className="font-medium hover:underline"
          >
            {row.original.role_title}
          </button>
        ),
      },
      {
        id: "company",
        header: "Company",
        accessorFn: (r) => r.company?.name ?? "",
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (r) => r.status,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "applied_at",
        header: "Applied",
        accessorFn: (r) => r.applied_at ?? "",
        cell: ({ row }) =>
          row.original.applied_at
            ? format(new Date(row.original.applied_at), "MMM d, yyyy")
            : "—",
      },
      {
        id: "source",
        header: "Source",
        accessorFn: (r) => r.source ?? "",
        cell: ({ row }) => row.original.source ?? "—",
      },
      {
        id: "work_mode",
        header: "Mode",
        accessorFn: (r) => r.work_mode ?? "",
        cell: ({ row }) => (
          <span className="capitalize">{row.original.work_mode ?? "—"}</span>
        ),
      },
      {
        id: "priority",
        header: "Pri",
        accessorFn: (r) => r.priority ?? 0,
        cell: ({ row }) => row.original.priority ?? "—",
      },
      {
        id: "updated_at",
        header: "Updated",
        accessorFn: (r) => r.updated_at,
        cell: ({ row }) =>
          format(new Date(row.original.updated_at), "MMM d"),
      },
    ],
    [selected, data, onOpen],
  );

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedIds = Object.entries(selected)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const bulkArchive = async () => {
    try {
      await bulkUpdate.mutateAsync({
        ids: selectedIds,
        patch: { archived_at: new Date().toISOString() },
      });
      setSelected({});
      toast.success(`Archived ${selectedIds.length} application(s)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk archive failed");
    }
  };

  const bulkDelete = async () => {
    try {
      await bulkUpdate.mutateAsync({
        ids: selectedIds,
        patch: { deleted_at: new Date().toISOString() },
      });
      setSelected({});
      toast.success(`Deleted ${selectedIds.length} application(s)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk delete failed");
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-3">
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <span className="font-medium">{selectedIds.length} selected</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={bulkArchive}>
              <Archive className="h-4 w-4" /> Archive
            </Button>
            <Button size="sm" variant="destructive" onClick={bulkDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      )}
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="px-3 py-2 text-left font-medium text-muted-foreground"
                  >
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t hover:bg-muted/30">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-10 text-center text-sm text-muted-foreground"
                >
                  No applications match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
