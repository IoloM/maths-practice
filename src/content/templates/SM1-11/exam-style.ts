/** Mechanics Year 1, Chapter 11 — long exam-style question: velocity as a quadratic in t. */
import { Q } from '../../../engine/core/rational';
import { Poly } from '../../../engine/core/poly';
import { evaluate, num } from '../../../engine/core/expr';
import { expectClose, integrate } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { U } from '../shared/mech';

const exq = (q: Q | number, unit: string) => ans.exact(num(Q.from(q)), undefined, { unit, allowDecimal: true });
const valOf = (s: ExactSpec) => evaluate(s.value);

const longVelocity = defineTemplate({
  id: 'sm1.11.long-velocity-quadratic-in-t',
  family: 'sm1.11.differentiation',
  title: 'Exam-style: velocity as a quadratic in t — acceleration, greatest speed, distance and a change of direction',
  spec: ['M7.4', 'P7.3', 'P8.3'],
  chapter: 'SM1.11',
  sections: ['11.1', '11.2', '11.3'],
  level: 'AS',
  paper: [3],
  difficulty: 4,
  marks: 11,
  time: 13,
  commands: ['Find'],
  tags: ['exam-style', 'kinematics', 'variable acceleration', 'calculus'],
  generate(r) {
    const c = r.pick([1, 1, 2, 3]);
    const s = r.int(1, 4),
      T = r.int(s + 1, 8);
    const T2 = T + r.int(1, 3);
    // v = c(T − t)(t + s) = c(−t² + (T − s)t + Ts)
    const V = Poly.coeffs([c * T * s, c * (T - s), -c]);
    const A = V.diff();
    const a0 = A.evalQ(0);
    const tStar = Q.of(T - s, 2);
    const vMax = V.evalQ(tStar);
    const S = V.integ();
    const d1 = S.evalQ(T);
    const back = S.evalQ(T2).sub(S.evalQ(T)).abs();
    const total = d1.add(back);
    const vTex = V.toLatex({ v: 't' });
    const A0 = exq(a0, U.ms2),
      VM = exq(vMax, U.ms),
      D1 = exq(d1, U.m),
      DT = exq(total, U.m);
    return {
      stem: md`A particle $P$ moves along a straight line. At time $t$ seconds, $t \geqslant 0$, the velocity of $P$ is $v\ \text{m s}^{-1}$, where $v = ${vTex}$.`,
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Find the acceleration of $P$ when $t = 0$.`,
          answer: A0,
          scheme: [M1(md`$a = \dfrac{\mathrm{d}v}{\mathrm{d}t} = ${A.toLatex({ v: 't' })}$`), A1(md`$${a0.toLatex()}$ m s$^{-2}$`)],
          hints: ['Acceleration is the rate of change of velocity.', md`Differentiate $v = ${vTex}$ with respect to $t$.`, 'Substitute t = 0.'],
          errors: [err('v-not-a', exq(V.evalQ(0), U.ms2), 'That is the velocity at t = 0: differentiate to get the acceleration.')],
          solution: [md`$a = ${A.toLatex({ v: 't' })}$, so at $t = 0$, $a = ${answerTex(A0)}$`],
        }),
        part({
          label: 'b',
          marks: 3,
          prompt: md`Find the greatest velocity of $P$.`,
          answer: VM,
          scheme: [M1(md`Sets $\dfrac{\mathrm{d}v}{\mathrm{d}t} = 0$`), A1(md`$t = ${tStar.toLatex()}$`), A1(md`$v = ${vMax.toLatex()}$`)],
          hints: ['The greatest velocity is where the acceleration is zero.', md`Solve $${A.toLatex({ v: 't' })} = 0$.`, md`Substitute $t = ${tStar.toLatex()}$ into $v$.`],
          errors: [err('time-not-velocity', exq(tStar, U.ms), md`$t = ${tStar.toLatex()}$ is when it happens: find $v$ at that time.`)],
          solution: [md`$${A.toLatex({ v: 't' })} = 0 \Rightarrow t = ${tStar.toLatex()}$`, md`$v = ${answerTex(VM)}$`],
        }),
        part({
          label: 'c',
          marks: 3,
          prompt: md`Find the distance travelled by $P$ in the first $${T}$ seconds.`,
          answer: D1,
          scheme: [M1(md`Integrates: $s = ${S.toLatex({ v: 't' })}$`), dM1(md`Uses the limits $0$ and $${T}$`), A1(md`$${d1.toLatex()}$ m`)],
          hints: ['Distance from velocity: integrate.', md`$\int_{0}^{${T}} (${vTex})\,\mathrm{d}t$`, md`$v \geqslant 0$ for $0 \leqslant t \leqslant ${T}$, so this is the distance.`],
          errors: [err('differentiated', exq(A.evalQ(T).sub(A.evalQ(0)), U.m), 'Integrate the velocity to find displacement; do not differentiate.')],
          solution: [md`$\int_{0}^{${T}} (${vTex})\,\mathrm{d}t = \left[${S.toLatex({ v: 't' })}\right]_{0}^{${T}} = ${answerTex(D1)}$`],
        }),
        part({
          label: 'd',
          marks: 3,
          prompt: md`Find the total distance travelled by $P$ in the interval $0 \leqslant t \leqslant ${T2}$.`,
          answer: DT,
          scheme: [B1(md`$v = 0$ at $t = ${T}$: $P$ changes direction`), M1(md`$\left|\int_{${T}}^{${T2}} v\,\mathrm{d}t\right| = ${back.toLatex()}$`), A1(md`$${total.toLatex()}$ m`)],
          hints: [md`Does $P$ change direction? Solve $v = 0$.`, md`$P$ turns round at $t = ${T}$: find the distances before and after separately.`, md`Distance after $t = ${T}$ is $\left|\int_{${T}}^{${T2}} v\,\mathrm{d}t\right|$.`],
          errors: [err('displacement', exq(S.evalQ(T2), U.m), 'That is the displacement. P changes direction, so add the distances on each side of the turning time.', 1)],
          solution: [md`$v = 0$ when $t = ${T}$.`, md`$\int_{${T}}^{${T2}} v\,\mathrm{d}t = ${S.evalQ(T2).sub(S.evalQ(T)).toLatex()}$, so the distance after $t = ${T}$ is $${back.toLatex()}$ m.`, md`Total $= ${d1.toLatex()} + ${back.toLatex()} = ${answerTex(DT)}$`],
        }),
      ],
      params: { c, s, T, T2 },
    };
  },
  verify(inst) {
    const { c, s, T, T2 } = inst.params as Record<string, number>;
    const v = (t: number) => c * (T - t) * (t + s);
    const h = 1e-5;
    expectClose(valOf(inst.parts[0].answer as ExactSpec), (v(h) - v(-h)) / (2 * h), 'acceleration at 0', 1e-6);
    let best = -Infinity;
    for (let t = 0; t <= T; t += 1e-4) best = Math.max(best, v(t));
    expectClose(valOf(inst.parts[1].answer as ExactSpec), best, 'greatest velocity', 1e-6);
    expectClose(valOf(inst.parts[2].answer as ExactSpec), integrate((t) => Math.abs(v(t)), 0, T), 'distance to T');
    expectClose(valOf(inst.parts[3].answer as ExactSpec), integrate((t) => Math.abs(v(t)), 0, T) + integrate((t) => Math.abs(v(t)), T, T2), 'total distance');
  },
});

export default [longVelocity] satisfies Template[];
