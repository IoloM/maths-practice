/**
 * A pretend Supabase for the browser tests: the Auth, REST (PostgREST) and Functions endpoints the
 * app's Supabase client calls, kept in memory in the test process so several "devices" (browser
 * contexts) share one server. The admin function is the real handler, on an in-memory backend.
 * The rules it enforces are the ones tested for real in tests/supabase-sql.test.ts.
 */
import type { BrowserContext, Page, Route } from '@playwright/test';
import { emailFor, handle, inviteOpen, type Backend, type InviteRow } from '../supabase/functions/admin/handler';

export const SUPA = 'https://supa.test';

interface User {
  id: string;
  email: string;
  password: string;
  banned: boolean;
}
interface Profile {
  id: string;
  username: string;
  name: string;
  admin: boolean;
  must_change: boolean;
  disabled: boolean;
  created_at: string;
  last_seen: string | null;
}

export interface FakeState {
  users: User[];
  profiles: Profile[];
  progress: Map<string, { v: number; data: string }>;
  stats: Map<string, unknown>;
  activity: Map<string, unknown>;
  assignments: Record<string, unknown>[];
  results: Record<string, unknown>[];
  target: number | null;
  invites: InviteRow[];
}

export function fakeState(people: { username: string; name: string; password: string; admin?: boolean; mustChange?: boolean }[]): FakeState {
  const s: FakeState = { users: [], profiles: [], progress: new Map(), stats: new Map(), activity: new Map(), assignments: [], results: [], target: null, invites: [] };
  for (const p of people) addPerson(s, p.username, p.name, p.password, !!p.admin, !!p.mustChange);
  return s;
}
let next = 1;
function addPerson(s: FakeState, username: string, name: string, password: string, admin: boolean, mustChange: boolean): string {
  const id = `00000000-0000-4000-8000-${String(next++).padStart(12, '0')}`;
  s.users.push({ id, email: emailFor(username), password, banned: false });
  s.profiles.push({ id, username, name, admin, must_change: mustChange, disabled: false, created_at: new Date().toISOString(), last_seen: null });
  return id;
}

const b64url = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (u: User) => `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: u.id, email: u.email, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })}.c2ln`;
const sessionFor = (u: User) => ({
  access_token: jwt(u),
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: `refresh-${u.id}`,
  user: { id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
});

function userFromAuth(s: FakeState, header: string | undefined): User | null {
  const token = /^Bearer (.+)$/.exec(header ?? '')?.[1];
  if (!token) return null;
  try {
    const sub = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).sub as string;
    const u = s.users.find((x) => x.id === sub);
    return u && !u.banned ? u : null;
  } catch {
    return null;
  }
}

function backendFor(s: FakeState): Backend {
  return {
    async userFromToken(token) {
      return userFromAuth(s, `Bearer ${token}`)?.id ?? null;
    },
    async profile(id) {
      return s.profiles.find((p) => p.id === id) ?? null;
    },
    async profileByUsername(username) {
      return s.profiles.find((p) => p.username.toLowerCase() === username.toLowerCase()) ?? null;
    },
    async usernameTaken(username) {
      return s.profiles.some((p) => p.username.toLowerCase() === username.toLowerCase());
    },
    async createAuthUser(email, password) {
      const id = `00000000-0000-4000-8000-${String(next++).padStart(12, '0')}`;
      s.users.push({ id, email, password, banned: false });
      return id;
    },
    async deleteAuthUser(id) {
      s.users = s.users.filter((u) => u.id !== id);
      s.profiles = s.profiles.filter((p) => p.id !== id);
      s.progress.delete(id);
      s.stats.delete(id);
      s.results = s.results.filter((r) => r.user_id !== id);
    },
    async setPassword(id, password) {
      s.users.find((u) => u.id === id)!.password = password;
    },
    async setBanned(id, banned) {
      s.users.find((u) => u.id === id)!.banned = banned;
    },
    async insertProfile(p) {
      s.profiles.push({ ...p, disabled: false, created_at: new Date().toISOString(), last_seen: null });
    },
    async updateProfile(id, patch) {
      Object.assign(s.profiles.find((p) => p.id === id)!, patch);
    },
    async createInvite(inv) {
      s.invites.push({ ...inv, created_at: new Date().toISOString(), uses: 0, active: true });
    },
    async listInvites() {
      return [...s.invites].reverse();
    },
    async getInvite(code) {
      return s.invites.find((i) => i.code === code) ?? null;
    },
    async takeInvite(code) {
      const i = s.invites.find((x) => x.code === code);
      if (!i || !inviteOpen(i)) return false;
      i.uses++;
      return true;
    },
    async stopInvite(code) {
      const i = s.invites.find((x) => x.code === code);
      if (i) i.active = false;
    },
  };
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'apikey, authorization, content-type, x-client-info, prefer, accept, accept-profile, content-profile, x-supabase-api-version, range',
  'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'access-control-expose-headers': 'content-range',
};

