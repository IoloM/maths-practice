/** Pure Year 1, Chapter 13 — long exam-style question: stationary points of a cubic, then the area it encloses. */
import { Q } from '../../../engine/core/rational';
import { Poly } from '../../../engine/core/poly';
import { evaluate, num } from '../../../engine/core/expr';
import { derivative, expect, expectClose, integrate, secondDerivative } from '../../../engine/core/numeric';
import { plot, yRangeOf } from '../../../engine/core/svg';
import { answerTex } from '../../../engine/marking/mark';
import type { CoordSpec, ExactSpec, ExprSpec, ListSpec } from '../../../engine/marking/types';
import { A1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { dx, linTex } from '../shared/calculus';

const cubicArea = defineTemplate({
  id: 'p1.13.long-cubic-stationary-points-and-area',
  family: 'p1.13.exam-style',
  title: 'Exam-style: stationary points of a cubic and the area it encloses',
  spec: ['P8.3', 'P7.3'],
  chapter: 'P1.13',
  sections: ['13.5', '12.9'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 12,
  time: 15,
  commands: ['Find', 'Use'],
  tags: ['exam-style', 'stationary points', 'area under a curve', 'cubic'],
  generate(r) {
    const h = r.int(-3, 3),
      k = r.int(2, 7),
      m = r.int(1, 3);
    // y = m(x − h)(x − h − k)²: touches the axis at h + k, crosses at h
    const f = Poly.fromRoots([h, h + k, h + k], m);
    r.require(f.terms.every((t) => Math.abs(t.c.value) <= 400));
    const df = f.diff();
    const xMax = Q.of(3 * h + k, 3),
      xMin = Q.of(h + k);
    const yMax = f.evalQ(xMax);
    const F = f.integ();
    const area = F.evalQ(h + k).sub(F.evalQ(h));
    const D: ExprSpec = ans.expr(df.toExpr(), ['x'], { label: '\\frac{dy}{dx} =' });
    const X: ListSpec = ans.list([ans.exact(num(xMax)), ans.exact(num(xMin))], { v: 'x' });
    const C: CoordSpec = ans.coord(ans.exact(num(xMax)), ans.exact(num(yMax)));
    const A: ExactSpec = ans.exact(num(area), ['exact']);
    const fx = (x: number) => f.eval(x);
    const svg = plot({
      x: [Math.min(h - 1, -0.5), Math.max(h + k + 1, 0.5)],
      y: yRangeOf([fx], h - 0.6, h + k + 0.6, 0.15),
      curves: [{ f: fx, from: h - 0.6, to: h + k + 0.7, label: 'C', labelAt: h + k + 0.55 }],
      shade: [{ upper: fx, from: h, to: h + k, label: 'R' }],
    });
    const upperOnly = F.evalQ(h + k);
    return {
      stem: md`The curve $C$ has equation $y = ${f.toLatex()}$. The region $R$, shown shaded, is bounded by $C$ and the $x$-axis.`,
      diagram: { svg, alt: 'Graph of a cubic curve C that crosses the x-axis, rises to a maximum, then comes back down to touch the x-axis; the region R between the curve and the x-axis is shaded.' },
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Find $\dfrac{\mathrm{d}y}{\mathrm{d}x}$.`,
          answer: D,
          scheme: [M1('Differentiates: at least two powers reduced by one'), A1(md`$${df.toLatex()}$`)],
          hints: ['Differentiate term by term.', md`$x^{n} \to nx^{n-1}$`, md`The $x^{3}$ term gives $${3 * m}x^{2}$.`],
          solution: [md`$\dfrac{\mathrm{d}y}{\mathrm{d}x} = ${answerTex(D)}$`],
        }),
        part({
          label: 'b',
          marks: 3,
          prompt: md`Find the $x$-coordinates of the two stationary points of $C$.`,
          answer: X,
          scheme: [M1(md`Sets their $\dfrac{\mathrm{d}y}{\mathrm{d}x} = 0$`), dM1('Solves their quadratic (factorising or the formula)'), A1(md`$x = ${xMax.toLatex()}$ and $x = ${xMin.toLatex()}$`)],
          hints: [md`Stationary points are where $\dfrac{\mathrm{d}y}{\mathrm{d}x} = 0$.`, md`Divide $${df.toLatex()} = 0$ by $${3 * m}$ first.`, md`It factorises: $(${linTex(3, -(3 * h + k))})(${linTex(1, -(h + k))}) = 0$`],
          solution: [md`$${df.toLatex()} = 0 \Rightarrow ${3 * m}(${linTex(3, -(3 * h + k))})(${linTex(1, -(h + k))}) = 0$`, md`$x = ${answerTex(X)}$`],
        }),
        part({
          label: 'c',
          marks: 3,
          prompt: md`Use the second derivative to show that the stationary point with the smaller $x$-coordinate is a maximum, and find its coordinates.`,
          answer: C,
          scheme: [M1(md`$\dfrac{\mathrm{d}^{2}y}{\mathrm{d}x^{2}} = ${df.diff().toLatex()}$`), M1(md`Substitutes $x = ${xMax.toLatex()}$: $${df.diff().evalQ(xMax).toLatex()} < 0$, so a maximum`), A1(md`$${answerTex(C)}$`)],
          hints: [md`Differentiate $\dfrac{\mathrm{d}y}{\mathrm{d}x}$ again.`, 'Negative second derivative means a maximum.', md`Substitute $x = ${xMax.toLatex()}$ into the equation of $C$ for the $y$-coordinate.`],
          errors: [err('used-dydx', ans.coord(ans.exact(num(xMax)), ans.exact(num(df.evalQ(xMax)))), md`For the $y$-coordinate substitute into $y$, not into $\dfrac{\mathrm{d}y}{\mathrm{d}x}$.`, 2)],
          solution: [md`$\dfrac{\mathrm{d}^{2}y}{\mathrm{d}x^{2}} = ${df.diff().toLatex()}$; at $x = ${xMax.toLatex()}$ it is $${df.diff().evalQ(xMax).toLatex()} < 0$: maximum.`, md`$y = ${yMax.toLatex()}$, so the maximum is $${answerTex(C)}$`],
        }),
        part({
          label: 'd',
          marks: 4,
          prompt: md`Use algebraic integration to find the exact area of $R$.`,
          answer: A,
          scheme: [M1(md`Integrates: $x^{n} \to x^{n+1}$`), A1(md`$${F.toLatex()}$`), dM1(md`Substitutes the limits $${h + k}$ and $${h}$ and subtracts`), A1(md`$${answerTex(A)}$`)],
          hints: [md`$R$ runs from $x = ${h}$ to $x = ${h + k}$, where $C$ meets the $x$-axis.`, md`$\displaystyle\int \left(${f.toLatex()}\right)${dx} = ${F.toLatex()}$`, md`Work out $\mathrm{F}(${h + k}) - \mathrm{F}(${h})$.`],
          errors: upperOnly.eq(area) ? [] : [err('upper-limit-only', ans.exact(num(upperOnly)), md`Subtract the value at the lower limit $x = ${h}$ too.`, 2)],
          solution: [md`$\displaystyle\int_{${h}}^{${h + k}} \left(${f.toLatex()}\right)${dx} = \left[${F.toLatex()}\right]_{${h}}^{${h + k}}$`, md`$= ${F.evalQ(h + k).toLatex()} - (${F.evalQ(h).toLatex()}) = ${answerTex(A)}$`],
        }),
      ],
      params: { h, k, m },
    };
  },
  verify(inst) {
    const { h, k, m } = inst.params as Record<string, number>;
    const y = (x: number) => m * (x - h) * (x - h - k) ** 2;
    const xs = (inst.parts[1].answer as ListSpec).items.map((it) => evaluate((it as ExactSpec).value));
    for (const x of xs) expect(Math.abs(derivative(y, x)) < 1e-6 * Math.max(1, m * k ** 3), 'stationary');
    const c = inst.parts[2].answer as CoordSpec;
    const xm = evaluate((c.x as ExactSpec).value);
    expect(secondDerivative(y, xm) < 0, 'maximum');
    expectClose(evaluate((c.y as ExactSpec).value), y(xm), 'y at max');
    expectClose(evaluate((inst.parts[3].answer as ExactSpec).value), integrate(y, h, h + k), 'area');
    expectClose(evaluate((inst.parts[3].answer as ExactSpec).value), (m * k ** 4) / 12, 'area formula');
  },
});

const templates: Template[] = [cubicArea];
export default templates;
