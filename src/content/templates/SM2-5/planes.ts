/** Mechanics Year 2, Chapter 5 — resolving forces, inclined planes and friction. */
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ACC_G, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { G, U, deg, forceDiagram, pickAngle, planeDiagram, polar, rad, vAdd, vLen, vScale, type Angle, type V2 } from '../shared/mech';

const NG = (v: number, unit?: string) => ans.num(v, ACC_G, unit ? { unit } : {});
const up = (a: Angle): V2 => [a.cos, a.sin];
const nrm = (a: Angle): V2 => [-a.sin, a.cos];
const angleText = (a: Angle, what = 'a fixed rough plane', sym = '\\alpha') => (a.exact ? md`${what} inclined at an angle $${sym}$ to the horizontal, where ${a.given}` : md`${what} inclined at $${a.tex}$ to the horizontal`);
const sinT = (a: Angle) => (a.exact ? a.sinTex : `\\sin ${a.tex}`);
const cosT = (a: Angle) => (a.exact ? a.cosTex : `\\cos ${a.tex}`);

/** Check that the forces on a particle give m·a along unit vector dir (resolving horizontally and vertically). */
function checkNewton(forces: V2[], m: number, a: number, dir: V2) {
  const net = vAdd(...forces);
  expectClose(net[0], m * a * dir[0], 'horizontal resultant', 1e-8);
  expectClose(net[1], m * a * dir[1], 'vertical resultant', 1e-8);
}

