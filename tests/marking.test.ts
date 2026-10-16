/** Marking engine: equivalent / non-equivalent answer pairs (expanded to ≥ 300 in Phase 2). */
import { describe, expect, it } from 'vitest';
import { compare } from '../src/engine/marking/compare';
import { ans } from '../src/engine/templates/helpers';
import { parseExpr } from '../src/engine/marking/parse';
import { num, sym } from '../src/engine/core/expr';
import { Q } from '../src/engine/core/rational';

const E = (s: string) => parseExpr(s);
const ok = (spec: Parameters<typeof compare>[0], r: Parameters<typeof compare>[1]) => compare(spec, r).status;

describe('integrals', () => {
  const spec = ans.integral(E('x^3/3 + 2x'));
  it.each([
    ['\\frac{x^3}{3}+2x+c', 'correct'],
    ['\\frac{1}{3}x^{3}+2x+C', 'correct'],
    ['x^3/3 + 2x + 7 + k', 'correct'],
    ['\\frac{x^3}{3}+2x', 'accuracy'],
    ['x^3 + 2x + c', 'wrong'],
    ['x^2 + 2', 'wrong'],
  ])('%s → %s', (r, s) => expect(ok(spec, r)).toBe(s));
});

describe('exact values', () => {
  const spec = ans.exact(num(Q.of(32, 3)));
  it.each([
    ['\\frac{32}{3}', 'correct'],
    ['32/3', 'correct'],
    ['10\\frac{2}{3}', 'wrong'], // mixed numbers read as 10 × 2/3
    ['10.67', 'accuracy'],
    ['-\\frac{32}{3}', 'wrong'],
  ])('%s → %s', (r, s) => expect(ok(spec, r)).toBe(s));
});

describe('numeric awrt', () => {
  const spec = ans.num(2.3487, { sf: 3 });
  it.each([
    ['2.35', 'correct'],
    ['2.349', 'correct'],
    ['2.3487', 'correct'],
    ['2.3', 'accuracy'],
    ['2.34', 'wrong'],
    ['2.36', 'wrong'],
  ])('%s → %s', (r, s) => expect(ok(spec, r)).toBe(s));
});

describe('lists', () => {
  const spec = ans.list([ans.exact(num(2)), ans.exact(num(6))], { v: 'x' });
  it.each([
    [['2', '6'], 'correct'],
    [['6', '2'], 'correct'],
    ['x = 2, x = 6', 'correct'],
    [['2'], 'accuracy'],
    [['2', '6', '-1'], 'accuracy'],
    [['3', '5'], 'wrong'],
  ])('%j → %s', (r, s) => expect(ok(spec, r as never)).toBe(s));
});

describe('expressions', () => {
  it('equivalent rearrangements', () => {
    const spec = ans.expr(E('(x+1)^2'));
    expect(ok(spec, 'x^2+2x+1')).toBe('correct');
    expect(ok(spec, 'x^2+2x')).toBe('wrong');
    expect(ok(spec, '(x+y)^2')).toBe('wrong');
  });
  it('√(x²) is |x|, not x, over a domain including negatives', () => {
    const spec = ans.expr({ k: 'fn', f: 'abs', a: sym('x') }, ['x'], { domain: { x: [-3, 3] } });
    expect(ok(spec, '\\sqrt{x^2}')).toBe('correct');
    expect(ok(spec, 'x')).toBe('wrong');
  });
});
