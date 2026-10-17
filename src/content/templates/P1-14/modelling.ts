/** Pure Year 1, Chapter 14 — exponential modelling and logarithmic graphs of non-linear data (14.3, 14.8). */
import { Q } from '../../../engine/core/rational';
import { dec, evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtDP, fmtNum, fmtSF, roundSF } from '../../../engine/core/format';
import { plot } from '../../../engine/core/svg';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, ExactSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';

const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
const r2 = (x: number) => Number(fmtDP(x, 2));
const s3 = (x: number) => roundSF(x, 3);

function logLineSvg(p1: [number, number], p2: [number, number], xl: string, yl: string): string {
  const [u1, v1] = p1,
    [u2, v2] = p2;
  const m = (v2 - v1) / (u2 - u1);
  const f = (u: number) => v1 + m * (u - u1);
  const lo = Math.min(0, u1 - 0.2),
    hi = u2 + 0.3;
  const ys = [f(lo), f(hi), 0];
  const y0 = Math.min(...ys) - 0.3,
    y1 = Math.max(...ys) + 0.3;
  return plot({
    x: [lo - 0.05, hi],
    y: [y0, y1],
    curves: [{ f, from: Math.max(lo, u1 - 0.6), to: hi - 0.05, cls: 'dg-line' }],
    points: [
      { x: u1, y: v1, label: `(${u1}, ${v1})`, dx: 6, dy: m > 0 ? 14 : -8, dot: true },
      { x: u2, y: v2, label: `(${u2}, ${v2})`, dx: -10, dy: m > 0 ? -8 : 14, dot: true },
    ],
    axes: { x: xl, y: yl },
  });
}

