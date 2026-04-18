import { parseCSV, serializeCSV } from "./csv";
import type {
  AppSource,
  AppStatus,
  ApplicationRow,
  CompanyRow,
  WorkMode,
} from "@/types/database";

const APP_STATUSES: AppStatus[] = [
  "saved",
  "applied",
  "screening",
  "interview",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
  "ghosted",
];
const WORK_MODES: WorkMode[] = ["remote", "hybrid", "onsite"];
const SOURCES: AppSource[] = [
  "linkedin",
  "referral",
  "indeed",
  "direct",
  "recruiter",
  "otta",
  "wellfound",
  "other",
];

export const APPLICATION_CSV_HEADERS = [
  "company",
  "role_title",
  "status",
  "applied_at",
  "posting_url",
  "location",
  "work_mode",
  "salary_min",
  "salary_max",
  "currency",
  "source",
  "source_detail",
  "priority",
  "tags",
  "rejection_stage",
  "rejection_reason",
  "notes_md",
  "jd_snapshot_md",
] as const;

type Header = (typeof APPLICATION_CSV_HEADERS)[number];

export type ApplicationCSVExportRow = ApplicationRow & {
  company: { id: string; name: string } | null;
};

export function exportApplicationsToCSV(
  rows: ApplicationCSVExportRow[],
): string {
  const headers: Header[] = [...APPLICATION_CSV_HEADERS];
  const out: (string | number | null)[][] = [headers as unknown as string[]];
  for (const r of rows) {
    out.push([
      r.company?.name ?? "",
      r.role_title,
      r.status,
      r.applied_at ?? "",
      r.posting_url ?? "",
      r.location ?? "",
      r.work_mode ?? "",
      r.salary_min ?? "",
      r.salary_max ?? "",
      r.currency ?? "",
      r.source ?? "",
      r.source_detail ?? "",
      r.priority ?? "",
      r.tags.join("|"),
      r.rejection_stage ?? "",
      r.rejection_reason ?? "",
      r.notes_md ?? "",
      r.jd_snapshot_md ?? "",
    ]);
  }
  return serializeCSV(out);
}

export type ParsedImport = {
  header: string[];
  unknownColumns: string[];
  rows: ParsedApplication[];
  errors: { rowIndex: number; message: string }[];
};

export type ParsedApplication = {
  rowIndex: number; // original CSV row number (1-based, excl. header)
  company_name: string | null;
  role_title: string;
  status: AppStatus;
  applied_at: string | null;
  posting_url: string | null;
  location: string | null;
  work_mode: WorkMode | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  source: AppSource | null;
  source_detail: string | null;
  priority: number | null;
  tags: string[];
  rejection_stage: string | null;
  rejection_reason: string | null;
  notes_md: string | null;
  jd_snapshot_md: string | null;
};

const HEADER_ALIASES: Record<string, Header> = {
  company: "company",
  "company name": "company",
  role: "role_title",
  title: "role_title",
  position: "role_title",
  role_title: "role_title",
  status: "status",
  applied: "applied_at",
  "date applied": "applied_at",
  applied_at: "applied_at",
  url: "posting_url",
  link: "posting_url",
  posting_url: "posting_url",
  location: "location",
  "work mode": "work_mode",
  work_mode: "work_mode",
  mode: "work_mode",
  "salary min": "salary_min",
  salary_min: "salary_min",
  min: "salary_min",
  "salary max": "salary_max",
  salary_max: "salary_max",
  max: "salary_max",
  currency: "currency",
  source: "source",
  source_detail: "source_detail",
  "source detail": "source_detail",
  priority: "priority",
  tags: "tags",
  rejection_stage: "rejection_stage",
  "rejection stage": "rejection_stage",
  rejection_reason: "rejection_reason",
  "rejection reason": "rejection_reason",
  notes: "notes_md",
  notes_md: "notes_md",
  jd: "jd_snapshot_md",
  "job description": "jd_snapshot_md",
  jd_snapshot_md: "jd_snapshot_md",
};

