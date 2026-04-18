import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { readFileText } from "@/lib/io/csv";
import {
  APPLICATION_CSV_HEADERS,
  applicationFromParsed,
  parseApplicationsCSV,
  type ParsedImport,
} from "@/lib/io/applications-csv";
import { useCompanies, useCreateCompany } from "@/lib/db/companies";
import { useCreateApplication } from "@/lib/db/applications";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function CsvImportDialog({ open, onOpenChange }: Props) {
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: existingCompanies } = useCompanies();
  const createCompany = useCreateCompany();
  const createApp = useCreateApplication();

  useEffect(() => {
    if (!open) {
      setParsed(null);
      setFilename("");
      setProgress(null);
      setBusy(false);
    }
  }, [open]);

  const onPickFile = async (file: File) => {
    try {
      const text = await readFileText(file);
      const p = parseApplicationsCSV(text);
      setParsed(p);
      setFilename(file.name);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to read file");
    }
  };

  const onConfirm = async () => {
    if (!parsed) return;
    setBusy(true);
    setProgress({ done: 0, total: parsed.rows.length });
    const companyCache = new Map<string, string>();
    for (const c of existingCompanies ?? []) {
      companyCache.set(c.name.toLowerCase(), c.id);
    }
    let success = 0;
    const failures: { rowIndex: number; message: string }[] = [];

    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      try {
        let companyId: string | null = null;
        if (row.company_name) {
          const key = row.company_name.toLowerCase();
          const cached = companyCache.get(key);
          if (cached) {
            companyId = cached;
          } else {
            const c = await createCompany.mutateAsync({ name: row.company_name });
            companyId = c.id;
            companyCache.set(key, c.id);
          }
        }
        const payload = applicationFromParsed(row, companyId);
        await createApp.mutateAsync({
          ...payload,
          role_title: payload.role_title,
          status: payload.status,
        });
        success++;
      } catch (e) {
        failures.push({
          rowIndex: row.rowIndex,
          message: e instanceof Error ? e.message : "unknown error",
        });
      }
      setProgress({ done: i + 1, total: parsed.rows.length });
    }

    setBusy(false);
    if (failures.length === 0) {
      toast.success(`Imported ${success} application(s)`);
      onOpenChange(false);
    } else {
      toast.warning(
        `Imported ${success}, ${failures.length} failed. See details in the dialog.`,
      );
      setParsed({
        ...parsed,
        errors: [...parsed.errors, ...failures],
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import applications from CSV</DialogTitle>
          <DialogDescription>
            Accepted columns:{" "}
            <code className="text-xs">{APPLICATION_CSV_HEADERS.join(", ")}</code>
            . Only <code>role_title</code> is required. Tags can be pipe- or
            semicolon-separated. Unknown columns are ignored.
          </DialogDescription>
        </DialogHeader>

        {!parsed ? (
          <div
            className="flex flex-col items-center gap-2 rounded-md border-2 border-dashed p-8 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) onPickFile(f);
            }}
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <div className="text-sm">
              Drop a CSV file or{" "}
              <button
                className="text-primary hover:underline"
                onClick={() => fileRef.current?.click()}
              >
                pick one
              </button>
              .
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickFile(f);
              }}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm">
              <span className="font-medium">{filename}</span>{" "}
              <Badge variant="outline">{parsed.rows.length} row(s)</Badge>
              {parsed.unknownColumns.length > 0 && (
                <Badge variant="warning" className="ml-2">
                  {parsed.unknownColumns.length} unknown column(s) ignored
                </Badge>
              )}
            </div>

            {parsed.unknownColumns.length > 0 && (
              <div className="rounded-md border bg-amber-500/5 p-3 text-xs">
                <div className="flex items-center gap-1 font-medium text-amber-500">
                  <AlertTriangle className="h-3 w-3" /> Ignored columns:
                </div>
                <div className="mt-1 font-mono">
                  {parsed.unknownColumns.join(", ")}
                </div>
              </div>
            )}

            {parsed.errors.length > 0 && (
              <div className="rounded-md border bg-destructive/5 p-3 text-xs">
                <div className="flex items-center gap-1 font-medium text-destructive">
                  <AlertTriangle className="h-3 w-3" /> Skipped / failed:
                </div>
                <ul className="mt-1 space-y-0.5">
                  {parsed.errors.slice(0, 10).map((e, i) => (
                    <li key={i}>
                      Row {e.rowIndex + 1}: {e.message}
                    </li>
                  ))}
                  {parsed.errors.length > 10 && (
                    <li className="text-muted-foreground">
                      …and {parsed.errors.length - 10} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            {parsed.rows.length > 0 && (
              <>
                <Separator />
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="px-2 py-1 font-medium">#</th>
                        <th className="px-2 py-1 font-medium">Role</th>
                        <th className="px-2 py-1 font-medium">Company</th>
                        <th className="px-2 py-1 font-medium">Status</th>
                        <th className="px-2 py-1 font-medium">Applied</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.slice(0, 12).map((r) => (
                        <tr key={r.rowIndex} className="border-t">
                          <td className="px-2 py-1 text-muted-foreground">{r.rowIndex}</td>
                          <td className="px-2 py-1">{r.role_title}</td>
                          <td className="px-2 py-1">{r.company_name ?? "—"}</td>
                          <td className="px-2 py-1 capitalize">{r.status}</td>
                          <td className="px-2 py-1">{r.applied_at ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsed.rows.length > 12 && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      … and {parsed.rows.length - 12} more rows
                    </div>
                  )}
                </div>
              </>
            )}

            {progress && busy && (
              <div className="rounded-md border bg-muted/40 p-3 text-xs">
                Importing {progress.done} / {progress.total}…
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {parsed ? "Cancel" : "Close"}
          </Button>
          {parsed && (
            <Button
              onClick={onConfirm}
              disabled={busy || parsed.rows.length === 0}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Import {parsed.rows.length} application(s)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
