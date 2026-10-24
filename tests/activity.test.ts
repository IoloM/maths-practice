import { describe, expect, it } from 'vitest';
import { buildActivity } from '../src/lib/activity';
import type { Attempt, SetRecord } from '../src/storage/types';

const at = (templateId: string, chapter: string, finishedAt: number, score: number, marks = 4, extra: Partial<Attempt> = {}): Attempt =>
  ({ templateId, seed: 1, family: templateId, spec: [], chapter, difficulty: 1, mode: 'practice', startedAt: 0, finishedAt, durationMs: 120_000, marks, parts: [{ label: '', response: '1', auto: { score, max: marks, verdict: 'partial' }, self: null, hints: 0 }], gaveUp: false, ...extra }) as Attempt;

describe('what admins see of someone’s work', () => {
  const now = new Date(2026, 9, 24, 12);
  const t = now.getTime();
  const set: SetRecord = { id: 's1', kind: 'mock', title: 'Paper 1 mock', createdAt: t - 9e6, items: [{ templateId: 'p1.13.definite-polynomial', seed: 1 }], durationMin: 10, status: 'finished', finishedAt: t - 5e6 };
  const snap = {
    attempts: [at('p1.13.definite-polynomial', 'P1.13', t - 1000, 4), at('p1.13.definite-polynomial', 'P1.13', t - 2000, 2), at('sm1.7.binomial-test', 'SM1.7', t - 3000, 1), at('p1.13.definite-polynomial', 'P1.13', t - 5e6, 3, 4, { setId: 's1', mode: 'mock' })],
    drafts: [],
    cards: [],
    sets: [set],
  };
  const d = buildActivity(snap, { '2024-06-1': { marks: { 1: 3 }, updatedAt: t - 10, done: '2026-10-20' } }, now);

  it('totals, recent questions newest first, with titles and scores', () => {
    expect(d.totals).toMatchObject({ questions: 4, marks: 16, scored: 10, minutes: 8 });
    expect(d.recent[0]).toMatchObject({ chapter: 'P1.13', scored: 4, marks: 4 });
    expect(d.recent[0].title).not.toBe('p1.13.definite-polynomial'); // the question type's name
    expect(d.recent.map((r) => r.at)).toEqual([...d.recent.map((r) => r.at)].sort((a, b) => b - a));
  });
  it('chapters weakest first, past papers and mocks', () => {
    expect(d.chapters.map((c) => [c.chapter, c.questions, c.pct])).toEqual([
      ['SM1.7', 1, 25],
      ['P1.13', 3, 75],
    ]);
    expect(d.papers[0]).toMatchObject({ id: '2024-06-1', got: 3, done: '2026-10-20', complete: false });
    expect(d.sets[0]).toMatchObject({ title: 'Paper 1 mock', kind: 'mock', got: 3 });
  });
  it('carries no answers or working', () => {
    expect(JSON.stringify(d)).not.toContain('response');
    expect(JSON.stringify(d)).not.toContain('working');
  });
});
