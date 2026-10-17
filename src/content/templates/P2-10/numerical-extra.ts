/** Pure Year 2, Chapter 10 — Newton–Raphson with transcendental functions; numerical methods in context. */
import { bisect, derivative, expect, expectClose } from '../../../engine/core/numeric';
import { fmtDP, fmtNum, fmtSF } from '../../../engine/core/format';
import { evaluate } from '../../../engine/core/expr';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, ExactSpec, ExprSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex } from '../shared/calculus';

const valOf = (s: NumericSpec) => s.value;

type Fam = { f: string; fp: string; F: (x: number, a: number, b: number) => number; ok: (a: number, b: number) => boolean; x0s: number[] };
const FAMS: Fam[] = [
  { f: 'e^{x} - ${a}x - ${b}', fp: 'e^{x} - ${a}', F: (x, a, b) => Math.exp(x) - a * x - b, ok: () => true, x0s: [1, 2, 3] },
  { f: '\\ln x + ${a}x - ${b}', fp: '\\frac{1}{x} + ${a}', F: (x, a, b) => Math.log(x) + a * x - b, ok: () => true, x0s: [1, 2, 3] },
  { f: 'x^{3} - ${a}\\cos x - ${b}', fp: '3x^{2} + ${a}\\sin x', F: (x, a, b) => x ** 3 - a * Math.cos(x) - b, ok: () => true, x0s: [1, 2] },
  { f: '${a}\\sin x - x + ${b}', fp: '${a}\\cos x - 1', F: (x, a, b) => a * Math.sin(x) - x + b, ok: () => true, x0s: [2, 3] },
  { f: 'x e^{x} - ${b}', fp: '(x + 1)e^{x}', F: (x, _a, b) => x * Math.exp(x) - b, ok: () => true, x0s: [1, 2] },
];
const fill = (s: string, a: number, b: number) => s.replace(/\$\{a\}/g, String(a)).replace(/\$\{b\}/g, String(b)).replace(/\+ -/g, '- ').replace(/- -/g, '+ ');

