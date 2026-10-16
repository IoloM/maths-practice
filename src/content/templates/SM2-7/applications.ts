/** Mechanics Year 2, Chapter 7 — applications of forces: statics and dynamics on rough planes, connected particles. */
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ACC_G, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { G, U, forceDiagram, pickAngle, planeDiagram, polar, rad, vAdd, vScale, type Angle, type V2 } from '../shared/mech';

const NG = (v: number, unit?: string) => ans.num(v, ACC_G, unit ? { unit } : {});
const up = (a: Angle): V2 => [a.cos, a.sin];
const nrm = (a: Angle): V2 => [-a.sin, a.cos];
const angleText = (a: Angle, what = 'a fixed rough plane') => (a.exact ? md`${what} inclined at an angle $\alpha$ to the horizontal, where ${a.given}` : md`${what} inclined at $${a.tex}$ to the horizontal`);
const sinT = (a: Angle) => (a.exact ? a.sinTex : `\\sin ${a.tex}`);
const cosT = (a: Angle) => (a.exact ? a.cosTex : `\\cos ${a.tex}`);
const lbl = (a: Angle) => (a.exact ? 'α' : `${a.deg}°`);

function balance(forces: V2[], m: number, acc: number, dir: V2) {
  const net = vAdd(...forces);
  expectClose(net[0], m * acc * dir[0], 'horizontal', 1e-8);
  expectClose(net[1], m * acc * dir[1], 'vertical', 1e-8);
}

const horizontalForce = defineTemplate({
  id: 'sm2.7.horizontal-force-rough-plane',
  family: 'sm2.7.statics-planes',
  title: 'Horizontal force holding a particle on a rough plane (limiting)',
  spec: ['M8.6', 'M8.4'],
  chapter: 'SM2.7',
  sections: ['7.3'],
  level: 'A2',
  paper: [3],
  difficulty: 5,
  marks: 8,
  time: 11,
  commands: ['Find'],
  tags: ['friction', 'limiting equilibrium', 'inclined plane', 'horizontal force'],
  generate(r) {
    const a = pickAngle(r);
    const m = r.pick([1, 2, 3, 4, 5, 6]);
    const mu = Number(r.real(0.1, 0.6, 2).toFixed(2));
    const den = a.cos - mu * a.sin;
    r.require(den > 0.2);
    const P = (m * G * (a.sin + mu * a.cos)) / den;
    const R = m * G * a.cos + P * a.sin;
    const Pn = NG(P, U.N),
      Rn = NG(R, U.N);
    return {
      stem: md`A particle of mass $${m}$ kg is held at rest on ${angleText(a)} by a horizontal force of magnitude $P$ N acting in the vertical plane containing a line of greatest slope. The coefficient of friction is $${mu}$, and the particle is on the point of moving up the plane.`,
      diagram: { svg: planeDiagram({ angleDeg: a.deg, angleLabel: lbl(a), forces: [{ kind: 'horizontal', label: 'P' }, { kind: 'friction-down', label: 'F' }, { kind: 'normal', label: 'R' }, { kind: 'weight', label: `${m}g` }] }), alt: 'Particle on a rough plane pushed by a horizontal force P, with friction down the plane, reaction R and weight.' },
      parts: [
        part({
          label: 'a',
          marks: 6,
          prompt: md`Find the value of $P$.`,
          answer: Pn,
          scheme: [
            M1('Resolves perpendicular to the plane (three terms)'),
            A1(md`$R = ${m}g${cosT(a)} + P${sinT(a)}$`),
            M1('Resolves parallel to the plane with friction down the plane'),
            A1(md`$P${cosT(a)} = F + ${m}g${sinT(a)}$`),
            dM1(md`Uses $F = ${mu}R$ and solves for $P$`),
            A1(md`$P = ${answerTex(Pn)}$`),
          ],
          hints: ['Resolve parallel and perpendicular to the plane. The horizontal force has components along and into the plane.', md`Perpendicular: $R = mg\cos\alpha + P\sin\alpha$. Parallel: $P\cos\alpha = F + mg\sin\alpha$.`, md`Substitute $F = ${mu}R$ and collect the $P$ terms.`],
          errors: [
            err('R-mg-cos', NG((m * G * (a.sin + mu * a.cos)) / a.cos), 'The horizontal force also pushes into the plane: R = mg cos α + P sin α.', 3),
            err('friction-up', NG((m * G * (a.sin - mu * a.cos)) / (a.cos + mu * a.sin)), 'On the point of moving up the plane, friction acts down the plane.', 3),
          ],
          solution: [
            md`$\perp$: $R = ${m}g${cosT(a)} + P${sinT(a)}$`,
            md`$\parallel$: $P${cosT(a)} = ${mu}R + ${m}g${sinT(a)}$`,
            md`$P(${cosT(a)} - ${mu}${sinT(a)}) = ${m}g(${sinT(a)} + ${mu}${cosT(a)}) \Rightarrow P = ${answerTex(Pn)}$`,
          ],
        }),
        part({ label: 'b', marks: 2, prompt: 'Find the normal reaction between the particle and the plane.', answer: Rn, ft: (prev) => (prev.a?.value ? NG(m * G * a.cos + prev.a.value * a.sin) : null), scheme: [M1('Substitutes P'), A1(md`$R = ${answerTex(Rn)}$`)], hints: ['Use your perpendicular equation.', md`$R = ${m}g${cosT(a)} + P${sinT(a)}$`, 'Use the unrounded P.'], solution: [md`$R = ${m}g${cosT(a)} + ${fmtSF(P, 5)}${sinT(a)} = ${answerTex(Rn)}$`] }),
      ],
      params: { sin: a.sin, cos: a.cos, m, mu },
    };
  },
  verify(inst) {
    const { sin, cos, m, mu } = inst.params as Record<string, number>;
    const A = { sin, cos } as Angle;
    const P = (inst.parts[0].answer as NumericSpec).value,
      R = (inst.parts[1].answer as NumericSpec).value;
    balance([[P, 0], vScale(R, nrm(A)), [0, -m * G], vScale(-mu * R, up(A))], m, 0, up(A));
  },
});

