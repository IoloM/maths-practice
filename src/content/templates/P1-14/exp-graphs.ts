/** Pure Year 1, Chapter 14 — exponential functions, y = eˣ and the gradient of e^{kx} (14.1–14.3). */
import { Q } from '../../../engine/core/rational';
import { evaluate, neg, num, sym } from '../../../engine/core/expr';
import { derivative, expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { plot } from '../../../engine/core/svg';
import { answerTex } from '../../../engine/marking/mark';
import type { CoordSpec, EquationSpec, ExactSpec, ExprSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, err, iv, lead, md, part, sgn } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';

const INF = sym('infty');
const negInf = neg(INF);
const Y = sym('y');
const exq = (q: Q | number) => num(Q.from(q));
const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
/** e^{kx} as LaTeX: e^{x}, e^{-x}, e^{2x}, e^{\frac{1}{2}x}. */
export const ekx = (k: Q | number, v = 'x') => {
  const q = Q.from(k);
  return `e^{${q.eq(1) ? '' : q.eq(-1) ? '-' : q.toLatex()}${v}}`;
};
/** ln of a positive rational, bracketed when it is a fraction. */
export const lnQ = (q: Q) => (q.d === 1 ? `\\ln ${q.n}` : `\\ln\\left(${q.toLatex()}\\right)`);
/** c·body with c a rational: 1 → body, −1 → −body, ½ → \frac{1}{2}body. */
const times = (c: Q, body: string) => (c.eq(1) ? body : c.eq(-1) ? `-${body}` : `${c.toLatex()}${body}`);

// ---------------------------------------------------------------- 14.1–14.2 graphs
const features = defineTemplate({
  id: 'p1.14.exponential-graph-features',
  family: 'p1.14.exponential-graphs',
  title: 'Intercept, asymptote and range of an exponential graph',
  spec: ['P6.1'],
  chapter: 'P1.14',
  sections: ['14.1', '14.2'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 1,
  marks: 3,
  time: 3,
  commands: ['Write down', 'State'],
  tags: ['exponentials', 'graphs', 'asymptote', 'range'],
  generate(r) {
    const base = r.pick(['e', 'e', 'e', 2, 3, 5] as const);
    const A = r.pick([1, 2, 3, 4, -1, -2, -3]);
    const k = base === 'e' ? r.pick([Q.of(1), Q.of(2), Q.of(3), Q.of(-1), Q.of(-2), Q.of(1, 2), Q.of(-1, 2)]) : r.pick([Q.of(1), Q.of(-1), Q.of(2)]);
    const c = r.intNZ(-6, 6);
    const body = base === 'e' ? ekx(k) : `${base}^{${k.eq(1) ? '' : k.eq(-1) ? '-' : k.toLatex()}x}`;
    const yTex = `${base === 'e' || Math.abs(A) === 1 ? lead(A, body) : `${A} \\times ${body}`}${sgn(c)}`;
    const b = base === 'e' ? Math.E : base;
    const f = (x: number) => A * b ** (k.value * x) + c;
    const Yint = ans.coord(ans.exact(num(0)), ans.exact(exq(A + c)));
    const Asy = ans.eq(Y, exq(c), ['x', 'y']);
    const Rng = ans.interval([A > 0 ? iv(exq(c), INF, false, false) : iv(negInf, exq(c), false, false)], 'y');
    const yr: [number, number] = A > 0 ? [Math.min(-2, c - 2), Math.max(c + 10, 3)] : [Math.min(c - 10, -3), Math.max(2, c + 2)];
    const svg = plot({ x: [-3, 3], y: yr, curves: [{ f, from: -3, to: 3, label: 'C', labelAt: k.value * A > 0 ? 1 : -1.6 }], axes: { x: 'x', y: 'y' } });
    return {
      stem: md`The diagram shows a sketch of the curve $C$ with equation $y = ${yTex}$.`,
      diagram: { svg, alt: `Sketch of the exponential curve C, which levels off towards a horizontal asymptote on one side and grows steeply on the other.` },
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Write down the coordinates of the point where $C$ crosses the $y$-axis.`, answer: Yint, scheme: [B1(md`$${answerTex(Yint)}$`)], hints: ['On the y-axis, x = 0.', md`Substitute $x = 0$: any number to the power $0$ is $1$.`, md`$y = ${A} \times 1 ${c < 0 ? '-' : '+'} ${Math.abs(c)}$`], solution: [md`At $x = 0$: $y = ${A}(1)${sgn(c)} = ${A + c}$, so $${answerTex(Yint)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Write down the equation of the asymptote to $C$.`, answer: Asy, scheme: [B1(md`$${answerTex(Asy)}$`)], hints: [`As the exponential term gets very small, what does y approach?`, md`$${body} \to 0$ as $x \to ${k.value > 0 ? '-' : ''}\infty$.`, 'The asymptote is a horizontal line y = constant.'], errors: [err('x-axis', ans.eq(Y, num(0), ['x', 'y']), 'The graph has been translated vertically — the asymptote moves too.')], solution: [md`As $x \to ${k.value > 0 ? '-' : ''}\infty$, $${body} \to 0$, so $y \to ${c}$: the asymptote is $${answerTex(Asy)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`Write down the set of possible values of $y$.`, answer: Rng, scheme: [B1(md`$${answerTex(Rng)}$`)], hints: [md`$${body}$ is always positive.`, md`So $${A === 1 ? '' : A === -1 ? '-' : A}${body}$ is always ${A > 0 ? 'positive' : 'negative'}.`, `Add ${c} to that.`], errors: [err('wrong-side', ans.interval([A < 0 ? iv(exq(c), INF, false, false) : iv(negInf, exq(c), false, false)], 'y'), md`Check the sign of $${A}${body}$.`)], solution: [md`$${body} > 0$ for all $x$, so $${answerTex(Rng)}$`] }),
      ],
      params: { A, k: k.value, c, b },
    };
  },
  verify(inst) {
    const { A, k, c, b } = inst.params as Record<string, number>;
    const f = (x: number) => A * b ** (k * x) + c;
    expectClose(valOf((inst.parts[0].answer as CoordSpec).y), f(0), 'y-intercept');
    expectClose(f(k > 0 ? -40 : 40), evaluate((inst.parts[1].answer as EquationSpec).rhs), 'asymptote', 1e-6);
    expect(A > 0 ? f(0.5) > c : f(0.5) < c, 'range side');
  },
});

const crossings = defineTemplate({
  id: 'p1.14.exponential-graph-crossings',
  family: 'p1.14.exponential-graphs',
  title: 'Exact axis crossings of y = Ae^{kx} − B',
  spec: ['P6.1', 'P6.3'],
  chapter: 'P1.14',
  sections: ['14.2', '14.7'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 5,
  time: 5,
  commands: ['Find', 'Write down'],
  tags: ['exponentials', 'graphs', 'natural logarithm', 'exact'],
  generate(r) {
    const A = r.int(1, 6),
      B = r.int(1, 12);
    r.require(A !== B);
    const k = r.pick([Q.of(1), Q.of(2), Q.of(3), Q.of(-1), Q.of(-2), Q.of(1, 2)]);
    const ratio = Q.of(B, A);
    const xTex = times(k.inv(), lnQ(ratio));
    const X = ans.exact(ex(xTex), ['exact']);
    const Yi = ans.coord(ans.exact(num(0)), ans.exact(exq(A - B)));
    const Asy = ans.eq(Y, exq(-B), ['x', 'y']);
    const yTex = `${lead(A, ekx(k))} - ${B}`;
    return {
      stem: md`The curve $C$ has equation $y = ${yTex}$.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find the coordinates of the point where $C$ crosses the $y$-axis.`, answer: Yi, scheme: [B1(md`$${answerTex(Yi)}$`)], hints: ['Set x = 0.', md`$e^{0} = 1$`, md`$y = ${A} - ${B}$`], solution: [md`$x = 0$: $y = ${A} - ${B} = ${A - B}$, giving $${answerTex(Yi)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Find the exact $x$-coordinate of the point where $C$ crosses the $x$-axis.`, answer: X, scheme: [M1(md`Sets $y = 0$: $${ekx(k)} = ${ratio.toLatex()}$`), M1(md`Takes $\ln$ of both sides: $${k.eq(1) ? '' : k.eq(-1) ? '-' : k.toLatex()}x = ${lnQ(ratio)}$`), A1(md`$x = ${answerTex(X)}$`)], hints: ['On the x-axis, y = 0.', md`Rearrange to get $${ekx(k)}$ on its own, then take natural logs.`, md`$\ln\left(e^{a}\right) = a$`], errors: k.eq(1) ? [] : [err('not-divided', ans.exact(ex(lnQ(ratio)), ['exact']), md`That is the value of $${k.toLatex()}x$ — divide by $${k.toLatex()}$.`, 2)], solution: [md`$${lead(A, ekx(k))} = ${B} \Rightarrow ${ekx(k)} = ${ratio.toLatex()}$`, md`$${k.eq(1) ? '' : k.eq(-1) ? '-' : k.toLatex()}x = ${lnQ(ratio)} \Rightarrow x = ${answerTex(X)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`Write down the equation of the asymptote to $C$.`, answer: Asy, scheme: [B1(md`$${answerTex(Asy)}$`)], hints: [md`$${ekx(k)} \to 0$ as $x \to ${k.value > 0 ? '-' : ''}\infty$.`, 'So y approaches the constant term.', 'Write it as y = …'], solution: [md`$${answerTex(Asy)}$`] }),
      ],
      params: { A, B, k: k.value },
    };
  },
  verify(inst) {
    const { A, B, k } = inst.params as Record<string, number>;
    const x = valOf(inst.parts[1].answer as ExactSpec);
    expectClose(A * Math.exp(k * x) - B + 1, 1, 'crosses x-axis', 1e-9);
  },
});

const kbPoints = defineTemplate({
  id: 'p1.14.find-k-and-b-from-points',
  family: 'p1.14.exponential-graphs',
  title: 'Find k and b for y = kbˣ through two points',
  spec: ['P6.1'],
  chapter: 'P1.14',
  sections: ['14.1', '14.3'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find'],
  tags: ['exponentials', 'simultaneous', 'graphs'],
  generate(r) {
    const b = r.pick([Q.of(2), Q.of(3), Q.of(4), Q.of(5), Q.of(1, 2), Q.of(1, 3)]);
    const x1 = r.pick([0, 1]),
      gap = r.pick([1, 2]),
      x2 = x1 + gap;
    const k = r.int(2, 9) * (b.d === 1 ? 1 : b.d ** x2);
    const y = (x: number) => b.pow(x).mul(k);
    const y1 = y(x1),
      y2 = y(x2);
    const x3 = x2 + 1;
    const Bs = ans.exact(exq(b)),
      Ks = ans.exact(exq(k)),
      Y3 = ans.exact(exq(y(x3)));
    const f = (x: number) => k * b.value ** x;
    const top = Math.max(f(-1), f(x3)) * 1.15;
    const svg = plot({ x: [-1, x3], y: [-top * 0.08, top], curves: [{ f, from: -1, to: x3, label: 'C', labelAt: b.value > 1 ? x3 - 0.3 : -0.6 }], points: [{ x: x1, y: f(x1), label: `(${x1}, ${y1.toString()})`, dx: 6, dy: -6 }, { x: x2, y: f(x2), label: `(${x2}, ${y2.toString()})`, dx: 6, dy: -6 }], axes: { x: 'x', y: 'y' } });
    return {
      stem: md`The curve $C$ has equation $y = kb^{x}$, where $k$ and $b$ are positive constants. $C$ passes through the points $(${x1}, ${y1.toLatex()})$ and $(${x2}, ${y2.toLatex()})$.`,
      diagram: { svg, alt: `Exponential curve C through the points (${x1}, ${y1.toString()}) and (${x2}, ${y2.toString()}).` },
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the value of $b$.`, answer: Bs, scheme: [M1(md`Divides: $b^{${gap}} = \dfrac{${y2.toLatex()}}{${y1.toLatex()}}$`), A1(md`$b = ${b.toLatex()}$`)], hints: [md`Write two equations: $${y1.toLatex()} = kb^{${x1}}$ and $${y2.toLatex()} = kb^{${x2}}$.`, 'Divide one equation by the other so that k cancels.', gap === 2 ? 'Then take the positive square root.' : 'That leaves b on its own.'], solution: [md`$\dfrac{kb^{${x2}}}{kb^{${x1}}} = b^{${gap}} = ${y2.div(y1).toLatex()}$, so $b = ${answerTex(Bs)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the value of $k$.`, answer: Ks, scheme: [M1('Substitutes their b into either equation'), A1(md`$k = ${k}$`)], hints: ['Use either point.', md`$${y1.toLatex()} = k \times ${b.toLatex()}^{${x1}}$`, x1 === 0 ? 'Any number to the power 0 is 1.' : 'Divide to find k.'], solution: [md`$${y1.toLatex()} = k \times ${b.pow(x1).toLatex()}$, so $k = ${answerTex(Ks)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`Find the value of $y$ when $x = ${x3}$.`, answer: Y3, scheme: [B1(md`$${answerTex(Y3)}$`)], hints: ['Use your k and b.', md`$y = ${k} \times ${b.toLatex()}^{${x3}}$`, 'Keep it exact.'], solution: [md`$y = ${k} \times \left(${b.toLatex()}\right)^{${x3}} = ${answerTex(Y3)}$`] }),
      ],
      params: { x1, x2, x3, y1: y1.value, y2: y2.value },
    };
  },
  verify(inst) {
    const { x1, x2, x3, y1, y2 } = inst.params as Record<string, number>;
    const b = valOf(inst.parts[0].answer as ExactSpec),
      k = valOf(inst.parts[1].answer as ExactSpec);
    expectClose(k * b ** x1, y1, 'point 1');
    expectClose(k * b ** x2, y2, 'point 2');
    expectClose(valOf(inst.parts[2].answer as ExactSpec), k * b ** x3, 'y at x3');
  },
});

// ---------------------------------------------------------------- 14.2 gradient of e^{kx}
const KS = [Q.of(2), Q.of(3), Q.of(4), Q.of(5), Q.of(1, 2), Q.of(1, 3)];

const diffEkx = defineTemplate({
  id: 'p1.14.differentiate-ekx',
  family: 'p1.14.gradient-ekx',
  title: 'Differentiate expressions involving e^{kx}',
  spec: ['P6.2'],
  chapter: 'P1.14',
  sections: ['14.2'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 5,
  time: 5,
  commands: ['Find'],
  tags: ['exponentials', 'differentiation', 'gradient'],
  generate(r) {
    const A = r.intNZ(-5, 5),
      B = r.intNZ(-5, 5),
      C = r.int(-4, 4);
    const k = r.pick(KS),
      m = r.pick([1, 2, 3]),
      n = r.pick([2, 3]);
    const yTex = sumTex([[A, ekx(k)], [B, ekx(-m)], [C, `x^{${n}}`]]);
    const dTex = sumTex([[k.mul(A), ekx(k)], [-B * m, ekx(-m)], [C * n, n === 2 ? 'x' : `x^{${n - 1}}`]]);
    const D = ans.expr(ex(dTex), ['x']);
    const G = ans.exact(exq(k.mul(A).sub(B * m)));
    const noChain = sumTex([[A, ekx(k)], [B, ekx(-m)], [C * n, n === 2 ? 'x' : `x^{${n - 1}}`]]);
    return {
      stem: md`The curve $C$ has equation $y = ${yTex}$.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find $\dfrac{\mathrm{d}y}{\mathrm{d}x}$.`, answer: D, scheme: [M1(md`$e^{kx} \to ke^{kx}$ on at least one exponential term`), A1('Both exponential terms correct'), A1(md`$${dTex}$`)], hints: [md`$\dfrac{\mathrm{d}}{\mathrm{d}x}\left(e^{kx}\right) = ke^{kx}$`, md`So $${ekx(-m)}$ differentiates to $${-m}${ekx(-m)}$.`, 'Differentiate the power of x in the usual way.'], errors: [err('no-k', ans.expr(ex(noChain), ['x']), md`The derivative of $e^{kx}$ is $ke^{kx}$, not $e^{kx}$.`, 1)], solution: [md`$\dfrac{\mathrm{d}y}{\mathrm{d}x} = ${answerTex(D)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the gradient of $C$ at the point where it crosses the $y$-axis.`, answer: G, scheme: [M1('Substitutes x = 0 into their derivative'), A1(md`$${answerTex(G)}$`)], hints: ['On the y-axis, x = 0.', md`$e^{0} = 1$`, md`Substitute $x = 0$ into $\dfrac{\mathrm{d}y}{\mathrm{d}x}$.`], solution: [md`At $x = 0$: $\dfrac{\mathrm{d}y}{\mathrm{d}x} = ${k.mul(A).toLatex()} ${B * m > 0 ? '-' : '+'} ${Math.abs(B * m)} = ${answerTex(G)}$`] }),
      ],
      params: { yTex },
    };
  },
  verify(inst) {
    const { yTex } = inst.params as { yTex: string };
    const f = (x: number) => evaluate(ex(yTex), { x });
    const d = (inst.parts[0].answer as ExprSpec).value;
    for (const x of [-0.7, 0.4, 1.1]) expectClose(evaluate(d, { x }), derivative(f, x), 'derivative', 1e-6);
    expectClose(valOf(inst.parts[1].answer as ExactSpec), derivative(f, 0), 'gradient at 0', 1e-6);
  },
});

const gradAtLn = defineTemplate({
  id: 'p1.14.gradient-at-ln-point',
  family: 'p1.14.gradient-ekx',
  title: 'Exact gradient of y = Ae^{kx} at x = ln p, and where the gradient takes a value',
  spec: ['P6.2', 'P6.3'],
  chapter: 'P1.14',
  sections: ['14.2', '14.7'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 6,
  commands: ['Find'],
  tags: ['exponentials', 'differentiation', 'natural logarithm', 'exact'],
  generate(r) {
    const A = r.pick([1, 2, 3, 4, 5, -1, -2, -3]);
    const k = r.pick([1, 2, 3, -1, -2]);
    const p = r.pick([2, 3, 5]);
    const g = Q.of(A * k).mul(Q.of(p).pow(k));
    const t = r.pick([Q.of(2), Q.of(3), Q.of(4), Q.of(5), Q.of(6), Q.of(7), Q.of(1, 2), Q.of(1, 3)]);
    r.require(!t.eq(Q.of(p).pow(k)));
    const G = t.mul(A * k);
    const Gs = ans.exact(exq(g));
    const xTex = times(Q.of(1, k), lnQ(t));
    const X = ans.exact(ex(xTex), ['exact']);
    const yTex = lead(A, ekx(k));
    return {
      stem: md`The curve $C$ has equation $y = ${yTex}$.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find the exact value of the gradient of $C$ at the point where $x = \ln ${p}$.`, answer: Gs, scheme: [M1(md`$\dfrac{\mathrm{d}y}{\mathrm{d}x} = ${lead(A * k, ekx(k))}$`), M1(md`Substitutes $x = \ln ${p}$ and uses $e^{${k === 1 ? '' : k}\ln ${p}} = ${p}^{${k}}$`), A1(md`$${answerTex(Gs)}$`)], hints: [md`$\dfrac{\mathrm{d}}{\mathrm{d}x}\left(e^{kx}\right) = ke^{kx}$`, md`$e^{${k === 1 ? '' : k === -1 ? '-' : k}\ln ${p}} = e^{\ln (${p}^{${k}})} = ${p}^{${k}}$`, 'Multiply out to get an exact number.'], errors: [err('y-value', ans.exact(exq(Q.of(A).mul(Q.of(p).pow(k)))), 'That is the y-coordinate. Differentiate first.', 1)], solution: [md`$\dfrac{\mathrm{d}y}{\mathrm{d}x} = ${lead(A * k, ekx(k))}$`, md`At $x = \ln ${p}$: $${A * k} \times ${p}^{${k}} = ${answerTex(Gs)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Find the exact $x$-coordinate of the point on $C$ where the gradient is $${G.toLatex()}$.`, answer: X, scheme: [M1(md`$${lead(A * k, ekx(k))} = ${G.toLatex()}$`), M1(md`$${ekx(k)} = ${t.toLatex()}$ and takes logs`), A1(md`$x = ${answerTex(X)}$`)], hints: ['Set the derivative equal to the given gradient.', md`Make $${ekx(k)}$ the subject.`, 'Take natural logs of both sides, then divide by the coefficient of x.'], solution: [md`$${lead(A * k, ekx(k))} = ${G.toLatex()} \Rightarrow ${ekx(k)} = ${t.toLatex()}$`, md`$${k === 1 ? '' : k === -1 ? '-' : k}x = ${lnQ(t)} \Rightarrow x = ${answerTex(X)}$`] }),
      ],
      params: { A, k, p, G: G.value },
    };
  },
  verify(inst) {
    const { A, k, p, G } = inst.params as Record<string, number>;
    expectClose(valOf(inst.parts[0].answer as ExactSpec), A * k * Math.exp(k * Math.log(p)), 'gradient at ln p');
    const x = valOf(inst.parts[1].answer as ExactSpec);
    expectClose(A * k * Math.exp(k * x), G, 'gradient value');
  },
});

const MODELS = [
  { what: 'population of a species of bird on an island', v: 'P', grow: true, P0: [120, 250, 400, 600, 850], k: [0.02, 0.03, 0.04, 0.05, 0.06, 0.08], unit: 'birds per year', tu: 'years' },
  { what: 'number of bacteria in a culture', v: 'N', grow: true, P0: [500, 800, 1200, 2000, 3500], k: [0.1, 0.12, 0.15, 0.2, 0.25], unit: 'bacteria per hour', tu: 'hours' },
  { what: 'mass, in grams, of a radioactive substance', v: 'm', grow: false, P0: [40, 60, 80, 120, 200], k: [0.01, 0.02, 0.025, 0.04, 0.05], unit: 'grams per day', tu: 'days' },
  { what: 'amount, in mg, of a drug in a patient’s bloodstream', v: 'D', grow: false, P0: [10, 15, 20, 25, 30], k: [0.1, 0.15, 0.2, 0.25, 0.3], unit: 'mg per hour', tu: 'hours' },
];

const rateModel = defineTemplate({
  id: 'p1.14.rate-of-change-exponential-model',
  family: 'p1.14.gradient-ekx',
  title: 'Rate of change in an exponential model',
  spec: ['P6.2', 'P6.7'],
  chapter: 'P1.14',
  sections: ['14.2', '14.3'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find', 'Interpret'],
  tags: ['exponentials', 'differentiation', 'modelling', 'rate of change'],
  generate(r) {
    const M = r.pick(MODELS);
    const P0 = r.pick(M.P0),
      k = r.pick(M.k);
    const s = M.grow ? 1 : -1;
    const T = r.int(2, 12);
    const v = M.v;
    const kTex = `${s < 0 ? '-' : ''}${fmtNum(k)}t`;
    const D = ans.expr(ex(`${s < 0 ? '-' : ''}${fmtNum(P0 * k, 6)}e^{${kTex}}`), ['t']);
    const rateT = P0 * k * Math.exp(s * k * T);
    const R1 = ans.num(rateT, { sf: 3 }, { unit: `\\text{${M.unit}}` });
    // time at which the rate is a given value
    const R = Number(fmtSF(P0 * k * Math.exp(s * k * r.int(3, 15)), 2));
    const tR = (s * Math.log(R / (P0 * k))) / k;
    r.require(tR > 0.5);
    const TR = ans.num(tR, { sf: 3 }, { unit: `\\text{${M.tu}}` });
    return {
      stem: md`The ${M.what} is modelled by $${v} = ${P0}e^{${kTex}}$, where $t$ is the time in ${M.tu}.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find $\dfrac{\mathrm{d}${v}}{\mathrm{d}t}$.`, answer: D, scheme: [M1(md`$e^{${kTex}} \to ${s < 0 ? '-' : ''}${fmtNum(k)}e^{${kTex}}$`), A1(md`$${answerTex(D)}$`)], hints: [md`$\dfrac{\mathrm{d}}{\mathrm{d}t}\left(e^{kt}\right) = ke^{kt}$`, md`Here $k = ${s < 0 ? '-' : ''}${fmtNum(k)}$.`, md`Multiply $${P0}$ by $${s < 0 ? '-' : ''}${fmtNum(k)}$.`], solution: [md`$\dfrac{\mathrm{d}${v}}{\mathrm{d}t} = ${answerTex(D)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the rate at which ${v === 'P' || v === 'N' ? 'the number' : 'the amount'} is ${M.grow ? 'increasing' : 'decreasing'} when $t = ${T}$.`, answer: R1, scheme: [M1(md`Substitutes $t = ${T}$ into their derivative`), A1(md`awrt $${fmtSF(rateT, 3)}$`)], hints: ['Use your answer to (a).', md`Substitute $t = ${T}$.`, M.grow ? 'Give the answer to 3 significant figures.' : 'The derivative is negative because the amount is decreasing: give the rate as a positive number.'], errors: M.grow ? [] : [err('negative-rate', ans.num(-rateT, { sf: 3 }), 'The question asks for the rate of decrease, which is positive.', 1)], solution: [md`$${M.grow ? '' : '\\left|'}\dfrac{\mathrm{d}${v}}{\mathrm{d}t}${M.grow ? '' : '\\right|'} = ${fmtNum(P0 * k, 6)}e^{${s < 0 ? '-' : ''}${fmtNum(k * T, 6)}} = ${answerTex(R1)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the value of $t$ when ${v === 'P' || v === 'N' ? 'the number' : 'the amount'} is ${M.grow ? 'increasing' : 'decreasing'} at a rate of $${R}$ ${M.unit}.`, answer: TR, scheme: [M1(md`$${fmtNum(P0 * k, 6)}e^{${kTex}} = ${R}$ and takes logs`), A1(md`awrt $${fmtSF(tR, 3)}$`)], hints: [md`Set $${fmtNum(P0 * k, 6)}e^{${kTex}} = ${R}$.`, 'Divide, then take natural logs.', md`Divide by $${s < 0 ? '-' : ''}${fmtNum(k)}$ at the end.`], solution: [md`$e^{${kTex}} = \dfrac{${R}}{${fmtNum(P0 * k, 6)}} \Rightarrow t = ${answerTex(TR)}$`] }),
      ],
      params: { P0, k, s, T, R },
    };
  },
  verify(inst) {
    const { P0, k, s, T, R } = inst.params as Record<string, number>;
    const P = (t: number) => P0 * Math.exp(s * k * t);
    const d = (inst.parts[0].answer as ExprSpec).value;
    expectClose(evaluate(d, { t: 1.3 }), derivative(P, 1.3), 'derivative', 1e-6);
    expectClose(valOf(inst.parts[1].answer as NumericSpec), Math.abs(derivative(P, T)), 'rate at T', 1e-6);
    expectClose(Math.abs(derivative(P, valOf(inst.parts[2].answer as NumericSpec))), R, 'time for rate', 1e-6);
  },
});

const templates: Template[] = [features, crossings, kbPoints, diffEkx, gradAtLn, rateModel];
export default templates;
