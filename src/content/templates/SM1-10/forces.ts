/** Mechanics Year 1, Chapter 10 — forces and motion (Newton's laws, connected particles, pulleys). */
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { NumericSpec, VectorSpec } from '../../../engine/marking/types';
import { A1, A1ft, B1, M1, dM1, ACC_G, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import { evaluate, num } from '../../../engine/core/expr';
import type { Template } from '../../../engine/templates/types';
import { G, U, deg, forceDiagram, liftDiagram, pulleyDiagram, tableDiagram, towDiagram, vAdd, vLen } from '../shared/mech';

const NG = (v: number, unit?: string) => ans.num(v, ACC_G, unit ? { unit } : {});
const N3 = (v: number, unit?: string) => ans.num(v, { sf: 3 }, unit ? { unit } : {});
const g3 = (v: number) => fmtSF(v, 3);

const constantVelocity = defineTemplate({
  id: 'sm1.10.constant-velocity',
  family: 'sm1.10.newtons-laws',
  title: "Newton's first law: constant velocity on rough ground",
  spec: ['M8.1', 'M8.2'],
  chapter: 'SM1.10',
  sections: ['10.1', '10.3'],
  level: 'AS',
  paper: [3],
  difficulty: 1,
  marks: 4,
  time: 4,
  commands: ['Find', 'Write down'],
  tags: ['forces', "Newton's first law", 'resistance'],
  generate(r) {
    const m = r.int(5, 40);
    const T = r.int(10, 90);
    const R = m * G;
    const a = T / m;
    const ctx = r.pick(['box', 'crate', 'sledge', 'trunk']);
    const Rn = NG(R, U.N),
      F = ans.num(T, { sf: 3 }, { unit: U.N }),
      A = N3(a, U.ms2);
    return {
      stem: md`A ${ctx} of mass $${m}$ kg is pulled across rough horizontal ground at a constant speed by a horizontal rope. The tension in the rope is $${T}$ N. The ${ctx} is modelled as a particle.`,
      diagram: { svg: forceDiagram([{ angle: 0, label: `${T} N` }, { angle: 180, label: 'F' }, { angle: 90, label: 'R' }, { angle: 270, label: `${m}g` }]), alt: `Force diagram: tension ${T} N to the right, resistance F to the left, normal reaction R upwards and weight ${m}g downwards.` },
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find the normal reaction between the ${ctx} and the ground.`, answer: Rn, scheme: [B1(md`$R = ${m}g = ${g3(R)}$ N`)], hints: ['Resolve vertically: there is no vertical acceleration.', 'R balances the weight.', md`$R = ${m} \times 9.8$`], errors: [err('mass-not-weight', ans.num(m, ACC_G), 'That is the mass. The reaction balances the weight mg.')], solution: [md`Vertically: $R = ${m}g = ${answerTex(Rn)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Write down the magnitude of the resistance to motion.`, answer: F, scheme: [B1(md`$${T}$ N (constant velocity, so forces balance)`)], hints: ["Newton's first law: constant velocity means zero resultant force.", 'Horizontally the forces balance.', md`$F = ${T}$`], solution: [md`Constant speed $\Rightarrow$ resultant force is zero, so the resistance is $${answerTex(F)}$`] }),
        part({
          label: 'c',
          marks: 2,
          prompt: md`The rope breaks. Assuming the resistance is unchanged, find the deceleration of the ${ctx}.`,
          answer: A,
          scheme: [M1(md`$${T} = ${m}a$`), A1(md`$a = ${answerTex(A)}$`)],
          hints: ['Now the only horizontal force is the resistance.', 'Use F = ma.', md`$${T} = ${m}a$`],
          errors: [err('used-weight', N3(T / (m * G)), 'Use the mass in F = ma, not the weight.')],
          solution: [md`$F = ma$: $${T} = ${m}a \Rightarrow a = ${answerTex(A)}$`],
        }),
      ],
      params: { m, T },
    };
  },
  verify(inst) {
    const { m, T } = inst.params as Record<string, number>;
    const a = (inst.parts[2].answer as NumericSpec).value;
    // resultant after rope breaks: friction only, horizontal component of (F, R, W) sum
    const net = vAdd([-T, 0], [0, (inst.parts[0].answer as NumericSpec).value], [0, -m * G]);
    expectClose(net[0], -m * a, 'F = ma horizontally');
    expectClose(net[1], 0, 'vertical equilibrium', 1e-9);
  },
});

const equilibriumVectors = defineTemplate({
  id: 'sm1.10.equilibrium-vector-forces',
  family: 'sm1.10.forces-vectors',
  title: 'Equilibrium of forces given as vectors',
  spec: ['M8.1', 'M8.5'],
  chapter: 'SM1.10',
  sections: ['10.2'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 6,
  time: 7,
  commands: ['Find'],
  tags: ['forces', 'vectors', 'equilibrium', 'acceleration'],
  generate(r) {
    const f1: [number, number] = [r.intNZ(-9, 9), r.intNZ(-9, 9)];
    const f2: [number, number] = [r.intNZ(-9, 9), r.intNZ(-9, 9)];
    const f3: [number, number] = [-(f1[0] + f2[0]), -(f1[1] + f2[1])];
    r.require(f3[0] !== 0 && f3[1] !== 0);
    const m = r.pick([0.5, 2, 4, 5, 2.5]);
    const a = vLen(f3) / m;
    const vt = (v: [number, number]) => `${v[0] === 1 ? '' : v[0] === -1 ? '-' : v[0]}\\mathbf{i} ${v[1] < 0 ? '-' : '+'} ${Math.abs(v[1]) === 1 ? '' : Math.abs(v[1])}\\mathbf{j}`;
    const V: VectorSpec = ans.vec([ans.exact(num(f3[0])), ans.exact(num(f3[1]))]);
    const A = N3(a, U.ms2);
    return {
      stem: md`Three forces $\mathbf{F}_1 = (${vt(f1)})$ N, $\mathbf{F}_2 = (${vt(f2)})$ N and $\mathbf{F}_3 = (p\mathbf{i} + q\mathbf{j})$ N act on a particle $P$ of mass $${m}$ kg. The particle is in equilibrium.`,
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: md`Find $\mathbf{F}_3$.`,
          answer: V,
          scheme: [M1(md`$\mathbf{F}_1 + \mathbf{F}_2 + \mathbf{F}_3 = \mathbf{0}$`), A1(md`$p = ${f3[0]}$`), A1(md`$q = ${f3[1]}$`)],
          hints: ['In equilibrium the resultant force is zero.', md`Add the $\mathbf{i}$ components and set to zero, then the $\mathbf{j}$ components.`, md`$${f1[0]} + ${f2[0]} + p = 0$`],
          errors: [err('sign', ans.vec([ans.exact(num(-f3[0])), ans.exact(num(-f3[1]))]), 'That is the resultant of F₁ and F₂. F₃ must cancel it, so it has the opposite sign.', 1)],
          solution: [md`$\mathbf{F}_3 = -(\mathbf{F}_1 + \mathbf{F}_2) = -(${vt([f1[0] + f2[0], f1[1] + f2[1]])})$`, md`$\mathbf{F}_3 = ${answerTex(V)}$ N`],
        }),
        part({
          label: 'b',
          marks: 3,
          prompt: md`The force $\mathbf{F}_3$ is removed. Find the magnitude of the acceleration of $P$.`,
          answer: A,
          scheme: [M1(md`Resultant is $-\mathbf{F}_3$ (or $\mathbf{F}_1 + \mathbf{F}_2$)`), M1(md`$|\mathbf{F}| = ${m}a$ with $|\mathbf{F}| = \sqrt{${f3[0]}^{2} + ${f3[1]}^{2}}$`), A1(md`$a = ${answerTex(A)}$`)],
          hints: ['After removing F₃, the resultant is F₁ + F₂.', 'Find its magnitude with Pythagoras.', 'Then use F = ma.'],
          errors: [err('no-divide', N3(vLen(f3)), 'That is the magnitude of the force — divide by the mass to get the acceleration.', 2)],
          solution: [md`Resultant $= \mathbf{F}_1 + \mathbf{F}_2 = ${vt([f1[0] + f2[0], f1[1] + f2[1]])}$, magnitude $\sqrt{${f3[0] ** 2 + f3[1] ** 2}}$ N`, md`$a = \dfrac{\sqrt{${f3[0] ** 2 + f3[1] ** 2}}}{${m}} = ${answerTex(A)}$`],
        }),
      ],
      params: { f1, f2, m },
    };
  },
  verify(inst) {
    const { f1, f2, m } = inst.params as { f1: [number, number]; f2: [number, number]; m: number };
    const comps = (inst.parts[0].answer as VectorSpec).comps.map((c) => (c.type === 'exact' ? evaluate(c.value) : c.value));
    const net = vAdd(f1, f2, [comps[0], comps[1]]);
    expectClose(vLen(net), 0, 'equilibrium', 1e-12);
    expectClose((inst.parts[1].answer as NumericSpec).value * m, vLen(vAdd(f1, f2)), 'F = ma');
  },
});

const carDriving = defineTemplate({
  id: 'sm1.10.car-driving-force',
  family: 'sm1.10.f-ma',
  title: 'F = ma for a car with resistance, then suvat',
  spec: ['M8.2', 'M7.3'],
  chapter: 'SM1.10',
  sections: ['10.3'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 5,
  time: 6,
  commands: ['Find'],
  tags: ['forces', 'F = ma', 'suvat', 'resistance'],
  generate(r) {
    const m = r.step(800, 1600, 50);
    const D = r.step(1500, 4500, 100);
    const R = r.step(300, 1200, 50);
    const a = (D - R) / m;
    r.require(a > 0.3);
    const u = r.int(0, 12);
    const v = u + r.int(5, 20);
    const t = (v - u) / a;
    const A = N3(a, U.ms2),
      T = N3(t, U.s);
    return {
      stem: md`A car of mass $${m}$ kg moves along a straight horizontal road. The engine produces a constant driving force of $${D}$ N and the car experiences a constant resistance of $${R}$ N.`,
      diagram: { svg: forceDiagram([{ angle: 0, label: `${D} N` }, { angle: 180, label: `${R} N` }], false), alt: `Driving force ${D} N forwards and resistance ${R} N backwards.` },
      parts: [
        part({ label: 'a', marks: 2, prompt: 'Find the acceleration of the car.', answer: A, scheme: [M1(md`$${D} - ${R} = ${m}a$`), A1(md`$a = ${answerTex(A)}$`)], hints: ['Resultant force = driving force − resistance.', 'Use F = ma.', md`$${D} - ${R} = ${m}a$`], errors: [err('ignored-resistance', N3(D / m), 'You need the resultant force: subtract the resistance.', 1), err('added', N3((D + R) / m), 'The resistance opposes motion, so subtract it.', 1)], solution: [md`$F = ma$: $${D} - ${R} = ${m}a \Rightarrow a = ${answerTex(A)}$`] }),
        part({
          label: 'b',
          marks: 3,
          prompt: md`Find the time taken for the car's speed to increase from $${u}\text{ m s}^{-1}$ to $${v}\text{ m s}^{-1}$.`,
          answer: T,
          ft: (prev) => (prev.a?.value && prev.a.value > 0 ? N3((v - u) / prev.a.value) : null),
          scheme: [M1(md`$v = u + at$: $${v} = ${u} + at$`), A1ft('With their a'), A1(md`$t = ${answerTex(T)}$`)],
          hints: ['Acceleration is constant, so use a suvat equation.', 'You know u, v and a; you want t.', 'v = u + at'],
          solution: [md`$${v} = ${u} + ${fmtSF(a, 4)}t \Rightarrow t = ${answerTex(T)}$`],
        }),
      ],
      params: { m, D, R, u, v },
    };
  },
  verify(inst) {
    const { m, D, R, u, v } = inst.params as Record<string, number>;
    const a = (inst.parts[0].answer as NumericSpec).value;
    const t = (inst.parts[1].answer as NumericSpec).value;
    // work–energy: (D − R) × distance = ½m(v² − u²), distance = (u + v)t/2
    expectClose((D - R) * ((u + v) / 2) * t, 0.5 * m * (v * v - u * u), 'work–energy', 1e-9);
    expect(a > 0, 'accelerating');
  },
});

