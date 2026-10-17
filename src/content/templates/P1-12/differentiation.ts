/** Pure Year 1, Chapter 12 — differentiation: first principles, xⁿ, tangents and normals, stationary points, modelling. */
import { Q } from '../../../engine/core/rational';
import { Poly } from '../../../engine/core/poly';
import { evaluate, num } from '../../../engine/core/expr';
import { derivative, expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, CoordSpec, EquationSpec, ExactSpec, ExprSpec, IntervalSpec, ListSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ans, defineTemplate, err, iv, md, part, sgn } from '../../../engine/templates/helpers';
import { contains, toNumSet } from '../../../engine/marking/intervals';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';

const DYDX = md`\frac{\mathrm{d}y}{\mathrm{d}x}`;
const D2YDX2 = md`\frac{\mathrm{d}^{2}y}{\mathrm{d}x^{2}}`;
const INF = { k: 'sym', n: 'infty' } as const;
const negInf = { k: 'neg', a: INF } as const;
const exq = (q: Q | number) => num(Q.from(q));
const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
const POS = { x: [0.3, 6] as [number, number] };
/** "y - 3" / "x + 2" / "y" — the variable shifted by −k. */
const shift = (v: string, k: Q | number) => (Q.from(k).isZero ? v : `${v}${sgn(Q.from(k).neg())}`);
const pointSlope = (x0: number, y0: Q, m: Q) => `${shift('y', y0)} = ${m.toLatex()}${Q.from(x0).isZero ? 'x' : `(${shift('x', x0)})`}`;

// ---------------------------------------------------------------- 12.1–12.2 first principles
const chordQuad = defineTemplate({
  id: 'p1.12.chord-gradient-quadratic',
  family: 'p1.12.first-principles',
  title: 'Gradient of a chord PQ and its limit as h → 0',
  spec: ['P7.1'],
  chapter: 'P1.12',
  sections: ['12.1', '12.2'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Find', 'Hence'],
  tags: ['differentiation', 'first principles', 'chord', 'limit'],
  generate(r) {
    const p = r.intNZ(-4, 4),
      q = r.int(-6, 6),
      a = r.intNZ(-4, 4);
    const f = Poly.coeffs([0, q, p]);
    const fa = f.evalQ(a);
    const yQ = Poly.coeffs([fa, 2 * p * a + q, p]);
    const G = ans.expr(ex(sumTex([[p, 'h'], [2 * p * a + q, '']])), ['h']);
    const M = ans.exact(exq(2 * p * a + q));
    return {
      stem: md`The curve $C$ has equation $y = ${f.toLatex()}$. The point $P$ on $C$ has $x$-coordinate $${a}$ and the point $Q$ on $C$ has $x$-coordinate $${a} + h$, where $h \neq 0$.`,
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: md`Find, in terms of $h$, the gradient of the chord $PQ$. Give your answer in its simplest form.`,
          answer: G,
          scheme: [M1(md`$y$-coordinate of $Q$: $${p}(${a} + h)^{2} ${q < 0 ? '-' : '+'} ${Math.abs(q)}(${a} + h)$`), M1(md`$\dfrac{y_Q - y_P}{h}$ with $y_P = ${fa.toLatex()}$`), A1(md`$${answerTex(G)}$`)],
          hints: ['Gradient of a chord = change in y ÷ change in x.', md`The change in $x$ from $P$ to $Q$ is $h$. Find $y$ at $Q$ by substituting $x = ${a} + h$.`, md`Expand, subtract $y_P = ${fa.toLatex()}$, then divide every term by $h$.`],
          errors: [err('not-divided', ans.expr(ex(sumTex([[p, 'h^{2}'], [2 * p * a + q, 'h']])), ['h']), 'That is the change in y — divide by the change in x, which is h.')],
          solution: [md`$y_Q = ${yQ.toLatex({ v: 'h' })}$ and $y_P = ${fa.toLatex()}$`, md`$y_Q - y_P = ${yQ.sub(Poly.coeffs([fa])).toLatex({ v: 'h' })}$`, md`Gradient of $PQ = \dfrac{${yQ.sub(Poly.coeffs([fa])).toLatex({ v: 'h' })}}{h} = ${answerTex(G)}$`],
        }),
        part({
          label: 'b',
          marks: 1,
          prompt: md`Hence find the gradient of $C$ at $P$.`,
          answer: M,
          scheme: [B1(md`As $h \to 0$ the gradient of $PQ \to ${answerTex(M)}$`)],
          hints: ['As Q moves towards P, h gets closer to 0.', 'The chord PQ becomes the tangent at P.', md`Let $h \to 0$ in your answer to (a).`],
          solution: [md`As $h \to 0$, the chord gradient $\to ${answerTex(M)}$, which is the gradient of $C$ at $P$.`],
        }),
      ],
      params: { p, q, a },
    };
  },
  verify(inst) {
    const { p, q, a } = inst.params as Record<string, number>;
    const f = (x: number) => p * x * x + q * x;
    const g = (inst.parts[0].answer as ExprSpec).value;
    for (const h of [0.5, -1.3, 2]) expectClose(evaluate(g, { h }), (f(a + h) - f(a)) / h, 'chord gradient');
    expectClose(valOf(inst.parts[1].answer as ExactSpec), derivative(f, a), 'tangent gradient', 1e-6);
  },
});

