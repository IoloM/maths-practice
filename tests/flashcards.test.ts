import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { DECKS, FLASHCARDS } from '../src/content/flashcards';
import { CALCULATOR } from '../src/content/calculator';

/** Every $…$ segment must typeset without errors. */
function renders(src: string): string[] {
  const bad: string[] = [];
  for (const m of src.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g)) {
    try {
      katex.renderToString(m[1] ?? m[2], { throwOnError: true, strict: 'error' });
    } catch (e) {
      bad.push(`${m[0]}: ${(e as Error).message}`);
    }
  }
  if ((src.match(/(?<!\\)\$/g) ?? []).length % 2) bad.push(`unbalanced $ in ${src}`);
  return bad;
}

describe('flashcards', () => {
  it('ids are unique and every deck has cards', () => {
    expect(new Set(FLASHCARDS.map((c) => c.id)).size).toBe(FLASHCARDS.length);
    for (const d of DECKS) expect(FLASHCARDS.filter((c) => c.deck === d.id).length).toBeGreaterThan(20);
  });
  it.each(FLASHCARDS.map((c) => [c.id, c] as const))('%s typesets', (_id, c) => {
    expect([...renders(c.front), ...renders(c.back)]).toEqual([]);
    expect(c.front.trim() && c.back.trim()).toBeTruthy();
  });
});

describe('calculator tips', () => {
  it('typeset', () => {
    expect(CALCULATOR.flatMap((s) => s.points.flatMap(renders))).toEqual([]);
  });
});