const verticalRope = defineTemplate({
  id: 'sm1.10.vertical-cable-tension',
  family: 'sm1.10.vertical',
  title: 'Tension in a vertical cable with acceleration',
  spec: ['M8.3', 'M8.2'],
  chapter: 'SM1.10',
  sections: ['10.3'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 3,
  time: 4,
  commands: ['Find'],
  tags: ['forces', 'weight', 'tension', 'vertical motion'],
  generate(r) {
    const m = r.int(20, 400);
    const a = r.pick([0.2, 0.4, 0.5, 0.6, 0.8, 1.2, 1.5, 2]);
    const up = r.bool();
    const accelUp = r.bool(); // accelerating upwards (or decelerating while moving down)
    const T = m * (G + (accelUp ? a : -a));
    const motion = up ? (accelUp ? `moving upwards and accelerating at $${a}$ m s$^{-2}$` : `moving upwards and decelerating at $${a}$ m s$^{-2}$`) : accelUp ? `moving downwards and decelerating at $${a}$ m s$^{-2}$` : `moving downwards and accelerating at $${a}$ m s$^{-2}$`;
    const ctx = r.pick(['crate of bricks', 'bucket of concrete', 'pallet of tiles']);
    const A = NG(T, U.N);
    return {
      stem: md`A ${ctx} of mass $${m}$ kg is attached to the end of a vertical cable. The ${ctx} is ${motion}. The ${ctx} is modelled as a particle and the cable as light and inextensible.`,
      parts: [
        part({
          marks: 3,
          prompt: md`Find the tension in the cable.`,
          answer: A,
          scheme: [M1(md`Equation of motion with tension, weight and $${m}a$`), A1(md`$T - ${m}g = ${accelUp ? '' : '-'}${m} \times ${a}$`), A1(md`$T = ${answerTex(A)}$`)],
          hints: ['Decide which way the acceleration acts (decelerating means acceleration opposite to motion).', md`Resolve vertically: $T - ${m}g = ${m}a$ with $a$ positive upwards.`, md`The acceleration is ${accelUp ? 'upwards' : 'downwards'}.`],
          errors: [err('wrong-direction', NG(m * (G + (accelUp ? -a : a))), 'Check the direction of the acceleration: decelerating means the acceleration is opposite to the motion.', 1), err('no-weight', NG(m * a), 'Include the weight mg in your equation.')],
          solution: [md`Taking upwards as positive, the acceleration is $${accelUp ? '' : '-'}${a}$ m s$^{-2}$.`, md`$T - ${m}g = ${m} \times (${accelUp ? '' : '-'}${a}) \Rightarrow T = ${answerTex(A)}$`],
        }),
      ],
      params: { m, a, accelUp },
    };
  },
  verify(inst) {
    const { m, a, accelUp } = inst.params as { m: number; a: number; accelUp: boolean };
    const T = (inst.parts[0].answer as NumericSpec).value;
    expectClose((T - m * G) / m, accelUp ? a : -a, 'acceleration recovered');
  },
});

const otherPlanet = defineTemplate({
  id: 'sm1.10.weight-and-g',
  family: 'sm1.10.vertical',
  title: 'Weight, mass and g in different places',
  spec: ['M8.3', 'M6.1'],
  chapter: 'SM1.10',
  sections: ['10.1'],
  level: 'AS',
  paper: [3],
  difficulty: 1,
  marks: 3,
  time: 3,
  commands: ['Find'],
  tags: ['weight', 'mass', 'gravity'],
  generate(r) {
    const place = r.pick([
      { name: 'the Moon', g: 1.6 },
      { name: 'Mars', g: 3.7 },
      { name: 'Jupiter', g: 24.8 },
    ]);
    const W = r.int(150, 1200);
    const m = W / G;
    const W2 = m * place.g;
    const M = NG(m, U.kg),
      W2s = ans.num(W2, { sf: 3 }, { unit: U.N });
    return {
      stem: md`An astronaut's equipment has weight $${W}$ N on Earth, where $g = 9.8$ m s$^{-2}$. On ${place.name}, the acceleration due to gravity is $${place.g}$ m s$^{-2}$.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: 'Find the mass of the equipment.', answer: M, scheme: [B1(md`$m = \dfrac{${W}}{9.8} = ${g3(m)}$ kg`)], hints: ['Weight = mass × g.', md`$${W} = 9.8m$`, 'Mass does not depend on location.'], solution: [md`$m = \dfrac{${W}}{9.8} = ${answerTex(M)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the weight of the equipment on ${place.name}.`, answer: W2s, scheme: [M1(md`$W = m \times ${place.g}$`), A1(md`$${answerTex(W2s)}$`)], hints: ['The mass is the same everywhere; the weight changes with g.', md`$W = mg$ with $g = ${place.g}$.`, md`$W = ${fmtSF(m, 4)} \times ${place.g}$`], errors: [err('same-weight', ans.num(W, { sf: 3 }), 'Weight depends on g, so it is different on another planet. Mass stays the same.')], solution: [md`$W = ${fmtSF(m, 5)} \times ${place.g} = ${answerTex(W2s)}$`] }),
      ],
      params: { W, g2: place.g },
    };
  },
  verify(inst) {
    const { W, g2 } = inst.params as Record<string, number>;
    expectClose((inst.parts[1].answer as NumericSpec).value / g2, W / G, 'same mass');
  },
});

const vectorAcceleration = defineTemplate({
  id: 'sm1.10.vector-forces-acceleration',
  family: 'sm1.10.forces-vectors',
  title: 'Acceleration from forces in vector form: magnitude and direction',
  spec: ['M8.2', 'P10.2'],
  chapter: 'SM1.10',
  sections: ['10.2', '10.4'],
  level: 'AS',
  paper: [3],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find'],
  tags: ['forces', 'vectors', 'acceleration', 'direction'],
  generate(r) {
    const m = r.pick([2, 4, 5, 0.5, 2.5, 8]);
    const f1: [number, number] = [r.intNZ(-12, 12), r.intNZ(-12, 12)];
    const f2: [number, number] = [r.intNZ(-12, 12), r.intNZ(-12, 12)];
    const F = vAdd(f1, f2);
    r.require(F[0] !== 0 && F[1] !== 0);
    const acc: [number, number] = [F[0] / m, F[1] / m];
    const mag = vLen(acc);
    const angle = deg(Math.atan(Math.abs(F[1] / F[0])));
    const vt = (v: [number, number]) => `${fmtNum(v[0])}\\mathbf{i} ${v[1] < 0 ? '-' : '+'} ${fmtNum(Math.abs(v[1]))}\\mathbf{j}`;
    const V = ans.vec([N3(acc[0]), N3(acc[1])], { unit: U.ms2 });
    const Mg = N3(mag, U.ms2);
    const Ang = ans.num(angle, { sf: 3 }, { unit: '^{\\circ}' });
    return {
      stem: md`A particle of mass $${m}$ kg moves under the action of two forces $(${vt(f1)})$ N and $(${vt(f2)})$ N, where $\mathbf{i}$ and $\mathbf{j}$ are perpendicular unit vectors.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the acceleration of the particle in the form $(a\mathbf{i} + b\mathbf{j})$ m s$^{-2}$.`, answer: V, scheme: [M1(md`Resultant $= ${vt(F)}$ and $\mathbf{F} = m\mathbf{a}$`), A1(md`$\mathbf{a} = ${vt(acc)}$`)], hints: ['Add the forces to get the resultant.', 'Then divide by the mass.', md`$\mathbf{F} = ${vt(F)}$`], solution: [md`$\mathbf{F} = ${vt(F)}$`, md`$\mathbf{a} = \dfrac{\mathbf{F}}{${m}} = ${answerTex(V)}$`] }),
        part({ label: 'b', marks: 2, prompt: 'Find the magnitude of the acceleration.', answer: Mg, scheme: [M1('Pythagoras'), A1(md`$${answerTex(Mg)}$`)], hints: ['|a| = √(a² + b²).', md`$\sqrt{(${fmtNum(acc[0])})^{2} + (${fmtNum(acc[1])})^{2}}$`, 'Use your values from part (a).'], solution: [md`$|\mathbf{a}| = \sqrt{(${fmtNum(acc[0])})^{2} + (${fmtNum(acc[1])})^{2}} = ${answerTex(Mg)}$`] }),
        part({
          label: 'c',
          marks: 2,
          prompt: md`Find the acute angle between the direction of the acceleration and the vector $\mathbf{i}$.`,
          answer: Ang,
          scheme: [M1(md`$\tan\theta = \dfrac{${fmtNum(Math.abs(F[1]))}}{${fmtNum(Math.abs(F[0]))}}$`), A1(md`$${answerTex(Ang)}$`)],
          hints: ['Draw the acceleration vector as a right-angled triangle.', 'tan θ = opposite ÷ adjacent, using the j and i components.', 'Use the sizes of the components for the acute angle.'],
          errors: [err('wrong-way-round', ans.num(90 - angle, { sf: 3 }), 'That is the angle with j. Use tan θ = (j component) ÷ (i component).')],
          solution: [md`$\tan\theta = \dfrac{${fmtNum(Math.abs(F[1]))}}{${fmtNum(Math.abs(F[0]))}} \Rightarrow \theta = ${answerTex(Ang)}$`],
        }),
      ],
      params: { f1, f2, m },
    };
  },
  verify(inst) {
    const { f1, f2, m } = inst.params as { f1: [number, number]; f2: [number, number]; m: number };
    const a = (inst.parts[0].answer as VectorSpec).comps.map((c) => (c as NumericSpec).value) as [number, number];
    const F = vAdd(f1, f2);
    expectClose(a[0] * m, F[0], 'i');
    expectClose(a[1] * m, F[1], 'j');
    const th = (inst.parts[2].answer as NumericSpec).value;
    expectClose(Math.cos((th * Math.PI) / 180), Math.abs(F[0]) / vLen(F), 'angle via cosine');
  },
});

const lift = defineTemplate({
  id: 'sm1.10.lift',
  family: 'sm1.10.connected',
  title: 'A person in an accelerating lift',
  spec: ['M8.4', 'M8.2'],
  chapter: 'SM1.10',
  sections: ['10.5'],
  level: 'AS',
  paper: [3],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find'],
  tags: ['connected particles', 'lift', 'normal reaction', "Newton's third law"],
  generate(r) {
    const M = r.step(250, 900, 50);
    const m = r.int(45, 95);
    const a = r.pick([0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 1.5]);
    const up = r.bool();
    const T = (M + m) * (G + (up ? a : -a));
    const R = m * (G + (up ? a : -a));
    const Tn = NG(T, U.N),
      Rn = NG(R, U.N);
    return {
      stem: md`A lift of mass $${M}$ kg is raised or lowered by a vertical cable. A person of mass $${m}$ kg stands on the floor of the lift. The lift is moving ${up ? 'upwards with acceleration' : 'downwards with acceleration'} $${a}$ m s$^{-2}$.`,
      diagram: { svg: liftDiagram(`lift ${M} kg, person ${m} kg`), alt: 'A lift hanging from a cable with tension T, with a person standing on the floor.' },
      parts: [
        part({ label: 'a', marks: 3, prompt: 'Find the tension in the cable.', answer: Tn, scheme: [M1(md`Whole system: $T - ${M + m}g = ${M + m} \times ${up ? '' : '(-'}${a}${up ? '' : ')'}$`), A1('Correct equation'), A1(md`$T = ${answerTex(Tn)}$`)], hints: ['Treat the lift and person as one particle.', md`Total mass $${M + m}$ kg.`, `Acceleration is ${up ? 'upwards' : 'downwards'}.`], errors: [err('lift-only', NG(M * (G + (up ? a : -a))), "Include the person's mass: the cable supports both.", 1), err('direction', NG((M + m) * (G + (up ? -a : a))), 'Check the sign of the acceleration.', 1)], solution: [md`$T - ${M + m}g = ${M + m} \times ${up ? a : -a}$`, md`$T = ${answerTex(Tn)}$`] }),
        part({ label: 'b', marks: 3, prompt: 'Find the magnitude of the force exerted on the person by the floor of the lift.', answer: Rn, scheme: [M1('Equation of motion for the person only'), A1(md`$R - ${m}g = ${m} \times ${up ? a : -a}$`), A1(md`$R = ${answerTex(Rn)}$`)], hints: ['Now consider the person alone.', 'Forces on the person: their weight and the reaction R from the floor.', md`$R - ${m}g = ${m} \times ${up ? a : -a}$`], errors: [err('weight', NG(m * G), 'The reaction is not equal to the weight when the lift accelerates.')], solution: [md`$R - ${m}g = ${m} \times ${up ? a : -a} \Rightarrow R = ${answerTex(Rn)}$`] }),
      ],
      params: { M, m, a, up },
    };
  },
  verify(inst) {
    const { M, a, up } = inst.params as { M: number; m: number; a: number; up: boolean };
    const T = (inst.parts[0].answer as NumericSpec).value,
      R = (inst.parts[1].answer as NumericSpec).value;
    // lift alone: T − Mg − R = M a  (Newton's third law: person pushes down on lift with R)
    expectClose(T - M * G - R, M * (up ? a : -a), 'lift equation', 1e-9);
  },
});

const carTrailer = defineTemplate({
  id: 'sm1.10.car-trailer',
  family: 'sm1.10.connected',
  title: 'Car towing a trailer: acceleration and tension',
  spec: ['M8.4', 'M8.2'],
  chapter: 'SM1.10',
  sections: ['10.5'],
  level: 'AS',
  paper: [3],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find'],
  tags: ['connected particles', 'tow bar', 'tension'],
  generate(r) {
    const M = r.step(900, 1500, 50),
      m = r.step(200, 700, 50);
    const rc = r.step(200, 600, 20),
      rt = r.step(80, 300, 10);
    const D = r.step(1500, 4000, 100);
    const a = (D - rc - rt) / (M + m);
    r.require(a > 0.2);
    const T = m * a + rt;
    const A = N3(a, U.ms2),
      Tn = N3(T, U.N);
    return {
      stem: md`A car of mass $${M}$ kg tows a trailer of mass $${m}$ kg along a straight horizontal road using a light, horizontal tow bar. The engine produces a driving force of $${D}$ N. The resistances to motion are $${rc}$ N on the car and $${rt}$ N on the trailer.`,
      diagram: { svg: towDiagram(`car ${M} kg`, `trailer ${m} kg`), alt: 'A car pulling a trailer to the right with driving force D.' },
      parts: [
        part({ label: 'a', marks: 3, prompt: 'Find the acceleration of the car and trailer.', answer: A, scheme: [M1('Whole system, resolving horizontally'), A1(md`$${D} - ${rc} - ${rt} = ${M + m}a$`), A1(md`$a = ${answerTex(A)}$`)], hints: ['Treat car and trailer as one: the tension is internal.', 'Subtract both resistances from the driving force.', md`$${D} - ${rc + rt} = ${M + m}a$`], errors: [err('one-resistance', N3((D - rc) / (M + m)), 'Include the resistance on the trailer too.', 1)], solution: [md`$${D} - ${rc} - ${rt} = ${M + m}a \Rightarrow a = ${answerTex(A)}$`] }),
        part({ label: 'b', marks: 3, prompt: 'Find the tension in the tow bar.', answer: Tn, ft: (prev) => (prev.a?.value ? N3(m * prev.a.value + rt) : null), scheme: [M1('Equation of motion for the trailer (or car)'), A1(md`$T - ${rt} = ${m}a$`), A1(md`$T = ${answerTex(Tn)}$`)], hints: ['Consider the trailer alone.', 'Forces on the trailer: tension forwards, resistance backwards.', md`$T - ${rt} = ${m} \times ${fmtSF(a, 4)}$`], errors: [err('no-resistance', N3(m * a), 'Include the resistance on the trailer.', 1)], solution: [md`Trailer: $T - ${rt} = ${m} \times ${fmtSF(a, 4)} \Rightarrow T = ${answerTex(Tn)}$`] }),
      ],
      params: { M, m, rc, rt, D },
    };
  },
  verify(inst) {
    const { M, rc, D } = inst.params as Record<string, number>;
    const a = (inst.parts[0].answer as NumericSpec).value,
      T = (inst.parts[1].answer as NumericSpec).value;
    expectClose(D - rc - T, M * a, 'car equation', 1e-9);
  },
});

const pulleyHanging = defineTemplate({
  id: 'sm1.10.pulley-hanging',
  family: 'sm1.10.pulleys',
  title: 'Two particles over a smooth pulley',
  spec: ['M8.4'],
  chapter: 'SM1.10',
  sections: ['10.6'],
  level: 'AS',
  paper: [3],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find'],
  tags: ['pulleys', 'connected particles', 'tension'],
  generate(r) {
    const m1 = r.step(0.5, 6, 0.5);
    const m2 = Number((m1 + r.step(0.2, 3, 0.2)).toFixed(1));
    const a = ((m2 - m1) * G) / (m1 + m2);
    const T = m1 * (G + a);
    const A = NG(a, U.ms2),
      Tn = NG(T, U.N);
    return {
      stem: md`Two particles $A$ and $B$, of masses $${m1}$ kg and $${m2}$ kg, are attached to the ends of a light inextensible string. The string passes over a smooth fixed pulley. The system is released from rest with the hanging parts of the string vertical.`,
      diagram: { svg: pulleyDiagram(`A (${m1} kg)`, `B (${m2} kg)`), alt: `Particles A of mass ${m1} kg and B of mass ${m2} kg hanging either side of a pulley.` },
      parts: [
        part({ label: 'a', marks: 4, prompt: 'Find the acceleration of the particles.', answer: A, scheme: [M1('Equation of motion for A'), M1('Equation of motion for B'), dM1('Solves for a'), A1(md`$a = ${answerTex(A)}$`)], hints: ['B is heavier, so B moves down and A moves up with the same acceleration.', md`A: $T - ${m1}g = ${m1}a$. B: $${m2}g - T = ${m2}a$.`, 'Add the equations to eliminate T.'], errors: [err('one-mass', NG(((m2 - m1) * G) / m2), md`Use the total mass $${m1 + m2}$ kg when you add the equations.`, 2)], solution: [md`$A$: $T - ${m1}g = ${m1}a$; $\quad B$: $${m2}g - T = ${m2}a$`, md`Adding: $${fmtNum(m2 - m1)}g = ${fmtNum(m1 + m2)}a \Rightarrow a = ${answerTex(A)}$`] }),
        part({ label: 'b', marks: 2, prompt: 'Find the tension in the string.', answer: Tn, ft: (prev) => (prev.a?.value ? NG(m1 * (G + prev.a.value)) : null), scheme: [M1('Substitutes a into an equation'), A1(md`$T = ${answerTex(Tn)}$`)], hints: ['Substitute your acceleration into either equation.', md`$T = ${m1}(g + a)$`, 'Use the unrounded value of a.'], errors: [err('weight', NG(m1 * G), 'The tension is more than the weight of A because A accelerates upwards.')], solution: [md`$T = ${m1}(9.8 + ${fmtSF(a, 4)}) = ${answerTex(Tn)}$`] }),
      ],
      params: { m1, m2 },
    };
  },
  verify(inst) {
    const { m1, m2 } = inst.params as Record<string, number>;
    const a = (inst.parts[0].answer as NumericSpec).value,
      T = (inst.parts[1].answer as NumericSpec).value;
    expectClose(m2 * G - T, m2 * a, 'B equation', 1e-9);
    // energy: after B falls 1 m, ½(m1 + m2)v² = (m2 − m1)g, and v² = 2a
    expectClose(0.5 * (m1 + m2) * 2 * a, (m2 - m1) * G, 'energy', 1e-9);
  },
});

const pulleyTable = defineTemplate({
  id: 'sm1.10.pulley-table',
  family: 'sm1.10.pulleys',
  title: 'Particle on a table connected to a hanging particle',
  spec: ['M8.4'],
  chapter: 'SM1.10',
  sections: ['10.6'],
  level: 'AS',
  paper: [3],
  difficulty: 4,
  marks: 8,
  time: 10,
  commands: ['Find'],
  tags: ['pulleys', 'connected particles', 'resistance'],
  generate(r) {
    const m1 = r.pick([2, 3, 4, 5, 6, 8]);
    const m2 = r.pick([1, 1.5, 2, 2.5, 3, 4]);
    const res = r.pick([0, 0, 2, 4, 5, 6, 8]);
    const a = (m2 * G - res) / (m1 + m2);
    r.require(a > 0.2);
    const T = m1 * a + res;
    const P = T * Math.SQRT2;
    const A = NG(a, U.ms2),
      Tn = NG(T, U.N),
      Pn = NG(P, U.N);
    return {
      stem: md`A particle $P$ of mass $${m1}$ kg rests on a ${res ? 'rough' : 'smooth'} horizontal table. It is attached to one end of a light inextensible string which passes over a small smooth pulley fixed at the edge of the table. A particle $Q$ of mass $${m2}$ kg hangs freely at the other end of the string. ${res ? md`A constant resistance of $${res}$ N opposes the motion of $P$. ` : ''}The system is released from rest with the string taut.`,
      diagram: { svg: tableDiagram(`P (${m1} kg)`, `Q (${m2} kg)`), alt: 'Particle P on a horizontal table attached by a string over a pulley at the edge to particle Q hanging vertically.' },
      parts: [
        part({ label: 'a', marks: 4, prompt: 'Find the acceleration of the system.', answer: A, scheme: [M1(md`$P$: $T${res ? ` - ${res}` : ''} = ${m1}a$`), M1(md`$Q$: $${m2}g - T = ${m2}a$`), dM1('Eliminates T'), A1(md`$a = ${answerTex(A)}$`)], hints: ['Write an equation of motion for each particle; they share the same acceleration and tension.', md`$Q$: $${m2}g - T = ${m2}a$`, md`$P$: $T${res ? ` - ${res}` : ''} = ${m1}a$`], errors: [err('total-weight', NG(((m1 + m2) * G - res) / (m1 + m2)), "P's weight is balanced by the table — only Q's weight drives the motion.")], solution: [md`$P$: $T${res ? ` - ${res}` : ''} = ${m1}a$; $\quad Q$: $${m2}g - T = ${m2}a$`, md`Adding: $${m2}g${res ? ` - ${res}` : ''} = ${m1 + m2}a \Rightarrow a = ${answerTex(A)}$`] }),
        part({ label: 'b', marks: 2, prompt: 'Find the tension in the string.', answer: Tn, ft: (prev) => (prev.a?.value ? NG(m1 * prev.a.value + res) : null), scheme: [M1('Substitutes a'), A1(md`$T = ${answerTex(Tn)}$`)], hints: ["Use P's equation.", md`$T = ${m1}a${res ? ` + ${res}` : ''}$`, 'Keep a unrounded.'], solution: [md`$T = ${m1} \times ${fmtSF(a, 4)}${res ? ` + ${res}` : ''} = ${answerTex(Tn)}$`] }),
        part({ label: 'c', marks: 2, prompt: 'Find the magnitude of the force exerted on the pulley by the string.', answer: Pn, ft: (prev) => (prev.b?.value ? NG(prev.b.value * Math.SQRT2) : null), scheme: [M1('Resultant of two perpendicular tensions'), A1(md`$T\sqrt{2} = ${answerTex(Pn)}$`)], hints: ['The string pulls on the pulley horizontally and vertically.', 'Both parts have tension T and they are perpendicular.', 'Magnitude = √(T² + T²).'], errors: [err('just-T', NG(T), 'The string pulls on the pulley in two directions — combine them.'), err('2T', NG(2 * T), 'The two tensions are perpendicular, so use Pythagoras, not 2T.', 1)], solution: [md`Force $= \sqrt{T^{2} + T^{2}} = T\sqrt{2} = ${answerTex(Pn)}$`] }),
      ],
      params: { m1, m2, res },
    };
  },
  verify(inst) {
    const { m1, m2, res } = inst.params as Record<string, number>;
    const a = (inst.parts[0].answer as NumericSpec).value,
      T = (inst.parts[1].answer as NumericSpec).value;
    expectClose(m2 * G - T, m2 * a, 'Q', 1e-9);
    expectClose(T - res, m1 * a, 'P', 1e-9);
  },
});

const stringBreaks = defineTemplate({
  id: 'sm1.10.pulley-hits-ground',
  family: 'sm1.10.pulleys',
  title: 'Pulley system: particle hits the ground, then free motion',
  spec: ['M8.4', 'M7.3'],
  chapter: 'SM1.10',
  sections: ['10.6'],
  level: 'AS',
  paper: [3],
  difficulty: 5,
  marks: 9,
  time: 12,
  commands: ['Find'],
  tags: ['pulleys', 'suvat', 'multi-stage', 'synoptic'],
  generate(r) {
    const m1 = r.pick([1, 1.5, 2, 2.5, 3]);
    const m2 = m1 + r.pick([0.5, 1, 1.5, 2]);
    const h = r.pick([0.6, 0.8, 1, 1.2, 1.5, 2]);
    const a = ((m2 - m1) * G) / (m1 + m2);
    const v = Math.sqrt(2 * a * h);
    const extra = (v * v) / (2 * G);
    const total = h + extra;
    const A = NG(a, U.ms2),
      V = NG(v, U.ms),
      H = NG(total, U.m);
    return {
      stem: md`Particles $A$ (mass $${m1}$ kg) and $B$ (mass $${m2}$ kg) are attached to the ends of a light inextensible string passing over a smooth fixed pulley. Initially both particles are at rest, $B$ is $${h}$ m above the ground and $A$ is well below the pulley. The system is released. When $B$ hits the ground it does not rebound, and $A$ continues to move upwards freely under gravity.`,
      diagram: { svg: pulleyDiagram(`A (${m1} kg)`, `B (${m2} kg)`), alt: 'Particles A and B hanging either side of a pulley; B is above the ground.' },
      parts: [
        part({ label: 'a', marks: 3, prompt: 'Find the acceleration of the particles before B hits the ground.', answer: A, scheme: [M1('Equations of motion for A and B'), dM1('Eliminates T'), A1(md`$a = ${answerTex(A)}$`)], hints: ['Same acceleration, same tension.', md`$T - ${m1}g = ${m1}a$, $${m2}g - T = ${m2}a$`, 'Add them.'], solution: [md`$${fmtNum(m2 - m1)}g = ${fmtNum(m1 + m2)}a \Rightarrow a = ${answerTex(A)}$`] }),
        part({ label: 'b', marks: 2, prompt: 'Find the speed of B as it hits the ground.', answer: V, ft: (prev) => (prev.a?.value && prev.a.value > 0 ? NG(Math.sqrt(2 * prev.a.value * h)) : null), scheme: [M1(md`$v^{2} = 0 + 2a(${h})$`), A1(md`$v = ${answerTex(V)}$`)], hints: ['Constant acceleration from rest over the distance B falls.', 'Use v² = u² + 2as.', md`$s = ${h}$`], solution: [md`$v^{2} = 2 \times ${fmtSF(a, 4)} \times ${h} \Rightarrow v = ${answerTex(V)}$`] }),
        part({
          label: 'c',
          marks: 4,
          prompt: 'Find the greatest height that A rises above its starting position.',
          answer: H,
          scheme: [B1(md`$A$ has risen $${h}$ m when $B$ lands`), M1(md`Free motion: $0 = v^{2} - 2g s$`), A1(md`Extra height $= ${g3(extra)}$ m`), A1(md`Total $= ${answerTex(H)}$`)],
          hints: [md`While $B$ falls $${h}$ m, $A$ rises $${h}$ m.`, 'After that, the string is slack: A moves with deceleration g.', 'Use v² = u² − 2gs with v = 0 to find the extra height, then add.'],
          errors: [err('only-extra', NG(extra), md`Add the $${h}$ m that $A$ rose before $B$ hit the ground.`, 3), err('only-h', NG(h), 'A keeps rising after B lands — find the extra height under gravity.', 1)],
          solution: [md`After $B$ lands, $A$ moves freely: $0 = ${fmtSF(v, 4)}^{2} - 2(9.8)s \Rightarrow s = ${g3(extra)}$ m`, md`Greatest height above start $= ${h} + ${g3(extra)} = ${answerTex(H)}$`],
        }),
      ],
      params: { m1, m2, h },
    };
  },
  verify(inst) {
    const { m1, m2, h } = inst.params as Record<string, number>;
    // energy method for stage 1: (m2 − m1) g h = ½ (m1 + m2) v²
    const v = Math.sqrt((2 * (m2 - m1) * G * h) / (m1 + m2));
    expectClose((inst.parts[1].answer as NumericSpec).value, v, 'speed by energy', 1e-9);
    expectClose((inst.parts[2].answer as NumericSpec).value, h + (v * v) / (2 * G), 'height by energy', 1e-9);
  },
});

const thirdLaw = defineTemplate({
  id: 'sm1.10.newtons-laws-concepts',
  family: 'sm1.10.newtons-laws',
  title: "Newton's laws: concepts",
  spec: ['M8.1', 'M8.4'],
  chapter: 'SM1.10',
  sections: ['10.1'],
  level: 'AS',
  paper: [3],
  difficulty: 1,
  marks: 3,
  time: 3,
  commands: ['State'],
  tags: ["Newton's laws", 'forces', 'modelling'],
  generate(r) {
    const obj = r.pick(['book resting on a table', 'mug resting on a shelf', 'box resting on the floor of a van moving at constant speed']);
    const pairOpts = r.shuffle([`The force of the ${obj.split(' ')[0]} pulling the Earth upwards`, `The normal reaction of the surface on the ${obj.split(' ')[0]}`, `The friction on the ${obj.split(' ')[0]}`]);
    const P = ans.choice(pairOpts, pairOpts.findIndex((o) => o.includes('Earth')));
    const lawOpts = r.shuffle(['The resultant force on it is zero.', 'There are no forces acting on it.', 'It must be accelerating slowly.']);
    const L = ans.choice(lawOpts, lawOpts.indexOf('The resultant force on it is zero.'));
    const m = r.int(2, 20);
    const R = NG(m * G, U.N);
    return {
      stem: md`A ${obj} has mass $${m}$ kg.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`By Newton's third law, which force forms a pair with the weight of the ${obj.split(' ')[0]}?`, answer: P, scheme: [B1('Pull of the object on the Earth')], hints: ['Third-law pairs act on different bodies.', 'They are the same type of force.', 'The weight is the Earth pulling the object…'], solution: ['The weight is the Earth pulling the object down; its third-law partner is the object pulling the Earth up (gravitational). The normal reaction is not its pair — both act on the same object.'] }),
        part({ label: 'b', marks: 1, prompt: md`What does Newton's first law tell you about the forces on the ${obj.split(' ')[0]}?`, answer: L, scheme: [B1('Zero resultant force')], hints: ['The object is at rest or moving at constant velocity.', 'Newton’s first law links constant velocity to the resultant force.', 'Forces can act and still cancel.'], solution: ['It is at rest or moving with constant velocity, so the resultant force is zero.'] }),
        part({ label: 'c', marks: 1, prompt: 'Find the magnitude of the normal reaction from the surface.', answer: R, scheme: [B1(md`$${g3(m * G)}$ N`)], hints: ['Vertically, the forces balance.', 'R = mg', md`$${m} \times 9.8$`], solution: [md`$R = ${m}g = ${answerTex(R)}$`] }),
      ],
      params: { m },
    };
  },
  verify(inst) {
    const { m } = inst.params as Record<string, number>;
    expectClose((inst.parts[2].answer as NumericSpec).value, m * G, 'R = mg');
  },
});

