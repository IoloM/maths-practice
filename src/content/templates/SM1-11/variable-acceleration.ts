/** Mechanics Year 1, Chapter 11 — variable acceleration: differentiation and integration in kinematics. */
import { Q } from '../../../engine/core/rational';
import { Poly } from '../../../engine/core/poly';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, ExprSpec, ListSpec } from '../../../engine/marking/types';
import { A1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';

const valOf = (s: ExactSpec) => evaluate(s.value);
const exq = (q: Q | number, unit?: string) => ans.exact(num(Q.from(q)), undefined, unit ? { unit } : {});

const fromDisplacement = defineTemplate({
  id: 'sm1.11.displacement-polynomial-in-t',
  family: 'sm1.11.differentiation',
  title: 'Displacement as a cubic in t: velocity, rest times, acceleration and distance',
  spec: ['M7.4', 'P7.3'],
  chapter: 'SM1.11',
  sections: ['11.1', '11.2', '11.3'],
  level: 'AS',
  paper: [3],
  difficulty: 3,
  marks: 9,
  time: 11,
  commands: ['Find'],
  tags: ['kinematics', 'variable acceleration', 'differentiation', 'distance'],
  generate(r) {
    let p: number, q: number;
    do {
      p = r.int(1, 5);
      q = p + r.int(1, 5);
    } while ((p + q) % 2 !== 0);
    const s0 = r.pick([0, 0, 2, 5, -4]);
    // v = 3(t − p)(t − q)  ⇒  s = t³ − (3/2)(p + q)t² + 3pq t + s0
    const V = Poly.fromRoots([p, q], 3);
    const S = V.integ().add(Poly.coeffs([s0]));
    const T = r.int(q + 1, q + 3);
    const aT = V.diff().evalQ(T);
    const dist = S.evalQ(p).sub(S.evalQ(0)).abs().add(S.evalQ(q).sub(S.evalQ(p)).abs());
    const Vs: ExprSpec = ans.expr(V.toExpr('t'), ['t']);
    const L: ListSpec = ans.list([ans.exact(num(p)), ans.exact(num(q))], { v: 't' });
    const A = exq(aT, '\\text{m s}^{-2}'),
      D = exq(dist, '\\text{m}');
    return {
      stem: md`A particle $P$ moves along a straight line. Its displacement from a fixed point $O$ at time $t$ seconds is $s$ metres, where $s = ${S.toLatex({ v: 't' })}$, $t \geqslant 0$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find an expression for the velocity of $P$ at time $t$.`, answer: Vs, scheme: [M1(md`Differentiates: $v = \dfrac{\mathrm{d}s}{\mathrm{d}t}$`), A1(md`$v = ${V.toLatex({ v: 't' })}$`)], hints: [md`$v = \dfrac{\mathrm{d}s}{\mathrm{d}t}$`, 'Differentiate each term with respect to t.', 'The constant term disappears.'], solution: [md`$v = ${answerTex(Vs)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the values of $t$ at which $P$ is instantaneously at rest.`, answer: L, scheme: [M1('Sets v = 0 and solves'), A1(md`$t = ${p}$ and $t = ${q}$`)], hints: ['At rest means v = 0.', md`$${V.toLatex({ v: 't' })} = 0$`, 'Divide by 3 and factorise.'], solution: [md`$3(t - ${p})(t - ${q}) = 0 \Rightarrow ${answerTex(L)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the acceleration of $P$ when $t = ${T}$.`, answer: A, scheme: [M1(md`$a = \dfrac{\mathrm{d}v}{\mathrm{d}t} = ${V.diff().toLatex({ v: 't' })}$`), A1(md`$${aT.toLatex()}$ m s$^{-2}$`)], hints: [md`$a = \dfrac{\mathrm{d}v}{\mathrm{d}t}$`, 'Differentiate your velocity.', md`Substitute $t = ${T}$.`], solution: [md`$a = ${V.diff().toLatex({ v: 't' })}$; at $t = ${T}$, $a = ${answerTex(A)}$`] }),
        part({ label: 'd', marks: 3, prompt: md`Find the total distance travelled by $P$ in the first $${q}$ seconds.`, answer: D, scheme: [M1(md`Evaluates $s$ at $t = 0, ${p}, ${q}$`), dM1('Adds the distances on each interval (allowing for the change of direction)'), A1(md`$${dist.toLatex()}$ m`)], hints: [md`$P$ changes direction at $t = ${p}$.`, md`Find $s(0)$, $s(${p})$ and $s(${q})$.`, 'Distance = |s(p) − s(0)| + |s(q) − s(p)|.'], errors: [err('net-displacement', exq(S.evalQ(q).sub(S.evalQ(0)).abs()), 'That is the displacement; P turns round, so add the separate distances.', 1)], solution: [md`$s(0) = ${S.evalQ(0).toLatex()}$, $s(${p}) = ${S.evalQ(p).toLatex()}$, $s(${q}) = ${S.evalQ(q).toLatex()}$`, md`Distance $= ${answerTex(D)}$`] }),
      ],
      params: { p, q, s0, T },
    };
  },
  verify(inst) {
    const { p, q, s0, T } = inst.params as Record<string, number>;
    const s = (t: number) => t ** 3 - 1.5 * (p + q) * t * t + 3 * p * q * t + s0;
    let d = 0;
    const n = 100000;
    for (let i = 0; i < n; i++) d += Math.abs(s(((i + 1) * q) / n) - s((i * q) / n));
    expectClose(valOf(inst.parts[3].answer as ExactSpec), d, 'distance', 1e-6);
    const h = 1e-4;
    expectClose(valOf(inst.parts[2].answer as ExactSpec), (s(T + h) - 2 * s(T) + s(T - h)) / (h * h), 'acceleration', 1e-4);
  },
});

