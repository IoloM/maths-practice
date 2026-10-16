/** Pure Year 1, Chapter 5 — straight line graphs. */
import { Q, surdSimplify } from '../../../engine/core/rational';
import { evaluate, num, sym } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { CoordSpec, EquationSpec, ExactSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';

const Y = sym('y');
const exV = (s: ExactSpec) => evaluate(s.value);
const onLine = (eq: EquationSpec, x: number, y: number) => evaluate(eq.lhs, { x, y }) - evaluate(eq.rhs, { x, y });

const throughTwo = defineTemplate({
  id: 'p1.5.line-through-two-points',
  family: 'p1.5.equations-of-lines',
  title: 'Equation of the line through two points (ax + by + c = 0)',
  spec: ['P3.1'],
  chapter: 'P1.5',
  sections: ['5.2'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 4,
  time: 4,
  commands: ['Find'],
  tags: ['straight lines', 'gradient', 'equation of a line'],
  generate(r) {
    const x1 = r.int(-6, 6),
      y1 = r.int(-6, 6),
      x2 = r.intExcept(-6, 6, [x1]),
      y2 = r.intExcept(-6, 6, [y1]);
    const m = Q.of(y2 - y1, x2 - x1);
    // (y − y1)(x2 − x1) = (y2 − y1)(x − x1) → (y2 − y1)x − (x2 − x1)y + ... = 0
    let a = y2 - y1,
      b = -(x2 - x1),
      c = -(y2 - y1) * x1 + (x2 - x1) * y1;
    if (a < 0) [a, b, c] = [-a, -b, -c];
    const E = ans.eq(ex(sumTex([[a, 'x'], [b, 'y'], [c, '']])), num(0), ['x', 'y'], ['ax+by+c=0']);
    return {
      parts: [
        part({
          marks: 4,
          prompt: md`The line $l$ passes through $A(${x1}, ${y1})$ and $B(${x2}, ${y2})$. Find an equation for $l$ in the form $ax + by + c = 0$, where $a$, $b$ and $c$ are integers.`,
          answer: E,
          scheme: [M1('Gradient = change in y ÷ change in x'), A1(md`$m = ${m.toLatex()}$`), M1(md`$y - ${y1} = m(x - ${x1})$`), A1(md`$${answerTex(E)}$`)],
          hints: ['Find the gradient first.', md`$m = \dfrac{${y2} - (${y1})}{${x2} - (${x1})}$`, md`Use $y - y_1 = m(x - x_1)$, then clear fractions and rearrange so everything is on one side.`],
          errors: [err('flipped-gradient', ans.eq(Y, ex(sumTex([[Q.of(x2 - x1, y2 - y1), `(x - ${x1})`.replace('- -', '+ ')], [y1, '']])), ['x', 'y']), 'Gradient is change in y divided by change in x.', 1)],
          solution: [md`$m = \dfrac{${y2 - y1}}{${x2 - x1}} = ${m.toLatex()}$`, md`$y - (${y1}) = ${m.toLatex()}(x - (${x1}))$`, md`$${answerTex(E)}$`],
        }),
      ],
      params: { x1, y1, x2, y2 },
    };
  },
  verify(inst) {
    const { x1, y1, x2, y2 } = inst.params as Record<string, number>;
    const e = inst.parts[0].answer as EquationSpec;
    expectClose(onLine(e, x1, y1), 0, 'A on line', 1e-9);
    expectClose(onLine(e, x2, y2), 0, 'B on line', 1e-9);
  },
});

const perpendicular = defineTemplate({
  id: 'p1.5.perpendicular-line',
  family: 'p1.5.parallel-perpendicular',
  title: 'Line perpendicular to a given line through a point',
  spec: ['P3.1'],
  chapter: 'P1.5',
  sections: ['5.3'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 4,
  time: 4,
  commands: ['Find'],
  tags: ['straight lines', 'perpendicular', 'gradient'],
  generate(r) {
    const a = r.intNZ(-6, 6),
      b = r.intNZ(-6, 6),
      c = r.int(-10, 10);
    const m1 = Q.of(-a, b);
    r.require(!m1.isZero);
    const mp = m1.inv().neg();
    const px = r.int(-6, 6),
      py = r.int(-6, 6);
    const parallel = r.bool(0.3);
    const m = parallel ? m1 : mp;
    const c2 = Q.of(py).sub(m.mul(px));
    const E = ans.eq(Y, ex(sumTex([[m, 'x'], [c2, '']])), ['x', 'y'], ['y=mx+c']);
    return {
      parts: [
        part({
          marks: 4,
          prompt: md`The line $l_1$ has equation $${sumTex([[a, 'x'], [b, 'y'], [c, '']])} = 0$. The line $l_2$ is ${parallel ? 'parallel' : 'perpendicular'} to $l_1$ and passes through $(${px}, ${py})$. Find an equation for $l_2$ in the form $y = mx + c$.`,
          answer: E,
          scheme: [M1(md`Gradient of $l_1$ is $${m1.toLatex()}$`), M1(parallel ? 'Uses the same gradient' : md`Perpendicular gradient $= -\frac{1}{m}$`), M1(md`$y - ${py} = m(x - ${px})$`), A1(md`$${answerTex(E)}$`)],
          hints: [md`Rearrange $l_1$ into $y = mx + c$ to find its gradient.`, parallel ? 'Parallel lines have equal gradients.' : 'Perpendicular gradients multiply to −1.', md`Then use $y - y_1 = m(x - x_1)$ with $(${px}, ${py})$.`],
          errors: parallel ? [] : [err('negative-only', ans.eq(Y, ex(sumTex([[m1.neg(), 'x'], [Q.of(py).sub(m1.neg().mul(px)), '']])), ['x', 'y']), 'For a perpendicular line take the negative RECIPROCAL of the gradient, not just the negative.', 2)],
          solution: [md`$l_1$: $y = ${sumTex([[m1, 'x'], [Q.of(-c, b), '']])}$, gradient $${m1.toLatex()}$`, md`Gradient of $l_2$: $${m.toLatex()}$`, md`$y - (${py}) = ${m.toLatex()}(x - (${px}))$, so $${answerTex(E)}$`],
        }),
      ],
      params: { a, b, px, py, parallel },
    };
  },
  verify(inst) {
    const { a, b, px, py, parallel } = inst.params as { a: number; b: number; px: number; py: number; parallel: boolean };
    const e = inst.parts[0].answer as EquationSpec;
    expectClose(onLine(e, px, py), 0, 'through point', 1e-9);
    const m2 = evaluate(e.rhs, { x: 1 }) - evaluate(e.rhs, { x: 0 });
    const m1 = -a / b;
    expectClose(parallel ? m2 : m1 * m2, parallel ? m1 : -1, 'gradient condition');
  },
});

const triangleArea = defineTemplate({
  id: 'p1.5.intersection-and-area',
  family: 'p1.5.length-area',
  title: 'Intersection of lines and area of a triangle',
  spec: ['P3.1', 'P2.4'],
  chapter: 'P1.5',
  sections: ['5.4'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 8,
  commands: ['Find'],
  tags: ['straight lines', 'intersection', 'area'],
  generate(r) {
    // two lines crossing at P; triangle formed with the x-axis
    const px = r.int(-3, 6),
      py = r.int(2, 8);
    const m1 = r.pick([1, 2, 3, Q.of(1, 2).value, Q.of(3, 2).value]),
      m2 = -r.pick([1, 2, 3, Q.of(1, 2).value, 4]);
    const A = px - py / m1,
      B = px - py / m2;
    const base = Math.abs(B - A);
    const area = 0.5 * base * py;
    const c1 = Q.from(py).sub(Q.from(m1).mul(px)),
      c2 = Q.from(py).sub(Q.from(m2).mul(px));
    const P: CoordSpec = ans.coord(ans.exact(num(px)), ans.exact(num(py)));
    const Ar = ans.exact(num(Q.from(area)), ['exact'], { allowDecimal: true });
    return {
      stem: md`The line $l_1$ has equation $y = ${sumTex([[Q.from(m1), 'x'], [c1, '']])}$ and the line $l_2$ has equation $y = ${sumTex([[Q.from(m2), 'x'], [c2, '']])}$.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find the coordinates of the point $P$ where $l_1$ and $l_2$ intersect.`, answer: P, scheme: [M1('Equates the two expressions for y'), A1(md`$x = ${px}$`), A1(md`$${answerTex(P)}$`)], hints: ['At the intersection both equations hold.', 'Set the right-hand sides equal and solve for x.', 'Substitute back to find y.'], solution: [md`$${sumTex([[Q.from(m1), 'x'], [c1, '']])} = ${sumTex([[Q.from(m2), 'x'], [c2, '']])} \Rightarrow x = ${px}$, $y = ${py}$`, md`$P = ${answerTex(P)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`The lines meet the $x$-axis at $A$ and $B$. Find the area of triangle $APB$.`, answer: Ar, scheme: [M1('Finds where each line meets y = 0'), A1(md`$A(${fmtNum(A)}, 0)$, $B(${fmtNum(B)}, 0)$`), A1(md`Area $= ${answerTex(Ar)}$`)], hints: ['Set y = 0 in each equation.', 'The base is the distance AB; the height is the y-coordinate of P.', 'Area = ½ × base × height.'], solution: [md`$A = (${fmtNum(A)}, 0)$, $B = (${fmtNum(B)}, 0)$; base $= ${fmtNum(base)}$, height $= ${py}$`, md`Area $= \frac{1}{2} \times ${fmtNum(base)} \times ${py} = ${answerTex(Ar)}$`] }),
      ],
      params: { m1, m2, px, py },
    };
  },
  verify(inst) {
    const { m1, m2, px, py } = inst.params as Record<string, number>;
    const A = px - py / m1,
      B = px - py / m2;
    // shoelace formula
    const area = 0.5 * Math.abs(A * (0 - py) + px * (0 - 0) + B * (py - 0));
    expectClose(exV(inst.parts[1].answer as ExactSpec), area, 'shoelace area');
  },
});

const lineModel = defineTemplate({
  id: 'p1.5.straight-line-model',
  family: 'p1.5.modelling',
  title: 'Straight-line models in context',
  spec: ['P3.1', 'P2.11'],
  chapter: 'P1.5',
  sections: ['5.5'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 5,
  time: 6,
  commands: ['Find', 'Interpret'],
  tags: ['straight lines', 'modelling', 'gradient', 'context'],
  generate(r) {
    const ctx = r.pick([
      { x: 'number of guests, $n$', y: 'total cost, $C$ pounds,', xs: 'n', ys: 'C', a: [80, 400], b: [12, 40], grad: 'the cost per guest', icpt: 'the fixed cost' },
      { x: 'time, $t$ minutes', y: 'temperature, $T$ °C,', xs: 't', ys: 'T', a: [5, 25], b: [2, 8], grad: 'the increase in temperature per minute', icpt: 'the initial temperature' },
      { x: 'distance, $d$ km', y: 'taxi fare, $F$ pounds,', xs: 'd', ys: 'F', a: [2, 6], b: [1, 3], grad: 'the charge per km', icpt: 'the fixed charge' },
    ]);
    const a = r.int(ctx.a[0], ctx.a[1]),
      b = r.int(ctx.b[0], ctx.b[1]);
    const x1 = r.int(2, 8),
      x2 = x1 + r.int(3, 10);
    const y1 = a + b * x1,
      y2 = a + b * x2;
    const E = ans.eq(sym(ctx.ys), ex(`${b}${ctx.xs} + ${a}`), [ctx.xs, ctx.ys]);
    const opts = r.shuffle([`It is ${ctx.grad}.`, `It is ${ctx.icpt}.`, `It is the value of ${ctx.ys} when ${ctx.xs} = 1.`]);
    const C = ans.choice(opts, opts.indexOf(`It is ${ctx.grad}.`));
    return {
      stem: md`The ${ctx.y} is a linear function of the ${ctx.x}. When $${ctx.xs} = ${x1}$, $${ctx.ys} = ${y1}$, and when $${ctx.xs} = ${x2}$, $${ctx.ys} = ${y2}$.`,
      parts: [
        part({ label: 'a', marks: 4, prompt: md`Find an equation linking $${ctx.ys}$ and $${ctx.xs}$.`, answer: E, scheme: [M1('Gradient from the two points'), A1(md`$${b}$`), M1('Uses a point to find the intercept'), A1(md`$${answerTex(E)}$`)], hints: ['Find the gradient: change in output ÷ change in input.', md`$\frac{${y2} - ${y1}}{${x2} - ${x1}}$`, 'Then substitute one pair of values to find the constant.'], solution: [md`Gradient $= \frac{${y2 - y1}}{${x2 - x1}} = ${b}$; $${y1} = ${b}(${x1}) + c \Rightarrow c = ${a}$`, md`$${answerTex(E)}$`] }),
        part({ label: 'b', marks: 1, prompt: 'Interpret the gradient in context.', answer: C, scheme: [B1('Gradient interpreted in context')], hints: ['The gradient is the rate of change.', 'How much does the output change for each extra unit of input?', 'Use the context words.'], solution: [`The gradient is ${ctx.grad}.`] }),
      ],
      params: { a, b, xs: ctx.xs, ys: ctx.ys, x1, y1 },
    };
  },
  verify(inst) {
    const { a, b, xs, ys, x1, y1 } = inst.params as { a: number; b: number; xs: string; ys: string; x1: number; y1: number };
    const e = inst.parts[0].answer as EquationSpec;
    expectClose(evaluate(e.lhs, { [xs]: x1, [ys]: y1 }) - evaluate(e.rhs, { [xs]: x1, [ys]: y1 }), 0, 'fits data', 1e-9);
    expect(a + b * x1 === y1, 'consistent');
  },
});

const distanceMid = defineTemplate({
  id: 'p1.5.length-and-midpoint',
  family: 'p1.5.length-area',
  title: 'Length and midpoint of a line segment',
  spec: ['P3.1', 'P2.2'],
  chapter: 'P1.5',
  sections: ['5.4'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 1,
  marks: 4,
  time: 4,
  commands: ['Find'],
  tags: ['coordinate geometry', 'distance', 'midpoint', 'surds'],
  generate(r) {
    const x1 = r.int(-7, 7),
      y1 = r.int(-7, 7),
      x2 = r.intExcept(-7, 7, [x1]),
      y2 = r.intExcept(-7, 7, [y1]);
    const d2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    const M: CoordSpec = ans.coord(ans.exact(num(Q.of(x1 + x2, 2))), ans.exact(num(Q.of(y1 + y2, 2))));
    const [sq, rest] = surdSimplify(d2);
    const D = ans.exact(ex(rest === 1 ? `${sq}` : `${sq === 1 ? '' : sq}\\sqrt{${rest}}`), ['exact', 'surd']);
    return {
      stem: md`The points $A$ and $B$ have coordinates $(${x1}, ${y1})$ and $(${x2}, ${y2})$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the midpoint of $AB$.`, answer: M, scheme: [M1('Averages the coordinates'), A1(md`$${answerTex(M)}$`)], hints: ['Midpoint = average of the x-coordinates and of the y-coordinates.', md`$\left(\frac{x_1 + x_2}{2}, \frac{y_1 + y_2}{2}\right)$`, 'Watch the negative signs.'], solution: [md`Midpoint $= ${answerTex(M)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the exact length of $AB$, in simplest surd form.`, answer: D, scheme: [M1(md`$\sqrt{(${x2} - ${x1})^{2} + (${y2} - ${y1})^{2}}$`), A1(md`$${answerTex(D)}$`)], hints: ['Use Pythagoras.', md`Differences: $${x2 - x1}$ and $${y2 - y1}$.`, md`$\sqrt{${d2}}$ — simplify the surd.`], errors: [err('decimal', ans.num(Math.sqrt(d2), { sf: 3 }), 'Give an exact answer in surd form.', 1)], solution: [md`$AB = \sqrt{${(x2 - x1) ** 2} + ${(y2 - y1) ** 2}} = \sqrt{${d2}} = ${answerTex(D)}$`] }),
      ],
      params: { x1, y1, x2, y2 },
    };
  },
  verify(inst) {
    const { x1, y1, x2, y2 } = inst.params as Record<string, number>;
    expectClose(exV(inst.parts[1].answer as ExactSpec), Math.hypot(x2 - x1, y2 - y1), 'length');
  },
});

void dM1;
void B1;

const templates: Template[] = [throughTwo, perpendicular, triangleArea, lineModel, distanceMid];
export default templates;
export type { NumericSpec };
