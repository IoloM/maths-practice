/** Pure Year 1, Chapter 6 — more lines and circles: where a line cuts a circle, and keeping a circle off an axis. */
import { Q, gcd, surdSimplify } from '../../../engine/core/rational';
import { evaluate, neg, num, sym } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import { contains, toNumSet } from '../../../engine/marking/intervals';
import type { CoordSpec, ExactSpec, IntervalSpec } from '../../../engine/marking/types';
import { A1, M1, ans, defineTemplate, dM1, err, iv, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';

const INF = sym('infty');
const exq = (q: Q | number) => num(Q.from(q));
const circleTex = (a: number, b: number, F: string) => `${sumTex([[1, 'x^{2}'], [1, 'y^{2}'], [-2 * a, 'x'], [-2 * b, 'y']])} + ${F} = 0`;
const rootTex = (n: number) => {
  const [s, rr] = surdSimplify(n);
  return rr === 1 ? `${s}` : `${s === 1 ? '' : s}\\sqrt{${rr}}`;
};

/** Lattice points at the same distance from the centre, grouped by r². */
const RINGS: Record<number, [number, number][]> = {
  5: [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]],
  10: [[1, 3], [3, 1], [-1, 3], [-3, 1], [1, -3], [3, -1], [-1, -3], [-3, -1]],
  13: [[2, 3], [3, 2], [-2, 3], [-3, 2], [2, -3], [3, -2], [-2, -3], [-3, -2]],
  25: [[3, 4], [4, 3], [0, 5], [5, 0], [-3, 4], [-4, 3], [3, -4], [4, -3], [-3, -4], [-4, -3], [0, -5], [-5, 0]],
};

