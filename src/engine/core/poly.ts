import { Q } from './rational';
import { Reject } from './rng';
import { type Expr, add, div, mul, num, pow, sqrt, sym, neg } from './expr';

export interface Term {
  c: Q;
  e: Q;
}

export type PolyStyle = 'power' | 'display';

/**
 * Sum of terms c·x^e with rational c and rational e (so it covers x^{-2}, √x …).
 * Terms are kept combined, non-zero and sorted by exponent, highest first.
 */
export class Poly {
  readonly terms: readonly Term[];
  constructor(terms: Term[]) {
    const m = new Map<string, Term>();
    for (const t of terms) {
      const k = t.e.toString();
      const prev = m.get(k);
      m.set(k, { c: prev ? prev.c.add(t.c) : t.c, e: t.e });
    }
    this.terms = [...m.values()].filter((t) => !t.c.isZero).sort((a, b) => b.e.cmp(a.e));
  }

  /** From [coef, exp] pairs. */
  static of(pairs: readonly (readonly [Q | number, Q | number])[]): Poly {
    return new Poly(pairs.map(([c, e]) => ({ c: Q.from(c), e: Q.from(e) })));
  }
  /** From coefficients lowest power first: [a0, a1, a2] = a0 + a1 x + a2 x². */
  static coeffs(cs: readonly (Q | number)[]): Poly {
    return new Poly(cs.map((c, i) => ({ c: Q.from(c), e: Q.of(i) })));
  }
  /** (x - r1)(x - r2)… times k. */
  static fromRoots(roots: readonly (Q | number)[], k: Q | number = 1): Poly {
    let p = Poly.coeffs([k]);
    for (const r of roots) p = p.mul(Poly.coeffs([Q.from(r).neg(), 1]));
    return p;
  }
  static readonly ZERO = new Poly([]);

  get isZero(): boolean {
    return this.terms.length === 0;
  }
  /** All exponents non-negative integers. */
  get isPolynomial(): boolean {
    return this.terms.every((t) => t.e.isInt && t.e.n >= 0);
  }
  get degree(): number {
    return this.terms.length ? this.terms[0].e.value : -Infinity;
  }
  coef(e: number | Q): Q {
    const E = Q.from(e);
    return this.terms.find((t) => t.e.eq(E))?.c ?? Q.ZERO;
  }
  add(p: Poly): Poly {
    return new Poly([...this.terms, ...p.terms]);
  }
  sub(p: Poly): Poly {
    return this.add(p.neg());
  }
  neg(): Poly {
    return this.scale(-1);
  }
  scale(k: Q | number): Poly {
    const K = Q.from(k);
    return new Poly(this.terms.map((t) => ({ c: t.c.mul(K), e: t.e })));
  }
  mul(p: Poly): Poly {
    const out: Term[] = [];
    for (const a of this.terms) for (const b of p.terms) out.push({ c: a.c.mul(b.c), e: a.e.add(b.e) });
    return new Poly(out);
  }
  /** Multiply by x^k. */
  shift(k: Q | number): Poly {
    const K = Q.from(k);
    return new Poly(this.terms.map((t) => ({ c: t.c, e: t.e.add(K) })));
  }
  powInt(n: number): Poly {
    let r = Poly.coeffs([1]);
    for (let i = 0; i < n; i++) r = r.mul(this);
    return r;
  }
  diff(): Poly {
    return new Poly(this.terms.filter((t) => !t.e.isZero).map((t) => ({ c: t.c.mul(t.e), e: t.e.sub(1) })));
  }
  /** Antiderivative with zero constant. Throws if a 1/x term is present. */
  integ(): Poly {
    return new Poly(
      this.terms.map((t) => {
        if (t.e.eq(-1)) throw new Error('integ: x^-1 term');
        const e1 = t.e.add(1);
        return { c: t.c.div(e1), e: e1 };
      }),
    );
  }
  eval(x: number): number {
    let s = 0;
    for (const t of this.terms) {
      if (x < 0 && !t.e.isInt) return NaN;
      if (x === 0 && t.e.sign < 0) return NaN;
      s += t.c.value * x ** t.e.value;
    }
    return s;
  }
  /** Exact value at rational x, or Reject if some term is irrational there. */
  evalQ(x: Q | number): Q {
    const X = Q.from(x);
    let s = Q.ZERO;
    for (const t of this.terms) {
      if (X.isZero) {
        if (t.e.sign < 0) throw new Reject('evalQ: 0^negative');
        if (t.e.isZero) s = s.add(t.c);
        continue;
      }
      const p = X.powQ(t.e);
      if (!p) throw new Reject('evalQ: irrational');
      s = s.add(t.c.mul(p));
    }
    return s;
  }
  /** Definite integral ∫_a^b exactly. */
  definite(a: Q | number, b: Q | number): Q {
    const F = this.integ();
    return F.evalQ(b).sub(F.evalQ(a));
  }
  /** Polynomial long division by (x - r): returns quotient and remainder. */
  divLinear(r: Q | number): { q: Poly; rem: Q } {
    if (!this.isPolynomial) throw new Error('divLinear needs polynomial');
    const R = Q.from(r);
    const n = this.degree;
    const cs: Q[] = [];
    for (let i = n; i >= 0; i--) cs.push(this.coef(i));
    const out: Q[] = [];
    let acc = Q.ZERO;
    for (const c of cs) {
      acc = acc.mul(R).add(c);
      out.push(acc);
    }
    const rem = out.pop() ?? Q.ZERO;
    const qc = out.reverse();
    return { q: Poly.coeffs(qc), rem };
  }