const planePulley = defineTemplate({
  id: 'sm2.7.connected-plane-pulley',
  family: 'sm2.7.connected',
  title: 'Particle on a rough plane connected over a pulley to a hanging particle',
  spec: ['M8.4', 'M8.6'],
  chapter: 'SM2.7',
  sections: ['7.6'],
  level: 'A2',
  paper: [3],
  difficulty: 5,
  marks: 9,
  time: 12,
  commands: ['Find'],
  tags: ['connected particles', 'pulley', 'inclined plane', 'friction'],
  generate(r) {
    const a = pickAngle(r);
    const m1 = r.pick([1, 2, 3, 4, 5]);
    const m2 = r.pick([1, 2, 3, 4, 5, 6]);
    const mu = Number(r.real(0.1, 0.5, 2).toFixed(2));
    const acc = (m2 * G - m1 * G * a.sin - mu * m1 * G * a.cos) / (m1 + m2);
    r.require(acc > 0.3);
    const T = m2 * (G - acc);
    const A = NG(acc, U.ms2),
      Tn = NG(T, U.N);
    return {
      stem: md`A particle $A$ of mass $${m1}$ kg lies on ${angleText(a)}. It is attached to a light inextensible string which passes up the line of greatest slope, over a small smooth pulley at the top of the plane, to a particle $B$ of mass $${m2}$ kg hanging freely. The coefficient of friction between $A$ and the plane is $${mu}$. The system is released from rest and $B$ moves downwards.`,
      diagram: { svg: planeDiagram({ angleDeg: a.deg, angleLabel: lbl(a), particle: 'A', forces: [{ kind: 'friction-down', label: 'F' }, { kind: 'normal', label: 'R' }, { kind: 'weight', label: `${m1}g` }], pulley: true, hanging: `B (${m2} kg)` }), alt: 'Particle A on a rough inclined plane attached by a string over a pulley at the top to particle B hanging vertically.' },
      parts: [
        part({
          label: 'a',
          marks: 7,
          prompt: 'Find the acceleration of the system.',
          answer: A,
          scheme: [
            B1(md`$R = ${m1}g${cosT(a)}$`),
            M1(md`$F = ${mu}R$ acting down the plane`),
            M1(md`$A$: $T - F - ${m1}g${sinT(a)} = ${m1}a$`),
            A1('Correct equation for A'),
            M1(md`$B$: $${m2}g - T = ${m2}a$`),
            dM1('Eliminates T'),
            A1(md`$a = ${answerTex(A)}$`),
          ],
          hints: ['A moves up the plane, so friction on A acts down the plane.', md`For $A$: $T - F - ${m1}g\sin\alpha = ${m1}a$. For $B$: $${m2}g - T = ${m2}a$.`, md`$F = ${mu} \times ${m1}g${cosT(a)}$`],
          errors: [
            err('no-friction', NG((m2 * G - m1 * G * a.sin) / (m1 + m2)), 'Include friction on A: F = μR with R = mg cos α.', 4),
            err('sin-cos', NG((m2 * G - m1 * G * a.cos - mu * m1 * G * a.sin) / (m1 + m2)), 'Check sin and cos: weight down the plane is mg sin α; R = mg cos α.', 4),
          ],
          solution: [
            md`$R = ${m1}g${cosT(a)}$, $F = ${mu}R = ${fmtSF(mu * m1 * G * a.cos, 4)}$`,
            md`$A$: $T - ${fmtSF(mu * m1 * G * a.cos, 4)} - ${m1}g${sinT(a)} = ${m1}a$; $\quad B$: $${m2}g - T = ${m2}a$`,
            md`Adding: $${m2}g - ${fmtSF(mu * m1 * G * a.cos, 4)} - ${fmtSF(m1 * G * a.sin, 4)} = ${m1 + m2}a \Rightarrow a = ${answerTex(A)}$`,
          ],
        }),
        part({ label: 'b', marks: 2, prompt: 'Find the tension in the string.', answer: Tn, ft: (prev) => (prev.a?.value ? NG(m2 * (G - prev.a.value)) : null), scheme: [M1("Uses B's equation"), A1(md`$T = ${answerTex(Tn)}$`)], hints: ["B's equation is simplest.", md`$T = ${m2}(g - a)$`, 'Use the unrounded acceleration.'], solution: [md`$T = ${m2}(9.8 - ${fmtSF(acc, 4)}) = ${answerTex(Tn)}$`] }),
      ],
      params: { sin: a.sin, cos: a.cos, m1, m2, mu },
    };
  },
  verify(inst) {
    const { sin, cos, m1, m2, mu } = inst.params as Record<string, number>;
    const A = { sin, cos } as Angle;
    const acc = (inst.parts[0].answer as NumericSpec).value,
      T = (inst.parts[1].answer as NumericSpec).value;
    const R = m1 * G * cos;
    balance([vScale(T, up(A)), vScale(R, nrm(A)), [0, -m1 * G], vScale(-mu * R, up(A))], m1, acc, up(A));
    expectClose(m2 * G - T, m2 * acc, 'B', 1e-9);
  },
});