// ---------------------------------------------------------------- 14.8 y = axⁿ
const powerLaw = defineTemplate({
  id: 'p1.14.log-graph-power-law',
  family: 'p1.14.log-graphs',
  title: 'Find a and n in y = axⁿ from a graph of log y against log x',
  spec: ['P6.6'],
  chapter: 'P1.14',
  sections: ['14.8'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find', 'Estimate'],
  tags: ['logarithms', 'non-linear data', 'power law', 'modelling', 'diagram'],
  generate(r) {
    const useLn = r.bool(0.4);
    const L = useLn ? Math.log : Math.log10;
    const base = useLn ? Math.E : 10;
    const lg = useLn ? '\\ln' : '\\log_{10}';
    const lgu = useLn ? 'ln' : 'log₁₀';
    const a = r.pick([1.5, 2, 2.5, 3, 4, 5, 6, 8, 12, 0.4, 0.8]),
      n = r.pick([0.5, 0.75, 1.5, 2, 2.5, 3, -0.5, -1, -1.5]);
    const u1 = r.pick([0.1, 0.2, 0.3, 0.4, 0.5]),
      u2 = r2(u1 + r.pick([0.8, 1, 1.2, 1.5]));
    const v1 = r2(L(a) + n * u1),
      v2 = r2(L(a) + n * u2);
    const nG = (v2 - v1) / (u2 - u1);
    const aG = base ** (v1 - nG * u1);
    const X = r.pick([2, 3, 5, 8, 12, 15, 20]);
    const yG = aG * X ** nG,
      yT = a * X ** n,
      yR = s3(aG) * X ** s3(nG);
    const ctx = r.pick([
      { y: 'y', x: 'x', what: 'Two variables $x$ and $y$ are believed to satisfy' },
      { y: 'T', x: 'l', what: 'In an experiment, the time $T$ seconds for a pendulum of length $l$ m is modelled by' },
      { y: 'P', x: 'v', what: 'The power $P$ kW needed to drive a fan at speed $v$ rotations per second is modelled by' },
      { y: 'M', x: 'h', what: 'The mass $M$ kg of a tree of height $h$ m is modelled by' },
    ]);
    const { y, x } = ctx;
    const N = ans.num(nG, { sf: 3 }, { alts: [n] }),
      A = ans.num(aG, { sf: 3 }, { alts: [a] }),
      Yv = ans.num(yG, { sf: 3 }, { alts: [yT, yR] });
    const svg = logLineSvg([u1, v1], [u2, v2], `${lgu} ${x}`, `${lgu} ${y}`);
    return {
      stem: md`${ctx.what} $${y} = a${x}^{n}$, where $a$ and $n$ are constants. A graph of $${lg} ${y}$ against $${lg} ${x}$ is a straight line passing through the points $(${u1}, ${v1})$ and $(${u2}, ${v2})$, as shown.`,
      diagram: { svg, alt: `Straight line graph of ${lgu} ${y} against ${lgu} ${x} through the points (${u1}, ${v1}) and (${u2}, ${v2}).` },
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find the value of $n$.`, answer: N, scheme: [M1(md`Takes logs: $${lg} ${y} = ${lg} a + n${lg} ${x}$`), M1('n is the gradient of the line'), A1(md`awrt $${fmtSF(nG, 3)}$`)], hints: [md`Take ${useLn ? 'natural ' : ''}logs of both sides of $${y} = a${x}^{n}$.`, md`$${lg} ${y} = n${lg} ${x} + ${lg} a$ has the form $Y = mX + c$.`, md`So $n$ is the gradient: $\dfrac{${v2} - ${v1}}{${u2} - ${u1}}$.`], solution: [md`$${lg} ${y} = n${lg} ${x} + ${lg} a$, so $n$ = gradient $= \dfrac{${v2} - ${v1}}{${u2} - ${u1}} = ${answerTex(N)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the value of $a$.`, answer: A, scheme: [M1(md`$${lg} a = ${v1} - n(${u1})$ (or uses the other point)`), A1(md`awrt $${fmtSF(aG, 3)}$`)], hints: [md`The intercept of the line is $${lg} a$.`, md`Substitute a point: $${v1} = n(${u1}) + ${lg} a$.`, md`Then $a = ${useLn ? 'e' : '10'}^{${lg} a}$.`], solution: [md`$${lg} a = ${v1} - ${fmtSF(nG, 4)}(${u1}) = ${fmtSF(v1 - nG * u1, 4)}$`, md`$a = ${useLn ? 'e' : '10'}^{${fmtSF(v1 - nG * u1, 4)}} = ${answerTex(A)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`Use the model to estimate the value of $${y}$ when $${x} = ${X}$.`, answer: Yv, scheme: [B1(md`awrt $${fmtSF(yG, 3)}$`)], hints: ['Use your values of a and n.', md`$${y} = a \times ${X}^{n}$`, 'Give 3 significant figures.'], solution: [md`$${y} = ${fmtSF(aG, 4)} \times ${X}^{${fmtSF(nG, 4)}} = ${answerTex(Yv)}$`] }),
      ],
      params: { u1, u2, v1, v2, useLn, X },
    };
  },
  verify(inst) {
    const { u1, u2, v1, v2, useLn, X } = inst.params as { u1: number; u2: number; v1: number; v2: number; useLn: boolean; X: number };
    const L = useLn ? Math.log : Math.log10;
    const n = valOf(inst.parts[0].answer as NumericSpec),
      a = valOf(inst.parts[1].answer as NumericSpec);
    expectClose(L(a) + n * u1, v1, 'point 1');
    expectClose(L(a) + n * u2, v2, 'point 2');
    expectClose(valOf(inst.parts[2].answer as NumericSpec), a * X ** n, 'estimate');
  },
});

// ---------------------------------------------------------------- 14.8 y = kbᵗ
const EXP_CTX = [
  { v: 'F', what: 'The number of followers, $F$, of a new social media account $t$ weeks after it was set up', tu: 'weeks', grow: true, k: [40, 60, 80, 150, 250], b: [1.2, 1.3, 1.5, 1.8, 2.1] },
  { v: 'N', what: 'The number of insects, $N$, in a colony $t$ days after it was first observed', tu: 'days', grow: true, k: [20, 35, 50, 120, 200], b: [1.05, 1.08, 1.1, 1.15, 1.25] },
  { v: 'V', what: 'The value, $V$ pounds, of a machine $t$ years after it was bought', tu: 'years', grow: false, k: [8000, 12000, 20000, 35000], b: [0.7, 0.75, 0.8, 0.85, 0.9] },
  { v: 'A', what: 'The activity, $A$ units, of a radioactive sample $t$ hours after it was prepared', tu: 'hours', grow: false, k: [300, 500, 800, 1200], b: [0.6, 0.75, 0.82, 0.9, 0.95] },
];

