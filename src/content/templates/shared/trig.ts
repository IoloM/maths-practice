/** Helpers for trigonometric equations. */
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
