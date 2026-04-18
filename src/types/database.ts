// Types matching supabase/migrations/0001_init.sql.
// Regenerate with `supabase gen types typescript --local > src/types/database.ts`
// once you've pointed at a real project; until then this is hand-maintained.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppStatus =
  | "saved"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "ghosted";

export type WorkMode = "remote" | "hybrid" | "onsite";

export type AppSource =
  | "linkedin"
  | "referral"
  | "indeed"
  | "direct"
  | "recruiter"
  | "otta"
  | "wellfound"
  | "other";

export type CompanySize =
  | "seed"
  | "startup"
  | "scaleup"
  | "midmarket"
  | "enterprise";

export type RejectionStage =
  | "no_response"
  | "after_screen"
  | "after_tech"
  | "after_onsite"
  | "after_offer"
  | "after_withdraw";

export type InterviewFormat = "phone" | "video" | "onsite";
export type InterviewOutcome = "pending" | "passed" | "failed" | "cancelled";

export type ContactRelationship =
  | "recruiter"
  | "referrer"
  | "interviewer"
  | "hiring_manager"
  | "other";

export type AttachmentKind = "resume" | "cover_letter" | "offer_letter" | "other";
export type OfferDecision = "pending" | "negotiating" | "accepted" | "rejected";
export type ReminderKind = "follow_up" | "thank_you" | "deadline" | "custom";
export type EmailInboxStatus = "new" | "linked" | "ignored";

type Row<T> = { Row: T; Insert: Partial<T>; Update: Partial<T>; Relationships: [] };

export interface CompanyRow {
  id: string;
  user_id: string;
  name: string;
  website: string | null;
  industry: string | null;
  size: CompanySize | null;
  stage: string | null;
  hq_location: string | null;
  notes_md: string | null;
  links: Json;
  created_at: string;
  updated_at: string;
}

export interface ApplicationRow {
  id: string;
  user_id: string;
  company_id: string | null;
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
  jd_snapshot_md: string | null;
  rejection_stage: RejectionStage | null;
  rejection_reason: string | null;
  archived_at: string | null;
  deleted_at: string | null;
  notes_md: string | null;
  created_at: string;
  updated_at: string;
}

export interface StatusHistoryRow {
  id: string;
  user_id: string;
  application_id: string;
  from_status: AppStatus | null;
  to_status: AppStatus;
  changed_at: string;
  note: string | null;
}

export interface ContactRow {
  id: string;
  user_id: string;
  company_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  linkedin_url: string | null;
  notes_md: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationContactRow {
  application_id: string;
  contact_id: string;
  user_id: string;
  relationship: ContactRelationship;
}

export interface InterviewRow {
  id: string;
  user_id: string;
  application_id: string;
  round_label: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  format: InterviewFormat | null;
  interviewer_contact_ids: string[];
  prep_notes_md: string | null;
  debrief_notes_md: string | null;
  outcome: InterviewOutcome;
  gcal_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttachmentRow {
  id: string;
  user_id: string;
  application_id: string;
  kind: AttachmentKind;
  storage_path: string;
  label: string | null;
  size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
}

export interface OfferRow {
  id: string;
  user_id: string;
  application_id: string;
  base_salary: number | null;
  bonus_target: number | null;
  signing_bonus: number | null;
  equity_value_annualized: number | null;
  equity_details_md: string | null;
  benefits_md: string | null;
  currency: string | null;
  received_at: string | null;
  deadline_at: string | null;
  decision: OfferDecision;
  total_comp_annualized: number | null;
  created_at: string;
  updated_at: string;
}

export interface ReminderRow {
  id: string;
  user_id: string;
  application_id: string | null;
  kind: ReminderKind;
  due_at: string;
  completed_at: string | null;
  note: string | null;
  created_at: string;
}

export interface EmailInboxRow {
  id: string;
  user_id: string;
  raw_payload: Json;
  parsed_at: string | null;
  matched_application_id: string | null;
  status: EmailInboxStatus;
  created_at: string;
}

export interface UserIntegrationsRow {
  user_id: string;
  gcal_refresh_token: string | null;
  gcal_access_token: string | null;
  gcal_token_expires_at: string | null;
  gcal_calendar_id: string | null;
  email_alias: string | null;
  digest_enabled: boolean;
  digest_send_hour: number;
  digest_timezone: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      companies: Row<CompanyRow>;
      applications: Row<ApplicationRow>;
      status_history: Row<StatusHistoryRow>;
      contacts: Row<ContactRow>;
      application_contacts: Row<ApplicationContactRow>;
      interviews: Row<InterviewRow>;
      attachments: Row<AttachmentRow>;
      offers: Row<OfferRow>;
      reminders: Row<ReminderRow>;
      email_inbox: Row<EmailInboxRow>;
      user_integrations: Row<UserIntegrationsRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_status: AppStatus;
      work_mode: WorkMode;
      app_source: AppSource;
      company_size: CompanySize;
      rejection_stage: RejectionStage;
      interview_format: InterviewFormat;
      interview_outcome: InterviewOutcome;
      contact_relationship: ContactRelationship;
      attachment_kind: AttachmentKind;
      offer_decision: OfferDecision;
      reminder_kind: ReminderKind;
      email_inbox_status: EmailInboxStatus;
    };
  };
};