const expLogGraph = defineTemplate({
  id: 'p1.14.log-graph-exponential-model',
  family: 'p1.14.log-graphs',
  title: 'Find k and b in y = kbᵗ from a graph of log y against t',
  spec: ['P6.6', 'P6.7'],
  chapter: 'P1.14',
  sections: ['14.8'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 8,
  time: 9,
  commands: ['Find', 'Interpret', 'Estimate'],
  tags: ['logarithms', 'non-linear data', 'exponential model', 'modelling', 'diagram', 'interpret'],
  generate(r) {
    const C = r.pick(EXP_CTX);
    const k = r.pick(C.k),
      b = r.pick(C.b);
    const t2 = r.pick([5, 8, 10, 12, 20]);
    const c = r2(Math.log10(k)),
      v2 = r2(Math.log10(k) + t2 * Math.log10(b));
    r.require(Math.abs(v2 - c) >= 0.15);
    const m = (v2 - c) / t2;
    const kG = 10 ** c,
      bG = 10 ** m;
    const T = r.int(t2 + 2, t2 + 15);
    const pred = kG * bG ** T;
    const K = ans.num(kG, { sf: 3 }, { alts: [k] }),
      B = ans.num(bG, { sf: 3 }, { alts: [b] }),
      P = ans.num(pred, { sf: 3 }, { alts: [k * b ** T, s3(kG) * s3(bG) ** T] });
    const opts = [
      C.grow ? `Each ${C.tu.slice(0, -1)}, the ${C.v === 'F' ? 'number of followers' : 'number of insects'} is multiplied by b (it grows by a constant factor)` : `Each ${C.tu.slice(0, -1)}, the ${C.v === 'V' ? 'value' : 'activity'} is multiplied by b (it falls by a constant factor)`,
      `b is the ${C.grow ? 'number' : 'amount'} when t = 0`,
      `b is the amount added each ${C.tu.slice(0, -1)}`,
    ];
    const Ch: ChoiceSpec = ans.choice(opts, 0);
    const svg = logLineSvg([0, c], [t2, v2], 't', `log₁₀ ${C.v}`);
    return {
      stem: md`${C.what} is modelled by $${C.v} = kb^{t}$, where $k$ and $b$ are constants. The graph of $\log_{10} ${C.v}$ against $t$ is a straight line passing through $(0, ${c})$ and $(${t2}, ${v2})$.`,
      diagram: { svg, alt: `Straight line graph of log ${C.v} against t through (0, ${c}) and (${t2}, ${v2}).` },
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the value of $k$.`, answer: K, scheme: [M1(md`$\log_{10} ${C.v} = \log_{10} k + t\log_{10} b$, so $\log_{10} k = ${c}$`), A1(md`awrt $${fmtSF(kG, 3)}$`)], hints: ['Take logs of both sides of the model.', md`$\log_{10} ${C.v} = t\log_{10} b + \log_{10} k$ — a straight line in $t$.`, md`The intercept $${c}$ is $\log_{10} k$, so $k = 10^{${c}}$.`], solution: [md`$\log_{10} k = ${c} \Rightarrow k = 10^{${c}} = ${answerTex(K)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the value of $b$.`, answer: B, scheme: [M1(md`Gradient $= \log_{10} b = \dfrac{${v2} - ${c}}{${t2}}$`), A1(md`awrt $${fmtSF(bG, 3)}$`)], hints: [md`The gradient of the line is $\log_{10} b$.`, md`Gradient $= \dfrac{${v2} - ${c}}{${t2} - 0}$`, md`Then $b = 10^{\text{gradient}}$.`], solution: [md`$\log_{10} b = \dfrac{${v2} - ${c}}{${t2}} = ${fmtSF(m, 4)} \Rightarrow b = ${answerTex(B)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`Interpret the value of $b$ in the context of the model.`, answer: Ch, scheme: [B1('Multiplicative factor per unit time, in context')], hints: [md`$${C.v}$ is multiplied by $b$ each time $t$ increases by 1.`, `Is b more or less than 1? What does that mean here?`, 'An exponential model changes by a constant factor, not a constant amount.'], solution: [opts[0]] }),
        part({ label: 'd', marks: 3, prompt: md`Use the model to predict the value of $${C.v}$ when $t = ${T}$.`, answer: P, scheme: [M1(md`Substitutes $t = ${T}$ into $${C.v} = kb^{t}$ with their $k$ and $b$`), dM1('Evaluates'), A1(md`awrt $${fmtSF(pred, 3)}$`)], hints: ['Use your k and b.', md`$${C.v} = ${fmtSF(kG, 4)} \times ${fmtSF(bG, 4)}^{${T}}$`, 'Or use the line: log V = c + mt, then raise 10 to that power.'], solution: [md`$${C.v} = ${fmtSF(kG, 4)} \times ${fmtSF(bG, 4)}^{${T}} = ${answerTex(P)}$`] }),
      ],
      params: { c, v2, t2, T },
    };
  },
  verify(inst) {
    const { c, v2, t2, T } = inst.params as Record<string, number>;
    const k = valOf(inst.parts[0].answer as NumericSpec),
      b = valOf(inst.parts[1].answer as NumericSpec);
    expectClose(Math.log10(k), c, 'intercept');
    expectClose(Math.log10(k * b ** t2), v2, 'second point');
    expectClose(valOf(inst.parts[3].answer as NumericSpec), k * b ** T, 'prediction');
  },
});

