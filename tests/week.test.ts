import { describe, expect, it } from 'vitest';
import { weekSummary } from '../src/lib/week';
import type { Attempt } from '../src/storage/types';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 10, 13, 12);
const at = (daysAgo: number, chapter: string, got: number, of = 4, min = 3): Attempt => ({
  templateId: 't',
  seed: 1,
  family: 'f',
  spec: ['P2.1'],
  chapter,
  difficulty: 2,
  mode: 'practice',
  startedAt: NOW - daysAgo * DAY - min * 60_000,
  finishedAt: NOW - daysAgo * DAY,
  durationMs: min * 60_000,
  marks: of,
  parts: [{ label: '', response: null, auto: { score: got, max: of, verdict: got === of ? 'correct' : 'partial' }, self: null, hints: 0 }],
  gaveUp: false,
});

describe('your week', () => {
  it('compares the last 7 days with the 7 before, and finds the best and weakest chapters', () => {
    const w = weekSummary([at(1, 'P1.1', 4), at(2, 'P1.1', 4), at(3, 'P1.2', 1), at(4, 'P1.2', 2), at(9, 'P1.1', 1), at(10, 'P1.1', 1), at(20, 'P1.1', 4)], NOW);
    expect(w.now).toEqual({ questions: 4, got: 11, of: 16, minutes: 12 });
    expect(w.before.questions).toBe(2);
    expect(w.change).toBe(Math.round((100 * 11) / 16) - 25);
    expect(w.best).toEqual({ chapter: 'P1.1', pct: 100 });
    expect(w.weakest).toEqual({ chapter: 'P1.2', pct: 38 });
  });
  it('has no change without last week, and no weakest chapter when only one was practised', () => {
    const w = weekSummary([at(1, 'P1.1', 2), at(2, 'P1.1', 3)], NOW);
    expect(w.change).toBeNull();
    expect(w.best?.chapter).toBe('P1.1');
    expect(w.weakest).toBeUndefined();
  });
});