const lineCutsCircle = defineTemplate({
  id: 'p1.6.line-cuts-circle-points-and-chord',
  family: 'p1.6.intersections',
  title: 'Where a line cuts a circle, and the length of the chord',
  spec: ['P3.2', 'P2.4'],
  chapter: 'P1.6',
  sections: ['6.3', '6.4'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 7,
  time: 8,
  commands: ['Find'],
  tags: ['circles', 'simultaneous equations', 'chords'],
  generate(r) {
    const a = r.int(-4, 4),
      b = r.int(-4, 4);
    const r2 = r.pick([5, 10, 13, 25]);
    const [o1, o2] = r.sample(RINGS[r2], 2);
    let A: [number, number] = [a + o1[0], b + o1[1]],
      B: [number, number] = [a + o2[0], b + o2[1]];
    r.require(A[0] !== B[0]);
    if (A[0] > B[0]) [A, B] = [B, A];
    // line through A and B: (yB − yA)x − (xB − xA)y = (yB − yA)xA − (xB − xA)yA, divided by the common factor
    let p = B[1] - A[1],
      q = -(B[0] - A[0]),
      k = p * A[0] + q * A[1];
    const g = gcd(gcd(Math.abs(p), Math.abs(q)), Math.abs(k)) || 1;
    [p, q, k] = [p / g, q / g, k / g];
    if (q > 0) [p, q, k] = [-p, -q, -k];
    // write as y = …x + … when that has integer coefficients, otherwise px + qy = k
    const slopeInt = Number.isInteger(p / q) && Number.isInteger(k / q);
    const lineTex = slopeInt ? `y = ${sumTex([[-p / q, 'x'], [k / q, '']])}` : `${sumTex([[p, 'x'], [q, 'y']])} = ${k}`;
    const F0 = a * a + b * b - r2;
    const cTex = `${sumTex([[1, 'x^{2}'], [1, 'y^{2}'], [-2 * a, 'x'], [-2 * b, 'y'], [F0, '']])} = 0`;
    const PA: CoordSpec = ans.coord(ans.exact(exq(A[0])), ans.exact(exq(A[1])));
    const PB: CoordSpec = ans.coord(ans.exact(exq(B[0])), ans.exact(exq(B[1])));
    const ab2 = (B[0] - A[0]) ** 2 + (B[1] - A[1]) ** 2;
    const AB: ExactSpec = ans.exact(ex(rootTex(ab2)), ['exact']);
    // the quadratic in x after substituting y = (k − px)/q
    const qa = Q.ONE.add(Q.of(p * p, q * q)),
      qb = Q.of(-2 * a).add(Q.of(-2 * k * p, q * q)).add(Q.of(2 * b * p, q)),
      qc = Q.of(F0).add(Q.of(k * k, q * q)).add(Q.of(-2 * b * k, q));
    const scale = qa.d * qb.d * qc.d;
    const [A2, B2, C2] = [qa, qb, qc].map((z) => z.mul(scale));
    const gq = gcd(gcd(Math.abs(A2.n), Math.abs(B2.n)), Math.abs(C2.n)) || 1;
    const quadTex = `${sumTex([[A2.div(gq), 'x^{2}'], [B2.div(gq), 'x'], [C2.div(gq), '']])} = 0`;
    return {
      stem: md`The circle $C$ has equation $${cTex}$. The line $l$ has equation $${lineTex}$. The line $l$ cuts $C$ at the points $A$ and $B$, where the $x$-coordinate of $A$ is less than the $x$-coordinate of $B$.`,
      parts: [
        part({
          label: 'a',
          marks: 4,
          prompt: md`Find the coordinates of $A$.`,
          answer: PA,
          scheme: [M1(md`Substitutes the line into the circle to get a quadratic in one variable`), A1(md`$${quadTex}$`), dM1('Solves the quadratic'), A1(md`$A${answerTex(PA)}$`)],
          hints: ['Make y the subject of the line, then substitute into the circle.', md`You should get $${quadTex}$.`, md`Solve for $x$, then use the line to find $y$.`],
          errors: [err('swapped', PB, 'That is the point with the larger x-coordinate: that is B.', 3)],
          solution: [md`Substituting: $${quadTex}$, so $x = ${A[0]}$ or $x = ${B[0]}$`, md`$A${answerTex(PA)}$`],
        }),
        part({
          label: 'b',
          marks: 1,
          prompt: md`Find the coordinates of $B$.`,
          answer: PB,
          scheme: [A1(md`$B${answerTex(PB)}$`)],
          hints: ['Use the other root of your quadratic.', md`$x = ${B[0]}$`, 'Substitute into the line for y.'],
          solution: [md`$B${answerTex(PB)}$`],
        }),
        part({
          label: 'c',
          marks: 2,
          prompt: md`Find the exact length of $AB$, giving your answer as a simplified surd.`,
          answer: AB,
          scheme: [M1(md`$\sqrt{(${B[0]} - ${A[0]})^{2} + (${B[1]} - ${A[1]})^{2}}$`.replace(/- -/g, '+ ')), A1(md`$${answerTex(AB)}$`)],
          hints: ['Use Pythagoras on the differences in coordinates.', md`$AB^{2} = ${(B[0] - A[0]) ** 2} + ${(B[1] - A[1]) ** 2}$`, 'Simplify the surd.'],
          errors: [err('squared', ans.exact(exq(ab2)), 'That is AB²: take the square root.', 1)],
          solution: [md`$AB = \sqrt{${(B[0] - A[0]) ** 2} + ${(B[1] - A[1]) ** 2}} = ${answerTex(AB)}$`],
        }),
      ],
      params: { a, b, r2, p, q, k },
    };
  },
  verify(inst) {
    const { a, b, r2, p, q, k } = inst.params as Record<string, number>;
    const v = (s: ExactSpec) => evaluate(s.value);
    const pts = [inst.parts[0].answer, inst.parts[1].answer].map((c) => [v((c as CoordSpec).x as ExactSpec), v((c as CoordSpec).y as ExactSpec)]);
    for (const [x, y] of pts) {
      expectClose((x - a) ** 2 + (y - b) ** 2, r2, 'on the circle');
      expectClose(p * x + q * y, k, 'on the line', 1e-9);
    }
    expect(pts[0][0] < pts[1][0], 'A has the smaller x');
    expectClose(v(inst.parts[2].answer as ExactSpec), Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]), 'chord length');
  },
});

type Where = 'x-axis' | 'quadrant' | 'meets-y';