const linearForm = defineTemplate({
  id: 'p1.14.reduce-to-linear-form',
  family: 'p1.14.log-graphs',
  title: 'Gradient and intercept of log graphs for y = abˣ and y = pxᑫ',
  spec: ['P6.6'],
  chapter: 'P1.14',
  sections: ['14.8'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 5,
  time: 5,
  commands: ['Write down', 'Find', 'State'],
  tags: ['logarithms', 'non-linear data', 'straight line', 'modelling'],
  generate(r) {
    const A = r.pick([2, 3, 4, 5, 6, 7, 8, 12, 20]),
      Bb = r.pick([1.5, 2, 3, 4, 5, 0.5, 0.8]);
    const P = r.pick([2, 3, 4, 5, 6, 7, 9, 15]),
      Qn = r.pick([Q.of(2), Q.of(3), Q.of(1, 2), Q.of(3, 2), Q.of(-1), Q.of(-2), Q.of(5, 2)]);
    const G1 = ans.num(Math.log10(Bb), { sf: 3 }),
      I1 = ans.num(Math.log10(A), { sf: 3 });
    const G2 = ans.exact(num(Qn)),
      I2 = ans.num(Math.log10(P), { sf: 3 });
    const graphs = ['$\\log_{10} y$ against $\\log_{10} x$', '$\\log_{10} y$ against $x$', '$y$ against $\\log_{10} x$'];
    const C: ChoiceSpec = ans.choice(graphs, 0);
    return {
      stem: md`A student is analysing data using logarithmic graphs.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`For the model $y = ${A} \times ${Bb}^{x}$, find the gradient of the straight-line graph of $\log_{10} y$ against $x$.`, answer: G1, scheme: [B1(md`$\log_{10} ${Bb}$ = awrt $${fmtSF(Math.log10(Bb), 3)}$`)], hints: ['Take log₁₀ of both sides.', md`$\log_{10} y = x\log_{10} ${Bb} + \log_{10} ${A}$`, 'The coefficient of x is the gradient.'], solution: [md`$\log_{10} y = (\log_{10} ${Bb})x + \log_{10} ${A}$: gradient $= ${answerTex(G1)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Find the intercept on the vertical axis of this graph.`, answer: I1, scheme: [B1(md`$\log_{10} ${A}$ = awrt $${fmtSF(Math.log10(A), 3)}$`)], hints: ['The intercept is the constant term.', md`It is $\log_{10} ${A}$.`, 'Evaluate on a calculator.'], solution: [md`Intercept $= \log_{10} ${A} = ${answerTex(I1)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`The student believes that some other data satisfy a model of the form $y = px^{q}$. State which graph should be plotted to give a straight line.`, answer: C, scheme: [B1('log y against log x')], hints: [md`Take logs of $y = px^{q}$.`, md`$\log y = q\log x + \log p$`, 'Which pair of quantities are linearly related?'], solution: [md`$\log_{10} y = q\log_{10} x + \log_{10} p$, so plot ${graphs[0]}.`] }),
        part({ label: 'd', marks: 1, prompt: md`For the model $y = ${P}x^{${Qn.toLatex()}}$, write down the gradient of that straight-line graph.`, answer: G2, scheme: [B1(md`$${Qn.toLatex()}$`)], hints: ['The power becomes the gradient.', md`$\log_{10} y = ${Qn.toLatex()}\log_{10} x + \log_{10} ${P}$`, 'No calculator needed.'], solution: [md`Gradient $= ${answerTex(G2)}$`] }),
        part({ label: 'e', marks: 1, prompt: md`Find its intercept on the vertical axis.`, answer: I2, scheme: [B1(md`$\log_{10} ${P}$ = awrt $${fmtSF(Math.log10(P), 3)}$`)], hints: ['The constant term is the intercept.', md`$\log_{10} ${P}$`, 'Evaluate to 3 s.f.'], solution: [md`Intercept $= \log_{10} ${P} = ${answerTex(I2)}$`] }),
      ],
      params: { A, Bb, P, Qn: Qn.value },
    };
  },
  verify(inst) {
    const { A, Bb, P, Qn } = inst.params as Record<string, number>;
    // the line in (x, log y) through two points of the model
    const g = Math.log10(A * Bb ** 3) - Math.log10(A * Bb ** 2);
    expectClose(valOf(inst.parts[0].answer as NumericSpec), g, 'gradient 1');
    expectClose(valOf(inst.parts[1].answer as NumericSpec), Math.log10(A), 'intercept 1');
    const g2 = Math.log10(P * 10 ** Qn) - Math.log10(P);
    expectClose(valOf(inst.parts[3].answer as ExactSpec), g2, 'gradient 2');
    expectClose(valOf(inst.parts[4].answer as NumericSpec), Math.log10(P), 'intercept 2');
  },
});

