/** Dashboard statistics. */
import { describe, expect, it } from 'vitest';
import type { Attempt } from '../src/storage/types';
import { frequentErrors, humanise, minutesPerMark, specMastery, weekStart, weeklyTrend } from '../src/progress/stats';

const DAY = 24 * 3600 * 1000;
function att(o: Partial<Attempt> & { score: number; at: number }): Attempt {
  const marks = o.marks ?? 4;
  return {
    templateId: o.templateId ?? 't1', seed: 1, family: 'f', spec: o.spec ?? ['P8.1'], chapter: o.chapter ?? 'P1.13', difficulty: 3, mode: 'practice',
    startedAt: o.at - 60_000, finishedAt: o.at, durationMs: o.durationMs ?? 4 * 60_000, marks,
    parts: [{ label: '', response: null, auto: { score: o.score, max: marks, verdict: o.score === marks ? 'correct' : 'partial', errorId: o.parts?.[0]?.auto?.errorId }, self: null, hints: 0 }],
    gaveUp: false,
  };
}

describe('dashboard statistics', () => {
  const now = new Date(2026, 9, 22, 12).getTime(); // Thursday
  it('week starts on Monday', () => {
    expect(new Date(weekStart(now)).getDay()).toBe(1);
    expect(weekStart(now)).toBeLessThanOrEqual(now);
    expect(now - weekStart(now)).toBeLessThan(7 * DAY);
  });
  it('weekly trend buckets attempts and leaves empty weeks null', () => {
    const t = weeklyTrend([att({ score: 2, at: now }), att({ score: 4, at: now - DAY }), att({ score: 1, at: now - 14 * DAY })], 4, now);
    expect(t).toHaveLength(4);
    expect(t[3].attempts).toBe(2);
    expect(t[3].pct).toBeCloseTo(6 / 8);
    expect(t[2].pct).toBeNull();
    expect(t[1].pct).toBeCloseTo(1 / 4);
  });
  it('spec mastery counts every spec point of a question', () => {
    const m = specMastery([att({ score: 4, at: now, spec: ['P8.1', 'P8.3'] })]);
    expect(m.get('P8.1')?.attempts).toBe(1);
    expect(m.get('P8.3')?.mastery).toBeCloseTo(1);
  });
  it('minutes per mark ignores questions left open for hours', () => {
    const m = minutesPerMark([att({ score: 4, at: now, durationMs: 4 * 60_000 }), att({ score: 4, at: now, durationMs: 5 * 3600_000 })], () => 'Pure');
    expect(m.get('Pure')?.mpm).toBeCloseTo(1);
  });
  it('frequent errors are counted and sorted', () => {
    const e = (id: string) => att({ score: 1, at: now, parts: [{ label: '', response: null, auto: { score: 1, max: 4, verdict: 'partial', errorId: id }, self: null, hints: 0 }] });
    const f = frequentErrors([e('no-c'), e('no-c'), e('sign')]);
    expect(f[0]).toMatchObject({ errorId: 'no-c', count: 2 });
    expect(humanise('sign-error')).toBe('Sign error');
  });
});
