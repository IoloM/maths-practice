/** Pure Year 1, Chapter 8 — the binomial expansion for positive integer n. */
import { Q, nCr } from '../../../engine/core/rational';
import { Poly } from '../../../engine/core/poly';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, ExprSpec, ListSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { sumTex } from '../shared/calculus';

/** First k+1 terms (ascending) of (a + bx)^n as a Poly. */
function expansion(a: Q, b: Q, n: number, terms: number): Poly {
  return Poly.coeffs(Array.from({ length: terms }, (_, r0) => Q.of(nCr(n, r0)).mul(a.pow(n - r0)).mul(b.pow(r0))));
}
const brk = (a: Q, b: Q) => `\\left(${sumTex([[a, ''], [b, 'x']])}\\right)`;

const coefficient = defineTemplate({
  id: 'p1.8.coefficient-of-term',
  family: 'p1.8.binomial',
  title: 'Coefficient of a term in a binomial expansion',
  spec: ['P4.1'],
  chapter: 'P1.8',
  sections: ['8.3'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 2,
  time: 3,
  commands: ['Find'],
  tags: ['binomial expansion', 'coefficients'],
  generate(r) {
    const n = r.int(4, 10),
      k = r.int(2, Math.min(5, n - 1));
    const a = Q.of(r.pick([1, 2, 3, -1, -2])),
      b = Q.of(r.pick([1, 2, 3, -2, -3, 4, -1]));
    const c = Q.of(nCr(n, k)).mul(a.pow(n - k)).mul(b.pow(k));
    r.require(Math.abs(c.value) < 1e6);
    const A = ans.exact(num(c));
    return {
      parts: [
        part({
          marks: 2,
          prompt: md`Find the coefficient of $x^{${k}}$ in the expansion of $${brk(a, b)}^{${n}}$.`,
          answer: A,
          scheme: [M1(md`$\binom{${n}}{${k}}(${a.toLatex()})^{${n - k}}(${b.toLatex()})^{${k}}$`), A1(md`$${answerTex(A)}$`)],
          hints: [md`The general term is $\binom{n}{r}a^{n-r}(bx)^{r}$.`, md`You need $r = ${k}$.`, md`$\binom{${n}}{${k}} = ${nCr(n, k)}$`],
          errors: [err('forgot-b-power', ans.exact(num(Q.of(nCr(n, k)).mul(a.pow(n - k)).mul(b))), md`Raise the coefficient of $x$ to the power too: $(${b.toLatex()})^{${k}}$.`, 1), err('sign', ans.exact(num(c.neg())), 'Check the sign: a negative number to an odd power stays negative.', 1)],
          solution: [md`$\binom{${n}}{${k}}(${a.toLatex()})^{${n - k}}(${b.toLatex()})^{${k}} = ${nCr(n, k)} \times ${a.pow(n - k).toLatex()} \times ${b.pow(k).toLatex()} = ${answerTex(A)}$`],
        }),
      ],
      params: { a: a.value, b: b.value, n, k },
    };
  },
  verify(inst) {
    const { a, b, n, k } = inst.params as Record<string, number>;
    // coefficient via k-th derivative at 0 / k! computed from the polynomial product
    let p = Poly.coeffs([1]);
    for (let i = 0; i < n; i++) p = p.mul(Poly.coeffs([a, b]));
    expectClose(evaluate((inst.parts[0].answer as ExactSpec).value), p.coef(k).value, 'coefficient');
  },
});

const firstTerms = defineTemplate({
  id: 'p1.8.first-four-terms',
  family: 'p1.8.binomial',
  title: 'First four terms of a binomial expansion',
  spec: ['P4.1'],
  chapter: 'P1.8',
  sections: ['8.3'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Find'],
  tags: ['binomial expansion', 'ascending powers'],
  generate(r) {
    const n = r.int(5, 9);
    const a = Q.of(r.pick([1, 2, 3])),
      b = r.pick([Q.of(1, 2), Q.of(2), Q.of(-3), Q.of(-1, 2), Q.of(3), Q.of(-2), Q.of(1, 3)]);
    const P = expansion(a, b, n, 4);
    r.require(P.terms.every((t) => Math.abs(t.c.value) < 1e5));
    const E: ExprSpec = ans.expr(P.toExpr(), ['x']);
    return {
      parts: [
        part({
          marks: 4,
          prompt: md`Find the first 4 terms, in ascending powers of $x$, of the binomial expansion of $${brk(a, b)}^{${n}}$, giving each term in its simplest form.`,
          answer: E,
          scheme: [B1(md`$${P.coef(0).toLatex()}$`), M1(md`Correct structure: $\binom{${n}}{r}(${a.toLatex()})^{${n}-r}(${b.toLatex()}x)^{r}$`), A1('Two of the x terms correct'), A1(md`$${answerTex(E)}$`)],
          hints: [md`$(a + bx)^{n} = a^{n} + \binom{n}{1}a^{n-1}(bx) + \binom{n}{2}a^{n-2}(bx)^{2} + \dots$`, md`Here $a = ${a.toLatex()}$, $b = ${b.toLatex()}$ and $n = ${n}$.`, md`$\binom{${n}}{1} = ${n}$, $\binom{${n}}{2} = ${nCr(n, 2)}$, $\binom{${n}}{3} = ${nCr(n, 3)}$`],
          errors: [err('no-bracket', ans.expr(Poly.coeffs(Array.from({ length: 4 }, (_, r0) => Q.of(nCr(n, r0)).mul(a.pow(n - r0)).mul(b))).toExpr(), ['x']), md`Put brackets round $(${b.toLatex()}x)$ — the coefficient must be raised to the power as well.`, 2)],
          solution: [md`$${brk(a, b)}^{${n}} = ${P.toLatex()} + \dots$`, md`$${answerTex(E)}$`],
        }),
      ],
      params: { a: a.value, b: b.value, n },
    };
  },
  verify(inst) {
    const { a, b, n } = inst.params as Record<string, number>;
    const e = (inst.parts[0].answer as ExprSpec).value;
    // truncation error is O(x⁴): compare at small x
    for (const x of [0.001, -0.002]) expect(Math.abs(evaluate(e, { x }) - (a + b * x) ** n) < 1e-6 * Math.max(1, Math.abs(a) ** n) * 50, 'truncated series');
  },
});

const estimate = defineTemplate({
  id: 'p1.8.binomial-estimate',
  family: 'p1.8.binomial-estimation',
  title: 'Use a binomial expansion to estimate a power',
  spec: ['P4.1'],
  chapter: 'P1.8',
  sections: ['8.5'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 7,
  commands: ['Find', 'Use', 'Estimate'],
  tags: ['binomial expansion', 'estimation'],
  generate(r) {
    const n = r.int(6, 12);
    const k = r.pick([2, 3, 4, 5]);
    const P = expansion(Q.ONE, Q.of(k), n, 3);
    const target = r.pick([0.01, 0.02, 0.001, 0.005]);
    const xv = target / k;
    r.require(Number.isFinite(xv));
    const base = 1 + target;
    const est = P.eval(xv);
    const E: ExprSpec = ans.expr(P.toExpr(), ['x']);
    const S = ans.num(est, { dp: 4 });
    return {
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find the first 3 terms, in ascending powers of $x$, of the expansion of $(1 + ${k}x)^{${n}}$.`, answer: E, scheme: [B1('1'), M1(md`$\binom{${n}}{2}(${k}x)^{2}$`), A1(md`$${answerTex(E)}$`)], hints: ['Use (1 + y)ⁿ = 1 + ny + n(n − 1)/2 · y² + … with y = kx.', md`$y = ${k}x$`, md`$\binom{${n}}{2} = ${nCr(n, 2)}$`], solution: [md`$(1 + ${k}x)^{${n}} = ${answerTex(E)} + \dots$`] }),
        part({ label: 'b', marks: 2, prompt: md`Use your expansion with a suitable value of $x$ to estimate $${fmtNum(base)}^{${n}}$, giving your answer to 4 decimal places.`, answer: S, ft: (prev) => (prev.a?.expr ? ans.num(evaluate(prev.a.expr, { x: xv }), { dp: 4 }) : null), scheme: [M1(md`Uses $x = ${fmtNum(xv)}$`), A1(md`$${answerTex(S)}$`)], hints: [md`Choose $x$ so that $1 + ${k}x = ${fmtNum(base)}$.`, md`$x = ${fmtNum(xv)}$`, 'Substitute into your three terms.'], errors: [err('wrong-x', ans.num(P.eval(target), { dp: 4 }), md`You need $1 + ${k}x = ${fmtNum(base)}$, so $x = ${fmtNum(xv)}$, not $${fmtNum(target)}$.`, 1)], solution: [md`$x = ${fmtNum(xv)}$: $${P.toLatex().replace(/x/g, `(${fmtNum(xv)})`)} = ${answerTex(S)}$`] }),
      ],
      params: { n, base },
    };
  },
  verify(inst) {
    const { n, base } = inst.params as Record<string, number>;
    const t = base - 1;
    // truncation error of the 3-term expansion is about C(n,3)t³
    expect(Math.abs((inst.parts[1].answer as NumericSpec).value - base ** n) < 2 * nCr(n, 3) * t ** 3 * base ** n + 1e-4, 'close to true power');
  },
});

const findUnknown = defineTemplate({
  id: 'p1.8.find-unknown-coefficient',
  family: 'p1.8.binomial-problems',
  title: 'Find an unknown constant from a coefficient',
  spec: ['P4.1'],
  chapter: 'P1.8',
  sections: ['8.4'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 4,
  time: 6,
  commands: ['Find'],
  tags: ['binomial expansion', 'unknown constant'],
  generate(r) {
    const n = r.int(5, 10);
    const a = r.pick([2, 3, 4, 5, Q.of(1, 2).value]);
    const k = r.int(2, 3);
    const c = nCr(n, k) * a ** k;
    r.require(Number.isInteger(c));
    const neg = k % 2 === 0 && r.bool(0.4);
    const L: ListSpec = ans.list(neg ? [ans.exact(num(Q.from(a))), ans.exact(num(Q.from(-a)))] : [ans.exact(num(Q.from(a)))], { v: 'a' });
    return {
      stem: md`The coefficient of $x^{${k}}$ in the expansion of $(1 + ax)^{${n}}$ is $${c}$${neg ? '' : ', where $a > 0$'}.`,
      parts: [part({ marks: 4, prompt: md`Find the possible value${neg ? 's' : ''} of $a$.`, answer: L, scheme: [M1(md`$\binom{${n}}{${k}}a^{${k}} = ${c}$`), A1(md`$a^{${k}} = ${fmtNum(a ** k)}$`), M1('Takes the root'), A1(md`$${answerTex(L)}$`)], hints: [md`The $x^{${k}}$ term is $\binom{${n}}{${k}}(ax)^{${k}}$.`, md`$\binom{${n}}{${k}} = ${nCr(n, k)}$`, k === 2 ? 'Square roots give ± solutions.' : 'Cube roots have one real solution.'], solution: [md`$${nCr(n, k)}a^{${k}} = ${c} \Rightarrow a^{${k}} = ${fmtNum(a ** k)}$`, md`$${answerTex(L)}$`] })],
      params: { n, k, c },
    };
  },
  verify(inst) {
    const { n, k, c } = inst.params as Record<string, number>;
    for (const it of (inst.parts[0].answer as ListSpec).items) expectClose(nCr(n, k) * evaluate((it as ExactSpec).value) ** k, c, 'coefficient');
  },
});

const templates: Template[] = [coefficient, firstTerms, estimate, findUnknown];
export default templates;
