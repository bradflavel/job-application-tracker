-- Job Application Tracker — initial schema
-- Every table has user_id + RLS. All mutation policies enforce auth.uid() = user_id.

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- =========================================================================
-- Enums
-- =========================================================================
create type app_status as enum (
  'saved', 'applied', 'screening', 'interview',
  'offer', 'accepted', 'rejected', 'withdrawn', 'ghosted'
);

create type work_mode as enum ('remote', 'hybrid', 'onsite');

create type app_source as enum (
  'linkedin', 'referral', 'indeed', 'direct',
  'recruiter', 'otta', 'wellfound', 'other'
);

create type company_size as enum (
  'seed', 'startup', 'scaleup', 'midmarket', 'enterprise'
);

create type rejection_stage as enum (
  'no_response', 'after_screen', 'after_tech', 'after_onsite',
  'after_offer', 'after_withdraw'
);

create type interview_format as enum ('phone', 'video', 'onsite');
create type interview_outcome as enum ('pending', 'passed', 'failed', 'cancelled');

create type contact_relationship as enum (
  'recruiter', 'referrer', 'interviewer', 'hiring_manager', 'other'
);

create type attachment_kind as enum (
  'resume', 'cover_letter', 'offer_letter', 'other'
);

create type offer_decision as enum (
  'pending', 'negotiating', 'accepted', 'rejected'
);

create type reminder_kind as enum (
  'follow_up', 'thank_you', 'deadline', 'custom'
);

create type email_inbox_status as enum ('new', 'linked', 'ignored');

-- =========================================================================
-- Helpers
-- =========================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_user_id()
returns trigger language plpgsql as $$
begin
  if new.user_id is null then
    new.user_id = auth.uid();
  end if;
  return new;
end;
$$;

