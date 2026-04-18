import { useState } from "react";
import { toast } from "sonner";
import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApplications } from "@/lib/db/applications";
import { exportApplicationsToCSV } from "@/lib/io/applications-csv";
import { exportBackup } from "@/lib/io/backup";
import { downloadBlob } from "@/lib/io/csv";

function timestamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export function ExportButtons() {
  const [busy, setBusy] = useState<"csv" | "json" | null>(null);
  // Include archived in the export, but not soft-deleted
  const active = useApplications({ archived: false });
  const archived = useApplications({ archived: true });

  const onExportCSV = async () => {
    setBusy("csv");
    try {
      const rows = [...(active.data ?? []), ...(archived.data ?? [])];
      if (rows.length === 0) {
        toast.info("Nothing to export yet.");
        return;
      }
      const csv = exportApplicationsToCSV(rows);
      downloadBlob(
        `applications-${timestamp()}.csv`,
        csv,
        "text/csv;charset=utf-8",
      );
      toast.success(`Exported ${rows.length} application(s)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  };

  const onExportJSON = async () => {
    setBusy("json");
    try {
      const payload = await exportBackup();
      downloadBlob(
        `job-tracker-backup-${timestamp()}.json`,
        JSON.stringify(payload, null, 2),
        "application/json",
      );
      const summary = Object.entries(payload.counts)
        .map(([k, v]) => `${v} ${k}`)
        .join(" · ");
      toast.success(`Backup ready — ${summary}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Backup failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={onExportCSV} disabled={busy !== null}>
        {busy === "csv" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        Export applications CSV
      </Button>
      <Button variant="outline" onClick={onExportJSON} disabled={busy !== null}>
        {busy === "json" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileJson className="h-4 w-4" />
        )}
        Full backup (JSON)
      </Button>
      <Button variant="ghost" disabled>
        <Download className="h-4 w-4 opacity-60" />
        Restore from JSON (coming soon)
      </Button>
    </div>
  );
}
