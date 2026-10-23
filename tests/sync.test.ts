import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Attempt, CardRecord, Draft, SetRecord, Working } from '../src/storage/types';
import { incoming, isEmpty, outgoing, DRAFT_MAX_AGE, type Snapshot } from '../src/lib/sync-merge';
import { newSyncCode, normaliseCode, open, seal, syncKeys } from '../src/lib/sync';

const NOW = 1_800_000_000_000;
const ink: Working = { mode: 'write', strokes: [{ tool: 'pen', color: 'currentColor', size: 3, points: [1, 2, 0.5, 3, 4, 0.5] }], annotate: [], text: '', paper: 'squared', height: 900 };
const typed: Working = { ...ink, mode: 'type', text: 'x = 2' };

function attempt(templateId: string, finishedAt: number, extra: Partial<Attempt> = {}): Attempt {
  return {
    templateId,
    seed: 1,
    family: templateId,
    spec: ['P2.1'],
    chapter: 'P1.1',
    difficulty: 2,
    mode: 'practice',
    startedAt: finishedAt - 60_000,
    finishedAt,
    durationMs: 60_000,
    marks: 3,
    parts: [{ label: '', response: '2', auto: { score: 1, max: 3, verdict: 'partial' }, self: null, hints: 0 }],
    gaveUp: false,
    ...extra,
  };
}
const draft = (key: string, startedAt: number, updatedAt: number, working?: Working): Draft => ({ key, responses: {}, hints: {}, startedAt, updatedAt, working });
const card = (family: string, updatedAt: number): CardRecord => ({ family, card: { due: updatedAt }, updatedAt });
const set = (id: string, status: SetRecord['status'], working?: Record<number, Working>): SetRecord => ({ id, kind: 'mock', title: id, createdAt: 1, items: [], durationMin: 90, status, working });
const snap = (p: Partial<Snapshot> = {}): Snapshot => ({ attempts: [], drafts: [], cards: [], sets: [], ...p });