const airResistance = defineTemplate({
  id: 'sm1.10.falling-with-resistance',
  family: 'sm1.10.vertical',
  title: 'Falling with constant air resistance',
  spec: ['M8.3', 'M7.3'],
  chapter: 'SM1.10',
  sections: ['10.3'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 5,
  time: 6,
  commands: ['Find'],
  tags: ['weight', 'resistance', 'suvat'],
  generate(r) {
    const m = r.pick([0.2, 0.5, 0.8, 1.2, 2, 3, 4]);
    const R = Number((m * G * r.real(0.1, 0.6, 2)).toFixed(2));
    const a = (m * G - R) / m;
    const h = r.pick([5, 8, 10, 12, 15, 20, 25]);
    const v = Math.sqrt(2 * a * h);
    const A = NG(a, U.ms2),
      V = NG(v, U.ms);
    const ctx = r.pick(['stone', 'small parcel', 'ball']);
    return {
      stem: md`A ${ctx} of mass $${m}$ kg is dropped from rest from a height of $${h}$ m above the ground. As it falls it experiences a constant air resistance of $${R}$ N.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find the acceleration of the ${ctx}.`, answer: A, scheme: [M1(md`$${m}g - ${R} = ${m}a$`), A1('Correct equation'), A1(md`$a = ${answerTex(A)}$`)], hints: ['Forces: weight down, resistance up.', 'Resultant = mg − R.', md`$${m}g - ${R} = ${m}a$`], errors: [err('free-fall', NG(G), 'With air resistance the acceleration is less than g.'), err('added', NG((m * G + R) / m), 'Air resistance opposes the motion, so subtract it.', 1)], solution: [md`$${m}g - ${R} = ${m}a \Rightarrow a = ${answerTex(A)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the speed of the ${ctx} as it hits the ground.`, answer: V, ft: (prev) => (prev.a?.value && prev.a.value > 0 ? NG(Math.sqrt(2 * prev.a.value * h)) : null), scheme: [M1(md`$v^{2} = 2a(${h})$`), A1(md`$${answerTex(V)}$`)], hints: ['Constant acceleration from rest.', 'v² = u² + 2as', md`$u = 0$, $s = ${h}$`], solution: [md`$v^{2} = 2 \times ${fmtSF(a, 4)} \times ${h} \Rightarrow v = ${answerTex(V)}$`] }),
      ],
      params: { m, R, h },
    };
  },
  verify(inst) {
    const { m, R, h } = inst.params as Record<string, number>;
    // work–energy: (mg − R)h = ½mv²
    const v = (inst.parts[1].answer as NumericSpec).value;
    expectClose((m * G - R) * h, 0.5 * m * v * v, 'work–energy', 1e-9);
  },
});

const templates: Template[] = [constantVelocity, equilibriumVectors, carDriving, verticalRope, otherPlanet, vectorAcceleration, lift, carTrailer, pulleyHanging, pulleyTable, stringBreaks, thirdLaw, airResistance];
export default templates;