function normHeader(h: string): Header | null {
  const key = h.trim().toLowerCase();
  return HEADER_ALIASES[key] ?? null;
}

function parseInt0(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseDate(v: string): string | null {
  if (!v.trim()) return null;
  // Accept YYYY-MM-DD or parseable date strings
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  // Return as YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

function parseEnum<T extends string>(v: string, allowed: readonly T[]): T | null {
  const key = v.trim().toLowerCase();
  if (!key) return null;
  return (allowed.find((a) => a.toLowerCase() === key) ?? null) as T | null;
}

export function parseApplicationsCSV(text: string): ParsedImport {
  const grid = parseCSV(text);
  if (grid.length === 0) {
    return { header: [], unknownColumns: [], rows: [], errors: [{ rowIndex: 0, message: "File is empty" }] };
  }
  const headerRow = grid[0];
  const mapping: (Header | null)[] = headerRow.map(normHeader);
  const unknown = headerRow.filter((_, i) => !mapping[i]);

  const byHeader = (row: string[], h: Header): string => {
    const idx = mapping.indexOf(h);
    return idx >= 0 ? (row[idx] ?? "").trim() : "";
  };

  const rows: ParsedApplication[] = [];
  const errors: { rowIndex: number; message: string }[] = [];

  for (let i = 1; i < grid.length; i++) {
    const row = grid[i];
    if (row.every((c) => !c.trim())) continue;

    const role = byHeader(row, "role_title");
    if (!role) {
      errors.push({ rowIndex: i, message: "Missing role_title — row skipped" });
      continue;
    }

    const statusRaw = byHeader(row, "status");
    const status =
      parseEnum<AppStatus>(statusRaw || "saved", APP_STATUSES) ?? "saved";

    const tagsRaw = byHeader(row, "tags");
    const tags = tagsRaw
      .split(/[|,;]/)
      .map((t) => t.trim())
      .filter(Boolean);

    rows.push({
      rowIndex: i,
      company_name: byHeader(row, "company") || null,
      role_title: role,
      status,
      applied_at: parseDate(byHeader(row, "applied_at")),
      posting_url: byHeader(row, "posting_url") || null,
      location: byHeader(row, "location") || null,
      work_mode: parseEnum<WorkMode>(byHeader(row, "work_mode"), WORK_MODES),
      salary_min: parseInt0(byHeader(row, "salary_min")),
      salary_max: parseInt0(byHeader(row, "salary_max")),
      currency: byHeader(row, "currency") || null,
      source: parseEnum<AppSource>(byHeader(row, "source"), SOURCES),
      source_detail: byHeader(row, "source_detail") || null,
      priority: parseInt0(byHeader(row, "priority")),
      tags,
      rejection_stage: byHeader(row, "rejection_stage") || null,
      rejection_reason: byHeader(row, "rejection_reason") || null,
      notes_md: byHeader(row, "notes_md") || null,
      jd_snapshot_md: byHeader(row, "jd_snapshot_md") || null,
    });
  }

  return { header: headerRow, unknownColumns: unknown, rows, errors };
}

export type CompanyLookup = Pick<CompanyRow, "id" | "name">;

export function applicationFromParsed(
  p: ParsedApplication,
  companyId: string | null,
): Partial<ApplicationRow> & { role_title: string; status: AppStatus } {
  return {
    company_id: companyId,
    role_title: p.role_title,
    status: p.status,
    applied_at: p.applied_at,
    posting_url: p.posting_url,
    location: p.location,
    work_mode: p.work_mode,
    salary_min: p.salary_min,
    salary_max: p.salary_max,
    currency: p.currency,
    source: p.source,
    source_detail: p.source_detail,
    priority: p.priority,
    tags: p.tags,
    rejection_stage: (p.rejection_stage as ApplicationRow["rejection_stage"]) ?? null,
    rejection_reason: p.rejection_reason,
    notes_md: p.notes_md,
    jd_snapshot_md: p.jd_snapshot_md,
  };
}
