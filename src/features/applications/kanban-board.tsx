import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { ApplicationCard } from "./application-card";
import {
  STATUS_LABELS,
  ACTIVE_STATUSES,
} from "./status-badge";
import {
  useApplications,
  useUpdateStatus,
  type ApplicationFilters,
} from "@/lib/db/applications";
import type { AppStatus } from "@/types/database";

type Props = {
  filters: ApplicationFilters;
  onOpen: (id: string) => void;
};

export function KanbanBoard({ filters, onOpen }: Props) {
  const { data, isLoading } = useApplications({
    ...filters,
    archived: false,
    statuses: filters.statuses ?? ACTIVE_STATUSES,
  });
  const updateStatus = useUpdateStatus();

  const grouped: Record<AppStatus, typeof data> = Object.fromEntries(
    ACTIVE_STATUSES.map((s) => [s, [] as typeof data]),
  ) as never;
  (data ?? []).forEach((a) => {
    if (ACTIVE_STATUSES.includes(a.status)) grouped[a.status]?.push(a);
  });

  const onDragEnd = async (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    const target = destination.droppableId as AppStatus;
    try {
      await updateStatus.mutateAsync({ id: draggableId, status: target });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    }
  };

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading applications…</div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {ACTIVE_STATUSES.map((status) => (
          <Droppable key={status} droppableId={status}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex min-h-[200px] flex-col rounded-lg border bg-muted/30 p-2 ${
                  snapshot.isDraggingOver ? "ring-2 ring-primary/30" : ""
                }`}
              >
                <div className="mb-2 flex items-center justify-between px-1 text-xs font-medium text-muted-foreground">
                  <span className="uppercase tracking-wide">
                    {STATUS_LABELS[status]}
                  </span>
                  <span className="rounded bg-background px-1.5 py-0.5">
                    {grouped[status]?.length ?? 0}
                  </span>
                </div>
                <div className="space-y-2">
                  {grouped[status]?.map((app, idx) => (
                    <Draggable key={app.id} draggableId={app.id} index={idx}>
                      {(p, s) => (
                        <div
                          ref={p.innerRef}
                          {...p.draggableProps}
                          {...p.dragHandleProps}
                          className={s.isDragging ? "opacity-90" : ""}
                        >
                          <ApplicationCard
                            app={app}
                            onClick={() => onOpen(app.id)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
