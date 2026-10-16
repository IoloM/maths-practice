/** Pure Year 1, Chapter 13 — indefinite integration and finding functions (13.1–13.3). */
import { Q } from '../../../engine/core/rational';
import { Poly } from '../../../engine/core/poly';
import { evaluate } from '../../../engine/core/expr';
import { derivative, expectClose } from '../../../engine/core/numeric';
import { parseExpr } from '../../../engine/marking/parse';
import { answerTex } from '../../../engine/marking/mark';
import type { ExprSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { checkAntiderivative, constantLast, constantLastTex, dx, niceTerm, unsimplifiedIntegral } from '../shared/calculus';

const integerPowers = defineTemplate({
  id: 'p1.13.integrate-polynomial',
  family: 'p1.13.indefinite',
  title: 'Integrate a polynomial',
  spec: ['P8.1', 'P8.2'],
  chapter: 'P1.13',
  sections: ['13.1', '13.2'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 1,
  marks: 3,
  time: 3,
  commands: ['Find'],
  tags: ['integration', 'indefinite', 'polynomial'],
  generate(r) {
    const exps = r.sample([1, 2, 3, 4, 5], 2).sort((a, b) => b - a);
    const terms = exps.map((e) => ({ c: niceTerm(r, Q.of(e), 3), e: Q.of(e) }));
    const k = r.intNZ(-9, 9);
    const f = new Poly([...terms, { c: Q.of(k), e: Q.ZERO }]);
    const fTex = f.toLatex();
    const Fp = f.integ();
    const A = ans.integral(Fp.toExpr());
    const wrongNoDivide = new Poly(f.terms.map((t) => ({ c: t.c, e: t.e.add(1) })));
    const t0 = f.terms[0];
    return {
      parts: [
        part({
          marks: 3,
          prompt: md`Find $\displaystyle\int \left(${fTex}\right)${dx}$.`,
          answer: A,
          scheme: [
            M1(md`Raises the power by one on at least one term: $x^{n} \to x^{n+1}$`),
            A1(md`Two terms correct (may be unsimplified)`),
            A1(md`$${answerTex(A)}$, all correct including $+\,c$`),
          ],
          hints: [
            'Integrate term by term — each term separately.',
            md`Use $\int x^{n}\,\mathrm{d}x = \dfrac{x^{n+1}}{n+1} + c$: add one to the power, then divide by the new power. A constant $k$ integrates to $kx$.`,
            md`First term: $\int ${new Poly([t0]).toLatex()}${dx} = \dfrac{${t0.c.toLatex()}x^{${t0.e.add(1).n}}}{${t0.e.add(1).n}}$, then simplify.`,
          ],
          errors: [
            err('differentiated', ans.expr(f.diff().toExpr()), 'You have differentiated instead of integrating — the power should go up by one, not down.'),
            err('no-divide', ans.integral(wrongNoDivide.toExpr()), 'You raised the powers but did not divide by the new power.', 1),
          ],
          solution: [
            md`Integrate each term using $\int x^{n}\,\mathrm{d}x = \dfrac{x^{n+1}}{n+1}$:`,
            md`$\displaystyle\int \left(${fTex}\right)${dx} = ${unsimplifiedIntegral(f)} + c$`,
            md`$= ${answerTex(A)}$`,
          ],
        }),
      ],
      params: { fTex },
    };
  },
  verify(inst) {
    checkAntiderivative(inst, 0, inst.params.fTex as string, -3, 3);
  },
});

const ROOT_EXPS: [number, number][] = [
  [1, 2],
  [-1, 2],
  [3, 2],
  [-2, 1],
  [-3, 1],
  [-3, 2],
];

const fractionalPowers = defineTemplate({
  id: 'p1.13.integrate-fractional-negative',
  family: 'p1.13.indefinite',
  title: 'Integrate terms with roots and negative powers',
  spec: ['P8.2', 'P2.1'],
  chapter: 'P1.13',
  sections: ['13.2'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Find'],
  tags: ['integration', 'indefinite', 'indices', 'surds'],
  generate(r) {
    const special = r.sample(ROOT_EXPS, 2).map(([n, d]) => Q.of(n, d));
    const ints = [Q.of(r.pick([2, 3, 4]))];
    const exps = [...ints, ...special].sort((a, b) => b.cmp(a));
    const terms = exps.map((e) => ({ c: niceTerm(r, e, 4), e }));
    r.require(terms.every((t) => t.c.isInt && Math.abs(t.c.n) <= 30));
    const f = new Poly(terms);
    const fDisplay = f.toLatex({ style: 'display' });
    const fPower = f.toLatex();
    const Fp = f.integ();
    const A = ans.integral(Fp.toExpr(), 'x', { x: [0.3, 4] });
    const wrongNoDivide = new Poly(f.terms.map((t) => ({ c: t.c, e: t.e.add(1) })));
    const wrongMul = new Poly(f.terms.map((t) => ({ c: t.c.mul(t.e.add(1)), e: t.e.add(1) })));
    return {
      parts: [
        part({
          marks: 4,
          prompt: md`Given that $x > 0$, find $\displaystyle\int \left(${fDisplay}\right)${dx}$, giving each term in its simplest form.`,
          answer: A,
          scheme: [
            B1(md`Writes each term as a power of $x$: $${fPower}$`),
            M1(md`Raises the power by one on at least one term: $x^{n} \to x^{n+1}$`),
            A1(md`At least two terms correct (may be unsimplified)`),
            A1(md`$${answerTex(A)}$, all simplified, including $+\,c$`),
          ],
          hints: [
            md`Rewrite every term as $kx^{n}$ before integrating, e.g. $\sqrt{x} = x^{\frac{1}{2}}$ and $\dfrac{1}{x^{2}} = x^{-2}$.`,
            md`Then integrate each term: add one to the power, divide by the new power. Dividing by a fraction like $\frac{3}{2}$ is the same as multiplying by $\frac{2}{3}$.`,
            md`As powers of $x$ the integrand is $${fPower}$.`,
          ],
          errors: [
            err('differentiated', ans.expr(f.diff().toExpr(), ['x'], { domain: { x: [0.3, 4] } }), 'You have differentiated instead of integrating.'),
            err('no-divide', ans.integral(wrongNoDivide.toExpr(), 'x', { x: [0.3, 4] }), 'You raised the powers but did not divide by the new power.', 2),
            err('multiplied', ans.integral(wrongMul.toExpr(), 'x', { x: [0.3, 4] }), 'You multiplied by the new power instead of dividing by it.', 2),
          ],
          solution: [
            md`Write each term as a power of $x$: $${fDisplay} = ${fPower}$.`,
            md`Integrate term by term (add one to each power and divide by the new power):`,
            md`$\displaystyle\int \left(${fPower}\right)${dx} = ${answerTex(A)}$`,
          ],
        }),
      ],
      params: { fTex: fDisplay },
    };
  },
  verify(inst) {
    checkAntiderivative(inst, 0, inst.params.fTex as string, 0.4, 4);
  },
});

const expandOverRoot = defineTemplate({
  id: 'p1.13.integrate-expand-divide',
  family: 'p1.13.indefinite-algebra',
  title: 'Expand and divide before integrating',
  spec: ['P8.2', 'P2.1'],
  chapter: 'P1.13',
  sections: ['13.2'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find'],
  tags: ['integration', 'indefinite', 'indices', 'expand'],
  generate(r) {
    const p = r.int(1, 3);
    const q = r.intNZ(-6, 6);
    const square = r.bool(0.5);
    const rr = square ? p : r.int(1, 3);
    const ss = square ? q : r.intNZ(-6, 6);
    r.require(square || rr * q !== p * ss);
    const k = r.pick([1, 1, 2]);
    const m = r.pick([Q.of(1, 2), Q.of(3, 2)]);
    const prod = Poly.coeffs([q, p]).mul(Poly.coeffs([ss, rr]));
    const f = prod.shift(m.neg()).scale(Q.of(1, k));
    r.require(!f.terms.some((t) => t.e.eq(-1)));
    const Fp = f.integ();
    r.require(Fp.terms.every((t) => t.c.d <= 15));
    const lin = (a: number, b: number) => `${a === 1 ? '' : a}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}`;
    const numTex = square ? String.raw`\left(${lin(p, q)}\right)^{2}` : String.raw`\left(${lin(p, q)}\right)\left(${lin(rr, ss)}\right)`;
    const denTex = (k === 1 ? '' : `${k}`) + (m.eq(Q.of(1, 2)) ? String.raw`\sqrt{x}` : String.raw`x\sqrt{x}`);
    const fTex = String.raw`\frac{${numTex}}{${denTex}}`;
    const A = ans.integral(Fp.toExpr(), 'x', { x: [0.3, 4] });
    const expanded = prod.toLatex();
    return {
      parts: [
        part({
          marks: 5,
          prompt: md`Given that $x > 0$, find $\displaystyle\int ${fTex}${dx}$, giving your answer in its simplest form.`,
          answer: A,
          scheme: [
            M1(md`Expands the numerator to obtain a three-term quadratic: $${expanded}$`),
            A1(md`Divides by $${denTex}$ to get $${f.toLatex()}$`),
            M1(md`Raises the power by one on at least one term`),
            A1(md`Two terms correct`),
            A1(md`$${answerTex(A)}$`),
          ],
          hints: [
            'You cannot integrate a fraction like this directly — multiply out the numerator first.',
            md`After expanding, divide every term by $${denTex}$ by subtracting powers ($${denTex.replace(/^\d/, '')} = x^{${m.toLatex()}}$), then integrate each term.`,
            md`The numerator expands to $${expanded}$.`,
          ],
          errors: [
            err('integrate-num-den-separately', ans.integral(prod.integ().toExpr(), 'x', { x: [0.3, 4] }), 'You integrated the numerator only — divide by the denominator first, term by term.'),
          ],
          solution: [
            md`Expand the numerator: $${numTex} = ${expanded}$.`,
            md`Divide each term by $${denTex}$: $${fTex} = ${f.toLatex()}$.`,
            md`Integrate term by term: $\displaystyle\int \left(${f.toLatex()}\right)${dx} = ${answerTex(A)}$`,
          ],
        }),
      ],
      params: { fTex },
    };
  },
  verify(inst) {
    checkAntiderivative(inst, 0, inst.params.fTex as string, 0.4, 4);
  },
});

const splitFraction = defineTemplate({
  id: 'p1.13.integrate-split-fraction',
  family: 'p1.13.indefinite-algebra',
  title: 'Split a fraction then integrate',
  spec: ['P8.2', 'P2.1'],
  chapter: 'P1.13',
  sections: ['13.2'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 4,
  time: 5,
  commands: ['Find'],
  tags: ['integration', 'indefinite', 'indices'],
  generate(r) {
    const m = r.pick([Q.of(2), Q.of(3), Q.of(1, 2), Q.of(3, 2)]);
    const k = r.pick([1, 2, 3]);
    // numerator exponents chosen so no term becomes x^{-1}
    const candidates = [0, 1, 2, 3, 4, 5].map((e) => Q.of(e)).filter((e) => !e.sub(m).eq(-1));
    const exps = r.sample(candidates, 3).sort((a, b) => b.cmp(a));
    const numTerms = exps.map((e) => ({ c: Q.of(r.intNZ(-8, 8) * k), e }));
    const num = new Poly(numTerms);
    const f = num.shift(m.neg()).scale(Q.of(1, k));
    r.require(f.terms.every((t) => !t.e.eq(-1)));
    const Fp = f.integ();
    r.require(Fp.terms.every((t) => t.c.d <= 12 && Math.abs(t.c.n) <= 60));
    const denTex = (k === 1 ? '' : `${k}`) + (m.eq(Q.of(1, 2)) ? String.raw`\sqrt{x}` : m.eq(Q.of(3, 2)) ? String.raw`x\sqrt{x}` : `x^{${m.n}}`);
    const fTex = String.raw`\frac{${num.toLatex()}}{${denTex}}`;
    const A = ans.integral(Fp.toExpr(), 'x', { x: [0.3, 4] });
    return {
      parts: [
        part({
          marks: 4,
          prompt: md`Given that $x > 0$, find $\displaystyle\int ${fTex}${dx}$.`,
          answer: A,
          scheme: [
            M1(md`Splits into separate terms and writes each as a power of $x$`),
            A1(md`$${f.toLatex()}$`),
            M1(md`Raises the power by one on at least one term`),
            A1(md`$${answerTex(A)}$`),
          ],
          hints: [
            'Split the fraction: divide each term of the numerator by the denominator.',
            md`Write the denominator as a power of $x$, then use $\dfrac{x^{a}}{x^{b}} = x^{a-b}$ on each term.`,
            md`The integrand simplifies to $${f.toLatex()}$.`,
          ],
          errors: [err('differentiated', ans.expr(f.diff().toExpr(), ['x'], { domain: { x: [0.3, 4] } }), 'You have differentiated instead of integrating.')],
          solution: [
            md`Divide each term by $${denTex}$: $${fTex} = ${f.toLatex()}$.`,
            md`Integrate: $\displaystyle\int \left(${f.toLatex()}\right)${dx} = ${answerTex(A)}$`,
          ],
        }),
      ],
      params: { fTex },
    };
  },
  verify(inst) {
    checkAntiderivative(inst, 0, inst.params.fTex as string, 0.4, 4);
  },
});

const findCurve = defineTemplate({
  id: 'p1.13.find-curve-from-gradient',
  family: 'p1.13.finding-functions',
  title: 'Find the equation of a curve from its gradient function',
  spec: ['P8.1', 'P8.2'],
  chapter: 'P1.13',
  sections: ['13.3'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 5,
  time: 6,
  commands: ['Find'],
  tags: ['integration', 'finding functions', 'constant of integration'],
  generate(r) {
    const exps = r.sample([1, 2, 3], 2).sort((a, b) => b - a);
    const terms = exps.map((e) => ({ c: niceTerm(r, Q.of(e), 3), e: Q.of(e) }));
    const f = new Poly([...terms, { c: Q.of(r.intNZ(-9, 9)), e: Q.ZERO }]);
    const x0 = r.pick([-2, -1, 1, 2, 3]);
    const Fp = f.integ();
    const y0 = r.int(-20, 20);
    const c = Q.of(y0).sub(Fp.evalQ(x0));
    r.require(c.isInt && !c.isZero && Math.abs(c.n) <= 40);
    const curve = Fp.add(Poly.coeffs([c]));
    const A: ExprSpec = ans.expr(curve.toExpr(), ['x'], { domain: { x: [-3, 3] }, label: String.raw`\mathrm{f}(x) =` });
    const fTex = f.toLatex();
    return {
      stem: md`A curve $C$ has equation $y = \mathrm{f}(x)$. The point $P(${x0}, ${y0})$ lies on $C$.`,
      parts: [
        part({
          marks: 5,
          prompt: md`Given that $\mathrm{f}'(x) = ${fTex}$, find $\mathrm{f}(x)$.`,
          answer: A,
          scheme: [
            M1(md`Integrates: $x^{n} \to x^{n+1}$ on at least one term`),
            A1(md`$${Fp.toLatex()} + c$ (may be unsimplified)`),
            M1(md`Substitutes $x = ${x0}$, $y = ${y0}$ into their integrated expression with $+\,c$`),
            A1(md`$c = ${c.toLatex()}$`),
            A1(md`$\mathrm{f}(x) = ${curve.toLatex()}$`),
          ],
          hints: [
            md`$\mathrm{f}(x)$ is found by integrating $\mathrm{f}'(x)$ — don't forget the constant.`,
            md`Integrate, keep $+\,c$, then substitute the coordinates of $P$ to find $c$.`,
            md`$\mathrm{f}(x) = ${Fp.toLatex()} + c$. Now put $x = ${x0}$ and $\mathrm{f}(x) = ${y0}$.`,
          ],
          errors: [
            err('no-constant', ans.expr(Fp.toExpr(), ['x'], { domain: { x: [-3, 3] } }), md`You need to find the constant of integration using the point $P(${x0}, ${y0})$.`, 2),
            err('differentiated', ans.expr(f.diff().toExpr(), ['x'], { domain: { x: [-3, 3] } }), 'You have differentiated f′(x) — to find f(x) you need to integrate.'),
          ],
          solution: [
            md`$\mathrm{f}(x) = \displaystyle\int \left(${fTex}\right)${dx} = ${Fp.toLatex()} + c$`,
            md`At $P$: $${y0} = ${Fp.toLatex().replace(/x/g, `(${x0})`)} + c$, so $${y0} = ${Fp.evalQ(x0).toLatex()} + c$ and $c = ${c.toLatex()}$.`,
            md`$${answerTex(A)}$`,
          ],
        }),
      ],
      params: { fTex, x0, y0 },
    };
  },
  verify(inst) {
    const { fTex, x0, y0 } = inst.params as { fTex: string; x0: number; y0: number };
    const f = parseExpr(fTex);
    const spec = inst.parts[0].answer as ExprSpec;
    expectClose(evaluate(spec.value, { x: x0 }), y0, 'curve through P');
    for (const x of [-2.5, -1, 0.3, 1.7, 2.9]) expectClose(derivative((t) => evaluate(spec.value, { x: t }), x), evaluate(f, { x }), "f'", 1e-5);
  },
});

const findCurveRoots = defineTemplate({
  id: 'p1.13.find-curve-fractional',
  family: 'p1.13.finding-functions',
  title: 'Find a curve from a gradient with roots and negative powers',
  spec: ['P8.2', 'P2.1'],
  chapter: 'P1.13',
  sections: ['13.3'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 8,
  commands: ['Find'],
  tags: ['integration', 'finding functions', 'indices'],
  generate(r) {
    const e1 = r.pick([Q.of(1, 2), Q.of(-1, 2), Q.of(3, 2)]);
    const e2 = r.pick([Q.of(-2), Q.of(-3), Q.of(1)]);
    const terms = [e1, e2].map((e) => ({ c: niceTerm(r, e, 4), e }));
    const f = new Poly([...terms, { c: Q.of(r.intNZ(-6, 6)), e: Q.ZERO }]);
    r.require(f.terms.every((t) => t.c.isInt));
    const x0 = r.pick([1, 4, 9]);
    const Fp = f.integ();
    const y0 = r.int(-15, 25);
    const c = Q.of(y0).sub(Fp.evalQ(x0));
    r.require(c.d <= 4 && !c.isZero && Math.abs(c.value) <= 60);
    const curve = Fp.add(Poly.coeffs([c]));
    const dom = { x: [0.3, 9] as [number, number] };
    const A: ExprSpec = ans.expr(constantLast(curve), ['x'], { domain: dom, label: String.raw`\mathrm{f}(x) =` });
    const fDisp = f.toLatex({ style: 'display' });
    return {
      stem: md`The curve $C$ has equation $y = \mathrm{f}(x)$, $x > 0$, and passes through the point $(${x0}, ${y0})$.`,
      parts: [
        part({
          marks: 6,
          prompt: md`Given that $\mathrm{f}'(x) = ${fDisp}$, find $\mathrm{f}(x)$, simplifying each term.`,
          answer: A,
          scheme: [
            B1(md`Writes $\mathrm{f}'(x)$ as powers of $x$: $${f.toLatex()}$`),
            M1(md`Integrates: $x^{n} \to x^{n+1}$ on at least one term`),
            A1(md`Two terms correct (unsimplified)`),
            A1(md`$${Fp.toLatex()} + c$`),
            dM1(md`Substitutes $(${x0}, ${y0})$ to find $c$`),
            A1(md`$\mathrm{f}(x) = ${constantLastTex(curve)}$`),
          ],
          hints: [
            'Rewrite each term as a power of x, then integrate.',
            md`Remember $\int x^{n}\,\mathrm{d}x = \dfrac{x^{n+1}}{n+1} + c$ for fractional and negative $n$ too (but not $n = -1$).`,
            md`$\mathrm{f}'(x) = ${f.toLatex()}$, so $\mathrm{f}(x) = ${Fp.toLatex()} + c$.`,
          ],
          errors: [err('no-constant', ans.expr(Fp.toExpr(), ['x'], { domain: dom }), md`Use the point $(${x0}, ${y0})$ to find the constant of integration.`, 4)],
          solution: [
            md`$\mathrm{f}'(x) = ${f.toLatex()}$`,
            md`$\mathrm{f}(x) = ${Fp.toLatex()} + c$`,
            md`Substituting $x = ${x0}$: $${y0} = ${Fp.evalQ(x0).toLatex()} + c \Rightarrow c = ${c.toLatex()}$`,
            md`$${answerTex(A)}$`,
          ],
        }),
      ],
      params: { fTex: fDisp, x0, y0 },
    };
  },
  verify(inst) {
    const { fTex, x0, y0 } = inst.params as { fTex: string; x0: number; y0: number };
    const f = parseExpr(fTex);
    const spec = inst.parts[0].answer as ExprSpec;
    expectClose(evaluate(spec.value, { x: x0 }), y0, 'curve through point');
    for (const x of [0.5, 1.3, 2.2, 5.1, 8.4]) expectClose(derivative((t) => evaluate(spec.value, { x: t }), x), evaluate(f, { x }), "f'", 1e-5);
  },
});

const templates: Template[] = [integerPowers, fractionalPowers, expandOverRoot, splitFraction, findCurve, findCurveRoots];
export default templates;
