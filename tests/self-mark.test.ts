import { describe, expect, it } from 'vitest';
import { awardable, dependencies, kindOf, selfAvailable, selfScore, toggleTick } from '../src/lib/self-mark';
import type { SchemeLine } from '../src/engine/marking/types';

const L = (...codes: string[]): SchemeLine[] => codes.map((code) => ({ code, text: code }));

describe('self-marking', () => {
  it('knows the kinds of mark', () => {
    expect(['M1', 'dM1', 'A1', 'A1ft', 'A1*', 'B1', 'B1ft', 'M2', 'B2'].map(kindOf)).toEqual(['M', 'dM', 'A', 'Aft', 'Acso', 'B', 'Bft', 'M', 'B']);
  });

  it('accuracy and dependent method marks hang on the method mark before them', () => {
    expect(dependencies(L('M1', 'A1', 'dM1', 'A1', 'B1'))).toEqual([null, 0, 0, 2, null]);
    expect(dependencies(L('B1', 'A1'))).toEqual([null, null]);
    expect(dependencies(L('M1', 'A1', 'M1', 'A1'))).toEqual([null, 0, null, 2]);
  });

  it('the final answer mark is the checker’s, unless the answer can’t be checked', () => {
    const s = L('M1', 'A1', 'M1', 'A1');
    expect(awardable(s)).toEqual([true, true, true, false]);
    expect(selfAvailable(s)).toBe(3);
    expect(awardable(s, true)).toEqual([true, true, true, true]);
    expect(selfAvailable(s, true)).toBe(4);
  });

  it('ticking an accuracy mark gives its method mark; unticking a method mark takes its accuracy marks', () => {
    const s = L('M1', 'A1', 'dM1', 'A1', 'A1');
    let t = toggleTick(s, [], 3, true);
    expect(t).toEqual([true, false, true, true, false]);
    expect(selfScore(s, t)).toBe(3);
    t = toggleTick(s, t, 0, false);
    expect(t).toEqual([false, false, false, false, false]);
    // the final mark can't be ticked
    expect(toggleTick(s, [], 4, true)).toEqual([false, false, false, false, false]);
  });

  it('marks whose method mark is missing don’t count, whatever was saved', () => {
    const s = L('M1', 'A1', 'B1', 'A1');
    expect(selfScore(s, [false, true, true, false])).toBe(1);
    expect(selfScore(L('M2', 'A1', 'A1'), [true, true, false])).toBe(3);
  });

  it('a proof can be self-marked in full', () => {
    const s: SchemeLine[] = [...L('M1', 'M1'), { code: 'A1*', text: '', final: true }];
    expect(selfScore(s, [true, true, true], true)).toBe(3);
    expect(selfScore(s, [true, true, true])).toBe(2);
  });
});
