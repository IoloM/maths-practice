/**
 * Every template × SEEDS seeds: generation, constraints, verify() (independent method),
 * canonical answer self-marks full, common errors ≠ correct, scheme totals, worked solution
 * contains the answer, no NaN/Infinity, every LaTeX string renders in KaTeX.
 */
import { describe, expect, it } from 'vitest';
import { ALL_TEMPLATES, BY_CHAPTER } from '../src/content/templates/all.gen';
import { generateInstance, validateInstance } from '../src/engine/templates/validate';
import { SPEC_BY_REF } from '../src/content/spec';
import { CHAPTER_BY_REF } from '../src/content/chapters';

const SEEDS = Number(process.env.TEMPLATE_SEEDS ?? 200);

describe('template metadata', () => {
  it('every template lives in the folder of its chapter (lazy loading depends on it)', () => {
    for (const [ch, ts] of Object.entries(BY_CHAPTER)) for (const t of ts) expect(t.chapter, t.id).toBe(ch);
  });
  it('ids are unique', () => {
    const ids = ALL_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  for (const t of ALL_TEMPLATES) {
    it(`${t.id} has valid metadata`, () => {
      expect(t.spec.length).toBeGreaterThan(0);
      for (const s of t.spec) expect(SPEC_BY_REF.has(s), `spec ${s}`).toBe(true);
      expect(CHAPTER_BY_REF.has(t.chapter), `chapter ${t.chapter}`).toBe(true);
      expect(t.marks).toBeGreaterThan(0);
      expect(t.time).toBeGreaterThan(0);
      expect(t.commands.length).toBeGreaterThan(0);
      expect([1, 2, 3, 4, 5]).toContain(t.difficulty);
    });
  }
});

describe.each(ALL_TEMPLATES.map((t) => [t.id, t] as const))('%s', (_id, t) => {
  it(`passes validation for ${SEEDS} seeds`, () => {
    const failures: string[] = [];
    const seen = new Set<string>();
    for (let seed = 1; seed <= SEEDS; seed++) {
      let problems: string[];
      try {
        const inst = generateInstance(t, seed);
        seen.add(JSON.stringify(inst.parts.map((p) => p.prompt)) + (inst.stem ?? '') + (inst.diagram?.svg ?? ''));
        problems = validateInstance(t, inst);
      } catch (e) {
        problems = [`generate threw: ${(e as Error).message}`];
      }
      if (problems.length) failures.push(`seed ${seed}: ${problems.join(' | ')}`);
      if (failures.length > 5) break;
    }
    expect(failures, failures.join('\n')).toEqual([]);
    // variety: enough distinct questions for the bank (≥ 20) with room to spare
    expect(seen.size).toBeGreaterThanOrEqual(Math.min(40, SEEDS));
  });
  it('is deterministic', () => {
    const a = generateInstance(t, 12345);
    const b = generateInstance(t, 12345);
    expect(JSON.stringify(a.parts.map((p) => [p.prompt, p.solution]))).toBe(JSON.stringify(b.parts.map((p) => [p.prompt, p.solution])));
  });
});