const nrTranscendental = defineTemplate({
  id: 'p2.10.newton-raphson-transcendental',
  family: 'p2.10.newton-raphson',
  title: 'Newton–Raphson with exponential, logarithmic or trigonometric functions',
  spec: ['P9.3', 'P7.2'],
  chapter: 'P2.10',
  sections: ['10.3'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find', 'Show that'],
  tags: ['Newton–Raphson', 'numerical methods', 'differentiation', 'radians'],
  generate(r) {
    const i = r.int(0, FAMS.length - 1);
    const Fm = FAMS[i];
    const a = r.int(2, 6),
      b = r.int(1, 9);
    const f = (x: number) => Fm.F(x, a, b);
    const fp = (x: number) => derivative(f, x);
    const x0 = r.pick(Fm.x0s);
    r.require(Math.abs(fp(x0)) > 0.3);
    const x1 = x0 - f(x0) / fp(x0);
    const x2 = x1 - f(x1) / fp(x1);
    r.require(Number.isFinite(x2) && (i !== 1 || (x1 > 0 && x2 > 0)));
    // the iterates must be heading to a root near x0
    const root = (() => {
      let x = x0;
      for (let k = 0; k < 60; k++) x -= f(x) / fp(x);
      return x;
    })();
    r.require(Number.isFinite(root) && Math.abs(root - x0) < 1.5 && Math.abs(f(root)) < 1e-12);
    const fTex = fill(Fm.f, a, b),
      fpTex = fill(Fm.fp, a, b);
    const D: ExprSpec = ans.expr(ex(fpTex), ['x'], { domain: { x: [0.4, 3] } });
    const X1 = ans.num(x1, { dp: 3 }),
      X2 = ans.num(x2, { dp: 3 }, { alts: [Number(fmtDP(x1, 3)) - f(Number(fmtDP(x1, 3))) / fp(Number(fmtDP(x1, 3)))] });
    return {
      stem: md`$\mathrm{f}(x) = ${fTex}$${i === 1 ? ', $x > 0$' : ''}${i === 2 || i === 3 ? ', where $x$ is in radians' : ''}.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find $\mathrm{f}'(x)$.`, answer: D, scheme: [B1(md`$${fpTex}$`)], hints: ['Differentiate term by term.', i === 4 ? 'Use the product rule on xeˣ.' : 'Standard derivatives: eˣ → eˣ, ln x → 1/x, sin → cos, cos → −sin.', 'Constants differentiate to 0.'], solution: [md`$\mathrm{f}'(x) = ${answerTex(D)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Taking $x_{0} = ${x0}$ as a first approximation to a root of $\mathrm{f}(x) = 0$, apply the Newton–Raphson procedure once to find $x_{1}$, giving your answer to 3 decimal places.`, answer: X1, scheme: [M1(md`$x_{1} = ${x0} - \dfrac{\mathrm{f}(${x0})}{\mathrm{f}'(${x0})}$`), A1(md`$\mathrm{f}(${x0}) = ${fmtSF(f(x0), 4)}$, $\mathrm{f}'(${x0}) = ${fmtSF(fp(x0), 4)}$`), A1(md`$x_{1} = ${fmtDP(x1, 3)}$`)], hints: [md`$x_{n+1} = x_{n} - \dfrac{\mathrm{f}(x_{n})}{\mathrm{f}'(x_{n})}$`, md`Work out $\mathrm{f}(${x0})$ and $\mathrm{f}'(${x0})$ first${i === 2 || i === 3 ? ' (radian mode)' : ''}.`, 'Give x₁ to 3 d.p.'], errors: [err('plus-sign', ans.num(x0 + f(x0) / fp(x0), { dp: 3 }), 'Newton–Raphson subtracts f(x)/f′(x).')], solution: [md`$\mathrm{f}(${x0}) = ${fmtSF(f(x0), 5)}$, $\mathrm{f}'(${x0}) = ${fmtSF(fp(x0), 5)}$`, md`$x_{1} = ${x0} - \dfrac{${fmtSF(f(x0), 5)}}{${fmtSF(fp(x0), 5)}} = ${answerTex(X1)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Apply the procedure a second time to find $x_{2}$, to 3 decimal places.`, answer: X2, scheme: [M1('Uses their x₁ in the formula'), A1(md`$x_{2} = ${fmtDP(x2, 3)}$`)], hints: ['Use x₁ in place of x₀.', 'Use the full calculator value of x₁ if you can.', 'Round at the end.'], solution: [md`$x_{2} = x_{1} - \dfrac{\mathrm{f}(x_{1})}{\mathrm{f}'(x_{1})} = ${answerTex(X2)}$`, md`(The root is $${fmtDP(root, 5)}$ to 5 d.p.)`] }),
      ],
      params: { i, a, b, x0 },
    };
  },
  verify(inst) {
    const { i, a, b, x0 } = inst.params as Record<string, number>;
    const f = (x: number) => FAMS[i].F(x, a, b);
    const fpE = (inst.parts[0].answer as ExprSpec).value;
    for (const x of [0.7, 1.9]) expectClose(evaluate(fpE, { x }), derivative(f, x), "f'", 1e-6);
    const fp = (x: number) => evaluate(fpE, { x });
    const x1 = x0 - f(x0) / fp(x0);
    expectClose(valOf(inst.parts[1].answer as NumericSpec), x1, 'x1', 1e-9);
    expectClose(valOf(inst.parts[2].answer as NumericSpec), x1 - f(x1) / fp(x1), 'x2', 1e-9);
  },
});

