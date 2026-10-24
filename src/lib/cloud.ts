/**
 * Logins and saved progress on Supabase (supabase/), so they work on every device. The app holds
 * only the publishable key, which is safe to expose: the database's security rules decide what
 * each signed-in person may read and write. Making and managing logins goes through the admin
 * function, which alone has the secret key.
 *
 * Who is signed in is cached (`mp.cloud.me`) so the app can open the right person's local copy of
 * their progress straight away, before the Supabase client has loaded.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActivityDetail as ActivitySummary } from './activity';

export type { ActivitySummary };

const URL_ = ((import.meta.env?.VITE_SUPABASE_URL as string | undefined) ?? '').trim().replace(/\/+$/, '');
const KEY = ((import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? '').trim();
/** Built with a Supabase project: logins work on every device. */
export const cloudConfigured = !!(URL_ && KEY);

export const USERNAME = /^[a-z0-9]([a-z0-9._-]{0,30}[a-z0-9])?$/;
export const MIN_PASSWORD = 6;
/** Usernames sign in with a made-up address (.invalid is never a real domain; no email is sent). */
export const emailFor = (username: string) => `${username.trim().toLowerCase()}@login.invalid`;

export interface Me {
  id: string;
  username: string;
  name: string;
  admin: boolean;
  mustChange: boolean;
}

// ---------------------------------------------------------------- who is signed in (cached)
const ME = 'mp.cloud.me';
const RECENT = 'mp.cloud.recent';
let me: Me | null | undefined;
const listeners = new Set<() => void>();

export function cloudMe(): Me | null {
  if (me === undefined) {
    try {
      me = JSON.parse(localStorage.getItem(ME) ?? 'null');
    } catch {
      me = null;
    }
  }
  return me ?? null;
}
function setMe(m: Me | null) {
  me = m;
  try {
    if (m) localStorage.setItem(ME, JSON.stringify(m));
    else localStorage.removeItem(ME);
  } catch {
    /* private mode */
  }
  listeners.forEach((f) => f());
}
export function onCloudMe(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

/** People who have signed in on this device, for the quick-pick on the sign-in screen. */
export function recentPeople(): { username: string; name: string }[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT) ?? '[]');
  } catch {
    return [];
  }
}
function remember(m: Me) {
  const list = [{ username: m.username, name: m.name }, ...recentPeople().filter((p) => p.username !== m.username)].slice(0, 8);
  try {
    localStorage.setItem(RECENT, JSON.stringify(list));
  } catch {
    /* private mode */
  }
}
export function forgetRecent(username: string) {
  try {
    localStorage.setItem(RECENT, JSON.stringify(recentPeople().filter((p) => p.username !== username)));
  } catch {
    /* private mode */
  }
}

// ---------------------------------------------------------------- the client (loaded on demand)
let client: Promise<SupabaseClient> | null = null;
export function supabase(): Promise<SupabaseClient> {
  if (!cloudConfigured) return Promise.reject(new Error('Logins aren’t set up on this copy of the app'));
  client ??= import('@supabase/supabase-js').then(({ createClient }) => createClient(URL_, KEY, { auth: { storageKey: 'mp.cloud.auth', persistSession: true, autoRefreshToken: true } }));
  return client;
}

export class CloudError extends Error {
  constructor(
    message: string,
    readonly status = 0,
  ) {
    super(message);
  }
}
const offline = () => typeof navigator !== 'undefined' && navigator.onLine === false;
function fail(error: { message?: string; status?: number; code?: string } | null, fallback: string): never {
  if (offline()) throw new CloudError('You’re offline — try again when you’re connected');
  throw new CloudError(error?.message || fallback, error?.status ?? 0);
}

interface ProfileRow {
  id: string;
  username: string;
  name: string;
  admin: boolean;
  must_change: boolean;
  disabled: boolean;
  created_at: string;
  last_seen: string | null;
}
const toMe = (p: ProfileRow): Me => ({ id: p.id, username: p.username, name: p.name, admin: p.admin, mustChange: p.must_change });

async function myProfile(sb: SupabaseClient, id: string): Promise<ProfileRow | null> {
  const { data, error } = await sb.from('profiles').select('*').eq('id', id);
  if (error) fail(error, 'Couldn’t load your login');
  return (data?.[0] as ProfileRow | undefined) ?? null;
}

