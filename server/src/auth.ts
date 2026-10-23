/**
 * Logins that the app's owner (an admin) creates for people. Each person's progress, history and
 * settings are stored with their account, so they follow them to any device.
 *
 * Passwords are stretched in the app (PBKDF2, 100,000 rounds, salted with the username) before they
 * are sent, so this Worker only does a cheap salted SHA-256 of the result: the free plan allows
 * 10 ms of CPU per request, far too little to run PBKDF2 here. Someone with a copy of the database
 * still has to repeat the full PBKDF2 for every password guess.
 *
 * Sessions are random bearer tokens (the app is on another origin, where Safari blocks cookies);
 * only their SHA-256 is stored.
 */
import type { Env } from './env';
import { HttpError, readJson } from './http';
import { sameSecret } from './limits';

export const SESSION_DAYS = 90;
/** wrong passwords per username per day before that login is paused (an admin reset clears it) */
export const MAX_BAD_LOGINS = 20;
const USERNAME = /^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$/;
/** the app's stretched password: 32 bytes, base64 */
const KEY = /^[A-Za-z0-9+/]{43}=$/;
const MAX_DATA_CHARS = 1_500_000;

export interface User {
  id: number;
  username: string;
  name: string;
  admin: number;
  must_change: number;
  disabled: number;
  created_at: number;
  last_seen: number | null;
}
const publicUser = (u: User) => ({ id: u.id, username: u.username, name: u.name, admin: !!u.admin, mustChange: !!u.must_change });

