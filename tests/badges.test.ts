import { describe, expect, it } from 'vitest';
import { earned } from '../src/lib/badges';
import type { Attempt } from '../src/storage/types';

const day = 86_400_000;
const t0 = new Date(2026, 9, 1, 12).getTime();
const at = (i: number, score: number, extra: Partial<Attempt> = {}): Attempt =>
  ({ templateId: `t${i}`, seed: 1, family: `t${i}`, spec: [], chapter: 'P1.2', difficulty: 2, mode: 'practice', startedAt: 0, finishedAt: t0 + i * 60_000, durationMs: 60_000, marks: 4, parts: [{ label: '', response: '1', auto: { score, max: 4, verdict: 'partial' }, self: null, hints: 0 }], gaveUp: false, ...extra }) as Attempt;
const ids = (a: Attempt[], papers = {}) => earned({ attempts: a, sets: [], papers }).map((b) => b.id);

describe('badges', () => {
  it('none to start with; the first question earns one', () => {
    expect(ids([])).toEqual([]);
    expect(ids([at(0, 0)])).toEqual(['first']);
  });
  it('ten full marks in a row, and a streak of days', () => {
    const run = Array.from({ length: 10 }, (_, i) => at(i, 4));
    expect(ids(run)).toContain('run10');
    expect(ids([...run.slice(0, 5), at(5, 1), ...run.slice(6)])).not.toContain('run10');
    const days = [0, 1, 2].map((d) => at(d, 1, { finishedAt: t0 + d * day }));
    expect(ids(days)).toContain('streak3');
    expect(ids([days[0], days[2]])).not.toContain('streak3');
  });
  it('a big question with full marks and no hints', () => {
    const big = { ...at(0, 10), marks: 10, parts: [{ label: '', response: '1', auto: { score: 10, max: 10, verdict: 'correct' }, self: null, hints: 0 }] } as Attempt;
    expect(ids([big])).toContain('big');
    expect(ids([{ ...big, parts: [{ ...big.parts[0], hints: 1 }] }])).not.toContain('big');
  });
  it('a whole real past paper', () => {
    expect(ids([], { '2019-06-1': { marks: { 1: 1 }, updatedAt: 1 } })).not.toContain('paper');
  });
});
