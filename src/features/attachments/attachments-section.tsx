import { useRef, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Download,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAttachmentDownloadUrl,
  useAttachmentsForApplication,
  useDeleteAttachment,
  useUploadAttachment,
} from "@/lib/db/attachments";
import type { AttachmentKind, AttachmentRow } from "@/types/database";

const KINDS: { value: AttachmentKind; label: string }[] = [
  { value: "resume", label: "Resume" },
  { value: "cover_letter", label: "Cover letter" },
  { value: "offer_letter", label: "Offer letter" },
  { value: "other", label: "Other" },
];

const KIND_LABEL: Record<AttachmentKind, string> = {
  resume: "Resume",
  cover_letter: "Cover letter",
  offer_letter: "Offer letter",
  other: "Other",
};

function formatBytes(n: number | null) {
  if (n == null) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function filenameOf(path: string) {
  return path.split("/").pop() ?? path;
}

export function AttachmentsSection({ applicationId }: { applicationId: string }) {
  const { data, isLoading } = useAttachmentsForApplication(applicationId);
  const upload = useUploadAttachment();
  const del = useDeleteAttachment();
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [kind, setKind] = useState<AttachmentKind>("resume");
  const [label, setLabel] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => fileInputRef.current?.click();

  const onPicked = (file: File | null) => {
    if (!file) return;
    setPendingFile(file);
    setLabel(file.name.replace(/\.[^.]+$/, ""));
    setKind(inferKind(file));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onPicked(f);
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    try {
      await upload.mutateAsync({
        applicationId,
        file: pendingFile,
        kind,
        label: label.trim() || undefined,
      });
      toast.success("Uploaded");
      setPendingFile(null);
      setLabel("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const onDownload = async (a: AttachmentRow) => {
    try {
      const url = await getAttachmentDownloadUrl(a.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not get download link");
    }
  };

  const onDelete = async (a: AttachmentRow) => {
    if (!confirm(`Delete ${a.label || filenameOf(a.storage_path)}?`)) return;
    try {
      await del.mutateAsync(a);
      toast.success("Deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-center transition ${
          dragOver ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        <Upload className="h-6 w-6 text-muted-foreground" />
        <div className="text-sm">
          Drag a file here, or{" "}
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={openPicker}
          >
            pick one
          </button>
          .
        </div>
        <div className="text-xs text-muted-foreground">
          PDF, docx, images up to 50 MB.
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => onPicked(e.target.files?.[0] ?? null)}
        />
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : data?.length ? (
        <ul className="space-y-2">
          {data.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {a.label || filenameOf(a.storage_path)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{KIND_LABEL[a.kind]}</Badge>
                    <span>{formatBytes(a.size_bytes)}</span>
                    <span>· {format(new Date(a.created_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDownload(a)}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDelete(a)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          <Paperclip className="mb-1 h-4 w-4" />
          No attachments yet.
        </div>
      )}

      <Dialog
        open={!!pendingFile}
        onOpenChange={(v) => {
          if (!v) {
            setPendingFile(null);
            setLabel("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload attachment</DialogTitle>
          </DialogHeader>
          {pendingFile && (
            <div className="space-y-3">
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <div className="truncate font-medium">{pendingFile.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatBytes(pendingFile.size)}
                  {pendingFile.type ? ` · ${pendingFile.type}` : ""}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Kind</Label>
                <Select
                  value={kind}
                  onValueChange={(v) => setKind(v as AttachmentKind)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KINDS.map((k) => (
                      <SelectItem key={k.value} value={k.value}>
                        {k.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="label">Label (optional)</Label>
                <Input
                  id="label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Resume — Senior Backend v3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPendingFile(null);
                setLabel("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmUpload} disabled={upload.isPending}>
              {upload.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function inferKind(file: File): AttachmentKind {
  const n = file.name.toLowerCase();
  if (/resume|cv/.test(n)) return "resume";
  if (/cover/.test(n)) return "cover_letter";
  if (/offer/.test(n)) return "offer_letter";
  return "other";
}
