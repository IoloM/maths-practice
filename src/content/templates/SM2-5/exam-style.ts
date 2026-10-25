/** Mechanics Year 2, Chapter 5 — long exam-style questions: friction with connected particles, and a particle projected up a rough slope. */
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { NumericSpec } from '../../../engine/marking/types';
import { A1, ACC_G, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { G, U, pickAngle, planeDiagram, tableDiagram } from '../shared/mech';

const NG = (v: number, unit?: string) => ans.num(v, ACC_G, unit ? { unit } : {});
const g3 = (v: number) => fmtSF(v, 3);

const roughTable = defineTemplate({
  id: 'sm2.5.long-rough-table-and-hanging-particle',
  family: 'sm2.5.exam-style',
  title: 'Exam-style: a particle on a rough table pulled by a hanging particle',
  spec: ['M8.4', 'M8.6', 'M7.3'],
  chapter: 'SM2.5',
  sections: ['5.3'],
  level: 'A2',
  paper: [3],
  difficulty: 4,
  marks: 13,
  time: 16,
  commands: ['Find', 'State'],
  tags: ['exam-style', 'pulleys', 'friction', 'connected particles', 'suvat', 'multi-stage'],
  generate(r) {
    const m1 = r.pick([2, 2.5, 3, 4, 5]);
    const m2 = r.pick([1, 1.5, 2, 2.5, 3]);
    const mu = r.pick([0.1, 0.2, 0.25, 0.3]);
    const h = r.pick([0.5, 0.6, 0.8, 1, 1.2]);
    const L = r.pick([1.5, 2, 2.5, 3]);
    // it must move, and A must stop before reaching the pulley
    r.require(m2 > mu * m1 + 0.4);
    const a = ((m2 - mu * m1) * G) / (m1 + m2);
    const T = m2 * (G - a);
    const v = Math.sqrt(2 * a * h);
    const d = (v * v) / (2 * mu * G);
    r.require(h + d < L - 0.05);
    const A = NG(a, U.ms2),
      TT = NG(T, U.N),
      V = NG(v, U.ms),
      D = NG(d, U.m);
    return {
      stem: md`A particle $A$ of mass $${fmtNum(m1)}$ kg rests on a rough horizontal table. It is attached to one end of a light inextensible string, which passes over a small smooth pulley fixed at the edge of the table. The other end of the string is attached to a particle $B$ of mass $${fmtNum(m2)}$ kg, which hangs freely, $${fmtNum(h)}$ m above the floor. $A$ is $${fmtNum(L)}$ m from the pulley. The coefficient of friction between $A$ and the table is $${fmtNum(mu)}$. The system is released from rest with the string taut.`,
      diagram: { svg: tableDiagram(`A (${fmtNum(m1)} kg)`, `B (${fmtNum(m2)} kg)`), alt: 'Particle A on a horizontal table, joined by a string over a pulley at the edge to particle B hanging below.' },
      parts: [
        part({
          label: 'a',
          marks: 5,
          prompt: 'Find the acceleration of B.',
          answer: A,
          scheme: [
            B1(md`$F = ${fmtNum(mu)} \times ${fmtNum(m1)}g$`),
            M1(md`For $A$: $T - F = ${fmtNum(m1)}a$`),
            M1(md`For $B$: $${fmtNum(m2)}g - T = ${fmtNum(m2)}a$`),
            dM1('Eliminates T and solves for a'),
            A1(md`$a = ${answerTex(A)}$`),
          ],
          hints: [md`$A$ is on the table, so $R = ${fmtNum(m1)}g$ and the friction on it is $\mu R$.`, md`Write $F = ma$ for each particle: $A$ horizontally, $B$ vertically. Both have the same acceleration and the same tension.`, 'Add the two equations: T cancels.'],
          errors: [err('no-friction', NG((m2 * G) / (m1 + m2), U.ms2), 'That leaves out the friction on A.', 2)],
          solution: [md`$R = ${fmtNum(m1)}g$, so $F = ${fmtNum(mu)}(${fmtNum(m1)})(9.8) = ${g3(mu * m1 * G)}$ N`, md`$A$: $T - ${g3(mu * m1 * G)} = ${fmtNum(m1)}a$; $B$: $${fmtNum(m2)}(9.8) - T = ${fmtNum(m2)}a$`, md`Adding: $${g3(m2 * G - mu * m1 * G)} = ${fmtNum(m1 + m2)}a \Rightarrow a = ${answerTex(A)}$`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: 'Find the tension in the string while both particles are moving.',
          answer: TT,
          ft: (prev) => (prev.a?.value && prev.a.value > 0 && prev.a.value < G ? NG(m2 * (G - prev.a.value), U.N) : null),
          scheme: [M1('Substitutes their a into an equation of motion'), A1(md`$T = ${answerTex(TT)}$`)],
          hints: ['Use either equation from (a).', md`$B$: $${fmtNum(m2)}g - T = ${fmtNum(m2)}a$`, 'Put in your acceleration.'],
          solution: [md`$T = ${fmtNum(m2)}(9.8 - ${g3(a)}) = ${answerTex(TT)}$`],
        }),
        part({
          label: 'c',
          marks: 2,
          prompt: 'Find the speed of B just before it hits the floor.',
          answer: V,
          ft: (prev) => (prev.a?.value && prev.a.value > 0 ? NG(Math.sqrt(2 * prev.a.value * h), U.ms) : null),
          scheme: [M1(md`$v^{2} = 0 + 2a(${fmtNum(h)})$`), A1(md`$v = ${answerTex(V)}$`)],
          hints: ['Constant acceleration from rest.', 'v² = u² + 2as', md`$s = ${fmtNum(h)}$ m`],
          solution: [md`$v^{2} = 2 \times ${g3(a)} \times ${fmtNum(h)} \Rightarrow v = ${answerTex(V)}$`],
        }),
        part({
          label: 'd',
          marks: 3,
          prompt: 'B does not rebound. Find how much further A moves before it comes to rest.',
          answer: D,
          ft: (prev) => (prev.c?.value && prev.c.value > 0 ? NG((prev.c.value * prev.c.value) / (2 * mu * G), U.m) : null),
          scheme: [M1(md`The string is slack: deceleration of $A$ is $\mu g = ${g3(mu * G)}$`), M1(md`$0 = v^{2} - 2(${g3(mu * G)})s$`), A1(md`$s = ${answerTex(D)}$`)],
          hints: ['Once B lands, the string goes slack: only friction acts on A horizontally.', md`Deceleration $= \dfrac{F}{m} = \mu g$`, 'Use v² = u² + 2as with v = 0.'],
          errors: [err('same-a', NG((v * v) / (2 * a), U.m), 'After B lands the tension is gone: A slows down because of friction alone, deceleration μg.', 1)],
          solution: [md`Now only friction acts: deceleration $= ${fmtNum(mu)}(9.8) = ${g3(mu * G)}$ m s$^{-2}$`, md`$0 = ${g3(v)}^{2} - 2(${g3(mu * G)})s \Rightarrow s = ${answerTex(D)}$`],
        }),
        part({
          label: 'e',
          marks: 1,
          prompt: 'State how you used the fact that the string is inextensible.',
          answer: ans.self('The accelerations of A and B have the same magnitude (and so they move the same distances).'),
          scheme: [B1('A and B have the same acceleration (magnitude)')],
          hints: ['What would happen if the string could stretch?', 'Compare how A and B move.', 'They always move the same distance in the same time.'],
          solution: ['Because the string does not stretch, A and B have the same magnitude of acceleration (and speed).'],
        }),
      ],
      params: { m1, m2, mu, h, L },
    };
  },
  verify(inst) {
    const { m1, m2, mu, h } = inst.params as Record<string, number>;
    // energy: loss of B's potential energy = work against friction + gain of kinetic energy
    const v2 = (2 * (m2 * G * h - mu * m1 * G * h)) / (m1 + m2);
    expect(v2 > 0, 'moves');
    expectClose((inst.parts[2].answer as NumericSpec).value, Math.sqrt(v2), 'speed by energy', 1e-9);
    // A's kinetic energy is lost to friction afterwards
    expectClose((inst.parts[3].answer as NumericSpec).value, (0.5 * m1 * v2) / (mu * m1 * G), 'further distance by energy', 1e-9);
    const a = (inst.parts[0].answer as NumericSpec).value;
    expectClose((inst.parts[1].answer as NumericSpec).value - mu * m1 * G, m1 * a, 'A: T − F = m₁a', 1e-9);
  },
});

const upAndBack = defineTemplate({
  id: 'sm2.5.long-projected-up-a-rough-slope',
  family: 'sm2.5.exam-style',
  title: 'Exam-style: a particle projected up a rough slope slides back down',
  spec: ['M8.6', 'M8.2', 'M7.3'],
  chapter: 'SM2.5',
  sections: ['5.2', '5.3'],
  level: 'A2',
  paper: [3],
  difficulty: 4,
  marks: 13,
  time: 16,
  commands: ['Find', 'Show that', 'Explain'],
  tags: ['exam-style', 'friction', 'inclined plane', 'resolving', 'suvat', 'multi-stage'],
  generate(r) {
    const al = pickAngle(r);
    const m = r.pick([0.5, 1.5, 2, 3, 4]);
    const mu = r.pick([0.1, 0.15, 0.2, 0.25, 0.3]);
    const u = r.pick([4, 5, 6, 7, 8, 10]);
    // it must slide back down: the weight component beats the greatest friction
    r.require(al.tan > mu + 0.15 && al.deg < 50);
    const R = m * G * al.cos;
    const up = G * (al.sin + mu * al.cos);
    const s = (u * u) / (2 * up);
    const down = G * (al.sin - mu * al.cos);
    const w = Math.sqrt(2 * down * s);
    const RR = NG(R, U.N),
      UP = NG(up, U.ms2),
      S = NG(s, U.m),
      W = NG(w, U.ms);
    const sinT = al.exact ? md`\left(${al.sinTex}\right)` : al.sinTex;
    const cosT = al.exact ? md`\left(${al.cosTex}\right)` : al.cosTex;
    return {
      stem: md`A particle $P$ of mass $${fmtNum(m)}$ kg is projected with speed $${u}$ m s$^{-1}$ up a line of greatest slope of a rough plane inclined at $${al.tex}$ to the horizontal${al.given ? `, where ${al.given}` : ''}. The coefficient of friction between $P$ and the plane is $${fmtNum(mu)}$.`,
      diagram: { svg: planeDiagram({ angleDeg: al.deg, angleLabel: al.exact ? 'α' : `${al.deg}°`, forces: [{ kind: 'normal', label: 'R' }, { kind: 'weight', label: `${fmtNum(m)}g` }, { kind: 'friction-down', label: 'F' }], particle: 'P' }), alt: 'A particle P on a rough slope, moving up it, with the normal reaction, its weight and friction acting down the slope.' },
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: 'Find the normal reaction between P and the plane.',
          answer: RR,
          scheme: [M1(md`Resolves perpendicular to the plane: $R = ${fmtNum(m)}g\cos ${al.tex}$`), A1(md`$R = ${answerTex(RR)}$`)],
          hints: ['Resolve at right angles to the slope: nothing accelerates that way.', md`$R = mg\cos ${al.tex}$`, al.exact ? md`$\cos ${al.tex} = ${al.cosTex}$` : 'Use your calculator in degrees.'],
          errors: [err('sin-cos', NG(m * G * al.sin, U.N), 'That uses sin: perpendicular to the plane it is the cosine component of the weight.')],
          solution: [md`$R = ${fmtNum(m)}(9.8)${cosT} = ${answerTex(RR)}$`],
        }),
        part({
          label: 'b',
          marks: 4,
          prompt: 'Find the deceleration of P as it moves up the plane.',
          answer: UP,
          scheme: [B1(md`$F = ${fmtNum(mu)}R$`), M1(md`Resolves along the plane: $${fmtNum(m)}g\sin ${al.tex} + F = ${fmtNum(m)}a$`), A1('Correct equation'), A1(md`$a = ${answerTex(UP)}$`)],
          hints: ['Moving up, friction acts down the slope — the same way as the weight component.', md`$F = \mu R$, and $F + mg\sin ${al.tex} = ma$`, 'Divide by m.'],
          errors: [err('friction-wrong-way', NG(G * (al.sin - mu * al.cos), U.ms2), 'Friction opposes the motion: while P moves up, friction acts down the slope, adding to the weight component.', 2)],
          solution: [md`$F = ${fmtNum(mu)} \times ${g3(R)} = ${g3(mu * R)}$ N`, md`$${fmtNum(m)}(9.8)${sinT} + ${g3(mu * R)} = ${fmtNum(m)}a \Rightarrow a = ${answerTex(UP)}$`],
        }),
        part({
          label: 'c',
          marks: 2,
          prompt: 'Find the distance P travels up the plane before coming to instantaneous rest.',
          answer: S,
          ft: (prev) => (prev.b?.value && prev.b.value > 0 ? NG((u * u) / (2 * prev.b.value), U.m) : null),
          scheme: [M1(md`$0 = ${u}^{2} - 2as$ with their $a$`), A1(md`$s = ${answerTex(S)}$`)],
          hints: ['At the highest point the speed is 0.', 'v² = u² + 2as with a negative (deceleration).', md`$u = ${u}$`],
          solution: [md`$0 = ${u}^{2} - 2(${g3(up)})s \Rightarrow s = ${answerTex(S)}$`],
        }),
        part({
          label: 'd',
          marks: 2,
          prompt: 'Explain why P then slides back down the plane.',
          answer: ans.self(`The component of the weight down the slope, ${fmtNum(m)}g sin ${al.exact ? 'α' : `${al.deg}°`} ≈ ${g3(m * G * al.sin)} N, is more than the greatest friction μR ≈ ${g3(mu * R)} N, so friction cannot hold P at rest.`),
          scheme: [M1('Compares the weight component down the slope with the limiting friction μR'), A1(md`$${g3(m * G * al.sin)} > ${g3(mu * R)}$, so P cannot stay at rest`)],
          hints: ['At rest, friction can act up the slope, but only up to μR.', 'Compare mg sin α with μR.', 'Which is bigger?'],
          solution: [md`Down the slope: $${fmtNum(m)}g\sin ${al.tex} = ${g3(m * G * al.sin)}$ N; greatest friction: $\mu R = ${g3(mu * R)}$ N`, 'The weight component is larger, so P accelerates back down.'],
        }),
        part({
          label: 'e',
          marks: 3,
          prompt: 'Find the speed of P when it returns to its starting point.',
          answer: W,
          scheme: [M1(md`Down the plane: $${fmtNum(m)}g\sin ${al.tex} - F = ${fmtNum(m)}a$`), M1('v² = 2as with their distance from (c)'), A1(md`$v = ${answerTex(W)}$`)],
          hints: ['Now friction acts up the slope.', md`$a = g\sin ${al.tex} - \mu g\cos ${al.tex}$`, 'It starts from rest and slides the distance from (c).'],
          errors: [err('same-speed', NG(u, U.ms), 'Friction takes energy on the way up and on the way down, so it comes back slower than it set off.')],
          solution: [md`$a = 9.8${sinT} - ${fmtNum(mu)}(9.8)${cosT} = ${g3(down)}$ m s$^{-2}$`, md`$v^{2} = 2(${g3(down)})(${g3(s)}) \Rightarrow v = ${answerTex(W)}$`],
        }),
      ],
      params: { m, mu, u, sin: al.sin, cos: al.cos },
    };
  },
  verify(inst) {
    const { m, mu, u, sin, cos } = inst.params as Record<string, number>;
    const s = (inst.parts[2].answer as NumericSpec).value;
    // energy up: ½mu² = mg s sinα + μ mg cosα s
    expectClose(0.5 * m * u * u, m * G * s * sin + mu * m * G * cos * s, 'energy up the slope', 1e-9);
    // energy down: ½mv² = mg s sinα − μ mg cosα s
    const w = (inst.parts[4].answer as NumericSpec).value;
    expectClose(0.5 * m * w * w, m * G * s * sin - mu * m * G * cos * s, 'energy down the slope', 1e-9);
    expect(w < u, 'comes back slower');
  },
});

const templates: Template[] = [roughTable, upAndBack];
export default templates;
