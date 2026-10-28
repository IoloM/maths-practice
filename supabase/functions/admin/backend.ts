/** The admin function's `Backend` on Supabase: Auth's admin API and the profiles table, with the secret key. */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Backend, InviteRow, ProfileRow } from './handler.ts';

function check<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

export function supabaseBackend(sb: SupabaseClient): Backend {
  return {
    async userFromToken(token) {
      const { data, error } = await sb.auth.getUser(token);
      return error ? null : (data.user?.id ?? null);
    },
    async profile(id) {
      return check(await sb.from('profiles').select('id, username, admin, disabled, must_change').eq('id', id).maybeSingle<ProfileRow>());
    },
    async profileByUsername(username) {
      return check(await sb.from('profiles').select('id, username, admin, disabled, must_change').eq('username', username).maybeSingle<ProfileRow>());
    },
    async usernameTaken(username) {
      return !!check(await sb.from('profiles').select('id').eq('username', username).maybeSingle());
    },
    async createAuthUser(email, password, meta) {
      const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: meta });
      if (error || !data.user) throw new Error(error?.message ?? 'Could not make the login');
      return data.user.id;
    },
    async deleteAuthUser(id) {
      const { error } = await sb.auth.admin.deleteUser(id);
      if (error) throw new Error(error.message);
    },
    async setPassword(id, password) {
      const { error } = await sb.auth.admin.updateUserById(id, { password });
      if (error) throw new Error(error.message);
    },
    async setBanned(id, banned) {
      // about 100 years, or lifted
      const { error } = await sb.auth.admin.updateUserById(id, { ban_duration: banned ? '876000h' : 'none' });
      if (error) throw new Error(error.message);
    },
    async insertProfile(p) {
      check(await sb.from('profiles').insert(p));
    },
    async updateProfile(id, patch) {
      check(await sb.from('profiles').update(patch).eq('id', id));
    },
    async createInvite(inv) {
      check(await sb.from('invites').insert(inv));
    },
    async listInvites() {
      const since = new Date(Date.now() - 60 * 86_400_000).toISOString();
      return check(await sb.from('invites').select('code, created_at, expires_at, max_uses, uses, active').gte('created_at', since).order('created_at', { ascending: false }).returns<InviteRow[]>()) ?? [];
    },
    async getInvite(code) {
      if (!code) return null;
      return check(await sb.from('invites').select('code, created_at, expires_at, max_uses, uses, active').eq('code', code).maybeSingle<InviteRow>());
    },
    async takeInvite(code) {
      return check(await sb.rpc('take_invite', { c: code })) === true;
    },
    async stopInvite(code) {
      check(await sb.from('invites').update({ active: false }).eq('code', code));
    },
  };
}
