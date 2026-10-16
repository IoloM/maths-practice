/** Stats library against published table values (Edexcel formula booklet style). */
import { describe, expect, it } from 'vitest';
import { binomCdf, binomPmf, invNormal, invPhi, normalCdf, phi, pmccCritical, tCdf, invT, sdPop, mean, pmcc } from '../src/engine/stats/distributions';
import { roundDP } from '../src/engine/core/format';

const r4 = (x: number) => roundDP(x, 4);

describe('binomial', () => {
  it.each([
    [10, 0.3, 3, 0.6496],
    [10, 0.3, 0, 0.0282],
    [20, 0.5, 10, 0.5881],
    [20, 0.25, 4, 0.4148],
    [15, 0.4, 6, 0.6098],
    [30, 0.1, 2, 0.4114],
    [50, 0.35, 15, 0.2801],
    [25, 0.2, 7, 0.8909],
    [12, 0.45, 5, 0.5269],
    [40, 0.05, 1, 0.3991],
  ])('B(%i, %f): P(X ⩽ %i) = %f', (n, p, x, v) => {
    expect(r4(binomCdf(n, p, x))).toBeCloseTo(v, 4);
  });
  it('pmf sums to 1 and matches nCr formula', () => {
    let s = 0;
    for (let r = 0; r <= 30; r++) s += binomPmf(30, 0.37, r);
    expect(s).toBeCloseTo(1, 12);
    expect(binomPmf(8, 0.5, 4)).toBeCloseTo(70 / 256, 14);
  });
  it('edge cases', () => {
    expect(binomCdf(10, 0.3, -1)).toBe(0);
    expect(binomCdf(10, 0.3, 10)).toBe(1);
    expect(binomPmf(5, 0, 0)).toBe(1);
  });
});

describe('normal', () => {
  it.each([
    [0, 0.5],
    [1, 0.8413],
    [1.96, 0.975],
    [-1.5, 0.0668],
    [2.33, 0.9901],
    [0.5, 0.6915],
    [-0.25, 0.4013],
    [3, 0.99865],
  ])('Φ(%f) = %f', (z, v) => {
    expect(phi(z)).toBeCloseTo(v, String(v).length - 2);
  });
  it.each([
    [0.975, 1.96],
    [0.95, 1.6449],
    [0.99, 2.3263],
    [0.995, 2.5758],
    [0.9, 1.2816],
    [0.75, 0.6745],
    [0.999, 3.0902],
    [0.9995, 3.2905],
  ])('Φ⁻¹(%f) = %f', (p, z) => {
    expect(r4(invPhi(p))).toBeCloseTo(z, 4);
  });
  it('round trips', () => {
    for (const p of [0.001, 0.02, 0.3, 0.5, 0.77, 0.9999]) expect(phi(invPhi(p))).toBeCloseTo(p, 12);
  });
  it('general normal', () => {
    expect(r4(normalCdf(65, 50, 10))).toBe(0.9332);
    expect(invNormal(0.95, 100, 15)).toBeCloseTo(124.6728, 3);
  });
});

describe('t and PMCC critical values', () => {
  it('t distribution', () => {
    expect(tCdf(0, 5)).toBeCloseTo(0.5, 12);
    expect(invT(0.975, 10)).toBeCloseTo(2.2281, 4);
    expect(invT(0.95, 8)).toBeCloseTo(1.8595, 4);
  });
  it.each([
    [10, 0.05, 0.5494],
    [10, 0.025, 0.6319],
    [10, 0.01, 0.7155],
    [10, 0.005, 0.7646],
    [10, 0.1, 0.4428],
    [5, 0.05, 0.8054],
    [20, 0.05, 0.3783],
    [30, 0.025, 0.3610],
    [8, 0.05, 0.6215],
    [12, 0.01, 0.6581],
    [50, 0.05, 0.2353],
  ])('n = %i, α = %f one-tailed → %f', (n, a, v) => {
    expect(r4(pmccCritical(n, a))).toBeCloseTo(v, 4);
  });
});

describe('descriptive', () => {
  it('mean, sd, pmcc', () => {
    const xs = [2, 4, 4, 4, 5, 5, 7, 9];
    expect(mean(xs)).toBe(5);
    expect(sdPop(xs)).toBe(2);
    expect(pmcc([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 12);
    expect(pmcc([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1, 12);
  });
});
