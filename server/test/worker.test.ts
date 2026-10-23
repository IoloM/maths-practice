import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { handle } from '../src/index';
import type { Env } from '../src/env';
import { MODEL } from '../src/ai';
import { MAX_BAD_CODES } from '../src/limits';

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
