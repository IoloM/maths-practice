/** Pure Year 1, Chapter 12 — reading the gradient function from the graph of a cubic. */
import { evaluate, neg, num, sym } from '../../../engine/core/expr';
import { expect } from '../../../engine/core/numeric';
import { plot } from '../../../engine/core/svg';
import { answerTex } from '../../../engine/marking/mark';
import { contains, toNumSet } from '../../../engine/marking/intervals';
import type { ChoiceSpec, ExactSpec, IntervalSpec, ListSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, err, iv, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';

const INF = sym('infty');

const gradientFunction = defineTemplate({
  id: 'p1.12.gradient-function-from-graph',
  family: 'p1.12.stationary-points',
  title: 'The gradient function from a sketch: where it is zero, where it is negative, and its shape',
  spec: ['P7.3', 'P7.1'],
  chapter: 'P1.12',
  sections: ['12.3', '12.8', '12.9'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Write down', 'Find', 'Describe'],
  tags: ['gradient function', 'stationary points', 'sketching'],
  generate(r) {
    const alpha = r.int(-4, 1),
      beta = r.int(alpha + 2, 5);
    const a = r.pick([1, -1]);
    const d = r.int(-3, 3);
    // f′(x) = a(x − α)(x − β)·k, scaled so the turning points show clearly
    const k = 6 / (beta - alpha) ** 2;
    const f = (x: number) => a * k * (x ** 3 / 3 - ((alpha + beta) / 2) * x * x + alpha * beta * x) + d;
    const want = r.pick(['<', '>'] as const);
    const negInside = a > 0; // f′ < 0 between the stationary points when a > 0
    const inside = (want === '<') === negInside;
    const set = inside ? [iv(num(alpha), num(beta), false, false)] : [iv(neg(INF), num(alpha), false, false), iv(num(beta), INF, false, false)];
    const I: IntervalSpec = ans.interval(set, 'x');
    const L: ListSpec = ans.list([ans.exact(num(alpha)), ans.exact(num(beta))], { v: 'x' });
    const shapes = [md`A $\cup$-shaped parabola, crossing the $x$-axis at $x = ${alpha}$ and $x = ${beta}$`, md`A $\cap$-shaped parabola, crossing the $x$-axis at $x = ${alpha}$ and $x = ${beta}$`, md`A cubic with turning points at $x = ${alpha}$ and $x = ${beta}$`, md`A straight line through $(${alpha}, 0)$ and $(${beta}, 0)$`];
    const S: ChoiceSpec = ans.choice(shapes, a > 0 ? 0 : 1);
    const lo = alpha - 1.6,
      hi = beta + 1.6;
    const ys = [f(lo), f(hi), f(alpha), f(beta)];
    const svg = plot({
      x: [lo, hi],
      y: [Math.min(...ys, 0) - 1, Math.max(...ys, 0) + 1],
      w: 300,
      h: 260,
      curves: [{ f, label: 'y = f(x)', cls: 'dg-curve' }],
      points: [
        { x: alpha, y: f(alpha), label: 'A', dot: true },
        { x: beta, y: f(beta), label: 'B', dot: true },
      ],
      xTicks: [
        { v: alpha, label: String(alpha) },
        { v: beta, label: String(beta) },
      ],
      vlines: [
        { x: alpha, dash: true, from: Math.min(0, f(alpha)), to: Math.max(0, f(alpha)) },
        { x: beta, dash: true, from: Math.min(0, f(beta)), to: Math.max(0, f(beta)) },
      ],
    });
    const maxAt = a > 0 ? alpha : beta;
    return {
      stem: md`The diagram shows a sketch of the curve $y = \mathrm{f}(x)$, where $\mathrm{f}(x)$ is a cubic. The curve has a ${a > 0 ? 'maximum' : 'minimum'} at $A$, where $x = ${alpha}$, and a ${a > 0 ? 'minimum' : 'maximum'} at $B$, where $x = ${beta}$.`,
      diagram: { svg, alt: `A cubic curve with turning points A at x = ${alpha} and B at x = ${beta}.` },
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Write down the $x$-coordinates of the points where the graph of $y = \mathrm{f}'(x)$ meets the $x$-axis.`,
          answer: L,
          scheme: [M1('The gradient function is zero at the stationary points'), A1(md`$x = ${alpha}$ and $x = ${beta}$`)],
          hints: [md`$\mathrm{f}'(x)$ is the gradient of $y = \mathrm{f}(x)$.`, 'Where is the gradient of the curve zero?', 'At the turning points A and B.'],
          errors: [err('y-intercept-thinking', ans.list([ans.exact(num(0))], { v: 'x' }), 'The gradient graph meets the x-axis where the gradient of the curve is zero: at the turning points.')],
          solution: [md`$\mathrm{f}'(x) = 0$ at the stationary points: $${answerTex(L)}$`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Find the set of values of $x$ for which $\mathrm{f}'(x) ${want} 0$.`,
          answer: I,
          scheme: [M1(md`Links $\mathrm{f}'(x) ${want} 0$ to where the curve is ${want === '<' ? 'decreasing' : 'increasing'}`), A1(md`$${answerTex(I)}$`)],
          hints: [md`$\mathrm{f}'(x) ${want} 0$ where the curve is ${want === '<' ? 'going down' : 'going up'}.`, `The curve ${a > 0 ? 'rises to A, falls to B, then rises' : 'falls to A, rises to B, then falls'}.`, 'Use the x-coordinates of A and B as the boundaries; they are not included.'],
          errors: [err('wrong-side', ans.interval(inside ? [iv(neg(INF), num(alpha), false, false), iv(num(beta), INF, false, false)] : [iv(num(alpha), num(beta), false, false)], 'x'), `That is where the curve is ${want === '<' ? 'increasing' : 'decreasing'}.`, 1)],
          solution: [md`The curve is ${want === '<' ? 'decreasing' : 'increasing'} ${inside ? `between $x = ${alpha}$ and $x = ${beta}$` : `before $x = ${alpha}$ and after $x = ${beta}$`}: $${answerTex(I)}$`],
        }),
        part({
          label: 'c',
          marks: 1,
          prompt: md`Describe the graph of $y = \mathrm{f}'(x)$.`,
          answer: S,
          scheme: [B1(a > 0 ? md`$\cup$-shaped parabola through $(${alpha}, 0)$ and $(${beta}, 0)$` : md`$\cap$-shaped parabola through $(${alpha}, 0)$ and $(${beta}, 0)$`)],
          hints: ['Differentiating a cubic gives a quadratic.', `The gradient is ${a > 0 ? 'positive' : 'negative'} for large x.`, `So the quadratic is ${a > 0 ? '∪' : '∩'}-shaped.`],
          solution: [md`$\mathrm{f}'(x)$ is a quadratic, ${a > 0 ? 'positive' : 'negative'} outside $${alpha} < x < ${beta}$ (the maximum of $\mathrm{f}$ is at $x = ${maxAt}$), so it is ${a > 0 ? md`a $\cup$-shaped` : md`a $\cap$-shaped`} parabola.`],
        }),
      ],
      params: { alpha, beta, a, k, d, want },
    };
  },
  verify(inst) {
    const { alpha, beta, a, k, want } = inst.params as { alpha: number; beta: number; a: number; k: number; want: string };
    const fp = (x: number) => a * k * (x - alpha) * (x - beta);
    const h = 1e-5;
    const f = (x: number) => a * k * (x ** 3 / 3 - ((alpha + beta) / 2) * x * x + alpha * beta * x);
    for (const x of [alpha - 1.3, (alpha + beta) / 2, beta + 0.7]) expect(Math.abs((f(x + h) - f(x - h)) / (2 * h) - fp(x)) < 1e-5, "f′ is f's gradient");
    const S = toNumSet((inst.parts[1].answer as IntervalSpec).set);
    for (let x = alpha - 8; x <= beta + 8; x += 0.03) {
      const v = fp(x);
      if (Math.abs(v) < 1e-9) continue;
      expect(contains(S, x) === (want === '<' ? v < 0 : v > 0), `sign of f′ at ${x}`);
    }
    const zeros = (inst.parts[0].answer as ListSpec).items.map((i) => evaluate((i as ExactSpec).value));
    for (const z of zeros) expect(Math.abs(fp(z)) < 1e-12, 'f′ is zero there');
    expect(((inst.parts[2].answer as ChoiceSpec).correct[0] === 0) === fp(beta + 10) > 0, 'shape');
  },
});

export default [gradientFunction] satisfies Template[];