const resultant = defineTemplate({
  id: 'sm2.5.resultant-of-forces',
  family: 'sm2.5.resolving',
  title: 'Resultant of forces given in magnitude–direction form',
  spec: ['M8.5'],
  chapter: 'SM2.5',
  sections: ['5.1'],
  level: 'A2',
  paper: [3],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find'],
  tags: ['resolving', 'resultant', 'forces'],
  generate(r) {
    const F1 = r.int(4, 20),
      F2 = r.int(4, 20),
      F3 = r.int(4, 20);
    const t1 = 0,
      t2 = r.pick([30, 40, 45, 50, 60, 70]),
      t3 = r.pick([120, 135, 150, 210, 225, 240, 270]);
    const R = vAdd(polar(F1, t1), polar(F2, t2), polar(F3, t3));
    r.require(vLen(R) > 1 && Math.abs(R[0]) > 0.3 && Math.abs(R[1]) > 0.3);
    const mag = vLen(R);
    const ang = deg(Math.atan2(R[1], R[0]));
    const angPos = (ang + 360) % 360;
    const Mg = ans.num(mag, { sf: 3 }, { unit: U.N });
    const Ang = ans.num(angPos, { sf: 3 }, { unit: '^{\\circ}', alts: [angPos - 360] });
    const desc = (f: number, t: number) => (t === 0 ? `$${f}$ N in the direction of $\\mathbf{i}$` : `$${f}$ N at $${t}^{\\circ}$ anticlockwise from $\\mathbf{i}$`);
    return {
      stem: md`Three forces act on a particle: ${desc(F1, t1)}, ${desc(F2, t2)} and ${desc(F3, t3)}.`,
      diagram: { svg: forceDiagram([{ angle: t1, label: `${F1} N` }, { angle: t2, label: `${F2} N` }, { angle: t3, label: `${F3} N` }]), alt: 'Three force arrows from a particle at the given angles.' },
      parts: [
        part({
          label: 'a',
          marks: 4,
          prompt: 'Find the magnitude of the resultant force.',
          answer: Mg,
          scheme: [M1('Resolves all three forces in the i direction'), M1('Resolves all three forces in the j direction'), A1(md`Components $${fmtSF(R[0], 4)}$ and $${fmtSF(R[1], 4)}$`), A1(md`$${answerTex(Mg)}$`)],
          hints: ['Resolve each force into i and j components.', 'A force F at angle θ to i has components F cos θ and F sin θ.', 'Add the components, then use Pythagoras.'],
          errors: [err('add-magnitudes', ans.num(F1 + F2 + F3, { sf: 3 }), 'Forces are vectors — add components, not magnitudes.')],
          solution: [
            md`$\mathbf{i}$: $${F1} + ${F2}\cos ${t2}^{\circ} + ${F3}\cos ${t3}^{\circ} = ${fmtSF(R[0], 4)}$`,
            md`$\mathbf{j}$: $${F2}\sin ${t2}^{\circ} + ${F3}\sin ${t3}^{\circ} = ${fmtSF(R[1], 4)}$`,
            md`$|\mathbf{R}| = \sqrt{${fmtSF(R[0], 4)}^{2} + ${fmtSF(R[1], 4)}^{2}} = ${answerTex(Mg)}$`,
          ],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Find the direction of the resultant as an angle measured anticlockwise from $\mathbf{i}$ (between $0^{\circ}$ and $360^{\circ}$).`,
          answer: Ang,
          scheme: [M1('Uses tan with their components, considering the quadrant'), A1(md`$${answerTex(Ang)}$`)],
          hints: ['Sketch the resultant to see which quadrant it is in.', 'tan θ = j-component ÷ i-component.', md`The components are $${fmtSF(R[0], 4)}$ and $${fmtSF(R[1], 4)}$.`],
          errors: [err('acute-only', ans.num(deg(Math.atan(Math.abs(R[1] / R[0]))), { sf: 3 }), 'Check the quadrant: the acute angle needs adjusting.', 1)],
          solution: [md`$\tan^{-1}\left|\dfrac{${fmtSF(R[1], 4)}}{${fmtSF(R[0], 4)}}\right| = ${fmtSF(deg(Math.atan(Math.abs(R[1] / R[0]))), 4)}^{\circ}$; with signs ($${R[0] > 0 ? '+' : '-'}$, $${R[1] > 0 ? '+' : '-'}$) the direction is $${answerTex(Ang)}$`],
        }),
      ],
      params: { F: [F1, F2, F3], t: [t1, t2, t3] },
    };
  },
  verify(inst) {
    const { F, t } = inst.params as { F: number[]; t: number[] };
    const mag = (inst.parts[0].answer as NumericSpec).value;
    const ang = (inst.parts[1].answer as NumericSpec).value;
    // the resultant reversed must balance the three forces
    const net = vAdd(...F.map((f, i) => polar(f, t[i])), polar(-mag, ang));
    expectClose(vLen(net), 0, 'balance', 1e-6);
  },
});

const equilibrium = defineTemplate({
  id: 'sm2.5.equilibrium-string-horizontal-force',
  family: 'sm2.5.resolving',
  title: 'Particle held by a string and a horizontal force',
  spec: ['M8.4', 'M8.5'],
  chapter: 'SM2.5',
  sections: ['5.1'],
  level: 'A2',
  paper: [3],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find'],
  tags: ['equilibrium', 'resolving', 'tension'],
  generate(r) {
    const m = r.pick([0.5, 1, 1.5, 2, 2.5, 3, 4, 5]);
    const th = r.pick([15, 20, 25, 30, 35, 40, 45, 50]);
    const T = (m * G) / Math.cos(rad(th));
    const P = m * G * Math.tan(rad(th));
    const Pn = NG(P, U.N),
      Tn = NG(T, U.N);
    return {
      stem: md`A particle of mass $${m}$ kg is attached to one end of a light string, the other end of which is fixed. The particle is held in equilibrium by a horizontal force of magnitude $P$ N, with the string making an angle of $${th}^{\circ}$ with the vertical.`,
      diagram: { svg: forceDiagram([{ angle: 90 + th, label: 'T' }, { angle: 0, label: 'P' }, { angle: 270, label: `${m}g` }]), alt: 'Particle with tension T along the string, horizontal force P and weight mg.' },
      parts: [
        part({ label: 'a', marks: 3, prompt: 'Find the tension in the string.', answer: Tn, scheme: [M1('Resolves vertically'), A1(md`$T\cos ${th}^{\circ} = ${m}g$`), A1(md`$T = ${answerTex(Tn)}$`)], hints: ['Resolve vertically: only T and the weight have vertical components.', md`The vertical component of $T$ is $T\cos ${th}^{\circ}$.`, md`$T\cos ${th}^{\circ} = ${m} \times 9.8$`], errors: [err('sin-cos', NG((m * G) / Math.sin(rad(th))), 'The angle is with the vertical, so the vertical component is T cos θ.', 1)], solution: [md`$\uparrow$: $T\cos ${th}^{\circ} = ${m}g \Rightarrow T = ${answerTex(Tn)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Find the value of $P$.`, answer: Pn, ft: (prev) => (prev.a?.value ? NG(prev.a.value * Math.sin(rad(th))) : null), scheme: [M1('Resolves horizontally'), A1(md`$P = T\sin ${th}^{\circ}$`), A1(md`$P = ${answerTex(Pn)}$`)], hints: ['Resolve horizontally.', md`$P = T\sin ${th}^{\circ}$`, 'Use your tension from part (a).'], solution: [md`$\rightarrow$: $P = T\sin ${th}^{\circ} = ${answerTex(Pn)}$`] }),
      ],
      params: { m, th },
    };
  },
  verify(inst) {
    const { m, th } = inst.params as Record<string, number>;
    const T = (inst.parts[0].answer as NumericSpec).value,
      P = (inst.parts[1].answer as NumericSpec).value;
    checkNewton([polar(T, 90 + th), [P, 0], [0, -m * G]], m, 0, [1, 0]);
  },
});

const smoothPlane = defineTemplate({
  id: 'sm2.5.smooth-plane-released',
  family: 'sm2.5.inclined-planes',
  title: 'Particle released on a smooth inclined plane',
  spec: ['M8.2', 'M7.3'],
  chapter: 'SM2.5',
  sections: ['5.2'],
  level: 'A2',
  paper: [3],
  difficulty: 2,
  marks: 5,
  time: 6,
  commands: ['Find'],
  tags: ['inclined plane', 'smooth', 'suvat'],
  generate(r) {
    const a = pickAngle(r);
    const m = r.pick([0.5, 1, 2, 3, 4, 5]);
    const d = r.pick([1.5, 2, 2.5, 3, 4, 5, 6]);
    const acc = G * a.sin;
    const v = Math.sqrt(2 * acc * d);
    const A = NG(acc, U.ms2),
      V = NG(v, U.ms);
    return {
      stem: md`A particle of mass $${m}$ kg is released from rest on ${angleText(a, 'a smooth plane')}. It slides down a line of greatest slope.`,
      diagram: { svg: planeDiagram({ angleDeg: a.deg, angleLabel: a.exact ? 'α' : `${a.deg}°`, forces: [{ kind: 'normal', label: 'R' }, { kind: 'weight', label: `${m}g` }] }), alt: 'Particle on a smooth inclined plane with normal reaction R and weight mg.' },
      parts: [
        part({ label: 'a', marks: 3, prompt: 'Find the acceleration of the particle.', answer: A, scheme: [M1('Resolves parallel to the plane'), A1(md`$${m}g${sinT(a)} = ${m}a$`), A1(md`$a = ${answerTex(A)}$`)], hints: ['Resolve the weight parallel and perpendicular to the plane.', md`Component of the weight down the plane: $mg\sin\alpha$.`, md`$${m}g \times ${sinT(a)} = ${m}a$`], errors: [err('sin-cos-swap', NG(G * a.cos), 'You used cos — the component of the weight down the plane is mg sin α.', 1), err('g', NG(G), 'On a slope only part of the weight acts down the plane.')], solution: [md`$${m}g${sinT(a)} = ${m}a \Rightarrow a = 9.8 \times ${sinT(a)} = ${answerTex(A)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find its speed after it has moved $${d}$ m.`, answer: V, ft: (prev) => (prev.a?.value && prev.a.value > 0 ? NG(Math.sqrt(2 * prev.a.value * d)) : null), scheme: [M1(md`$v^{2} = 2a(${d})$`), A1(md`$${answerTex(V)}$`)], hints: ['Released from rest with constant acceleration.', 'v² = u² + 2as', md`$s = ${d}$`], solution: [md`$v^{2} = 2 \times ${fmtSF(acc, 4)} \times ${d} \Rightarrow v = ${answerTex(V)}$`] }),
      ],
      params: { sin: a.sin, cos: a.cos, m, d },
    };
  },
  verify(inst) {
    const { sin, cos, m, d } = inst.params as Record<string, number>;
    const A = { sin, cos } as Angle;
    const acc = (inst.parts[0].answer as NumericSpec).value;
    const R = m * G * cos;
    checkNewton([vScale(R, nrm(A)), [0, -m * G]], m, -acc, up(A));
    // energy: mg (d sin α) = ½ m v²
    const v = (inst.parts[1].answer as NumericSpec).value;
    expectClose(G * d * sin, 0.5 * v * v, 'energy', 1e-9);
  },
});

const heldOnPlane = defineTemplate({
  id: 'sm2.5.smooth-plane-held',
  family: 'sm2.5.inclined-planes',
  title: 'Particle held at rest on a smooth plane',
  spec: ['M8.4'],
  chapter: 'SM2.5',
  sections: ['5.2'],
  level: 'A2',
  paper: [3],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find'],
  tags: ['inclined plane', 'equilibrium', 'resolving'],
  generate(r) {
    const a = pickAngle(r);
    const m = r.pick([1, 2, 3, 4, 5, 6, 8]);
    const horizontal = r.bool();
    const P = horizontal ? m * G * a.tan : m * G * a.sin;
    const R = horizontal ? m * G * a.cos + P * a.sin : m * G * a.cos;
    const Pn = NG(P, U.N),
      Rn = NG(R, U.N);
    return {
      stem: md`A particle of mass $${m}$ kg rests on ${angleText(a, 'a smooth plane')}. It is held in equilibrium by a force of magnitude $P$ N acting ${horizontal ? 'horizontally, in the vertical plane containing a line of greatest slope' : 'up the plane along a line of greatest slope'}.`,
      diagram: { svg: planeDiagram({ angleDeg: a.deg, angleLabel: a.exact ? 'α' : `${a.deg}°`, forces: [{ kind: horizontal ? 'horizontal' : 'up', label: 'P' }, { kind: 'normal', label: 'R' }, { kind: 'weight', label: `${m}g` }] }), alt: 'Particle on a smooth plane held by force P, with reaction R and weight.' },
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: md`Find $P$.`,
          answer: Pn,
          scheme: [M1(horizontal ? 'Resolves parallel to the plane (or horizontally/vertically)' : 'Resolves parallel to the plane'), A1(horizontal ? md`$P${cosT(a)} = ${m}g${sinT(a)}$` : md`$P = ${m}g${sinT(a)}$`), A1(md`$P = ${answerTex(Pn)}$`)],
          hints: ['Resolve parallel to the plane so that R does not appear.', horizontal ? md`The horizontal force has component $P\cos\alpha$ up the plane.` : md`The weight has component $mg\sin\alpha$ down the plane.`, horizontal ? md`$P${cosT(a)} = ${m}g${sinT(a)}$` : md`$P = ${m}g${sinT(a)}$`],
          errors: [err('swap', NG(horizontal ? (m * G * a.cos) / a.sin : m * G * a.cos), 'Check sin and cos: the component along the plane of the weight is mg sin α.', 1)],
          solution: [horizontal ? md`$\nearrow$: $P${cosT(a)} = ${m}g${sinT(a)} \Rightarrow P = ${answerTex(Pn)}$` : md`$\nearrow$: $P = ${m}g${sinT(a)} = ${answerTex(Pn)}$`],
        }),
        part({
          label: 'b',
          marks: 3,
          prompt: 'Find the normal reaction between the particle and the plane.',
          answer: Rn,
          scheme: [M1('Resolves perpendicular to the plane'), A1(horizontal ? md`$R = ${m}g${cosT(a)} + P${sinT(a)}$` : md`$R = ${m}g${cosT(a)}$`), A1(md`$R = ${answerTex(Rn)}$`)],
          hints: ['Resolve perpendicular to the plane.', horizontal ? 'The horizontal force also pushes into the plane: component P sin α.' : 'Only the weight has a component perpendicular to the plane.', horizontal ? md`$R = ${m}g${cosT(a)} + P${sinT(a)}$` : md`$R = ${m}g${cosT(a)}$`],
          errors: horizontal ? [err('forgot-P', NG(m * G * a.cos), 'The horizontal force P also has a component perpendicular to the plane.', 1)] : [err('weight', NG(m * G), 'On a slope R is not equal to the weight.')],
          solution: [horizontal ? md`$R = ${m}g${cosT(a)} + ${fmtSF(P, 4)}${sinT(a)} = ${answerTex(Rn)}$` : md`$R = ${m}g${cosT(a)} = ${answerTex(Rn)}$`],
        }),
      ],
      params: { sin: a.sin, cos: a.cos, m, horizontal },
    };
  },
  verify(inst) {
    const { sin, cos, m, horizontal } = inst.params as { sin: number; cos: number; m: number; horizontal: boolean };
    const A = { sin, cos } as Angle;
    const P = (inst.parts[0].answer as NumericSpec).value,
      R = (inst.parts[1].answer as NumericSpec).value;
    checkNewton([horizontal ? [P, 0] : vScale(P, up(A)), vScale(R, nrm(A)), [0, -m * G]], m, 0, up(A));
  },
});

const angledPull = defineTemplate({
  id: 'sm2.5.rough-ground-angled-pull',
  family: 'sm2.5.friction',
  title: 'Pulled at an angle across rough horizontal ground',
  spec: ['M8.6', 'M8.2'],
  chapter: 'SM2.5',
  sections: ['5.3'],
  level: 'A2',
  paper: [3],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find'],
  tags: ['friction', 'resolving', 'F = ma'],
  generate(r) {
    const m = r.pick([2, 3, 4, 5, 6, 8, 10, 12]);
    const P = r.int(15, 80);
    const th = r.pick([15, 20, 25, 30, 35, 40]);
    const mu = r.pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4]);
    const R = m * G - P * Math.sin(rad(th));
    r.require(R > 1);
    const acc = (P * Math.cos(rad(th)) - mu * R) / m;
    r.require(acc > 0.15);
    const Rn = NG(R, U.N),
      A = NG(acc, U.ms2);
    const ctx = r.pick(['sledge', 'box', 'suitcase']);
    return {
      stem: md`A ${ctx} of mass $${m}$ kg is pulled across rough horizontal ground by a rope inclined at $${th}^{\circ}$ above the horizontal. The tension in the rope is $${P}$ N and the coefficient of friction between the ${ctx} and the ground is $${mu}$.`,
      diagram: { svg: forceDiagram([{ angle: th, label: `${P} N` }, { angle: 180, label: 'F' }, { angle: 90, label: 'R' }, { angle: 270, label: `${m}g` }]), alt: `Force diagram: tension ${P} N at ${th} degrees above horizontal, friction F, reaction R and weight.` },
      parts: [
        part({ label: 'a', marks: 3, prompt: 'Find the normal reaction between the ground and the ' + ctx + '.', answer: Rn, scheme: [M1('Resolves vertically with three terms'), A1(md`$R + ${P}\sin ${th}^{\circ} = ${m}g$`), A1(md`$R = ${answerTex(Rn)}$`)], hints: ['Resolve vertically.', 'The rope pulls partly upwards, reducing R.', md`$R + ${P}\sin ${th}^{\circ} = ${m}g$`], errors: [err('R-equals-mg', NG(m * G), md`The rope has an upward component $${P}\sin ${th}^{\circ}$, so $R$ is less than $mg$.`, 1)], solution: [md`$\uparrow$: $R + ${P}\sin ${th}^{\circ} = ${m}g \Rightarrow R = ${answerTex(Rn)}$`] }),
        part({ label: 'b', marks: 3, prompt: 'Find the acceleration of the ' + ctx + '.', answer: A, ft: (prev) => (prev.a?.value ? NG((P * Math.cos(rad(th)) - mu * prev.a.value) / m) : null), scheme: [M1(md`$F = ${mu}R$`), M1(md`$${P}\cos ${th}^{\circ} - F = ${m}a$`), A1(md`$a = ${answerTex(A)}$`)], hints: ['Friction is limiting while sliding: F = μR.', 'Resolve horizontally and use F = ma.', md`$${P}\cos ${th}^{\circ} - ${mu}R = ${m}a$`], errors: [err('used-mg', NG((P * Math.cos(rad(th)) - mu * m * G) / m), 'Use the reaction from part (a) in F = μR, not mg.', 2)], solution: [md`$F = ${mu} \times ${fmtSF(R, 4)} = ${fmtSF(mu * R, 4)}$`, md`$${P}\cos ${th}^{\circ} - ${fmtSF(mu * R, 4)} = ${m}a \Rightarrow a = ${answerTex(A)}$`] }),
      ],
      params: { m, P, th, mu },
    };
  },
  verify(inst) {
    const { m, P, th, mu } = inst.params as Record<string, number>;
    const R = (inst.parts[0].answer as NumericSpec).value,
      a = (inst.parts[1].answer as NumericSpec).value;
    checkNewton([polar(P, th), [0, R], [0, -m * G], [-mu * R, 0]], m, a, [1, 0]);
  },
});

const slidingDown = defineTemplate({
  id: 'sm2.5.rough-plane-sliding-down',
  family: 'sm2.5.inclined-planes',
  title: 'Sliding down a rough inclined plane',
  spec: ['M8.6', 'M8.2'],
  chapter: 'SM2.5',
  sections: ['5.3'],
  level: 'A2',
  paper: [3],
  difficulty: 3,
  marks: 6,
  time: 8,
  commands: ['Find'],
  tags: ['inclined plane', 'friction', 'F = ma', 'suvat'],
  generate(r) {
    const a = pickAngle(r);
    const m = r.pick([0.5, 1, 2, 3, 4, 5]);
    const mu = Number(r.real(0.1, a.tan * 0.8, 2).toFixed(2));
    r.require(mu >= 0.05 && mu < a.tan - 0.05);
    const acc = G * (a.sin - mu * a.cos);
    const t = r.pick([1.5, 2, 2.5, 3, 4]);
    const s = 0.5 * acc * t * t;
    const A = NG(acc, U.ms2),
      S = NG(s, U.m);
    return {
      stem: md`A particle of mass $${m}$ kg is released from rest on ${angleText(a)}. The coefficient of friction between the particle and the plane is $${mu}$.`,
      diagram: { svg: planeDiagram({ angleDeg: a.deg, angleLabel: a.exact ? 'α' : `${a.deg}°`, forces: [{ kind: 'friction-up', label: 'F' }, { kind: 'normal', label: 'R' }, { kind: 'weight', label: `${m}g` }] }), alt: 'Particle on a rough plane with friction up the plane, reaction R and weight.' },
      parts: [
        part({
          label: 'a',
          marks: 4,
          prompt: 'Find the acceleration of the particle down the plane.',
          answer: A,
          scheme: [B1(md`$R = ${m}g${cosT(a)}$`), M1(md`$F = ${mu}R$`), M1(md`$${m}g${sinT(a)} - F = ${m}a$`), A1(md`$a = ${answerTex(A)}$`)],
          hints: ['Resolve perpendicular to the plane to find R, then F = μR.', 'Friction acts up the plane because the particle moves down.', md`$${m}g${sinT(a)} - ${mu} \times ${m}g${cosT(a)} = ${m}a$`],
          errors: [
            err('sin-cos-swap', NG(G * (a.cos - mu * a.sin)), 'You have swapped sin and cos: the weight component down the plane is mg sin α and R = mg cos α.', 1),
            err('friction-wrong-way', NG(G * (a.sin + mu * a.cos)), 'Friction opposes motion, so it acts up the plane here.', 2),
            err('R-mg', NG(G * (a.sin - mu)), 'On a slope R = mg cos α, not mg.', 2),
          ],
          solution: [md`$R = ${m}g${cosT(a)}$, so $F = ${mu} \times ${m}g${cosT(a)} = ${fmtSF(mu * m * G * a.cos, 4)}$`, md`$${m}g${sinT(a)} - ${fmtSF(mu * m * G * a.cos, 4)} = ${m}a \Rightarrow a = ${answerTex(A)}$`],
        }),
        part({ label: 'b', marks: 2, prompt: md`Find the distance it moves in the first $${t}$ seconds.`, answer: S, ft: (prev) => (prev.a?.value && prev.a.value > 0 ? NG(0.5 * prev.a.value * t * t) : null), scheme: [M1(md`$s = \tfrac{1}{2}a(${t})^{2}$`), A1(md`$${answerTex(S)}$`)], hints: ['From rest with constant acceleration.', 's = ut + ½at²', md`$u = 0$, $t = ${t}$`], solution: [md`$s = \tfrac{1}{2} \times ${fmtSF(acc, 4)} \times ${t}^{2} = ${answerTex(S)}$`] }),
      ],
      params: { sin: a.sin, cos: a.cos, m, mu },
    };
  },
  verify(inst) {
    const { sin, cos, m, mu } = inst.params as Record<string, number>;
    const A = { sin, cos } as Angle;
    const acc = (inst.parts[0].answer as NumericSpec).value;
    const R = m * G * cos;
    checkNewton([vScale(R, nrm(A)), [0, -m * G], vScale(mu * R, up(A))], m, -acc, up(A));
  },
});

const limiting = defineTemplate({
  id: 'sm2.5.limiting-friction-plane',
  family: 'sm2.5.friction',
  title: 'Limiting equilibrium on a rough plane: find μ',
  spec: ['M8.6'],
  chapter: 'SM2.5',
  sections: ['5.3'],
  level: 'A2',
  paper: [3],
  difficulty: 3,
  marks: 6,
  time: 8,
  commands: ['Find', 'Show that'],
  tags: ['friction', 'limiting equilibrium', 'inclined plane'],
  generate(r) {
    const a = pickAngle(r);
    const m = r.pick([1, 2, 3, 4, 5, 6]);
    const P = r.int(Math.ceil(m * G * a.sin) + 2, Math.ceil(m * G * a.sin) + 40);
    const R = m * G * a.cos;
    const F = P - m * G * a.sin;
    const mu = F / R;
    r.require(mu > 0.05 && mu < 1.2);
    const Rn = NG(R, U.N),
      Mu = NG(mu);
    return {
      stem: md`A particle of mass $${m}$ kg is on ${angleText(a)}. It is acted on by a force of $${P}$ N up a line of greatest slope, and is on the point of moving up the plane.`,
      diagram: { svg: planeDiagram({ angleDeg: a.deg, angleLabel: a.exact ? 'α' : `${a.deg}°`, forces: [{ kind: 'up', label: `${P} N` }, { kind: 'friction-down', label: 'F' }, { kind: 'normal', label: 'R' }, { kind: 'weight', label: `${m}g` }] }), alt: 'Particle on a rough plane with force up the plane, friction down the plane, reaction and weight.' },
      parts: [
        part({ label: 'a', marks: 2, prompt: 'Find the normal reaction between the particle and the plane.', answer: Rn, scheme: [M1('Resolves perpendicular to the plane'), A1(md`$R = ${m}g${cosT(a)} = ${answerTex(Rn)}$`)], hints: ['Resolve perpendicular to the plane.', 'The applied force is parallel to the plane, so it does not affect R.', md`$R = ${m}g${cosT(a)}$`], solution: [md`$R = ${m}g${cosT(a)} = ${answerTex(Rn)}$`] }),
        part({
          label: 'b',
          marks: 4,
          prompt: md`Find the coefficient of friction between the particle and the plane.`,
          answer: Mu,
          scheme: [M1('Resolves parallel to the plane; friction acts down the plane'), A1(md`$${P} = F + ${m}g${sinT(a)}$`), M1(md`$F = \mu R$ (limiting)`), A1(md`$\mu = ${answerTex(Mu)}$`)],
          hints: ['On the point of moving up: friction is limiting and acts down the plane.', md`Resolve parallel: $${P} = F + ${m}g\sin\alpha$.`, md`Then $F = \mu R$ with $R$ from part (a).`],
          errors: [err('friction-up', NG((P + m * G * a.sin) / R), 'The particle is about to move up the plane, so friction acts down the plane.', 1)],
          solution: [md`$F = ${P} - ${m}g${sinT(a)} = ${fmtSF(F, 4)}$`, md`$\mu = \dfrac{F}{R} = \dfrac{${fmtSF(F, 4)}}{${fmtSF(R, 4)}} = ${answerTex(Mu)}$`],
        }),
      ],
      params: { sin: a.sin, cos: a.cos, m, P },
    };
  },
  verify(inst) {
    const { sin, cos, m, P } = inst.params as Record<string, number>;
    const A = { sin, cos } as Angle;
    const R = (inst.parts[0].answer as NumericSpec).value,
      mu = (inst.parts[1].answer as NumericSpec).value;
    checkNewton([vScale(P, up(A)), vScale(R, nrm(A)), [0, -m * G], vScale(-mu * R, up(A))], m, 0, up(A));
  },
});

const projectedUp = defineTemplate({
  id: 'sm2.5.rough-plane-projected-up',
  family: 'sm2.5.inclined-planes',
  title: 'Projected up a rough plane: stopping distance and whether it slides back',
  spec: ['M8.6', 'M7.3'],
  chapter: 'SM2.5',
  sections: ['5.3'],
  level: 'A2',
  paper: [3],
  difficulty: 4,
  marks: 8,
  time: 10,
  commands: ['Find', 'Determine'],
  tags: ['inclined plane', 'friction', 'suvat', 'multi-stage'],
  generate(r) {
    const a = pickAngle(r);
    const m = r.pick([0.5, 1, 2, 3, 4]);
    const mu = Number(r.real(0.1, 0.9, 2).toFixed(2));
    r.require(Math.abs(mu - a.tan) > 0.06);
    const u = r.int(3, 14);
    const dec = G * (a.sin + mu * a.cos);
    const d = (u * u) / (2 * dec);
    const slides = mu < a.tan;
    const D = NG(dec, U.ms2),
      S = NG(d, U.m);
    const C = ans.choice([md`It slides back down, because $${mu} < \tan\alpha$ (the weight component down the plane exceeds the maximum friction).`, md`It remains at rest, because $${mu} \geqslant \tan\alpha$ (maximum friction can balance the weight component).`], slides ? 0 : 1);
    return {
      stem: md`A particle of mass $${m}$ kg is projected with speed $${u}$ m s$^{-1}$ up a line of greatest slope of ${angleText(a)}. The coefficient of friction between the particle and the plane is $${mu}$.`,
      diagram: { svg: planeDiagram({ angleDeg: a.deg, angleLabel: a.exact ? 'α' : `${a.deg}°`, forces: [{ kind: 'friction-down', label: 'F' }, { kind: 'normal', label: 'R' }, { kind: 'weight', label: `${m}g` }] }), alt: 'Particle moving up a rough plane with friction acting down the plane.' },
      parts: [
        part({ label: 'a', marks: 4, prompt: 'Find the deceleration of the particle as it moves up the plane.', answer: D, scheme: [B1(md`$R = ${m}g${cosT(a)}$`), M1('Friction acts down the plane, F = μR'), M1(md`$-(${m}g${sinT(a)} + F) = ${m}a$`), A1(md`Deceleration $${answerTex(D)}$`)], hints: ['Moving up the plane, both friction and the weight component act down the plane.', 'R = mg cos α and F = μR.', md`$${m}g${sinT(a)} + ${mu}${m}g${cosT(a)} = ${m} \times \text{deceleration}$`], errors: [err('friction-up', NG(G * (a.sin - mu * a.cos)), 'While moving up, friction acts down the plane (opposing motion).', 2)], solution: [md`$R = ${m}g${cosT(a)}$, $F = ${mu}R$`, md`Deceleration $= g(${sinT(a)} + ${mu}${cosT(a)}) = ${answerTex(D)}$`] }),
        part({ label: 'b', marks: 2, prompt: 'Find the distance the particle travels up the plane before coming to rest.', answer: S, ft: (prev) => (prev.a?.value && prev.a.value > 0 ? NG((u * u) / (2 * prev.a.value)) : null), scheme: [M1(md`$0 = ${u}^{2} - 2(${fmtSF(dec, 3)})s$`), A1(md`$${answerTex(S)}$`)], hints: ['Final speed 0.', 'v² = u² + 2as with a negative.', md`$s = \dfrac{${u}^{2}}{2 \times ${fmtSF(dec, 4)}}$`], solution: [md`$0 = ${u}^{2} - 2 \times ${fmtSF(dec, 4)} \times s \Rightarrow s = ${answerTex(S)}$`] }),
        part({ label: 'c', marks: 2, prompt: 'Determine whether the particle then remains at rest. Give a reason.', answer: C, scheme: [M1(md`Compares $${m}g\sin\alpha$ with $\mu R$ (or $\mu$ with $\tan\alpha$)`), A1(slides ? 'Slides back down' : 'Remains at rest')], hints: ['When it stops, friction can act either way up to μR.', 'It stays at rest if μR ⩾ mg sin α.', md`That is, if $\mu \geqslant \tan\alpha = ${fmtSF(a.tan, 3)}$.`], solution: [md`$\tan\alpha = ${fmtSF(a.tan, 3)}$ and $\mu = ${mu}$, so ${slides ? 'mg sin α > μR: it slides back down' : 'μR ⩾ mg sin α: it remains at rest'}.`] }),
      ],
      params: { sin: a.sin, cos: a.cos, m, mu, u },
    };
  },
  verify(inst) {
    const { sin, cos, m, mu, u } = inst.params as Record<string, number>;
    const A = { sin, cos } as Angle;
    const dec = (inst.parts[0].answer as NumericSpec).value;
    const R = m * G * cos;
    checkNewton([vScale(R, nrm(A)), [0, -m * G], vScale(-mu * R, up(A))], m, -dec, up(A));
    // work–energy: ½mu² = (mg sin α + μR) d
    expectClose(0.5 * m * u * u, (m * G * sin + mu * R) * (inst.parts[1].answer as NumericSpec).value, 'work–energy', 1e-9);
    expect((inst.parts[2].answer.type === 'choice' && inst.parts[2].answer.correct[0] === 0) === mu < sin / cos, 'slides decision');
  },
});

void dM1;
void B1;
void fmtNum;

const templates: Template[] = [resultant, equilibrium, smoothPlane, heldOnPlane, angledPull, slidingDown, limiting, projectedUp];
export default templates;
