/** Mechanics Year 2, Chapter 8 — vectors in kinematics: constant acceleration in 2D, and differentiating/integrating vectors. */
import { Q, surdSimplify } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, VectorSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';

const valOf = (s: ExactSpec) => evaluate(s.value);
const ij = (x: number | Q, y: number | Q) => sumTex([[x, '\\mathbf{i}'], [y, '\\mathbf{j}']]);
const vec2 = (x: number | Q, y: number | Q) => ans.vec([ans.exact(num(Q.from(x))), ans.exact(num(Q.from(y)))]);
const vals = (v: VectorSpec) => v.comps.map((c) => (c.type === 'exact' ? evaluate(c.value) : c.value));
const surdTex = (n: number) => {
  const [a, b] = surdSimplify(n);
  return b === 1 ? `${a}` : `${a === 1 ? '' : a}\\sqrt{${b}}`;
};

// ---------------------------------------------------------------- 8.1 constant acceleration with vectors
const constAccVectors = defineTemplate({
  id: 'sm2.8.constant-acceleration-vectors',
  family: 'sm2.8.vectors-in-kinematics',
  title: 'Constant acceleration in two dimensions: velocity, position, moving parallel to i',
  spec: ['M7.3', 'P10.5'],
  chapter: 'SM2.8',
  sections: ['8.1'],
  level: 'A2',
  paper: [3],
  difficulty: 3,
  marks: 7,
  time: 8,
  commands: ['Find'],
  tags: ['kinematics', 'vectors', 'constant acceleration', 'suvat'],
  generate(r) {
    const u = [r.int(-6, 8), r.intNZ(-12, 12)],
      a = [r.int(-3, 3), r.intNZ(-4, 4)];
    const r0 = [r.int(-10, 10), r.int(-10, 10)];
    const tPar = Q.of(-u[1], a[1]); // j-component of velocity zero
    r.require(tPar.value > 0 && tPar.d <= 4);
    const T = r.int(1, 6);
    const vT = [u[0] + a[0] * T, u[1] + a[1] * T];
    const rT = [r0[0] + u[0] * T + 0.5 * a[0] * T * T, r0[1] + u[1] * T + 0.5 * a[1] * T * T];
    const vx = Q.of(u[0]).add(tPar.mul(a[0]));
    const V = vec2(vT[0], vT[1]),
      Rp = vec2(Q.from(rT[0]), Q.from(rT[1])),
      Tp = ans.exact(num(tPar), undefined, { unit: '\\text{s}' }),
      Sp = ans.exact(num(vx.abs()), undefined, { unit: '\\text{m s}^{-1}' });
    return {
      stem: md`A particle $P$ moves with constant acceleration $(${ij(a[0], a[1])})$ m s$^{-2}$. At time $t = 0$ it is at the point with position vector $(${ij(r0[0], r0[1])})$ m and has velocity $(${ij(u[0], u[1])})$ m s$^{-1}$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the velocity of $P$ when $t = ${T}$.`, answer: V, scheme: [M1(md`$\mathbf{v} = \mathbf{u} + \mathbf{a}t$`), A1(md`$${ij(vT[0], vT[1])}$`)], hints: [md`$\mathbf{v} = \mathbf{u} + \mathbf{a}t$`, 'Work with i and j components separately.', md`Substitute $t = ${T}$.`], solution: [md`$\mathbf{v} = (${ij(u[0], u[1])}) + ${T}(${ij(a[0], a[1])}) = ${answerTex(V)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the position vector of $P$ when $t = ${T}$.`, answer: Rp, scheme: [M1(md`$\mathbf{r} = \mathbf{r}_{0} + \mathbf{u}t + \frac{1}{2}\mathbf{a}t^{2}$`), A1('Correct vector')], hints: [md`$\mathbf{s} = \mathbf{u}t + \frac{1}{2}\mathbf{a}t^{2}$ is the displacement.`, 'Add the starting position vector.', 'Components separately.'], solution: [md`$\mathbf{r} = (${ij(r0[0], r0[1])}) + ${T}(${ij(u[0], u[1])}) + \frac{1}{2}(${T})^{2}(${ij(a[0], a[1])}) = ${answerTex(Rp)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the time at which $P$ is moving parallel to $\mathbf{i}$.`, answer: Tp, scheme: [M1(md`$\mathbf{j}$-component of velocity $= 0$: $${u[1]} ${a[1] < 0 ? '-' : '+'} ${Math.abs(a[1])}t = 0$`), A1(md`$t = ${tPar.toLatex()}$`)], hints: ['Parallel to i means no j-component of velocity.', md`The $\mathbf{j}$-component of $\mathbf{v}$ is $${u[1]} ${a[1] < 0 ? '-' : '+'} ${Math.abs(a[1])}t$.`, 'Set it to zero.'], solution: [md`$${u[1]} ${a[1] < 0 ? '-' : '+'} ${Math.abs(a[1])}t = 0 \Rightarrow t = ${answerTex(Tp)}$`] }),
        part({ label: 'd', marks: 1, prompt: md`Find the speed of $P$ at that time.`, answer: Sp, scheme: [B1(md`$${vx.abs().toLatex()}$ m s$^{-1}$`)], hints: ['Only the i-component is left.', md`$${u[0]} + ${a[0]}t$ at that time.`, 'Speed is its magnitude.'], solution: [md`Speed $= |${u[0]} + ${a[0]} \times ${tPar.toLatex()}| = ${answerTex(Sp)}$`] }),
      ],
      params: { u, a, r0, T },
    };
  },
  verify(inst) {
    const { u, a, r0, T } = inst.params as { u: number[]; a: number[]; r0: number[]; T: number };
    const n = 20000,
      dt = T / n;
    const p = [...r0],
      v = [...u];
    for (let i = 0; i < n; i++)
      for (const k of [0, 1]) {
        p[k] += v[k] * dt + 0.5 * a[k] * dt * dt;
        v[k] += a[k] * dt;
      }
    const R = vals(inst.parts[1].answer as VectorSpec);
    expectClose(R[0] + 100, p[0] + 100, 'x');
    expectClose(R[1] + 100, p[1] + 100, 'y');
    const t = valOf(inst.parts[2].answer as ExactSpec);
    expect(Math.abs(u[1] + a[1] * t) < 1e-12, 'parallel to i');
  },
});

