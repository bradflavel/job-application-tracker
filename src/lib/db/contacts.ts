import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  ContactRelationship,
  ContactRow,
} from "@/types/database";

export type ContactWithCompany = ContactRow & {
  company: { id: string; name: string } | null;
};

export type LinkedContact = ContactWithCompany & {
  relationship: ContactRelationship;
};

export const contactKeys = {
  all: ["contacts"] as const,
  list: () => ["contacts", "list"] as const,
  detail: (id: string) => ["contacts", "detail", id] as const,
  forApplication: (id: string) =>
    ["contacts", "for-application", id] as const,
  applicationsFor: (id: string) =>
    ["contacts", "applications-for", id] as const,
};

export function useContacts() {
  return useQuery({
    queryKey: contactKeys.list(),
    queryFn: async (): Promise<ContactWithCompany[]> => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*, company:companies(id,name)")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ContactWithCompany[];
    },
  });
}

export function useContact(id: string | undefined) {
  return useQuery({
    queryKey: id ? contactKeys.detail(id) : ["contacts", "detail", "none"],
    enabled: !!id,
    queryFn: async (): Promise<ContactWithCompany | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("contacts")
        .select("*, company:companies(id,name)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as ContactWithCompany | null;
    },
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ContactRow> & { name: string }) => {
      const { data, error } = await supabase
        .from("contacts")
        .insert(input)
        .select("*")
        .single();
      if (error) throw error;
      return data as ContactRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: contactKeys.all }),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<ContactRow>;
    }) => {
      const { data, error } = await supabase
        .from("contacts")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as ContactRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: contactKeys.all });
      qc.invalidateQueries({ queryKey: contactKeys.detail(row.id) });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: contactKeys.all }),
  });
}

export function useContactsForApplication(applicationId: string | undefined) {
  return useQuery({
    queryKey: applicationId
      ? contactKeys.forApplication(applicationId)
      : ["contacts", "for-application", "none"],
    enabled: !!applicationId,
    queryFn: async (): Promise<LinkedContact[]> => {
      if (!applicationId) return [];
      const { data, error } = await supabase
        .from("application_contacts")
        .select(
          "relationship, contact:contacts(*, company:companies(id,name))",
        )
        .eq("application_id", applicationId);
      if (error) throw error;
      return (data ?? []).flatMap((row) => {
        const c = row.contact as unknown as ContactWithCompany | null;
        if (!c) return [];
        return [{ ...c, relationship: row.relationship as ContactRelationship }];
      });
    },
  });
}

export function useApplicationsForContact(contactId: string | undefined) {
  return useQuery({
    queryKey: contactId
      ? contactKeys.applicationsFor(contactId)
      : ["contacts", "applications-for", "none"],
    enabled: !!contactId,
    queryFn: async () => {
      if (!contactId) return [];
      const { data, error } = await supabase
        .from("application_contacts")
        .select(
          "relationship, application:applications(id, role_title, status, archived_at, company:companies(name))",
        )
        .eq("contact_id", contactId);
      if (error) throw error;
      return (data ?? []).flatMap((row) => {
        const a = row.application as unknown as
          | {
              id: string;
              role_title: string;
              status: string;
              archived_at: string | null;
              company: { name: string } | null;
            }
          | null;
        if (!a) return [];
        return [{ ...a, relationship: row.relationship as ContactRelationship }];
      });
    },
  });
}

export function useLinkContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      applicationId,
      contactId,
      relationship,
    }: {
      applicationId: string;
      contactId: string;
      relationship: ContactRelationship;
    }) => {
      const { error } = await supabase
        .from("application_contacts")
        .insert({
          application_id: applicationId,
          contact_id: contactId,
          relationship,
        });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: contactKeys.forApplication(vars.applicationId),
      });
      qc.invalidateQueries({
        queryKey: contactKeys.applicationsFor(vars.contactId),
      });
    },
  });
}

export function useUnlinkContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      applicationId,
      contactId,
    }: {
      applicationId: string;
      contactId: string;
    }) => {
      const { error } = await supabase
        .from("application_contacts")
        .delete()
        .eq("application_id", applicationId)
        .eq("contact_id", contactId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: contactKeys.forApplication(vars.applicationId),
      });
      qc.invalidateQueries({
        queryKey: contactKeys.applicationsFor(vars.contactId),
      });
    },
  });
}