const frictionRange = defineTemplate({
  id: 'sm2.7.friction-range-equilibrium',
  family: 'sm2.7.statics-planes',
  title: 'Range of a force for equilibrium on a rough plane',
  spec: ['M8.6'],
  chapter: 'SM2.7',
  sections: ['7.3'],
  level: 'A2',
  paper: [3],
  difficulty: 5,
  marks: 7,
  time: 10,
  commands: ['Find'],
  tags: ['friction', 'limiting equilibrium', 'inclined plane', 'range'],
  generate(r) {
    const a = pickAngle(r);
    const m = r.pick([2, 3, 4, 5, 6, 8]);
    const mu = Number(r.real(0.1, Math.min(0.9, a.tan - 0.08), 2).toFixed(2));
    r.require(mu > 0.05 && mu < a.tan - 0.05);
    const Pmin = m * G * (a.sin - mu * a.cos);
    const Pmax = m * G * (a.sin + mu * a.cos);
    const Lo = NG(Pmin, U.N),
      Hi = NG(Pmax, U.N);
    return {
      stem: md`A particle of mass $${m}$ kg rests on ${angleText(a)}. The coefficient of friction is $${mu}$. A force of magnitude $P$ N acts on the particle up a line of greatest slope, and the particle remains in equilibrium.`,
      diagram: { svg: planeDiagram({ angleDeg: a.deg, angleLabel: lbl(a), forces: [{ kind: 'up', label: 'P' }, { kind: 'normal', label: 'R' }, { kind: 'weight', label: `${m}g` }] }), alt: 'Particle on a rough plane with force P up the plane, reaction R and weight.' },
      parts: [
        part({
          label: 'a',
          marks: 4,
          prompt: md`Find the least possible value of $P$.`,
          answer: Lo,
          scheme: [B1(md`$R = ${m}g${cosT(a)}$`), M1('On the point of slipping down: friction acts up the plane'), A1(md`$P + ${mu}R = ${m}g${sinT(a)}$`), A1(md`$P = ${answerTex(Lo)}$`)],
          hints: ['For the least P, the particle is about to slide down the plane.', 'Then friction is limiting and acts up the plane.', md`$P + \mu R = ${m}g\sin\alpha$ with $R = ${m}g\cos\alpha$.`],
          errors: [err('max-instead', NG(Pmax), 'That is the largest P (about to slide up). For the least P, friction acts up the plane.', 1)],
          solution: [md`$R = ${m}g${cosT(a)}$; about to slide down: $P + ${mu}R = ${m}g${sinT(a)}$`, md`$P = ${answerTex(Lo)}$`],
        }),
        part({ label: 'b', marks: 3, prompt: md`Find the greatest possible value of $P$.`, answer: Hi, scheme: [M1('About to slide up: friction acts down the plane'), A1(md`$P = ${mu}R + ${m}g${sinT(a)}$`), A1(md`$P = ${answerTex(Hi)}$`)], hints: ['For the greatest P, the particle is about to slide up.', 'Friction now acts down the plane.', md`$P = \mu R + ${m}g\sin\alpha$`], solution: [md`$P = ${mu}R + ${m}g${sinT(a)} = ${answerTex(Hi)}$`] }),
      ],
      params: { sin: a.sin, cos: a.cos, m, mu },
    };
  },
  verify(inst) {
    const { sin, cos, m, mu } = inst.params as Record<string, number>;
    const A = { sin, cos } as Angle;
    const lo = (inst.parts[0].answer as NumericSpec).value,
      hi = (inst.parts[1].answer as NumericSpec).value;
    const R = m * G * cos;
    balance([vScale(lo, up(A)), vScale(R, nrm(A)), [0, -m * G], vScale(mu * R, up(A))], m, 0, up(A));
    balance([vScale(hi, up(A)), vScale(R, nrm(A)), [0, -m * G], vScale(-mu * R, up(A))], m, 0, up(A));
    expect(lo > 0 && hi > lo, 'valid range');
  },
});