// ---------------------------------------------------------------- signing in and out
export async function signIn(username: string, password: string): Promise<Me> {
  const sb = await supabase();
  const { data, error } = await sb.auth.signInWithPassword({ email: emailFor(username), password });
  if (error || !data.user) {
    if (offline()) throw new CloudError('You’re offline — connect to sign in');
    throw new CloudError(error?.status === 400 ? 'Wrong username or password.' : error?.message || 'Couldn’t sign in', error?.status ?? 0);
  }
  const p = await myProfile(sb, data.user.id);
  if (!p || p.disabled) {
    await sb.auth.signOut();
    throw new CloudError('This login has been switched off — ask your admin.');
  }
  const m = toMe(p);
  setMe(m);
  remember(m);
  return m;
}

/** Ends the session here (other devices stay signed in). */
export async function signOut(): Promise<void> {
  try {
    await (await supabase()).auth.signOut({ scope: 'local' });
  } catch {
    /* offline: the session is dropped locally anyway */
  }
  setMe(null);
}

/** Refresh the cached profile (name, admin) and notice a switched-off login. */
export async function refreshMe(): Promise<Me | null> {
  const m = cloudMe();
  if (!m) return null;
  const sb = await supabase();
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    setMe(null);
    throw new CloudError('Your sign-in has expired — please sign in again.', 401);
  }
  const p = await myProfile(sb, m.id);
  if (!p || p.disabled) {
    await signOut();
    throw new CloudError('This login has been switched off.', 401);
  }
  const next = toMe(p);
  if (JSON.stringify(next) !== JSON.stringify(m)) setMe(next);
  return next;
}

/** Is this username new (choose a password), ready (sign in), switched off, or unknown? */
export async function loginStatus(username: string): Promise<'new' | 'ready' | 'off' | 'none'> {
  const r = await adminCall({ action: 'status', username: username.trim().toLowerCase() });
  return (r as { status?: 'new' | 'ready' | 'off' | 'none' }).status ?? 'none';
}

/** First sign-in on a new login (or after a reset): choose the password, then sign in with it. */
export async function claimLogin(username: string, password: string): Promise<Me> {
  if (password.length < MIN_PASSWORD) throw new CloudError(`Use at least ${MIN_PASSWORD} characters.`);
  await adminCall({ action: 'claim', username: username.trim().toLowerCase(), password });
  return signIn(username, password);
}

/** Change your own password. Checks the current one first. */
export async function setPassword(current: string, next: string): Promise<void> {
  const m = cloudMe();
  if (!m) throw new CloudError('Sign in first.');
  if (next.length < MIN_PASSWORD) throw new CloudError(`Use at least ${MIN_PASSWORD} characters.`);
  const sb = await supabase();
  const check = await sb.auth.signInWithPassword({ email: emailFor(m.username), password: current });
  if (check.error) throw new CloudError(check.error.status === 400 ? 'Your current password is wrong.' : check.error.message);
  const { error } = await sb.auth.updateUser({ password: next });
  if (error) fail(error, 'Couldn’t change your password');
  const r = await sb.from('profiles').update({ must_change: false }).eq('id', m.id);
  if (r.error) fail(r.error, 'Couldn’t save that');
  setMe({ ...m, mustChange: false });
}

// ---------------------------------------------------------------- saved progress
export async function pullProgress(): Promise<{ v: number; data: string | null }> {
  const m = cloudMe();
  if (!m) throw new CloudError('Sign in first.', 401);
  const sb = await supabase();
  const { data, error } = await sb.from('progress').select('v, data').eq('user_id', m.id);
  if (error) fail(error, 'Couldn’t load your progress');
  const row = data?.[0] as { v: number; data: string } | undefined;
  return { v: row?.v ?? 0, data: row?.data ?? null };
}

/** Save if nobody else has since `base`; false means another device got there first. */
export async function pushProgress(base: number, payload: string, summary: unknown): Promise<boolean> {
  const sb = await supabase();
  const { data, error } = await sb.rpc('save_progress', { base, payload, summary });
  if (error) fail(error, 'Couldn’t save your progress');
  return (data as number) > 0;
}

// ---------------------------------------------------------------- the group
export interface Member extends Me {
  disabled: boolean;
  createdAt: string;
  lastSeen: string | null;
  summary: GroupSummary | null;
}

/** What each member's app shares with the group (see sync.ts summarise). */
export interface GroupSummary {
  attempts: number;
  marks: number;
  scored: number;
  lastActive: number;
  /** Monday of this week (YYYY-MM-DD) and this week's numbers */
  week: { start: string; questions: number; marks: number; scored: number };
  streak: number;
}

export async function group(): Promise<Member[]> {
  const sb = await supabase();
  const [p, s] = await Promise.all([sb.from('profiles').select('*').order('name'), sb.from('stats').select('user_id, summary')]);
  if (p.error) fail(p.error, 'Couldn’t load the group');
  const stats = new Map(((s.data ?? []) as { user_id: string; summary: GroupSummary }[]).map((r) => [r.user_id, r.summary]));
  return (p.data as ProfileRow[]).map((r) => ({ ...toMe(r), disabled: r.disabled, createdAt: r.created_at, lastSeen: r.last_seen, summary: stats.get(r.id) ?? null }));
}

