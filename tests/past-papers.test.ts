import { describe, expect, it } from 'vitest';
import { PAST_PAPERS, PAST_PAPER_BY_ID, PAST_QUESTIONS } from '../src/content/past-papers';
import { BANK } from '../src/content/bank-meta';

const families = new Set(BANK.templates.map((t) => t.family));

describe('past paper index', () => {
  it('has unique paper ids and official Pearson links', () => {
    expect(new Set(PAST_PAPERS.map((p) => p.id)).size).toBe(PAST_PAPERS.length);
    for (const p of PAST_PAPERS) {
      expect(p.qp).toMatch(/^https:\/\/qualifications\.pearson\.com\/.+\.pdf$/);
      expect(p.ms).toMatch(/^https:\/\/qualifications\.pearson\.com\/.+\.pdf$/);
    }
  });
  it.each(PAST_PAPERS.map((p) => [p.id, p] as const))('%s: questions numbered 1…n and marks add up to the paper total', (id, p) => {
    const qs = PAST_QUESTIONS.filter((q) => q.paper === id);
    expect(qs.map((q) => q.q)).toEqual(qs.map((_, i) => i + 1));
    const total = p.paper === '31' || p.paper === '32' ? 50 : 100;
    expect(qs.reduce((s, q) => s + q.marks, 0)).toBe(total);
  });
  it('every question belongs to a listed paper and maps to existing practice families', () => {
    for (const q of PAST_QUESTIONS) {
      expect(PAST_PAPER_BY_ID.has(q.paper), q.paper).toBe(true);
      expect(q.families.length).toBeGreaterThan(0);
      for (const f of q.families) expect(families.has(f), `${q.paper} Q${q.q}: ${f}`).toBe(true);
      expect(q.topic.length).toBeLessThan(110);
    }
  });
});
