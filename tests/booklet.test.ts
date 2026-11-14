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

describe('booklet marks count like any other question', () => {
  it('every section counts towards a real topic in the app, and parts add up to the marks', async () => {
    const { BANK } = await import('../src/content/bank-meta');
    const families = new Set(BANK.templates.map((t) => t.family));
    for (const s of BOOKLET) {
      expect(families.has(s.family), `${s.id} → ${s.family}`).toBe(true);
      for (const q of s.questions) if (q.marks) expect(q.parts.reduce((t, p) => t + p.marks, 0), q.id).toBe(q.marks);
    }
    expect(BOOKLET_QUESTION.get('1.1:1')!.parts).toEqual([
      { label: 'a', marks: 3 },
      { label: 'b', marks: 3 },
    ]);
  });
  it('makes an attempt with your marks as self-marks, in the right chapter and topic', async () => {
    const { bookletAttempt, fullyMarked, totalMarks } = await import('../src/lib/booklet');
    const { scoreOf } = await import('../src/progress/mastery');
    const s = BOOKLET[0],
      q = s.questions[0];
    const w = { answer: '', answers: { a: '16 − 4√5', b: '4 − √5' }, marks: { a: 3, b: 1 }, updatedAt: 1 };
    expect(fullyMarked(q, w)).toBe(true);
    expect(fullyMarked(q, { ...w, marks: { a: 3 } })).toBe(false);
    expect(totalMarks(q, w)).toBe(4);
    const a = bookletAttempt(s, q, w, { startedAt: 1, finishedAt: 2, durationMs: 60_000 });
    expect(a).toMatchObject({ templateId: 'astbury:1.1:1', chapter: 'P1.1', family: 'p1.1.indices', mode: 'booklet', marks: 6 });
    expect(a.spec.length).toBeGreaterThan(0);
    expect(scoreOf(a)).toBe(4);
    expect(a.parts.map((p) => p.response)).toEqual(['16 − 4√5', '4 − √5']);
  });
  it('titles and links booklet questions, and bank questions as before', async () => {
    const { questionHref, questionTitle } = await import('../src/lib/question-link');
    expect(questionTitle('astbury:1.12-modelling:2')).toBe('Mr Astbury 1.12 Differentiation: Modelling: question 2');
    expect(questionHref('astbury:1.12-modelling:2', 0)).toContain('#/booklet/1.12-modelling/2');
    expect(questionHref('p1.1.simplify-index-laws', 7)).toContain('#/q/p1.1.simplify-index-laws/7');
  });
});