-- =========================================================================
-- companies
-- =========================================================================
create table public.companies (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  website text,
  industry text,
  size company_size,
  stage text,
  hq_location text,
  notes_md text,
  links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index companies_user_idx on public.companies (user_id);
create index companies_name_trgm on public.companies using gin (name gin_trgm_ops);
create trigger companies_set_user before insert on public.companies
  for each row execute function public.set_user_id();
create trigger companies_set_updated before update on public.companies
  for each row execute function public.set_updated_at();

-- =========================================================================
-- applications
-- =========================================================================
create table public.applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  role_title text not null,
  status app_status not null default 'saved',
  applied_at date,
  posting_url text,
  location text,
  work_mode work_mode,
  salary_min numeric,
  salary_max numeric,
  currency text default 'USD',
  source app_source,
  source_detail text,
  priority smallint check (priority between 1 and 5),
  tags text[] not null default '{}',
  jd_snapshot_md text,
  rejection_stage rejection_stage,
  rejection_reason text,
  archived_at timestamptz,
  deleted_at timestamptz,
  notes_md text,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(role_title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(notes_md, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(jd_snapshot_md, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index applications_user_idx on public.applications (user_id);
create index applications_company_idx on public.applications (company_id);
create index applications_status_idx on public.applications (user_id, status) where archived_at is null and deleted_at is null;
create index applications_search_idx on public.applications using gin (search_vector);
create index applications_tags_idx on public.applications using gin (tags);
create trigger applications_set_user before insert on public.applications
  for each row execute function public.set_user_id();
create trigger applications_set_updated before update on public.applications
  for each row execute function public.set_updated_at();

-- Archive auto-set when status is terminal
create or replace function public.auto_archive_applications()
returns trigger language plpgsql as $$
begin
  if new.status in ('rejected', 'withdrawn', 'accepted', 'ghosted')
     and new.archived_at is null then
    new.archived_at = now();
  end if;
  if new.status not in ('rejected', 'withdrawn', 'accepted', 'ghosted')
     and old.archived_at is not null then
    new.archived_at = null;
  end if;
  return new;
end;
$$;
create trigger applications_auto_archive before update on public.applications
  for each row when (old.status is distinct from new.status)
  execute function public.auto_archive_applications();

-- =========================================================================
-- status_history
-- =========================================================================
create table public.status_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  from_status app_status,
  to_status app_status not null,
  changed_at timestamptz not null default now(),
  note text
);
create index status_history_app_idx on public.status_history (application_id, changed_at desc);
create index status_history_user_idx on public.status_history (user_id);

create or replace function public.log_status_change()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into public.status_history (user_id, application_id, from_status, to_status)
    values (new.user_id, new.id, null, new.status);
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    insert into public.status_history (user_id, application_id, from_status, to_status)
    values (new.user_id, new.id, old.status, new.status);
  end if;
  return new;
end;
$$;
create trigger applications_log_status after insert or update of status on public.applications
  for each row execute function public.log_status_change();

-- =========================================================================
-- contacts
-- =========================================================================
create table public.contacts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  name text not null,
  email text,
  phone text,
  role text,
  linkedin_url text,
  notes_md text,
  last_contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contacts_user_idx on public.contacts (user_id);
create index contacts_company_idx on public.contacts (company_id);
create trigger contacts_set_user before insert on public.contacts
  for each row execute function public.set_user_id();
create trigger contacts_set_updated before update on public.contacts
  for each row execute function public.set_updated_at();

-- Join: applications <-> contacts
create table public.application_contacts (
  application_id uuid not null references public.applications(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  relationship contact_relationship not null default 'other',
  primary key (application_id, contact_id)
);
create index application_contacts_user_idx on public.application_contacts (user_id);
create trigger application_contacts_set_user before insert on public.application_contacts
  for each row execute function public.set_user_id();

-- =========================================================================
-- interviews
-- =========================================================================
create table public.interviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  round_label text not null,
  scheduled_at timestamptz,
  duration_minutes int,
  format interview_format,
  interviewer_contact_ids uuid[] not null default '{}',
  prep_notes_md text,
  debrief_notes_md text,
  outcome interview_outcome not null default 'pending',
  gcal_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index interviews_app_idx on public.interviews (application_id, scheduled_at);
create index interviews_user_idx on public.interviews (user_id);
create trigger interviews_set_user before insert on public.interviews
  for each row execute function public.set_user_id();
create trigger interviews_set_updated before update on public.interviews
  for each row execute function public.set_updated_at();

-- =========================================================================
-- attachments
-- =========================================================================
create table public.attachments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  kind attachment_kind not null default 'other',
  storage_path text not null,
  label text,
  size_bytes bigint,
  mime_type text,
  created_at timestamptz not null default now()
);
create index attachments_app_idx on public.attachments (application_id);
create index attachments_user_idx on public.attachments (user_id);
create trigger attachments_set_user before insert on public.attachments
  for each row execute function public.set_user_id();

-- =========================================================================
-- offers
-- =========================================================================
create table public.offers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  base_salary numeric,
  bonus_target numeric,
  signing_bonus numeric,
  equity_value_annualized numeric,
  equity_details_md text,
  benefits_md text,
  currency text default 'USD',
  received_at date,
  deadline_at date,
  decision offer_decision not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  total_comp_annualized numeric generated always as (
    coalesce(base_salary, 0) +
    coalesce(bonus_target, 0) +
    coalesce(signing_bonus, 0) +
    coalesce(equity_value_annualized, 0)
  ) stored
);
create index offers_app_idx on public.offers (application_id);
create index offers_user_idx on public.offers (user_id);
create trigger offers_set_user before insert on public.offers
  for each row execute function public.set_user_id();
create trigger offers_set_updated before update on public.offers
  for each row execute function public.set_updated_at();

-- =========================================================================
-- reminders
-- =========================================================================
create table public.reminders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  kind reminder_kind not null default 'custom',
  due_at timestamptz not null,
  completed_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);
create index reminders_user_due_idx on public.reminders (user_id, due_at) where completed_at is null;
create trigger reminders_set_user before insert on public.reminders
  for each row execute function public.set_user_id();

-- Auto-create a follow-up reminder when status moves to 'applied'
create or replace function public.auto_create_followup_reminder()
returns trigger language plpgsql as $$
begin
  if new.status = 'applied' and (old.status is distinct from new.status) then
    insert into public.reminders (user_id, application_id, kind, due_at, note)
    values (new.user_id, new.id, 'follow_up', now() + interval '7 days',
            'Auto-created: follow up on application');
  end if;
  return new;
end;
$$;
create trigger applications_auto_followup after update of status on public.applications
  for each row execute function public.auto_create_followup_reminder();

-- =========================================================================
-- email_inbox
-- =========================================================================
create table public.email_inbox (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_payload jsonb not null,
  parsed_at timestamptz,
  matched_application_id uuid references public.applications(id) on delete set null,
  status email_inbox_status not null default 'new',
  created_at timestamptz not null default now()
);
create index email_inbox_user_idx on public.email_inbox (user_id, created_at desc);

-- =========================================================================
-- user_integrations (for GCal OAuth tokens, digest prefs, email alias)
-- =========================================================================
create table public.user_integrations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gcal_refresh_token text,
  gcal_access_token text,
  gcal_token_expires_at timestamptz,
  gcal_calendar_id text,
  email_alias text unique,
  digest_enabled boolean not null default true,
  digest_send_hour int not null default 8,
  digest_timezone text not null default 'UTC',
  updated_at timestamptz not null default now()
);
create trigger user_integrations_set_updated before update on public.user_integrations
  for each row execute function public.set_updated_at();

-- =========================================================================
-- Row Level Security
-- =========================================================================
alter table public.companies enable row level security;
alter table public.applications enable row level security;
alter table public.status_history enable row level security;
alter table public.contacts enable row level security;
alter table public.application_contacts enable row level security;
alter table public.interviews enable row level security;
alter table public.attachments enable row level security;
alter table public.offers enable row level security;
alter table public.reminders enable row level security;
alter table public.email_inbox enable row level security;
alter table public.user_integrations enable row level security;

-- Generic per-user policies
create policy "companies_owner" on public.companies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "applications_owner" on public.applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "status_history_owner" on public.status_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "contacts_owner" on public.contacts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "application_contacts_owner" on public.application_contacts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "interviews_owner" on public.interviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "attachments_owner" on public.attachments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "offers_owner" on public.offers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reminders_owner" on public.reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "email_inbox_owner" on public.email_inbox
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_integrations_owner" on public.user_integrations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
