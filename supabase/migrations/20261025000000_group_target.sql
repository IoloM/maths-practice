-- A weekly target an admin sets for the whole group: how many questions each person aims for.
-- One row (id = 1). Everyone in the group can see it; only admins set, change or clear it.
create table public.group_target (
  id smallint primary key default 1 check (id = 1),
  weekly_questions integer not null check (weekly_questions between 1 and 1000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
alter table public.group_target enable row level security;
revoke all on public.group_target from anon;
create policy "members see the target" on public.group_target for select to authenticated using (public.is_member());
create policy "admins set the target" on public.group_target for insert to authenticated with check (public.is_admin());
create policy "admins change the target" on public.group_target for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins clear the target" on public.group_target for delete to authenticated using (public.is_admin());
