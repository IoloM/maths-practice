/** Pure Year 2, Chapter 8 — long exam-style question: x = a sin t, y = b sin 2t — gradient, tangent, Cartesian form, area. */
import { Q } from '../../../engine/core/rational';
import { evaluate, num, sym } from '../../../engine/core/expr';
import { expect, expectClose, integrate } from '../../../engine/core/numeric';
import { plot } from '../../../engine/core/svg';
import { answerTex } from '../../../engine/marking/mark';
import type { EquationSpec, ExactSpec, ExprSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex } from '../shared/calculus';

/** q√3 as LaTeX, e.g. \frac{2\sqrt{3}}{3}. */
function rt3(q: Q): string {
  const sign = q.sign < 0 ? '-' : '';
  const n = Math.abs(q.n),
    d = q.d;
  const top = n === 1 ? '\\sqrt{3}' : `${n}\\sqrt{3}`;
  return d === 1 ? `${sign}${top}` : `${sign}\\frac{${top}}{${d}}`;
}

const parametricArea = defineTemplate({
  id: 'p2.8.long-parametric-tangent-cartesian-area',
  family: 'p2.8.exam-style',
  title: 'Exam-style: parametric curve — gradient, tangent, Cartesian equation and area',
  spec: ['P8.3', 'P7.5', 'P3.3'],
  chapter: 'P2.8',
  sections: ['8.1', '8.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 5,
  marks: 12,
  time: 15,
  commands: ['Find', 'Show that'],
  tags: ['exam-style', 'parametric equations', 'parametric differentiation', 'parametric integration', 'area'],
  generate(r) {
    const a = r.int(2, 6),
      b = r.int(1, 6);
    const third = r.bool(); // tangent at t = π/3, otherwise π/6
    const t0 = third ? Math.PI / 3 : Math.PI / 6;
    const t0Tex = third ? '\\frac{\\pi}{3}' : '\\frac{\\pi}{6}';
    // gradient dy/dx = 2b cos 2t / (a cos t); tangent y = mx + c (m, c contain √3 at π/6)
    const tan = third ? { m: `${Q.of(-2 * b, a).toLatex()}`, c: rt3(Q.of(3 * b, 2)) } : { m: rt3(Q.of(2 * b, 3 * a)), c: rt3(Q.of(b, 6)) };
    const P = third ? { x: rt3(Q.of(a, 2)), y: rt3(Q.of(b, 2)) } : { x: Q.of(a, 2).toLatex(), y: rt3(Q.of(b, 2)) };
    const D: ExprSpec = ans.expr(ex(`\\frac{${2 * b}\\cos 2t}{${a}\\cos t}`), ['t'], { domain: { t: [0.1, 1.4] }, label: '\\frac{dy}{dx} =' });
    const T: EquationSpec = ans.eq(sym('y'), ex(`${tan.m}x + ${tan.c}`), ['x', 'y']);
    const k = Q.of(2 * b, a * a);
    const CART: ExprSpec = ans.expr(ex(`${k.toLatex()}x\\sqrt{${a * a} - x^{2}}`), ['x'], { domain: { x: [0.15 * a, 0.9 * a] }, label: 'y =' });
    const AREA: ExactSpec = ans.exact(num(Q.of(2 * a * b, 3)), ['exact']);
    const yx = (x: number) => (2 * b * x * Math.sqrt(Math.max(0, a * a - x * x))) / (a * a);
    const svg = plot({
      x: [-0.4, a + 0.6],
      y: [-0.4, b + 0.7],
      curves: [{ para: { x: (t) => a * Math.sin(t), y: (t) => b * Math.sin(2 * t), t: [0, Math.PI / 2] }, label: 'C', labelAt: 0.5 }],
      shade: [{ upper: yx, from: 0, to: a, label: 'R' }],
      xTicks: [{ v: a, label: `${a}` }],
    });
    const wrongCart = ans.expr(ex(`${Q.of(b, a * a).toLatex()}x\\sqrt{${a * a} - x^{2}}`), ['x'], { domain: { x: [0.15 * a, 0.9 * a] } });
    return {
      stem: md`The curve $C$ has parametric equations $x = ${a}\sin t$, $\;y = ${b === 1 ? '' : b}\sin 2t$, $\;0 \leqslant t \leqslant \dfrac{\pi}{2}$. The region $R$, shown shaded, is bounded by $C$ and the $x$-axis.`,
      diagram: { svg, alt: 'A hump-shaped curve C starting at the origin, rising to a maximum and coming back down to the x-axis; the region R under the curve is shaded.' },
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Find $\dfrac{\mathrm{d}y}{\mathrm{d}x}$ in terms of $t$.`,
          answer: D,
          scheme: [M1(md`$\dfrac{\mathrm{d}y}{\mathrm{d}t} \div \dfrac{\mathrm{d}x}{\mathrm{d}t}$ with $\dfrac{\mathrm{d}x}{\mathrm{d}t} = ${a}\cos t$`), A1(md`$${answerTex(D)}$`)],
          hints: [md`$\dfrac{\mathrm{d}y}{\mathrm{d}x} = \dfrac{\mathrm{d}y/\mathrm{d}t}{\mathrm{d}x/\mathrm{d}t}$`, md`$\dfrac{\mathrm{d}}{\mathrm{d}t}(\sin 2t) = 2\cos 2t$`, md`$\dfrac{\mathrm{d}x}{\mathrm{d}t} = ${a}\cos t$`],
          errors: [err('forgot-chain', ans.expr(ex(`\\frac{${b}\\cos 2t}{${a}\\cos t}`), ['t'], { domain: { t: [0.1, 1.4] } }), md`$\sin 2t$ differentiates to $2\cos 2t$ (chain rule).`, 1)],
          solution: [md`$\dfrac{\mathrm{d}y}{\mathrm{d}t} = ${2 * b}\cos 2t$, $\dfrac{\mathrm{d}x}{\mathrm{d}t} = ${a}\cos t$`, md`$\dfrac{\mathrm{d}y}{\mathrm{d}x} = ${answerTex(D)}$`],
        }),
        part({
          label: 'b',
          marks: 3,
          prompt: md`Find an equation of the tangent to $C$ at the point where $t = ${t0Tex}$, giving your answer in the form $y = mx + c$ with $m$ and $c$ exact.`,
          answer: T,
          scheme: [B1(md`Point $\left(${P.x}, ${P.y}\right)$`), M1(md`Gradient at $t = ${t0Tex}$: $${tan.m}$`), A1(md`$${answerTex(T)}$`)],
          hints: [md`At $t = ${t0Tex}$: $x = ${P.x}$ and $y = ${P.y}$.`, md`Substitute $t = ${t0Tex}$ into your $\dfrac{\mathrm{d}y}{\mathrm{d}x}$.`, 'Use y − y₁ = m(x − x₁) and simplify.'],
          solution: [md`Point $\left(${P.x}, ${P.y}\right)$, gradient $${tan.m}$`, md`$${answerTex(T)}$`],
        }),
        part({
          label: 'c',
          marks: 3,
          prompt: md`Show that a Cartesian equation of $C$ is $y = kx\sqrt{${a * a} - x^{2}}$, $\;0 \leqslant x \leqslant ${a}$, and write down the value of the constant $k$. (Enter the whole equation.)`,
          answer: CART,
          scheme: [M1(md`Uses $\sin 2t = 2\sin t\cos t$`), M1(md`Uses $\sin t = \dfrac{x}{${a}}$ and $\cos t = \sqrt{1 - \dfrac{x^{2}}{${a * a}}}$`), A1(md`$y = ${k.toLatex()}x\sqrt{${a * a} - x^{2}}$`)],
          hints: [md`$\sin 2t = 2\sin t\cos t$`, md`$\sin t = \dfrac{x}{${a}}$; use $\cos^{2} t = 1 - \sin^{2} t$ (cos t ⩾ 0 here).`, md`$\cos t = \dfrac{\sqrt{${a * a} - x^{2}}}{${a}}$`],
          errors: [err('forgot-2', wrongCart, md`Don't lose the 2 in $\sin 2t = 2\sin t\cos t$.`, 2)],
          solution: [md`$y = ${2 * b}\sin t\cos t = ${2 * b}\cdot\dfrac{x}{${a}}\cdot\dfrac{\sqrt{${a * a} - x^{2}}}{${a}}$`, md`$${answerTex(CART)}$, so $k = ${k.toLatex()}$`],
        }),
        part({
          label: 'd',
          marks: 4,
          prompt: md`Use parametric integration to find the exact area of $R$.`,
          answer: AREA,
          scheme: [
            M1(md`Area $= \displaystyle\int y\,\dfrac{\mathrm{d}x}{\mathrm{d}t}\,\mathrm{d}t = \int_{0}^{\pi/2} ${b === 1 ? '' : b}\sin 2t \times ${a}\cos t\,\mathrm{d}t$`),
            M1(md`Uses $\sin 2t = 2\sin t\cos t$: $${2 * a * b}\displaystyle\int \sin t\cos^{2} t\,\mathrm{d}t$`),
            dM1(md`Integrates to $-\dfrac{${2 * a * b}}{3}\cos^{3} t$`),
            A1(md`$${answerTex(AREA)}$`),
          ],
          hints: [md`Area $= \displaystyle\int y\dfrac{\mathrm{d}x}{\mathrm{d}t}\,\mathrm{d}t$, from $t = 0$ to $t = \dfrac{\pi}{2}$.`, md`Write $\sin 2t\cos t = 2\sin t\cos^{2} t$.`, md`$\displaystyle\int \sin t\cos^{2} t\,\mathrm{d}t = -\tfrac{1}{3}\cos^{3} t + c$ (reverse chain rule).`],
          errors: [err('no-dxdt', ans.exact(num(Q.of(b))), md`In parametric form the area is $\int y\,\dfrac{\mathrm{d}x}{\mathrm{d}t}\,\mathrm{d}t$, not $\int y\,\mathrm{d}t$.`, 0)],
          solution: [md`$\displaystyle\int_{0}^{\pi/2} ${2 * a * b}\sin t\cos^{2} t\,\mathrm{d}t = \left[-\tfrac{${2 * a * b}}{3}\cos^{3} t\right]_{0}^{\pi/2}$`, md`$= 0 - \left(-\tfrac{${2 * a * b}}{3}\right) = ${answerTex(AREA)}$`],
        }),
      ],
      params: { a, b, t0 },
    };
  },
  verify(inst) {
    const { a, b, t0 } = inst.params as Record<string, number>;
    const x = (t: number) => a * Math.sin(t),
      y = (t: number) => b * Math.sin(2 * t);
    const D = (inst.parts[0].answer as ExprSpec).value;
    for (const t of [0.3, 0.7, 1.2]) {
      const h = 1e-6;
      expectClose(evaluate(D, { t }), (y(t + h) - y(t - h)) / (x(t + h) - x(t - h)), 'dy/dx', 1e-5);
    }
    const T = inst.parts[1].answer as EquationSpec;
    const m = (2 * b * Math.cos(2 * t0)) / (a * Math.cos(t0));
    expectClose(evaluate(T.rhs, { x: x(t0) }), y(t0), 'tangent through the point');
    expectClose(evaluate(T.rhs, { x: x(t0) + 1 }) - evaluate(T.rhs, { x: x(t0) }), m, 'tangent gradient');
    const C = (inst.parts[2].answer as ExprSpec).value;
    for (const t of [0.2, 0.9, 1.3]) expectClose(evaluate(C, { x: x(t) }), y(t), 'Cartesian matches the curve');
    const area = integrate((t) => y(t) * a * Math.cos(t), 0, Math.PI / 2);
    expectClose(evaluate((inst.parts[3].answer as ExactSpec).value), area, 'area');
    expect(Math.abs(integrate((xx) => evaluate(C, { x: xx }), 0, a) - area) < 1e-6, 'area from the Cartesian form');
  },
});

const templates: Template[] = [parametricArea];
export default templates;