const twoStrings = defineTemplate({
  id: 'sm2.7.two-strings-equilibrium',
  family: 'sm2.7.statics',
  title: 'Particle suspended by two strings',
  spec: ['M8.4', 'M8.5'],
  chapter: 'SM2.7',
  sections: ['7.1'],
  level: 'A2',
  paper: [3],
  difficulty: 4,
  marks: 7,
  time: 9,
  commands: ['Find'],
  tags: ['equilibrium', 'resolving', 'tension', 'simultaneous equations'],
  generate(r) {
    const m = r.pick([1, 1.5, 2, 2.5, 3, 4, 5]);
    const t1 = r.pick([20, 25, 30, 35, 40, 45, 50, 55, 60]);
    const t2 = r.pick([20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70]);
    r.require(t1 !== t2);
    // T1 at angle t1 above horizontal to the left, T2 at t2 above horizontal to the right
    const c1 = Math.cos(rad(t1)),
      s1 = Math.sin(rad(t1)),
      c2 = Math.cos(rad(t2)),
      s2 = Math.sin(rad(t2));
    const T1 = (m * G * c2) / (s1 * c2 + s2 * c1);
    const T2 = (T1 * c1) / c2;
    const A = NG(T1, U.N),
      B = NG(T2, U.N);
    return {
      stem: md`A particle of mass $${m}$ kg hangs in equilibrium, supported by two light strings $AP$ and $BP$. The string $AP$ makes an angle of $${t1}^{\circ}$ with the horizontal and the string $BP$ makes an angle of $${t2}^{\circ}$ with the horizontal, with $A$ and $B$ on opposite sides of $P$.`,
      diagram: { svg: forceDiagram([{ angle: 180 - t1, label: 'T₁' }, { angle: t2, label: 'T₂' }, { angle: 270, label: `${m}g` }]), alt: `Particle P with tension T1 at ${t1} degrees above the horizontal to the left, T2 at ${t2} degrees to the right, and weight.` },
      parts: [
        part({
          label: 'a',
          marks: 5,
          prompt: md`Find the tension in $AP$.`,
          answer: A,
          scheme: [M1('Resolves horizontally'), A1(md`$T_1\cos ${t1}^{\circ} = T_2\cos ${t2}^{\circ}$`), M1('Resolves vertically'), A1(md`$T_1\sin ${t1}^{\circ} + T_2\sin ${t2}^{\circ} = ${m}g$`), A1(md`$T_1 = ${answerTex(A)}$`)],
          hints: ['Resolve horizontally and vertically to get two equations.', md`Horizontal: $T_1\cos ${t1}^{\circ} = T_2\cos ${t2}^{\circ}$.`, md`Vertical: $T_1\sin ${t1}^{\circ} + T_2\sin ${t2}^{\circ} = ${m}g$. Substitute for $T_2$.`],
          errors: [err('swapped-trig', NG((m * G * s2) / (c1 * s2 + c2 * s1)), 'The angles are with the horizontal: horizontal components use cos, vertical components use sin.', 2)],
          solution: [md`$\rightarrow$: $T_1\cos ${t1}^{\circ} = T_2\cos ${t2}^{\circ}$`, md`$\uparrow$: $T_1\sin ${t1}^{\circ} + T_2\sin ${t2}^{\circ} = ${m}g$`, md`Solving: $T_1 = ${answerTex(A)}$`],
        }),
        part({ label: 'b', marks: 2, prompt: md`Find the tension in $BP$.`, answer: B, ft: (prev) => (prev.a?.value ? NG((prev.a.value * c1) / c2) : null), scheme: [M1('Substitutes T₁'), A1(md`$T_2 = ${answerTex(B)}$`)], hints: ['Use the horizontal equation.', md`$T_2 = \dfrac{T_1\cos ${t1}^{\circ}}{\cos ${t2}^{\circ}}$`, 'Use unrounded T₁.'], solution: [md`$T_2 = \dfrac{${fmtSF(T1, 5)}\cos ${t1}^{\circ}}{\cos ${t2}^{\circ}} = ${answerTex(B)}$`] }),
      ],
      params: { m, t1, t2 },
    };
  },
  verify(inst) {
    const { m, t1, t2 } = inst.params as Record<string, number>;
    const T1 = (inst.parts[0].answer as NumericSpec).value,
      T2 = (inst.parts[1].answer as NumericSpec).value;
    balance([polar(T1, 180 - t1), polar(T2, t2), [0, -m * G]], m, 0, [1, 0]);
  },
});

