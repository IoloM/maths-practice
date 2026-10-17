/** Pure Year 2, Chapter 8 — parametric equations: Cartesian form, intersections and modelling. */
import { Q } from '../../../engine/core/rational';
import { Poly } from '../../../engine/core/poly';
import { evaluate, num, sym } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { plot } from '../../../engine/core/svg';
import { answerTex } from '../../../engine/marking/mark';
import type { CoordSpec, EquationSpec, ExactSpec, ExprSpec, IntervalSpec, ListSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, err, iv, md, part, sgn } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';
import { G } from '../shared/mech';

const INF = sym('infty');
const exq = (q: Q | number) => num(Q.from(q));
const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
const lin = (a: number | Q, b: number | Q, v = 't') => sumTex([[a, v], [b, '']]);

// ---------------------------------------------------------------- 8.1 polynomial parametric → Cartesian
const polyCartesian = defineTemplate({
  id: 'p2.8.parametric-to-cartesian-polynomial',
  family: 'p2.8.cartesian-form',
  title: 'Convert x = at + b, y = quadratic in t into a Cartesian equation, with its domain',
  spec: ['P3.3'],
  chapter: 'P2.8',
  sections: ['8.1'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 2,
  marks: 5,
  time: 6,
  commands: ['Find', 'State'],
  tags: ['parametric equations', 'cartesian form', 'domain', 'diagram'],
  generate(r) {
    const a = r.pick([1, 2, 3, -1, -2, 4]),
      b = r.int(-5, 5);
    const c = r.intNZ(-3, 3),
      d = r.int(-6, 6),
      e = r.int(-8, 8);
    const t1 = r.int(-4, 0),
      t2 = r.int(1, 5);
    const T = Poly.coeffs([Q.of(-b, a), Q.of(1, a)]); // t in terms of x
    const Y = T.mul(T).scale(c).add(T.scale(d)).add(Poly.coeffs([e]));
    const E: EquationSpec = ans.eq(sym('y'), Y.toExpr(), ['x', 'y']);
    const xa = a * t1 + b,
      xb = a * t2 + b;
    const lo = Math.min(xa, xb),
      hi = Math.max(xa, xb);
    const I: IntervalSpec = ans.interval([iv(exq(lo), exq(hi), true, true)], 'x');
    const xt = (t: number) => a * t + b,
      yt = (t: number) => c * t * t + d * t + e;
    const ys = Array.from({ length: 41 }, (_, i) => yt(t1 + ((t2 - t1) * i) / 40));
    const svg = plot({ x: [Math.min(lo, 0) - 1, Math.max(hi, 0) + 1], y: [Math.min(...ys, 0) - 1, Math.max(...ys, 0) + 1], curves: [{ para: { x: xt, y: yt, t: [t1, t2] }, label: 'C', labelAt: t2 }], points: [{ x: xt(t1), y: yt(t1), dot: true }, { x: xt(t2), y: yt(t2), dot: true }], axes: { x: 'x', y: 'y' } });
    return {
      stem: md`The curve $C$ has parametric equations $x = ${lin(a, b)}$, $y = ${sumTex([[c, 't^{2}'], [d, 't'], [e, '']])}$, $${t1} \leqslant t \leqslant ${t2}$.`,
      diagram: { svg, alt: 'Sketch of the curve C, a section of a parabola between two end points.' },
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find a Cartesian equation of $C$ in the form $y = \mathrm{f}(x)$.`, answer: E, scheme: [M1(md`$t = \dfrac{x ${b < 0 ? '+' : '-'} ${Math.abs(b)}}{${a}}$`.replace('{x - 0}', '{x}').replace('{x + 0}', '{x}')), M1('Substitutes into y'), A1(md`$${answerTex(E)}$`)], hints: ['Make t the subject of the x equation.', md`$t = ${T.toLatex()}$`, 'Substitute into y and expand.'], errors: [], solution: [md`$t = ${T.toLatex()}$`, md`$y = ${c}\left(${T.toLatex()}\right)^{2} ${d < 0 ? '-' : '+'} ${Math.abs(d)}\left(${T.toLatex()}\right)${e === 0 ? '' : sgn(e)}$`, md`$${answerTex(E)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`State the domain of $\mathrm{f}$.`, answer: I, scheme: [M1(md`Substitutes $t = ${t1}$ and $t = ${t2}$ into $x$`), A1(md`$${answerTex(I)}$`)], hints: ['The domain is the set of x-values the curve covers.', 'x is linear in t, so the end values of t give the end values of x.', md`$x(${t1}) = ${xa}$, $x(${t2}) = ${xb}$`], solution: [md`$x(${t1}) = ${xa}$ and $x(${t2}) = ${xb}$, so $${answerTex(I)}$`] }),
      ],
      params: { a, b, c, d, e, t1, t2 },
    };
  },
  verify(inst) {
    const { a, b, c, d, e, t1, t2 } = inst.params as Record<string, number>;
    const Y = (inst.parts[0].answer as EquationSpec).rhs;
    for (const t of [t1, (t1 + t2) / 2, t2]) expectClose(evaluate(Y, { x: a * t + b }) + 50, c * t * t + d * t + e + 50, 'point on curve');
  },
});

