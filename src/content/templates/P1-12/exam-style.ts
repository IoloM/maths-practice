/** Pure Year 1, Chapter 12 — long exam-style question: a cubic's derivative, stationary points, their nature and a tangent. */
import { evaluate, num } from '../../../engine/core/expr';
import { Q } from '../../../engine/core/rational';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { CoordSpec, EquationSpec, ExactSpec, ExprSpec, ListSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';

const DYDX = md`\frac{\mathrm{d}y}{\mathrm{d}x}`;
const D2YDX2 = md`\frac{\mathrm{d}^{2}y}{\mathrm{d}x^{2}}`;
const X = (v: number) => ans.exact(num(v));

const cubic = defineTemplate({
  id: 'p1.12.long-cubic-stationary-points-and-tangent',
  family: 'p1.12.exam-style',
  title: 'Exam-style: a cubic curve — derivative, stationary points, their nature and a tangent',
  spec: ['P7.2', 'P7.3', 'P7.1'],
  chapter: 'P1.12',
  sections: ['12.4', '12.6', '12.8', '12.9'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 12,
  time: 14,
  commands: ['Find', 'Show that'],
  tags: ['exam-style', 'differentiation', 'stationary points', 'second derivative', 'tangent'],
  generate(r) {
    // stationary at x = p and x = q: dy/dx = 3(x − p)(x − q), with p + q even so the coefficients are whole numbers
    const p = r.int(-4, 2);
    const q = p + r.pick([2, 4, 6]);
    r.require(q <= 6 && p !== 0 && q !== 0);
    const b = (-3 * (p + q)) / 2,
      c = 3 * p * q,
      d = r.int(-6, 9);
    const f = (x: number) => x ** 3 + b * x * x + c * x + d;
    const fd = (x: number) => 3 * x * x + 2 * b * x + c;
    const k = r.int(-3, 4);
    r.require(k !== p && k !== q && fd(k) !== 0 && Math.abs(f(k)) <= 80);
    const m = fd(k),
      c0 = f(k) - m * k;
    const curve = sumTex([
      [1, 'x^{3}'],
      [b, 'x^{2}'],
      [c, 'x'],
      [d, ''],
    ]);
    const D = ans.expr(ex(sumTex([[3, 'x^{2}'], [2 * b, 'x'], [c, '']])));
    const S = ans.list([X(p), X(q)], { v: 'x' });
    const MIN = ans.coord(X(q), X(f(q)));
    const T = ans.eq(ex('y'), ex(sumTex([[m, 'x'], [c0, '']])), ['x', 'y'], ['y=mx+c']);
    const mn = Q.of(-1, m);
    return {
      stem: md`The curve $C$ has equation $y = ${curve}$.`,
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Find $${DYDX}$.`,
          answer: D,
          scheme: [M1('Reduces at least one power by one'), A1(md`$${DYDX} = ${sumTex([[3, 'x^{2}'], [2 * b, 'x'], [c, '']])}$`)],
          hints: ['Differentiate term by term.', md`$x^{n} \to nx^{n-1}$; a constant differentiates to $0$.`, md`$x^{3} \to 3x^{2}$`],
          solution: [md`$${DYDX} = ${answerTex(D)}$`],
        }),
        part({
          label: 'b',
          marks: 3,
          prompt: 'Find the x-coordinates of the stationary points of C.',
          answer: S,
          scheme: [M1(md`Sets $${DYDX} = 0$`), dM1(md`Solves the quadratic: $3(x ${p < 0 ? '+' : '-'} ${Math.abs(p)})(x ${q < 0 ? '+' : '-'} ${Math.abs(q)}) = 0$`), A1(md`$x = ${p}$ and $x = ${q}$`)],
          hints: ['Stationary points have gradient 0.', md`Solve $${sumTex([[3, 'x^{2}'], [2 * b, 'x'], [c, '']])} = 0$.`, 'Divide by 3 first, then factorise.'],
          solution: [md`$${sumTex([[3, 'x^{2}'], [2 * b, 'x'], [c, '']])} = 0 \Rightarrow ${sumTex([[1, 'x^{2}'], [(2 * b) / 3, 'x'], [c / 3, '']])} = 0$`, md`$(x ${p < 0 ? '+' : '-'} ${Math.abs(p)})(x ${q < 0 ? '+' : '-'} ${Math.abs(q)}) = 0$, so $${answerTex(S)}$`],
        }),
        part({
          label: 'c',
          marks: 3,
          prompt: 'Find the coordinates of the local minimum point of C, justifying that it is a minimum.',
          answer: MIN,
          scheme: [M1(md`Finds $${D2YDX2} = ${sumTex([[6, 'x'], [2 * b, '']])}$ and evaluates it at a stationary point`), A1(md`At $x = ${q}$: $${D2YDX2} = ${6 * q + 2 * b} > 0$, so a minimum`), A1(md`$(${q}, ${f(q)})$`)],
          hints: ['Use the second derivative to tell maximum from minimum.', md`Positive $${D2YDX2}$ means a minimum.`, 'Then substitute that x into the equation of C to get y.'],
          errors: [err('maximum', ans.coord(X(p), X(f(p))), 'That is the maximum: the second derivative is negative there.')],
          solution: [md`$${D2YDX2} = ${sumTex([[6, 'x'], [2 * b, '']])}$: at $x = ${q}$ it is $${6 * q + 2 * b} > 0$ (minimum); at $x = ${p}$ it is $${6 * p + 2 * b} < 0$ (maximum).`, md`$y = ${q}^{3} ${b < 0 ? '-' : '+'} ${Math.abs(b)}(${q})^{2} ${c < 0 ? '-' : '+'} ${Math.abs(c)}(${q}) ${d < 0 ? '-' : '+'} ${Math.abs(d)} = ${f(q)}$, so the minimum is $${answerTex(MIN)}$`],
        }),
        part({
          label: 'd',
          marks: 4,
          prompt: md`The point $P$ on $C$ has $x$-coordinate $${k}$. Find an equation of the tangent to $C$ at $P$, giving your answer in the form $y = mx + c$.`,
          answer: T,
          scheme: [B1(md`$y = ${f(k)}$ at $x = ${k}$`), M1(md`Gradient: substitutes $x = ${k}$ into $${DYDX}$ to get $${m}$`), M1(md`$y - ${f(k)} = ${m}(x - ${k})$ with their values`), A1(md`$${answerTex(T)}$`)],
          hints: ['You need a point and a gradient.', md`Find $y$ and $${DYDX}$ at $x = ${k}$.`, 'Use y − y₁ = m(x − x₁), then rearrange.'],
          errors: [err('normal-instead', ans.eq(ex('y'), ex(sumTex([[mn, 'x'], [Q.from(f(k)).sub(mn.mul(k)), '']])), ['x', 'y']), 'That is the normal: the tangent has the same gradient as the curve.', 2)],
          solution: [md`At $x = ${k}$: $y = ${f(k)}$ and $${DYDX} = ${m}$`, md`$y - ${f(k)} = ${m}(x - ${k}) \Rightarrow ${answerTex(T)}$`],
        }),
      ],
      params: { p, q, b, c, d, k },
    };
  },
  verify(inst) {
    const { p, q, b, c, d, k } = inst.params as Record<string, number>;
    const f = (x: number) => x ** 3 + b * x * x + c * x + d;
    const D = inst.parts[0].answer as ExprSpec;
    for (const x of [-2.5, 0.3, 1.7]) expectClose(evaluate(D.value, { x }), (f(x + 1e-6) - f(x - 1e-6)) / 2e-6, 'derivative', 1e-5);
    const S = inst.parts[1].answer as ListSpec;
    for (const it of S.items) expectClose(evaluate(D.value, { x: evaluate((it as ExactSpec).value) }), 0, 'stationary', 1e-9);
    const M = inst.parts[2].answer as CoordSpec;
    const mx = evaluate((M.x as ExactSpec).value);
    expect(f(mx - 0.01) > f(mx) && f(mx + 0.01) > f(mx), 'a local minimum');
    expectClose(evaluate((M.y as ExactSpec).value), f(mx), 'on the curve', 1e-9);
    expect(mx === q && p < q, 'min at the larger root');
    const T = inst.parts[3].answer as EquationSpec;
    expectClose(evaluate(T.rhs, { x: k }), f(k), 'tangent through P', 1e-9);
    expectClose(evaluate(T.rhs, { x: k + 1 }) - evaluate(T.rhs, { x: k }), evaluate(D.value, { x: k }), 'tangent gradient', 1e-9);
  },
});

const templates: Template[] = [cubic];
export default templates;
