import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { OfferRow } from "@/types/database";

export type OfferWithApp = OfferRow & {
  application: {
    id: string;
    role_title: string;
    company: { name: string } | null;
  } | null;
};

export const offerKeys = {
  all: ["offers"] as const,
  forApplication: (id: string) => ["offers", "for-application", id] as const,
  activeList: () => ["offers", "active"] as const,
};

export function useOffersForApplication(applicationId: string | undefined) {
  return useQuery({
    queryKey: applicationId
      ? offerKeys.forApplication(applicationId)
      : ["offers", "for-application", "none"],
    enabled: !!applicationId,
    queryFn: async (): Promise<OfferRow[]> => {
      if (!applicationId) return [];
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("application_id", applicationId)
        .order("received_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OfferRow[];
    },
  });
}

export function useActiveOffers() {
  return useQuery({
    queryKey: offerKeys.activeList(),
    queryFn: async (): Promise<OfferWithApp[]> => {
      const { data, error } = await supabase
        .from("offers")
        .select(
          "*, application:applications(id, role_title, company:companies(name))",
        )
        .neq("decision", "rejected")
        .order("received_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OfferWithApp[];
    },
  });
}

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Partial<OfferRow> & { application_id: string },
    ) => {
      const { data, error } = await supabase
        .from("offers")
        .insert(input)
        .select("*")
        .single();
      if (error) throw error;
      return data as OfferRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({
        queryKey: offerKeys.forApplication(row.application_id),
      });
      qc.invalidateQueries({ queryKey: offerKeys.activeList() });
    },
  });
}

export function useUpdateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<OfferRow>;
    }) => {
      const { data, error } = await supabase
        .from("offers")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as OfferRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({
        queryKey: offerKeys.forApplication(row.application_id),
      });
      qc.invalidateQueries({ queryKey: offerKeys.activeList() });
    },
  });
}

export function useDeleteOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("offers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: offerKeys.all }),
  });
}
