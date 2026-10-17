/** Pure Year 2, Chapter 1 — partial fractions: distinct and repeated linear factors, improper fractions (1.3–1.5). */
import { Q } from '../../../engine/core/rational';
import { Poly } from '../../../engine/core/poly';
import { type Expr, evaluate } from '../../../engine/core/expr';
import { expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import { exprToPoly } from '../../../engine/marking/forms';
import type { CustomForm, ExprSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex } from '../shared/calculus';
import { PARTIAL_FRACTIONS } from '../P2-11/methods';

type Lin = { p: number; q: number }; // px + q
const linPoly = (l: Lin) => Poly.coeffs([l.q, l.p]);
const linTex = (l: Lin) => linPoly(l).toLatex();
const root = (l: Lin) => -l.q / l.p;
/** "\frac{A}{L}" with the sign pulled out front when joining terms. */
function fracSum(terms: [number, string][]): string {
  let s = '';
  for (const [c, den] of terms) {
    if (c === 0) continue;
    const t = `\\frac{${Math.abs(c)}}{${den}}`;
    s += s === '' ? (c < 0 ? `-${t}` : t) : c < 0 ? ` - ${t}` : ` + ${t}`;
  }
  return s;
}
function pickLin(r: Parameters<Template['generate']>[0], others: Lin[] = []): Lin {
  for (;;) {
    const l = { p: r.pick([1, 1, 1, 2, 3]), q: r.intNZ(-5, 5) };
    if (l.p > 1 && l.q % l.p === 0) continue;
    if (others.every((o) => Math.abs(root(o) - root(l)) > 1e-9)) return l;
  }
}
/** Domain clear of every pole. */
const domainPast = (ls: Lin[]) => {
  const top = Math.max(...ls.map(root));
  return { x: [top + 0.6, top + 6] as [number, number] };
};

/** A polynomial (possibly constant) plus partial fractions. */
const POLY_PLUS_PF: CustomForm = {
  label: 'polynomial plus partial fractions',
  check(e: Expr) {
    const terms = e.k === 'add' ? e.a : [e];
    const fracs = terms.filter((t) => {
      const p = exprToPoly(t, 'x');
      return !p; // not itself a polynomial
    });
    if (!fracs.length) return 'Write the answer with partial fractions.';
    const msg = PARTIAL_FRACTIONS.check(fracs.length === 1 ? { k: 'add', a: [...fracs, ...fracs] } : { k: 'add', a: fracs });
    return msg;
  },
};

const twoLinear = defineTemplate({
  id: 'p2.1.partial-fractions-two-linear',
  family: 'p2.1.partial-fractions',
  title: 'Partial fractions with two distinct linear factors',
  spec: ['P2.10'],
  chapter: 'P2.1',
  sections: ['1.3'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Express'],
  tags: ['partial fractions', 'algebraic fractions'],
  generate(r) {
    const L1 = pickLin(r),
      L2 = pickLin(r, [L1]);
    const A = r.intNZ(-6, 6),
      B = r.intNZ(-6, 6);
    const N = linPoly(L2).scale(A).add(linPoly(L1).scale(B));
    r.require(!N.isZero && N.terms.length >= 1);
    const den = linPoly(L1).mul(linPoly(L2));
    const expanded = L1.p === 1 && L2.p === 1 && r.bool(0.6);
    const fTex = `\\frac{${N.toLatex()}}{${expanded ? den.toLatex() : `(${linTex(L1)})(${linTex(L2)})`}}`;
    const pf = fracSum([
      [A, linTex(L1)],
      [B, linTex(L2)],
    ]);
    const E: ExprSpec = ans.expr(ex(pf), ['x'], { domain: domainPast([L1, L2]), forms: [PARTIAL_FRACTIONS] });
    const swapped = fracSum([
      [B, linTex(L1)],
      [A, linTex(L2)],
    ]);
    return {
      parts: [
        part({
          marks: 4,
          prompt: md`Express $${fTex}$ in partial fractions.`,
          answer: E,
          scheme: [
            ...(expanded ? [B1(md`Factorises the denominator: $(${linTex(L1)})(${linTex(L2)})$`)] : [B1(md`Correct form $\dfrac{A}{${linTex(L1)}} + \dfrac{B}{${linTex(L2)}}$`)]),
            M1(md`$${N.toLatex()} \equiv A(${linTex(L2)}) + B(${linTex(L1)})$ and substitutes or compares coefficients`),
            A1('One constant correct'),
            A1(md`$${pf}$`),
          ],
          hints: [
            expanded ? md`Factorise the denominator first: $${den.toLatex()} = (${linTex(L1)})(${linTex(L2)})$.` : md`Write $${fTex} \equiv \dfrac{A}{${linTex(L1)}} + \dfrac{B}{${linTex(L2)}}$.`,
            md`Multiply through: $${N.toLatex()} \equiv A(${linTex(L2)}) + B(${linTex(L1)})$.`,
            md`Substitute $x = ${Q.of(-L1.q, L1.p).toLatex()}$ to find $A$, and $x = ${Q.of(-L2.q, L2.p).toLatex()}$ to find $B$.`,
          ],
          errors: A === B ? [] : [err('swapped', ans.expr(ex(swapped), ['x'], { domain: domainPast([L1, L2]) }), 'Check which constant belongs over which factor: substitute the root of each factor.', 2)],
          solution: [
            md`$${N.toLatex()} \equiv A(${linTex(L2)}) + B(${linTex(L1)})$`,
            md`$x = ${Q.of(-L1.q, L1.p).toLatex()}$: $A = ${A}$. $\quad x = ${Q.of(-L2.q, L2.p).toLatex()}$: $B = ${B}$.`,
            md`$${fTex} = ${answerTex(E)}$`,
          ],
        }),
      ],
      params: { L1, L2, A, B },
    };
  },
  verify(inst) {
    const { L1, L2, A, B } = inst.params as { L1: Lin; L2: Lin; A: number; B: number };
    const x = root(L1) + root(L2) + 7.31;
    const f = (A * (L2.p * x + L2.q) + B * (L1.p * x + L1.q)) / ((L1.p * x + L1.q) * (L2.p * x + L2.q));
    expectClose(evaluate((inst.parts[0].answer as ExprSpec).value, { x }), f, 'identity');
  },
});

const threeFactors = defineTemplate({
  id: 'p2.1.partial-fractions-three-or-repeated',
  family: 'p2.1.partial-fractions',
  title: 'Partial fractions with three linear factors or a repeated factor',
  spec: ['P2.10'],
  chapter: 'P2.1',
  sections: ['1.3', '1.4'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 7,
  commands: ['Express', 'Find'],
  tags: ['partial fractions', 'repeated factor'],
  generate(r) {
    const repeated = r.bool(0.6);
    const L1 = pickLin(r),
      L2 = pickLin(r, [L1]),
      L3 = repeated ? L2 : pickLin(r, [L1, L2]);
    const A = r.intNZ(-5, 5),
      B = repeated ? r.int(-5, 5) : r.intNZ(-5, 5),
      C = r.intNZ(-5, 5);
    const P1 = linPoly(L1),
      P2 = linPoly(L2),
      P3 = linPoly(L3);
    // A/L1 + B/L2 + C/L3  (repeated: L3 slot is (L2)^2)
    const N = repeated ? P2.mul(P2).scale(A).add(P1.mul(P2).scale(B)).add(P1.scale(C)) : P2.mul(P3).scale(A).add(P1.mul(P3).scale(B)).add(P1.mul(P2).scale(C));
    r.require(!N.isZero);
    const denTex = repeated ? `(${linTex(L1)})(${linTex(L2)})^{2}` : `(${linTex(L1)})(${linTex(L2)})(${linTex(L3)})`;
    const fTex = `\\frac{${N.toLatex()}}{${denTex}}`;
    const pf = fracSum([
      [A, linTex(L1)],
      [B, linTex(L2)],
      [C, repeated ? `(${linTex(L2)})^{2}` : linTex(L3)],
    ]);
    const E: ExprSpec = ans.expr(ex(pf), ['x'], { domain: domainPast([L1, L2, L3]), forms: [PARTIAL_FRACTIONS] });
    const form = repeated ? md`\dfrac{A}{${linTex(L1)}} + \dfrac{B}{${linTex(L2)}} + \dfrac{C}{(${linTex(L2)})^{2}}` : md`\dfrac{A}{${linTex(L1)}} + \dfrac{B}{${linTex(L2)}} + \dfrac{C}{${linTex(L3)}}`;
    const ident = repeated ? md`A(${linTex(L2)})^{2} + B(${linTex(L1)})(${linTex(L2)}) + C(${linTex(L1)})` : md`A(${linTex(L2)})(${linTex(L3)}) + B(${linTex(L1)})(${linTex(L3)}) + C(${linTex(L1)})(${linTex(L2)})`;
    return {
      parts: [
        part({
          marks: 5,
          prompt: md`Express $${fTex}$ in partial fractions.`,
          answer: E,
          scheme: [B1(md`Correct form $${form}$`), M1(md`$${N.toLatex()} \equiv ${ident}$`), M1(repeated ? 'Substitutes the roots to find A and C, then compares coefficients for B' : 'Substitutes each root'), A1('Two constants correct'), A1(md`$${pf}$`)],
          hints: [repeated ? md`A repeated factor needs two fractions: $\dfrac{B}{${linTex(L2)}} + \dfrac{C}{(${linTex(L2)})^{2}}$.` : 'Use one fraction for each linear factor.', md`Multiply through: $${N.toLatex()} \equiv ${ident}$.`, repeated ? md`Substituting $x = ${Q.of(-L1.q, L1.p).toLatex()}$ and $x = ${Q.of(-L2.q, L2.p).toLatex()}$ gives $A$ and $C$; compare the $x^{2}$ coefficients to find $B$.` : 'Substitute the root of each factor in turn.'],
          errors: repeated ? [err('missing-repeated-term', ans.expr(ex(fracSum([[A, linTex(L1)], [C, `(${linTex(L2)})^{2}`]])), ['x'], { domain: domainPast([L1, L2]) }), md`You need both $\dfrac{B}{${linTex(L2)}}$ and $\dfrac{C}{(${linTex(L2)})^{2}}$.`, 2)] : [],
          solution: [md`$${N.toLatex()} \equiv ${ident}$`, md`$A = ${A}$, $B = ${B}$, $C = ${C}$`, md`$${fTex} = ${answerTex(E)}$`],
        }),
      ],
      params: { L1, L2, L3, A, B, C, repeated },
    };
  },
  verify(inst) {
    const { L1, L2, L3, A, B, C, repeated } = inst.params as { L1: Lin; L2: Lin; L3: Lin; A: number; B: number; C: number; repeated: boolean };
    const v = (l: Lin, x: number) => l.p * x + l.q;
    for (const x of [8.17, 11.3]) {
      const f = A / v(L1, x) + B / v(L2, x) + C / (repeated ? v(L2, x) ** 2 : v(L3, x));
      expectClose(evaluate((inst.parts[0].answer as ExprSpec).value, { x }), f, 'identity');
    }
  },
});

const improper = defineTemplate({
  id: 'p2.1.improper-partial-fractions',
  family: 'p2.1.partial-fractions',
  title: 'Improper fractions: divide, then partial fractions',
  spec: ['P2.10', 'P2.6'],
  chapter: 'P2.1',
  sections: ['1.5'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 5,
  time: 7,
  commands: ['Express', 'Find'],
  tags: ['partial fractions', 'algebraic division', 'improper fractions'],
  generate(r) {
    const L1 = pickLin(r),
      L2 = pickLin(r, [L1]);
    const k = r.intNZ(-4, 4),
      A = r.intNZ(-6, 6),
      B = r.intNZ(-6, 6);
    const D = linPoly(L1).mul(linPoly(L2));
    const N = D.scale(k).add(linPoly(L2).scale(A)).add(linPoly(L1).scale(B));
    const lead = D.terms[0].c; // leading coefficient of the denominator
    const kq = Q.of(k);
    r.require(lead.eq(1) || r.bool(0.4));
    const fTex = `\\frac{${N.toLatex()}}{${D.toLatex()}}`;
    const pf = `${k}${fracSum([
      [A, linTex(L1)],
      [B, linTex(L2)],
    ]).replace(/^(?!-)/, ' + ').replace(/^-/, ' - ')}`;
    const E: ExprSpec = ans.expr(ex(pf), ['x'], { domain: domainPast([L1, L2]), forms: [POLY_PLUS_PF] });
    return {
      stem: md`$\mathrm{f}(x) = ${fTex}$, $\; x > ${(root(L1) > root(L2) ? Q.of(-L1.q, L1.p) : Q.of(-L2.q, L2.p)).toLatex()}$`,
      parts: [
        part({
          marks: 5,
          prompt: md`Given that $\mathrm{f}(x)$ can be written as $A + \dfrac{B}{${linTex(L1)}} + \dfrac{C}{${linTex(L2)}}$, find the values of the constants $A$, $B$ and $C$, and hence write $\mathrm{f}(x)$ in this form.`,
          answer: E,
          scheme: [M1('Divides, or compares x² coefficients, to find A'), A1(md`$A = ${k}$`), M1(md`$${N.toLatex()} \equiv A(${D.toLatex()}) + B(${linTex(L2)}) + C(${linTex(L1)})$ and substitutes`), A1('One of B, C correct'), A1(md`$${pf}$`)],
          hints: ['The numerator has the same degree as the denominator, so the fraction is improper — there is a constant term.', md`Compare the $x^{2}$ coefficients: $A = \dfrac{${N.terms[0].c.toLatex()}}{${lead.toLatex()}}$.`, md`Then $${N.toLatex()} \equiv A(${D.toLatex()}) + B(${linTex(L2)}) + C(${linTex(L1)})$: substitute the roots of the linear factors.`],
          errors: [err('no-constant', ans.expr(ex(fracSum([[A, linTex(L1)], [B, linTex(L2)]])), ['x'], { domain: domainPast([L1, L2]) }), 'An improper fraction needs a polynomial part (here the constant A) as well.', 2)],
          solution: [md`Comparing $x^{2}$ terms: $A = ${kq.toLatex()}$.`, md`$x = ${Q.of(-L1.q, L1.p).toLatex()}$ gives $B = ${A}$; $x = ${Q.of(-L2.q, L2.p).toLatex()}$ gives $C = ${B}$.`, md`$\mathrm{f}(x) = ${answerTex(E)}$`],
        }),
      ],
      params: { L1, L2, k, A, B },
    };
  },
  verify(inst) {
    const { L1, L2, k, A, B } = inst.params as { L1: Lin; L2: Lin; k: number; A: number; B: number };
    const v = (l: Lin, x: number) => l.p * x + l.q;
    const x = 9.4;
    const f = (k * v(L1, x) * v(L2, x) + A * v(L2, x) + B * v(L1, x)) / (v(L1, x) * v(L2, x));
    expectClose(evaluate((inst.parts[0].answer as ExprSpec).value, { x }), f, 'identity');
  },
});

const templates: Template[] = [twoLinear, threeFactors, improper];
export default templates;
