/** Pure Year 2, Chapter 10 — A* stretch: find a stationary point that can't be found exactly — differentiate, locate it, then Newton–Raphson (differentiation, change of sign, Newton–Raphson). */
import { evaluate } from '../../../engine/core/expr';
import { fmtDP, fmtSF } from '../../../engine/core/format';
import { bisect, derivative, expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { ExprSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { coefBody, ex, sumTex } from '../shared/calculus';

const newtonStationary = defineTemplate({
  id: 'p2.10.stretch-stationary-point-by-newton-raphson',
  family: 'stretch.stationary-point-by-newton-raphson',
  title: 'A* stretch: a stationary point you can only find numerically — locate it, then Newton–Raphson',
  spec: ['P9.3', 'P9.1', 'P7.2', 'P7.3'],
  chapter: 'P2.10',
  level: 'A2',
  paper: [1, 2],
  difficulty: 5,
  marks: 11,
  time: 14,
  commands: ['Find', 'Show that', 'Use'],
  tags: ['stretch', 'synoptic', 'stationary points', 'change of sign', 'Newton–Raphson', 'exponentials'],
  generate(r) {
    const A = r.int(1, 3);
    const k = r.int(2, 8);
    r.require((2 * k) / A > Math.E + 0.3);
    const g = (x: number) => A * Math.exp(x) - 2 * k * x;
    const gd = (x: number) => A * Math.exp(x) - 2 * k;
    const turn = Math.log((2 * k) / A);
    const alpha = bisect(g, turn, turn + 6);
    const n = Math.floor(alpha);
    r.require(g(n) < -0.05 && g(n + 1) > 0.05 && alpha - n > 0.05 && n + 1 - alpha > 0.05);
    const x0 = Number(fmtDP(alpha + r.pick([-0.3, -0.2, 0.2, 0.3, 0.4]), 1));
    r.require(x0 > turn + 0.15 && gd(x0) > 0.5);
    const x1 = x0 - g(x0) / gd(x0);
    const y = (x: number) => A * Math.exp(x) - k * x * x;
    const yTex = sumTex([
      [A, 'e^{x}'],
      [-k, 'x^{2}'],
    ]);
    const dTex = sumTex([
      [A, 'e^{x}'],
      [-2 * k, 'x'],
    ]);
    const d2Tex = sumTex([
      [A, 'e^{x}'],
      [-2 * k, ''],
    ]);
    const D: ExprSpec = ans.expr(ex(dTex), ['x'], { label: '\\frac{dy}{dx} =' });
    const X1: NumericSpec = ans.num(x1, { dp: 4 }, { label: 'x_1 =' });
    const AL: NumericSpec = ans.num(alpha, { dp: 3 }, { label: '\\alpha =' });
    const Y: NumericSpec = ans.num(y(alpha), { sf: 3 }, { alts: [y(Number(fmtDP(alpha, 3)))], label: 'y =' });
    const gn = g(n),
      gn1 = g(n + 1);
    const eA = (x: string) => coefBody(A, `e^{${x}}`);
    return {
      stem: md`The curve $C$ has equation $y = ${yTex}$. $C$ has two stationary points; the one with the larger $x$-coordinate has $x = \alpha$.`,
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Find $\dfrac{\mathrm{d}y}{\mathrm{d}x}$.`,
          answer: D,
          scheme: [M1(md`$${coefBody(A, 'e^{x}')}$ or $${-2 * k}x$ correct`), A1(md`$${answerTex(D)}$`)],
          hints: [md`$\dfrac{\mathrm{d}}{\mathrm{d}x}\left(e^{x}\right) = e^{x}$`, md`$\dfrac{\mathrm{d}}{\mathrm{d}x}\left(x^{2}\right) = 2x$`, 'Differentiate each term separately.'],
          solution: [md`Differentiating term by term: $${answerTex(D)}$`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Show that $\alpha$ lies between $${n}$ and $${n + 1}$.`,
          answer: ans.self(md`Let $\mathrm{g}(x) = ${dTex}$. $\mathrm{g}(${n}) = ${eA(String(n))} - ${2 * k * n} = ${fmtSF(gn, 3)} < 0$ and $\mathrm{g}(${n + 1}) = ${eA(String(n + 1))} - ${2 * k * (n + 1)} = ${fmtSF(gn1, 3)} > 0$. There is a change of sign and $\mathrm{g}$ is continuous, so $\dfrac{\mathrm{d}y}{\mathrm{d}x} = 0$ somewhere between $${n}$ and $${n + 1}$: $${n} < \alpha < ${n + 1}$.`),
          scheme: [B1(md`Evaluates $\dfrac{\mathrm{d}y}{\mathrm{d}x}$ at $x = ${n}$ and $x = ${n + 1}$: $${fmtSF(gn, 3)}$ and $${fmtSF(gn1, 3)}$`), B1('Change of sign, and the function is continuous, so the root (the stationary point) lies in between')],
          hints: ['At a stationary point dy/dx = 0, so look for where dy/dx changes sign.', md`Work out $\dfrac{\mathrm{d}y}{\mathrm{d}x}$ at $x = ${n}$ and at $x = ${n + 1}$.`, 'One is negative and one positive. Say why that means it is zero in between (continuity).'],
          solution: [md`At $x = ${n}$: $${fmtSF(gn, 3)} < 0$; at $x = ${n + 1}$: $${fmtSF(gn1, 3)} > 0$`, 'Sign change and dy/dx is continuous, so the stationary point lies between them.'],
        }),
        part({
          label: 'c',
          marks: 3,
          prompt: md`Taking $x_{0} = ${x0}$ as a first approximation, apply the Newton–Raphson method once to $\dfrac{\mathrm{d}y}{\mathrm{d}x} = 0$ to find $x_{1}$, to 4 decimal places.`,
          answer: X1,
          scheme: [M1(md`Differentiates again: $${d2Tex}$`), M1(md`$x_{1} = ${x0} - \dfrac{${eA(String(x0))} - ${fmtDP(2 * k * x0, 1)}}{${eA(String(x0))} - ${2 * k}}$`), A1(md`$${answerTex(X1)}$`)],
          hints: [md`Newton–Raphson for $\mathrm{g}(x) = 0$: $x_{1} = x_{0} - \dfrac{\mathrm{g}(x_{0})}{\mathrm{g}'(x_{0})}$. Here $\mathrm{g}$ is $\dfrac{\mathrm{d}y}{\mathrm{d}x}$.`, md`$\mathrm{g}'(x) = \dfrac{\mathrm{d}^{2}y}{\mathrm{d}x^{2}} = ${d2Tex}$`, md`$\mathrm{g}(${x0}) = ${fmtDP(g(x0), 5)}\ldots$ and $\mathrm{g}'(${x0}) = ${fmtDP(gd(x0), 5)}\ldots$`],
          solution: [md`$\mathrm{g}'(x) = ${d2Tex}$`, md`$x_{1} = ${x0} - \dfrac{${fmtDP(g(x0), 5)}}{${fmtDP(gd(x0), 5)}} = ${fmtDP(x1, 6)}\ldots$`, md`$${answerTex(X1)}$`],
        }),
        part({
          label: 'd',
          marks: 2,
          prompt: md`Carry on with the Newton–Raphson method to find $\alpha$ correct to 3 decimal places.`,
          answer: AL,
          scheme: [M1('Repeats the iteration until two values agree to 3 d.p. (or checks a sign change over the interval of ±0.0005)'), A1(md`$${answerTex(AL)}$`)],
          hints: [md`Use $x_{1}$ as the new starting value: $x_{2} = x_{1} - \dfrac{\mathrm{g}(x_{1})}{\mathrm{g}'(x_{1})}$.`, 'Keep going until the values stop changing in the third decimal place.', 'On a calculator: type the formula with ANS for x, then press = repeatedly.'],
          solution: [md`$x_{2} = ${fmtDP(x1 - g(x1) / gd(x1), 6)}\ldots$, and the values settle at $${fmtDP(alpha, 6)}\ldots$`, md`$${answerTex(AL)}$`],
        }),
        part({
          label: 'e',
          marks: 2,
          prompt: md`Hence find the $y$-coordinate of this stationary point, to 3 significant figures.`,
          answer: Y,
          scheme: [M1(md`Substitutes $\alpha$ into $y = ${yTex}$`), A1(md`$${answerTex(Y)}$`)],
          hints: ['Use the curve, not dy/dx.', md`$y = ${eA(String('\\alpha'))} - ${k}\alpha^{2}$`, 'Use the full calculator value of α, not a rounded one.'],
          solution: [md`$y = ${eA(fmtDP(alpha, 4))} - ${k}(${fmtDP(alpha, 4)})^{2} = ${fmtSF(y(alpha), 5)}\ldots$`, md`$${answerTex(Y)}$`],
        }),
      ],
      params: { A, k, x0 },
    };
  },
  verify(inst) {
    const { A, k, x0 } = inst.params as Record<string, number>;
    const y = (x: number) => A * Math.exp(x) - k * x * x;
    const D = (inst.parts[0].answer as ExprSpec).value;
    for (const x of [0.4, 1.3, 2.7]) expectClose(evaluate(D, { x }), derivative(y, x), 'derivative', 1e-6);
    const g = (x: number) => evaluate(D, { x });
    const x1 = x0 - g(x0) / derivative(g, x0);
    expectClose((inst.parts[2].answer as NumericSpec).value, x1, 'one Newton–Raphson step', 1e-6);
    const al = (inst.parts[3].answer as NumericSpec).value;
    expect(Math.abs(g(al)) < 1e-9 && derivative(g, al) > 0, 'alpha is the larger stationary point');
    expectClose((inst.parts[4].answer as NumericSpec).value, y(al), 'y at alpha');
  },
});

const templates: Template[] = [newtonStationary];
export default templates;