// ---------------------------------------------------------------- 8.4–8.5 differentiating and integrating vectors
const vectorCalculus = defineTemplate({
  id: 'sm2.8.differentiating-position-vectors',
  family: 'sm2.8.vector-calculus',
  title: 'Position vector as a function of time: velocity, acceleration, speed, direction',
  spec: ['M7.4', 'P7.2'],
  chapter: 'SM2.8',
  sections: ['8.4', '8.5'],
  level: 'A2',
  paper: [3],
  difficulty: 3,
  marks: 8,
  time: 9,
  commands: ['Find'],
  tags: ['kinematics', 'vectors', 'differentiation', 'variable acceleration'],
  generate(r) {
    const k = r.int(1, 4),
      p = 3 * k * k,
      q = r.intNZ(-4, 4),
      c = r.int(-6, 6),
      d = r.int(-5, 5);
    // r = (t³ − p t + d) i + (q t² + c) j
    const T = r.int(1, 4);
    const vT = [3 * T * T - p, 2 * q * T],
      aT = [6 * T, 2 * q];
    const xTex = sumTex([[1, 't^{3}'], [-p, 't'], [d, '']]),
      yTex = sumTex([[q, 't^{2}'], [c, '']]);
    const V = vec2(vT[0], vT[1]),
      A = vec2(aT[0], aT[1]),
      Tk = ans.exact(num(k), undefined, { unit: '\\text{s}' }),
      Sp = ans.exact(ex(surdTex(4 * q * q * k * k)), ['exact']);
    return {
      stem: md`A particle moves in a plane so that at time $t$ seconds, $t \geqslant 0$, its position vector is $\mathbf{r} = \left[(${xTex})\mathbf{i} + (${yTex})\mathbf{j}\right]$ m.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find the velocity of the particle when $t = ${T}$.`, answer: V, scheme: [M1('Differentiates each component'), A1(md`$\mathbf{v} = (3t^{2} - ${p})\mathbf{i} + ${2 * q}t\mathbf{j}$`), A1(md`$${ij(vT[0], vT[1])}$`)], hints: [md`$\mathbf{v} = \dfrac{\mathrm{d}\mathbf{r}}{\mathrm{d}t}$`, 'Differentiate the i and j components separately.', md`Substitute $t = ${T}$.`], solution: [md`$\mathbf{v} = (3t^{2} - ${p})\mathbf{i} + ${2 * q}t\mathbf{j}$`, md`At $t = ${T}$: $${answerTex(V)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the acceleration when $t = ${T}$.`, answer: A, scheme: [M1('Differentiates v'), A1(md`$${ij(aT[0], aT[1])}$`)], hints: [md`$\mathbf{a} = \dfrac{\mathrm{d}\mathbf{v}}{\mathrm{d}t}$`, 'Differentiate again.', md`Substitute $t = ${T}$.`], solution: [md`$\mathbf{a} = 6t\mathbf{i} + ${2 * q}\mathbf{j} = ${answerTex(A)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the time at which the particle is moving parallel to $\mathbf{j}$.`, answer: Tk, scheme: [M1(md`$3t^{2} - ${p} = 0$`), A1(md`$t = ${k}$`)], hints: ['Parallel to j: the i-component of velocity is zero.', md`$3t^{2} - ${p} = 0$`, 't ≥ 0, so take the positive root.'], solution: [md`$t^{2} = ${k * k} \Rightarrow t = ${answerTex(Tk)}$`] }),
        part({ label: 'd', marks: 1, prompt: md`Find the speed at that time.`, answer: Sp, scheme: [B1(md`$|${2 * q * k}| = ${Math.abs(2 * q * k)}$ m s$^{-1}$`)], hints: ['Only the j-component remains.', md`$${2 * q}t$ at $t = ${k}$`, 'Speed is positive.'], solution: [md`Speed $= ${answerTex(Sp)}$ m s$^{-1}$`] }),
      ],
      params: { p, q, c, d, T },
    };
  },
  verify(inst) {
    const { p, q, c, d, T } = inst.params as Record<string, number>;
    const R = (t: number) => [t ** 3 - p * t + d, q * t * t + c];
    const h = 1e-5;
    const V = vals(inst.parts[0].answer as VectorSpec);
    expectClose(V[0] + 50, (R(T + h)[0] - R(T - h)[0]) / (2 * h) + 50, 'vx', 1e-8);
    expectClose(V[1] + 50, (R(T + h)[1] - R(T - h)[1]) / (2 * h) + 50, 'vy', 1e-8);
    const t = valOf(inst.parts[2].answer as ExactSpec);
    expect(Math.abs(3 * t * t - p) < 1e-12, 'parallel to j');
  },
});

const templates: Template[] = [constAccVectors, vectorCalculus];
export default templates;