// ---------------------------------------------------------------- 8.2 trigonometric parametric → Cartesian
const trigCartesian = defineTemplate({
  id: 'p2.8.trig-parametric-to-cartesian',
  family: 'p2.8.cartesian-form',
  title: 'Trigonometric parametric equations to Cartesian form using identities',
  spec: ['P3.3', 'P5.5'],
  chapter: 'P2.8',
  sections: ['8.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find', 'State'],
  tags: ['parametric equations', 'cartesian form', 'identities'],
  generate(r) {
    const type = r.pick(['circle', 'ellipse', 'double', 'sectan'] as const);
    let xT: string, yT: string, tRange: string, E: EquationSpec, I: IntervalSpec, how: string, step: string;
    const p = r.int(-5, 5),
      q = r.int(-5, 5);
    if (type === 'circle' || type === 'ellipse') {
      const A = r.int(2, 6),
        B = type === 'circle' ? A : r.int(2, 6);
      r.require(type === 'circle' || A !== B);
      xT = `${p === 0 ? '' : `${p} + `}${A}\\cos t`;
      yT = `${q === 0 ? '' : `${q} + `}${B}\\sin t`;
      tRange = '0 \\leqslant t < 2\\pi';
      const X = `(x${p === 0 ? '' : sgn(-p)})`,
        Yv = `(y${q === 0 ? '' : sgn(-q)})`;
      E = type === 'circle' ? ans.eq(ex(`${X}^{2} + ${Yv}^{2}`), exq(A * A), ['x', 'y']) : ans.eq(ex(`\\frac{${X}^{2}}{${A * A}} + \\frac{${Yv}^{2}}{${B * B}}`), num(1), ['x', 'y']);
      I = ans.interval([iv(exq(p - A), exq(p + A), true, true)], 'x');
      how = md`$\cos^{2} t + \sin^{2} t = 1$`;
      step = md`$\cos t = \dfrac{x${p === 0 ? '' : sgn(-p)}}{${A}}$, $\sin t = \dfrac{y${q === 0 ? '' : sgn(-q)}}{${B}}$`;
    } else if (type === 'double') {
      const k = r.int(1, 4),
        m = r.int(1, 4);
      xT = `${k === 1 ? '' : k}\\sin t`;
      yT = `${m === 1 ? '' : m}\\cos 2t`;
      tRange = '-\\frac{\\pi}{2} \\leqslant t \\leqslant \\frac{\\pi}{2}';
      E = ans.eq(sym('y'), ex(sumTex([[m, ''], [Q.of(-2 * m, k * k), 'x^{2}']])), ['x', 'y']);
      I = ans.interval([iv(exq(-k), exq(k), true, true)], 'x');
      how = md`$\cos 2t = 1 - 2\sin^{2} t$`;
      step = md`$\sin t = \dfrac{x}{${k}}$`;
    } else {
      const A = r.int(1, 5),
        B = r.int(1, 5);
      xT = `${A === 1 ? '' : A}\\sec t`;
      yT = `${B === 1 ? '' : B}\\tan t`;
      tRange = '-\\frac{\\pi}{2} < t < \\frac{\\pi}{2}';
      E = ans.eq(ex(`\\frac{x^{2}}{${A * A}} - \\frac{y^{2}}{${B * B}}`), num(1), ['x', 'y']);
      I = ans.interval([iv(exq(A), INF, true, false)], 'x');
      how = md`$\sec^{2} t = 1 + \tan^{2} t$`;
      step = md`$\sec t = \dfrac{x}{${A}}$, $\tan t = \dfrac{y}{${B}}$`;
    }
    return {
      stem: md`A curve has parametric equations $x = ${xT}$, $y = ${yT}$, $${tRange}$.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find a Cartesian equation of the curve.`, answer: E, scheme: [M1(step), M1(md`Uses ${how}`), A1(md`$${answerTex(E)}$`)], hints: [md`Make the trigonometric functions the subjects: ${step}.`, md`Use the identity ${how}.`, 'Simplify.'], solution: [step, md`Using ${how}: $${answerTex(E)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`State the set of possible values of $x$ on the curve.`, answer: I, scheme: [M1('Uses the range of the trigonometric function'), A1(md`$${answerTex(I)}$`)], hints: [type === 'sectan' ? 'For −π/2 < t < π/2, sec t ≥ 1.' : type === 'double' ? 'sin t takes every value from −1 to 1 on this interval.' : 'cos t takes every value from −1 to 1.', 'Multiply (and shift) to get the range of x.', 'Include the end points where they are reached.'], solution: [md`$${answerTex(I)}$`] }),
      ],
      params: { type, xT, yT },
    };
  },
  verify(inst) {
    const { xT, yT } = inst.params as { xT: string; yT: string };
    const X = ex(xT),
      Y = ex(yT);
    const E = inst.parts[0].answer as EquationSpec;
    for (const t of [0.2, -0.7, 1.1]) {
      const x = evaluate(X, { t }),
        y = evaluate(Y, { t });
      expectClose(evaluate(E.lhs, { x, y }) + 3, evaluate(E.rhs, { x, y }) + 3, 'point satisfies Cartesian equation', 1e-9);
      const I = inst.parts[1].answer as IntervalSpec;
      const lo = evaluate(I.set[0].lo),
        hi = evaluate(I.set[0].hi);
      expect(x >= lo - 1e-9 && x <= hi + 1e-9, 'x within the stated set');
    }
  },
});

// ---------------------------------------------------------------- 8.4 intersections
const intersect = defineTemplate({
  id: 'p2.8.parametric-curve-meets-line',
  family: 'p2.8.intersections',
  title: 'Points where a parametric curve meets a straight line',
  spec: ['P3.3', 'P2.4'],
  chapter: 'P2.8',
  sections: ['8.4'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find'],
  tags: ['parametric equations', 'intersection', 'quadratic'],
  generate(r) {
    const k = r.int(1, 4);
    // curve x = k t², y = 2k t  (parabola y² = 4kx); line y = m x + c through two parameter values
    const t1 = r.intNZ(-4, 4),
      t2 = r.intNZ(-4, 4);
    r.require(t1 !== t2 && t1 + t2 !== 0);
    const P1 = [k * t1 * t1, 2 * k * t1],
      P2 = [k * t2 * t2, 2 * k * t2];
    const m = Q.of(P2[1] - P1[1], P2[0] - P1[0]);
    const c = Q.of(P1[1]).sub(m.mul(P1[0]));
    // as an equation in t: 2k t = m k t² + c  →  m k t² − 2k t + c = 0
    const L = ans.list([ans.exact(exq(t1)), ans.exact(exq(t2))], { v: 't' });
    const top = t1 > t2 ? P1 : P2;
    const Cd: CoordSpec = ans.coord(ans.exact(exq(top[0])), ans.exact(exq(top[1])));
    const lineTex = `y = ${sumTex([[m, 'x'], [c, '']])}`;
    const quad = sumTex([[m.mul(k), 't^{2}'], [-2 * k, 't'], [c, '']]);
    return {
      stem: md`The curve $C$ has parametric equations $x = ${k === 1 ? '' : k}t^{2}$, $y = ${2 * k}t$. The line $l$ has equation $${lineTex}$.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find the values of $t$ at the points where $l$ meets $C$.`, answer: L, scheme: [M1('Substitutes the parametric equations into the line'), M1(md`Forms the quadratic $${quad} = 0$ and solves`), A1(md`$${answerTex(L)}$`)], hints: [md`Replace $x$ and $y$ in the equation of $l$ by their expressions in $t$.`, md`$${2 * k}t = ${m.toLatex()}(${k === 1 ? '' : k}t^{2})${c.isZero ? '' : sgn(c)}$`, 'Rearrange to a quadratic in t and solve.'], solution: [md`$${2 * k}t = ${m.toLatex()} \times ${k === 1 ? '' : k}t^{2}${c.isZero ? '' : sgn(c)} \Rightarrow ${quad} = 0$`, md`$${answerTex(L)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the coordinates of the point of intersection with the larger $y$-coordinate.`, answer: Cd, scheme: [M1('Substitutes a value of t into both equations'), A1(md`$${answerTex(Cd)}$`)], hints: ['Use your values of t.', 'Larger y means larger t here, since y = ' + 2 * k + 't.', 'Find both x and y.'], errors: [err('other-point', ans.coord(ans.exact(exq((t1 > t2 ? P2 : P1)[0])), ans.exact(exq((t1 > t2 ? P2 : P1)[1]))), 'That is the other point — it has the smaller y-coordinate.')], solution: [md`$t = ${Math.max(t1, t2)}$: $${answerTex(Cd)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`Show that $C$ has Cartesian equation $y^{2} = ${4 * k}x$. (Enter the equation.)`, answer: ans.eq(ex('y^{2}'), ex(`${4 * k}x`), ['x', 'y']), scheme: [B1(md`$t = \dfrac{y}{${2 * k}}$ substituted to give $y^{2} = ${4 * k}x$`)], hints: [md`From $y = ${2 * k}t$: $t = \dfrac{y}{${2 * k}}$.`, 'Substitute into x.', 'Rearrange.'], solution: [md`$x = ${k === 1 ? '' : k}\left(\dfrac{y}{${2 * k}}\right)^{2} \Rightarrow y^{2} = ${4 * k}x$`] }),
      ],
      params: { k, m: m.value, c: c.value },
    };
  },
  verify(inst) {
    const { k, m, c } = inst.params as Record<string, number>;
    for (const t of (inst.parts[0].answer as ListSpec).items.map(valOf)) expectClose(2 * k * t + 100, m * k * t * t + c + 100, 'on the line');
    const P = inst.parts[1].answer as CoordSpec;
    expectClose(valOf(P.y) ** 2 + 1, 4 * k * valOf(P.x) + 1, 'on the curve');
  },
});

