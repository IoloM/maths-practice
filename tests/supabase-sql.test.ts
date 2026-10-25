/**
 * The Supabase migration run in a real Postgres (PGlite), with stand-ins for the parts of Supabase
 * it relies on (auth.users, auth.uid(), the anon/authenticated roles and their default grants), to
 * check the security rules: who can read and write what.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

const SUPABASE_STANDINS = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`;

const dir = new URL('../supabase/migrations/', import.meta.url);
const migrations = readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(new URL(f, dir), 'utf8'));

const ADMIN = '00000000-0000-4000-8000-000000000001';
const ANA = '00000000-0000-4000-8000-000000000002';
const BEN = '00000000-0000-4000-8000-000000000003';
let db: PGlite;

/** Run as a signed-in person (or signed out with null), the way PostgREST does. */
async function as<T = Record<string, unknown>>(uid: string | null, sql: string, params: unknown[] = []): Promise<T[]> {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false); set role ${uid ? 'authenticated' : 'anon'};`);
  try {
    return (await db.query<T>(sql, params)).rows;
  } finally {
    await db.exec('reset role;');
  }
}
const fails = async (p: Promise<unknown>) => {
  let err: unknown = null;
  await p.catch((e) => (err = e));
  return err !== null;
};

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STANDINS);
  for (const m of migrations) await db.exec(m);
  // what the admin function does with the service role
  for (const [id, username, name, admin] of [
    [ADMIN, 'iolo', 'Iolo', true],
    [ANA, 'ana', 'Ana', false],
    [BEN, 'ben', 'Ben', false],
  ] as const) {
    await db.query('insert into auth.users (id) values ($1)', [id]);
    await db.query('insert into public.profiles (id, username, name, admin, must_change) values ($1, $2, $3, $4, false)', [id, username, name, admin]);
  }
}, 60_000);

describe('security rules', () => {
  it('signed-out visitors see nothing and can only ping', async () => {
    expect(await fails(as(null, 'select * from public.profiles'))).toBe(true);
    expect(await fails(as(null, 'select * from public.progress'))).toBe(true);
    expect(await fails(as(null, "select public.save_progress(0, 'x', '{}')"))).toBe(true);
    expect(await as(null, 'select public.ping() as p')).toEqual([{ p: 'ok' }]);
  });

  it('members see the group’s names, and change only their own name', async () => {
    expect((await as(ANA, 'select username from public.profiles order by username')).map((r) => r.username)).toEqual(['ana', 'ben', 'iolo']);
    await as(ANA, "update public.profiles set name = 'Ana B' where id = $1", [ANA]);
    await as(ANA, "update public.profiles set name = 'Hacked' where id = $1", [BEN]); // no rows: not hers
    expect(await fails(as(ANA, 'update public.profiles set admin = true where id = $1', [ANA]))).toBe(true);
    expect(await fails(as(ANA, "insert into public.profiles (id, username, name) values ($1, 'x', 'X')", [BEN]))).toBe(true);
    expect(await fails(as(ANA, 'delete from public.profiles where id = $1', [BEN]))).toBe(true);
    const rows = await as<{ id: string; name: string; admin: boolean }>(ADMIN, 'select id, name, admin from public.profiles order by username');
    expect(rows.map((r) => [r.name, r.admin])).toEqual([
      ['Ana B', false],
      ['Ben', false],
      ['Iolo', true],
    ]);
  });

  it('progress is private, versioned, and updates the group stats', async () => {
    expect(await as(ANA, "select public.save_progress(0, 'ana-1', '{\"attempts\": 3}') as v")).toEqual([{ v: 1 }]);
    expect(await as(ANA, "select public.save_progress(0, 'stale', '{}') as v")).toEqual([{ v: -1 }]);
    expect(await as(ANA, "select public.save_progress(1, 'ana-2', '{\"attempts\": 4}') as v")).toEqual([{ v: 2 }]);
    expect(await as(ANA, "select public.save_progress(1, 'stale', '{}') as v")).toEqual([{ v: -1 }]);
    expect(await as(ANA, 'select v, data from public.progress')).toEqual([{ v: 2, data: 'ana-2' }]);
    // nobody else can read or overwrite it, not even an admin
    expect(await as(BEN, 'select * from public.progress')).toEqual([]);
    expect(await as(ADMIN, 'select * from public.progress')).toEqual([]);
    await as(BEN, "update public.progress set data = 'hacked' where user_id = $1", [ANA]);
    expect(await as(ANA, 'select data from public.progress')).toEqual([{ data: 'ana-2' }]);
    // the group sees her stats, and last_seen moved
    expect(await as(BEN, 'select summary from public.stats where user_id = $1', [ANA])).toEqual([{ summary: { attempts: 4 } }]);
    expect(await fails(as(BEN, "update public.stats set summary = '{}' where user_id = $1 returning 1", [ANA]).then((r) => (r.length ? r : Promise.reject(new Error('no rows')))))).toBe(true);
    expect((await as<{ last_seen: unknown }>(ANA, 'select last_seen from public.profiles where id = $1', [ANA]))[0].last_seen).not.toBeNull();
  });

  it('only admins set work; everyone hands in their own results', async () => {
    const items = JSON.stringify([{ templateId: 'p1.13.definite-polynomial', seed: 3 }]);
    expect(await fails(as(ANA, "insert into public.assignments (title, items, duration_min, created_by) values ('x', $1, 10, $2)", [items, ANA]))).toBe(true);
    const [a] = await as<{ id: string }>(ADMIN, "insert into public.assignments (title, items, duration_min, due, created_by) values ('Integration', $1, 10, '2027-01-10', $2) returning id", [items, ADMIN]);
    expect((await as(BEN, 'select title from public.assignments')).map((r) => r.title)).toEqual(['Integration']);
    await as(ANA, 'insert into public.assignment_results (assignment_id, user_id, got, "of") values ($1, $2, 3, 4)', [a.id, ANA]);
    expect(await fails(as(ANA, 'insert into public.assignment_results (assignment_id, user_id, got, "of") values ($1, $2, 4, 4)', [a.id, BEN]))).toBe(true);
    expect(await fails(as(ANA, 'insert into public.assignment_results (assignment_id, user_id, got, "of") values ($1, $2, 9, 4)', [a.id, ANA]))).toBe(true);
    expect(await as(BEN, 'select user_id, got from public.assignment_results')).toEqual([{ user_id: ANA, got: 3 }]);
    expect(await fails(as(ANA, 'delete from public.assignments where id = $1 returning 1', [a.id]).then((r) => (r.length ? r : Promise.reject(new Error('no rows')))))).toBe(true);
    await as(ADMIN, 'delete from public.assignments where id = $1', [a.id]);
    expect(await as(BEN, 'select * from public.assignment_results')).toEqual([]);
  });

  it('keeps the last 20 saves of each person, out of everyone’s reach but the owner’s', async () => {
    await db.query('delete from public.progress where user_id = $1', [BEN]);
    await db.query('delete from public.progress_history where user_id = $1', [BEN]);
    let v = 0;
    for (let i = 1; i <= 25; i++) v = (await as<{ v: number }>(BEN, `select public.save_progress($1, 'ben-${i}', '{}') as v`, [v]))[0].v;
    const kept = (await db.query<{ v: number; data: string }>('select v, data from public.progress_history where user_id = $1 order by id', [BEN])).rows;
    expect(kept).toHaveLength(20);
    expect(kept[0]).toEqual({ v: 6, data: 'ben-6' });
    expect(kept.at(-1)).toEqual({ v: 25, data: 'ben-25' });
    expect(await fails(as(BEN, 'select * from public.progress_history'))).toBe(true);
    expect(await fails(as(ADMIN, 'select * from public.progress_history'))).toBe(true);
  });

  it('activity: you see your own, admins see everyone’s, other members see none', async () => {
    await as(ANA, `insert into public.activity (user_id, detail) values ($1, '{"recent": [1]}')`, [ANA]);
    await as(BEN, `insert into public.activity (user_id, detail) values ($1, '{"recent": [2]}')`, [BEN]);
    expect(await fails(as(ANA, `insert into public.activity (user_id, detail) values ($1, '{}')`, [ADMIN]))).toBe(true);
    expect((await as(ANA, 'select user_id from public.activity')).map((r) => r.user_id)).toEqual([ANA]);
    expect((await as(ADMIN, 'select user_id from public.activity order by user_id')).map((r) => r.user_id)).toEqual([ANA, BEN]);
    await as(ANA, `update public.activity set detail = '{"recent": [3]}' where user_id = $1`, [BEN]); // not hers: no rows
    expect((await as<{ detail: unknown }>(ADMIN, 'select detail from public.activity where user_id = $1', [BEN]))[0].detail).toEqual({ recent: [2] });
    expect(await fails(as(null, 'select * from public.activity'))).toBe(true);
  });

  it('the weekly target: everyone sees it, only admins set it', async () => {
    expect(await fails(as(ANA, 'insert into public.group_target (weekly_questions) values (30)'))).toBe(true);
    await as(ADMIN, 'insert into public.group_target (weekly_questions, updated_by) values (30, $1)', [ADMIN]);
    expect(await as(BEN, 'select weekly_questions from public.group_target')).toEqual([{ weekly_questions: 30 }]);
    await as(ANA, 'update public.group_target set weekly_questions = 1'); // not an admin: no rows
    expect(await as(BEN, 'select weekly_questions from public.group_target')).toEqual([{ weekly_questions: 30 }]);
    expect(await fails(as(ADMIN, 'insert into public.group_target (id, weekly_questions) values (2, 5)'))).toBe(true);
    expect(await fails(as(null, 'select * from public.group_target'))).toBe(true);
    await as(ADMIN, 'delete from public.group_target');
    expect(await as(ANA, 'select * from public.group_target')).toEqual([]);
  });

  it('a switched-off login loses access straight away', async () => {
    await db.query('update public.profiles set disabled = true where id = $1', [BEN]);
    expect(await as(BEN, 'select * from public.profiles')).toEqual([]);
    expect(await fails(as(BEN, "select public.save_progress(0, 'x', '{}')"))).toBe(true);
    await db.query('update public.profiles set disabled = false where id = $1', [BEN]);
  });
});
