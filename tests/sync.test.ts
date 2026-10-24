import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Attempt, CardRecord, Draft, SetRecord, Working } from '../src/storage/types';
import { incoming, isEmpty, outgoing, DRAFT_MAX_AGE, type Snapshot } from '../src/lib/sync-merge';

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


// ---------------------------------------------------------------- signed in: one login on two devices
type Row = { v: number; data: string } | null;
const cloud = { row: null as Row, summary: null as unknown, puts: 0, clashOnce: false };
const me = { id: 'u-sam', username: 'sam', name: 'Sam', admin: false, mustChange: false };

vi.mock('../src/lib/cloud', async (orig) => ({
  ...(await orig<typeof import('../src/lib/cloud')>()),
  cloudConfigured: true,
  cloudMe: () => me,
  onCloudMe: () => () => {},
  refreshMe: async () => me,
  pullProgress: async () => ({ v: cloud.row?.v ?? 0, data: cloud.row?.data ?? null }),
  pushProgress: async (base: number, payload: string, summary: unknown) => {
    cloud.puts++;
    if (cloud.clashOnce && cloud.row) {
      cloud.clashOnce = false;
      cloud.row = { ...cloud.row, v: cloud.row.v + 1 }; // another device saved in between
      return false;
    }
    if ((cloud.row?.v ?? 0) !== base) return false;
    cloud.row = { v: base + 1, data: payload };
    cloud.summary = summary;
    return true;
  },
}));

/** A fresh copy of the app's modules (own in-memory store and settings), as on another device. */
async function device(prefs: Record<string, unknown> = {}) {
  vi.resetModules();
  const ls = new Map<string, string>([[`mp.settings.v1:c-${me.id}`, JSON.stringify(prefs)], ['mp.cloud.me', JSON.stringify(me)]]);
  vi.stubGlobal('localStorage', { getItem: (k: string) => ls.get(k) ?? null, setItem: (k: string, v: string) => ls.set(k, v), removeItem: (k: string) => ls.delete(k) });
  const settings = await import('../src/lib/settings');
  settings.readSettings();
  const sync = await import('../src/lib/sync');
  const store = await (await import('../src/storage')).getStore();
  return { sync, store, settings };
}

describe('saving to your login', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('brings progress, preferences and past-paper marks to your other device, and tells the group your totals', async () => {
    cloud.row = null;
    const laptop = await device({ theme: 'dark', dailyGoal: 8, prefsAt: NOW - 1000 });
    await laptop.store.addAttempt({ ...attempt('a', Date.now() - 3000), working: ink });
    await laptop.store.putSetting('pastPaperResults', { '2024-06-1': { marks: { 1: 3 }, updatedAt: 5 } });
    await laptop.sync.syncNow();
    expect(cloud.summary).toMatchObject({ attempts: 1, marks: 3, scored: 1, streak: 1, week: { questions: 1 } });

    const ipad = await device();
    await ipad.sync.syncNow();
    expect((await ipad.store.allAttempts()).map((a) => a.templateId)).toEqual(['a']);
    expect((await ipad.store.allAttempts())[0].working).toBeUndefined(); // handwriting stays where it was drawn
    expect(ipad.settings.readSettings()).toMatchObject({ theme: 'dark', dailyGoal: 8 });
    expect(await ipad.store.getSetting('pastPaperResults', {})).toEqual({ '2024-06-1': { marks: { 1: 3 }, updatedAt: 5 } });
    expect(ipad.sync.syncStatus().message).toMatch(/progress from your other devices added/);

    // the iPad's own work, saved through a clash with another device
    await ipad.store.addAttempt(attempt('b', Date.now() - 1000));
    cloud.clashOnce = true;
    const before = cloud.puts;
    await ipad.sync.syncNow();
    expect(cloud.puts - before).toBe(2);

    await laptop.sync.syncNow();
    expect((await laptop.store.allAttempts()).map((a) => a.templateId).sort()).toEqual(['a', 'b']);
    // nothing new: nothing saved
    const now = cloud.puts;
    await laptop.sync.syncNow();
    expect(cloud.puts).toBe(now);
  });

  it('packs progress compressed and reads it back', async () => {
    const { pack, unpack } = await import('../src/lib/sync');
    const text = JSON.stringify({ x: 'y'.repeat(5000) });
    const packed = await pack(text);
    expect(packed.length).toBeLessThan(400);
    expect(await unpack(packed)).toBe(text);
  });

  it('keeps the newer marks for each past paper', async () => {
    const { mergePapers } = await import('../src/lib/sync');
    const a = { p1: { marks: { 1: 2 }, updatedAt: 10 }, p2: { marks: { 1: 5 }, updatedAt: 30 } };
    const b = { p1: { marks: { 1: 4 }, updatedAt: 20 }, p2: { marks: { 1: 1 }, updatedAt: 25 }, p3: { marks: { 2: 1 }, updatedAt: 1 } };
    expect(mergePapers(a, b)).toEqual({ p1: b.p1, p2: a.p2, p3: b.p3 });
  });
});