// ---------------------------------------------------------------- 14.3 modelling
const cooling = defineTemplate({
  id: 'p1.14.cooling-model',
  family: 'p1.14.exponential-modelling',
  title: 'Exponential decay towards a limit: T = A + Be^{−kt}',
  spec: ['P6.7'],
  chapter: 'P1.14',
  sections: ['14.3', '14.7'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 8,
  time: 10,
  commands: ['Find', 'State', 'Write down'],
  tags: ['exponentials', 'modelling', 'decay', 'logarithms', 'limit'],
  generate(r) {
    const ctx = r.pick([
      { what: 'A cup of tea is made and left to cool in a room. Its temperature, $T$ °C, $t$ minutes after it is made', v: 'T', unit: '°C', tu: 'minutes' },
      { what: 'A metal rod is taken out of a furnace. Its temperature, $T$ °C, $t$ minutes later', v: 'T', unit: '°C', tu: 'minutes' },
      { what: 'A bowl of soup is left to cool. Its temperature, $\\theta$ °C, $t$ minutes after it is served', v: '\\theta', unit: '°C', tu: 'minutes' },
    ]);
    const furnace = ctx.what.includes('furnace');
    const A = furnace ? r.int(15, 25) : r.int(16, 24),
      B = furnace ? 10 * r.int(30, 80) : r.int(45, 75);
    const k = r.pick([0.02, 0.025, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1, 0.12]);
    const t1 = r.int(4, 15);
    const T1 = Math.round(A + B * Math.exp(-k * t1));
    r.require(T1 > A + 5);
    const kG = -Math.log((T1 - A) / B) / t1;
    const T2 = A + Math.round(((T1 - A) * r.pick([0.3, 0.4, 0.5, 0.6])) / 1);
    r.require(T2 > A + 1 && T2 < T1);
    const t2 = -Math.log((T2 - A) / B) / kG;
    const V = ctx.v;
    const T0 = ans.exact(num(A + B), undefined, { unit: '^{\\circ}\\text{C}' });
    const K = ans.num(kG, { sf: 3 }),
      Tt = ans.num(t2, { sf: 3 }, { unit: `\\text{${ctx.tu}}`, alts: [-Math.log((T2 - A) / B) / s3(kG)] }),
      Lim = ans.exact(num(A), undefined, { unit: '^{\\circ}\\text{C}' });
    return {
      stem: md`${ctx.what} is modelled by $${V} = ${A} + ${B}e^{-kt}$, where $k$ is a positive constant.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Write down the initial temperature.`, answer: T0, scheme: [B1(md`$${A + B}$ °C`)], hints: ['Initially, t = 0.', md`$e^{0} = 1$`, md`$${A} + ${B}$`], solution: [md`At $t = 0$: $${V} = ${A} + ${B} = ${answerTex(T0)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Given that $${V} = ${T1}$ when $t = ${t1}$, find the value of $k$ to 3 significant figures.`, answer: K, scheme: [M1(md`$${T1} = ${A} + ${B}e^{-${t1}k}$`), M1(md`$e^{-${t1}k} = \dfrac{${T1 - A}}{${B}}$ and takes ln`), A1(md`awrt $${fmtSF(kG, 3)}$`)], hints: [md`Substitute $t = ${t1}$ and $${V} = ${T1}$.`, md`Rearrange to $e^{-${t1}k} = \dfrac{${T1 - A}}{${B}}$.`, 'Take natural logs, then divide.'], solution: [md`$e^{-${t1}k} = \dfrac{${T1 - A}}{${B}} \Rightarrow -${t1}k = \ln\left(\dfrac{${T1 - A}}{${B}}\right)$`, md`$k = ${answerTex(K)}$`] }),
        part({ label: 'c', marks: 3, prompt: md`Find the time taken for the temperature to fall to $${T2}$ °C.`, answer: Tt, scheme: [M1(md`$${T2} = ${A} + ${B}e^{-kt}$ with their $k$`), dM1('Rearranges and takes ln'), A1(md`awrt $${fmtSF(t2, 3)}$ ${ctx.tu}`)], hints: [md`Set $${V} = ${T2}$.`, md`$e^{-kt} = \dfrac{${T2 - A}}{${B}}$`, 'Take ln and divide by −k.'], solution: [md`$e^{-kt} = \dfrac{${T2 - A}}{${B}} \Rightarrow t = \dfrac{-1}{k}\ln\left(\dfrac{${T2 - A}}{${B}}\right) = ${answerTex(Tt)}$`] }),
        part({ label: 'd', marks: 1, prompt: md`State the temperature that the model predicts the ${furnace ? 'rod' : ctx.v === 'T' ? 'tea' : 'soup'} will approach in the long term.`, answer: Lim, scheme: [B1(md`$${A}$ °C`)], hints: ['What happens to e^{−kt} as t gets very large?', md`$e^{-kt} \to 0$`, md`So $${V} \to ${A}$.`], solution: [md`As $t \to \infty$, $e^{-kt} \to 0$, so $${V} \to ${answerTex(Lim)}$ (room temperature).`] }),
      ],
      params: { A, B, t1, T1, T2 },
    };
  },
  verify(inst) {
    const { A, B, t1, T1, T2 } = inst.params as Record<string, number>;
    const k = valOf(inst.parts[1].answer as NumericSpec);
    expectClose(A + B * Math.exp(-k * t1), T1, 'k fits data');
    expectClose(A + B * Math.exp(-k * valOf(inst.parts[2].answer as NumericSpec)), T2, 'time');
    expect(valOf(inst.parts[0].answer as ExactSpec) === A + B, 'initial');
  },
});

