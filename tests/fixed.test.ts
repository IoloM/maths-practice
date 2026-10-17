/** Fixed questions: metadata, rendering (KaTeX), scheme totals, choice answers, and the 150-question floor. */
import { describe, expect, it } from 'vitest';
import { FIXED } from '../src/content/fixed/index';
import { fixedToTemplate } from '../src/content/fixed/adapter';
import { generateInstance, validateInstance } from '../src/engine/templates/validate';
import { SPEC_BY_REF } from '../src/content/spec';
import { CHAPTER_BY_REF } from '../src/content/chapters';
import { ALL_TEMPLATES } from '../src/content/templates/all.gen';

const MIN_FIXED = Number(process.env.MIN_FIXED ?? 150);

describe('fixed questions', () => {
  it(`there are at least ${MIN_FIXED}`, () => expect(FIXED.length).toBeGreaterThanOrEqual(MIN_FIXED));
  it('ids are unique, prefixed fx., and do not clash with templates', () => {
    const ids = FIXED.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id.startsWith('fx.'), id).toBe(true);
    const tids = new Set(ALL_TEMPLATES.map((t) => t.id));
    for (const id of ids) expect(tids.has(id), id).toBe(false);
  });
  for (const f of FIXED) {
    it(`${f.id} is valid`, () => {
      for (const s of f.spec) expect(SPEC_BY_REF.has(s), `spec ${s}`).toBe(true);
      expect(CHAPTER_BY_REF.has(f.chapter), `chapter ${f.chapter}`).toBe(true);
      expect(f.hints?.length).toBe(3);
      const t = fixedToTemplate(f);
      const inst = generateInstance(t, 0);
      const problems = validateInstance(t, inst);
      expect(problems, problems.join('\n')).toEqual([]);
    });
  }
});
