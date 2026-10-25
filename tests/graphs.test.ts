import { describe, expect, it } from 'vitest';
import { compile, keyPoints, niceStep, trace } from '../src/lib/graphs';

const V = { x0: -5, x1: 5, y0: -10, y1: 10 };

describe('graph plotter', () => {
  it('reads functions as typed, and the other letters become sliders', () => {
    const c = compile('y = a sin(bx + c) + d');
    expect(c.params).toEqual(['a', 'b', 'c', 'd']);
    expect(c.f(0, { a: 2, b: 1, c: Math.PI / 2, d: 1 })).toBeCloseTo(3);
    expect(compile('f(x) = x^2 - 4').f(3, {})).toBe(5);
    expect(compile('e^x').params).toEqual([]);
    expect(() => compile('y = (')).toThrow();
  });
  it('finds roots, the y-intercept, turning points and intersections', () => {
    const f = (x: number) => x * x - 4;
    const g = (x: number) => x;
    const pts = keyPoints([f, g], V);
    const of = (k: string) => pts.filter((p) => p.kind === k).map((p) => Number(p.x.toFixed(4)));
    expect(of('root')).toEqual([-2, 2, 0]);
    expect(pts.find((p) => p.kind === 'minimum')).toMatchObject({ y: -4 });
    expect(of('intersection')).toEqual([-1.5616, 2.5616]);
  });
  it('does not count an asymptote as a root, and breaks the curve there', () => {
    const r = (x: number) => 1 / x;
    expect(keyPoints([r], V).filter((p) => p.kind === 'root')).toEqual([]);
    expect(trace(r, V).length).toBe(2);
  });
  it('grid steps are 1, 2 or 5 × a power of ten', () => {
    expect([niceStep(10), niceStep(100), niceStep(3)]).toEqual([1, 10, 0.5]);
  });
});
