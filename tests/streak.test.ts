import { describe, expect, it } from 'vitest';
import { doneToday, lastDays, streak, thisWeek } from '../src/lib/streak';
import type { Attempt } from '../src/storage/types';

const at = (y: number, m: number, d: number, h = 12, marks = 4, score = 3): Attempt =>
  ({ templateId: 't', seed: 1, family: 'f', spec: [], chapter: 'P1.1', difficulty: 1, mode: 'practice', startedAt: 0, finishedAt: new Date(y, m - 1, d, h).getTime(), durationMs: 1, marks, parts: [{ label: '', response: '1', auto: { score, max: marks, verdict: 'partial' }, self: null, hints: 0 }], gaveUp: false }) as Attempt;

describe('daily goal and streak', () => {
  const now = new Date(2026, 9, 24, 9, 0); // Saturday 24 Oct 2026, morning
  it('counts today’s questions', () => {
    expect(doneToday([at(2026, 10, 24, 8), at(2026, 10, 24, 8), at(2026, 10, 23, 23)], now)).toBe(2);
  });
  it('counts days in a row, and keeps yesterday’s streak while today is still to play for', () => {
    const run = [at(2026, 10, 21), at(2026, 10, 22), at(2026, 10, 23), at(2026, 10, 23, 18)];
    expect(streak(run, now)).toBe(3);
    expect(streak([...run, at(2026, 10, 24, 8)], now)).toBe(4);
    expect(streak([at(2026, 10, 20), at(2026, 10, 22)], now)).toBe(0); // missed yesterday
    expect(streak([], now)).toBe(0);
  });
  it('sums this week from Monday', () => {
    const w = thisWeek([at(2026, 10, 18, 20), at(2026, 10, 19, 7), at(2026, 10, 24, 8)], now);
    expect(w).toEqual({ start: '2026-10-19', questions: 2, marks: 8, scored: 6 });
  });
  it('gives the last fortnight for the streak strip', () => {
    const days = lastDays([at(2026, 10, 24, 8), at(2026, 10, 24, 9), at(2026, 10, 11)], 14, now);
    expect(days).toHaveLength(14);
    expect(days[0]).toEqual({ day: '2026-10-11', count: 1 });
    expect(days.at(-1)).toEqual({ day: '2026-10-24', count: 2 });
  });
});
