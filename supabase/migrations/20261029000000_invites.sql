-- Invite links (28 Oct 2026): an admin makes a link with a limit on how many people can use it and
-- when it runs out; whoever opens it makes their own login (name, username, password). Only the
-- admin function (secret key) can read or use invites — nobody signed in or out can see them.
create table public.invites (
  code text primary key check (code ~ '^[A-Za-z0-9_-]{20,64}$'),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  max_uses integer not null check (max_uses between 1 and 200),
  uses integer not null default 0 check (uses >= 0),
  active boolean not null default true
);
alter table public.invites enable row level security;
revoke all on public.invites from anon, authenticated;

-- take one place on an invite if it still has one, in a single step (two people can't both take the last)
create function public.take_invite(c text) returns boolean
  language sql security definer set search_path = '' as $$
  with taken as (
    update public.invites set uses = uses + 1
    where code = c and active and expires_at > now() and uses < max_uses
    returning 1
  )
  select exists (select 1 from taken)
$$;
revoke execute on function public.take_invite(text) from anon, authenticated, public;
grant execute on function public.take_invite(text) to service_role;