// ---------------------------------------------------------------- 8.5 modelling
const projectilePath = defineTemplate({
  id: 'p2.8.parametric-projectile-model',
  family: 'p2.8.modelling',
  title: 'Parametric model of a projectile: landing time, range, greatest height, Cartesian path',
  spec: ['P3.4', 'M7.5'],
  chapter: 'P2.8',
  sections: ['8.5'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 8,
  time: 9,
  commands: ['Find', 'Show that'],
  tags: ['parametric equations', 'modelling', 'projectiles'],
  generate(r) {
    const U = r.pick([5, 6, 8, 10, 12, 14, 15]),
      V = r.pick([4.9, 7, 9.8, 12, 14, 14.7, 19.6]);
    const h = G / 2;
    const tl = V / h,
      R = U * tl,
      H = (V * V) / (4 * h);
    const Tl = ans.num(tl, { sf: 3 }, { unit: '\\text{s}' }),
      Rs = ans.num(R, { sf: 3 }, { unit: '\\text{m}' }),
      Hs = ans.num(H, { sf: 3 }, { unit: '\\text{m}' });
    const E: ExprSpec = ans.expr(ex(sumTex([[Q.from(V / U), 'x'], [Q.from(-h / (U * U)), 'x^{2}']])), ['x']);
    return {
      stem: md`A ball is thrown from ground level. Its position $t$ seconds later, relative to the point of projection, is modelled by $x = ${U}t$, $y = ${fmtNum(V)}t - 4.9t^{2}$, where $x$ and $y$ are the horizontal and vertical distances in metres.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the time at which the ball hits the ground.`, answer: Tl, scheme: [M1(md`$${fmtNum(V)}t - 4.9t^{2} = 0$`), A1(md`$t = ${fmtSF(tl, 3)}$`)], hints: ['The ball is on the ground when y = 0.', 'Factorise: t(… − 4.9t) = 0.', 't = 0 is the start; take the other root.'], errors: [err('half-time', ans.num(tl / 2, { sf: 3 }), 'That is the time to the top of the flight.')], solution: [md`$t(${fmtNum(V)} - 4.9t) = 0 \Rightarrow t = ${answerTex(Tl)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Find the horizontal distance travelled by the ball before it lands.`, answer: Rs, scheme: [B1(md`$${U} \times ${fmtSF(tl, 4)} = ${fmtSF(R, 3)}$ m`)], hints: ['Use the landing time in x.', md`$x = ${U}t$`, 'Substitute.'], solution: [md`$x = ${U} \times ${fmtSF(tl, 4)} = ${answerTex(Rs)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the greatest height reached by the ball.`, answer: Hs, scheme: [M1(md`Uses the time $t = ${fmtSF(tl / 2, 4)}$ (half-way, or $\frac{\mathrm{d}y}{\mathrm{d}t} = 0$)`), A1(md`$${fmtSF(H, 3)}$ m`)], hints: ['By symmetry the top is half-way through the flight.', md`$t = ${fmtSF(tl / 2, 4)}$`, 'Substitute into y.'], solution: [md`At $t = ${fmtSF(tl / 2, 4)}$: $y = ${answerTex(Hs)}$`] }),
        part({ label: 'd', marks: 3, prompt: md`Find a Cartesian equation for the path of the ball, giving $y$ in terms of $x$.`, answer: E, scheme: [M1(md`$t = \dfrac{x}{${U}}$`), M1('Substitutes into y'), A1(md`$y = ${answerTex(E)}$`)], hints: [md`From $x = ${U}t$, $t = \dfrac{x}{${U}}$.`, 'Substitute into the y equation.', 'Simplify the coefficients.'], solution: [md`$y = ${fmtNum(V)}\left(\dfrac{x}{${U}}\right) - 4.9\left(\dfrac{x}{${U}}\right)^{2}$`, md`$y = ${answerTex(E)}$`] }),
      ],
      params: { U, V },
    };
  },
  verify(inst) {
    const { U, V } = inst.params as Record<string, number>;
    const tl = valOf(inst.parts[0].answer as NumericSpec);
    expectClose(V * tl - 4.9 * tl * tl + 1, 1, 'lands');
    let best = 0;
    for (let t = 0; t <= tl; t += tl / 20000) best = Math.max(best, V * t - 4.9 * t * t);
    expectClose(valOf(inst.parts[2].answer as NumericSpec), best, 'greatest height', 1e-6);
    const E = (inst.parts[3].answer as ExprSpec).value;
    for (const t of [0.3, tl / 2]) expectClose(evaluate(E, { x: U * t }) + 1, V * t - 4.9 * t * t + 1, 'path');
  },
});

