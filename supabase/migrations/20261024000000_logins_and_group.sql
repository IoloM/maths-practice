-- Maths Practice on Supabase: logins made by an admin, each person's saved progress (so it follows
-- them to any device), and the study group (what members can see of each other, and work an admin
-- sets for everyone).
--
-- Usernames sign in through Supabase Auth with a made-up address, <username>@login.invalid
-- (.invalid can never be a real domain, and no email is ever sent). Public sign-up is off: only the
-- admin function (supabase/functions/admin) makes logins.

-- ---------------------------------------------------------------- people
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9]([a-z0-9._-]{0,30}[a-z0-9])?$'),
  name text not null check (char_length(name) between 1 and 60),
  admin boolean not null default false,
  -- made with a temporary password: choose your own at first sign-in
  must_change boolean not null default true,
  disabled boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen timestamptz
);

-- ---------------------------------------------------------------- each person's progress
-- The app's whole snapshot (attempts, review cards, mocks, settings), compressed. The version makes
-- two devices merge instead of overwriting each other (see save_progress).
create table public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  v integer not null,
  data text not null check (char_length(data) <= 2000000),
  updated_at timestamptz not null default now()
);

-- What the study group sees of each member: totals, this week, streak. Written by their own app.
create table public.stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  summary jsonb not null default '{}' check (pg_column_size(summary) < 8000),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- work set for the group
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  -- the questions: [{ "templateId": "...", "seed": 1 }, ...]
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 60),
  duration_min integer not null check (duration_min between 1 and 600),
  due date,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.assignment_results (
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  got integer not null check (got >= 0),
  "of" integer not null check ("of" > 0 and got <= "of"),
  finished_at timestamptz not null default now(),
  primary key (assignment_id, user_id)
);

-- ---------------------------------------------------------------- who may do what
create function public.is_member() returns boolean
  language sql stable security definer set search_path = '' as $$
  select coalesce((select not p.disabled from public.profiles p where p.id = auth.uid()), false)
$$;

create function public.is_admin() returns boolean
  language sql stable security definer set search_path = '' as $$
  select coalesce((select p.admin and not p.disabled from public.profiles p where p.id = auth.uid()), false)
$$;

alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.stats enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_results enable row level security;

-- nobody signed out sees anything
revoke all on public.profiles, public.progress, public.stats, public.assignments, public.assignment_results from anon;

-- profiles: members see each other's names; you may change only your own name and flags below.
-- Making, removing and promoting logins happens in the admin function, with the service role.
create policy "members see the group" on public.profiles for select to authenticated using (public.is_member());
create policy "change your own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke insert, update, delete on public.profiles from authenticated;
grant update (name, must_change, last_seen) on public.profiles to authenticated;

-- progress: only your own
create policy "your own progress" on public.progress for all to authenticated
  using (user_id = auth.uid() and public.is_member()) with check (user_id = auth.uid() and public.is_member());

-- stats: the group reads; you write your own
create policy "members see stats" on public.stats for select to authenticated using (public.is_member());
create policy "write your own stats" on public.stats for insert to authenticated with check (user_id = auth.uid() and public.is_member());
create policy "update your own stats" on public.stats for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_member());

-- assignments: members read; admins set, change and remove them
create policy "members see set work" on public.assignments for select to authenticated using (public.is_member());
create policy "admins set work" on public.assignments for insert to authenticated with check (public.is_admin() and created_by = auth.uid());
create policy "admins change work" on public.assignments for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins remove work" on public.assignments for delete to authenticated using (public.is_admin());

-- results: the group sees who has done what; you hand in your own
create policy "members see results" on public.assignment_results for select to authenticated using (public.is_member());
create policy "hand in your own" on public.assignment_results for insert to authenticated with check (user_id = auth.uid() and public.is_member());
create policy "redo your own" on public.assignment_results for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_member());

-- ---------------------------------------------------------------- saving progress
-- Save the snapshot if nobody else saved since `base` (0 = first save). Returns the new version,
-- or -1 when another device got there first (the app then pulls, merges and tries again).
create function public.save_progress(base integer, payload text, summary jsonb)
  returns integer language plpgsql security invoker set search_path = '' as $$
declare
  uid uuid := auth.uid();
  nv integer;
begin
  if uid is null or not public.is_member() then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if base = 0 then
    insert into public.progress (user_id, v, data) values (uid, 1, payload)
      on conflict (user_id) do nothing
      returning v into nv;
  else
    update public.progress set v = v + 1, data = payload, updated_at = now()
      where user_id = uid and v = base
      returning v into nv;
  end if;
  if nv is null then
    return -1;
  end if;
  insert into public.stats (user_id, summary, updated_at) values (uid, coalesce(summary, '{}'), now())
    on conflict (user_id) do update set summary = excluded.summary, updated_at = now();
  update public.profiles set last_seen = now() where id = uid;
  return nv;
end
$$;

revoke execute on function public.save_progress(integer, text, jsonb) from anon, public;
grant execute on function public.save_progress(integer, text, jsonb) to authenticated;

-- A cheap call the keep-alive job makes so the free project isn't paused for inactivity.
create function public.ping() returns text language sql stable as $$ select 'ok' $$;
grant execute on function public.ping() to anon, authenticated;