const offAxis = defineTemplate({
  id: 'p1.6.circle-range-of-constant',
  family: 'p1.6.intersections',
  title: 'Range of the constant term so a circle misses an axis or sits in one quadrant',
  spec: ['P3.2', 'P2.5'],
  chapter: 'P1.6',
  sections: ['6.2', '6.3'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 5,
  time: 6,
  commands: ['Find'],
  tags: ['circles', 'inequalities', 'radius'],
  generate(r) {
    const a = r.intNZ(-6, 6),
      b = r.intNZ(-6, 6);
    r.require(Math.abs(a) !== Math.abs(b));
    const where = r.pick(['x-axis', 'quadrant', 'meets-y'] as const) as Where;
    const lo = where === 'x-axis' ? a * a : where === 'quadrant' ? Math.max(a * a, b * b) : null;
    const hi = a * a + b * b;
    const set = where === 'meets-y' ? [iv(neg(INF), exq(b * b), false, true)] : [iv(exq(lo!), exq(hi), false, false)];
    const K: IntervalSpec = ans.interval(set, 'k');
    const C: CoordSpec = ans.coord(ans.exact(exq(a)), ans.exact(exq(b)));
    const quadrant = a > 0 ? (b > 0 ? 'first' : 'fourth') : b > 0 ? 'second' : 'third';
    const cond = where === 'x-axis' ? 'does not cut or touch the $x$-axis' : where === 'quadrant' ? `lies entirely in the ${quadrant} quadrant` : 'cuts or touches the $y$-axis';
    const cTex = circleTex(a, b, 'k');
    const rq = `${a * a + b * b} - k`;
    const reasons =
      where === 'x-axis'
        ? [md`$r^{2} = ${rq} > 0$`, md`$r < |${b}|$: $${rq} < ${b * b}$`]
        : where === 'quadrant'
          ? [md`$r^{2} = ${rq} > 0$`, md`$r < ${Math.min(Math.abs(a), Math.abs(b))}$ (the nearer axis): $${rq} < ${Math.min(a * a, b * b)}$`]
          : [md`$r^{2} = ${rq} > 0$ (true for these $k$)`, md`$r \geqslant |${a}|$: $${rq} \geqslant ${a * a}$`];
    return {
      stem: md`The circle $C$ has equation $${cTex}$, where $k$ is a constant.`,
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Find the coordinates of the centre of $C$.`,
          answer: C,
          scheme: [M1('Completes the square in x and y'), A1(md`$${answerTex(C)}$`)],
          hints: ['Complete the square in x and in y.', md`$(x ${a > 0 ? '-' : '+'} ${Math.abs(a)})^{2} + (y ${b > 0 ? '-' : '+'} ${Math.abs(b)})^{2} = ${rq}$`, 'Read off the centre.'],
          errors: [err('sign', ans.coord(ans.exact(exq(-a)), ans.exact(exq(-b))), 'Watch the signs: (x − a)² has centre x = a.', 1)],
          solution: [md`$(x ${a > 0 ? '-' : '+'} ${Math.abs(a)})^{2} + (y ${b > 0 ? '-' : '+'} ${Math.abs(b)})^{2} = ${rq}$, centre $${answerTex(C)}$`],
        }),
        part({
          label: 'b',
          marks: 3,
          prompt: md`Given that $C$ ${cond}, find the range of possible values of $k$.`,
          answer: K,
          scheme: [M1(reasons[0]), M1(reasons[1]), A1(md`$${answerTex(K)}$`)],
          hints: [md`The radius is $\sqrt{${rq}}$, and it must be real.`, where === 'x-axis' ? md`To miss the $x$-axis, the radius must be less than the distance from the centre to it, $|${b}|$.` : where === 'quadrant' ? 'To stay in one quadrant, the radius must be less than the distance to both axes.' : md`To reach the $y$-axis, the radius must be at least the distance from the centre to it, $|${a}|$.`, 'Solve each inequality for k and combine.'],
          errors: where === 'meets-y' ? [] : [err('one-condition', ans.interval([iv(exq(lo!), INF, false, false)], 'k'), 'The radius must also be real: r² > 0 gives an upper limit on k.', 2)],
          solution: [reasons[0], reasons[1], md`$${answerTex(K)}$`],
        }),
      ],
      params: { a, b, where },
    };
  },
  verify(inst) {
    const { a, b, where } = inst.params as { a: number; b: number; where: Where };
    const S = toNumSet((inst.parts[1].answer as IntervalSpec).set);
    // try many k: draw the circle point by point and test the condition directly
    for (let k = -80; k <= 80; k += 0.53) {
      if (Math.abs(k - a * a) < 0.3 || Math.abs(k - b * b) < 0.3 || Math.abs(k - (a * a + b * b)) < 0.3) continue;
      const r2 = a * a + b * b - k;
      let ok = false;
      if (r2 > 0) {
        const rr = Math.sqrt(r2);
        let crossesX = false,
          crossesY = false;
        for (let t = 0; t < 2 * Math.PI; t += 0.01) {
          const x = a + rr * Math.cos(t),
            y = b + rr * Math.sin(t);
          if (Math.sign(y) !== Math.sign(b)) crossesX = true;
          if (Math.sign(x) !== Math.sign(a)) crossesY = true;
        }
        ok = where === 'x-axis' ? !crossesX : where === 'quadrant' ? !crossesX && !crossesY : crossesY;
      }
      expect(contains(S, k) === ok, `k = ${k}`);
    }
  },
});

export default [lineCutsCircle, offAxis] satisfies Template[];
