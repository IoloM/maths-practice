/**
 * The graph plotter: functions typed as you'd write them (the same parser as answers), letters
 * other than x become sliders, and the key points — roots, the y-intercept, turning points and
 * where curves cross — are found numerically.
 */
import { evaluate, freeSyms, type Expr } from '../engine/core/expr';
import { parseExpr } from '../engine/marking/parse';

export interface Compiled {
  f: (x: number, p: Record<string, number>) => number;
  params: string[];
}

const RESERVED = new Set(['x', 'e', 'pi']);

/** "y = 3sin(2x)" or "f(x) = …" or just the right-hand side; throws a readable error. */
export function compile(src: string): Compiled {
  const rhs = src.replace(/^\s*(y|f\s*\(\s*x\s*\)|g\s*\(\s*x\s*\)|h\s*\(\s*x\s*\))\s*=/i, '');
  const e: Expr = parseExpr(rhs);
  const params = [...freeSyms(e)].filter((s) => !RESERVED.has(s)).sort();
  return {
    params,
    f: (x, p) => {
      try {
        return evaluate(e, { ...p, x });
      } catch {
        return NaN;
      }
    },
  };
}

export interface View {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** Samples of y = f(x) across the view, broken where the curve jumps (asymptotes) or is undefined. */
export function trace(f: (x: number) => number, v: View, n = 600): [number, number][][] {
  const out: [number, number][][] = [];
  let seg: [number, number][] = [];
  const span = v.y1 - v.y0;
  let prev: number | null = null;
  for (let i = 0; i <= n; i++) {
    const x = v.x0 + ((v.x1 - v.x0) * i) / n;
    const y = f(x);
    const bad = !Number.isFinite(y) || (prev !== null && Math.abs(y - prev) > span * 2.5 && Math.sign(y) !== Math.sign(prev));
    if (bad) {
      if (seg.length > 1) out.push(seg);
      seg = [];
      prev = Number.isFinite(y) ? y : null;
      if (Number.isFinite(y)) seg.push([x, y]);
      continue;
    }
    seg.push([x, y]);
    prev = y;
  }
  if (seg.length > 1) out.push(seg);
  return out;
}

/** Where g changes sign between samples, refined by bisection (continuous changes only). */
function signChanges(g: (x: number) => number, x0: number, x1: number, n = 800): number[] {
  const out: number[] = [];
  let px = x0,
    py = g(x0);
  for (let i = 1; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const y = g(x);
    if (Number.isFinite(py) && Number.isFinite(y)) {
      if (y === 0) out.push(x);
      else if (py !== 0 && Math.sign(y) !== Math.sign(py)) {
        let a = px,
          b = x;
        for (let k = 0; k < 50; k++) {
          const m = (a + b) / 2;
          if (Math.sign(g(m)) === Math.sign(g(a))) a = m;
          else b = m;
        }
        const r = (a + b) / 2;
        // a sign change across an asymptote is not a root
        if (Math.abs(g(r)) < 1e-6 * (1 + Math.abs(py) + Math.abs(y))) out.push(r);
      }
    }
    px = x;
    py = y;
  }
  return out.filter((r, i) => i === 0 || Math.abs(r - out[i - 1]) > 1e-6);
}

export interface KeyPoint {
  kind: 'root' | 'y-intercept' | 'maximum' | 'minimum' | 'intersection';
  x: number;
  y: number;
  /** which functions (indices) */
  of: number[];
}

export function keyPoints(fs: ((x: number) => number)[], v: View): KeyPoint[] {
  const pts: KeyPoint[] = [];
  const h = (v.x1 - v.x0) * 1e-5;
  fs.forEach((f, i) => {
    for (const x of signChanges(f, v.x0, v.x1)) pts.push({ kind: 'root', x, y: 0, of: [i] });
    const y0 = f(0);
    if (v.x0 <= 0 && v.x1 >= 0 && Number.isFinite(y0)) pts.push({ kind: 'y-intercept', x: 0, y: y0, of: [i] });
    const d = (x: number) => (f(x + h) - f(x - h)) / (2 * h);
    for (const x of signChanges(d, v.x0, v.x1)) {
      const y = f(x);
      if (!Number.isFinite(y)) continue;
      const max = f(x - h * 50) < y && f(x + h * 50) < y;
      const min = f(x - h * 50) > y && f(x + h * 50) > y;
      if (max || min) pts.push({ kind: max ? 'maximum' : 'minimum', x, y, of: [i] });
    }
  });
  for (let i = 0; i < fs.length; i++)
    for (let j = i + 1; j < fs.length; j++)
      for (const x of signChanges((x) => fs[i](x) - fs[j](x), v.x0, v.x1)) {
        const y = fs[i](x);
        if (Number.isFinite(y)) pts.push({ kind: 'intersection', x, y, of: [i, j] });
      }
  return pts.filter((p) => p.y >= v.y0 - 1e-9 && p.y <= v.y1 + 1e-9).slice(0, 40);
}

/** Round, tidy grid steps: 1, 2 or 5 × 10ⁿ, about eight across. */
export function niceStep(span: number, target = 8): number {
  const raw = span / target;
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

/** A number for display: trailing zeros dropped, to 3 decimal places. */
export const show = (x: number) => (Math.abs(x) < 5e-4 ? '0' : String(Number(x.toFixed(3))));
