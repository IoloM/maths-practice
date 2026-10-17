/** Helpers for trigonometric equations. */
import { Q } from '../../../engine/core/rational';

export type TrigF = 'sin' | 'cos' | 'tan';
const R = Math.PI / 180;

/** Base angles θ (degrees) with f(θ) = k in [lo, hi). */
export function baseSolutionsDeg(f: TrigF, k: number, lo: number, hi: number): number[] {
  const out: number[] = [];
  const add = (t: number) => {
    for (let n = -10; n <= 10; n++) {
      const v = t + 360 * n;
      if (v >= lo - 1e-9 && v < hi - 1e-9 && !out.some((o) => Math.abs(o - v) < 1e-7)) out.push(v);
    }
  };
  if (f === 'sin') {
    if (Math.abs(k) > 1) return [];
    const a = Math.asin(k) / R;
    add(a);
    add(180 - a);
  } else if (f === 'cos') {
    if (Math.abs(k) > 1) return [];
    const a = Math.acos(k) / R;
    add(a);
    add(-a);
  } else {
    const a = Math.atan(k) / R;
    add(a);
    add(a + 180);
  }
  return out.sort((x, y) => x - y);
}

/** Solutions x in [lo, hi) of f(bx + c) = k, all in degrees. */
export function solveTrigDeg(f: TrigF, k: number, b: number, c: number, lo = 0, hi = 360): number[] {
  const tl = Math.min(b * lo + c, b * hi + c),
    th = Math.max(b * lo + c, b * hi + c);
  return baseSolutionsDeg(f, k, tl - 1, th + 1)
    .map((t) => (t - c) / b)
    .filter((x) => x >= lo - 1e-9 && x < hi - 1e-9)
    .map((x) => Math.round(x * 1e9) / 1e9)
    .sort((x, y) => x - y);
}

export function trigVal(f: TrigF, deg: number): number {
  const t = deg * R;
  return f === 'sin' ? Math.sin(t) : f === 'cos' ? Math.cos(t) : Math.tan(t);
}

// ---------- radians ----------

/** deg/180 as an exact rational multiple of π. */
export function piMultiple(deg: number): Q {
  return Q.from(Math.round((deg / 180) * 720720) / 720720);
}

/** LaTeX for qπ: "\frac{5\pi}{6}", "-\frac{\pi}{4}", "2\pi", "0". */
export function piTex(q: Q): string {
  if (q.isZero) return '0';
  const n = Math.abs(q.n);
  const s = q.sign < 0 ? '-' : '';
  const top = `${n === 1 ? '' : n}\\pi`;
  return q.d === 1 ? `${s}${top}` : `${s}\\frac{${top}}{${q.d}}`;
}

/** Exact LaTeX for the special values ±1/2, ±√2/2, ±√3/2, ±1, ±√3, ±1/√3, 0. */
export const SPECIAL: { v: number; tex: string }[] = [
  { v: 0.5, tex: '\\frac{1}{2}' },
  { v: -0.5, tex: '-\\frac{1}{2}' },
  { v: Math.SQRT1_2, tex: '\\frac{\\sqrt{2}}{2}' },
  { v: -Math.SQRT1_2, tex: '-\\frac{\\sqrt{2}}{2}' },
  { v: Math.sqrt(3) / 2, tex: '\\frac{\\sqrt{3}}{2}' },
  { v: -Math.sqrt(3) / 2, tex: '-\\frac{\\sqrt{3}}{2}' },
  { v: 1, tex: '1' },
  { v: -1, tex: '-1' },
  { v: Math.sqrt(3), tex: '\\sqrt{3}' },
  { v: -Math.sqrt(3), tex: '-\\sqrt{3}' },
  { v: 1 / Math.sqrt(3), tex: '\\frac{1}{\\sqrt{3}}' },
  { v: -1 / Math.sqrt(3), tex: '-\\frac{1}{\\sqrt{3}}' },
  { v: 0, tex: '0' },
];
