/** Pure Year 1, Chapter 6 — circles. */
import { Q, surdSimplify } from '../../../engine/core/rational';
import { evaluate, num, neg, sym } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { CoordSpec, EquationSpec, ExactSpec, IntervalSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ans, defineTemplate, iv, md, part, err } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { plot } from '../../../engine/core/svg';
import { ex, sumTex } from '../shared/calculus';

const INF = sym('infty');
const exV = (s: ExactSpec) => evaluate(s.value);
const surd = (n: number) => {
  const [s, r] = surdSimplify(n);
  return r === 1 ? `${s}` : `${s === 1 ? '' : s}\\sqrt{${r}}`;
};
const sq = (v: string, a: number) => (a === 0 ? `${v}^{2}` : `(${v} ${a < 0 ? '+' : '-'} ${Math.abs(a)})^{2}`);
const circleEq = (a: number, b: number, r2: number | Q) => ans.eq(ex(`${sq('x', a)} + ${sq('y', b)}`), num(Q.from(r2)), ['x', 'y']);

function circleSvg(a: number, b: number, rad: number, extra: { x: number; y: number; label?: string }[] = []) {
  return plot({
    x: [Math.min(a - rad, 0) - 1.5, Math.max(a + rad, 0) + 1.5],
    y: [Math.min(b - rad, 0) - 1.5, Math.max(b + rad, 0) + 1.5],
    w: 300,
    h: 300,
    curves: [{ para: { x: (t) => a + rad * Math.cos(t), y: (t) => b + rad * Math.sin(t), t: [0, 2 * Math.PI] }, label: 'C', labelAt: 0.6 }],
    points: [{ x: a, y: b, label: 'C', dot: true, dy: 14 }, ...extra],
  });
}

const centreRadius = defineTemplate({
  id: 'p1.6.centre-and-radius',
  family: 'p1.6.equation-of-circle',
  title: 'Centre and radius by completing the square',
  spec: ['P3.2', 'P2.3'],
  chapter: 'P1.6',
  sections: ['6.2'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Find'],
  tags: ['circles', 'completing the square', 'centre', 'radius'],
  generate(r) {
    const a = r.intNZ(-6, 6),
      b = r.int(-6, 6),
      r2 = r.int(4, 60);
    const c = a * a + b * b - r2;
    const eqTex = `${sumTex([[1, 'x^{2}'], [1, 'y^{2}'], [-2 * a, 'x'], [-2 * b, 'y'], [c, '']])} = 0`;
    const C: CoordSpec = ans.coord(ans.exact(num(a)), ans.exact(num(b)));
    const R = ans.exact(ex(surd(r2)), ['exact', 'surd']);
    return {
      stem: md`The circle $C$ has equation $${eqTex}$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the coordinates of the centre of $C$.`, answer: C, scheme: [M1(md`Completes the square: $${sq('x', a)}$ and $${sq('y', b)}$`), A1(md`$${answerTex(C)}$`)], hints: ['Group the x terms and the y terms.', 'Complete the square for each.', md`$x^{2} ${-2 * a < 0 ? '-' : '+'} ${Math.abs(2 * a)}x = ${sq('x', a)} - ${a * a}$`], errors: [err('signs', ans.coord(ans.exact(num(-a)), ans.exact(num(-b))), 'The centre of (x − a)² + (y − b)² = r² is (a, b) — check the signs.', 1)], solution: [md`$${sq('x', a)} + ${sq('y', b)} = ${r2}$, so the centre is $${answerTex(C)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the radius of $C$, in simplest surd form where appropriate.`, answer: R, scheme: [M1(md`$r^{2} = ${a * a} + ${b * b} - (${c})$`), A1(md`$r = ${answerTex(R)}$`)], hints: ['After completing the square, move the constants to the right-hand side.', md`$r^{2} = ${r2}$`, 'Take the square root and simplify the surd.'], errors: [err('r-squared', ans.exact(num(r2)), 'That is r². Take the square root.', 1)], solution: [md`$r^{2} = ${r2} \Rightarrow r = ${answerTex(R)}$`] }),
      ],
      params: { a, b, c },
    };
  },
  verify(inst) {
    const { a, b, c } = inst.params as Record<string, number>;
    const C = inst.parts[0].answer as CoordSpec;
    const cx = exV(C.x as ExactSpec),
      cy = exV(C.y as ExactSpec),
      rr = exV(inst.parts[1].answer as ExactSpec);
    for (const t of [0.3, 1.9, 4]) {
      const x = cx + rr * Math.cos(t),
        y = cy + rr * Math.sin(t);
      expectClose(x * x + y * y - 2 * a * x - 2 * b * y + c, 0, 'point on circle', 1e-9);
    }
  },
});

