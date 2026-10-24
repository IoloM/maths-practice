-- Keeping everyone's work safe, and letting admins see what people are working on.

-- ---------------------------------------------------------------- save history
-- Every save is kept (the last 20 per person), so a bad save can always be undone
-- (supabase/scripts/restore.mjs). Only the owner's scripts (secret key) can read it.
create table public.progress_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  v integer not null,
  data text not null,
  saved_at timestamptz not null default now()
);
create index progress_history_by_user on public.progress_history (user_id, id desc);
alter table public.progress_history enable row level security;
revoke all on public.progress_history from anon, authenticated;

create function public.keep_progress_history() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  insert into public.progress_history (user_id, v, data) values (new.user_id, new.v, new.data);
  delete from public.progress_history h
    where h.user_id = new.user_id
      and h.id not in (select x.id from public.progress_history x where x.user_id = new.user_id order by x.id desc limit 20);
  return new;
end
$$;
revoke execute on function public.keep_progress_history() from anon, authenticated, public;

create trigger keep_progress_history after insert or update of data on public.progress
  for each row execute function public.keep_progress_history();

-- ---------------------------------------------------------------- what each person is working on
-- Written by each person's app when it saves: recent questions, chapters, past papers, mocks.
-- They see their own; admins see everyone's (Manage logins). Other members don't.
create table public.activity (
  user_id uuid primary key references auth.users (id) on delete cascade,
  detail jsonb not null default '{}' check (pg_column_size(detail) < 200000),
  updated_at timestamptz not null default now()
);
alter table public.activity enable row level security;
revoke all on public.activity from anon;
create policy "your own, or everyone's for admins" on public.activity for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "write your own activity" on public.activity for insert to authenticated with check (user_id = auth.uid() and public.is_member());
create policy "update your own activity" on public.activity for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_member());