// ---------------------------------------------------------------- 10.4 applications to modelling
const trapData = defineTemplate({
  id: 'p2.10.trapezium-rule-from-data-in-context',
  family: 'p2.10.modelling',
  title: 'Estimate a distance (or volume) from a table of rates using the trapezium rule',
  spec: ['P9.5', 'P9.4'],
  chapter: 'P2.10',
  sections: ['10.4'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Estimate', 'Explain'],
  tags: ['trapezium rule', 'modelling', 'numerical methods', 'kinematics'],
  generate(r) {
    const ctx = r.pick([
      { what: 'The speed, $v$ m s$^{-1}$, of a cyclist $t$ seconds after starting', v: 'v', t: 't', u: ['s', 'm s^{-1}'], quantity: 'distance travelled', unit: 'm', hs: [2, 4, 5] },
      { what: 'The rate of flow, $R$ litres per minute, of water into a tank $t$ minutes after a tap is opened', v: 'R', t: 't', u: ['min', 'L/min'], quantity: 'volume of water that flows into the tank', unit: 'litres', hs: [2, 5, 10] },
      { what: 'The power output, $P$ kW, of a solar panel $t$ hours after 8 am', v: 'P', t: 't', u: ['h', 'kW'], quantity: 'energy produced, in kWh,', unit: 'kWh', hs: [0.5, 1, 1.5] },
    ]);
    const h = r.pick(ctx.hs);
    const n = r.pick([4, 5, 6]);
    // underlying smooth model (concave or convex) to generate the data
    const A = r.int(3, 12),
      B = r.int(1, 5),
      shape = r.pick(['concave', 'convex'] as const);
    const T = n * h;
    const g = (t: number) => (shape === 'concave' ? A + B * Math.sqrt(t / h) * 2 : A + (B * (t / h) ** 2) / 2);
    const ys = Array.from({ length: n + 1 }, (_, k) => Number(fmtDP(g(k * h), 1)));
    const est = (h / 2) * (ys[0] + ys[n] + 2 * ys.slice(1, n).reduce((s, y) => s + y, 0));
    const E = ans.num(est, { sf: 3 }, { unit: `\\text{${ctx.unit}}` });
    const over = shape === 'convex';
    const opts = [over ? 'An overestimate, because the curve is convex (bends upwards), so each trapezium lies above the curve' : 'An underestimate, because the curve is concave (bends downwards), so each trapezium lies below the curve', over ? 'An underestimate, because the curve is convex' : 'An overestimate, because the curve is concave', 'Exact, because the trapezium rule always gives the exact area'];
    const C: ChoiceSpec = ans.choice(opts, 0);
    const head = `\\begin{array}{c|${'c'.repeat(n + 1)}} ${ctx.t}\\ (${ctx.u[0]}) & ${ys.map((_, k) => fmtNum(k * h)).join(' & ')} \\\\ \\hline ${ctx.v}\\ (\\text{${ctx.u[1].replace('^{-1}', '⁻¹')}}) & ${ys.map((y) => fmtNum(y)).join(' & ')} \\end{array}`;
    return {
      stem: md`${ctx.what} is recorded in the table.` + `\n\n$$${head}$$`,
      parts: [
        part({ label: 'a', marks: 4, prompt: md`Use the trapezium rule with all the values in the table to estimate the ${ctx.quantity} over the $${fmtNum(T)}$ ${ctx.u[0] === 'h' ? 'hours' : ctx.u[0] === 'min' ? 'minutes' : 'seconds'}.`, answer: E, scheme: [B1(md`Strip width $h = ${fmtNum(h)}$`), M1(md`$\frac{h}{2}\left(y_{0} + y_{${n}} + 2(y_{1} + \cdots + y_{${n - 1}})\right)$`), A1('Correct bracket'), A1(md`awrt $${fmtSF(est, 3)}$`)], hints: [`The ${ctx.quantity} is the area under the ${ctx.v}–t graph.`, md`$h = ${fmtNum(h)}$; there are $${n}$ strips.`, md`$\frac{h}{2}\left(\text{first} + \text{last} + 2 \times \text{(the rest)}\right)$`], errors: [err('no-half', ans.num(2 * est, { sf: 3 }), 'Remember the h/2 at the front.', 2)], solution: [md`$\frac{${fmtNum(h)}}{2}\left(${fmtNum(ys[0])} + ${fmtNum(ys[n])} + 2(${ys.slice(1, n).map((y) => fmtNum(y)).join(' + ')})\right) = ${answerTex(E)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`The graph of $${ctx.v}$ against $t$ is ${shape} for the whole interval. State, with a reason, whether your answer to (a) is an overestimate or an underestimate.`, answer: C, scheme: [B1(over ? 'Overestimate' : 'Underestimate'), B1('Reason referring to the shape of the curve')], hints: ['Picture a trapezium sitting on a curved graph.', over ? 'For a curve bending upwards, the straight top of each trapezium is above the curve.' : 'For a curve bending downwards, the straight top of each trapezium is below the curve.', 'Decide which way the error goes.'], solution: [opts[0]] }),
      ],
      params: { h, n, ys },
    };
  },
  verify(inst) {
    const { h, n, ys } = inst.params as { h: number; n: number; ys: number[] };
    let s = 0;
    for (let k = 0; k < n; k++) s += ((ys[k] + ys[k + 1]) / 2) * h;
    expectClose(valOf(inst.parts[0].answer as NumericSpec), s, 'sum of trapezia');
  },
});

const iterContext = defineTemplate({
  id: 'p2.10.iteration-in-context',
  family: 'p2.10.modelling',
  title: 'Use an iteration formula to solve a modelling equation',
  spec: ['P9.5', 'P9.2', 'P9.1'],
  chapter: 'P2.10',
  sections: ['10.2', '10.4'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 7,
  time: 8,
  commands: ['Show that', 'Find', 'Interpret'],
  tags: ['iteration', 'modelling', 'numerical methods', 'change of sign'],
  generate(r) {
    // Two models: N = A + Bt  vs  M = C e^{kt}; find when they are equal, i.e. C e^{kt} = A + Bt
    const A = r.pick([100, 150, 200, 250, 300]),
      B = r.pick([10, 15, 20, 25, 30]),
      C = r.pick([20, 30, 40, 50, 60]),
      k = r.pick([0.2, 0.25, 0.3, 0.35, 0.4]);
    const g = (t: number) => Math.log((A + B * t) / C) / k; // t = (1/k) ln((A + Bt)/C)
    const h = (t: number) => C * Math.exp(k * t) - A - B * t;
    const root = bisect(h, 0.5, 40);
    r.require(root > 3 && root < 25);
    const a = Math.floor(root),
      b = a + 1;
    const t0 = r.pick([a, b]);
    const t1 = g(t0),
      t2 = g(t1),
      t3 = g(t2);
    const T1 = ans.num(t1, { dp: 3 }),
      T3 = ans.num(t3, { dp: 3 }, { alts: [g(g(Number(fmtDP(t1, 3))))] });
    const what = r.pick([
      ['A town council models the number of houses with solar panels', 'houses', 'years'],
      ['A games company models the number of downloads (in thousands) of two apps', 'downloads', 'weeks'],
      ['An ecologist models two populations of fish in a lake', 'fish', 'months'],
    ]);
    const opts = [md`$h(${a})$ and $h(${b})$ have opposite signs and $h$ is continuous, so there is a root in $[${a}, ${b}]$`, md`$h(${a})$ is smaller than $h(${b})$`, md`$h$ is a quadratic, so it has a root`];
    const Cs: ChoiceSpec = ans.choice(opts, 0);
    return {
      stem: md`${what[0]}. Model 1: $N_{1} = ${A} + ${B}t$. Model 2: $N_{2} = ${C}e^{${fmtNum(k)}t}$, where $t$ is the time in ${what[2]}. Let $h(t) = ${C}e^{${fmtNum(k)}t} - ${B}t - ${A}$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Show that the models predict equal values for a time between $t = ${a}$ and $t = ${b}$.`, answer: Cs, scheme: [M1(md`Evaluates $h(${a}) = ${fmtSF(h(a), 3)}$ and $h(${b}) = ${fmtSF(h(b), 3)}$`), A1('Change of sign and continuity, with conclusion')], hints: [md`Work out $h(${a})$ and $h(${b})$.`, 'Look at the signs.', 'Mention continuity in your conclusion.'], solution: [md`$h(${a}) = ${fmtSF(h(a), 3)}$, $h(${b}) = ${fmtSF(h(b), 3)}$: change of sign, $h$ continuous, so there is a root.`] }),
        part({ label: 'b', marks: 2, prompt: md`Using the iteration $t_{n+1} = \dfrac{1}{${fmtNum(k)}}\ln\left(\dfrac{${A} + ${B}t_{n}}{${C}}\right)$ with $t_{0} = ${t0}$, find $t_{1}$ to 3 decimal places.`, answer: T1, scheme: [M1(md`Substitutes $t_{0} = ${t0}$`), A1(md`$${fmtDP(t1, 3)}$`)], hints: [md`Substitute $t_{0} = ${t0}$ into the formula.`, 'Use ln on your calculator.', 'Round to 3 d.p.'], solution: [md`$t_{1} = \dfrac{1}{${fmtNum(k)}}\ln\left(\dfrac{${A + B * t0}}{${C}}\right) = ${answerTex(T1)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find $t_{3}$ to 3 decimal places.`, answer: T3, scheme: [M1('Continues the iteration'), A1(md`$${fmtDP(t3, 3)}$`)], hints: ['Feed each answer back in.', 'Use the ANS button to keep full accuracy.', 'Two more iterations.'], solution: [md`$t_{2} = ${fmtDP(t2, 4)}$, $t_{3} = ${answerTex(T3)}$`] }),
        part({ label: 'd', marks: 1, prompt: md`Interpret your answer in context: after how many complete ${what[2]} does Model 2 first predict more ${what[1]} than Model 1?`, answer: ans.exact(ex(String(Math.ceil(root))) ), scheme: [B1(md`${Math.ceil(root)} ${what[2]}`)], hints: ['The root is where the two predictions are equal.', 'After the root, the exponential model is larger.', 'Round up to a whole number.'], solution: [md`The root is $t \approx ${fmtDP(root, 3)}$, so after $${Math.ceil(root)}$ ${what[2]}.`] }),
      ],
      params: { A, B, C, k, t0 },
    };
  },
  verify(inst) {
    const { A, B, C, k, t0 } = inst.params as Record<string, number>;
    const g = (t: number) => Math.log((A + B * t) / C) / k;
    expectClose(valOf(inst.parts[1].answer as NumericSpec), g(t0), 't1');
    expectClose(valOf(inst.parts[2].answer as NumericSpec), g(g(g(t0))), 't3');
    const n = evaluate((inst.parts[3].answer as ExactSpec).value);
    const h = (t: number) => C * Math.exp(k * t) - A - B * t;
    expect(h(n) > 0 && h(n - 1) < 0, 'first whole period where model 2 exceeds model 1');
  },
});

const templates: Template[] = [nrTranscendental, trapData, iterContext];
export default templates;