describe('merging another device’s progress', () => {
  it('adds attempts it hasn’t seen, once, without the other device’s ids', () => {
    const local = snap({ attempts: [{ ...attempt('a', NOW - 5000), id: 1 }] });
    const remote = snap({ attempts: [{ ...attempt('a', NOW - 5000), id: 9 }, { ...attempt('b', NOW - 4000), id: 10 }, { ...attempt('b', NOW - 4000), id: 11 }] });
    const c = incoming(local, remote, NOW);
    expect(c.addAttempts.map((a) => a.templateId)).toEqual(['b']);
    expect(c.addAttempts[0].id).toBeUndefined();
    expect(c.updateAttempts).toEqual([]);
  });

  it('takes self-marking done on the other device, keeping this device’s id and handwriting', () => {
    const local = snap({ attempts: [{ ...attempt('a', NOW - 5000), id: 4, working: ink }] });
    const marked = attempt('a', NOW - 5000, { parts: [{ label: '', response: '2', auto: { score: 1, max: 3, verdict: 'partial' }, self: { score: 2, ticks: [0, 1] }, hints: 0 }] });
    const c = incoming(local, snap({ attempts: [{ ...marked, id: 77 }] }), NOW);
    expect(c.updateAttempts).toHaveLength(1);
    expect(c.updateAttempts[0].id).toBe(4);
    expect(c.updateAttempts[0].working).toEqual(ink);
    expect(c.updateAttempts[0].parts[0].self?.score).toBe(2);
    // and not the other way round
    expect(incoming(snap({ attempts: [{ ...marked, id: 4 }] }), snap({ attempts: [attempt('a', NOW - 5000)] }), NOW).updateAttempts).toEqual([]);
  });

  it('keeps the newest draft and drops drafts for questions finished since', () => {
    const local = snap({
      drafts: [draft('q1:1', NOW - 9000, NOW - 8000), draft('q2:1', NOW - 9000, NOW - 8000), draft('q3:1', NOW - 9000, NOW - 8000)],
    });
    const remote = snap({
      // q2 was finished on the other device after this device's draft was started
      attempts: [attempt('q2', NOW - 1000)],
      drafts: [draft('q1:1', NOW - 9000, NOW - 2000), draft('q3:1', NOW - 9000, NOW - 9500), draft('q4:1', NOW - 3000, NOW - 2500), draft('old:1', 0, NOW - DRAFT_MAX_AGE - 1)],
    });
    const c = incoming(local, remote, NOW);
    expect(c.putDrafts.map((d) => d.key)).toEqual(['q1:1', 'q4:1']);
    expect(c.deleteDrafts).toEqual(['q2:1']);
  });

  it('keeps the newest review card and the most advanced mock', () => {
    const local = snap({ cards: [card('f1', 100), card('f2', 300)], sets: [set('s1', 'running', { 0: ink }), set('s2', 'finished')] });
    const remote = snap({ cards: [card('f1', 200), card('f2', 250), card('f3', 50)], sets: [set('s1', 'finished'), set('s2', 'running'), set('s3', 'new')] });
    const c = incoming(local, remote, NOW);
    expect(c.putCards.map((x) => x.family)).toEqual(['f1', 'f3']);
    expect(c.putSets.map((x) => x.id)).toEqual(['s1', 's3']);
    // a mock finished elsewhere keeps the handwriting drawn here
    expect(c.putSets[0].working).toEqual({ 0: ink });
  });

  it('has nothing to do when both sides match', () => {
    const s = snap({ attempts: [attempt('a', NOW - 1)], cards: [card('f', 1)], sets: [set('s', 'new')] });
    expect(isEmpty(incoming(s, structuredClone(s), NOW))).toBe(true);
  });

  it('uploads typed working but not handwriting, ids or old drafts, in a stable order', () => {
    const out = outgoing(
      snap({
        attempts: [{ ...attempt('b', NOW - 1), id: 2, working: ink }, { ...attempt('a', NOW - 2), id: 1, working: typed }],
        drafts: [draft('d:1', NOW - 10, NOW - 5, ink), draft('old:1', 0, NOW - DRAFT_MAX_AGE - 1)],
        sets: [set('s', 'finished', { 0: ink, 1: typed })],
      }),
      NOW,
    );
    expect(out.attempts.map((a) => a.templateId)).toEqual(['a', 'b']);
    expect(out.attempts.every((a) => a.id === undefined)).toBe(true);
    expect(out.attempts[0].working).toEqual({ ...typed, strokes: [], annotate: [] });
    expect(out.attempts[1].working).toBeUndefined();
    expect(out.drafts.map((d) => d.key)).toEqual(['d:1']);
    expect(out.drafts[0].working).toBeUndefined();
    expect(out.sets[0].working).toEqual({ 1: { ...typed, strokes: [], annotate: [] } });
  });
});

describe('sync codes and encryption', () => {
  it('makes 20-character codes that survive being retyped', () => {
    const code = newSyncCode();
    expect(code).toMatch(/^[2-9A-HJ-NP-Z]{4}(-[2-9A-HJ-NP-Z]{4}){4}$/);
    expect(normaliseCode(code.toLowerCase().replace(/-/g, ' '))).toBe(code);
    expect(normaliseCode('ABCD-EFGH-IJKL-MNOP-QRST')).toBeNull(); // I and O are never used
    expect(normaliseCode('ABCD')).toBeNull();
    expect(newSyncCode()).not.toBe(code);
  });

  it('round-trips data, and the wrong code can’t read it', async () => {
    const a = await syncKeys(newSyncCode());
    const b = await syncKeys(newSyncCode());
    expect(a.id).toMatch(/^[0-9a-f]{64}$/);
    expect(a.id).not.toBe(b.id);
    const text = JSON.stringify({ hello: 'world', n: [1, 2, 3], long: 'x'.repeat(5000) });
    const sealed = await seal(a.key, text);
    expect(sealed).not.toContain('hello');
    expect(sealed.length).toBeLessThan(text.length / 4); // gzipped first
    expect(await open(a.key, sealed)).toBe(text);
    await expect(open(b.key, sealed)).rejects.toThrow(/check the sync code/);
  });
});

