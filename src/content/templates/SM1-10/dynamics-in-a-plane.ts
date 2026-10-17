/** Mechanics Year 1, Chapter 10 — forces as vectors and motion in two dimensions (dynamics in a plane). */
import { Q, surdSimplify } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { expectClose } from '../../../engine/core/numeric';
import { fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, NumericSpec, VectorSpec } from '../../../engine/marking/types';
import { A1, M1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';
import { forceDiagram } from '../shared/mech';

const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
const ij = (x: number | Q, y: number | Q) => sumTex([[x, '\\mathbf{i}'], [y, '\\mathbf{j}']]);
const vec2 = (x: number | Q, y: number | Q) => ans.vec([ans.exact(num(Q.from(x))), ans.exact(num(Q.from(y)))]);
const vals = (v: VectorSpec) => v.comps.map((c) => (c.type === 'exact' ? evaluate(c.value) : c.value));
const D = Math.PI / 180;

const vectorForces = defineTemplate({
  id: 'sm1.10.forces-as-vectors-acceleration',
  family: 'sm1.10.dynamics-in-a-plane',
  title: 'Forces in i, j form: acceleration vector, its magnitude and direction, and velocity',
  spec: ['M8.5', 'M7.3'],
  chapter: 'SM1.10',
  sections: ['10.2', '10.4'],
  level: 'AS',
  paper: [3],
  difficulty: 3,
  marks: 8,
  time: 9,
  commands: ['Find'],
  tags: ['forces', 'vectors', "Newton's second law", 'acceleration', 'direction'],
  generate(r) {
    const m = r.pick([0.5, 2, 4, 5]);
    const a = [r.intNZ(-6, 6), r.intNZ(-6, 6)];
    const F = [a[0] * m, a[1] * m];
    const F1 = [r.int(-10, 12), r.int(-10, 12)];
    const F2 = [F[0] - F1[0], F[1] - F1[1]];
    const T = r.int(2, 6);
    const u = r.pick([[0, 0], [2, -1], [-3, 4], [1, 2]]);
    const vT = [u[0] + a[0] * T, u[1] + a[1] * T];
    const [k, s] = surdSimplify(a[0] * a[0] + a[1] * a[1]);
    const Av = vec2(a[0], a[1]),
      Am = ans.exact(ex(s === 1 ? `${k}` : `${k === 1 ? '' : k}\\sqrt{${s}}`), ['exact'], { unit: '\\text{m s}^{-2}' }),
      ang = ((Math.atan2(a[1], a[0]) / D) + 360) % 360,
      An = ans.num(ang > 180 ? ang - 360 : ang, { dp: 1 }, { unit: '^{\\circ}', alts: [ang] }),
      Vv = vec2(vT[0], vT[1]);
    return {
      stem: md`Two forces $\mathbf{F}_{1} = (${ij(F1[0], F1[1])})$ N and $\mathbf{F}_{2} = (${ij(F2[0], F2[1])})$ N act on a particle $P$ of mass $${m}$ kg. ${u[0] || u[1] ? md`At time $t = 0$ the velocity of $P$ is $(${ij(u[0], u[1])})$ m s$^{-1}$.` : 'P starts from rest.'}`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the acceleration of $P$ as a vector.`, answer: Av, scheme: [M1(md`$\mathbf{F}_{1} + \mathbf{F}_{2} = m\mathbf{a}$`), A1(md`$${ij(a[0], a[1])}$`)], hints: ['Add the forces to get the resultant.', md`Resultant $= ${ij(F[0], F[1])}$ N`, md`Divide by the mass $${m}$.`], errors: [err('not-divided', vec2(F[0], F[1]), 'That is the resultant force — divide by the mass to get the acceleration.', 1)], solution: [md`$\mathbf{R} = ${ij(F[0], F[1])}$, so $\mathbf{a} = \dfrac{\mathbf{R}}{${m}} = ${answerTex(Av)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the exact magnitude of the acceleration.`, answer: Am, scheme: [M1('Pythagoras on their acceleration'), A1(md`$${answerTex(Am)}$`)], hints: ['Magnitude of a vector: √(x² + y²).', md`$\sqrt{${a[0] * a[0]} + ${a[1] * a[1]}}$`, 'Simplify the surd.'], solution: [md`$|\mathbf{a}| = \sqrt{${a[0] * a[0] + a[1] * a[1]}} = ${answerTex(Am)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the angle between the acceleration and the vector $\mathbf{i}$, measured anticlockwise from $\mathbf{i}$, to 1 decimal place.`, answer: An, scheme: [M1('Uses tan with the components'), A1(md`$${(ang > 180 ? ang - 360 : ang).toFixed(1)}^{\circ}$ (or $${ang.toFixed(1)}^{\circ}$)`)], hints: ['Sketch the acceleration vector.', md`Reference angle $\tan^{-1}\left|\dfrac{${a[1]}}{${a[0]}}\right|$`, 'Adjust for the quadrant.'], solution: [md`Angle $= ${answerTex(An)}$`] }),
        part({ label: 'd', marks: 2, prompt: md`Find the velocity of $P$ when $t = ${T}$.`, answer: Vv, scheme: [M1(md`$\mathbf{v} = \mathbf{u} + \mathbf{a}t$`), A1(md`$${ij(vT[0], vT[1])}$`)], hints: ['The acceleration is constant.', md`$\mathbf{v} = \mathbf{u} + \mathbf{a}t$`, md`$t = ${T}$`], solution: [md`$\mathbf{v} = (${ij(u[0], u[1])}) + ${T}(${ij(a[0], a[1])}) = ${answerTex(Vv)}$`.replace('(0) + ', '')] }),
      ],
      params: { m, F1, F2, u, T },
    };
  },
  verify(inst) {
    const { m, F1, F2, u, T } = inst.params as { m: number; F1: number[]; F2: number[]; u: number[]; T: number };
    const a = vals(inst.parts[0].answer as VectorSpec);
    expectClose(a[0] * m + 100, F1[0] + F2[0] + 100, 'F = ma (i)');
    expectClose(a[1] * m + 100, F1[1] + F2[1] + 100, 'F = ma (j)');
    const ang = valOf(inst.parts[2].answer as NumericSpec) * D;
    const mag = valOf(inst.parts[1].answer as ExactSpec);
    expectClose(mag * Math.cos(ang) + 50, a[0] + 50, 'direction');
    const v = vals(inst.parts[3].answer as VectorSpec);
    expectClose(v[0] + 50, u[0] + a[0] * T + 50, 'velocity');
  },
});

const ANG = [0, 30, 45, 60, 90, 120, 135, 150, 210, 225, 240, 270, 300, 315, 330];

const resultant = defineTemplate({
  id: 'sm1.10.resultant-of-forces-at-angles',
  family: 'sm1.10.dynamics-in-a-plane',
  title: 'Resultant of three coplanar forces by resolving; resulting acceleration',
  spec: ['M8.5', 'M8.2', 'P5.9'],
  chapter: 'SM1.10',
  sections: ['10.2', '10.4'],
  level: 'AS',
  paper: [3],
  difficulty: 3,
  marks: 7,
  time: 9,
  commands: ['Find'],
  tags: ['forces', 'resolving', 'resultant', "Newton's second law", 'diagram'],
  generate(r) {
    const angs = r.shuffle(ANG).slice(0, 3).sort((x, y) => x - y);
    const mags = angs.map(() => r.int(2, 20));
    const X = mags.reduce((s, f, i) => s + f * Math.cos(angs[i] * D), 0),
      Y = mags.reduce((s, f, i) => s + f * Math.sin(angs[i] * D), 0);
    const R = Math.hypot(X, Y);
    r.require(R > 1);
    const th = ((Math.atan2(Y, X) / D) + 360) % 360;
    const m = r.pick([0.5, 1.5, 2, 2.5, 4]);
    const Rs = ans.num(R, { sf: 3 }, { unit: '\\text{N}' }),
      Th = ans.num(th, { dp: 1 }, { unit: '^{\\circ}', alts: [th - 360] }),
      Ac = ans.num(R / m, { sf: 3 }, { unit: '\\text{m s}^{-2}' });
    const labels = mags.map((f) => `${f} N`);
    const svg = forceDiagram(angs.map((a, i) => ({ angle: a, label: labels[i] })));
    const desc = angs.map((a, i) => md`$${mags[i]}$ N at $${a}^{\circ}$`).join(', ');
    return {
      stem: md`Three forces act on a particle of mass $${m}$ kg, as shown. Their magnitudes and directions (measured anticlockwise from the positive $x$-direction) are ${desc}.`,
      diagram: { svg, alt: `Three forces on a particle: ${angs.map((a, i) => `${mags[i]} N at ${a} degrees`).join(', ')}.` },
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find the magnitude of the resultant force.`, answer: Rs, scheme: [M1('Resolves all three forces horizontally'), M1('Resolves all three forces vertically'), A1(md`$${fmtSF(R, 3)}$ N`)], hints: ['Resolve each force into x and y components: F cos θ and F sin θ.', md`$\sum F_{x} = ${fmtSF(X, 4)}$, $\sum F_{y} = ${fmtSF(Y, 4)}$`, 'Combine with Pythagoras.'], errors: [err('added-magnitudes', ans.num(mags.reduce((s, f) => s + f, 0), { sf: 3 }), 'Forces are vectors: resolve them before adding.')], solution: [md`$X = ${fmtSF(X, 4)}$, $Y = ${fmtSF(Y, 4)}$`, md`$|\mathbf{R}| = \sqrt{X^{2} + Y^{2}} = ${answerTex(Rs)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the direction of the resultant force, as an angle measured anticlockwise from the positive $x$-direction, to 1 decimal place.`, answer: Th, scheme: [M1('tan⁻¹ of their components with the correct quadrant'), A1(md`$${th.toFixed(1)}^{\circ}$`)], hints: ['Use your X and Y.', md`Reference angle $\tan^{-1}\left|\dfrac{Y}{X}\right|$`, 'Use the signs of X and Y to choose the quadrant.'], solution: [md`$\theta = ${answerTex(Th)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the magnitude of the acceleration of the particle.`, answer: Ac, scheme: [M1(md`$a = \dfrac{R}{m}$`), A1(md`$${fmtSF(R / m, 3)}$ m s$^{-2}$`)], hints: ["Newton's second law: F = ma.", 'Use the resultant force.', md`$m = ${m}$`], solution: [md`$a = \dfrac{${fmtSF(R, 4)}}{${m}} = ${answerTex(Ac)}$`] }),
      ],
      params: { angs, mags, m },
    };
  },
  verify(inst) {
    const { angs, mags } = inst.params as { angs: number[]; mags: number[] };
    // sum of the three vectors via complex-number style rotation
    let x = 0,
      y = 0;
    angs.forEach((a, i) => {
      x += mags[i] * Math.cos((a * Math.PI) / 180);
      y += mags[i] * Math.sin((a * Math.PI) / 180);
    });
    expectClose(valOf(inst.parts[0].answer as NumericSpec), Math.hypot(x, y), 'magnitude');
    const th = (valOf(inst.parts[1].answer as NumericSpec) * Math.PI) / 180;
    expectClose(Math.hypot(x, y) * Math.cos(th) + 100, x + 100, 'direction', 1e-9);
  },
});

const templates: Template[] = [vectorForces, resultant];
export default templates;
