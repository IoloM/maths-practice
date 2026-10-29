-- Usernames keep their capitals for showing (invite links make them as first name + surname
-- initial, e.g. IoloM), but signing in ignores case: <username>@login.invalid is always lower case.
-- So they must be unique ignoring case, and are looked up by username_key.
alter table public.profiles drop constraint profiles_username_check;
alter table public.profiles add constraint profiles_username_check check (username ~ '^[A-Za-z0-9]([A-Za-z0-9._-]{0,30}[A-Za-z0-9])?$');
alter table public.profiles add column username_key text generated always as (lower(username)) stored;
create unique index profiles_username_key_unique on public.profiles (username_key);
