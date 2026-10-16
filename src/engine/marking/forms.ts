/** Structural "form" checks — only applied when a question demands a form. */
import { type Expr, hasDecimal, some, freeSyms, evaluate } from '../core/expr';
import { Q, gcd, isSquareFree, toFraction } from '../core/rational';
import { Poly } from '../core/poly';
import type { Form, FormName } from './types';

export const FORM_MESSAGES: Record<FormName, string> = {
  exact: 'Give an exact answer, not a decimal.',
  'simplest-fraction': 'Simplify your fraction fully.',
  surd: 'Simplify the surd fully (e.g. √12 = 2√3) and rationalise any denominator.',
  rationalised: 'Rationalise the denominator.',
  factorised: 'Give your answer in factorised form.',
  'fully-factorised': 'Factorise fully.',
  'completed-square': 'Write your answer in completed-square form, a(x + p)² + q.',
  expanded: 'Expand the brackets and simplify.',
  'single-fraction': 'Write your answer as a single fraction.',
  'single-log': 'Write your answer as a single logarithm.',
  'y=mx+c': 'Give the equation in the form y = mx + c.',
  'ax+by+c=0': 'Give the equation in the form ax + by + c = 0, where a, b and c are integers.',
  'integer-coefficients': 'Use integer coefficients.',
};

export const FORM_LABELS: Record<FormName, string> = {
  exact: 'exact',
  'simplest-fraction': 'simplest form',
  surd: 'simplified surd',
  rationalised: 'rationalised',
  factorised: 'factorised',
  'fully-factorised': 'fully factorised',
  'completed-square': 'completed square',
  expanded: 'expanded',
  'single-fraction': 'single fraction',
  'single-log': 'single logarithm',
  'y=mx+c': 'y = mx + c',
  'ax+by+c=0': 'ax + by + c = 0',
  'integer-coefficients': 'integer coefficients',
};

/** Convert an Expr to a polynomial in v (rational coefficients) if it is one. */
export function exprToPoly(e: Expr, v: string): Poly | null {
  switch (e.k) {
    case 'num':
      return Poly.coeffs([e.v]);
    case 'dec': {
      const f = toFraction(e.v, 10000);
      return f ? Poly.coeffs([Q.of(f[0], f[1])]) : null;
    }
    case 'sym':
      return e.n === v ? Poly.coeffs([0, 1]) : null;
    case 'add': {
      let p = Poly.ZERO;
      for (const t of e.a) {
        const q = exprToPoly(t, v);
        if (!q) return null;
        p = p.add(q);
      }
      return p;
    }
    case 'mul': {
      let p = Poly.coeffs([1]);
      for (const t of e.a) {
        const q = exprToPoly(t, v);
        if (!q) return null;
        p = p.mul(q);
      }
      return p;
    }
    case 'neg': {
      const q = exprToPoly(e.a, v);
      return q ? q.neg() : null;
    }
    case 'div': {
      const n = exprToPoly(e.a, v);
      const d = exprToPoly(e.b, v);
      if (!n || !d || d.degree !== 0) return null;
      const c = d.coef(0);
      return c.isZero ? null : n.scale(c.inv());
    }
    case 'pow': {
      const b = exprToPoly(e.a, v);
      if (!b || e.b.k !== 'num' || !e.b.v.isInt || e.b.v.n < 0 || e.b.v.n > 12) return null;
      return b.powInt(e.b.v.n);
    }
    default:
      return null;
  }
}

function stripCoef(e: Expr): Expr {
  if (e.k === 'neg') return stripCoef(e.a);
  if (e.k === 'mul') {
    const fs = e.a.filter((f) => !(f.k === 'num' || f.k === 'dec'));
    if (fs.length === 1) return stripCoef(fs[0]);
    return { k: 'mul', a: fs };
  }
  return e;
}

function factorList(e: Expr): Expr[] {
  const s = stripCoef(e);
  if (s.k === 'mul') return s.a.flatMap((f) => (f.k === 'pow' ? [f.a] : [f]));
  if (s.k === 'pow') return [s.a];
  return [s];
}

function hasRationalRoot(p: Poly): boolean {
  // integer-coefficient form
  const den = p.terms.reduce((l, t) => (l * t.c.d) / gcd(l, t.c.d), 1);
  const ip = p.scale(den);
  const a0 = Math.abs(ip.coef(0).n);
  const an = Math.abs(ip.coef(ip.degree).n);
  if (a0 === 0) return true;
  const divs = (n: number) => {
    const d: number[] = [];
    for (let i = 1; i <= n; i++) if (n % i === 0) d.push(i);
    return d;
  };
  for (const pn of divs(a0))
    for (const qd of divs(an))
      for (const s of [1, -1]) {
        if (Math.abs(ip.evalQ(Q.of(s * pn, qd)).value) < 1e-12) return true;
      }
  return false;
}

function irreducible(p: Poly): boolean {
  const deg = p.degree;
  if (deg <= 1) return true;
  if (deg === 2) {
    const a = p.coef(2),
      b = p.coef(1),
      c = p.coef(0);
    const disc = b.mul(b).sub(a.mul(c).mul(4));
    if (disc.sign < 0) return true;
    const r = disc.powQ(Q.of(1, 2));
    return r === null;
  }
  if (deg === 3) return !hasRationalRoot(p);
  return !hasRationalRoot(p);
}

function intContent(p: Poly): number {
  if (!p.terms.every((t) => t.c.isInt)) return 1;
  return p.terms.reduce((g, t) => gcd(g, t.c.n), 0);
}