// ---------------------------------------------------------------- hashing
const enc = new TextEncoder();
const b64 = (bytes: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
const random = (n: number) => crypto.getRandomValues(new Uint8Array(n));

/** Stored form: `s1$<salt>$<sha256(salt + key)>`, all base64. */
export async function hashKey(key: string, salt = b64(random(16))): Promise<string> {
  return `s1$${salt}$${b64(await crypto.subtle.digest('SHA-256', enc.encode(salt + key)))}`;
}
async function keyMatches(key: string, stored: string): Promise<boolean> {
  const [kind, salt] = stored.split('$');
  if (kind !== 's1' || !salt) return false;
  return sameSecret(await hashKey(key, salt), stored);
}

// ---------------------------------------------------------------- sessions
const day = (now: number) => new Date(now).toISOString().slice(0, 10);

async function newSession(env: Env, userId: number, now: number): Promise<string> {
  const token = b64(random(32)).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' })[c]!);
  const id = hex(await crypto.subtle.digest('SHA-256', enc.encode(token)));
  await env.DB.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').bind(id, userId, now, now + SESSION_DAYS * 86_400_000).run();
  return token;
}

/** The signed-in user, or a 401. Keeps the session alive while it's used. */
export async function requireUser(env: Env, req: Request, now = Date.now()): Promise<User & { session: string }> {
  const token = /^Bearer ([A-Za-z0-9_-]{20,})$/.exec(req.headers.get('authorization') ?? '')?.[1];
  if (!token) throw new HttpError(401, 'Please sign in');
  const id = hex(await crypto.subtle.digest('SHA-256', enc.encode(token)));
  const u = await env.DB.prepare('SELECT u.*, s.token AS session, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?').bind(id).first<User & { session: string; expires_at: number }>();
  if (!u || u.expires_at < now || u.disabled) throw new HttpError(401, u?.disabled ? 'This login has been switched off' : 'Your sign-in has expired — please sign in again');
  // at most one write a day per user for "last active"
  if (!u.last_seen || day(u.last_seen) !== day(now)) await env.DB.prepare('UPDATE users SET last_seen = ? WHERE id = ?').bind(now, u.id).run();
  return u;
}

async function requireAdmin(env: Env, req: Request): Promise<User> {
  const u = await requireUser(env, req);
  if (!u.admin) throw new HttpError(403, 'Only an admin can do that');
  return u;
}

// ---------------------------------------------------------------- sign in / out
export async function login(env: Env, req: Request, now = Date.now()) {
  const body = await readJson<{ username?: unknown; key?: unknown }>(req, 2000);
  const username = String(body.username ?? '').trim().toLowerCase();
  const key = String(body.key ?? '');
  if (!USERNAME.test(username) || !KEY.test(key)) throw new HttpError(400, 'Enter your username and password');
  const kind = `login:${username}`;
  const bad = await env.DB.prepare('SELECT n FROM usage WHERE day = ? AND kind = ?').bind(day(now), kind).first<{ n: number }>();
  if ((bad?.n ?? 0) >= MAX_BAD_LOGINS) throw new HttpError(429, 'Too many wrong passwords for this login today — ask your admin to reset it');
  const u = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first<User & { pass: string }>();
  if (!u || !(await keyMatches(key, u.pass))) {
    await env.DB.prepare('INSERT INTO usage (day, kind, n) VALUES (?, ?, 1) ON CONFLICT(day, kind) DO UPDATE SET n = n + 1').bind(day(now), kind).run();
    throw new HttpError(401, 'Wrong username or password');
  }
  if (u.disabled) throw new HttpError(403, 'This login has been switched off');
  const token = await newSession(env, u.id, now);
  await env.DB.prepare('UPDATE users SET last_seen = ? WHERE id = ?').bind(now, u.id).run();
  return { token, user: publicUser(u) };
}

export async function logout(env: Env, req: Request) {
  const u = await requireUser(env, req);
  await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(u.session).run();
  return { ok: true };
}

export async function changePassword(env: Env, req: Request) {
  const u = await requireUser(env, req);
  const body = await readJson<{ current?: unknown; next?: unknown }>(req, 2000);
  const row = await env.DB.prepare('SELECT pass FROM users WHERE id = ?').bind(u.id).first<{ pass: string }>();
  if (!KEY.test(String(body.next ?? ''))) throw new HttpError(400, 'Choose a new password');
  if (!row || !(await keyMatches(String(body.current ?? ''), row.pass))) throw new HttpError(401, 'Your current password is wrong');
  await env.DB.prepare('UPDATE users SET pass = ?, must_change = 0 WHERE id = ?').bind(await hashKey(String(body.next)), u.id).run();
  // sign out everywhere else
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?').bind(u.id, u.session).run();
  return { ok: true };
}

// ---------------------------------------------------------------- each person's data
export async function getData(env: Env, req: Request) {
  const u = await requireUser(env, req);
  const row = await env.DB.prepare('SELECT v, data, updated_at FROM user_data WHERE user_id = ?').bind(u.id).first<{ v: number; data: string; updated_at: number }>();
  return { user: publicUser(u), v: row?.v ?? 0, data: row?.data, updatedAt: row?.updated_at };
}

export async function putData(env: Env, req: Request, now = Date.now()): Promise<{ status: number; body: unknown }> {
  const u = await requireUser(env, req);
  const body = await readJson<{ base?: unknown; data?: unknown; summary?: unknown }>(req, MAX_DATA_CHARS + 4000);
  if (typeof body.data !== 'string' || !body.data || body.data.length > MAX_DATA_CHARS) throw new HttpError(400, 'Missing or oversized data');
  if (typeof body.base !== 'number' || !Number.isInteger(body.base) || body.base < 0) throw new HttpError(400, 'Missing base version');
  const summary = body.summary && typeof body.summary === 'object' ? JSON.stringify(body.summary).slice(0, 2000) : null;
  const r =
    body.base === 0
      ? await env.DB.prepare('INSERT INTO user_data (user_id, v, data, summary, updated_at) VALUES (?, 1, ?, ?, ?) ON CONFLICT(user_id) DO NOTHING').bind(u.id, body.data, summary, now).run()
      : await env.DB.prepare('UPDATE user_data SET v = v + 1, data = ?, summary = ?, updated_at = ? WHERE user_id = ? AND v = ?').bind(body.data, summary, now, u.id, body.base).run();
  if (!r.meta.changes) {
    const cur = await env.DB.prepare('SELECT v FROM user_data WHERE user_id = ?').bind(u.id).first<{ v: number }>();
    return { status: 409, body: { error: 'Another device saved first: pull, merge and try again', v: cur?.v ?? 0 } };
  }
  return { status: 200, body: { v: body.base + 1 } };
}

// ---------------------------------------------------------------- admin: managing logins
export async function listUsers(env: Env, req: Request) {
  await requireAdmin(env, req);
  const { results } = await env.DB.prepare('SELECT u.id, u.username, u.name, u.admin, u.must_change, u.disabled, u.created_at, u.last_seen, d.summary FROM users u LEFT JOIN user_data d ON d.user_id = u.id ORDER BY u.name COLLATE NOCASE').all<User & { summary: string | null }>();
  return {
    users: results.map((u) => ({ ...publicUser(u), disabled: !!u.disabled, createdAt: u.created_at, lastSeen: u.last_seen, summary: u.summary ? JSON.parse(u.summary) : null })),
  };
}

export async function createUser(env: Env, req: Request, now = Date.now()) {
  await requireAdmin(env, req);
  const body = await readJson<{ username?: unknown; name?: unknown; key?: unknown; admin?: unknown }>(req, 2000);
  const username = String(body.username ?? '').trim().toLowerCase();
  const name = String(body.name ?? '').trim().slice(0, 60);
  if (!USERNAME.test(username)) throw new HttpError(400, 'Usernames are 3–32 lower-case letters, numbers, dots, dashes or underscores');
  if (!name) throw new HttpError(400, 'Enter a name');
  if (!KEY.test(String(body.key ?? ''))) throw new HttpError(400, 'Missing password');
  const r = await env.DB.prepare('INSERT INTO users (username, name, pass, admin, must_change, disabled, created_at) VALUES (?, ?, ?, ?, 1, 0, ?) ON CONFLICT(username) DO NOTHING')
    .bind(username, name, await hashKey(String(body.key)), body.admin ? 1 : 0, now)
    .run();
  if (!r.meta.changes) throw new HttpError(409, `The username "${username}" is taken`);
  return { ok: true };
}

export async function updateUser(env: Env, req: Request, id: number, now = Date.now()) {
  const me = await requireAdmin(env, req);
  const body = await readJson<{ name?: unknown; disabled?: unknown; admin?: unknown; key?: unknown }>(req, 2000);
  const u = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();
  if (!u) throw new HttpError(404, 'No such login');
  if (id === me.id && (body.disabled === true || body.admin === false)) throw new HttpError(400, 'You can’t switch off your own admin login');
  if (typeof body.name === 'string' && body.name.trim()) await env.DB.prepare('UPDATE users SET name = ? WHERE id = ?').bind(body.name.trim().slice(0, 60), id).run();
  if (typeof body.admin === 'boolean') await env.DB.prepare('UPDATE users SET admin = ? WHERE id = ?').bind(body.admin ? 1 : 0, id).run();
  if (typeof body.disabled === 'boolean') {
    await env.DB.prepare('UPDATE users SET disabled = ? WHERE id = ?').bind(body.disabled ? 1 : 0, id).run();
    if (body.disabled) await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run();
  }
  if (body.key !== undefined) {
    // a reset: a new temporary password, everyone signed out, and the wrong-password count cleared
    if (!KEY.test(String(body.key))) throw new HttpError(400, 'Missing password');
    await env.DB.prepare('UPDATE users SET pass = ?, must_change = 1 WHERE id = ?').bind(await hashKey(String(body.key)), id).run();
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM usage WHERE day = ? AND kind = ?').bind(day(now), `login:${u.username}`).run();
  }
  return { ok: true };
}

export async function deleteUser(env: Env, req: Request, id: number) {
  const me = await requireAdmin(env, req);
  if (id === me.id) throw new HttpError(400, 'You can’t delete your own login');
  for (const sql of ['DELETE FROM sessions WHERE user_id = ?', 'DELETE FROM user_data WHERE user_id = ?', 'DELETE FROM users WHERE id = ?']) await env.DB.prepare(sql).bind(id).run();
  return { ok: true };
}