  // ---------- printing ----------
  toExpr(v = 'x'): Expr {
    if (this.isZero) return num(0);
    const X = sym(v);
    const parts = this.terms.map((t) => termExpr(t, X));
    return parts.length === 1 ? parts[0] : add(...parts);
  }
  /**
   * LaTeX. 'power' prints x^{-2}, x^{\frac{1}{2}}; 'display' prints the way a
   * question would: \frac{3}{x^{2}}, 4\sqrt{x}.
   */
  toLatex(opts: { v?: string; style?: PolyStyle } = {}): string {
    const v = opts.v ?? 'x';
    const style = opts.style ?? 'power';
    if (this.isZero) return '0';
    let s = '';
    this.terms.forEach((t, i) => {
      const negT = t.c.sign < 0;
      const body = termTex({ c: t.c.abs(), e: t.e }, v, style);
      if (i === 0) s += negT ? `-${body}` : body;
      else s += negT ? ` - ${body}` : ` + ${body}`;
    });
    return s;
  }
  toString(): string {
    return this.terms.map((t) => `${t.c}x^${t.e}`).join(' + ');
  }
}

function termExpr(t: Term, X: Expr): Expr {
  if (t.e.isZero) return num(t.c);
  const xe = t.e.eq(1) ? X : pow(X, num(t.e));
  if (t.c.eq(1)) return xe;
  if (t.c.eq(-1)) return neg(xe);
  return mul(num(t.c), xe);
}

function coefTex(c: Q): string {
  if (c.eq(1)) return '';
  return c.toLatex();
}

/** c is non-negative here. */
function termTex(t: Term, v: string, style: PolyStyle): string {
  const { c, e } = t;
  if (e.isZero) return c.toLatex();
  if (style === 'power') {
    const xe = e.eq(1) ? v : `${v}^{${e.toLatex()}}`;
    return `${coefTex(c)}${xe}`;
  }
  // display style
  if (e.sign > 0) {
    if (e.isInt) return `${coefTex(c)}${e.eq(1) ? v : `${v}^{${e.n}}`}`;
    if (e.eq(Q.of(1, 2))) return `${coefTex(c)}\\sqrt{${v}}`;
    if (e.d === 2 && e.n > 2) {
      const k = (e.n - 1) / 2;
      return `${coefTex(c)}${k === 1 ? v : `${v}^{${k}}`}\\sqrt{${v}}`;
    }
    if (e.n === 1) return `${coefTex(c)}\\sqrt[${e.d}]{${v}}`;
    return `${coefTex(c)}${v}^{${e.toLatex()}}`;
  }
  // negative exponent → fraction
  const pe = e.neg();
  let den: string;
  if (pe.isInt) den = pe.eq(1) ? v : `${v}^{${pe.n}}`;
  else if (pe.eq(Q.of(1, 2))) den = `\\sqrt{${v}}`;
  else if (pe.d === 2) {
    const k = (pe.n - 1) / 2;
    den = `${k === 1 ? v : `${v}^{${k}}`}\\sqrt{${v}}`;
  } else den = `${v}^{${pe.toLatex()}}`;
  const numer = c.n;
  const cd = c.d === 1 ? '' : `${c.d}`;
  return `\\frac{${numer}}{${cd}${den}}`;
}

/** Expr in display style for a single term (used when an integrand is shown as a fraction). */
export function displayTermExpr(c: Q, e: Q, v = 'x'): Expr {
  const X = sym(v);
  if (e.sign >= 0) {
    if (e.eq(Q.of(1, 2))) return mul(num(c), sqrt(X));
    return termExpr({ c, e }, X);
  }
  const pe = e.neg();
  const den = pe.eq(1) ? X : pe.eq(Q.of(1, 2)) ? sqrt(X) : pow(X, num(pe));
  return div(num(c), den);
}
