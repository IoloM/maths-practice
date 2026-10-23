import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { handle } from '../src/index';
import type { Env } from '../src/env';
import { MODEL } from '../src/ai';
import { MAX_BAD_CODES } from '../src/limits';
import { MAX_BAD_LOGINS, hashKey } from '../src/auth';

/** Just enough of D1 on top of SQLite for these queries. */
function fakeD1(): D1Database {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(decodeURIComponent(new URL('../schema.sql', import.meta.url).pathname), 'utf8'));
  const stmt = (sql: string, args: unknown[] = []) => ({
    bind: (...a: unknown[]) => stmt(sql, a),
    first: async () => (db.prepare(sql).get(...(args as never[])) as unknown) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...(args as never[])) }),
    run: async () => {
      const r = db.prepare(sql).run(...(args as never[]));
      return { meta: { changes: Number(r.changes) } };
    },
  });
  return { prepare: (sql: string) => stmt(sql) } as unknown as D1Database;
}

const ORIGIN = 'https://iolom.github.io';
let env: Env;
let calls: Record<string, unknown>[];
let reply: { stop_reason: string; parsed_output: unknown };
const client = () => ({ beta: { messages: { parse: async (p: Record<string, unknown>) => (calls.push(p), reply) } } }) as unknown as Anthropic;
const call = (path: string, init: RequestInit = {}, e = env) => handle(new Request(`https://api.example${path}`, { ...init, headers: { origin: ORIGIN, ...(init.headers as Record<string, string>) } }), e, client);
const id = 'a'.repeat(64);

beforeEach(() => {
  env = { DB: fakeD1(), ALLOWED_ORIGINS: `${ORIGIN},http://localhost:4173`, ANTHROPIC_API_KEY: 'sk-test', ACCESS_CODE: 'let-me-in', DAILY_AI_LIMIT: '3' };
  calls = [];
  reply = { stop_reason: 'end_turn', parsed_output: { answer: '\\frac{3}{4}', unclear: false, note: '' } };
});