export interface Assignment {
  id: string;
  title: string;
  items: { templateId: string; seed: number }[];
  durationMin: number;
  due: string | null;
  createdAt: string;
}
export interface Result {
  assignmentId: string;
  userId: string;
  got: number;
  of: number;
  finishedAt: string;
}

export async function assignments(): Promise<{ list: Assignment[]; results: Result[] }> {
  const sb = await supabase();
  const [a, r] = await Promise.all([sb.from('assignments').select('*').order('created_at', { ascending: false }), sb.from('assignment_results').select('*')]);
  if (a.error) fail(a.error, 'Couldn’t load set work');
  type ARow = { id: string; title: string; items: Assignment['items']; duration_min: number; due: string | null; created_at: string };
  type RRow = { assignment_id: string; user_id: string; got: number; of: number; finished_at: string };
  return {
    list: (a.data as ARow[]).map((x) => ({ id: x.id, title: x.title, items: x.items, durationMin: x.duration_min, due: x.due, createdAt: x.created_at })),
    results: ((r.data ?? []) as RRow[]).map((x) => ({ assignmentId: x.assignment_id, userId: x.user_id, got: x.got, of: x.of, finishedAt: x.finished_at })),
  };
}

export async function setWork(a: { title: string; items: Assignment['items']; durationMin: number; due: string | null }): Promise<void> {
  const m = cloudMe();
  const sb = await supabase();
  const { error } = await sb.from('assignments').insert({ title: a.title, items: a.items, duration_min: a.durationMin, due: a.due, created_by: m?.id });
  if (error) fail(error, 'Couldn’t set the work');
}

export async function removeWork(id: string): Promise<void> {
  const sb = await supabase();
  const { error } = await sb.from('assignments').delete().eq('id', id);
  if (error) fail(error, 'Couldn’t remove it');
}

export async function handIn(assignmentId: string, got: number, of: number): Promise<void> {
  const m = cloudMe();
  if (!m) return;
  const sb = await supabase();
  const { error } = await sb.from('assignment_results').upsert({ assignment_id: assignmentId, user_id: m.id, got, of, finished_at: new Date().toISOString() });
  if (error) fail(error, 'Couldn’t hand it in');
}

// ---------------------------------------------------------------- what people are working on (admins)
/** Share your work summary with admins (see activity.ts). */
export async function shareActivity(detail: unknown): Promise<void> {
  const m = cloudMe();
  if (!m) return;
  const sb = await supabase();
  const { error } = await sb.from('activity').upsert({ user_id: m.id, detail, updated_at: new Date().toISOString() });
  if (error) fail(error, 'Couldn’t share your activity');
}

/** Everyone's work summaries (admins; others get only their own). */
export async function activities(): Promise<Map<string, ActivitySummary>> {
  const sb = await supabase();
  const { data, error } = await sb.from('activity').select('user_id, detail');
  if (error) fail(error, 'Couldn’t load activity');
  return new Map(((data ?? []) as { user_id: string; detail: ActivitySummary }[]).map((r) => [r.user_id, r.detail]));
}
// ---------------------------------------------------------------- the admin function (logins)
async function adminCall(body: Record<string, unknown>): Promise<{ id?: string; status?: string }> {
  const sb = await supabase();
  const { data, error } = await sb.functions.invoke('admin', { body });
  if (error) {
    // the function's own message, e.g. "The username "ana" is taken."
    const res = (error as { context?: Response }).context;
    const detail = res && typeof res.json === 'function' ? ((await res.json().catch(() => null)) as { error?: string } | null) : null;
    fail({ message: detail?.error ?? error.message, status: res?.status }, 'Couldn’t do that');
  }
  return (data ?? {}) as { id?: string; status?: string };
}

/** A login with just a name and username: they choose their password the first time they sign in. */
export const createLogin = (p: { username: string; name: string; admin: boolean }) => adminCall({ action: 'create', ...p, username: p.username.trim().toLowerCase() });
/** Back to "choose a password": the old one stops working. */
export const resetLogin = (id: string) => adminCall({ action: 'reset', id });
export const setLoginAdmin = (id: string, admin: boolean) => adminCall({ action: 'admin', id, admin });
export const setLoginDisabled = (id: string, disabled: boolean) => adminCall({ action: 'disable', id, disabled });
export const renameLogin = (id: string, name: string) => adminCall({ action: 'rename', id, name });
export const deleteLogin = (id: string) => adminCall({ action: 'delete', id });
