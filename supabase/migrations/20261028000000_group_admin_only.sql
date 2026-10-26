-- The leaderboard and the study group are for admins only (26 Oct 2026). Members see their own
-- profile, stats and set-work results, and the work set for them — nobody else's.
drop policy "members see the group" on public.profiles;
create policy "your own profile, or everyone's for admins" on public.profiles for select to authenticated
  using ((id = auth.uid() and public.is_member()) or public.is_admin());

drop policy "members see stats" on public.stats;
create policy "your own stats, or everyone's for admins" on public.stats for select to authenticated
  using ((user_id = auth.uid() and public.is_member()) or public.is_admin());

drop policy "members see results" on public.assignment_results;
create policy "your own results, or everyone's for admins" on public.assignment_results for select to authenticated
  using ((user_id = auth.uid() and public.is_member()) or public.is_admin());