const fromAcceleration = defineTemplate({
  id: 'sm1.11.integrate-acceleration',
  family: 'sm1.11.integration',
  title: 'Integrate acceleration to find velocity and displacement',
  spec: ['M7.4', 'P8.2'],
  chapter: 'SM1.11',
  sections: ['11.4'],
  level: 'AS',
  paper: [3],
  difficulty: 3,
  marks: 8,
  time: 9,
  commands: ['Find', 'Show that'],
  tags: ['kinematics', 'variable acceleration', 'integration', 'constants of integration'],
  generate(r) {
    const c = r.pick([2, 4, 6]),
      k = r.int(1, 12),
      u = r.int(0, 10);
    // a = c t − k ; v = (c/2)t² − k t + u ; s = (c/6)t³ − (k/2)t² + u t
    const A = Poly.coeffs([-k, c]);
    const V = A.integ().add(Poly.coeffs([u]));
    const S = V.integ();
    const T = r.int(2, 6);
    const tMin = Q.of(k, c);
    const vMin = V.evalQ(tMin);
    const Vs: ExprSpec = ans.expr(V.toExpr('t'), ['t']);
    const Sd = exq(S.evalQ(T), '\\text{m}'),
      Vm = exq(vMin, '\\text{m s}^{-1}');
    return {
      stem: md`A particle moves along a straight line. At time $t$ seconds its acceleration is $(${A.toLatex({ v: 't' })})$ m s$^{-2}$. When $t = 0$ the particle is at the origin $O$ and its velocity is $${u}$ m s$^{-1}$.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find an expression for the velocity at time $t$.`, answer: Vs, scheme: [M1('Integrates the acceleration'), M1(md`Uses $v = ${u}$ at $t = 0$ to find the constant`), A1(md`$v = ${V.toLatex({ v: 't' })}$`)], hints: [md`$v = \displaystyle\int a\,\mathrm{d}t$`, 'Remember the constant of integration.', md`Use $v = ${u}$ when $t = 0$.`], errors: u === 0 ? [] : [err('no-constant', ans.expr(A.integ().toExpr('t'), ['t']), md`You need the constant of integration: $v = ${u}$ when $t = 0$.`, 2)], solution: [md`$v = ${V.toLatex({ v: 't' })}$ (constant $= ${u}$)`] }),
        part({ label: 'b', marks: 3, prompt: md`Find the displacement from $O$ when $t = ${T}$.`, answer: Sd, scheme: [M1('Integrates their velocity'), M1('Uses s = 0 at t = 0'), A1(md`$${S.evalQ(T).toLatex()}$ m`)], hints: [md`$s = \displaystyle\int v\,\mathrm{d}t$`, 'The constant is 0 because the particle starts at O.', md`Substitute $t = ${T}$.`], solution: [md`$s = ${S.toLatex({ v: 't' })}$`, md`At $t = ${T}$: $s = ${answerTex(Sd)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the minimum velocity of the particle.`, answer: Vm, scheme: [M1(md`$a = 0 \Rightarrow t = ${tMin.toLatex()}$`), A1(md`$v = ${vMin.toLatex()}$ m s$^{-1}$`)], hints: ['Minimum velocity occurs where dv/dt = a = 0.', md`$${A.toLatex({ v: 't' })} = 0$`, 'Substitute into v.'], solution: [md`$t = ${tMin.toLatex()}$, $v = ${answerTex(Vm)}$`] }),
      ],
      params: { c, k, u, T },
    };
  },
  verify(inst) {
    const { c, k, u, T } = inst.params as Record<string, number>;
    // Euler-style numerical integration of a(t)
    let v = u,
      s = 0,
      vmin = Infinity;
    const dt = 1e-4;
    for (let t = 0; t < T - dt / 2; t += dt) {
      const vm = v + (c * (t + dt / 2) - k) * (dt / 2);
      s += vm * dt;
      v += (c * (t + dt / 2) - k) * dt;
    }
    expectClose(valOf(inst.parts[1].answer as ExactSpec), s, 'displacement', 1e-5);
    for (let t = 0; t < 20; t += 0.001) vmin = Math.min(vmin, (c / 2) * t * t - k * t + u);
    expectClose(valOf(inst.parts[2].answer as ExactSpec), vmin, 'minimum velocity', 1e-5);
    expect(Number.isFinite(vmin), 'finite');
  },
});

const templates: Template[] = [fromDisplacement, fromAcceleration];
export default templates;