const drone = defineTemplate({
  id: 'p2.8.parametric-closed-path-model',
  family: 'p2.8.modelling',
  title: 'Modelling a closed path with trigonometric parametric equations',
  spec: ['P3.4', 'P5.9'],
  chapter: 'P2.8',
  sections: ['8.5'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 7,
  time: 9,
  commands: ['Find', 'Show that'],
  tags: ['parametric equations', 'modelling', 'ellipse', 'radians'],
  generate(r) {
    const cx = r.pick([20, 30, 40, 50]),
      cy = r.pick([10, 15, 20, 25]),
      A = r.pick([10, 12, 15, 20]),
      B = r.pick([5, 6, 8, 9]);
    const P = r.pick([40, 60, 80, 90, 120]);
    const w = (2 * Math.PI) / P;
    const Yh = cy + r.pick([0.25, 0.4, 0.5, 0.6, 0.8]) * B;
    const t1 = Math.asin((Yh - cy) / B) / w;
    const what = r.pick(['A drone', 'A model aircraft', 'A remote-controlled boat']);
    const E: EquationSpec = ans.eq(ex(`\\frac{(x - ${cx})^{2}}{${A * A}} + \\frac{(y - ${cy})^{2}}{${B * B}}`), num(1), ['x', 'y']);
    const Pd = ans.exact(exq(P), undefined, { unit: '\\text{s}' });
    const T1 = ans.num(t1, { sf: 3 }, { unit: '\\text{s}' });
    const Dx = ans.exact(exq(2 * A), undefined, { unit: '\\text{m}' });
    const wTex = `\\frac{${P % 2 === 0 ? '' : 2}\\pi t}{${P % 2 === 0 ? P / 2 : P}}`;
    return {
      stem: md`${what} moves on a closed path. Its position $t$ seconds after it starts, relative to a fixed origin, is modelled by $x = ${cx} + ${A}\cos\left(${wTex}\right)$, $y = ${cy} + ${B}\sin\left(${wTex}\right)$, where distances are in metres.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Show that the path is an ellipse and give its Cartesian equation.`, answer: E, scheme: [M1('Makes cos and sin the subjects'), M1(md`Uses $\cos^{2} + \sin^{2} = 1$`), A1(md`$${answerTex(E)}$`)], hints: [md`$\cos\left(${wTex}\right) = \dfrac{x - ${cx}}{${A}}$`, md`$\sin\left(${wTex}\right) = \dfrac{y - ${cy}}{${B}}$`, 'Square and add.'], solution: [md`$\left(\dfrac{x - ${cx}}{${A}}\right)^{2} + \left(\dfrac{y - ${cy}}{${B}}\right)^{2} = 1$, i.e. $${answerTex(E)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Find the time taken to complete one circuit.`, answer: Pd, scheme: [B1(md`$${P}$ s`)], hints: ['One circuit is when the angle increases by 2π.', md`Solve $${wTex} = 2\pi$.`, 'That gives the period.'], solution: [md`$${wTex} = 2\pi \Rightarrow t = ${answerTex(Pd)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`Find the greatest distance between two points on the path in the $x$-direction.`, answer: Dx, scheme: [B1(md`$2 \times ${A} = ${2 * A}$ m`)], hints: ['x varies between cx − A and cx + A.', md`$x$ ranges from $${cx - A}$ to $${cx + A}$.`, 'Subtract.'], solution: [md`$${cx + A} - ${cx - A} = ${answerTex(Dx)}$`] }),
        part({ label: 'd', marks: 2, prompt: md`Find the first time at which $y = ${fmtNum(Yh)}$.`, answer: T1, scheme: [M1(md`$\sin\left(${wTex}\right) = \dfrac{${fmtNum(Yh - cy)}}{${B}}$`), A1(md`awrt $${fmtSF(t1, 3)}$ s`)], hints: [md`Set $y = ${fmtNum(Yh)}$.`, md`$\sin\left(${wTex}\right) = ${fmtNum((Yh - cy) / B)}$`, 'Use arcsin in radians, then solve for t.'], solution: [md`$${wTex} = \arcsin(${fmtNum((Yh - cy) / B)}) \Rightarrow t = ${answerTex(T1)}$`] }),
      ],
      params: { cx, cy, A, B, P, Yh },
    };
  },
  verify(inst) {
    const { cx, cy, A, B, P, Yh } = inst.params as Record<string, number>;
    const w = (2 * Math.PI) / P;
    const x = (t: number) => cx + A * Math.cos(w * t),
      y = (t: number) => cy + B * Math.sin(w * t);
    const E = inst.parts[0].answer as EquationSpec;
    for (const t of [3, 17, 29]) expectClose(evaluate(E.lhs, { x: x(t), y: y(t) }), 1, 'ellipse');
    const t1 = valOf(inst.parts[3].answer as NumericSpec);
    expectClose(y(t1), Yh, 'height');
    for (let t = 0; t < t1 - 1e-6; t += t1 / 50) expect(y(t) < Yh, 'first time');
  },
});

const particlePath = defineTemplate({
  id: 'p2.8.parametric-particle-path',
  family: 'p2.8.modelling',
  title: 'Parametric path of a moving particle: crossing the axis and extreme position',
  spec: ['P3.4', 'P3.3'],
  chapter: 'P2.8',
  sections: ['8.1', '8.5'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 7,
  time: 8,
  commands: ['Find'],
  tags: ['parametric equations', 'modelling', 'kinematics', 'completing the square'],
  generate(r) {
    const a = r.int(1, 6),
      b = a + r.int(1, 5); // x = t² − (a + b)t + ab = (t − a)(t − b) crosses x = 0 at t = a and b
    const p = r.int(1, 5),
      q = r.int(-5, 5);
    const T = r.int(b + 1, b + 4);
    const xT = sumTex([[1, 't^{2}'], [-(a + b), 't'], [a * b, '']]);
    const yT = sumTex([[p, 't'], [q, '']]);
    const L = ans.list([ans.exact(exq(a)), ans.exact(exq(b))], { v: 't' });
    const tm = Q.of(a + b, 2);
    const xm = tm.mul(tm).sub(tm.mul(a + b)).add(a * b);
    const Mn: CoordSpec = ans.coord(ans.exact(exq(xm)), ans.exact(exq(tm.mul(p).add(q))));
    const E: ExprSpec = ans.expr(ex(`\\left(\\frac{y ${q < 0 ? '+' : '-'} ${Math.abs(q)}}{${p}}\\right)^{2} - ${a + b}\\left(\\frac{y ${q < 0 ? '+' : '-'} ${Math.abs(q)}}{${p}}\\right) + ${a * b}`.replace(/y - 0/g, 'y').replace(/y \+ 0/g, 'y')), ['y']);
    return {
      stem: md`A particle moves in a plane so that its position at time $t$ seconds, $0 \leqslant t \leqslant ${T}$, is given by $x = ${xT}$, $y = ${yT}$, where $x$ and $y$ are measured in metres from a fixed origin $O$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the values of $t$ at which the particle crosses the $y$-axis.`, answer: L, scheme: [M1(md`Sets $x = 0$ and solves`), A1(md`$${answerTex(L)}$`)], hints: ['On the y-axis, x = 0.', md`Solve $${xT} = 0$.`, 'Factorise.'], solution: [md`$${xT} = (t - ${a})(t - ${b}) = 0 \Rightarrow ${answerTex(L)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Find the coordinates of the particle when it is furthest in the negative $x$-direction.`, answer: Mn, scheme: [M1('Completes the square in t (or differentiates x)'), A1(md`$t = ${tm.toLatex()}$`), A1(md`$${answerTex(Mn)}$`)], hints: ['x is a quadratic in t: find its minimum.', md`$x = \left(t - ${tm.toLatex()}\right)^{2} - ${xm.neg().toLatex()}$`, 'Substitute that t into y as well.'], solution: [md`$x = \left(t - ${tm.toLatex()}\right)^{2} ${xm.sign < 0 ? '-' : '+'} ${xm.abs().toLatex()}$, minimum at $t = ${tm.toLatex()}$`, md`Position $${answerTex(Mn)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find a Cartesian equation for the path, giving $x$ in terms of $y$.`, answer: E, scheme: [M1(md`$t = \dfrac{y ${q < 0 ? '+' : '-'} ${Math.abs(q)}}{${p}}$`.replace('y - 0', 'y').replace('y + 0', 'y')), A1('Correct substitution into x')], hints: ['Make t the subject of the y equation.', 'Substitute into x.', 'You do not need to expand.'], solution: [md`$x = ${answerTex(E)}$`] }),
      ],
      params: { a, b, p, q },
    };
  },
  verify(inst) {
    const { a, b, p, q } = inst.params as Record<string, number>;
    const x = (t: number) => (t - a) * (t - b),
      y = (t: number) => p * t + q;
    for (const t of (inst.parts[0].answer as ListSpec).items.map(valOf)) expectClose(x(t) + 1, 1, 'crosses');
    const M = inst.parts[1].answer as CoordSpec;
    let best = Infinity;
    for (let t = 0; t <= b + 4; t += 0.001) best = Math.min(best, x(t));
    expectClose(valOf(M.x), best, 'minimum x', 1e-6);
    const E = (inst.parts[2].answer as ExprSpec).value;
    for (const t of [0.5, 2.5]) expectClose(evaluate(E, { y: y(t) }) + 30, x(t) + 30, 'path');
  },
});

const templates: Template[] = [polyCartesian, trigCartesian, intersect, projectilePath, drone, particlePath];
export default templates;
