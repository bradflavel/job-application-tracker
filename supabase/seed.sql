-- Seed sample data for local dev. Replace <USER_ID> with your auth user id before running,
-- or apply it after logging in and capturing auth.uid().
-- Usage: psql $DATABASE_URL -v user_id="'00000000-0000-0000-0000-000000000000'" -f seed.sql

\set user_id :user_id

insert into public.companies (user_id, name, website, industry, size, hq_location, notes_md)
values
  (:user_id, 'Acme Corp', 'https://acme.example', 'SaaS', 'scaleup', 'San Francisco, CA', '# Notes\n- Series C, ~500 people.'),
  (:user_id, 'Globex', 'https://globex.example', 'Fintech', 'enterprise', 'New York, NY', null),
  (:user_id, 'Initech', 'https://initech.example', 'Consulting', 'midmarket', 'Austin, TX', null);

insert into public.applications
  (user_id, company_id, role_title, status, applied_at, posting_url, location, work_mode, salary_min, salary_max, source, priority, tags)
select
  :user_id, c.id, 'Senior Software Engineer', 'applied', now()::date - 5,
  'https://jobs.example/1', 'Remote', 'remote', 150000, 200000, 'linkedin', 4, array['backend','python']
from public.companies c where c.name = 'Acme Corp' and c.user_id = :user_id;

insert into public.applications
  (user_id, company_id, role_title, status, applied_at, work_mode, source, priority, tags)
select
  :user_id, c.id, 'Staff Engineer', 'interview', now()::date - 14, 'hybrid', 'referral', 5, array['platform']
from public.companies c where c.name = 'Globex' and c.user_id = :user_id;

insert into public.applications
  (user_id, company_id, role_title, status, applied_at, work_mode, source, priority)
select
  :user_id, c.id, 'Backend Engineer', 'rejected', now()::date - 30, 'onsite', 'indeed', 2
from public.companies c where c.name = 'Initech' and c.user_id = :user_id;
