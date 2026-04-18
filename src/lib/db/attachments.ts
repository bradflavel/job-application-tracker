import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { AttachmentKind, AttachmentRow } from "@/types/database";

export const attachmentKeys = {
  forApplication: (id: string) =>
    ["attachments", "for-application", id] as const,
};

export function useAttachmentsForApplication(applicationId: string | undefined) {
  return useQuery({
    queryKey: applicationId
      ? attachmentKeys.forApplication(applicationId)
      : ["attachments", "for-application", "none"],
    enabled: !!applicationId,
    queryFn: async (): Promise<AttachmentRow[]> => {
      if (!applicationId) return [];
      const { data, error } = await supabase
        .from("attachments")
        .select("*")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AttachmentRow[];
    },
  });
}

export function useUploadAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      applicationId,
      file,
      kind,
      label,
    }: {
      applicationId: string;
      file: File;
      kind: AttachmentKind;
      label?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not signed in");

      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const storagePath = `${userId}/${applicationId}/${Date.now()}-${safeName}`;

      const { error: upErr } = await supabase.storage
        .from("attachments")
        .upload(storagePath, file, {
          cacheControl: "3600",
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (upErr) throw upErr;

      const { data, error } = await supabase
        .from("attachments")
        .insert({
          application_id: applicationId,
          kind,
          storage_path: storagePath,
          label: label ?? null,
          size_bytes: file.size,
          mime_type: file.type || null,
        })
        .select("*")
        .single();
      if (error) {
        // best-effort cleanup if metadata insert failed
        await supabase.storage.from("attachments").remove([storagePath]);
        throw error;
      }
      return data as AttachmentRow;
    },
    onSuccess: (row) =>
      qc.invalidateQueries({
        queryKey: attachmentKeys.forApplication(row.application_id),
      }),
  });
}

export function useDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (attachment: AttachmentRow) => {
      const { error: rmErr } = await supabase.storage
        .from("attachments")
        .remove([attachment.storage_path]);
      if (rmErr) throw rmErr;
      const { error } = await supabase
        .from("attachments")
        .delete()
        .eq("id", attachment.id);
      if (error) throw error;
      return attachment;
    },
    onSuccess: (row) =>
      qc.invalidateQueries({
        queryKey: attachmentKeys.forApplication(row.application_id),
      }),
  });
}

export async function getAttachmentDownloadUrl(storagePath: string) {
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUrl(storagePath, 60);
  if (error) throw error;
  return data.signedUrl;
}