// ---------------------------------------------------------------- two devices through a fake server
interface Row {
  v: number;
  data: string;
}
const server = { rows: new Map<string, Row>(), puts: 0, conflictOnce: false };
function fakeFetch(input: string | URL | Request, init: RequestInit = {}): Promise<Response> {
  const url = new URL(String(input));
  const id = url.pathname.split('/')[2];
  const row = server.rows.get(id);
  const res = (status: number, body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status }));
  if (init.method === 'PUT') {
    server.puts++;
    const { base, data } = JSON.parse(String(init.body)) as { base: number; data: string };
    if (server.conflictOnce && row) {
      server.conflictOnce = false;
      row.v++; // another device wrote in between
      return res(409, { v: row.v });
    }
    if ((row?.v ?? 0) !== base) return res(409, { v: row?.v ?? 0 });
    server.rows.set(id, { v: base + 1, data });
    return res(200, { v: base + 1 });
  }
  return row ? res(200, row) : res(404, { v: 0 });
}

/** A fresh copy of the app's modules (its own in-memory store and settings), as on another device. */
async function device(syncCode: string) {
  vi.resetModules();
  const ls = new Map<string, string>([['mp.settings.v1', JSON.stringify({ syncCode, apiUrl: 'https://api.test' })]]);
  vi.stubGlobal('localStorage', { getItem: (k: string) => ls.get(k) ?? null, setItem: (k: string, v: string) => ls.set(k, v), removeItem: (k: string) => ls.delete(k) });
  const settings = await import('../src/lib/settings');
  settings.readSettings(); // this device's settings, read once
  const sync = await import('../src/lib/sync');
  const store = await (await import('../src/storage')).getStore();
  return { sync, store };
}

describe('syncing two devices', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('brings each device’s attempts to the other, and retries after a clash', async () => {
    vi.stubGlobal('fetch', fakeFetch);
    const code = newSyncCode();
    const phone = await device(code);
    await phone.store.addAttempt({ ...attempt('a', NOW - 3000), working: ink });
    await phone.store.addAttempt(attempt('b', NOW - 2000));
    await phone.sync.syncNow();
    expect(server.rows.size).toBe(1);
    const stored = [...server.rows.values()][0].data;
    expect(stored).not.toContain('"templateId"');

    const ipad = await device(code);
    await ipad.sync.syncNow();
    expect((await ipad.store.allAttempts()).map((a) => a.templateId)).toEqual(['a', 'b']);
    expect((await ipad.store.allAttempts())[0].working).toBeUndefined(); // handwriting stays on the phone
    await ipad.store.addAttempt(attempt('c', NOW - 1000));
    const putsBefore = server.puts;
    server.conflictOnce = true;
    await ipad.sync.syncNow();
    expect(server.puts - putsBefore).toBe(2);
    expect(ipad.sync.syncStatus().state).toBe('idle');

    await phone.sync.syncNow();
    const onPhone = await phone.store.allAttempts();
    expect(onPhone.map((a) => a.templateId)).toEqual(['a', 'b', 'c']);
    expect(onPhone[0].working).toEqual(ink);

    // nothing new: no upload
    const putsNow = server.puts;
    await phone.sync.syncNow();
    expect(server.puts).toBe(putsNow);
  });

  it('a different code is a different, unreadable row', async () => {
    vi.stubGlobal('fetch', fakeFetch);
    const other = await device(newSyncCode());
    await other.sync.syncNow();
    expect(await other.store.allAttempts()).toEqual([]);
  });
});