const pulledUpPlane = defineTemplate({
  id: 'sm2.7.pulled-up-rough-plane',
  family: 'sm2.7.dynamics-planes',
  title: 'Pulled up a rough plane by a force parallel to the plane',
  spec: ['M8.6', 'M7.3'],
  chapter: 'SM2.7',
  sections: ['7.5'],
  level: 'A2',
  paper: [3],
  difficulty: 4,
  marks: 7,
  time: 9,
  commands: ['Find'],
  tags: ['inclined plane', 'friction', 'F = ma', 'suvat'],
  generate(r) {
    const a = pickAngle(r);
    const m = r.pick([2, 3, 4, 5, 6, 8, 10]);
    const mu = Number(r.real(0.1, 0.6, 2).toFixed(2));
    const base = m * G * (a.sin + mu * a.cos);
    const P = Math.ceil(base + r.int(5, 40));
    const acc = (P - base) / m;
    const d = r.pick([2, 3, 4, 5, 6, 8]);
    const v = Math.sqrt(2 * acc * d);
    const A = NG(acc, U.ms2),
      V = NG(v, U.ms);
    return {
      stem: md`A box of mass $${m}$ kg is pulled up a line of greatest slope of ${angleText(a)} by a rope parallel to the plane. The tension in the rope is $${P}$ N and the coefficient of friction between the box and the plane is $${mu}$. The box starts from rest.`,
      diagram: { svg: planeDiagram({ angleDeg: a.deg, angleLabel: lbl(a), forces: [{ kind: 'up', label: `${P} N` }, { kind: 'friction-down', label: 'F' }, { kind: 'normal', label: 'R' }, { kind: 'weight', label: `${m}g` }] }), alt: 'Box on a rough plane pulled up by a rope parallel to the plane, with friction down the plane.' },
      parts: [
        part({ label: 'a', marks: 5, prompt: 'Find the acceleration of the box.', answer: A, scheme: [B1(md`$R = ${m}g${cosT(a)}$`), M1(md`$F = ${mu}R$`), M1(md`$${P} - F - ${m}g${sinT(a)} = ${m}a$`), A1('Correct equation'), A1(md`$a = ${answerTex(A)}$`)], hints: ['Friction acts down the plane because the box moves up.', 'R = mg cos α; F = μR.', md`$${P} - ${mu}R - ${m}g\sin\alpha = ${m}a$`], errors: [err('no-weight-component', NG((P - mu * m * G * a.cos) / m), 'Include the component of the weight down the plane.', 2), err('sin-cos', NG((P - m * G * (a.cos + mu * a.sin)) / m), 'Weight down the plane is mg sin α; R = mg cos α.', 3)], solution: [md`$R = ${m}g${cosT(a)}$, $F = ${mu}R = ${fmtSF(mu * m * G * a.cos, 4)}$`, md`$${P} - ${fmtSF(mu * m * G * a.cos, 4)} - ${fmtSF(m * G * a.sin, 4)} = ${m}a \Rightarrow a = ${answerTex(A)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the speed of the box when it has moved $${d}$ m.`, answer: V, ft: (prev) => (prev.a?.value && prev.a.value > 0 ? NG(Math.sqrt(2 * prev.a.value * d)) : null), scheme: [M1(md`$v^{2} = 2a(${d})$`), A1(md`$${answerTex(V)}$`)], hints: ['Constant acceleration from rest.', 'v² = u² + 2as', md`$s = ${d}$`], solution: [md`$v^{2} = 2 \times ${fmtSF(acc, 4)} \times ${d} \Rightarrow v = ${answerTex(V)}$`] }),
      ],
      params: { sin: a.sin, cos: a.cos, m, mu, P },
    };
  },
  verify(inst) {
    const { sin, cos, m, mu, P } = inst.params as Record<string, number>;
    const A = { sin, cos } as Angle;
    const acc = (inst.parts[0].answer as NumericSpec).value;
    const R = m * G * cos;
    balance([vScale(P, up(A)), vScale(R, nrm(A)), [0, -m * G], vScale(-mu * R, up(A))], m, acc, up(A));
  },
});

const templates: Template[] = [horizontalForce, planePulley, frictionRange, twoStrings, pulledUpPlane];
export default templates;
