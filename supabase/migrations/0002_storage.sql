-- Storage bucket for attachments. Files stored under <user_id>/<application_id>/<filename>.

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- Read own files
create policy "attachments_read_own" on storage.objects
  for select using (
    bucket_id = 'attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Upload to own folder
create policy "attachments_write_own" on storage.objects
  for insert with check (
    bucket_id = 'attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Update own files
create policy "attachments_update_own" on storage.objects
  for update using (
    bucket_id = 'attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Delete own files
create policy "attachments_delete_own" on storage.objects
  for delete using (
    bucket_id = 'attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
