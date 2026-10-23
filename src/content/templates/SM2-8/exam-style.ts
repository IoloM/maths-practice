/** Mechanics Year 2, Chapter 8 — long exam-style question: velocity as a vector function of time, using calculus. */
import { Q } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose, integrate } from '../../../engine/core/numeric';
import { fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, NumericSpec, VectorSpec } from '../../../engine/marking/types';
import { A1, ACC_G, B1, M1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { sumTex } from '../shared/calculus';

const ij = (x: number | Q, y: number | Q) => sumTex([[x, '\\mathbf{i}'], [y, '\\mathbf{j}']]);
const vec2 = (x: number | Q, y: number | Q) => ans.vec([ans.exact(num(Q.from(x))), ans.exact(num(Q.from(y)))]);
const vals = (v: VectorSpec) => v.comps.map((c) => (c.type === 'exact' ? evaluate(c.value) : c.value));

const vectorCalculus = defineTemplate({
  id: 'sm2.8.long-velocity-vector-calculus',
  family: 'sm2.8.exam-style',
  title: 'Exam-style: a velocity vector in t — acceleration, direction, speed and position by integration',
  spec: ['M7.4', 'P10.4'],
  chapter: 'SM2.8',
  sections: ['8.4', '8.5'],
  level: 'A2',
  paper: [3],
  difficulty: 4,
  marks: 12,
  time: 15,
  commands: ['Find'],
  tags: ['exam-style', 'vectors', 'variable acceleration', 'differentiation', 'integration'],
  generate(r) {
    const p = r.int(1, 4),
      q = r.intNZ(-6, 6),
      k = r.int(2, 6);
    const x0 = r.int(-5, 5),
      y0 = r.int(-5, 5);
    const t1 = r.int(1, 5);
    const T = r.pick([2, 3, 4, 6]);
    r.require(p * k + q !== 0 && t1 !== k / 2);
    const vTex = `(${sumTex([[p, 't'], [q, '']])})\\mathbf{i} + (${sumTex([[1, 't^{2}'], [-k, 't']])})\\mathbf{j}`;
    const r0Tex = x0 === 0 && y0 === 0 ? '\\mathbf{0}' : ij(x0, y0);
    const A: VectorSpec = vec2(p, 2 * t1 - k);
    const K: ExactSpec = ans.exact(num(Q.of(k)));
    const S: ExactSpec = ans.exact(num(Q.of(Math.abs(p * k + q))));
    const rx = Q.of(p * T * T, 2).add(q * T).add(x0),
      ry = Q.of(T ** 3, 3).sub(Q.of(k * T * T, 2)).add(y0);
    const R: VectorSpec = vec2(rx, ry);
    const dist = Math.hypot(rx.value, ry.value);
    const DIST: NumericSpec = ans.num(dist, { sf: 3 });
    const rTex = `\\left(${sumTex([[Q.of(p, 2), 't^{2}'], [q, 't'], [x0, '']])}\\right)\\mathbf{i} + \\left(${sumTex([[Q.of(1, 3), 't^{3}'], [Q.of(-k, 2), 't^{2}'], [y0, '']])}\\right)\\mathbf{j}`;
    return {
      stem: md`A particle $P$ moves in a horizontal plane. At time $t$ seconds, $t \geqslant 0$, its velocity is $\mathbf{v} = ${vTex}$ m s$^{-1}$. When $t = 0$, $P$ is at the point with position vector $(${r0Tex})$ m relative to a fixed origin $O$.`,
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: md`Find the acceleration of $P$ when $t = ${t1}$.`,
          answer: A,
          scheme: [M1('Differentiates v with respect to t'), A1(md`$\mathbf{a} = ${p}\mathbf{i} + (2t - ${k})\mathbf{j}$`), A1(md`$${answerTex(A)}$ m s$^{-2}$`)],
          hints: [md`$\mathbf{a} = \dfrac{\mathrm{d}\mathbf{v}}{\mathrm{d}t}$: differentiate each component.`, md`$\mathbf{a} = ${p}\mathbf{i} + (2t - ${k})\mathbf{j}$`, md`Substitute $t = ${t1}$.`],
          errors: [err('velocity-not-acceleration', vec2(p * t1 + q, t1 * t1 - k * t1), 'That is the velocity at that time: differentiate to get the acceleration.', 0)],
          solution: [md`$\mathbf{a} = \dfrac{\mathrm{d}\mathbf{v}}{\mathrm{d}t} = ${p}\mathbf{i} + (2t - ${k})\mathbf{j}$`, md`At $t = ${t1}$: $\mathbf{a} = ${answerTex(A)}$`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Find the value of $t$, with $t > 0$, at which $P$ is moving parallel to $\mathbf{i}$.`,
          answer: K,
          scheme: [M1(md`Sets the $\mathbf{j}$ component to zero: $t^{2} - ${k}t = 0$`), A1(md`$t = ${k}$`)],
          hints: [md`Moving parallel to $\mathbf{i}$ means no $\mathbf{j}$ component of velocity.`, md`$t^{2} - ${k}t = 0$`, 'Factorise; t > 0.'],
          solution: [md`$t(t - ${k}) = 0 \Rightarrow t = ${k}$ (since $t > 0$)`],
        }),
        part({
          label: 'c',
          marks: 2,
          prompt: 'Find the speed of P at this time.',
          answer: S,
          scheme: [M1(md`Substitutes $t = ${k}$ into the $\mathbf{i}$ component`), A1(md`$${Math.abs(p * k + q)}$ m s$^{-1}$`)],
          hints: [md`Substitute $t = ${k}$ into the $\mathbf{i}$ component, $${sumTex([[p, 't'], [q, '']])}$.`, 'Speed is the magnitude of velocity (always positive).', 'Only the i component is non-zero here.'],
          solution: [md`$\mathbf{v} = ${ij(p * k + q, 0)}$, so the speed is $${answerTex(S)}$ m s$^{-1}$`],
        }),
        part({
          label: 'd',
          marks: 4,
          prompt: md`Find the position vector of $P$ when $t = ${T}$.`,
          answer: R,
          scheme: [M1('Integrates v with respect to t'), A1('Both components correct (before the constant)'), M1(md`Uses $\mathbf{r} = ${r0Tex}$ at $t = 0$ for the constant`), A1(md`$${answerTex(R)}$ m`)],
          hints: [md`$\mathbf{r} = \displaystyle\int \mathbf{v}\,\mathrm{d}t + \mathbf{c}$`, md`$\mathbf{r} = \left(${sumTex([[Q.of(p, 2), 't^{2}'], [q, 't']])}\right)\mathbf{i} + \left(${sumTex([[Q.of(1, 3), 't^{3}'], [Q.of(-k, 2), 't^{2}']])}\right)\mathbf{j} + \mathbf{c}$`, md`$\mathbf{c}$ is the position at $t = 0$; then substitute $t = ${T}$.`],
          errors: [err('no-constant', vec2(rx.sub(x0), ry.sub(y0)), md`Add the constant of integration: $P$ starts at $${r0Tex}$, not at $O$.`, 2)],
          solution: [md`$\mathbf{r} = ${rTex}$`, md`At $t = ${T}$: $\mathbf{r} = ${answerTex(R)}$`],
        }),
        part({
          label: 'e',
          marks: 1,
          prompt: md`Find the distance of $P$ from $O$ when $t = ${T}$.`,
          answer: DIST,
          ft: (prev) => {
            const v = prev.d?.values;
            return v && v.length === 2 ? ans.num(Math.hypot(v[0], v[1]), ACC_G) : null;
          },
          scheme: [B1(md`$\sqrt{(${rx.toLatex()})^{2} + (${ry.toLatex()})^{2}} = ${fmtSF(dist, 3)}$ m`)],
          hints: ['Distance is the magnitude of the position vector.', 'Use Pythagoras on the two components.', 'Give 3 significant figures.'],
          solution: [md`$|\mathbf{r}| = \sqrt{(${rx.toLatex()})^{2} + (${ry.toLatex()})^{2}} = ${answerTex(DIST)}$ m`],
        }),
      ],
      params: { p, q, k, x0, y0, t1, T },
    };
  },
  verify(inst) {
    const { p, q, k, x0, y0, t1, T } = inst.params as Record<string, number>;
    const vx = (t: number) => p * t + q,
      vy = (t: number) => t * t - k * t;
    const h = 1e-5;
    const a = vals(inst.parts[0].answer as VectorSpec);
    expectClose(a[0], (vx(t1 + h) - vx(t1 - h)) / (2 * h), 'a_x', 1e-6);
    expect(Math.abs(a[1] - (vy(t1 + h) - vy(t1 - h)) / (2 * h)) < 1e-6, 'a_y');
    const tk = evaluate((inst.parts[1].answer as ExactSpec).value);
    expect(tk > 0 && Math.abs(vy(tk)) < 1e-12, 'parallel to i');
    expectClose(evaluate((inst.parts[2].answer as ExactSpec).value), Math.hypot(vx(tk), vy(tk)), 'speed');
    const rr = vals(inst.parts[3].answer as VectorSpec);
    expectClose(rr[0], x0 + integrate(vx, 0, T), 'r_x');
    expect(Math.abs(rr[1] - (y0 + integrate(vy, 0, T))) < 1e-9, 'r_y');
    expectClose((inst.parts[4].answer as NumericSpec).value, Math.hypot(rr[0], rr[1]), 'distance');
  },
});

const templates: Template[] = [vectorCalculus];
export default templates;
