-- Phone reminders (web push). Each phone or computer that turns reminders on keeps its push
-- subscription here, with the hour chosen (7am–7pm, so nothing arrives after 8pm) and its time zone. People see and
-- change only their own; the reminder function reads them all with the secret key.
create table public.push_subscriptions (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null check (endpoint like 'https://%' and length(endpoint) < 1000),
  p256dh text not null check (length(p256dh) < 200),
  auth text not null check (length(auth) < 100),
  hour smallint not null default 17 check (hour between 7 and 19),
  tz text not null default 'Europe/London' check (length(tz) < 64),
  last_sent date,
  created_at timestamptz not null default now(),
  primary key (user_id, endpoint)
);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon;
create policy "see your own devices" on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
create policy "add your own devices" on public.push_subscriptions for insert to authenticated with check (user_id = auth.uid() and public.is_member());
create policy "change your own devices" on public.push_subscriptions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_member());
create policy "remove your own devices" on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());