export function checkForm(form: FormName, e: Expr, v = 'x'): boolean {
  switch (form) {
    case 'exact':
      return !hasDecimal(e);
    case 'simplest-fraction':
      return !some(e, (n) => {
        if (n.k !== 'div') return false;
        if (n.a.k === 'div' || n.b.k === 'div') return true;
        if (n.a.k === 'num' && n.b.k === 'num') {
          if (!n.a.v.isInt || !n.b.v.isInt) return true;
          return gcd(n.a.v.n, n.b.v.n) !== 1 || n.b.v.n === 1;
        }
        return false;
      });
    case 'surd':
      return (
        !some(e, (n) => n.k === 'sqrt' && (n.a.k !== 'num' || !n.a.v.isInt || n.a.v.n < 2 || !isSquareFree(n.a.v.n))) &&
        checkForm('rationalised', e) &&
        checkForm('simplest-fraction', e) &&
        !hasDecimal(e)
      );
    case 'rationalised':
      return !some(e, (n) => n.k === 'div' && some(n.b, (m) => m.k === 'sqrt' || (m.k === 'pow' && m.b.k === 'num' && !m.b.v.isInt)));
    case 'factorised': {
      const s = stripCoef(e);
      if (!(s.k === 'mul' || s.k === 'pow')) return false;
      return factorList(e).every((f) => exprToPoly(f, v) !== null);
    }
    case 'fully-factorised': {
      if (!checkForm('factorised', e, v) && !(exprToPoly(e, v)?.degree === 1)) return false;
      return factorList(e).every((f) => {
        const p = exprToPoly(f, v);
        if (!p) return false;
        if (p.degree >= 1 && intContent(p) > 1) return false;
        return irreducible(p);
      });
    }
    case 'completed-square': {
      const s = e.k === 'neg' ? e.a : e;
      const terms = s.k === 'add' ? s.a : [s];
      const withV = terms.filter((t) => freeSyms(t).has(v));
      if (withV.length !== 1) return false;
      const sq = stripCoef(withV[0]);
      if (sq.k !== 'pow' || sq.b.k !== 'num' || !sq.b.v.eq(2)) return false;
      const inner = exprToPoly(sq.a, v);
      return !!inner && inner.degree === 1 && inner.coef(1).abs().eq(1);
    }
    case 'expanded':
      return !some(e, (n) => (n.k === 'mul' && n.a.some((f) => f.k === 'add')) || (n.k === 'pow' && n.a.k === 'add'));
    case 'single-fraction': {
      const s = e.k === 'neg' ? e.a : e;
      return s.k === 'div' || (s.k === 'mul' && s.a.length === 2 && s.a[0].k === 'num' && s.a[1].k === 'div');
    }
    case 'single-log': {
      const s = e.k === 'neg' ? e.a : e;
      return (s.k === 'fn' && s.f === 'ln') || s.k === 'log';
    }
    case 'integer-coefficients': {
      const p = exprToPoly(e, v);
      return !!p && p.terms.every((t) => t.c.isInt);
    }
    default:
      return true;
  }
}

/** Check all required forms; returns messages for the ones that fail. */
export function formErrors(forms: Form[] | undefined, e: Expr, v = 'x'): string[] {
  if (!forms) return [];
  const out: string[] = [];
  for (const f of forms) {
    if (typeof f === 'string') {
      if (f === 'y=mx+c' || f === 'ax+by+c=0') continue; // equation forms are checked on the whole equation
      if (!checkForm(f, e, v)) out.push(FORM_MESSAGES[f]);
    } else {
      const m = f.check(e);
      if (m) out.push(m);
    }
  }
  return out;
}

/** Equation form checks on lhs = rhs. */
export function equationFormErrors(forms: Form[] | undefined, lhs: Expr, rhs: Expr): string[] {
  if (!forms) return [];
  const out: string[] = [];
  for (const f of forms) {
    if (f === 'y=mx+c') {
      const ok = lhs.k === 'sym' && lhs.n === 'y' && !freeSyms(rhs).has('y') && (exprToPoly(rhs, 'x')?.degree ?? 9) <= 1;
      if (!ok) out.push(FORM_MESSAGES['y=mx+c']);
    } else if (f === 'ax+by+c=0') {
      const zero = rhs.k === 'num' && rhs.v.isZero;
      let ok = zero && !hasDecimal(lhs);
      if (ok) {
        const c = evaluate(lhs, { x: 0, y: 0 });
        const a = evaluate(lhs, { x: 1, y: 0 }) - c;
        const b = evaluate(lhs, { x: 0, y: 1 }) - c;
        const lin = Math.abs(evaluate(lhs, { x: 2.5, y: -1.5 }) - (a * 2.5 - b * 1.5 + c)) < 1e-9;
        ok = lin && [a, b, c].every((k) => Math.abs(k - Math.round(k)) < 1e-9) && !some(lhs, (n) => n.k === 'div');
      }
      if (!ok) out.push(FORM_MESSAGES['ax+by+c=0']);
    } else if (f === 'integer-coefficients') {
      if (some(lhs, (n) => n.k === 'div' || n.k === 'dec') || some(rhs, (n) => n.k === 'div' || n.k === 'dec'))
        out.push(FORM_MESSAGES['integer-coefficients']);
    } else if (typeof f !== 'string') {
      const m = f.check({ k: 'add', a: [lhs, { k: 'neg', a: rhs }] });
      if (m) out.push(m);
    }
  }
  return out;
}
