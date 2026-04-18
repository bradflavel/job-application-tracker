import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CompanyRow } from "@/types/database";

export const companyKeys = {
  all: ["companies"] as const,
  list: () => ["companies", "list"] as const,
  detail: (id: string) => ["companies", "detail", id] as const,
};

export function useCompanies() {
  return useQuery({
    queryKey: companyKeys.list(),
    queryFn: async (): Promise<CompanyRow[]> => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CompanyRow[];
    },
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CompanyRow> & { name: string }) => {
      const { data, error } = await supabase
        .from("companies")
        .insert(input)
        .select("*")
        .single();
      if (error) throw error;
      return data as CompanyRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: companyKeys.all }),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<CompanyRow>;
    }) => {
      const { data, error } = await supabase
        .from("companies")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as CompanyRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: companyKeys.all }),
  });
}
