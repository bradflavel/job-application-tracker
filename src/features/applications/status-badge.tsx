import { Badge } from "@/components/ui/badge";
import type { AppStatus } from "@/types/database";

const labels: Record<AppStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  ghosted: "Ghosted",
};

const variants: Record<AppStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  saved: "muted",
  applied: "default",
  screening: "default",
  interview: "warning",
  offer: "success",
  accepted: "success",
  rejected: "destructive",
  withdrawn: "secondary",
  ghosted: "secondary",
};

export function StatusBadge({ status }: { status: AppStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

export const STATUS_ORDER: AppStatus[] = [
  "saved",
  "applied",
  "screening",
  "interview",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
  "ghosted",
];

export const ACTIVE_STATUSES: AppStatus[] = [
  "saved",
  "applied",
  "screening",
  "interview",
  "offer",
];

export const STATUS_LABELS = labels;