/** Rows matching PostgREST `col=eq.value` filters. */
function filtered<T extends Record<string, unknown>>(rows: T[], q: URLSearchParams): T[] {
  let out = rows;
  for (const [k, v] of q) if (v.startsWith('eq.')) out = out.filter((r) => String(r[k]) === v.slice(3));
  const order = q.get('order');
  if (order) {
    const [col, dir] = order.split('.');
    out = [...out].sort((a, b) => (String(a[col]) < String(b[col]) ? -1 : String(a[col]) > String(b[col]) ? 1 : 0) * (dir === 'desc' ? -1 : 1));
  }
  return out;
}
const pick = (row: Record<string, unknown>, select: string | null) => (!select || select === '*' ? row : Object.fromEntries(select.split(',').map((c) => [c.trim(), row[c.trim()]])));

async function respond(s: FakeState, route: Route) {
  const req = route.request();
  const reply = (status: number, body?: unknown) => route.fulfill({ status, headers: { ...CORS, 'content-type': 'application/json' }, body: body === undefined ? '' : JSON.stringify(body) });
  if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
  const url = new URL(req.url());
  const path = url.pathname;
  const me = userFromAuth(s, req.headers()['authorization']);
  const body = () => (req.postData() ? JSON.parse(req.postData()!) : {});

  // ---- Auth
  if (path === '/auth/v1/token' && url.searchParams.get('grant_type') === 'password') {
    const { email, password } = body();
    const u = s.users.find((x) => x.email === email && x.password === password);
    if (!u) return reply(400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
    if (u.banned) return reply(400, { code: 400, error_code: 'user_banned', msg: 'User is banned' });
    return reply(200, sessionFor(u));
  }
  if (path === '/auth/v1/token' && url.searchParams.get('grant_type') === 'refresh_token') {
    const u = s.users.find((x) => `refresh-${x.id}` === body().refresh_token);
    return u ? reply(200, sessionFor(u)) : reply(400, { msg: 'Invalid refresh token' });
  }
  if (path === '/auth/v1/user') {
    if (!me) return reply(401, { msg: 'JWT expired' });
    if (req.method() === 'PUT') me.password = body().password ?? me.password;
    return reply(200, sessionFor(me).user);
  }
  if (path === '/auth/v1/logout') return reply(204);

  // ---- the admin function (the real handler)
  if (path === '/functions/v1/admin') {
    const res = await handle(new Request(req.url(), { method: req.method(), headers: req.headers(), body: req.postData() ?? undefined }), { backend: backendFor(s), origins: [] });
    return route.fulfill({ status: res.status, headers: { ...CORS, 'content-type': 'application/json' }, body: await res.text() });
  }

  // ---- REST: everything below needs a signed-in, switched-on member
  const profile = me && s.profiles.find((p) => p.id === me.id && !p.disabled);
  if (!profile) return reply(401, { message: 'JWT expired', code: 'PGRST301' });
  const table = path.replace('/rest/v1/', '');
  const q = url.searchParams;
  switch (`${req.method()} ${table}`) {
    case 'GET profiles':
      // your own, or everyone's for admins
      return reply(200, filtered(s.profiles as unknown as Record<string, unknown>[], q).filter((r) => profile.admin || r.id === me!.id).map((r) => pick(r, q.get('select'))));
    case 'PATCH profiles': {
      const patch = body();
      for (const p of filtered(s.profiles as unknown as Record<string, unknown>[], q)) if (p.id === me!.id) Object.assign(p, { must_change: patch.must_change ?? p.must_change, name: patch.name ?? p.name });
      return reply(204);
    }
    case 'GET progress': {
      const row = s.progress.get(me!.id);
      return reply(200, row && (!q.get('user_id') || q.get('user_id') === `eq.${me!.id}`) ? [pick({ user_id: me!.id, ...row }, q.get('select'))] : []);
    }
    case 'POST rpc/save_progress': {
      const { base, payload, summary } = body();
      const cur = s.progress.get(me!.id);
      if ((cur?.v ?? 0) !== base) return reply(200, -1);
      s.progress.set(me!.id, { v: base + 1, data: payload });
      s.stats.set(me!.id, summary);
      profile.last_seen = new Date().toISOString();
      return reply(200, base + 1);
    }
    case 'GET stats':
      return reply(200, [...s.stats].filter(([id]) => profile.admin || id === me!.id).map(([user_id, summary]) => pick({ user_id, summary }, q.get('select'))));
    case 'GET activity':
      // your own, or everyone's for admins
      return reply(200, [...s.activity].filter(([id]) => profile.admin || id === me!.id).map(([user_id, detail]) => pick({ user_id, detail }, q.get('select'))));
    case 'POST activity': {
      const row = body();
      if (row.user_id !== me!.id) return reply(403, { message: 'new row violates row-level security policy' });
      s.activity.set(row.user_id, row.detail);
      return reply(201);
    }
    case 'GET assignments':
      return reply(200, filtered(s.assignments, q));
    case 'POST assignments': {
      if (!profile.admin) return reply(403, { message: 'new row violates row-level security policy' });
      const row = { id: `a${s.assignments.length + 1}-0000-4000-8000-000000000000`, created_at: new Date().toISOString(), ...body() };
      s.assignments.push(row);
      return reply(201);
    }
    case 'DELETE assignments': {
      if (!profile.admin) return reply(204);
      const gone = new Set(filtered(s.assignments, q).map((a) => a.id));
      s.assignments = s.assignments.filter((a) => !gone.has(a.id));
      s.results = s.results.filter((r) => !gone.has(r.assignment_id));
      return reply(204);
    }
    case 'GET group_target':
      return reply(200, s.target === null ? [] : [{ weekly_questions: s.target }]);
    case 'POST group_target':
      if (!profile.admin) return reply(403, { message: 'new row violates row-level security policy' });
      s.target = Number(body().weekly_questions);
      return reply(201);
    case 'DELETE group_target':
      if (profile.admin) s.target = null;
      return reply(204);
    case 'GET assignment_results':
      return reply(200, s.results.filter((r) => profile.admin || r.user_id === me!.id));
    case 'POST assignment_results': {
      const row = body();
      if (row.user_id !== me!.id) return reply(403, { message: 'new row violates row-level security policy' });
      s.results = [...s.results.filter((r) => !(r.assignment_id === row.assignment_id && r.user_id === row.user_id)), row];
      return reply(201);
    }
  }
  return reply(404, { message: `fake Supabase: no ${req.method()} ${path}` });
}

/** Serve the pretend Supabase to a page or a whole browser context ("device"). */
export async function serveSupabase(target: Page | BrowserContext, s: FakeState) {
  await target.route(`${SUPA}/**`, (route) => respond(s, route));
}
