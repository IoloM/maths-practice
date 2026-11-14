import { describe, expect, it } from 'vitest';
import { BOOKLET, BOOKLET_PAGES, BOOKLET_QUESTION, SOLUTIONS_PAGES } from '../src/content/astbury';
import { mergeBooklet, outgoingBooklet, sectionProgress, type BookletWorks } from '../src/lib/booklet';
import type { Working } from '../src/storage/types';

const working = (text: string, strokes = 0): Working => ({ mode: 'write', strokes: Array.from({ length: strokes }, () => ({ tool: 'pen' as const, color: 'currentColor', size: 3, points: [0, 0, 0.5, 10, 10, 0.5] })), annotate: [], text, paper: 'squared', height: 900 });

describe("Mr Astbury's booklet map", () => {
  it('has 48 sections and 250 questions, in page order, inside the booklets', () => {
    expect(BOOKLET).toHaveLength(48);
    const qs = BOOKLET.flatMap((s) => s.questions);
    expect(qs).toHaveLength(250);
    expect(new Set(BOOKLET.map((s) => s.id)).size).toBe(48);
    let lastPage = 0,
      lastSol = 0;
    for (const q of qs) {
      expect(q.page, q.id).toBeGreaterThan(lastPage);
      expect(q.page + q.pages - 1).toBeLessThanOrEqual(BOOKLET_PAGES);
      expect(q.solPage, q.id).toBeGreaterThanOrEqual(lastSol);
      expect(q.solPage + q.solPages - 1).toBeLessThanOrEqual(SOLUTIONS_PAGES);
      expect(q.marks === null || q.marks > 0).toBe(true);
      lastPage = q.page + q.pages - 1;
      lastSol = q.solPage;
    }
    expect(BOOKLET_QUESTION.get('1.1:1')).toMatchObject({ page: 5, marks: 6, source: 'UK – Jan 2010 – C1 – Q2' });
  });
  it('links every section to a chapter of this app', () => {
    for (const s of BOOKLET) expect(s.chapter).toMatch(/^P[12]\.\d+$/);
  });
});

describe('booklet work', () => {
  const s = BOOKLET[0];
  it('counts a chapter done when every question is', () => {
    const works: BookletWorks = Object.fromEntries(s.questions.map((q, i) => [q.id, { answer: 'x', done: 1000 + i, score: q.marks ?? undefined, updatedAt: 1 }]));
    const p = sectionProgress(works, s);
    expect(p).toMatchObject({ done: s.questions.length, total: s.questions.length, complete: true, finishedAt: 1000 + s.questions.length - 1 });
    expect(p.got).toBe(p.of);
    delete works[s.questions[3].id];
    expect(sectionProgress(works, s).complete).toBe(false);
  });
  it('syncs everything but handwriting, and never loses this device’s handwriting to a newer copy without it', () => {
    const local: BookletWorks = { a: { answer: 'old', working: working('typed', 3), updatedAt: 1 }, b: { answer: 'mine', updatedAt: 5 } };
    const out = outgoingBooklet(local);
    expect(out.a.working!.strokes).toEqual([]);
    expect(out.a.working!.text).toBe('typed');
    const remote: BookletWorks = { a: { answer: 'new', working: working('typed more'), done: 9, updatedAt: 2 }, b: { answer: 'theirs', updatedAt: 4 }, c: { answer: 'other device', updatedAt: 3 } };
    const m = mergeBooklet(local, remote);
    expect(m.a).toMatchObject({ answer: 'new', done: 9 });
    expect(m.a.working!.text).toBe('typed more');
    expect(m.a.working!.strokes).toHaveLength(3);
    expect(m.b.answer).toBe('mine');
    expect(m.c.answer).toBe('other device');
  });
});