const diameter = defineTemplate({
  id: 'p1.6.circle-from-diameter',
  family: 'p1.6.equation-of-circle',
  title: 'Equation of a circle from the ends of a diameter',
  spec: ['P3.2', 'P3.1'],
  chapter: 'P1.6',
  sections: ['6.1', '6.2'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Find'],
  tags: ['circles', 'midpoint', 'diameter'],
  generate(r) {
    const a = r.int(-5, 5),
      b = r.int(-5, 5);
    const dx = r.intNZ(-6, 6),
      dy = r.int(-6, 6);
    const A = [a - dx, b - dy],
      B = [a + dx, b + dy];
    const r2 = dx * dx + dy * dy;
    const E = circleEq(a, b, r2);
    return {
      stem: md`The points $A(${A[0]}, ${A[1]})$ and $B(${B[0]}, ${B[1]})$ are the ends of a diameter of the circle $C$.`,
      diagram: { svg: circleSvg(a, b, Math.sqrt(r2), [{ x: A[0], y: A[1], label: 'A' }, { x: B[0], y: B[1], label: 'B' }]), alt: 'Circle C with diameter AB.' },
      parts: [part({ marks: 4, prompt: md`Find an equation for $C$.`, answer: E, scheme: [M1('Midpoint of AB for the centre'), A1(md`Centre $(${a}, ${b})$`), M1('Radius from half of AB (or centre to A)'), A1(md`$${answerTex(E)}$`)], hints: ['The centre is the midpoint of the diameter.', 'The radius is the distance from the centre to A.', md`Centre $(${a}, ${b})$; $r^{2} = (${A[0]} - ${a})^{2} + (${A[1]} - ${b})^{2}$`], solution: [md`Centre $(${a}, ${b})$, $r^{2} = ${dx * dx} + ${dy * dy} = ${r2}$`, md`$${answerTex(E)}$`] })],
      params: { A, B },
    };
  },
  verify(inst) {
    const { A, B } = inst.params as { A: number[]; B: number[] };
    const e = inst.parts[0].answer as EquationSpec;
    for (const P of [A, B]) expectClose(evaluate(e.lhs, { x: P[0], y: P[1] }), evaluate(e.rhs), 'end on circle', 1e-9);
  },
});

const tangent = defineTemplate({
  id: 'p1.6.tangent-to-circle',
  family: 'p1.6.tangents',
  title: 'Equation of the tangent to a circle at a point',
  spec: ['P3.2', 'P3.1'],
  chapter: 'P1.6',
  sections: ['6.4'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find'],
  tags: ['circles', 'tangent', 'perpendicular'],
  generate(r) {
    const a = r.int(-4, 4),
      b = r.int(-4, 4);
    const [dx, dy] = r.pick([
      [3, 4],
      [4, 3],
      [5, 12],
      [12, 5],
      [1, 2],
      [2, 1],
      [2, 3],
      [3, 1],
      [1, 3],
    ]).map((v) => v * r.sign());
    const px = a + dx,
      py = b + dy;
    const r2 = dx * dx + dy * dy;
    // tangent: dx(x − px) + dy(y − py) = 0
    let A = dx,
      B = dy,
      C = -(dx * px + dy * py);
    if (A < 0) [A, B, C] = [-A, -B, -C];
    const E = ans.eq(ex(sumTex([[A, 'x'], [B, 'y'], [C, '']])), num(0), ['x', 'y'], ['ax+by+c=0']);
    return {
      stem: md`The circle $C$ has equation $${sq('x', a)} + ${sq('y', b)} = ${r2}$. The point $P(${px}, ${py})$ lies on $C$.`,
      diagram: { svg: circleSvg(a, b, Math.sqrt(r2), [{ x: px, y: py, label: 'P' }]), alt: 'Circle C with the point P on its circumference.' },
      parts: [part({ marks: 5, prompt: md`Find an equation of the tangent to $C$ at $P$, giving your answer in the form $ax + by + c = 0$ with integer $a$, $b$, $c$.`, answer: E, scheme: [B1(md`Centre $(${a}, ${b})$`), M1('Gradient of radius'), M1('Perpendicular gradient −1/m'), dM1(md`$y - ${py} = m(x - ${px})$`), A1(md`$${answerTex(E)}$`)], hints: ['The tangent is perpendicular to the radius at P.', md`Gradient of the radius from $(${a}, ${b})$ to $P$: $\frac{${dy}}{${dx}}$.`, 'Take the negative reciprocal, then use y − y₁ = m(x − x₁).'], errors: [err('radius-line', ans.eq(ex(sumTex([[dy, 'x'], [-dx, 'y'], [-(dy * px - dx * py), '']])), num(0), ['x', 'y']), 'That is the line along the radius. The tangent is perpendicular to it.', 2)], solution: [md`Gradient of radius $= \frac{${dy}}{${dx}}$, so gradient of tangent $= ${Q.of(-dx, dy).toLatex()}$`, md`$y - (${py}) = ${Q.of(-dx, dy).toLatex()}(x - (${px}))$`, md`$${answerTex(E)}$`] })],
      params: { a, b, px, py },
    };
  },
  verify(inst) {
    const { a, b, px, py } = inst.params as Record<string, number>;
    const e = inst.parts[0].answer as EquationSpec;
    expectClose(evaluate(e.lhs, { x: px, y: py }), 0, 'through P', 1e-9);
    // direction of tangent line is perpendicular to radius
    const A = evaluate(e.lhs, { x: 1, y: 0 }) - evaluate(e.lhs, { x: 0, y: 0 });
    const B = evaluate(e.lhs, { x: 0, y: 1 }) - evaluate(e.lhs, { x: 0, y: 0 });
    // normal (A, B) parallel to radius (px − a, py − b)
    expectClose(A * (py - b) - B * (px - a), 0, 'normal parallel to radius', 1e-9);
  },
});

const lineMeets = defineTemplate({
  id: 'p1.6.line-meets-circle-range',
  family: 'p1.6.intersections',
  title: 'Values of k for which a line meets a circle',
  spec: ['P3.2', 'P2.5'],
  chapter: 'P1.6',
  sections: ['6.3'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 5,
  marks: 6,
  time: 9,
  commands: ['Show that', 'Find'],
  tags: ['circles', 'discriminant', 'inequalities', 'synoptic'],
  generate(r) {
    // circle x² + y² = R, line y = mx + k; substitute: (1 + m²)x² + 2mkx + k² − R = 0; disc > 0 ⇔ k² < R(1 + m²)
    const m = r.pick([1, 2, 3, -1, -2]);
    const R = r.pick([4, 5, 8, 9, 10, 16, 20]);
    const bound2 = R * (1 + m * m);
    const [s, rr] = surdSimplify(bound2);
    const bTex = rr === 1 ? `${s}` : `${s === 1 ? '' : s}\\sqrt{${rr}}`;
    const two = r.bool();
    const bound = ex(bTex);
    const set = two ? [iv(neg(bound), bound, false, false)] : [iv(neg(INF), neg(bound), false, false), iv(bound, INF, false, false)];
    const I: IntervalSpec = ans.interval(set, 'k');
    return {
      stem: md`The circle $C$ has equation $x^{2} + y^{2} = ${R}$. The line $l$ has equation $y = ${m === 1 ? '' : m === -1 ? '-' : m}x + k$, where $k$ is a constant.`,
      parts: [part({ marks: 6, prompt: md`Find the set of values of $k$ for which $l$ ${two ? 'meets $C$ at two distinct points' : 'does not meet $C$'}.`, answer: I, scheme: [M1('Substitutes the line into the circle'), A1(md`$${1 + m * m}x^{2} ${2 * m < 0 ? '-' : '+'} ${Math.abs(2 * m)}kx + k^{2} - ${R} = 0$`), M1(md`Uses discriminant ${two ? '> 0' : '< 0'}`), A1(md`$k^{2} ${two ? '<' : '>'} ${bound2}$`), dM1('Solves the quadratic inequality in k'), A1(md`$${answerTex(I)}$`)], hints: ['Substitute y = mx + k into the circle to get a quadratic in x.', two ? 'Two distinct points means b² − 4ac > 0.' : 'No intersection means b² − 4ac < 0.', md`It simplifies to $k^{2} ${two ? '<' : '>'} ${bound2}$.`], solution: [md`$x^{2} + (${m === 1 ? '' : m === -1 ? '-' : m}x + k)^{2} = ${R} \Rightarrow ${1 + m * m}x^{2} + ${2 * m}kx + k^{2} - ${R} = 0$`, md`$b^{2} - 4ac = ${4 * m * m}k^{2} - ${4 * (1 + m * m)}(k^{2} - ${R}) ${two ? '>' : '<'} 0 \Rightarrow k^{2} ${two ? '<' : '>'} ${bound2}$`, md`$${answerTex(I)}$`] })],
      params: { m, R, two },
    };
  },
  verify(inst) {
    const { m, R, two } = inst.params as { m: number; R: number; two: boolean };
    const I = inst.parts[0].answer as IntervalSpec;
    const inSet = (k: number) => I.set.some((s) => k > evaluate(s.lo) && k < evaluate(s.hi));
    for (let k = -20; k <= 20; k += 0.31) {
      const disc = (2 * m * k) ** 2 - 4 * (1 + m * m) * (k * k - R);
      if (Math.abs(disc) < 1e-6) continue;
      expect(inSet(k) === (two ? disc > 0 : disc < 0), `k = ${k}`);
    }
  },
});

const chordBisector = defineTemplate({
  id: 'p1.6.centre-from-chord',
  family: 'p1.6.chords',
  title: 'Centre from a chord’s perpendicular bisector',
  spec: ['P3.2', 'P3.1'],
  chapter: 'P1.6',
  sections: ['6.1', '6.4'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 6,
  time: 8,
  commands: ['Find'],
  tags: ['circles', 'perpendicular bisector', 'chord'],
  generate(r) {
    // centre (a, b) lies on y = x + d; chord AB with A, B on circle
    const a = r.int(-4, 4),
      d = r.int(-3, 3),
      b = a + d;
    const [u, v] = r.pick([
      [3, 4],
      [4, 3],
      [5, 0],
      [0, 5],
      [1, 7],
      [7, 1],
      [5, 5],
    ]);
    const A = [a + u, b + v],
      B = [a - v, b + u]; // both at distance √(u² + v²)
    r.require(!(A[0] === B[0] && A[1] === B[1]));
    const C: CoordSpec = ans.coord(ans.exact(num(a)), ans.exact(num(b)));
    const E = circleEq(a, b, u * u + v * v);
    return {
      stem: md`The points $A(${A[0]}, ${A[1]})$ and $B(${B[0]}, ${B[1]})$ lie on the circle $C$. The centre of $C$ lies on the line $y = x ${d < 0 ? '-' : '+'} ${Math.abs(d)}$.`.replace('+ 0$', '$'),
      parts: [
        part({ label: 'a', marks: 4, prompt: md`Find the coordinates of the centre of $C$.`, answer: C, scheme: [M1('Midpoint of AB'), M1('Perpendicular bisector of AB'), dM1('Solves with the given line'), A1(md`$${answerTex(C)}$`)], hints: ['The perpendicular bisector of a chord passes through the centre.', 'Find the midpoint of AB and the perpendicular gradient.', 'Solve simultaneously with the given line.'], solution: [md`Midpoint of $AB$: $\left(${Q.of(A[0] + B[0], 2).toLatex()}, ${Q.of(A[1] + B[1], 2).toLatex()}\right)$; the perpendicular bisector meets $y = x + ${d}$ at $${answerTex(C)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find an equation for $C$.`, answer: E, scheme: [M1('Radius from centre to A'), A1(md`$${answerTex(E)}$`)], hints: ['Radius = distance from the centre to A.', md`$r^{2} = (${A[0]} - ${a})^{2} + (${A[1]} - ${b})^{2}$`, 'Write (x − a)² + (y − b)² = r².'], solution: [md`$r^{2} = ${u * u + v * v}$, so $${answerTex(E)}$`] }),
      ],
      params: { A, B, d },
    };
  },
  verify(inst) {
    const { A, B, d } = inst.params as { A: number[]; B: number[]; d: number };
    const C = inst.parts[0].answer as CoordSpec;
    const a = exV(C.x as ExactSpec),
      b = exV(C.y as ExactSpec);
    expectClose(Math.hypot(A[0] - a, A[1] - b), Math.hypot(B[0] - a, B[1] - b), 'equidistant');
    expectClose(b, a + d, 'on line');
  },
});

void B1;

const templates: Template[] = [centreRadius, diameter, tangent, lineMeets, chordBisector];
export default templates;
