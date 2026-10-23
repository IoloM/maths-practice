/** Mechanics Year 2, Chapter 7 — long exam-style question: rough plane and pulley, the hanging particle hits the ground. */
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { G, U, pickAngle, planeDiagram } from '../shared/mech';
import { NG, angleText, cosT, lbl, sinT } from './applications';

const pulleyGround = defineTemplate({
  id: 'sm2.7.long-plane-pulley-hits-ground',
  family: 'sm2.7.exam-style',
  title: 'Exam-style: rough plane and pulley — acceleration, tension, impact, and how far the particle then slides',
  spec: ['M8.4', 'M8.6', 'M7.3'],
  chapter: 'SM2.7',
  sections: ['7.6', '7.5'],
  level: 'A2',
  paper: [3],
  difficulty: 5,
  marks: 14,
  time: 17,
  commands: ['Find'],
  tags: ['exam-style', 'connected particles', 'pulley', 'inclined plane', 'friction', 'suvat'],
  generate(r) {
    const a = pickAngle(r);
    const m1 = r.pick([1, 2, 3, 4]);
    const m2 = r.pick([2, 3, 4, 5, 6]);
    const mu = Number(r.real(0.1, 0.45, 2).toFixed(2));
    const h = r.pick([0.8, 1, 1.2, 1.5, 2, 2.5]);
    const F = mu * m1 * G * a.cos;
    const acc = (m2 * G - m1 * G * a.sin - F) / (m1 + m2);
    r.require(acc > 0.4);
    const T = m2 * (G - acc);
    const v = Math.sqrt(2 * acc * h);
    const dec = G * a.sin + mu * G * a.cos;
    const s = (v * v) / (2 * dec);
    const A = NG(acc, U.ms2),
      Tn = NG(T, U.N),
      V = NG(v, U.ms),
      D = NG(dec, U.ms2),
      S = NG(s, U.m);
    return {
      stem: md`A particle $A$ of mass $${m1}$ kg lies on ${angleText(a)}. It is attached to a light inextensible string which passes up the line of greatest slope, over a small smooth pulley at the top of the plane, to a particle $B$ of mass $${m2}$ kg hanging freely $${h}$ m above the ground. The coefficient of friction between $A$ and the plane is $${mu}$. The system is released from rest with the string taut. $A$ does not reach the pulley.`,
      diagram: {
        svg: planeDiagram({ angleDeg: a.deg, angleLabel: lbl(a), particle: 'A', forces: [{ kind: 'friction-down', label: 'F' }, { kind: 'normal', label: 'R' }, { kind: 'weight', label: `${m1}g` }], pulley: true, hanging: `B (${m2} kg)` }),
        alt: 'Particle A on a rough inclined plane attached by a string over a pulley at the top to particle B hanging vertically above the ground.',
      },
      parts: [
        part({
          label: 'a',
          marks: 6,
          prompt: 'Find the acceleration of B while it is falling.',
          answer: A,
          scheme: [
            B1(md`$R = ${m1}g${cosT(a)}$ and $F = ${mu}R$`),
            M1(md`$A$: $T - F - ${m1}g${sinT(a)} = ${m1}a$`),
            A1('Correct equation for A'),
            M1(md`$B$: $${m2}g - T = ${m2}a$`),
            dM1('Eliminates T'),
            A1(md`$a = ${answerTex(A)}$`),
          ],
          hints: ['A moves up the plane, so friction on A acts down the plane.', md`For $A$: $T - F - ${m1}g\sin\alpha = ${m1}a$. For $B$: $${m2}g - T = ${m2}a$.`, md`$F = ${mu} \times ${m1}g${cosT(a)} = ${fmtSF(F, 4)}$ N`],
          errors: [err('no-friction', NG((m2 * G - m1 * G * a.sin) / (m1 + m2)), 'Include friction on A: F = μR with R = mg cos α.', 3)],
          solution: [md`$F = ${mu} \times ${m1}g${cosT(a)} = ${fmtSF(F, 4)}$`, md`Adding the equations: $${m2}g - ${fmtSF(F, 4)} - ${m1}g${sinT(a)} = ${m1 + m2}a \Rightarrow a = ${answerTex(A)}$`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: 'Find the tension in the string while B is falling.',
          answer: Tn,
          ft: (prev) => (prev.a?.value ? NG(m2 * (G - prev.a.value), U.N) : null),
          scheme: [M1("Uses B's equation with their a"), A1(md`$T = ${answerTex(Tn)}$`)],
          hints: [md`$${m2}g - T = ${m2}a$`, 'Use your value of a.', 'Rearrange for T.'],
          solution: [md`$T = ${m2}(g - a) = ${answerTex(Tn)}$`],
        }),
        part({
          label: 'c',
          marks: 2,
          prompt: 'Find the speed of B just before it hits the ground.',
          answer: V,
          ft: (prev) => (prev.a?.value && prev.a.value > 0 ? NG(Math.sqrt(2 * prev.a.value * h), U.ms) : null),
          scheme: [M1(md`$v^{2} = 0 + 2a(${h})$`), A1(md`$v = ${answerTex(V)}$`)],
          hints: [`B starts from rest and falls ${h} m with constant acceleration.`, 'v² = u² + 2as', md`$u = 0$, $s = ${h}$`],
          solution: [md`$v^{2} = 2 \times ${fmtSF(acc, 4)} \times ${h} \Rightarrow v = ${answerTex(V)}$`],
        }),
        part({
          label: 'd',
          marks: 2,
          prompt: 'B does not rebound. Find the deceleration of A after B hits the ground, while A is still moving up the plane.',
          answer: D,
          scheme: [M1(md`String slack: $-F - ${m1}g${sinT(a)} = ${m1}a$`), A1(md`Deceleration $${answerTex(D)}$`)],
          hints: ['Once B lands, the string goes slack: no tension on A.', 'Friction and the weight component both act down the plane.', md`$${m1}a = ${m1}g${sinT(a)} + ${mu} \times ${m1}g${cosT(a)}$`],
          errors: [err('kept-tension', NG(acc), 'After B hits the ground the string is slack, so the tension is zero and A decelerates.', 0)],
          solution: [md`$${m1}a = ${m1}g${sinT(a)} + ${mu}(${m1}g${cosT(a)}) \Rightarrow a = ${answerTex(D)}$ (deceleration)`],
        }),
        part({
          label: 'e',
          marks: 2,
          prompt: 'Find the further distance A moves up the plane before coming to instantaneous rest.',
          answer: S,
          ft: (prev) => (prev.c?.value && prev.d?.value ? NG(prev.c.value ** 2 / (2 * prev.d.value), U.m) : null),
          scheme: [M1(md`$0 = v^{2} - 2(${fmtSF(dec, 3)})s$ with their $v$`), A1(md`$s = ${answerTex(S)}$`)],
          hints: ['A starts this stage with the speed B had on impact.', 'v² = u² + 2as with v = 0 and a negative.', md`$s = \dfrac{u^{2}}{2 \times ${fmtSF(dec, 3)}}$`],
          solution: [md`$0 = ${fmtSF(v, 4)}^{2} - 2(${fmtSF(dec, 4)})s \Rightarrow s = ${answerTex(S)}$`],
        }),
      ],
      params: { sin: a.sin, cos: a.cos, m1, m2, mu, h },
    };
  },
  verify(inst) {
    const { sin, cos, m1, m2, mu, h } = inst.params as Record<string, number>;
    const acc = (inst.parts[0].answer as NumericSpec).value,
      T = (inst.parts[1].answer as NumericSpec).value;
    // Newton's second law for each particle separately
    expectClose(T - mu * m1 * G * cos - m1 * G * sin, m1 * acc, 'A');
    expectClose(m2 * G - T, m2 * acc, 'B');
    // simulate the motion with small time steps
    let x = 0,
      vel = 0;
    const dt = 1e-5;
    while (x < h) {
      vel += acc * dt;
      x += vel * dt;
    }
    expect(Math.abs(vel - (inst.parts[2].answer as NumericSpec).value) < 1e-3, 'impact speed');
    const dec = (inst.parts[3].answer as NumericSpec).value;
    expectClose(m1 * dec, m1 * G * sin + mu * m1 * G * cos, 'deceleration');
    let d = 0;
    while (vel > 0) {
      vel -= dec * dt;
      d += Math.max(vel, 0) * dt;
    }
    expect(Math.abs(d - (inst.parts[4].answer as NumericSpec).value) < 1e-3, 'further distance');
  },
});

const templates: Template[] = [pulleyGround];
export default templates;
