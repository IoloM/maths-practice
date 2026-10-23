/** Pure Year 1, Chapter 6 — long exam-style question: circle from its expanded equation, tangent, and a triangle. */
import { Q, gcd, surdSimplify } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { plot } from '../../../engine/core/svg';
import { answerTex } from '../../../engine/marking/mark';
import type { CoordSpec, EquationSpec, ExactSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';

/** Offsets (p, q) from the centre to P: both non-zero so the tangent is neither horizontal nor vertical. */
const OFFSETS: [number, number][] = [
  [3, 4],
  [4, 3],
  [1, 2],
  [2, 1],
  [1, 3],
  [3, 1],
  [2, 3],
  [3, 2],
  [1, 1],
  [2, 4],
  [4, 2],
  [1, 4],
];

/** (x − a) with the sign written properly; just x when a = 0. */
const shifted = (v: string, a: number) => (a === 0 ? v : `(${v} ${a > 0 ? '-' : '+'} ${Math.abs(a)})`);

const rootTex = (n: number) => {
  const [s, rr] = surdSimplify(n);
  return rr === 1 ? `${s}` : `${s === 1 ? '' : s}\\sqrt{${rr}}`;
};

const circleTangent = defineTemplate({
  id: 'p1.6.long-circle-tangent-and-triangle',
  family: 'p1.6.exam-style',
  title: 'Exam-style: centre and radius, tangent at a point, and a triangle',
  spec: ['P3.2', 'P3.1'],
  chapter: 'P1.6',
  sections: ['6.2', '6.4', '6.5'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 11,
  time: 14,
  commands: ['Find', 'Show that'],
  tags: ['exam-style', 'circles', 'tangents', 'coordinate geometry'],
  generate(r) {
    const a = r.int(-6, 6),
      b = r.int(-6, 6);
    const [p0, q0] = r.pick(OFFSETS);
    const p = p0 * r.sign(),
      q = q0 * r.sign();
    const r2 = p * p + q * q;
    const Px = a + p,
      Py = b + q;
    r.require(Px !== 0 && (a !== 0 || b !== 0));
    // tangent at P is perpendicular to CP: p(x − Px) + q(y − Py) = 0
    const c0 = -(p * Px + q * Py);
    const g = gcd(gcd(Math.abs(p), Math.abs(q)), Math.abs(c0)) || 1;
    const s = p < 0 ? -1 : 1;
    const [ta, tb, tc] = [(s * p) / g, (s * q) / g, (s * c0) / g];
    const Ty = Q.of(p * Px + q * Py, q);
    // triangle C(a, b), P, T(0, Ty): area = ½|x_C(y_P − y_T) + x_P(y_T − y_C)|
    const areaQ = Q.of(a).mul(Q.of(Py).sub(Ty)).add(Q.of(Px).mul(Ty.sub(b))).abs().div(2);
    r.require(!areaQ.isZero);
    const D = -2 * a,
      E = -2 * b,
      F = a * a + b * b - r2;
    const eqTex = `${sumTex([[1, 'x^{2}'], [1, 'y^{2}'], [D, 'x'], [E, 'y'], [F, '']])} = 0`;
    const CEN: CoordSpec = ans.coord(ans.exact(num(Q.of(a))), ans.exact(num(Q.of(b))));
    const RAD: ExactSpec = ans.exact(ex(rootTex(r2)), ['exact']);
    const TAN: EquationSpec = ans.eq(ex(sumTex([[ta, 'x'], [tb, 'y'], [tc, '']])), num(0), ['x', 'y'], ['ax+by+c=0']);
    const T: CoordSpec = ans.coord(ans.exact(num(Q.ZERO)), ans.exact(num(Ty)));
    const AR: ExactSpec = ans.exact(num(areaQ), ['exact']);
    const rad = Math.sqrt(r2);
    const tanY = (x: number) => Py - (p / q) * (x - Px);
    const xs = [Math.min(a - rad, 0, Px) - 1.2, Math.max(a + rad, 0, Px) + 1.2];
    const svg = plot({
      x: [xs[0], xs[1]],
      y: [Math.min(b - rad, 0, Ty.value, Py) - 1.2, Math.max(b + rad, 0, Ty.value, Py) + 1.2],
      w: 300,
      h: 300,
      curves: [
        { para: { x: (t) => a + rad * Math.cos(t), y: (t) => b + rad * Math.sin(t), t: [0, 2 * Math.PI] } },
        { f: tanY, from: Math.min(0, Px) - 0.8, to: Math.max(0, Px) + 0.8, cls: 'dg-line' },
      ],
      points: [
        { x: a, y: b, label: 'C', dot: true, dy: 14 },
        { x: Px, y: Py, label: 'P', dot: true },
        { x: 0, y: Ty.value, label: 'T', dot: true },
      ],
    });
    return {
      stem: md`The circle $C$ has equation $${eqTex}$. The point $P(${Px}, ${Py})$ lies on $C$.`,
      diagram: { svg, alt: 'A circle with centre C, a point P on the circle, and the tangent at P drawn as a straight line meeting the y-axis at T.' },
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Find the coordinates of the centre of $C$.`,
          answer: CEN,
          scheme: [M1(md`Completes the square: $${shifted('x', a)}^{2} + ${shifted('y', b)}^{2} = \dots$`), A1(md`$${answerTex(CEN)}$`)],
          hints: ['Complete the square in x and in y.', md`$${sumTex([[1, 'x^{2}'], [D, 'x']])} = ${shifted('x', a)}^{2} - ${a * a}$`, md`The centre of $(x - a)^{2} + (y - b)^{2} = r^{2}$ is $(a, b)$.`],
          errors: [err('sign-flip', ans.coord(ans.exact(num(Q.of(-a))), ans.exact(num(Q.of(-b)))), md`$(x - a)^{2}$ has centre at $x = a$: the sign changes.`, 1)],
          solution: [md`$${shifted('x', a)}^{2} + ${shifted('y', b)}^{2} = ${r2}$, so the centre is $${answerTex(CEN)}$`],
        }),
        part({
          label: 'b',
          marks: 1,
          prompt: md`Find the exact radius of $C$.`,
          answer: RAD,
          scheme: [B1(md`$${answerTex(RAD)}$`)],
          hints: ['Use your completed-square form.', md`$r^{2} = ${a * a} + ${b * b} - (${F})$`, 'Take the square root and simplify.'],
          errors: [err('r-squared', ans.exact(num(Q.of(r2))), 'That is r²: take the square root.', 0)],
          solution: [md`$r^{2} = ${r2}$, so $r = ${answerTex(RAD)}$`],
        }),
        part({
          label: 'c',
          marks: 4,
          prompt: md`Find an equation of the tangent to $C$ at $P$, giving your answer in the form $ax + by + c = 0$, where $a$, $b$ and $c$ are integers.`,
          answer: TAN,
          scheme: [M1(md`Gradient of $CP$: $\dfrac{${q}}{${p}} = ${Q.of(q, p).toLatex()}$`), M1(md`Perpendicular gradient $${Q.of(-p, q).toLatex()}$`), dM1(md`$${sumTex([[1, 'y'], [-Py, '']])} = ${Q.of(-p, q).toLatex()}${shifted('x', Px)}$`), A1(md`$${answerTex(TAN)}$`)],
          hints: ['A tangent is perpendicular to the radius at the point of contact.', md`Gradient of the radius $CP$ is $${Q.of(q, p).toLatex()}$.`, 'Use y − y₁ = m(x − x₁), then multiply out to clear fractions.'],
          errors: [err('radius-gradient', ans.eq(ex(sumTex([[q, 'x'], [-p, 'y'], [p * Py - q * Px, '']])), num(0), ['x', 'y']), 'That line has the gradient of the radius. The tangent is perpendicular to it.', 1)],
          solution: [md`$m_{CP} = ${Q.of(q, p).toLatex()}$, so the tangent has gradient $${Q.of(-p, q).toLatex()}$`, md`$${sumTex([[1, 'y'], [-Py, '']])} = ${Q.of(-p, q).toLatex()}${shifted('x', Px)} \Rightarrow ${answerTex(TAN)}$`],
        }),
        part({
          label: 'd',
          marks: 2,
          prompt: md`The tangent meets the $y$-axis at $T$. Find the coordinates of $T$.`,
          answer: T,
          scheme: [M1('Substitutes x = 0 into their tangent'), A1(md`$${answerTex(T)}$`)],
          hints: ['Points on the y-axis have x = 0.', 'Substitute x = 0 into your answer to (c).', 'Solve for y.'],
          solution: [md`$x = 0$: $${sumTex([[tb, 'y'], [tc, '']])} = 0 \Rightarrow y = ${Ty.toLatex()}$, so $T${answerTex(T)}$`],
        }),
        part({
          label: 'e',
          marks: 2,
          prompt: md`Find the area of triangle $CPT$.`,
          answer: AR,
          scheme: [M1(md`Uses $\tfrac{1}{2} \times CP \times PT$ (angle $CPT = 90^{\circ}$) or another complete method`), A1(md`$${answerTex(AR)}$`)],
          hints: [md`Angle $CPT$ is a right angle (radius and tangent).`, md`$CP = ${rootTex(r2)}$; find $PT$ from the coordinates.`, md`Area $= \tfrac{1}{2} \times CP \times PT$`],
          solution: [md`$PT = \sqrt{(${Px})^{2} + \left(${Q.of(Py).sub(Ty).toLatex()}\right)^{2}}$; area $= \tfrac{1}{2} \times ${rootTex(r2)} \times PT = ${answerTex(AR)}$`],
        }),
      ],
      params: { a, b, p, q },
    };
  },
  verify(inst) {
    const { a, b, p, q } = inst.params as Record<string, number>;
    const Px = a + p,
      Py = b + q,
      r2 = p * p + q * q;
    expectClose((Px - a) ** 2 + (Py - b) ** 2, r2, 'P on circle');
    expectClose(evaluate((inst.parts[1].answer as ExactSpec).value) ** 2, r2, 'radius');
    const T = inst.parts[3].answer as CoordSpec;
    const ty = evaluate((T.y as ExactSpec).value);
    // T is on the tangent: PT perpendicular to CP
    expect(Math.abs((0 - Px) * p + (ty - Py) * q) < 1e-9, 'T on the tangent');
    const pt = Math.hypot(Px, Py - ty);
    expectClose(evaluate((inst.parts[4].answer as ExactSpec).value), 0.5 * Math.sqrt(r2) * pt, 'area');
  },
});

const templates: Template[] = [circleTangent];
export default templates;
