/**
 * Seeded random number generation. `templateId + seed` → identical question on
 * every device. sfc32 seeded from a cyrb128 hash of the key string.
 */

/** Thrown by generators to reject a parameter set (constraint/rejection sampling). */
export class Reject extends Error {
  constructor(msg = 'rejected') {
    super(msg);
    this.name = 'Reject';
  }
}

export function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

export function sfc32(a: number, b: number, c: number, d: number): () => number {
  return () => {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

export class Rng {
  private readonly f: () => number;
  constructor(key: string) {
    const [a, b, c, d] = cyrb128(key);
    this.f = sfc32(a, b, c, d);
    for (let i = 0; i < 12; i++) this.f(); // warm up
  }
  /** Uniform in [0, 1). */
  next(): number {
    return this.f();
  }
  /** Integer in [lo, hi] inclusive. */
  int(lo: number, hi: number): number {
    if (hi < lo) throw new Error(`int(${lo}, ${hi})`);
    return lo + Math.floor(this.f() * (hi - lo + 1));
  }
  /** Non-zero integer in [lo, hi]. */
  intNZ(lo: number, hi: number): number {
    for (let i = 0; i < 100; i++) {
      const v = this.int(lo, hi);
      if (v !== 0) return v;
    }
    throw new Reject('intNZ');
  }
  /** Integer in [lo, hi] excluding the listed values. */
  intExcept(lo: number, hi: number, except: readonly number[]): number {
    for (let i = 0; i < 200; i++) {
      const v = this.int(lo, hi);
      if (!except.includes(v)) return v;
    }
    throw new Reject('intExcept');
  }
  /** Multiple of `step` in [lo, hi]. */
  step(lo: number, hi: number, step: number): number {
    const n = Math.floor((hi - lo) / step + 1e-9);
    return round(lo + this.int(0, n) * step, 10);
  }
  real(lo: number, hi: number, dp = 2): number {
    return round(lo + this.f() * (hi - lo), dp);
  }
  bool(p = 0.5): boolean {
    return this.f() < p;
  }
  sign(): 1 | -1 {
    return this.f() < 0.5 ? 1 : -1;
  }
  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new Error('pick from empty');
    return arr[Math.floor(this.f() * arr.length)];
  }
  /** Weighted pick: items are [value, weight]. */
  weighted<T>(items: readonly (readonly [T, number])[]): T {
    const total = items.reduce((s, [, w]) => s + w, 0);
    let x = this.f() * total;
    for (const [v, w] of items) {
      x -= w;
      if (x < 0) return v;
    }
    return items[items.length - 1][0];
  }
  shuffle<T>(arr: readonly T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.f() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  /** k distinct items. */
  sample<T>(arr: readonly T[], k: number): T[] {
    if (k > arr.length) throw new Error('sample too large');
    return this.shuffle(arr).slice(0, k);
  }
  /** k distinct integers in [lo, hi]. */
  distinct(k: number, lo: number, hi: number, opts: { nonzero?: boolean } = {}): number[] {
    const pool: number[] = [];
    for (let v = lo; v <= hi; v++) if (!(opts.nonzero && v === 0)) pool.push(v);
    return this.sample(pool, k);
  }
  /** Constraint: reject this parameter set unless cond holds. */
  require(cond: unknown, msg = 'constraint'): void {
    if (!cond) throw new Reject(msg);
  }
}

export function round(x: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round((x + Number.EPSILON * Math.sign(x)) * f) / f;
}

/**
 * Run a generator with rejection sampling. The same rng stream continues
 * across retries so the result is deterministic for a key.
 */
export function withRetries<T>(key: string, gen: (r: Rng) => T, max = 500): T {
  const r = new Rng(key);
  let last: unknown;
  for (let i = 0; i < max; i++) {
    try {
      return gen(r);
    } catch (e) {
      if (e instanceof Reject) {
        last = e;
        continue;
      }
      throw e;
    }
  }
  throw new Error(`Generator for ${key} rejected ${max} times (last: ${(last as Error)?.message})`);
}
