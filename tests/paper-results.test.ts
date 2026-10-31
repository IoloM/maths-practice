import { describe, expect, it } from 'vitest';
import { boundariesFor, finishedPapers, lossesByFamily, paperScore, questionsFor, type PaperResults } from '../src/lib/paper-results';
import { AS_LATEST, LATEST, predict } from '../src/lib/grades';

const ID = '2024-06-1';
const qs = questionsFor(ID);
const full = (f: (max: number) => number) => Object.fromEntries(qs.map((q) => [q.q, f(q.marks)]));

describe('marks on real past papers', () => {
  it('scores a partly marked paper on the questions marked so far', () => {
    const [a, b] = qs;
    const s = paperScore(ID, { marks: { [a.q]: a.marks, [b.q]: 0 }, updatedAt: 1 });
    expect(s).toMatchObject({ got: a.marks, of: a.marks + b.marks, max: 100, marked: 2, complete: false, grade: null });
  });

  it('grades a finished paper on its own year’s boundaries', () => {
    expect(boundariesFor(ID).series).toBe('June 2024');
    expect(boundariesFor('2019-06-1')).toBe(LATEST); // no boundaries kept for that year
    const top = paperScore(ID, { marks: full((m) => m), updatedAt: 1 });
    expect(top).toMatchObject({ got: 100, complete: true, grade: 'A*' });
    const none = paperScore(ID, { marks: full(() => 0), updatedAt: 1 });
    expect(none.grade).toBe('U');
  });

  it('counts only finished papers towards the predicted grade, newest first', () => {
    const results: PaperResults = {
      [ID]: { marks: full((m) => Math.floor(m * 0.8)), updatedAt: 200 },
      '2023-06-2': { marks: { 1: 3 }, updatedAt: 300 },
    };
    const done = finishedPapers(results);
    expect(done.map((d) => d.id)).toEqual([ID]);
    expect(done[0].of).toBe(100);
    const p = predict([...done.map((d) => ({ ...d, kind: 'paper' as const })), { got: 50, of: 100, finishedAt: 100, kind: 'mock' }]);
    expect(p).toMatchObject({ papers: 2, real: 1 });
  });

  it('grades AS papers on AS boundaries, and keeps them out of the A level prediction', () => {
    const as = '2024-06-as1';
    expect(boundariesFor(as)).toMatchObject({ series: 'June 2024', max: 160 });
    expect(boundariesFor('2019-06-as21')).toBe(AS_LATEST);
    const marks = Object.fromEntries(questionsFor(as).map((q) => [q.q, q.marks]));
    expect(paperScore(as, { marks, updatedAt: 1 })).toMatchObject({ got: 100, max: 100, complete: true, grade: 'A' });
    const results: PaperResults = { [as]: { marks, updatedAt: 300 }, [ID]: { marks: full((m) => m), updatedAt: 200 } };
    expect(finishedPapers(results).map((d) => d.id)).toEqual([as, ID]);
    expect(finishedPapers(results, true).map((d) => d.id)).toEqual([ID]);
  });

  it('shares dropped marks between the topics a question tests, worst first', () => {
    const q = qs.find((x) => x.families.length >= 2) ?? qs[0];
    const other = qs.find((x) => x !== q && !x.families.some((f) => q.families.includes(f)))!;
    const losses = lossesByFamily({ [ID]: { marks: { [q.q]: 0, [other.q]: other.marks }, updatedAt: 1 } });
    expect(losses.map((l) => l.family).sort()).toEqual([...q.families].sort());
    expect(losses.reduce((t, l) => t + l.lost, 0)).toBeCloseTo(q.marks);
    expect(losses.every((l) => !other.families.includes(l.family))).toBe(true); // full marks: nothing lost
  });
});

describe('why marks were lost', () => {
  it('shares each question’s dropped marks between the reasons given, worst first', async () => {
    const { lossesByReason } = await import('../src/lib/paper-results');
    const [a, b, c] = qs;
    const r = lossesByReason({
      [ID]: { marks: { [a.q]: 0, [b.q]: b.marks - 2, [c.q]: c.marks }, updatedAt: 1, reasons: { [a.q]: ['method', 'time'], [b.q]: ['careless'], [c.q]: ['careless'] } },
    });
    const by = Object.fromEntries(r.map((x) => [x.reason, x.lost]));
    expect(by.method).toBeCloseTo(a.marks / 2);
    expect(by.time).toBeCloseTo(a.marks / 2);
    expect(by.careless).toBeCloseTo(2); // full marks on c: nothing lost there
    expect(r[0].lost).toBeGreaterThanOrEqual(r.at(-1)!.lost);
  });
});
