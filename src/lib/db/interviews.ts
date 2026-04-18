import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { InterviewRow } from "@/types/database";

export const interviewKeys = {
  all: ["interviews"] as const,
  forApplication: (id: string) =>
    ["interviews", "for-application", id] as const,
  upcoming: () => ["interviews", "upcoming"] as const,
};

export function useInterviewsForApplication(applicationId: string | undefined) {
  return useQuery({
    queryKey: applicationId
      ? interviewKeys.forApplication(applicationId)
      : ["interviews", "for-application", "none"],
    enabled: !!applicationId,
    queryFn: async (): Promise<InterviewRow[]> => {
      if (!applicationId) return [];
      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .eq("application_id", applicationId)
        .order("scheduled_at", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as InterviewRow[];
    },
  });
}

export function useUpcomingInterviews() {
  return useQuery({
    queryKey: interviewKeys.upcoming(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interviews")
        .select(
          "*, application:applications(id, role_title, company:companies(name))",
        )
        .gte("scheduled_at", new Date().toISOString())
        .eq("outcome", "pending")
        .order("scheduled_at", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Partial<InterviewRow> & { application_id: string; round_label: string },
    ) => {
      const { data, error } = await supabase
        .from("interviews")
        .insert(input)
        .select("*")
        .single();
      if (error) throw error;
      return data as InterviewRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({
        queryKey: interviewKeys.forApplication(row.application_id),
      });
      qc.invalidateQueries({ queryKey: interviewKeys.upcoming() });
    },
  });
}

export function useUpdateInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<InterviewRow>;
    }) => {
      const { data, error } = await supabase
        .from("interviews")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as InterviewRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({
        queryKey: interviewKeys.forApplication(row.application_id),
      });
      qc.invalidateQueries({ queryKey: interviewKeys.upcoming() });
    },
  });
}

export function useDeleteInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("interviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interviewKeys.all });
    },
  });
}