const growth = defineTemplate({
  id: 'p1.14.exponential-growth-model',
  family: 'p1.14.exponential-modelling',
  title: 'Exponential growth model: find k, predict, and criticise',
  spec: ['P6.7'],
  chapter: 'P1.14',
  sections: ['14.3', '14.7'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 8,
  time: 9,
  commands: ['Find', 'Give a reason'],
  tags: ['exponentials', 'modelling', 'growth', 'logarithms', 'limitations'],
  generate(r) {
    const C = r.pick([
      { what: 'The number of rabbits, $R$, on an island $t$ years after they were introduced', v: 'R', tu: 'years', P0: [20, 30, 40, 50, 80], k: [0.2, 0.25, 0.3, 0.35, 0.4], lim: 'The island has limited food and space, so the population cannot keep growing exponentially' },
      { what: 'The number of people, $N$, who have downloaded an app $t$ days after its launch', v: 'N', tu: 'days', P0: [200, 500, 800, 1500], k: [0.05, 0.08, 0.1, 0.12, 0.15], lim: 'The number of potential users is limited, so the number of downloads cannot grow without limit' },
      { what: 'The number of cells, $C$, in a laboratory culture $t$ hours after it was started', v: 'C', tu: 'hours', P0: [100, 250, 400, 600], k: [0.15, 0.2, 0.3, 0.45], lim: 'The nutrients and space in the dish run out, so growth must slow down' },
    ]);
    const P0 = r.pick(C.P0),
      k = r.pick(C.k);
    const t1 = r.int(2, 8);
    const P1 = Math.round(P0 * Math.exp(k * t1));
    const kG = Math.log(P1 / P0) / t1;
    const t2 = t1 + r.int(2, 8);
    const pred = P0 * Math.exp(kG * t2);
    const dbl = Math.log(2) / kG;
    const K = ans.num(kG, { sf: 3 }),
      Pr = ans.num(pred, { sf: 3 }, { alts: [P0 * Math.exp(s3(kG) * t2)] }),
      D = ans.num(dbl, { sf: 3 }, { unit: `\\text{${C.tu}}`, alts: [Math.log(2) / s3(kG)] });
    const opts = [C.lim, `The value of k is too small`, `Exponential models always underestimate`, `${C.v} cannot be less than ${P0}`];
    const Lm: ChoiceSpec = ans.choice(opts, 0);
    const V = C.v;
    return {
      stem: md`${C.what} is modelled by $${V} = ${P0}e^{kt}$, where $k$ is a constant. When $t = ${t1}$, $${V} = ${P1}$.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find the value of $k$, giving your answer to 3 significant figures.`, answer: K, scheme: [M1(md`$${P1} = ${P0}e^{${t1}k}$`), M1(md`$${t1}k = \ln\left(\dfrac{${P1}}{${P0}}\right)$`), A1(md`awrt $${fmtSF(kG, 3)}$`)], hints: [md`Substitute $t = ${t1}$, $${V} = ${P1}$.`, md`Divide by $${P0}$, then take natural logs.`, md`$k = \dfrac{1}{${t1}}\ln\left(\dfrac{${P1}}{${P0}}\right)$`], solution: [md`$e^{${t1}k} = \dfrac{${P1}}{${P0}} \Rightarrow k = \dfrac{1}{${t1}}\ln\left(\dfrac{${P1}}{${P0}}\right) = ${answerTex(K)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Use the model to predict the value of $${V}$ when $t = ${t2}$.`, answer: Pr, scheme: [M1(md`Substitutes $t = ${t2}$ with their $k$`), A1(md`awrt $${fmtSF(pred, 3)}$`)], hints: ['Use your value of k.', md`$${V} = ${P0}e^{${t2}k}$`, 'Give 3 significant figures.'], solution: [md`$${V} = ${P0}e^{${fmtSF(kG, 4)} \times ${t2}} = ${answerTex(Pr)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the time it takes for $${V}$ to double.`, answer: D, scheme: [M1(md`$e^{kt} = 2 \Rightarrow t = \dfrac{\ln 2}{k}$`), A1(md`awrt $${fmtSF(dbl, 3)}$ ${C.tu}`)], hints: [md`Doubling means $${V} = ${2 * P0}$.`, md`$e^{kt} = 2$`, 'Take ln of both sides.'], solution: [md`$e^{kt} = 2 \Rightarrow t = \dfrac{\ln 2}{k} = ${answerTex(D)}$`] }),
        part({ label: 'd', marks: 1, prompt: md`Give a reason why this model may not be suitable for large values of $t$.`, answer: Lm, scheme: [B1('Limiting factor in context')], hints: ['What happens to the model as t → ∞?', 'Is that realistic here?', 'Think about the resources available.'], solution: [md`${C.lim}.`] }),
      ],
      params: { P0, t1, P1, t2 },
    };
  },
  verify(inst) {
    const { P0, t1, P1, t2 } = inst.params as Record<string, number>;
    const k = valOf(inst.parts[0].answer as NumericSpec);
    expectClose(P0 * Math.exp(k * t1), P1, 'k');
    expectClose(valOf(inst.parts[1].answer as NumericSpec), P0 * Math.exp(k * t2), 'prediction');
    expectClose(Math.exp(k * valOf(inst.parts[2].answer as NumericSpec)), 2, 'doubling');
  },
});

