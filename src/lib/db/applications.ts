import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ApplicationRow, AppStatus } from "@/types/database";

export type ApplicationWithCompany = ApplicationRow & {
  company: { id: string; name: string } | null;
};

export type ApplicationFilters = {
  search?: string;
  statuses?: AppStatus[];
  tags?: string[];
  companyId?: string;
  archived?: boolean;
  source?: string;
};

export const appKeys = {
  all: ["applications"] as const,
  list: (f: ApplicationFilters) => ["applications", "list", f] as const,
  detail: (id: string) => ["applications", "detail", id] as const,
};

export function useApplications(filters: ApplicationFilters = {}) {
  return useQuery({
    queryKey: appKeys.list(filters),
    queryFn: async (): Promise<ApplicationWithCompany[]> => {
      let q = supabase
        .from("applications")
        .select("*, company:companies(id,name)")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false });

      if (filters.archived) {
        q = q.not("archived_at", "is", null);
      } else {
        q = q.is("archived_at", null);
      }
      if (filters.statuses?.length) {
        q = q.in("status", filters.statuses);
      }
      if (filters.companyId) {
        q = q.eq("company_id", filters.companyId);
      }
      if (filters.source) {
        q = q.eq("source", filters.source);
      }
      if (filters.tags?.length) {
        q = q.contains("tags", filters.tags);
      }
      if (filters.search) {
        q = q.textSearch("search_vector", filters.search, {
          type: "websearch",
        });
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ApplicationWithCompany[];
    },
  });
}

export function useApplication(id: string | undefined) {
  return useQuery({
    queryKey: id ? appKeys.detail(id) : ["applications", "detail", "none"],
    enabled: !!id,
    queryFn: async (): Promise<ApplicationWithCompany | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("applications")
        .select("*, company:companies(id,name)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as ApplicationWithCompany | null;
    },
  });
}

type UpsertInput = Partial<ApplicationRow> & {
  role_title: string;
  status: AppStatus;
};

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertInput) => {
      const { data, error } = await supabase
        .from("applications")
        .insert(input)
        .select("*")
        .single();
      if (error) throw error;
      return data as ApplicationRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: appKeys.all }),
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<ApplicationRow>;
    }) => {
      const { data, error } = await supabase
        .from("applications")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as ApplicationRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: appKeys.all });
      qc.invalidateQueries({ queryKey: appKeys.detail(row.id) });
    },
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppStatus }) => {
      const { error } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: appKeys.all });
      const snapshots = qc
        .getQueriesData<ApplicationWithCompany[]>({ queryKey: appKeys.all })
        .map(([key, data]) => {
          qc.setQueryData<ApplicationWithCompany[]>(
            key,
            data?.map((a) => (a.id === id ? { ...a, status } : a)),
          );
          return [key, data] as const;
        });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: appKeys.all }),
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("applications")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: appKeys.all }),
  });
}

export function useArchiveApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      const { error } = await supabase
        .from("applications")
        .update({ archived_at: archive ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: appKeys.all }),
  });
}

export function useBulkUpdateApplications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ids,
      patch,
    }: {
      ids: string[];
      patch: Partial<ApplicationRow>;
    }) => {
      const { error } = await supabase
        .from("applications")
        .update(patch)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: appKeys.all }),
  });
}
