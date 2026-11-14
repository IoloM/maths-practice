-- Mr Astbury's booklets (his A Level Exam Qs Series – Pure and the worked solutions), which he gave
-- for this site: kept in a private storage bucket that only signed-in people can read. Uploaded by
-- the admin with the secret key; the app downloads them once per device (src/lib/booklet-cloud.ts).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('booklets', 'booklets', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

create policy "signed-in people can read the booklets"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'booklets');