const compound = defineTemplate({
  id: 'p1.14.depreciation-and-compound-growth',
  family: 'p1.14.exponential-modelling',
  title: 'Depreciation and compound interest: V = V₀bᵗ',
  spec: ['P6.7', 'P6.1'],
  chapter: 'P1.14',
  sections: ['14.3', '14.6'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 7,
  time: 8,
  commands: ['Write down', 'Find'],
  tags: ['exponentials', 'modelling', 'depreciation', 'compound interest', 'logarithms'],
  generate(r) {
    const grow = r.bool(0.4);
    const V0 = grow ? r.pick([2000, 3500, 5000, 8000, 12000]) : r.pick([12000, 15000, 18000, 24000, 30000]);
    const pc = grow ? r.pick([2, 2.5, 3, 3.5, 4, 5, 6]) : r.pick([10, 12, 15, 18, 20, 25]);
    const b = grow ? 1 + pc / 100 : 1 - pc / 100;
    const t = r.int(3, 8);
    const Vt = V0 * b ** t;
    const target = grow ? V0 * r.pick([1.5, 2, 2.5]) : V0 * r.pick([0.5, 0.4, 0.3, 0.25]);
    const tReal = Math.log(target / V0) / Math.log(b);
    const tFirst = Math.floor(tReal) + 1;
    r.require(Math.abs(tReal - Math.round(tReal)) > 0.02);
    const Bs = ans.exact(dec(Number(fmtNum(b, 4)), fmtNum(b, 4)), undefined, { allowDecimal: true });
    const Vs = ans.num(Vt, { dp: 0 });
    const Ts = ans.exact(num(tFirst));
    const what = grow ? `Ffion invests £${V0} in a savings account that pays ${pc}% compound interest per year` : `A car is bought for £${V0}. Its value falls by ${pc}% each year`;
    return {
      stem: md`${what}. The value, $£V$, after $t$ years is modelled by $V = ${V0}b^{t}$.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Write down the value of $b$.`, answer: Bs, scheme: [B1(md`$b = ${fmtNum(b, 4)}$`)], hints: [grow ? `Each year the amount is multiplied by (1 + ${pc}/100).` : `Each year the car keeps ${100 - pc}% of its value.`, `Write the percentage as a decimal multiplier.`, grow ? `100% + ${pc}% = ${100 + pc}%` : `100% − ${pc}% = ${100 - pc}%`], solution: [md`$b = ${answerTex(Bs)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the value after $${t}$ years, to the nearest pound.`, answer: Vs, scheme: [M1(md`$${V0} \times ${fmtNum(b, 4)}^{${t}}$`), A1(md`£$${Math.round(Vt)}$`)], hints: ['Substitute t into the model.', md`$V = ${V0} \times ${fmtNum(b, 4)}^{${t}}$`, 'Round to the nearest pound.'], solution: [md`$V = ${V0} \times ${fmtNum(b, 4)}^{${t}} = ${fmtNum(Vt, 2)} \approx ${answerTex(Vs)}$`] }),
        part({ label: 'c', marks: 4, prompt: md`Find the number of complete years after which the value first ${grow ? 'exceeds' : 'falls below'} £$${fmtNum(target)}$.`, answer: Ts, scheme: [M1(md`$${V0} \times ${fmtNum(b, 4)}^{t} ${grow ? '>' : '<'} ${fmtNum(target)}$`), M1(md`$t > \dfrac{\log ${fmtNum(target / V0)}}{\log ${fmtNum(b, 4)}}$${grow ? '' : ' (the inequality reverses because $\\log ' + fmtNum(b, 4) + ' < 0$)'}`), A1(md`$t = ${fmtSF(tReal, 4)}$`), A1(md`$${tFirst}$ years`)], hints: [md`Solve $${fmtNum(b, 4)}^{t} = ${fmtNum(target / V0)}$ using logs.`, grow ? 'Take logs of both sides.' : md`$\log ${fmtNum(b, 4)} < 0$, so dividing by it reverses an inequality.`, 'The answer must be a whole number of years — round up.'], solution: [md`$${fmtNum(b, 4)}^{t} = ${fmtNum(target / V0)} \Rightarrow t = \dfrac{\ln ${fmtNum(target / V0)}}{\ln ${fmtNum(b, 4)}} = ${fmtSF(tReal, 4)}$`, md`So the value first ${grow ? 'exceeds' : 'falls below'} £$${fmtNum(target)}$ after $${answerTex(Ts)}$ years.`] }),
      ],
      params: { V0, b, t, target, grow },
    };
  },
  verify(inst) {
    const { V0, b, t, target, grow } = inst.params as { V0: number; b: number; t: number; target: number; grow: boolean };
    expectClose(valOf(inst.parts[1].answer as NumericSpec), V0 * b ** t, 'value');
    const n = valOf(inst.parts[2].answer as ExactSpec);
    const passed = (m: number) => (grow ? V0 * b ** m > target : V0 * b ** m < target);
    expect(passed(n) && !passed(n - 1), 'first complete year');
  },
});

const templates: Template[] = [powerLaw, expLogGraph, linearForm, cooling, growth, compound];
export default templates;