const firstPrinciplesCubic = defineTemplate({
  id: 'p1.12.first-principles-cubic',
  family: 'p1.12.first-principles',
  title: 'Differentiate a cubic from first principles',
  spec: ['P7.1'],
  chapter: 'P1.12',
  sections: ['12.2'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find', 'Prove'],
  tags: ['differentiation', 'first principles', 'proof', 'limit'],
  generate(r) {
    const c = r.pick([1, 2, 3, -1, -2, 4]),
      b = r.int(-5, 5),
      k = r.int(-6, 6);
    const f = Poly.coeffs([0, k, b, c]);
    const chord = sumTex([[3 * c, 'x^{2}'], [3 * c, 'xh'], [c, 'h^{2}'], [2 * b, 'x'], [b, 'h'], [k, '']]);
    const G = ans.expr(ex(chord), ['x', 'h']);
    const D = ans.expr(f.diff().toExpr(), ['x']);
    return {
      stem: md`The curve $C$ has equation $y = ${f.toLatex()}$.`,
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: md`The points $P$ and $Q$ on $C$ have $x$-coordinates $x$ and $x + h$. Find the gradient of the chord $PQ$ in terms of $x$ and $h$, simplifying fully.`,
          answer: G,
          scheme: [M1(md`Expands $(x + h)^{3} = x^{3} + 3x^{2}h + 3xh^{2} + h^{3}$`), M1(md`Forms $\dfrac{f(x + h) - f(x)}{h}$ and cancels $h$`), A1(md`$${chord}$`)],
          hints: ['Gradient of PQ = (f(x + h) − f(x)) ÷ h.', md`$(x + h)^{3} = x^{3} + 3x^{2}h + 3xh^{2} + h^{3}$${b !== 0 ? md` and $(x + h)^{2} = x^{2} + 2xh + h^{2}$` : ''}`, 'After subtracting f(x), every term contains h, so you can divide through by h.'],
          errors: [err('not-divided', ans.expr(ex(`h(${chord})`), ['x', 'h']), 'Divide the change in y by h.')],
          solution: [md`$f(x + h) - f(x) = ${sumTex([[3 * c, 'x^{2}h'], [3 * c, 'xh^{2}'], [c, 'h^{3}'], [2 * b, 'xh'], [b, 'h^{2}'], [k, 'h']])}$`, md`Dividing by $h$: gradient of $PQ = ${answerTex(G)}$`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Hence prove, from first principles, that $${DYDX} = ${f.diff().toLatex()}$, and write down $${DYDX}$.`,
          answer: D,
          scheme: [M1(md`Lets $h \to 0$ (so terms in $h$ vanish)`), A1(md`$${DYDX} = ${answerTex(D)}$ with a correct limiting argument`, true)],
          hints: ['The derivative is the limit of the chord gradient as h → 0.', md`Write $\displaystyle ${DYDX} = \lim_{h \to 0}\left(${chord}\right)$.`, 'Every term with an h in it tends to 0.'],
          solution: [md`$\displaystyle ${DYDX} = \lim_{h \to 0}\left(${chord}\right) = ${answerTex(D)}$`],
        }),
      ],
      params: { c, b, k },
    };
  },
  verify(inst) {
    const { c, b, k } = inst.params as Record<string, number>;
    const f = (x: number) => c * x ** 3 + b * x * x + k * x;
    const g = (inst.parts[0].answer as ExprSpec).value;
    for (const [x, h] of [[1.2, 0.4], [-0.7, 1.1]]) expectClose(evaluate(g, { x, h }), (f(x + h) - f(x)) / h, 'chord');
    expectClose(evaluate((inst.parts[1].answer as ExprSpec).value, { x: 1.7 }), derivative(f, 1.7), 'derivative', 1e-6);
  },
});

const POWERS = [Q.of(4), Q.of(3), Q.of(2), Q.of(1, 2), Q.of(3, 2), Q.of(-1), Q.of(-2), Q.of(-1, 2)];

const secondDeriv = defineTemplate({
  id: 'p1.12.second-derivative',
  family: 'p1.12.second-derivative',
  title: 'First and second derivatives with fractional and negative powers',
  spec: ['P7.1', 'P7.2'],
  chapter: 'P1.12',
  sections: ['12.3', '12.8'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find'],
  tags: ['differentiation', 'second derivative', 'indices'],
  generate(r) {
    const es = r.shuffle(POWERS).slice(0, 3);
    const f = Poly.of(es.map((e) => [Q.of(r.intNZ(-6, 6) * (e.d === 2 ? 2 : 1)), e] as const));
    const f1 = f.diff(),
      f2 = f1.diff();
    const a = r.pick([1, 4, 9]);
    const v = f2.evalQ(a);
    r.require(v.d <= 8);
    const D1 = ans.expr(f1.toExpr(), ['x'], { domain: POS }),
      D2 = ans.expr(f2.toExpr(), ['x'], { domain: POS }),
      V = ans.exact(exq(v));
    return {
      stem: md`Given that $y = ${f.toLatex({ style: 'display' })}$, $x > 0$,`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`find $${DYDX}$,`, answer: D1, scheme: [M1(md`$x^{n} \to x^{n-1}$ on at least one term (after writing as powers of $x$)`), A1(md`$${f1.toLatex()}$`)], hints: [md`Write every term as a power of $x$ first: $\sqrt{x} = x^{\frac{1}{2}}$, $\frac{1}{x^{n}} = x^{-n}$.`, md`Multiply by the power, then reduce the power by 1.`, md`$y = ${f.toLatex()}$`], solution: [md`$y = ${f.toLatex()}$`, md`$${DYDX} = ${answerTex(D1)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`find $${D2YDX2}$,`, answer: D2, scheme: [M1('Differentiates their first derivative again'), A1(md`$${f2.toLatex()}$`)], hints: ['The second derivative is the derivative of the derivative.', md`Differentiate $${f1.toLatex()}$.`, 'Take care with negative and fractional powers when multiplying.'], solution: [md`$${D2YDX2} = ${answerTex(D2)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`find the value of $${D2YDX2}$ when $x = ${a}$.`, answer: V, scheme: [M1(md`Substitutes $x = ${a}$ into their $${D2YDX2}$`), A1(md`$${answerTex(V)}$`)], hints: [md`Substitute $x = ${a}$ into your answer to (b).`, a === 1 ? 'Any power of 1 is 1.' : md`$${a}^{\frac{1}{2}} = ${Math.sqrt(a)}$, so $${a}^{\frac{3}{2}} = ${Math.sqrt(a) ** 3}$.`, 'Keep fractions exact.'], solution: [md`At $x = ${a}$: $${D2YDX2} = ${answerTex(V)}$`] }),
      ],
      params: { a },
    };
  },
  verify(inst) {
    const { a } = inst.params as Record<string, number>;
    const d1 = (inst.parts[0].answer as ExprSpec).value;
    const d2 = (inst.parts[1].answer as ExprSpec).value;
    const g = (x: number) => evaluate(d1, { x });
    expectClose(evaluate(d2, { x: 2.3 }), derivative(g, 2.3), 'second derivative', 1e-5);
    expectClose(valOf(inst.parts[2].answer as ExactSpec), evaluate(d2, { x: a }), 'value');
  },
});

// ---------------------------------------------------------------- 12.3–12.5 differentiating xⁿ
const expandFirst = defineTemplate({
  id: 'p1.12.expand-then-differentiate',
  family: 'p1.12.differentiate-xn',
  title: 'Expand brackets, then differentiate and find a gradient',
  spec: ['P7.2'],
  chapter: 'P1.12',
  sections: ['12.4', '12.5'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 5,
  time: 5,
  commands: ['Find'],
  tags: ['differentiation', 'expanding', 'gradient'],
  generate(r) {
    const shape = r.pick(['product', 'square', 'xtimes'] as const);
    let f: Poly, tex: string;
    if (shape === 'product') {
      const a = r.intNZ(-4, 4),
        b = r.intNZ(-7, 7),
        c = r.intNZ(-4, 4),
        d = r.intNZ(-7, 7);
      f = Poly.coeffs([b, a]).mul(Poly.coeffs([d, c]));
      tex = `(${Poly.coeffs([b, a]).toLatex()})(${Poly.coeffs([d, c]).toLatex()})`;
    } else if (shape === 'square') {
      const a = r.intNZ(-5, 5),
        b = r.intNZ(-6, 6);
      f = Poly.coeffs([b, a]).powInt(2);
      tex = `(${Poly.coeffs([b, a]).toLatex()})^{2}`;
    } else {
      const k = r.intNZ(-4, 4),
        p = Poly.coeffs([r.int(-6, 6), r.intNZ(-5, 5), r.pick([1, 2, 3])]);
      f = Poly.of([[k, 1]]).mul(p);
      tex = `${k === 1 ? '' : k === -1 ? '-' : k}x(${p.toLatex()})`;
    }
    const x0 = r.intNZ(-3, 3);
    const D = ans.expr(f.diff().toExpr(), ['x']);
    const G = ans.exact(exq(f.diff().evalQ(x0)));
    return {
      stem: md`The curve $C$ has equation $y = ${tex}$.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find $${DYDX}$.`, answer: D, scheme: [M1('Expands the brackets'), M1(md`$x^{n} \to nx^{n-1}$ on at least one term`), A1(md`$${f.diff().toLatex()}$`)], hints: ['You cannot differentiate a product term by term — expand first.', md`$y = ${f.toLatex()}$`, 'Differentiate each term: multiply by the power, reduce the power by 1.'], solution: [md`$y = ${f.toLatex()}$`, md`$${DYDX} = ${answerTex(D)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the gradient of $C$ at the point where $x = ${x0}$.`, answer: G, scheme: [M1(md`Substitutes $x = ${x0}$ into their $${DYDX}$`), A1(md`$${answerTex(G)}$`)], hints: ['The gradient at a point is the value of dy/dx there.', md`Substitute $x = ${x0}$ into your $${DYDX}$.`, 'Watch the signs with a negative x.'], errors: [err('y-value', ans.exact(exq(f.evalQ(x0))), 'That is the y-coordinate — substitute into dy/dx, not y.')], solution: [md`At $x = ${x0}$: $${DYDX} = ${answerTex(G)}$`] }),
      ],
      params: { x0, coeffs: f.toString() },
    };
  },
  verify(inst) {
    const d = (inst.parts[0].answer as ExprSpec).value;
    const { x0 } = inst.params as { x0: number };
    expectClose(valOf(inst.parts[1].answer as ExactSpec), evaluate(d, { x: x0 }), 'gradient');
  },
});

const rewriteDivide = defineTemplate({
  id: 'p1.12.rewrite-fraction-then-differentiate',
  family: 'p1.12.differentiate-xn',
  title: 'Write a fraction as powers of x, then differentiate',
  spec: ['P7.2'],
  chapter: 'P1.12',
  sections: ['12.3', '12.5'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find', 'Write'],
  tags: ['differentiation', 'indices', 'fractional powers', 'negative powers'],
  generate(r) {
    const den = r.pick([Q.of(1), Q.of(2), Q.of(1, 2), Q.of(3, 2)]);
    const dk = r.pick([1, 2, 3]);
    const top = Poly.of([
      [r.intNZ(-6, 6), r.pick([2, 3, 4])],
      [r.intNZ(-8, 8), r.pick([0, 1])],
    ]);
    const f = top.scale(Q.of(1, dk)).mul(Poly.of([[1, den.neg()]]));
    const denTex = `${dk === 1 ? '' : dk}${den.eq(1) ? 'x' : den.eq(2) ? 'x^{2}' : den.eq(Q.of(1, 2)) ? '\\sqrt{x}' : 'x\\sqrt{x}'}`;
    const a = r.pick([1, 4, 9]);
    const g = f.diff().evalQ(a);
    r.require(g.d <= 12);
    const P = ans.expr(f.toExpr(), ['x'], { domain: POS });
    const D = ans.expr(f.diff().toExpr(), ['x'], { domain: POS });
    const G = ans.exact(exq(g));
    return {
      stem: md`$y = \dfrac{${top.toLatex()}}{${denTex}}$, $x > 0$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Write $y$ as a sum of powers of $x$.`, answer: P, scheme: [M1('Divides each term of the numerator by the denominator'), A1(md`$${f.toLatex()}$`)], hints: [md`Split the fraction: divide each term on top by $${denTex}$.`, md`$${denTex} = ${dk === 1 ? '' : dk}x^{${den.toLatex()}}$`, 'Subtract powers when dividing: xᵃ ÷ xᵇ = xᵃ⁻ᵇ.'], solution: [md`$y = ${answerTex(P)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Hence find $${DYDX}$.`, answer: D, scheme: [M1(md`$x^{n} \to nx^{n-1}$ on at least one term`), A1(md`$${f.diff().toLatex()}$`)], hints: ['Differentiate each power of x.', 'Multiply by the power, then subtract 1 from the power.', 'Keep the coefficients as fractions.'], errors: [err('quotient-of-derivatives', ans.expr(top.diff().toExpr(), ['x'], { domain: POS }), 'You cannot differentiate the top on its own — divide first, then differentiate.')], solution: [md`$${DYDX} = ${answerTex(D)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the gradient of the curve at the point where $x = ${a}$.`, answer: G, scheme: [M1(md`Substitutes $x = ${a}$`), A1(md`$${answerTex(G)}$`)], hints: [md`Substitute $x = ${a}$ into your $${DYDX}$.`, a === 1 ? 'Every power of 1 is 1.' : md`$${a}^{\frac{1}{2}} = ${Math.sqrt(a)}$`, 'Give an exact fraction.'], solution: [md`At $x = ${a}$: $${DYDX} = ${answerTex(G)}$`] }),
      ],
      params: { a },
    };
  },
  verify(inst) {
    const y = (inst.parts[0].answer as ExprSpec).value;
    const d = (inst.parts[1].answer as ExprSpec).value;
    const fy = (x: number) => evaluate(y, { x });
    expectClose(evaluate(d, { x: 1.9 }), derivative(fy, 1.9), 'derivative', 1e-6);
    const { a } = inst.params as { a: number };
    expectClose(valOf(inst.parts[2].answer as ExactSpec), evaluate(d, { x: a }), 'gradient');
  },
});

const findConstant = defineTemplate({
  id: 'p1.12.find-constant-from-gradient',
  family: 'p1.12.differentiate-xn',
  title: 'Find an unknown constant from a given gradient',
  spec: ['P7.2'],
  chapter: 'P1.12',
  sections: ['12.5', '12.6'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find'],
  tags: ['differentiation', 'unknown constant', 'gradient'],
  generate(r) {
    const a = r.intNZ(-3, 3),
      k = r.intNZ(-8, 8),
      c = r.int(-9, 9);
    const n = r.pick([2, 1]);
    // y = a x^3 + k x^n + c ; gradient at x0 is g
    const x0 = r.intNZ(-3, 3);
    const g = 3 * a * x0 * x0 + n * k * x0 ** (n - 1);
    const yTex = `${a === 1 ? '' : a === -1 ? '-' : a}x^{3} + k${n === 2 ? 'x^{2}' : 'x'}${c === 0 ? '' : c < 0 ? ` - ${-c}` : ` + ${c}`}`;
    const K = ans.exact(exq(k));
    const x1 = x0 > 0 ? x0 + 1 : x0 - 1;
    const g1 = 3 * a * x1 * x1 + n * k * x1 ** (n - 1);
    const G1 = ans.exact(exq(g1));
    return {
      stem: md`The curve $C$ has equation $y = ${yTex}$, where $k$ is a constant. The gradient of $C$ at the point where $x = ${x0}$ is $${g}$.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find the value of $k$.`, answer: K, scheme: [M1(md`$${DYDX} = ${3 * a}x^{2} + ${n === 2 ? '2kx' : 'k'}$`), M1(md`Sets their $${DYDX} = ${g}$ at $x = ${x0}$`), A1(md`$k = ${k}$`)], hints: ['Differentiate, treating k as a number.', md`$${DYDX} = ${3 * a}x^{2} + ${n === 2 ? '2kx' : 'k'}$`, md`Substitute $x = ${x0}$ and set equal to $${g}$; solve for $k$.`], solution: [md`$${DYDX} = ${3 * a}x^{2} + ${n === 2 ? '2kx' : 'k'}$`, md`At $x = ${x0}$: $${3 * a * x0 * x0} ${n === 2 ? `${2 * x0 < 0 ? '-' : '+'} ${Math.abs(2 * x0)}k` : '+ k'} = ${g}$, so $k = ${answerTex(K)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the gradient of $C$ at the point where $x = ${x1}$.`, answer: G1, scheme: [M1(md`Substitutes $x = ${x1}$ and their $k$`), A1(md`$${answerTex(G1)}$`)], hints: ['Use your value of k in dy/dx.', md`Substitute $x = ${x1}$.`, 'Check the sign of each term.'], solution: [md`At $x = ${x1}$: $${DYDX} = ${answerTex(G1)}$`] }),
      ],
      params: { a, k, n, x0, g, x1 },
    };
  },
  verify(inst) {
    const { a, n, x0, g, x1 } = inst.params as Record<string, number>;
    const k = valOf(inst.parts[0].answer as ExactSpec);
    const d = (x: number) => 3 * a * x * x + n * k * x ** (n - 1);
    expectClose(d(x0), g, 'given gradient');
    expectClose(valOf(inst.parts[1].answer as ExactSpec), d(x1), 'second gradient');
  },
});

// ---------------------------------------------------------------- 12.6 tangents and normals
function curveWithPoint(r: Parameters<Template['generate']>[0]) {
  const kind = r.pick(['poly', 'poly', 'root'] as const);
  let f: Poly, x0: number;
  if (kind === 'poly') {
    f = Poly.coeffs([r.int(-8, 8), r.int(-6, 6), r.intNZ(-4, 4), r.pick([0, 0, 1, -1])]);
    x0 = r.intNZ(-3, 3);
  } else {
    f = Poly.of([
      [r.intNZ(-4, 4), r.pick([Q.of(1, 2), Q.of(3, 2), Q.of(-1)])],
      [r.intNZ(-5, 5), r.pick([1, 2, 0])],
    ]);
    x0 = r.pick([1, 4, 9]);
  }
  const m = f.diff().evalQ(x0),
    y0 = f.evalQ(x0);
  return { f, x0, m, y0, kind };
}

const tangent = defineTemplate({
  id: 'p1.12.tangent-equation',
  family: 'p1.12.tangents-normals',
  title: 'Equation of the tangent to a curve at a point',
  spec: ['P7.3'],
  chapter: 'P1.12',
  sections: ['12.6'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 5,
  time: 6,
  commands: ['Find'],
  tags: ['differentiation', 'tangent', 'straight line'],
  generate(r) {
    const { f, x0, m, y0 } = curveWithPoint(r);
    r.require(m.d <= 4 && !m.isZero && y0.d <= 4);
    const c = y0.sub(m.mul(x0));
    const Y = ans.eq(ex('y'), ex(sumTex([[m, 'x'], [c, '']])), ['x', 'y'], ['y=mx+c']);
    const mn = m.inv().neg();
    return {
      stem: md`The curve $C$ has equation $y = ${f.toLatex({ style: 'display' })}${x0 > 0 && f.terms.some((t) => t.e.d !== 1 || t.e.sign < 0) ? ', \\ x > 0' : ''}$. The point $P$ on $C$ has $x$-coordinate $${x0}$.`,
      parts: [
        part({
          marks: 5,
          prompt: md`Find an equation of the tangent to $C$ at $P$, giving your answer in the form $y = mx + c$.`,
          answer: Y,
          scheme: [M1(md`Differentiates: $${DYDX} = ${f.diff().toLatex()}$`), A1(md`Gradient at $P$: $${m.toLatex()}$`), B1(md`$y$-coordinate of $P$: $${y0.toLatex()}$`), M1(md`$${pointSlope(x0, y0, m)}$ using their gradient`), A1(md`$${answerTex(Y)}$`)],
          hints: ['You need a point and a gradient.', md`Find $y$ at $x = ${x0}$, and the value of $${DYDX}$ at $x = ${x0}$.`, md`Use $y - y_1 = m(x - x_1)$ with $(x_1, y_1) = (${x0}, ${y0.toLatex()})$.`],
          errors: [err('normal-instead', ans.eq(ex('y'), ex(sumTex([[mn, 'x'], [y0.sub(mn.mul(x0)), '']])), ['x', 'y']), 'That is the normal — the tangent has the same gradient as the curve.', 2)],
          solution: [md`$${DYDX} = ${f.diff().toLatex()}$; at $x = ${x0}$, $${DYDX} = ${m.toLatex()}$ and $y = ${y0.toLatex()}$.`, md`$${pointSlope(x0, y0, m)}$`, md`$${answerTex(Y)}$`],
        }),
      ],
      params: { x0, y0: y0.value, m: m.value },
    };
  },
  verify(inst) {
    const { x0, y0, m } = inst.params as Record<string, number>;
    const Y = inst.parts[0].answer as EquationSpec;
    expectClose(evaluate(Y.rhs, { x: x0 }), y0, 'passes through P');
    expectClose(evaluate(Y.rhs, { x: x0 + 1 }) - evaluate(Y.rhs, { x: x0 }), m, 'gradient');
  },
});

const normal = defineTemplate({
  id: 'p1.12.normal-equation',
  family: 'p1.12.tangents-normals',
  title: 'Equation of the normal and where it meets the axes',
  spec: ['P7.3'],
  chapter: 'P1.12',
  sections: ['12.6'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 7,
  time: 8,
  commands: ['Find'],
  tags: ['differentiation', 'normal', 'straight line', 'perpendicular'],
  generate(r) {
    const { f, x0, m, y0 } = curveWithPoint(r);
    r.require(m.d === 1 && !m.isZero && y0.d === 1);
    // normal: y − y0 = −(1/m)(x − x0)  ⇔  x + m y − (x0 + m y0) = 0
    const A = 1,
      B = m.value,
      C = -(x0 + m.value * y0.value);
    const E = ans.eq(ex(sumTex([[A, 'x'], [B, 'y'], [C, '']])), num(0), ['x', 'y'], ['ax+by+c=0']);
    const xi = Q.of(-C, A);
    const X = ans.coord(ans.exact(exq(xi)), ans.exact(num(0)));
    return {
      stem: md`The curve $C$ has equation $y = ${f.toLatex({ style: 'display' })}$. The point $P(${x0}, ${y0.toLatex()})$ lies on $C$.`,
      parts: [
        part({
          label: 'a',
          marks: 5,
          prompt: md`Find an equation of the normal to $C$ at $P$, giving your answer in the form $ax + by + c = 0$, where $a$, $b$ and $c$ are integers.`,
          answer: E,
          scheme: [M1(md`Differentiates`), A1(md`Gradient of tangent $= ${m.toLatex()}$`), M1(md`Gradient of normal $= -\dfrac{1}{m} = ${m.inv().neg().toLatex()}$`), M1(md`$${pointSlope(x0, y0, m.inv().neg())}$`), A1(md`$${answerTex(E)}$`)],
          hints: ['The normal is perpendicular to the tangent.', md`Gradient of the tangent is $${DYDX}$ at $x = ${x0}$; the normal's gradient is $-1 \div$ that.`, 'Use y − y₁ = m(x − x₁), then multiply through to clear fractions.'],
          errors: [err('tangent-instead', ans.eq(ex(sumTex([[m, 'x'], [-1, 'y'], [y0.sub(m.mul(x0)), '']])), num(0), ['x', 'y']), 'That is the tangent. The normal is perpendicular: its gradient is −1/m.', 2)],
          solution: [md`$${DYDX} = ${f.diff().toLatex()}$, so at $x = ${x0}$ the tangent gradient is $${m.toLatex()}$.`, md`Normal gradient $= ${m.inv().neg().toLatex()}$: $${pointSlope(x0, y0, m.inv().neg())}$`, md`$${answerTex(E)}$`],
        }),
        part({ label: 'b', marks: 2, prompt: md`The normal meets the $x$-axis at $Q$. Find the coordinates of $Q$.`, answer: X, scheme: [M1('Sets y = 0 in their normal'), A1(md`$${answerTex(X)}$`)], hints: ['On the x-axis, y = 0.', 'Substitute y = 0 into your equation from (a).', 'Solve for x.'], solution: [md`$y = 0$: $x = ${xi.toLatex()}$, so $Q$ is $${answerTex(X)}$`] }),
      ],
      params: { x0, y0: y0.value, m: m.value },
    };
  },
  verify(inst) {
    const { x0, y0, m } = inst.params as Record<string, number>;
    const E = inst.parts[0].answer as EquationSpec;
    expectClose(evaluate(E.lhs, { x: x0, y: y0 }), 0, 'through P', 1e-9);
    // direction of the normal (−m... ) : moving along (m, −1)·? check perpendicular: point P + (−m, 1)·t lies on line
    expectClose(evaluate(E.lhs, { x: x0 + m, y: y0 - 1 }), 0, 'perpendicular to tangent', 1e-9);
    const Qc = inst.parts[1].answer as CoordSpec;
    expectClose(evaluate(E.lhs, { x: valOf(Qc.x), y: 0 }), 0, 'Q on normal', 1e-9);
  },
});

// ---------------------------------------------------------------- 12.7–12.9 stationary points, increasing/decreasing
function niceCubic(r: Parameters<Template['generate']>[0]) {
  for (;;) {
    const a = r.pick([1, 2, -1, -2, 3, -3]);
    const p = r.int(-4, 3),
      q = p + r.int(1, 5);
    // f'(x) = 3a(x − p)(x − q)
    const d1 = Poly.fromRoots([p, q], Q.from(3 * a));
    const f = d1.integ().add(Poly.coeffs([r.int(-10, 10)]));
    if (f.terms.every((t) => t.c.d === 1)) return { f, p, q, a };
  }
}

const stationary = defineTemplate({
  id: 'p1.12.stationary-points-cubic',
  family: 'p1.12.stationary-points',
  title: 'Stationary points of a cubic and their nature',
  spec: ['P7.3'],
  chapter: 'P1.12',
  sections: ['12.8', '12.9'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 8,
  time: 9,
  commands: ['Find', 'Determine'],
  tags: ['differentiation', 'stationary points', 'second derivative', 'maximum', 'minimum'],
  generate(r) {
    const { f, p, q, a } = niceCubic(r);
    const D = ans.expr(f.diff().toExpr(), ['x']);
    const L = ans.list([ans.exact(exq(p)), ans.exact(exq(q))], { v: 'x' });
    const xmax = a > 0 ? p : q,
      xmin = a > 0 ? q : p;
    const ask = r.pick(['maximum', 'minimum'] as const);
    const xs = ask === 'maximum' ? xmax : xmin;
    const C = ans.coord(ans.exact(exq(xs)), ans.exact(exq(f.evalQ(xs))));
    const f2 = f.diff().diff();
    const other = ask === 'maximum' ? xmin : xmax;
    return {
      stem: md`The curve $C$ has equation $y = ${f.toLatex()}$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find $${DYDX}$.`, answer: D, scheme: [M1('Reduces at least one power by 1'), A1(md`$${f.diff().toLatex()}$`)], hints: ['Differentiate term by term.', 'The constant term differentiates to 0.', 'Multiply by the power, then reduce it by 1.'], solution: [md`$${DYDX} = ${answerTex(D)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Hence find the $x$-coordinates of the stationary points of $C$.`, answer: L, scheme: [M1(md`Sets $${DYDX} = 0$`), dM1('Solves the quadratic (e.g. factorises)'), A1(md`$${answerTex(L)}$`)], hints: ['At a stationary point the gradient is zero.', md`Solve $${f.diff().toLatex()} = 0$.`, md`Divide through by $${f.diff().terms[0].c.toLatex()}$ first, then factorise.`], solution: [md`$${f.diff().toLatex()} = 0 \Rightarrow ${f.diff().terms[0].c.toLatex()}${p === 0 ? 'x' : `(${shift('x', p)})`}${q === 0 ? 'x' : `(${shift('x', q)})`} = 0$`, md`$${answerTex(L)}$`] }),
        part({ label: 'c', marks: 3, prompt: md`Find $${D2YDX2}$ and hence find the coordinates of the local ${ask} of $C$.`, answer: C, scheme: [M1(md`$${D2YDX2} = ${f2.toLatex()}$`), M1(md`Substitutes an $x$-coordinate and uses the sign (${ask === 'maximum' ? '< 0' : '> 0'} for a ${ask})`), A1(md`$${answerTex(C)}$`)], hints: [`A local maximum has d²y/dx² < 0; a local minimum has d²y/dx² > 0.`, md`$${D2YDX2} = ${f2.toLatex()}$; test each $x$ from (b).`, 'Find the y-coordinate by substituting into the equation of C.'], errors: [err('wrong-point', ans.coord(ans.exact(exq(other)), ans.exact(exq(f.evalQ(other)))), md`That point has $${D2YDX2} ${ask === 'maximum' ? '> 0' : '< 0'}$, so it is the local ${ask === 'maximum' ? 'minimum' : 'maximum'}.`, 1)], solution: [md`$${D2YDX2} = ${f2.toLatex()}$`, md`At $x = ${xs}$: $${D2YDX2} = ${f2.evalQ(xs).toLatex()} ${ask === 'maximum' ? '< 0' : '> 0'}$, so it is a local ${ask}.`, md`$y = ${f.evalQ(xs).toLatex()}$, giving $${answerTex(C)}$`] }),
      ],
      params: { p, q, a, ask },
    };
  },
  verify(inst) {
    const fx = (inst.parts[0].answer as ExprSpec).value;
    const L = inst.parts[1].answer as ListSpec;
    for (const it of L.items) expectClose(evaluate(fx, { x: valOf(it) }) + 1, 1, 'stationary', 1e-9);
    const C = inst.parts[2].answer as CoordSpec;
    const { ask } = inst.params as { ask: string };
    const g = (x: number) => evaluate(fx, { x });
    const s = derivative(g, valOf(C.x));
    expect(ask === 'maximum' ? s < 0 : s > 0, 'nature');
  },
});

const incDec = defineTemplate({
  id: 'p1.12.increasing-decreasing',
  family: 'p1.12.stationary-points',
  title: 'Interval where a function is increasing or decreasing',
  spec: ['P7.3'],
  chapter: 'P1.12',
  sections: ['12.7'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find'],
  tags: ['differentiation', 'increasing', 'decreasing', 'inequalities'],
  generate(r) {
    const { f, p, q, a } = niceCubic(r);
    const want = r.pick(['increasing', 'decreasing'] as const);
    // f' = 3a(x−p)(x−q): negative between roots iff a > 0
    const between = (want === 'decreasing') === a > 0;
    const set = between ? [iv(exq(p), exq(q), true, true)] : [iv(negInf, exq(p), false, true), iv(exq(q), INF, true, false)];
    const I: IntervalSpec = ans.interval(set, 'x', { endsEither: true });
    const wrongSet = !between ? [iv(exq(p), exq(q), true, true)] : [iv(negInf, exq(p), false, true), iv(exq(q), INF, true, false)];
    return {
      stem: md`$f(x) = ${f.toLatex()}$`,
      parts: [
        part({
          marks: 5,
          prompt: md`Find the set of values of $x$ for which $f(x)$ is ${want}.`,
          answer: I,
          scheme: [M1(md`$f'(x) = ${f.diff().toLatex()}$`), A1('Correct derivative'), M1(md`Sets $f'(x) ${want === 'increasing' ? '>' : '<'} 0$ (or $= 0$) and finds critical values $${p}$, $${q}$`), dM1('Chooses the correct region'), A1(md`$${answerTex(I)}$`)],
          hints: [`f is ${want} where f′(x) ${want === 'increasing' ? '> 0' : '< 0'}.`, md`$f'(x) = ${f.diff().toLatex()}$ — factorise it.`, 'Sketch the quadratic f′(x) to see where it is above or below the x-axis.'],
          errors: [err('wrong-region', ans.interval(wrongSet, 'x', { endsEither: true }), `That is where f is ${want === 'increasing' ? 'decreasing' : 'increasing'}. Check the sign of f′(x) on each region.`, 3)],
          solution: [md`$f'(x) = ${f.diff().toLatex()} = ${f.diff().terms[0].c.toLatex()}${p === 0 ? 'x' : `(${shift('x', p)})`}${q === 0 ? 'x' : `(${shift('x', q)})`}$`, md`$f'(x) ${want === 'increasing' ? '>' : '<'} 0$ when $${answerTex(I)}$`],
        }),
      ],
      params: { p, q, want, fc: f.terms.map((t) => [t.c.value, t.e.value]) },
    };
  },
  verify(inst) {
    const { want, fc } = inst.params as { want: string; fc: [number, number][] };
    const f = (x: number) => fc.reduce((s, [c, e]) => s + c * x ** e, 0);
    const set = toNumSet((inst.parts[0].answer as IntervalSpec).set);
    for (let x = -9.03; x < 9; x += 0.29) {
      const d = derivative(f, x);
      if (Math.abs(d) < 1e-3) continue;
      expect(contains(set, x) === (want === 'increasing' ? d > 0 : d < 0), `region at x = ${x}`);
    }
  },
});

// ---------------------------------------------------------------- 12.11 modelling
const optimise = defineTemplate({
  id: 'p1.12.optimisation',
  family: 'p1.12.modelling',
  title: 'Optimisation: maximum volume or area, minimum surface area',
  spec: ['P7.3'],
  chapter: 'P1.12',
  sections: ['12.11'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 8,
  time: 10,
  commands: ['Find', 'Use'],
  tags: ['differentiation', 'optimisation', 'modelling', 'maximum'],
  generate(r) {
    const ctx = r.pick(['box', 'pen', 'tank'] as const);
    const unit = r.pick(['cm', 'm']);
    let stem: string, model: Poly, varTex: string, xs: number, kindWord: 'maximum' | 'minimum', modelName: string, sideHint: string;
    if (ctx === 'box') {
      const L = 6 * r.int(1, 16);
      stem = md`A square sheet of card has side $${L}$ ${unit}. A square of side $x$ ${unit} is cut from each corner and the sides are folded up to make an open box of volume $V$ ${unit}$^{3}$.`;
      model = Poly.of([[1, 1]]).mul(Poly.coeffs([L, -2]).powInt(2));
      varTex = 'V';
      modelName = 'volume';
      xs = L / 6;
      kindWord = 'maximum';
      sideHint = md`The base is a square of side $(${L} - 2x)$ and the height is $x$.`;
    } else if (ctx === 'pen') {
      const F = 4 * r.int(5, 50);
      stem = md`A farmer uses $${F}$ ${unit} of fencing to make a rectangular pen against a straight wall, so fencing is needed on only three sides. The two sides perpendicular to the wall each have length $x$ ${unit}, and the area of the pen is $A$ ${unit}$^{2}$.`;
      model = Poly.coeffs([0, F, -2]);
      varTex = 'A';
      modelName = 'area';
      xs = F / 4;
      kindWord = 'maximum';
      sideHint = md`The side parallel to the wall uses the fencing left over: $${F} - 2x$.`;
    } else {
      const s = 2 * r.int(1, 6);
      const Vol = s ** 3 / 2;
      stem = md`An open-topped tank has a square base of side $x$ ${unit} and volume $${Vol}$ ${unit}$^{3}$. Its external surface area is $S$ ${unit}$^{2}$.`;
      model = Poly.of([[1, 2], [4 * Vol, -1]]);
      varTex = 'S';
      modelName = 'surface area';
      xs = s;
      kindWord = 'minimum';
      sideHint = md`If the height is $h$, then $x^{2}h = ${Vol}$, so $h = \dfrac{${Vol}}{x^{2}}$.`;
    }
    const best = model.evalQ(xs);
    const Mexpr = ans.expr(model.toExpr(), ['x'], { domain: POS });
    const X = ans.exact(exq(xs));
    const B = ans.exact(exq(best), undefined, { unit: `\\text{${unit}}^{${ctx === 'box' ? 3 : 2}}` });
    const d2 = model.diff().diff().evalQ(xs);
    const choiceOpts = [md`$\dfrac{\mathrm{d}^{2}${varTex}}{\mathrm{d}x^{2}} = ${d2.toLatex()} ${d2.sign < 0 ? '< 0' : '> 0'}$, so this is a ${kindWord}`, md`$\dfrac{\mathrm{d}^{2}${varTex}}{\mathrm{d}x^{2}} = ${d2.toLatex()} ${d2.sign < 0 ? '< 0' : '> 0'}$, so this is a ${kindWord === 'maximum' ? 'minimum' : 'maximum'}`, md`$\dfrac{\mathrm{d}${varTex}}{\mathrm{d}x} = 0$, so it must be a ${kindWord}`];
    const Ch: ChoiceSpec = ans.choice(choiceOpts, 0);
    const derivTex = `\\frac{\\mathrm{d}${varTex}}{\\mathrm{d}x}`;
    return {
      stem,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find an expression for $${varTex}$ in terms of $x$, expanding any brackets.`, answer: Mexpr, scheme: [M1(`Forms the ${modelName} using the dimensions`), A1(md`$${varTex} = ${model.toLatex({ style: 'display' })}$`)], hints: [sideHint, ctx === 'tank' ? 'Surface area = base + four rectangular sides (no top).' : `Write the ${modelName} as length × width${ctx === 'box' ? ' × height' : ''}.`, 'Expand and simplify.'], solution: [md`$${varTex} = ${answerTex(Mexpr)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Use calculus to find the value of $x$ for which $${varTex}$ is a ${kindWord}.`, answer: X, scheme: [M1(md`$${derivTex} = ${model.diff().toLatex({ style: 'display' })}$`), M1(md`Sets $${derivTex} = 0$ and solves`), A1(md`$x = ${xs}$ (rejecting any invalid value)`)], hints: [md`Differentiate $${varTex}$ with respect to $x$.`, 'Stationary values occur where the derivative is zero.', ctx === 'box' ? 'You get two solutions — one of them makes the box disappear.' : 'Solve the equation; x must be positive.'], solution: [md`$${derivTex} = ${model.diff().toLatex({ style: 'display' })} = 0 \Rightarrow x = ${answerTex(X)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`Find the ${kindWord} ${modelName}.`, answer: B, scheme: [B1(md`$${answerTex(B)}$`)], hints: [`Substitute your x into the expression for ${varTex}.`, md`$${varTex}(${xs})$`, 'Include units.'], solution: [md`$${varTex} = ${answerTex(B)}$`] }),
        part({ label: 'd', marks: 2, prompt: md`Justify that this value is a ${kindWord}.`, answer: Ch, scheme: [M1(md`Finds $\dfrac{\mathrm{d}^{2}${varTex}}{\mathrm{d}x^{2}}$ and substitutes $x = ${xs}$`), A1(`Correct sign and conclusion`)], hints: ['Use the second derivative.', `A ${kindWord} needs the second derivative to be ${kindWord === 'maximum' ? 'negative' : 'positive'}.`, md`$\dfrac{\mathrm{d}^{2}${varTex}}{\mathrm{d}x^{2}} = ${model.diff().diff().toLatex({ style: 'display' })}$`], solution: [choiceOpts[0]] }),
      ],
      params: { ctx, xs, best: best.value },
    };
  },
  verify(inst) {
    const { xs, best } = inst.params as { xs: number; best: number };
    const m = (inst.parts[0].answer as ExprSpec).value;
    const f = (x: number) => evaluate(m, { x });
    expectClose(derivative(f, xs) + 1, 1, 'stationary', 1e-5);
    expectClose(f(xs), best, 'optimum value');
    expectClose(valOf(inst.parts[2].answer as ExactSpec), best, 'answer');
  },
});

const templates: Template[] = [chordQuad, firstPrinciplesCubic, secondDeriv, expandFirst, rewriteDivide, findConstant, tangent, normal, stationary, incDec, optimise];
export default templates;
