/** Independent numerical methods, used by verify() to confirm exact answers a second way. */

/** Composite Simpson's rule with n (even) strips. */
export function simpson(f: (x: number) => number, a: number, b: number, n = 2000): number {
  if (n % 2) n++;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

/** Adaptive Simpson for awkward integrands. */
export function integrate(f: (x: number) => number, a: number, b: number, tol = 1e-10): number {
  const simp = (a: number, b: number, fa: number, fm: number, fb: number) => ((b - a) / 6) * (fa + 4 * fm + fb);
  const rec = (a: number, b: number, fa: number, fm: number, fb: number, whole: number, tol: number, depth: number): number => {
    const m = (a + b) / 2;
    const lm = (a + m) / 2,
      rm = (m + b) / 2;
    const flm = f(lm),
      frm = f(rm);
    const left = simp(a, m, fa, flm, fm),
      right = simp(m, b, fm, frm, fb);
    if (depth <= 0 || Math.abs(left + right - whole) <= 15 * tol) return left + right + (left + right - whole) / 15;
    return rec(a, m, fa, flm, fm, left, tol / 2, depth - 1) + rec(m, b, fm, frm, fb, right, tol / 2, depth - 1);
  };
  const fa = f(a),
    fb = f(b),
    fm = f((a + b) / 2);
  return rec(a, b, fa, fm, fb, simp(a, b, fa, fm, fb), tol, 50);
}

/** Central-difference derivative. */
export function derivative(f: (x: number) => number, x: number, h = 1e-5): number {
  return (f(x + h) - f(x - h)) / (2 * h);
}

export function secondDerivative(f: (x: number) => number, x: number, h = 1e-4): number {
  return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
}

/** Bisection on [a, b] where f changes sign. */
export function bisect(f: (x: number) => number, a: number, b: number, tol = 1e-13): number {
  let fa = f(a);
  if (fa * f(b) > 0) throw new Error('bisect: no sign change');
  for (let i = 0; i < 200 && b - a > tol; i++) {
    const m = (a + b) / 2;
    const fm = f(m);
    if (fm === 0) return m;
    if (fa * fm < 0) b = m;
    else {
      a = m;
      fa = fm;
    }
  }
  return (a + b) / 2;
}

/** All roots in [lo, hi] found by scanning for sign changes. */
export function rootsIn(f: (x: number) => number, lo: number, hi: number, steps = 4000): number[] {
  const out: number[] = [];
  const h = (hi - lo) / steps;
  let x0 = lo,
    f0 = f(lo);
  if (f0 === 0) out.push(lo);
  for (let i = 1; i <= steps; i++) {
    const x1 = lo + i * h;
    const f1 = f(x1);
    if (Number.isFinite(f0) && Number.isFinite(f1)) {
      if (f1 === 0) out.push(x1);
      else if (f0 * f1 < 0) {
        const r = bisect(f, x0, x1);
        // reject asymptote sign changes
        if (Math.abs(f(r)) < 1e-6) out.push(r);
      }
    }
    x0 = x1;
    f0 = f1;
  }
  return out;
}

export function approxEq(a: number, b: number, rel = 1e-9, absTol = 1e-12): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) <= Math.max(absTol, rel * Math.max(Math.abs(a), Math.abs(b)));
}

/** Throw unless approximately equal (for verify()). */
export function expectClose(actual: number, expected: number, what: string, rel = 1e-7): void {
  if (!approxEq(actual, expected, rel, rel)) {
    throw new Error(`${what}: expected ${expected}, got ${actual}`);
  }
}

export function expect(cond: unknown, what: string): asserts cond {
  if (!cond) throw new Error(`verify failed: ${what}`);
}
