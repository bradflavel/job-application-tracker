import { supabase } from "@/lib/supabase";

export type BackupPayload = {
  schema_version: 1;
  exported_at: string;
  counts: Record<string, number>;
  companies: unknown[];
  applications: unknown[];
  status_history: unknown[];
  contacts: unknown[];
  application_contacts: unknown[];
  interviews: unknown[];
  attachments: unknown[];
  offers: unknown[];
  reminders: unknown[];
  // Intentionally excludes user_integrations (oauth tokens) and email_inbox
  // (large raw payloads). Storage objects themselves are NOT included —
  // attachment rows reference their storage paths only.
};

const TABLES = [
  "companies",
  "applications",
  "status_history",
  "contacts",
  "application_contacts",
  "interviews",
  "attachments",
  "offers",
  "reminders",
] as const;

export async function exportBackup(): Promise<BackupPayload> {
  const results = await Promise.all(
    TABLES.map(async (t) => {
      const { data, error } = await supabase.from(t).select("*");
      if (error) throw new Error(`${t}: ${error.message}`);
      return [t, data ?? []] as const;
    }),
  );
  const counts: Record<string, number> = {};
  const bundle: Partial<BackupPayload> = {};
  for (const [name, rows] of results) {
    counts[name] = rows.length;
    (bundle as Record<string, unknown[]>)[name] = rows;
  }
  return {
    schema_version: 1,
    exported_at: new Date().toISOString(),
    counts,
    ...(bundle as Pick<
      BackupPayload,
      | "companies"
      | "applications"
      | "status_history"
      | "contacts"
      | "application_contacts"
      | "interviews"
      | "attachments"
      | "offers"
      | "reminders"
    >),
  };
}