describe('basics', () => {
  it('reports whether AI is set up', async () => {
    expect(await (await call('/health')).json()).toEqual({ ok: true, ai: true });
    expect(await (await call('/health', {}, { ...env, ACCESS_CODE: undefined })).json()).toEqual({ ok: true, ai: false });
  });
  it('allows CORS only for listed origins', async () => {
    const ok = await call('/health', { method: 'OPTIONS' });
    expect(ok.status).toBe(204);
    expect(ok.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    const other = await handle(new Request('https://api.example/health', { headers: { origin: 'https://evil.example' } }), env, client);
    expect(other.headers.get('access-control-allow-origin')).toBeNull();
  });
});

describe('sync', () => {
  const put = (base: number, data = 'cipher') => call(`/sync/${id}`, { method: 'PUT', body: JSON.stringify({ base, data }) });
  it('stores ciphertext with optimistic concurrency', async () => {
    expect((await call(`/sync/${id}`)).status).toBe(404);
    expect(await (await put(0, 'one')).json()).toEqual({ v: 1 });
    expect((await (await call(`/sync/${id}`)).json()) as { v: number; data: string }).toMatchObject({ v: 1, data: 'one' });
    expect((await put(0, 'stale')).status).toBe(409);
    expect(await (await put(1, 'two')).json()).toEqual({ v: 2 });
    const conflict = await put(1, 'stale');
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({ v: 2 });
    expect(((await (await call(`/sync/${id}`)).json()) as { data: string }).data).toBe('two');
  });
  it('rejects bad ids and bodies', async () => {
    expect((await call('/sync/not-a-hash')).status).toBe(400);
    expect((await call(`/sync/${id}`, { method: 'PUT', body: JSON.stringify({ base: 0 }) })).status).toBe(400);
    expect((await call(`/sync/${id}`, { method: 'PUT', body: '{nope' })).status).toBe(400);
  });
});

describe('AI', () => {
  const png = 'iVBORw0KGgo=';
  const read = (code: string | null, e = env) => call('/ai/read', { method: 'POST', headers: code ? { 'x-access-code': code } : {}, body: JSON.stringify({ image: png, question: 'Find the exact value' }) }, e);
  it('needs the server set up and the right access code', async () => {
    expect((await read('let-me-in', { ...env, ANTHROPIC_API_KEY: undefined })).status).toBe(503);
    expect((await read(null)).status).toBe(401);
    expect((await read('wrong')).status).toBe(401);
    expect(calls).toHaveLength(0);
  });
  it('checks the access code without calling the AI or counting it', async () => {
    const check = (code: string) => call('/ai/check', { headers: { 'x-access-code': code } });
    expect((await check('wrong')).status).toBe(401);
    for (let i = 0; i < 5; i++) expect((await check('let-me-in')).status).toBe(200);
    expect(calls).toHaveLength(0);
    expect((await read('let-me-in')).status).toBe(200);
  });
  it('pauses AI for the day after too many wrong access codes', async () => {
    for (let i = 0; i < MAX_BAD_CODES; i++) expect((await read('guess' + i)).status).toBe(401);
    expect((await read('let-me-in')).status).toBe(429);
    expect(calls).toHaveLength(0);
  });
  it('reads handwriting with the default model, an image block and server-side fallback', async () => {
    const res = await read('let-me-in');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ answer: '\\frac{3}{4}', unclear: false, note: '' });
    const p = calls[0] as { model: string; fallbacks: string; betas: string[]; messages: { content: { type: string }[] }[]; output_config: { effort: string } };
    expect(p.model).toBe(MODEL);
    expect(p.fallbacks).toBe('default');
    expect(p.betas).toContain('server-side-fallback-2026-07-01');
    expect(p.output_config.effort).toBe('low');
    expect(p.messages[0].content[0].type).toBe('image');
  });
  it('turns a refusal or a truncated reply into a clear error', async () => {
    reply = { stop_reason: 'refusal', parsed_output: null };
    expect((await read('let-me-in')).status).toBe(422);
    reply = { stop_reason: 'max_tokens', parsed_output: null };
    expect((await read('let-me-in')).status).toBe(502);
  });
  it('caps AI calls per day', async () => {
    for (let i = 0; i < 3; i++) expect((await read('let-me-in')).status).toBe(200);
    const res = await read('let-me-in');
    expect(res.status).toBe(429);
  });
  it('marks working and keeps one in-range line per scheme line', async () => {
    reply = {
      stop_reason: 'end_turn',
      parsed_output: {
        lines: [
          { index: 0, awarded: true, comment: 'Good method.' },
          { index: 0, awarded: false, comment: 'duplicate' },
          { index: 7, awarded: true, comment: 'out of range' },
          { index: 1, awarded: false, comment: 'Check the sign.' },
        ],
        summary: 'Nearly there.',
        nextStep: 'Watch negative signs.',
        legible: true,
      },
    };
    const res = await call('/ai/mark', {
      method: 'POST',
      headers: { 'x-access-code': 'let-me-in' },
      body: JSON.stringify({ question: 'Find x', marks: 2, scheme: [{ code: 'M1', text: 'method' }, { code: 'A1', text: 'x = 2' }], image: png, answer: 'x = -2' }),
    });
    expect(res.status).toBe(200);
    const out = (await res.json()) as { lines: { index: number }[] };
    expect(out.lines.map((l) => l.index)).toEqual([0, 1]);
    expect(JSON.stringify(calls[0])).toContain('0. M1: method');
  });
  it('needs some working to mark', async () => {
    const res = await call('/ai/mark', { method: 'POST', headers: { 'x-access-code': 'let-me-in' }, body: JSON.stringify({ question: 'Find x', marks: 1, scheme: [{ code: 'B1', text: 'x = 2' }] }) });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------- accounts
/** What the app sends instead of the password (see src/lib/account.ts). */
async function stretch(username: string, password: string): Promise<string> {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(`maths-practice login v1:${username.toLowerCase()}`), iterations: 100_000, hash: 'SHA-256' }, base, 256);
  return Buffer.from(bits).toString('base64');
}

describe('accounts', () => {
  const auth = (token: string) => ({ authorization: `Bearer ${token}` });
  const post = (path: string, body: unknown, headers: Record<string, string> = {}, method = 'POST') => call(path, { method, headers, body: JSON.stringify(body) });
  const signIn = async (username: string, password: string) => post('/auth/login', { username, key: await stretch(username, password) });
  async function seedAdmin() {
    await env.DB.prepare('INSERT INTO users (username, name, pass, admin, must_change, disabled, created_at) VALUES (?, ?, ?, 1, 0, 0, 1)').bind('iolo', 'Iolo', await hashKey(await stretch('iolo', 'admin-pass-123'))).run();
    return ((await (await signIn('iolo', 'admin-pass-123')).json()) as { token: string }).token;
  }

  it('signs in with the stretched password and stores no password', async () => {
    await seedAdmin();
    const res = await signIn('IOLO', 'admin-pass-123');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string; user: { username: string; admin: boolean } };
    expect(body.user).toMatchObject({ username: 'iolo', admin: true, mustChange: false });
    expect((await signIn('iolo', 'wrong-password')).status).toBe(401);
    expect((await signIn('nobody', 'admin-pass-123')).status).toBe(401);
    const row = await env.DB.prepare('SELECT pass FROM users').first<{ pass: string }>();
    expect(row!.pass).toMatch(/^s1\$/);
    expect(row!.pass).not.toContain(await stretch('iolo', 'admin-pass-123'));
    const sessions = await env.DB.prepare('SELECT token FROM sessions').all<{ token: string }>();
    expect(sessions.results.map((s) => s.token)).not.toContain(body.token); // only its hash is kept
  });

  it('pauses a login after too many wrong passwords, until an admin resets it', async () => {
    const admin = await seedAdmin();
    expect((await post('/admin/users', { username: 'sam', name: 'Sam', key: await stretch('sam', 'temp-pass-1') }, auth(admin))).status).toBe(200);
    for (let i = 0; i < MAX_BAD_LOGINS; i++) expect((await signIn('sam', `guess-${i}`)).status).toBe(401);
    expect((await signIn('sam', 'temp-pass-1')).status).toBe(429);
    const { users } = (await (await call('/admin/users', { headers: auth(admin) })).json()) as { users: { id: number; username: string }[] };
    const sam = users.find((u) => u.username === 'sam')!;
    expect((await post(`/admin/users/${sam.id}`, { key: await stretch('sam', 'temp-pass-2') }, auth(admin), 'PATCH')).status).toBe(200);
    expect((await signIn('sam', 'temp-pass-2')).status).toBe(200);
  });

  it('lets an admin create, reset, switch off and delete logins — and nobody else', async () => {
    const admin = await seedAdmin();
    const create = (u: string, h = auth(admin)) => post('/admin/users', { username: u, name: u.toUpperCase(), key: 'A'.repeat(43) + '=' }, h);
    expect((await create('ana')).status).toBe(200);
    expect((await create('ana')).status).toBe(409);
    expect((await create('Bad Name!')).status).toBe(400);
    await post('/admin/users', { username: 'ben', name: 'Ben', key: await stretch('ben', 'temp-pass-1') }, auth(admin));
    const ben = ((await (await signIn('ben', 'temp-pass-1')).json()) as { token: string; user: { mustChange: boolean } });
    expect(ben.user.mustChange).toBe(true);
    // not an admin
    expect((await call('/admin/users', { headers: auth(ben.token) })).status).toBe(403);
    expect((await create('cat', auth(ben.token))).status).toBe(403);
    expect((await call('/admin/users')).status).toBe(401);
    // switch off: signed out at once and can't sign in
    const { users } = (await (await call('/admin/users', { headers: auth(admin) })).json()) as { users: { id: number; username: string; admin: boolean }[] };
    const benId = users.find((u) => u.username === 'ben')!.id;
    const meId = users.find((u) => u.username === 'iolo')!.id;
    await post(`/admin/users/${benId}`, { disabled: true }, auth(admin), 'PATCH');
    expect((await call('/me', { headers: auth(ben.token) })).status).toBe(401);
    expect((await signIn('ben', 'temp-pass-1')).status).toBe(403);
    // can't lock yourself out
    expect((await post(`/admin/users/${meId}`, { disabled: true }, auth(admin), 'PATCH')).status).toBe(400);
    expect((await call(`/admin/users/${meId}`, { method: 'DELETE', headers: auth(admin) })).status).toBe(400);
    expect((await call(`/admin/users/${benId}`, { method: 'DELETE', headers: auth(admin) })).status).toBe(200);
    const after = (await (await call('/admin/users', { headers: auth(admin) })).json()) as { users: { username: string }[] };
    expect(after.users.map((u) => u.username)).toEqual(['ana', 'iolo']);
  });

  it('changing your password signs out your other devices', async () => {
    const admin = await seedAdmin();
    await post('/admin/users', { username: 'dee', name: 'Dee', key: await stretch('dee', 'temp-pass-1') }, auth(admin));
    const a = ((await (await signIn('dee', 'temp-pass-1')).json()) as { token: string }).token;
    const b = ((await (await signIn('dee', 'temp-pass-1')).json()) as { token: string }).token;
    expect((await post('/auth/password', { current: await stretch('dee', 'nope'), next: await stretch('dee', 'my-own-pass') }, auth(a))).status).toBe(401);
    expect((await post('/auth/password', { current: await stretch('dee', 'temp-pass-1'), next: await stretch('dee', 'my-own-pass') }, auth(a))).status).toBe(200);
    expect((await call('/me', { headers: auth(a) })).status).toBe(200);
    expect((await call('/me', { headers: auth(b) })).status).toBe(401);
    const again = (await (await signIn('dee', 'my-own-pass')).json()) as { user: { mustChange: boolean } };
    expect(again.user.mustChange).toBe(false);
    await post('/auth/logout', {}, auth(a));
    expect((await call('/me', { headers: auth(a) })).status).toBe(401);
  });

  it('keeps each person’s data separate, with versions', async () => {
    const admin = await seedAdmin();
    await post('/admin/users', { username: 'eve', name: 'Eve', key: await stretch('eve', 'temp-pass-1') }, auth(admin));
    const eve = ((await (await signIn('eve', 'temp-pass-1')).json()) as { token: string }).token;
    const put = (token: string, base: number, data: string) => post('/me', { base, data, summary: { attempts: 3 } }, auth(token), 'PUT');
    expect(await (await call('/me', { headers: auth(eve) })).json()).toMatchObject({ v: 0, user: { username: 'eve' } });
    expect(await (await put(eve, 0, 'eve-1')).json()).toEqual({ v: 1 });
    expect((await put(eve, 0, 'stale')).status).toBe(409);
    expect(await (await put(admin, 0, 'iolo-1')).json()).toEqual({ v: 1 });
    expect(((await (await call('/me', { headers: auth(eve) })).json()) as { data: string }).data).toBe('eve-1');
    const { users } = (await (await call('/admin/users', { headers: auth(admin) })).json()) as { users: { username: string; summary: unknown }[] };
    expect(users.find((u) => u.username === 'eve')!.summary).toEqual({ attempts: 3 });
  });

  it('accepts an admin login made by the setup script', async () => {
    // @ts-expect-error -- plain JS helper shared with setup.sh
    const { storedPassword } = await import('../scripts/admin-hash.mjs');
    await env.DB.prepare('INSERT INTO users (username, name, pass, admin, must_change, disabled, created_at) VALUES (?, ?, ?, 1, 0, 0, 1)').bind('boss', 'Boss', storedPassword('boss', 'from-the-terminal')).run();
    const res = await signIn('boss', 'from-the-terminal');
    expect(res.status).toBe(200);
    expect(((await res.json()) as { user: { admin: boolean } }).user.admin).toBe(true);
  });

  it('allows the Authorization header across origins', async () => {
    const res = await call('/me', { method: 'OPTIONS' });
    expect(res.headers.get('access-control-allow-headers')).toContain('authorization');
    expect(res.headers.get('access-control-allow-methods')).toContain('DELETE');
  });
});
