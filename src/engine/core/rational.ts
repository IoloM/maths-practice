import { Reject } from './rng';

/** Exact rational number on safe integers. Overflow throws Reject (seed rejected). */
export class Q {
  readonly n: number;
  readonly d: number;
  private constructor(n: number, d: number) {
    this.n = n;
    this.d = d;
  }

  static of(n: number, d = 1): Q {
    if (!Number.isInteger(n) || !Number.isInteger(d)) {
      throw new Error(`Q.of needs integers, got ${n}/${d}`);
    }
    if (d === 0) throw new Reject('zero denominator');
    if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d)) throw new Reject('overflow');
    if (d < 0) {
      n = -n;
      d = -d;
    }
    const g = gcd(Math.abs(n), d);
    return new Q(n / g || 0, d / g);
  }

  /** From a number that is (close to) a fraction with small denominator, or a Q. */
  static from(x: number | Q): Q {
    if (x instanceof Q) return x;
    if (Number.isInteger(x)) return Q.of(x);
    const r = toFraction(x, 100000);
    if (!r) throw new Error(`Q.from: ${x} is not a simple fraction`);
    return Q.of(r[0], r[1]);
  }

  static readonly ZERO = new Q(0, 1);
  static readonly ONE = new Q(1, 1);

  add(b: Q | number): Q {
    const o = Q.from(b);
    return Q.of(safe(safe(this.n * o.d) + safe(o.n * this.d)), safe(this.d * o.d));
  }
  sub(b: Q | number): Q {
    return this.add(Q.from(b).neg());
  }
  mul(b: Q | number): Q {
    const o = Q.from(b);
    return Q.of(safe(this.n * o.n), safe(this.d * o.d));
  }
  div(b: Q | number): Q {
    const o = Q.from(b);
    if (o.n === 0) throw new Reject('division by zero');
    return Q.of(safe(this.n * o.d), safe(this.d * o.n));
  }
  neg(): Q {
    return Q.of(-this.n, this.d);
  }
  abs(): Q {
    return this.n < 0 ? this.neg() : this;
  }
  inv(): Q {
    return Q.of(this.d, this.n);
  }
  pow(k: number): Q {
    if (!Number.isInteger(k)) throw new Error('Q.pow needs integer exponent');
    if (k < 0) return this.inv().pow(-k);
    let r: Q = Q.ONE;
    for (let i = 0; i < k; i++) r = r.mul(this);
    return r;
  }
  /** Exact rational power if it exists (e.g. (4/9)^(1/2) = 2/3), otherwise null. */
  powQ(e: Q): Q | null {
    if (e.d === 1) return this.pow(e.n);
    if (this.n < 0 && e.d % 2 === 0) return null;
    const rn = intRoot(this.n, e.d);
    const rd = intRoot(this.d, e.d);
    if (rn === null || rd === null) return null;
    return Q.of(rn, rd).pow(e.n);
  }
  cmp(b: Q | number): number {
    const o = Q.from(b);
    return Math.sign(this.n * o.d - o.n * this.d);
  }
  eq(b: Q | number): boolean {
    const o = Q.from(b);
    return this.n === o.n && this.d === o.d;
  }
  lt(b: Q | number): boolean {
    return this.cmp(b) < 0;
  }
  gt(b: Q | number): boolean {
    return this.cmp(b) > 0;
  }
  get isInt(): boolean {
    return this.d === 1;
  }
  get isZero(): boolean {
    return this.n === 0;
  }
  get sign(): number {
    return Math.sign(this.n);
  }
  get value(): number {
    return this.n / this.d;
  }
  valueOf(): number {
    return this.value;
  }
  toString(): string {
    return this.d === 1 ? `${this.n}` : `${this.n}/${this.d}`;
  }
  /** LaTeX: 5, -\frac{3}{4}. */
  toLatex(): string {
    if (this.d === 1) return `${this.n}`;
    const s = `\\frac{${Math.abs(this.n)}}{${this.d}}`;
    return this.n < 0 ? `-${s}` : s;
  }
}

export const q = (n: number, d = 1): Q => Q.of(n, d);

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

function safe(x: number): number {
  if (!Number.isSafeInteger(x)) throw new Reject('overflow');
  return x;
}

/** Integer k-th root if exact. */
export function intRoot(n: number, k: number): number | null {
  if (n < 0) {
    if (k % 2 === 0) return null;
    const r = intRoot(-n, k);
    return r === null ? null : -r;
  }
  const r = Math.round(n ** (1 / k));
  for (const c of [r - 1, r, r + 1]) if (c >= 0 && c ** k === n) return c;
  return null;
}

/** Continued-fraction approximation p/q with q <= maxDen, exact to 1e-12 relative. */
export function toFraction(x: number, maxDen = 10000): [number, number] | null {
  if (!Number.isFinite(x)) return null;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  let h1 = 1,
    h0 = 0,
    k1 = 0,
    k0 = 1,
    b = x;
  for (let i = 0; i < 40; i++) {
    const a = Math.floor(b);
    const h2 = a * h1 + h0;
    const k2 = a * k1 + k0;
    if (k2 > maxDen) break;
    h0 = h1;
    h1 = h2;
    k0 = k1;
    k1 = k2;
    if (Math.abs(x - h1 / k1) <= 1e-12 * Math.max(1, x)) return [sign * h1, k1];
    const frac = b - a;
    if (frac < 1e-15) break;
    b = 1 / frac;
  }
  if (k1 && Math.abs(x - h1 / k1) <= 1e-12 * Math.max(1, x)) return [sign * h1, k1];
  return null;
}

/** Largest square factor: n = s^2 * r with r square-free. Returns [s, r]. */
export function surdSimplify(n: number): [number, number] {
  if (n < 0 || !Number.isInteger(n)) throw new Error('surdSimplify');
  let s = 1,
    r = n;
  for (let f = 2; f * f <= r; f++) {
    while (r % (f * f) === 0) {
      r /= f * f;
      s *= f;
    }
  }
  return [s, r];
}

export function isSquareFree(n: number): boolean {
  return surdSimplify(n)[0] === 1;
}

export function isPrime(n: number): boolean {
  if (n < 2 || !Number.isInteger(n)) return false;
  for (let f = 2; f * f <= n; f++) if (n % f === 0) return false;
  return true;
}

export function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

export function nCr(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  r = Math.min(r, n - r);
  let res = 1;
  for (let i = 1; i <= r; i++) res = (res * (n - r + i)) / i;
  return Math.round(res);
}
