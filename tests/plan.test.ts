import { describe, expect, it } from 'vitest';
import { buildPlan, focusTopic } from '../src/lib/plan';
import { fixedToday, isOpen, mistakesFrom } from '../src/lib/mistakes';
import { adaptiveLevel } from '../src/lib/session';
import { BANK } from '../src/content/bank-meta';
import type { Attempt, CardRecord } from '../src/storage/types';

const now = new Date(2026, 9, 24, 12);
const t = now.getTime();
const H = 3_600_000;
const at = (templateId: string, chapter: string, finishedAt: number, score: number, marks = 4, extra: Partial<Attempt> = {}): Attempt =>
  ({ templateId, seed: 1, family: templateId, spec: [], chapter, difficulty: 2, mode: 'practice', startedAt: 0, finishedAt, durationMs: 120_000, marks, parts: [{ label: '', response: '1', auto: { score, max: marks, verdict: 'partial', errorId: score < marks ? 'sign-error' : undefined }, self: null, hints: 0 }], gaveUp: false, ...extra }) as Attempt;
const base = { attempts: [] as Attempt[], cards: [] as CardRecord[], papers: {}, notes: {}, setWork: [], exams: [], now };

describe('mistake notebook', () => {
  const A = 'p1.13.definite-polynomial';
  it('keeps the latest wrong go at each question, and knows when it was put right', () => {
    const ms = mistakesFrom([at(A, 'P1.13', t - 48 * H, 1), at(A, 'P1.13', t - 30 * H, 2), at('x', 'P1.2', t - 20 * H, 0), at(A, 'P1.13', t - 2 * H, 4, 4, { seed: 7 })]);
    expect(ms.map((m) => [m.templateId, m.got])).toEqual([
      ['x', 0],
      [A, 2],
    ]);
    expect(ms[1]).toMatchObject({ errors: ['Sign error'], fixedAt: t - 2 * H });
    expect(ms[0].fixedAt).toBeNull();
    expect(fixedToday(ms, now)).toBe(1);
  });
  it('one you mark sorted leaves the list', () => {
    const [m] = mistakesFrom([at(A, 'P1.13', t - H, 1)]);
    expect(isOpen(m, {})).toBe(true);
    expect(isOpen(m, { [m.key]: { sorted: true, updatedAt: 1 } })).toBe(false);
  });
});

describe('today’s plan', () => {
  it('starts someone new on a topic they haven’t tried', () => {
    const plan = buildPlan(base);
    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({ path: '/practice', done: false });
  });

  it('puts set work first, then mistakes and the weakest topic, and ticks things off', () => {
    const attempts = [at('a', 'P1.2', t - 50 * H, 1), at('b', 'P1.2', t - 49 * H, 0), at('c', 'SM1.7', t - 48 * H, 4)];
    const plan = buildPlan({ ...base, attempts, setWork: [{ id: 'w1', title: 'Integration', due: '2026-10-25', minutes: 20 }] });
    expect(plan.map((p) => p.id)).toEqual(['work-w1', 'mistakes', 'focus-P1.2']);
    expect(plan[0].detail).toBe('Due tomorrow');
    // four questions on the weak topic today ticks it off
    const more = [1, 2, 3, 4].map((i) => at(`q${i}`, 'P1.2', t - i * 60_000, 1));
    expect(buildPlan({ ...base, attempts: [...attempts, ...more] }).find((p) => p.id === 'focus-P1.2')?.done).toBe(true);
  });

  it('asks for a timed paper when an exam is close, until one is done that week', () => {
    const plan = buildPlan({ ...base, exams: [{ label: 'Paper 1: Pure Mathematics 1', days: 12 }] });
    expect(plan.find((p) => p.id === 'paper')).toMatchObject({ detail: 'Paper 1 is in 12 days', done: false });
    const done = buildPlan({ ...base, exams: [{ label: 'Paper 1: Pure', days: 12 }], attempts: [at('a', 'P1.2', t - 24 * H, 4, 4, { mode: 'mock' })] });
    expect(done.find((p) => p.id === 'paper')?.done).toBe(true);
    expect(buildPlan({ ...base, exams: [{ label: 'Paper 1', days: 60 }] }).some((p) => p.id === 'paper')).toBe(false);
  });

  it('with nothing practised, real past-paper losses pick the topic', () => {
    const f = focusTopic([], { '2024-06-1': { marks: { 1: 0 }, updatedAt: 1 } });
    expect(f?.why).toMatch(/real papers/);
  });
});

describe('adaptive difficulty', () => {
  const pool = BANK.templates.filter((e) => e.chapter === 'P1.13');
  const ids = pool.map((e) => e.id);
  const go = (d: number, score: number, i: number) => ({ ...at(ids[i % ids.length], 'P1.13', t - i * 60_000, score), difficulty: d });
  it('starts at 2, climbs with full marks and drops with none', () => {
    expect(adaptiveLevel(pool, [])).toBe(2);
    const up = adaptiveLevel(pool, [go(3, 4, 0), go(3, 4, 1), go(2, 4, 2)]);
    expect(up).toBeGreaterThan(3.5);
    const down = adaptiveLevel(pool, [go(3, 0, 0), go(3, 0, 1), go(3, 1, 2)]);
    expect(down).toBeLessThan(2);
  });
  it('stays within the questions on offer', () => {
    const lo = Math.min(...pool.map((e) => e.difficulty));
    expect(adaptiveLevel(pool, [go(1, 0, 0), go(1, 0, 1)])).toBe(Math.max(1, lo));
  });
});
