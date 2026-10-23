/** Pure Year 2, Chapter 11 — long exam-style question: y = a xⁿ ln x — gradient, stationary point, integration by parts, exact area. */
import { Q } from '../../../engine/core/rational';
import { evaluate } from '../../../engine/core/expr';
import { derivative, expect, expectClose, integrate } from '../../../engine/core/numeric';
import { plot, yRangeOf } from '../../../engine/core/svg';
import { answerTex } from '../../../engine/marking/mark';
import type { CoordSpec, ExactSpec, ExprSpec, IntegralSpec } from '../../../engine/marking/types';
import { A1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { checkAntiderivative, coefBody, ex, sumTex } from '../shared/calculus';

const xn = (n: number) => (n === 1 ? 'x' : `x^{${n}}`);

const partsArea = defineTemplate({
  id: 'p2.11.long-x-power-ln-x-stationary-point-and-area',
  family: 'p2.11.exam-style',
  title: 'Exam-style: y = axⁿ ln x — stationary point, integration by parts and an exact area',
  spec: ['P8.5', 'P8.3', 'P7.4'],
  chapter: 'P2.11',
  sections: ['11.6', '11.8', '9.4'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 5,
  marks: 12,
  time: 15,
  commands: ['Find', 'Use', 'Show that'],
  tags: ['exam-style', 'integration by parts', 'product rule', 'stationary points', 'area', 'logarithms'],
  generate(r) {
    const n = r.int(1, 3),
      a = r.int(1, 6);
    const m = r.int(1, n === 1 ? 3 : 2);
    const N = n + 1;
    const fTex = `${coefBody(a, xn(n))}\\ln x`;
    // dy/dx = a x^(n−1)(n ln x + 1)
    const dTex = sumTex([
      [a * n, `${n === 1 ? '' : xn(n - 1)}\\ln x`],
      [a, n === 1 ? '' : xn(n - 1)],
    ]);
    const D: ExprSpec = ans.expr(ex(dTex), ['x'], { domain: { x: [0.3, 3] }, label: '\\frac{dy}{dx} =' });
    const zeroTex = n === 1 ? `\\ln x + 1` : `${coefBody(a, xn(n - 1))}(${n}\\ln x + 1)`;
    const xsTex = n === 1 ? 'e^{-1}' : `e^{-\\frac{1}{${n}}}`;
    const ysQ = Q.of(-a, n);
    const ysTex = `-\\frac{${Math.abs(ysQ.n)}}{${ysQ.d === 1 ? '' : ysQ.d}e}`;
    const S: CoordSpec = ans.coord(ans.exact(ex(xsTex), ['exact']), ans.exact(ex(ysTex), ['exact']));
    // ∫ a xⁿ ln x dx = a xᴺ ln x / N − a xᴺ / N² + c
    const c1 = Q.of(a, N),
      c2 = Q.of(a, N * N);
    const ITex = sumTex([
      [c1, `${xn(N)}\\ln x`],
      [c2.neg(), xn(N)],
    ]);
    const I: IntegralSpec = ans.integral(ex(ITex), 'x', { x: [0.5, 3] });
    // area from 1 to e^m: a[e^(mN)(m/N − 1/N²) + 1/N²]
    const kE = Q.of(a * (m * N - 1), N * N);
    const eTex = `e^{${m * N}}`;
    const areaTex = `${coefBody(kE, eTex)} + ${c2.toLatex()}`;
    const AREA: ExactSpec = ans.exact(ex(areaTex), ['exact']);
    const f = (x: number) => a * x ** n * Math.log(x);
    const top = Math.exp(m);
    const svg = plot({
      x: [-0.2, top + 0.4],
      y: yRangeOf([f], 0.02, top + 0.15, 0.12),
      curves: [{ f, from: 0.02, to: top + 0.15, label: 'C', labelAt: top + 0.05 }],
      shade: [{ upper: f, from: 1, to: top, label: 'R' }],
      vlines: [{ x: top, label: m === 1 ? 'x = e' : `x = e^${m}`, dash: true }],
    });
    const forgotHalf = ans.integral(ex(sumTex([[c1, `${xn(N)}\\ln x`], [c1.neg(), xn(N)]])), 'x', { x: [0.5, 3] });
    return {
      stem: md`The curve $C$ has equation $y = ${fTex}$, $\;x > 0$. The region $R$, shown shaded, is bounded by $C$, the $x$-axis and the line $x = ${m === 1 ? 'e' : `e^{${m}}`}$.`,
      diagram: { svg, alt: 'Graph of a curve C that dips just below the x-axis for small x, crosses the x-axis at x = 1 and then rises steeply; the region R between the curve, the x-axis and a vertical line is shaded.' },
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Find $\dfrac{\mathrm{d}y}{\mathrm{d}x}$.`,
          answer: D,
          scheme: [M1(md`Product rule: $\mathrm{u}'\mathrm{v} + \mathrm{u}\mathrm{v}'$ with $\dfrac{\mathrm{d}}{\mathrm{d}x}(\ln x) = \dfrac{1}{x}$`), A1(md`$${answerTex(D)}$`)],
          hints: [md`Use the product rule with $u = ${coefBody(a, xn(n))}$ and $v = \ln x$.`, md`$\dfrac{\mathrm{d}}{\mathrm{d}x}(\ln x) = \dfrac{1}{x}$`, md`$u'v + uv' = ${coefBody(a * n, n === 1 ? '' : xn(n - 1))}\ln x + ${coefBody(a, xn(n))}\cdot\dfrac{1}{x}$`],
          solution: [md`$\dfrac{\mathrm{d}y}{\mathrm{d}x} = ${answerTex(D)}$`],
        }),
        part({
          label: 'b',
          marks: 3,
          prompt: md`Find the exact coordinates of the stationary point of $C$.`,
          answer: S,
          scheme: [M1(md`Sets $\dfrac{\mathrm{d}y}{\mathrm{d}x} = 0$: $${zeroTex} = 0$`), M1(md`$\ln x = -\dfrac{1}{${n}}$`), A1(md`$${answerTex(S)}$`)],
          hints: ['Set the derivative to zero (x > 0, so you can divide by any power of x).', md`$${n === 1 ? '' : n}\ln x + 1 = 0$`, md`$x = ${xsTex}$; substitute back into $y$.`],
          solution: [md`$${n === 1 ? '' : n}\ln x = -1 \Rightarrow x = ${xsTex}$`, md`$y = ${coefBody(a, n === 1 ? xsTex : `\\left(${xsTex}\\right)^{${n}}`)} \times \left(-\dfrac{1}{${n}}\right) = ${ysTex}$`, md`$${answerTex(S)}$`],
        }),
        part({
          label: 'c',
          marks: 4,
          prompt: md`Use integration by parts to find $\displaystyle\int ${fTex}\,\mathrm{d}x$.`,
          answer: I,
          scheme: [
            M1(md`Chooses $u = \ln x$ and $\dfrac{\mathrm{d}v}{\mathrm{d}x} = ${coefBody(a, xn(n))}$`),
            M1(md`$${coefBody(c1, xn(N))}\ln x - \displaystyle\int ${coefBody(c1, xn(N))}\cdot\dfrac{1}{x}\,\mathrm{d}x$`),
            A1(md`Correct second integral: $${coefBody(c2, xn(N))}$`),
            A1(md`$${answerTex(I)}$`),
          ],
          hints: [md`Take $u = \ln x$ (you can't integrate $\ln x$ directly) and $\dfrac{\mathrm{d}v}{\mathrm{d}x} = ${coefBody(a, xn(n))}$.`, md`$v = ${coefBody(c1, xn(N))}$`, md`$\displaystyle\int ${coefBody(c1, xn(N))}\cdot\dfrac{1}{x}\,\mathrm{d}x = \int ${coefBody(c1, xn(n))}\,\mathrm{d}x$`],
          errors: N === 1 ? [] : [err('second-integral-not-divided', forgotHalf, md`The second integral is $\int ${coefBody(c1, xn(n))}\,\mathrm{d}x$: integrating again divides by $${N}$.`, 2)],
          solution: [md`$\displaystyle\int ${fTex}\,\mathrm{d}x = ${coefBody(c1, xn(N))}\ln x - \int ${coefBody(c1, xn(n))}\,\mathrm{d}x$`, md`$= ${answerTex(I)}$`],
        }),
        part({
          label: 'd',
          marks: 3,
          prompt: md`Hence find the exact area of $R$, giving your answer in the form $pe^{${m * N}} + q$, where $p$ and $q$ are rational.`,
          answer: AREA,
          scheme: [M1(md`Uses limits $1$ and $${m === 1 ? 'e' : `e^{${m}}`}$ with $\ln 1 = 0$ and $\ln e^{${m}} = ${m}$`), dM1('Subtracts and collects terms'), A1(md`$${answerTex(AREA)}$`)],
          hints: [md`$C$ crosses the $x$-axis at $x = 1$ (where $\ln x = 0$).`, md`Evaluate your integral at $x = ${m === 1 ? 'e' : `e^{${m}}`}$ and at $x = 1$.`, md`$\left(e^{${m}}\right)^{${N}} = e^{${m * N}}$ and $\ln e^{${m}} = ${m}$.`],
          solution: [md`$\left[${ITex}\right]_{1}^{${m === 1 ? 'e' : `e^{${m}}`}} = \left(${coefBody(c1.mul(m), eTex)} - ${coefBody(c2, eTex)}\right) - \left(0 - ${c2.toLatex()}\right)$`, md`$= ${answerTex(AREA)}$`],
        }),
      ],
      params: { a, n, m },
    };
  },
  verify(inst) {
    const { a, n, m } = inst.params as Record<string, number>;
    const f = (x: number) => a * x ** n * Math.log(x);
    const D = (inst.parts[0].answer as ExprSpec).value;
    for (const x of [0.5, 1.7, 2.6]) expectClose(evaluate(D, { x }), derivative(f, x), 'derivative', 1e-6);
    const S = inst.parts[1].answer as CoordSpec;
    const xs = evaluate((S.x as ExactSpec).value);
    expect(Math.abs(derivative(f, xs)) < 1e-7, 'stationary');
    expectClose(evaluate((S.y as ExactSpec).value), f(xs), 'y at the stationary point');
    checkAntiderivative(inst, 2, `${a}x^{${n}}\\ln x`, 0.5, 3);
    expectClose(evaluate((inst.parts[3].answer as ExactSpec).value), integrate(f, 1, Math.exp(m)), 'area');
  },
});

const templates: Template[] = [partsArea];
export default templates;
