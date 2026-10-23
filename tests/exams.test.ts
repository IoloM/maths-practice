import { describe, expect, it } from 'vitest';
import { daysUntil, upcomingExams } from '../src/lib/exams';

describe('exam countdown', () => {
  const now = new Date(2026, 9, 23, 22, 30); // 23 Oct 2026, late evening
  it('counts calendar days, whatever the time of day or clock change', () => {
    expect(daysUntil('2026-10-23', now)).toBe(0);
    expect(daysUntil('2026-10-24', now)).toBe(1);
    expect(daysUntil('2026-11-02', now)).toBe(10); // across the October clock change
    expect(daysUntil('2027-06-03', now)).toBe(223);
    expect(daysUntil('not a date', now)).toBeNull();
  });
  it('lists exams still to come, soonest first', () => {
    const list = upcomingExams({ '1': '2027-06-03', '2': '2027-06-10', '3': '2026-10-01' }, now);
    expect(list.map((e) => [e.id, e.days])).toEqual([
      ['1', 223],
      ['2', 230],
    ]);
    expect(upcomingExams({}, now)).toEqual([]);
  });
});
