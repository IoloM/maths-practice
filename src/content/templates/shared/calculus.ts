/** Shared helpers for calculus templates. */
import { Q } from '../../../engine/core/rational';
import { Poly } from '../../../engine/core/poly';
import { evaluate, tidy, toLatex } from '../../../engine/core/expr';
import { derivative, expectClose } from '../../../engine/core/numeric';
import { parseExpr } from '../../../engine/marking/parse';
import type { IntegralSpec } from '../../../engine/marking/types';
import type { Instance } from '../../../engine/templates/types';
import type { Rng } from '../../../engine/core/rng';

export const dx = String.raw`\,\mathrm{d}x`;

/** Check an integral answer by numerically differentiating it against an integrand parsed from LaTeX. */
export function checkAntiderivative(inst: Instance, partIdx: number, integrandTex: string, lo = 0.4, hi = 3.6, v = 'x'): void {
  const f = parseExpr(integrandTex);
  const spec = inst.parts[partIdx].answer as IntegralSpec;
  for (let i = 0; i < 9; i++) {
    const x = lo + ((hi - lo) * i) / 8;
    const dF = derivative((t) => evaluate(spec.value, { [v]: t }), x, 1e-5);
    expectClose(dF, evaluate(f, { [v]: x }), `F'(${x})`, 1e-5);
  }
}

/** Coefficient for c·x^e whose integral coefficient is "nice" (mostly an integer). */
export function niceTerm(r: Rng, e: Q, maxMult = 4): Q {
  const e1 = e.add(1);
  const k = r.intNZ(-maxMult, maxMult);
  const kq = r.bool(0.8) ? Q.of(k) : Q.of(k, r.pick([2, 3]));
  return kq.mul(e1);
}

/** Unsimplified antiderivative LaTeX: \frac{6x^{3}}{3} - \frac{4x^{2}}{2} + 5x */
export function unsimplifiedIntegral(p: Poly, v = 'x'): string {
  let s = '';
  p.terms.forEach((t, i) => {
    const e1 = t.e.add(1);
    const a = t.c.abs();
    const pw = e1.eq(1) ? v : `${v}^{${e1.toLatex()}}`;
    const body = t.e.isZero
      ? `${a.toLatex()}${v}`
      : a.isInt
        ? `\\frac{${a.eq(1) ? '' : a.toLatex()}${pw}}{${e1.toLatex()}}`
        : `${a.toLatex()} \\times \\frac{${pw}}{${e1.toLatex()}}`;
    if (i === 0) s += t.c.sign < 0 ? `-${body}` : body;
    else s += t.c.sign < 0 ? ` - ${body}` : ` + ${body}`;
  });
  return s;
}

/** "[F(x)]_a^b" substitution text: (F(b)) - (F(a)) with values. */
export function limitsLine(F: Poly, a: Q | number, b: Q | number, v = 'x'): string {
  const A = Q.from(a),
    B = Q.from(b);
  return String.raw`\left[${F.toLatex({ v })}\right]_{${A.toLatex()}}^{${B.toLatex()}} = \left(${F.evalQ(B).toLatex()}\right) - \left(${F.evalQ(A).toLatex()}\right)`;
}

/** Polynomial expression with its constant term moved to the end (Edexcel ordering). */
export function constantLast(p: Poly): import('../../../engine/core/expr').Expr {
  const c = p.coef(0);
  const rest = p.sub(Poly.coeffs([c]));
  if (c.isZero) return p.toExpr();
  if (rest.isZero) return p.toExpr();
  const e = rest.toExpr();
  const terms = e.k === 'add' ? e.a : [e];
  return { k: 'add', a: [...terms, { k: 'num', v: c }] };
}

/** LaTeX of constantLast. */
export function constantLastTex(p: Poly): string {
  return toLatex(tidy(constantLast(p)));
}
