import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_LABELS, STATUS_ORDER } from "./status-badge";
import type { AppStatus } from "@/types/database";

export type ToolbarState = {
  search: string;
  status: AppStatus | "all";
  source: string;
  tag: string;
};

type Props = {
  value: ToolbarState;
  onChange: (v: ToolbarState) => void;
};

export function ApplicationsToolbar({ value, onChange }: Props) {
  const set = <K extends keyof ToolbarState>(k: K, v: ToolbarState[K]) =>
    onChange({ ...value, [k]: v });
  const hasFilters =
    value.search || value.status !== "all" || value.source || value.tag;

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Search role, notes, JD…"
          className="pl-8"
        />
      </div>
      <Select
        value={value.status}
        onValueChange={(v) => set("status", v as ToolbarState["status"])}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUS_ORDER.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={value.tag}
        onChange={(e) => set("tag", e.target.value)}
        placeholder="Tag"
        className="w-32"
      />
      <Input
        value={value.source}
        onChange={(e) => set("source", e.target.value)}
        placeholder="Source"
        className="w-32"
      />
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange({ search: "", status: "all", source: "", tag: "" })
          }
        >
          <X className="h-4 w-4" /> Clear
        </Button>
      )}
    </div>
  );
}
