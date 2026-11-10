/** Pure Year 1, Chapter 8 — long exam-style question: an unknown in a binomial expansion, then a product. */
import { Q, nCr } from '../../../engine/core/rational';
import { Poly } from '../../../engine/core/poly';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, ExprSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';

const longBinomial = defineTemplate({
  id: 'p1.8.long-binomial-unknown-and-product',
  family: 'p1.8.binomial-problems',
  title: 'Exam-style: a binomial expansion with an unknown — find it, then a product and the x³ term',
  spec: ['P4.1'],
  chapter: 'P1.8',
  sections: ['8.3', '8.4'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 10,
  time: 12,
  commands: ['Find', 'Hence'],
  tags: ['exam-style', 'binomial expansion', 'coefficients'],
  generate(r) {
    const n = r.int(5, 8);
    const a = r.pick([1, 2, 3]);
    const k = r.pick([2, 3, 4, -2, -3, 1, -1, 5]);
    // coefficient of x² = m × coefficient of x  ⇔  C(n,2)a^{n−2}k² = m·n·a^{n−1}k  ⇔  m = k(n − 1)/(2a)
    const m = Q.of(k * (n - 1), 2 * a);
    r.require(m.isInt && !m.isZero);
    const c0 = a ** n,
      c1 = n * a ** (n - 1),
      c2 = nCr(n, 2) * a ** (n - 2),
      c3 = nCr(n, 3) * a ** (n - 3);
    r.require(c2 * k * k < 1e5 && Math.abs(c3 * k ** 3) < 1e6);
    const c = r.pick([1, 2, 3, -1, -2]),
      d = r.intNZ(-4, 4);
    const coef2 = c * c2 * k * k + d * c1 * k;
    r.require(coef2 !== 0);
    // (a) in terms of k
    const termsTex = sumTex([[c0, ''], [c1, 'kx'], [c2, 'k^{2}x^{2}']]);
    const EA: ExprSpec = ans.expr(ex(termsTex), ['x', 'k']);
    const noBracket = ans.expr(ex(sumTex([[c0, ''], [c1, 'kx'], [c2, 'kx^{2}']])), ['x', 'k']);
    const K: ExactSpec = ans.exact(num(k));
    const C2: ExactSpec = ans.exact(num(coef2));
    const T3: ExprSpec = ans.expr(ex(sumTex([[c3 * k ** 3, 'x^{3}']])), ['x']);
    const brk = `(${a} ${'+'} kx)`;
    const prod = `(${sumTex([[c, ''], [d, 'x']])})`;
    const gx = Poly.coeffs([c0, c1 * k, c2 * k * k, c3 * k ** 3]);
    return {
      stem: md`$\mathrm{g}(x) = ${brk}^{${n}}$, where $k$ is a non-zero constant.`,
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: md`Find the first 3 terms, in ascending powers of $x$, of the binomial expansion of $\mathrm{g}(x)$. Give each term in simplest form, in terms of $k$.`,
          answer: EA,
          scheme: [B1(md`$${c0}$`), M1(md`$\binom{${n}}{1}${a === 1 ? '' : `(${a})^{${n - 1}}`}(kx) + \binom{${n}}{2}${a === 1 ? '' : `(${a})^{${n - 2}}`}(kx)^{2}$`), A1(md`$${termsTex}$`)],
          hints: [md`$(a + bx)^{n} = a^{n} + \binom{n}{1}a^{n-1}bx + \binom{n}{2}a^{n-2}(bx)^{2} + \dots$`, md`Here the second term inside the bracket is $kx$, so square all of it: $(kx)^{2} = k^{2}x^{2}$.`, md`$\binom{${n}}{1} = ${n}$ and $\binom{${n}}{2} = ${nCr(n, 2)}$.`],
          errors: [err('no-bracket', noBracket, md`$(kx)^{2} = k^{2}x^{2}$: square the $k$ as well.`, 2)],
          solution: [md`$\mathrm{g}(x) = ${termsTex} + \dots$`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Given that, in this expansion, the coefficient of $x^{2}$ is $${m.toLatex()}$ times the coefficient of $x$, find the value of $k$.`,
          answer: K,
          scheme: [M1(md`$${c2}k^{2} = ${m.toLatex()} \times ${c1}k$`), A1(md`$k = ${k}$ (as $k \neq 0$)`)],
          hints: ['Write an equation linking the two coefficients.', md`$${c2}k^{2} = ${m.mul(c1).toLatex()}k$`, 'Divide by k (k is not zero).'],
          errors: [err('swapped', ans.exact(num(Q.of(c1, m.value * c2))), 'Check which coefficient is the multiple of which.')],
          solution: [md`$${c2}k^{2} = ${m.toLatex()} \times ${c1}k \Rightarrow ${c2}k = ${m.mul(c1).toLatex()} \Rightarrow k = ${k}$`],
        }),
        part({
          label: 'c',
          marks: 3,
          prompt: md`Using your value of $k$, find the coefficient of $x^{2}$ in the expansion of $${prod}\,\mathrm{g}(x)$.`,
          answer: C2,
          scheme: [M1(md`Expansion with $k = ${k}$: $${sumTex([[c0, ''], [c1 * k, 'x'], [c2 * k * k, 'x^{2}']])}$`), dM1(md`Two products give $x^{2}$: $${c} \times ${c2 * k * k}$ and $${d} \times ${c1 * k}$`), A1(md`$${coef2}$`)],
          hints: [md`With $k = ${k}$, $\mathrm{g}(x) = ${sumTex([[c0, ''], [c1 * k, 'x'], [c2 * k * k, 'x^{2}']])} + \dots$`, md`An $x^{2}$ term comes from $${c} \times (x^{2}\text{ term})$ and from $${d}x \times (x\text{ term})$.`, md`$${c}(${c2 * k * k}) + (${d})(${c1 * k})$`],
          errors: [err('one-product', ans.exact(num(c * c2 * k * k)), md`There is a second $x^{2}$ term: $${d}x$ times the $x$ term.`, 1)],
          solution: [md`$${c}(${c2 * k * k}) + (${d})(${c1 * k}) = ${coef2}$`],
        }),
        part({
          label: 'd',
          marks: 2,
          prompt: md`Find the term in $x^{3}$ in the expansion of $\mathrm{g}(x)$.`,
          answer: T3,
          scheme: [M1(md`$\binom{${n}}{3}${a === 1 ? '' : `(${a})^{${n - 3}}`}(${k}x)^{3}$`), A1(md`$${answerTex(T3)}$`)],
          hints: [md`The $x^{3}$ term is $\binom{${n}}{3}a^{${n}-3}(kx)^{3}$.`, md`$\binom{${n}}{3} = ${nCr(n, 3)}$`, md`$(${k}x)^{3} = ${k ** 3}x^{3}$`],
          errors: [err('coefficient-only', ans.expr(num(c3 * k ** 3), ['x']), md`Give the term, including $x^{3}$.`, 1)],
          solution: [md`$\binom{${n}}{3}${a === 1 ? '' : `(${a})^{${n - 3}}`}(${k}x)^{3} = ${answerTex(T3)}$`],
        }),
      ],
      params: { n, a, k, c, d, m: m.value, g: [0, 1, 2, 3].map((e) => gx.coef(e).value) },
    };
  },
  verify(inst) {
    const { n, a, k, c, d, m } = inst.params as Record<string, number>;
    const ea = (inst.parts[0].answer as ExprSpec).value;
    // the three terms agree with (a + kx)^n up to O(x³)
    for (const x of [0.0005, -0.0007]) expect(Math.abs(evaluate(ea, { x, k }) - (a + k * x) ** n) < 1e-6 * a ** n * 40, 'series in k');
    // coefficients from finite differences of (a + kx)^n at 0
    const h = 1e-3;
    const G = (x: number) => (a + k * x) ** n;
    const g1 = (G(h) - G(-h)) / (2 * h),
      g2 = (G(h) - 2 * G(0) + G(-h)) / (2 * h * h);
    expectClose(g2, m * g1, 'x² coefficient = m × x coefficient', 1e-4);
    // product coefficient by multiplying the polynomials
    const P = Poly.coeffs([c, d]).mul(Poly.coeffs([a ** n, n * a ** (n - 1) * k, ((n * (n - 1)) / 2) * a ** (n - 2) * k * k]));
    expectClose(evaluate((inst.parts[2].answer as ExactSpec).value), P.coef(2).value, 'coefficient of x² in the product');
    expectClose(evaluate((inst.parts[3].answer as ExprSpec).value, { x: 1 }), ((n * (n - 1) * (n - 2)) / 6) * a ** (n - 3) * k ** 3, 'x³ term');
  },
});

export default [longBinomial] satisfies Template[];
