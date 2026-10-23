import { describe, expect, it } from 'vitest';
import { BOUNDARIES, LATEST, gradeFor, predict } from '../src/lib/grades';

describe('grade boundaries', () => {
  it('are ordered A* > A > … > E in every series', () => {
    for (const b of BOUNDARIES) {
      const m = Object.values(b.marks);
      expect(m).toEqual([...m].sort((x, y) => y - x));
      expect(b.max).toBe(300);
    }
  });
  it('June 2026 matches Pearson', () => expect(LATEST.marks).toEqual({ 'A*': 254, A: 210, B: 173, C: 136, D: 100, E: 64 }));
  it('maps a score to a grade at the boundary', () => {
    expect(gradeFor(254 / 300)).toBe('A*');
    expect(gradeFor(253 / 300)).toBe('A');
    expect(gradeFor(136 / 300)).toBe('C');
    expect(gradeFor(0.1)).toBe('U');
  });
});

describe('predict', () => {
  const day = 86_400_000;
  it('needs at least one mock', () => expect(predict([])).toBeNull());
  it('uses the most recent papers up to 300 marks', () => {
    const old = { got: 10, of: 100, finishedAt: 1 * day };
    const recent = [70, 75, 80].map((got, i) => ({ got, of: 100, finishedAt: (10 + i) * day }));
    const p = predict([old, ...recent])!;
    expect(p.papers).toBe(3);
    expect(p.frac).toBeCloseTo(0.75);
    expect(p.grade).toBe('A'); // 225/300 ⩾ 210
    expect(p.next?.grade).toBe('A*');
    expect(p.next!.gap).toBeCloseTo(254 / 300 - 0.75);
  });
  it('reports the spread of grades across the recent years', () => {
    const p = predict([{ got: 245, of: 300, finishedAt: 1 }])!;
    expect(p.range).toEqual(['A', 'A*']); // A* only on the 2023 boundaries (244)
  });
});
