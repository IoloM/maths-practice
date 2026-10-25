import { describe, expect, it } from 'vitest';
import { elapsed, mmss, moveTo, pace, paperMinutes, pause, resume, spentNow, start } from '../src/lib/sitting';
import { questionsFor } from '../src/lib/paper-results';

const ID = '2019-06-1';
const MIN = 60_000;

describe('sitting a past paper', () => {
  const qs = questionsFor(ID);
  it('has the exam’s time: 1.2 minutes a mark', () => {
    expect(paperMinutes(ID)).toBe(Math.round(qs.reduce((t, q) => t + q.marks, 0) * 1.2));
  });

  it('times each question as you move between them, and pausing stops the clock', () => {
    let s = start(ID, 0);
    expect(s.current).toBe(qs[0].q);
    s = moveTo(s, qs[1].q, 5 * MIN);
    s = moveTo(s, qs[0].q, 8 * MIN);
    s = pause(s, 10 * MIN);
    expect(elapsed(s, 60 * MIN)).toBe(10 * MIN);
    s = resume(s, 60 * MIN);
    expect(spentNow(s, 61 * MIN)).toEqual({ [qs[0].q]: 8 * MIN, [qs[1].q]: 3 * MIN });
  });

  it('says how far ahead or behind the exam pace you are', () => {
    const s = start(ID, 0);
    const aim = qs[0].marks * 1.2;
    expect(pace(s, 0)).toBeCloseTo(aim);
    expect(pace(s, (aim + 3) * MIN)).toBeCloseTo(-3);
  });

  it('shows times as a clock', () => {
    expect(mmss(65_000)).toBe('1:05');
    expect(mmss(3_725_000)).toBe('1:02:05');
    expect(mmss(-30_000)).toBe('−0:30');
  });
});
