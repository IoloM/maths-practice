import { describe, expect, it } from 'vitest';
import { plain, search } from '../src/lib/search';

describe('search', () => {
  it('finds topics, question types, past papers and formulae', () => {
    expect(search('integration by parts')[0].title.toLowerCase()).toContain('by parts');
    expect(search('hypothesis').some((h) => h.kind === 'Topic' || h.kind === 'Question type')).toBe(true);
    expect(search('projectile').some((h) => h.kind === 'Past paper')).toBe(true);
    expect(search('newton raphson').some((h) => h.kind === 'Formula')).toBe(true);
    expect(search('chain rule').some((h) => h.kind === 'Flashcard')).toBe(true);
  });
  it('pages come first when they match', () => {
    expect(search('mistake')[0]).toMatchObject({ kind: 'Page', path: '/mistakes' });
    expect(search('booklet')[0]).toMatchObject({ kind: 'Page', query: { tab: 'booklet' } });
  });
  it('every word has to match', () => {
    expect(search('binomial zzzz')).toEqual([]);
    expect(search('   ')).toEqual([]);
  });
  it('reads maths as words', () => {
    expect(plain(String.raw`$\sin\theta \approx \theta$`)).toBe('sin theta approx theta');
  });
});
