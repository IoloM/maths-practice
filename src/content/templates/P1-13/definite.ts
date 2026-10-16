/** Pure Year 1, Chapter 13 — definite integrals (13.4). */
import { Q, gcd } from '../../../engine/core/rational';
import { Poly } from '../../../engine/core/poly';
import { evaluate, num } from '../../../engine/core/expr';
import { expectClose, integrate, expect } from '../../../engine/core/numeric';
import { parseExpr } from '../../../engine/marking/parse';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, ListSpec } from '../../../engine/marking/types';
import { A1, A1cso, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { dx, niceTerm, unsimplifiedIntegral } from '../shared/calculus';

function checkDefinite(fTex: string, a: number, b: number, value: number, what = 'definite integral') {
  const f = parseExpr(fTex);
  const I = integrate((x) => evaluate(f, { x }), a, b, 1e-12);
  expectClose(I, value, what, 1e-7);
}

const definitePoly = defineTemplate({
  id: 'p1.13.definite-polynomial',
  family: 'p1.13.definite',
  title: 'Exact value of a definite integral',
  spec: ['P8.3', 'P8.1'],
  chapter: 'P1.13',
  sections: ['13.4'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Find'],
  tags: ['integration', 'definite', 'exact'],
  generate(r) {
    const exps = r.sample([1, 2, 3], 2).sort((x, y) => y - x);
    const f = new Poly([...exps.map((e) => ({ c: niceTerm(r, Q.of(e), 3), e: Q.of(e) })), { c: Q.of(r.intNZ(-8, 8)), e: Q.ZERO }]);
    const a = r.int(-2, 2);
    const b = r.int(a + 1, a + 4);
    const F = f.integ();
    const v = F.evalQ(b).sub(F.evalQ(a));
    r.require(!v.isZero && Math.abs(v.value) < 400);
    const fTex = f.toLatex();
    const A: ExactSpec = ans.exact(num(v), ['exact']);
    const errs = [err('reversed-limits', ans.exact(num(v.neg())), 'Subtract the other way round: F(upper limit) − F(lower limit).', 2)];
    if (!F.evalQ(a).isZero && !F.evalQ(b).eq(v)) errs.push(err('lower-limit-ignored', ans.exact(num(F.evalQ(b))), 'You need to subtract the value at the lower limit too.', 2));
    const fd = f.diff();
    const dv = fd.evalQ(b).sub(fd.evalQ(a));
    if (!dv.eq(v) && !dv.eq(v.neg())) errs.push(err('differentiated', ans.exact(num(dv)), 'You differentiated instead of integrating before substituting the limits.'));
    return {
      parts: [
        part({
          marks: 4,
          prompt: md`Find the exact value of $\displaystyle\int_{${a}}^{${b}} \left(${fTex}\right)${dx}$.`,
          answer: A,
          scheme: [
            M1(md`Integrates: $x^{n} \to x^{n+1}$ on at least one term`),
            A1(md`$\left[${F.toLatex()}\right]$ correct`),
            dM1(md`Substitutes the limits $${b}$ and $${a}$ and subtracts the right way round`),
            A1(md`$${answerTex(A)}$ (exact)`),
          ],
          hints: [
            'Integrate first (no + c needed for a definite integral), then use the limits.',
            md`$\int_a^b \mathrm{f}(x)\,\mathrm{d}x = \mathrm{F}(b) - \mathrm{F}(a)$ where $\mathrm{F}$ is the integral of $\mathrm{f}$.`,
            md`$\displaystyle\int \left(${fTex}\right)${dx} = ${F.toLatex()}$`,
          ],
          errors: errs,
          solution: [
            md`$\displaystyle\int_{${a}}^{${b}} \left(${fTex}\right)${dx} = \left[${unsimplifiedIntegral(f)}\right]_{${a}}^{${b}} = \left[${F.toLatex()}\right]_{${a}}^{${b}}$`,
            md`$= \left(${F.evalQ(b).toLatex()}\right) - \left(${F.evalQ(a).toLatex()}\right)$`,
            md`$= ${answerTex(A)}$`,
          ],
        }),
      ],
      params: { fTex, a, b },
    };
  },
  verify(inst) {
    const { fTex, a, b } = inst.params as { fTex: string; a: number; b: number };
    checkDefinite(fTex, a, b, evaluate((inst.parts[0].answer as ExactSpec).value));
  },
});

const definiteRoots = defineTemplate({
  id: 'p1.13.definite-fractional-powers',
  family: 'p1.13.definite',
  title: 'Definite integral with roots and negative powers',
  spec: ['P8.3', 'P2.1'],
  chapter: 'P1.13',
  sections: ['13.4'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find'],
  tags: ['integration', 'definite', 'indices', 'exact'],
  generate(r) {
    const e1 = r.pick([Q.of(1, 2), Q.of(-1, 2), Q.of(3, 2)]);
    const e2 = r.pick([Q.of(-2), Q.of(1), Q.of(2)]);
    r.require(!e1.eq(e2));
    const f = new Poly([e1, e2].map((e) => ({ c: niceTerm(r, e, 3), e })).concat(r.bool(0.5) ? [{ c: Q.of(r.intNZ(-5, 5)), e: Q.ZERO }] : []));
    r.require(f.terms.every((t) => t.c.isInt));
    const [a, b] = r.pick([
      [1, 4],
      [1, 9],
      [4, 9],
      [1, 16],
      [4, 16],
    ] as const);
    const F = f.integ();
    const v = F.evalQ(b).sub(F.evalQ(a));
    r.require(!v.isZero && Math.abs(v.value) < 2000);
    const fDisp = f.toLatex({ style: 'display' });
    const A = ans.exact(num(v), ['exact']);
    return {
      parts: [
        part({
          marks: 5,
          prompt: md`Use algebraic integration to find the exact value of $\displaystyle\int_{${a}}^{${b}} \left(${fDisp}\right)${dx}$.`,
          answer: A,
          scheme: [
            B1(md`Writes the integrand as powers of $x$: $${f.toLatex()}$`),
            M1(md`Integrates: $x^{n} \to x^{n+1}$ on at least one term`),
            A1(md`$${F.toLatex()}$`),
            dM1(md`Substitutes $x = ${b}$ and $x = ${a}$ and subtracts`),
            A1(md`$${answerTex(A)}$`),
          ],
          hints: [
            md`Write $\sqrt{x}$ as $x^{\frac{1}{2}}$ and $\frac{1}{x^{n}}$ as $x^{-n}$ before integrating.`,
            md`After integrating, use $\mathrm{F}(${b}) - \mathrm{F}(${a})$. Powers like $${b}^{\frac{3}{2}}$ are easiest as $\left(\sqrt{${b}}\right)^{3}$.`,
            md`The integrand is $${f.toLatex()}$, which integrates to $${F.toLatex()}$.`,
          ],
          errors: [err('reversed-limits', ans.exact(num(v.neg())), 'Subtract the other way round: F(upper) − F(lower).', 3)],
          solution: [
            md`$\displaystyle\int_{${a}}^{${b}} \left(${f.toLatex()}\right)${dx} = \left[${F.toLatex()}\right]_{${a}}^{${b}}$`,
            md`$= \left(${F.evalQ(b).toLatex()}\right) - \left(${F.evalQ(a).toLatex()}\right) = ${answerTex(A)}$`,
          ],
        }),
      ],
      params: { fTex: fDisp, a, b },
    };
  },
  verify(inst) {
    const { fTex, a, b } = inst.params as { fTex: string; a: number; b: number };
    checkDefinite(fTex, a, b, evaluate((inst.parts[0].answer as ExactSpec).value));
  },
});

const unknownLimit = defineTemplate({
  id: 'p1.13.definite-unknown-limit',
  family: 'p1.13.definite-unknown',
  title: 'Find an unknown limit of a definite integral',
  spec: ['P8.3', 'P2.3'],
  chapter: 'P1.13',
  sections: ['13.4'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 6,
  time: 8,
  commands: ['Show that', 'Hence', 'Find'],
  tags: ['integration', 'definite', 'quadratic', 'show that'],
  generate(r) {
    const a = 2 * r.int(1, 4); // integrand a x + b, a even
    const b = r.intNZ(-6, 8);
    const k = r.int(2, 8);
    const N = (a / 2) * (k * k - 1) + b * (k - 1);
    r.require(N > 0 && N < 300);
    // quadratic (a/2) k^2 + b k - (a/2 + b + N) = 0
    let A2 = a / 2,
      B2 = b,
      C2 = -(a / 2 + b + N);
    const g = gcd(gcd(A2, B2), C2);
    A2 /= g;
    B2 /= g;
    C2 /= g;
    const other = C2 / A2 / k; // product of roots = C/A
    r.require(other < 1);
    const quadTex = `${A2 === 1 ? '' : A2}k^{2} ${B2 < 0 ? '-' : '+'} ${Math.abs(B2) === 1 ? '' : Math.abs(B2)}k ${C2 < 0 ? '-' : '+'} ${Math.abs(C2)} = 0`;
    const fTex = `${a}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}`;
    const F = Poly.coeffs([0, b, a / 2]);
    const L: ListSpec = ans.list([ans.exact(num(k))], { v: 'k' });
    const otherQ = Q.of(C2, A2 * k);
    return {
      stem: md`Given that $k$ is a constant with $k > 1$ and that $\displaystyle\int_{1}^{k} \left(${fTex}\right)${dx} = ${N}$,`,
      parts: [
        part({
          label: 'a',
          marks: 4,
          prompt: md`show that $${quadTex}$.`,
          answer: ans.self(
            md`$\displaystyle\int_{1}^{k} \left(${fTex}\right)${dx} = \left[${F.toLatex()}\right]_{1}^{k} = \left(${F.toLatex({ v: 'k' })}\right) - \left(${F.evalQ(1).toLatex()}\right)$. Setting this equal to $${N}$ and rearranging gives $${quadTex}$.`,
          ),
          scheme: [
            M1(md`Integrates to obtain $${F.toLatex()}$ (at least one term correct)`),
            A1(md`Correct integral`),
            dM1(md`Substitutes limits $k$ and $1$, subtracts, and sets equal to $${N}$`),
            A1cso(md`Rearranges to $${quadTex}$ with no errors (given answer)`),
          ],
          hints: [
            'Integrate, substitute k and 1, then set the result equal to the given value.',
            md`$\left[\mathrm{F}(x)\right]_{1}^{k} = \mathrm{F}(k) - \mathrm{F}(1)$.`,
            md`$\displaystyle\int \left(${fTex}\right)${dx} = ${F.toLatex()}$`,
          ],
          solution: [
            md`$\displaystyle\int_{1}^{k} \left(${fTex}\right)${dx} = \left[${F.toLatex()}\right]_{1}^{k}$`,
            md`$= \left(${F.toLatex({ v: 'k' })}\right) - \left(${F.evalQ(1).toLatex()}\right) = ${N}$`,
            md`$\Rightarrow ${quadTex}$ (as required)`,
          ],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Hence find the value of $k$.`,
          answer: L,
          scheme: [M1(md`Solves the quadratic (factorising, formula or calculator)`), A1(md`$k = ${k}$ only, rejecting $k = ${otherQ.toLatex()}$ since $k > 1$`)],
          hints: [
            md`Solve the quadratic from part (a).`,
            'You should get two roots — use the condition k > 1 to choose.',
            md`The roots of $${quadTex}$ are $k = ${k}$ and $k = ${otherQ.toLatex()}$.`,
          ],
          errors: [err('wrong-root', ans.list([ans.exact(num(otherQ))], { v: 'k' }), md`That root doesn't satisfy $k > 1$ — choose the other one.`, 1)],
          solution: [md`$${quadTex}$ has roots $k = ${k}$ and $k = ${otherQ.toLatex()}$.`, md`Since $k > 1$, $${answerTex(L)}$.`],
        }),
      ],
      params: { a, b, N, k, quad: [A2, B2, C2] },
    };
  },
  verify(inst) {
    const { a, b, N, quad } = inst.params as { a: number; b: number; N: number; quad: number[] };
    const k = evaluate(((inst.parts[1].answer as ListSpec).items[0] as ExactSpec).value);
    expectClose(integrate((x) => a * x + b, 1, k), N, 'integral equals N');
    const [A2, B2, C2] = quad;
    expectClose(A2 * k * k + B2 * k + C2, 0, 'k satisfies the quadratic', 1e-9);
    expect(k > 1, 'k > 1');
  },
});

const templates: Template[] = [definitePoly, definiteRoots, unknownLimit];
export default templates;
