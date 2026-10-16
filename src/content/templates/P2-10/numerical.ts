/** Pure Year 2, Chapter 10 — numerical methods: change of sign, iteration, Newton–Raphson, context. */
import { bisect, derivative, expect, expectClose, rootsIn } from '../../../engine/core/numeric';
import { fmtDP, fmtNum, fmtSF } from '../../../engine/core/format';
import { num } from '../../../engine/core/expr';
import { answerTex } from '../../../engine/marking/mark';
import type { ListSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import type { Rng } from '../../../engine/core/rng';
import { plot, yRangeOf } from '../../../engine/core/svg';
import { sumTex } from '../shared/calculus';

interface Fam {
  fTex: string;
  f: (x: number) => number;
  df: (x: number) => number;
  dfTex: string;
  /** a convergent rearrangement x = g(x) */
  gTex: string;
  g: (x: number) => number;
  root: number;
  lo: number;
  hi: number;
}

function family(r: Rng): Fam {
  const kind = r.pick(['log', 'exp', 'cubic'] as const);
  if (kind === 'log') {
    const c = r.int(2, 6);
    const f = (x: number) => Math.log(x) + x - c;
    const root = bisect(f, 0.01, 20);
    return { fTex: sumTex([[1, '\\ln x'], [1, 'x'], [-c, '']]), f, df: (x) => 1 / x + 1, dfTex: '\\frac{1}{x} + 1', gTex: `${c} - \\ln x`, g: (x) => c - Math.log(x), root, lo: 0.3, hi: c + 1 };
  }
  if (kind === 'exp') {
    const c = r.int(3, 8);
    const f = (x: number) => Math.exp(x / 2) + x - c;
    const root = bisect(f, -10, 10);
    return { fTex: `e^{\\frac{1}{2}x} + x - ${c}`, f, df: (x) => 0.5 * Math.exp(x / 2) + 1, dfTex: '\\frac{1}{2}e^{\\frac{1}{2}x} + 1', gTex: `2\\ln\\left(${c} - x\\right)`, g: (x) => 2 * Math.log(c - x), root, lo: root - 2, hi: root + 2 };
  }
  const b = r.int(2, 6),
    c = r.int(3, 20);
  const f = (x: number) => x ** 3 + b * x - c;
  const root = bisect(f, -10, 10);
  return { fTex: sumTex([[1, 'x^{3}'], [b, 'x'], [-c, '']]), f, df: (x) => 3 * x * x + b, dfTex: `3x^{2} + ${b}`, gTex: `\\frac{${c}}{x^{2} + ${b}}`, g: (x) => c / (x * x + b), root, lo: root - 2, hi: root + 2 };
}

const D4 = (v: number) => ans.num(v, { dp: 4 });

const signChange = defineTemplate({
  id: 'p2.10.change-of-sign',
  family: 'p2.10.locating-roots',
  title: 'Show a root lies in an interval by change of sign',
  spec: ['P9.1'],
  chapter: 'P2.10',
  sections: ['10.1'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 2,
  marks: 3,
  time: 4,
  commands: ['Show that', 'Calculate'],
  tags: ['numerical methods', 'change of sign', 'root'],
  generate(r) {
    const F = family(r);
    const a = Math.floor(F.root * 10) / 10;
    r.require(a > F.lo && a + 0.1 < F.hi && Math.abs(F.f(a)) > 1e-4 && Math.abs(F.f(a + 0.1)) > 1e-4);
    const b = Number((a + 0.1).toFixed(1));
    const Fa = D4(F.f(a)),
      Fb = D4(F.f(b));
    const C = ans.choice([md`There is a change of sign and $\mathrm{f}$ is continuous on $[${fmtNum(a)}, ${fmtNum(b)}]$, so there is a root in the interval.`, md`There is a change of sign, so the root is exactly halfway between $${fmtNum(a)}$ and $${fmtNum(b)}$.`, md`$\mathrm{f}(${fmtNum(a)})$ and $\mathrm{f}(${fmtNum(b)})$ are both small, so there is a root.`], 0);
    return {
      stem: md`$\mathrm{f}(x) = ${F.fTex}$.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Calculate $\mathrm{f}(${fmtNum(a)})$, to 4 decimal places.`, answer: Fa, scheme: [B1(md`$${fmtDP(F.f(a), 4)}$`)], hints: ['Substitute the value into f(x).', 'Use radians/natural logs as written.', 'Keep 4 decimal places.'], solution: [md`$\mathrm{f}(${fmtNum(a)}) = ${answerTex(Fa)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Calculate $\mathrm{f}(${fmtNum(b)})$, to 4 decimal places.`, answer: Fb, scheme: [B1(md`$${fmtDP(F.f(b), 4)}$`)], hints: ['Substitute the value into f(x).', 'Watch the sign.', 'Keep 4 decimal places.'], solution: [md`$\mathrm{f}(${fmtNum(b)}) = ${answerTex(Fb)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`Hence explain why the equation $\mathrm{f}(x) = 0$ has a root in the interval $[${fmtNum(a)}, ${fmtNum(b)}]$.`, answer: C, scheme: [B1('Change of sign and continuity, with a conclusion')], hints: ['Compare the signs of your two values.', 'A continuous function that changes sign must cross zero.', 'Mention continuity.'], solution: [md`$\mathrm{f}(${fmtNum(a)}) < 0 < \mathrm{f}(${fmtNum(b)})$ (or vice versa) and $\mathrm{f}$ is continuous, so there is a root between them.`] }),
      ],
      params: { a, b, root: F.root },
    };
  },
  verify(inst) {
    const { a, b, root } = inst.params as Record<string, number>;
    const fa = (inst.parts[0].answer as NumericSpec).value,
      fb = (inst.parts[1].answer as NumericSpec).value;
    expect(fa * fb < 0, 'sign change');
    expect(root > a && root < b, 'root in interval');
  },
});

const signFailure = defineTemplate({
  id: 'p2.10.sign-change-failure',
  family: 'p2.10.locating-roots',
  title: 'When the change-of-sign method fails',
  spec: ['P9.1'],
  chapter: 'P2.10',
  sections: ['10.1'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 3,
  time: 4,
  commands: ['Explain', 'Calculate'],
  tags: ['numerical methods', 'change of sign', 'asymptote'],
  generate(r) {
    const variant = r.pick(['asymptote', 'two-roots'] as const);
    if (variant === 'asymptote') {
      const a = r.int(1, 5),
        k = r.int(1, 4);
      const lo = a - r.pick([0.5, 1]),
        hi = a + r.pick([0.5, 1]);
      const f = (x: number) => k / (x - a) + 0.1 * x;
      const flo = D4(f(lo));
      const opts = r.shuffle([md`$\mathrm{f}$ is not continuous: there is a vertical asymptote at $x = ${a}$, so the sign change does not show a root.`, md`There is a root at $x = ${a}$.`, md`There are two roots between $${lo}$ and $${hi}$.`]);
      const C = ans.choice(opts, opts.findIndex((o) => o.includes('asymptote')));
      return {
        stem: md`$\mathrm{f}(x) = \dfrac{${k}}{x - ${a}} + 0.1x$, $x \neq ${a}$. A student notes that $\mathrm{f}(${lo})$ and $\mathrm{f}(${hi})$ have opposite signs.`,
        parts: [
          part({ label: 'a', marks: 1, prompt: md`Calculate $\mathrm{f}(${lo})$.`, answer: flo, scheme: [B1(md`$${fmtDP(f(lo), 4)}$`)], hints: ['Substitute.', 'Be careful with the negative denominator.', 'Give 4 d.p.'], solution: [md`$\mathrm{f}(${lo}) = ${answerTex(flo)}$`] }),
          part({ label: 'b', marks: 2, prompt: md`Explain why this does not show that $\mathrm{f}(x) = 0$ has a root between $${lo}$ and $${hi}$.`, answer: C, scheme: [B1('Discontinuity / asymptote identified'), B1('So the sign change is not caused by a root')], hints: ['Is f continuous on the interval?', md`What happens at $x = ${a}$?`, 'The change of sign method needs continuity.'], solution: [md`$\mathrm{f}$ has a vertical asymptote at $x = ${a}$, so it is not continuous on $[${lo}, ${hi}]$; the sign change is due to the asymptote, not a root.`] }),
        ],
        params: { variant, a, k, lo, hi },
      };
    }
    const p = r.int(1, 4),
      d = r.pick([0.2, 0.3, 0.4]);
    const f = (x: number) => (x - p) ** 2 - d * d;
    const lo = p - 1,
      hi = p + 1;
    const flo = D4(f(lo));
    const opts = r.shuffle([md`There is no change of sign, but there are two roots in the interval (at $x = ${fmtNum(p - d)}$ and $x = ${fmtNum(p + d)}$).`, md`There is no change of sign, so there is no root in the interval.`, md`$\mathrm{f}$ is not continuous on the interval.`]);
    const C = ans.choice(opts, opts.findIndex((o) => o.includes('two roots')));
    return {
      stem: md`$\mathrm{f}(x) = (x - ${p})^{2} - ${fmtNum(d * d)}$. A student evaluates $\mathrm{f}(${lo})$ and $\mathrm{f}(${hi})$.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Calculate $\mathrm{f}(${lo})$.`, answer: flo, scheme: [B1(md`$${fmtDP(f(lo), 4)}$`)], hints: ['Substitute.', 'Square the bracket first.', 'Exact value is fine to 4 d.p.'], solution: [md`$\mathrm{f}(${lo}) = ${answerTex(flo)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`$\mathrm{f}(${hi})$ has the same sign. Which statement is correct?`, answer: C, scheme: [B1('No sign change'), B1('Even number of roots in the interval')], hints: ['No sign change does not mean no roots.', 'Think about the graph of a U-shaped quadratic.', md`Solve $(x - ${p})^{2} = ${fmtNum(d * d)}$.`], solution: [opts[opts.findIndex((o) => o.includes('two roots'))]] }),
      ],
      params: { variant, p, d, lo, hi },
    };
  },
  verify(inst) {
    const p = inst.params as Record<string, number | string>;
    if (p.variant === 'asymptote') {
      const f = (x: number) => (p.k as number) / (x - (p.a as number)) + 0.1 * x;
      expect(f(p.lo as number) * f(p.hi as number) < 0, 'sign change across asymptote');
    } else {
      const roots = rootsIn((x) => (x - (p.p as number)) ** 2 - (p.d as number) ** 2, p.lo as number, p.hi as number);
      expect(roots.length === 2, 'two roots');
    }
  },
});

const locateInteger = defineTemplate({
  id: 'p2.10.locate-root-integers',
  family: 'p2.10.locating-roots',
  title: 'Find consecutive integers between which a root lies',
  spec: ['P9.1', 'P9.5'],
  chapter: 'P2.10',
  sections: ['10.1'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 2,
  marks: 2,
  time: 3,
  commands: ['Find'],
  tags: ['numerical methods', 'change of sign'],
  generate(r) {
    const F = family(r);
    const n = Math.floor(F.root);
    r.require(F.root - n > 0.05 && n + 1 - F.root > 0.05);
    const L: ListSpec = ans.list([ans.exact(num(n)), ans.exact(num(n + 1))], { v: 'n' });
    const svg = plot({ x: [Math.min(-0.5, n - 1.5), n + 2.5], y: yRangeOf([F.f], Math.max(F.lo, n - 1.5), n + 2.5, 0.15), curves: [{ f: F.f, from: Math.max(F.lo, n - 1.5), to: n + 2.5, label: 'y = f(x)' }] });
    return {
      stem: md`$\mathrm{f}(x) = ${F.fTex}$. The equation $\mathrm{f}(x) = 0$ has exactly one real root $\alpha$.`,
      diagram: { svg, alt: 'Graph of y = f(x) crossing the x-axis once.' },
      parts: [part({ marks: 2, prompt: md`Find the two consecutive integers $n$ and $n + 1$ such that $n < \alpha < n + 1$. Enter both integers.`, answer: L, scheme: [M1(md`Evaluates $\mathrm{f}$ at two consecutive integers`), A1(md`$${n}$ and $${n + 1}$ with a sign change`)], hints: ['Evaluate f at whole numbers until the sign changes.', md`Try $x = ${n}$ and $x = ${n + 1}$.`, 'The root lies where f changes sign.'], solution: [md`$\mathrm{f}(${n}) = ${fmtSF(F.f(n), 4)}$ and $\mathrm{f}(${n + 1}) = ${fmtSF(F.f(n + 1), 4)}$: sign change, so $${answerTex(L)}$`] })],
      params: { root: F.root, n },
    };
  },
  verify(inst) {
    const { root, n } = inst.params as Record<string, number>;
    expect(root > n && root < n + 1, 'root between');
  },
});

const iterationValues = defineTemplate({
  id: 'p2.10.iteration-values',
  family: 'p2.10.iteration',
  title: 'Use an iteration formula',
  spec: ['P9.2'],
  chapter: 'P2.10',
  sections: ['10.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Find', 'Show that'],
  tags: ['numerical methods', 'iteration'],
  generate(r) {
    const F = family(r);
    const gp = derivative(F.g, F.root);
    r.require(Math.abs(gp) < 0.85);
    const x0 = Number((F.root + r.pick([-0.6, -0.4, -0.3, 0.3, 0.5])).toFixed(1));
    r.require(x0 > F.lo);
    const x1 = F.g(x0),
      x2 = F.g(x1),
      x3 = F.g(x2);
    r.require([x1, x2, x3].every(Number.isFinite));
    const A1v = D4(x1),
      A2v = D4(x2),
      A3v = D4(x3);
    return {
      stem: md`The equation $${F.fTex} = 0$ can be rearranged to $x = ${F.gTex}$. The iteration $x_{n+1} = ${F.gTex.replace(/x/g, 'x_n').replace('e^{\\frac{1}{2}x_n}', 'e^{\\frac{1}{2}x_n}')}$ is used with $x_0 = ${fmtNum(x0)}$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find $x_1$, giving your answer to 4 decimal places.`, answer: A1v, scheme: [M1(md`Substitutes $x_0 = ${fmtNum(x0)}$`), A1(md`$x_1 = ${fmtDP(x1, 4)}$`)], hints: ['Put x₀ into the right-hand side.', md`$x_1 = g(${fmtNum(x0)})$`, 'Make sure your calculator is in radians if trig appears.'], solution: [md`$x_1 = ${answerTex(A1v)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Find $x_2$ to 4 decimal places.`, answer: A2v, scheme: [B1(md`$x_2 = ${fmtDP(x2, 4)}$`)], hints: ['Feed x₁ back into the formula.', 'Use the full calculator value of x₁ (ANS key).', md`$x_2 = g(x_1)$`], solution: [md`$x_2 = ${answerTex(A2v)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`Find $x_3$ to 4 decimal places.`, answer: A3v, scheme: [B1(md`$x_3 = ${fmtDP(x3, 4)}$`)], hints: ['Iterate once more.', md`$x_3 = g(x_2)$`, 'Use ANS.'], solution: [md`$x_3 = ${answerTex(A3v)}$`] }),
      ],
      params: { x0, which: F.gTex },
    };
  },
  verify(inst) {
    const vals = inst.parts.map((p) => (p.answer as NumericSpec).value);
    expect(vals.every(Number.isFinite), 'finite');
    // the iterates approach a root: successive differences shrink
    expect(Math.abs(vals[2] - vals[1]) <= Math.abs(vals[1] - vals[0]) + 1e-12, 'converging');
  },
});

const iterationRoot = defineTemplate({
  id: 'p2.10.iteration-to-root',
  family: 'p2.10.iteration',
  title: 'Iterate to find a root to a given accuracy, and justify it',
  spec: ['P9.2', 'P9.1'],
  chapter: 'P2.10',
  sections: ['10.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 5,
  time: 7,
  commands: ['Find', 'Show that'],
  tags: ['numerical methods', 'iteration', 'accuracy'],
  generate(r) {
    const F = family(r);
    r.require(Math.abs(derivative(F.g, F.root)) < 0.7);
    const x0 = Number((F.root + r.pick([-0.5, 0.4])).toFixed(1));
    r.require(x0 > F.lo);
    const root3 = Number(fmtDP(F.root, 3));
    r.require(Math.abs(F.root - root3) < 0.00045);
    const A = ans.num(root3, { dp: 3 });
    const lo = root3 - 0.0005,
      hi = root3 + 0.0005;
    const C = ans.choice([md`$\mathrm{f}(${fmtDP(lo, 4)})$ and $\mathrm{f}(${fmtDP(hi, 4)})$ have opposite signs and $\mathrm{f}$ is continuous, so the root is $${fmtDP(root3, 3)}$ to 3 d.p.`, md`The iteration has stopped changing, so the answer must be exact.`], 0);
    return {
      stem: md`$\mathrm{f}(x) = ${F.fTex}$. The equation $\mathrm{f}(x) = 0$ has a root $\alpha$. The iteration $x_{n+1} = ${F.gTex.replace(/x/g, 'x_n')}$ with $x_0 = ${fmtNum(x0)}$ converges to $\alpha$.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Use the iteration to find $\alpha$ correct to 3 decimal places.`, answer: A, scheme: [M1('Iterates at least twice'), A1('Iterates correct to 4 d.p.'), A1(md`$\alpha = ${fmtDP(root3, 3)}$`)], hints: ['Keep iterating until successive values agree to 3 d.p.', 'Use the ANS key to keep full accuracy.', 'Then round to 3 decimal places.'], solution: [md`Iterating repeatedly gives values settling at $${fmtDP(F.root, 5)}\dots$, so $\alpha = ${answerTex(A)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`How can you show that your answer is correct to 3 decimal places?`, answer: C, scheme: [M1(md`Evaluates $\mathrm{f}$ at $${fmtDP(lo, 4)}$ and $${fmtDP(hi, 4)}$`), A1('Sign change, continuity and conclusion')], hints: ['Choose an interval that rounds to your answer.', md`Check the bounds $${fmtDP(lo, 4)}$ and $${fmtDP(hi, 4)}$.`, 'Look for a change of sign.'], solution: [md`$\mathrm{f}(${fmtDP(lo, 4)}) = ${fmtSF(F.f(lo), 3)}$, $\mathrm{f}(${fmtDP(hi, 4)}) = ${fmtSF(F.f(hi), 3)}$: change of sign, f continuous, so $\alpha = ${fmtDP(root3, 3)}$ (3 d.p.).`] }),
      ],
      params: { root: F.root, lo, hi },
    };
  },
  verify(inst) {
    const { root, lo, hi } = inst.params as Record<string, number>;
    expect(root > lo && root < hi, 'root within rounding interval');
  },
});

const convergence = defineTemplate({
  id: 'p2.10.iteration-convergence',
  family: 'p2.10.iteration',
  title: 'Convergence of an iteration: staircase or cobweb',
  spec: ['P9.2'],
  chapter: 'P2.10',
  sections: ['10.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 3,
  time: 4,
  commands: ['Find', 'Explain'],
  tags: ['numerical methods', 'iteration', 'cobweb', 'staircase'],
  generate(r) {
    const m = r.pick([-2, -1.6, -1.2, -0.8, -0.7, -0.5, -0.4, -0.2, 0.2, 0.3, 0.5, 0.6, 0.8, 1.2, 1.5, 2]);
    const c = r.int(1, 9);
    const root = c / (1 - m);
    const gTex = sumTex([[Number(m) === 1 ? 1 : (m as number), 'x'], [c, '']]).replace(/(\d)\.(\d)/g, '$1.$2');
    const G = ans.num(m, { sf: 3 });
    const converges = Math.abs(m) < 1;
    const shape = m > 0 ? 'staircase' : 'cobweb';
    const opts = [`It converges, forming a ${shape} diagram.`, `It diverges, forming a ${shape} diagram.`, `It converges, forming a ${shape === 'staircase' ? 'cobweb' : 'staircase'} diagram.`];
    const C = ans.choice(opts, converges ? 0 : 1);
    return {
      stem: md`An iteration $x_{n+1} = ${gTex}$ is used to try to find the root of $x = ${gTex}$, which is $x = ${fmtNum(Math.round(root * 1000) / 1000)}$.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Write down the gradient of $y = ${gTex}$.`, answer: G, scheme: [B1(md`$${m}$`)], hints: ['It is a straight line.', 'The gradient is the coefficient of x.', md`$g'(x) = ${m}$`], solution: [md`Gradient $= ${answerTex(G)}$`] }),
        part({ label: 'b', marks: 2, prompt: 'Describe what happens to the iteration.', answer: C, scheme: [B1('Converges if |g′| < 1, diverges if |g′| > 1'), B1('Staircase if g′ > 0, cobweb if g′ < 0')], hints: ['|g′(x)| < 1 near the root means the iteration converges.', 'A positive gradient gives a staircase; a negative gradient gives a cobweb.', md`$|${m}| ${converges ? '<' : '>'} 1$`], solution: [md`$|g'(x)| = ${Math.abs(m)} ${converges ? '<' : '>'} 1$, so it ${converges ? 'converges' : 'diverges'}; $g' ${m > 0 ? '>' : '<'} 0$ gives a ${shape}.`] }),
      ],
      params: { m, c },
    };
  },
  verify(inst) {
    const { m, c } = inst.params as Record<string, number>;
    let x = c / (1 - m) + 0.1;
    for (let i = 0; i < 30; i++) x = m * x + c;
    const conv = Math.abs(x - c / (1 - m)) < 0.01;
    const C = inst.parts[1].answer;
    expect(C.type === 'choice' && (C.correct[0] === 0) === conv, 'behaviour matches simulation');
  },
});

const newton = defineTemplate({
  id: 'p2.10.newton-raphson',
  family: 'p2.10.newton-raphson',
  title: 'Newton–Raphson iterations',
  spec: ['P9.3', 'P7.2'],
  chapter: 'P2.10',
  sections: ['10.3'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find', 'Use'],
  tags: ['numerical methods', 'Newton–Raphson', 'differentiation'],
  generate(r) {
    const F = family(r);
    const x0 = Number((F.root + r.pick([-0.4, -0.3, 0.3, 0.5])).toFixed(1));
    r.require(x0 > F.lo && Math.abs(F.df(x0)) > 0.3);
    const x1 = x0 - F.f(x0) / F.df(x0);
    const x2 = x1 - F.f(x1) / F.df(x1);
    const A = D4(x1),
      B = D4(x2);
    return {
      stem: md`$\mathrm{f}(x) = ${F.fTex}$, so $\mathrm{f}'(x) = ${F.dfTex}$. The equation $\mathrm{f}(x) = 0$ has a root near $x = ${fmtNum(x0)}$.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Taking $x_0 = ${fmtNum(x0)}$, use the Newton–Raphson method once to find $x_1$ to 4 decimal places.`, answer: A, scheme: [M1(md`$\mathrm{f}(${fmtNum(x0)})$ and $\mathrm{f}'(${fmtNum(x0)})$ attempted`), M1(md`$x_1 = ${fmtNum(x0)} - \dfrac{\mathrm{f}(${fmtNum(x0)})}{\mathrm{f}'(${fmtNum(x0)})}$`), A1(md`$x_1 = ${fmtDP(x1, 4)}$`)], hints: [md`$x_{n+1} = x_n - \dfrac{\mathrm{f}(x_n)}{\mathrm{f}'(x_n)}$`, md`$\mathrm{f}(${fmtNum(x0)}) = ${fmtSF(F.f(x0), 5)}$`, md`$\mathrm{f}'(${fmtNum(x0)}) = ${fmtSF(F.df(x0), 5)}$`], errors: [err('plus-sign', D4(x0 + F.f(x0) / F.df(x0)), 'Newton–Raphson subtracts: x₁ = x₀ − f(x₀)/f′(x₀).', 1)], solution: [md`$x_1 = ${fmtNum(x0)} - \dfrac{${fmtSF(F.f(x0), 5)}}{${fmtSF(F.df(x0), 5)}} = ${answerTex(A)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Apply the method again to find $x_2$ to 4 decimal places.`, answer: B, scheme: [M1('Second iteration using their x₁'), A1(md`$x_2 = ${fmtDP(x2, 4)}$`)], hints: ['Use x₁ in place of x₀.', 'Keep full accuracy for x₁.', md`$x_2 = x_1 - \dfrac{\mathrm{f}(x_1)}{\mathrm{f}'(x_1)}$`], solution: [md`$x_2 = ${answerTex(B)}$`] }),
      ],
      params: { x0, root: F.root },
    };
  },
  verify(inst) {
    const { root, x0 } = inst.params as Record<string, number>;
    const x2 = (inst.parts[1].answer as NumericSpec).value;
    expect(Math.abs(x2 - root) < Math.abs(x0 - root), 'closer to root');
  },
});

const newtonFail = defineTemplate({
  id: 'p2.10.newton-raphson-failure',
  family: 'p2.10.newton-raphson',
  title: 'Why Newton–Raphson fails from a stationary point',
  spec: ['P9.3'],
  chapter: 'P2.10',
  sections: ['10.3'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 3,
  time: 4,
  commands: ['Find', 'Explain'],
  tags: ['numerical methods', 'Newton–Raphson', 'stationary point'],
  generate(r) {
    const p = r.int(1, 5),
      q = r.intNZ(-12, 12);
    // f(x) = x³ − 3p²x + q has stationary points at ±p
    const fTex = sumTex([[1, 'x^{3}'], [-3 * p * p, 'x'], [q, '']]);
    const S = ans.list([ans.exact(num(p)), ans.exact(num(-p))], { v: 'x' });
    const opts = r.shuffle([md`$\mathrm{f}'(${p}) = 0$, so the formula would divide by zero: the tangent is horizontal and never meets the $x$-axis.`, md`$\mathrm{f}(${p}) = 0$, so $${p}$ is already a root.`, md`The method only works for negative starting values.`]);
    const C = ans.choice(opts, opts.findIndex((o) => o.includes('divide by zero')));
    return {
      stem: md`$\mathrm{f}(x) = ${fTex}$. A student tries to use the Newton–Raphson method with $x_0 = ${p}$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the values of $x$ for which $\mathrm{f}'(x) = 0$.`, answer: S, scheme: [M1(md`$\mathrm{f}'(x) = 3x^{2} - ${3 * p * p}$`), A1(md`$x = \pm ${p}$`)], hints: ['Differentiate f.', md`$\mathrm{f}'(x) = 3x^{2} - ${3 * p * p}$`, 'Set it equal to zero.'], solution: [md`$3x^{2} - ${3 * p * p} = 0 \Rightarrow ${answerTex(S)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Explain why $x_0 = ${p}$ is not a suitable starting value.`, answer: C, scheme: [B1('f′(x₀) = 0, so division by zero / tangent parallel to x-axis')], hints: ['Look at the Newton–Raphson formula.', md`What is $\mathrm{f}'(${p})$?`, 'You cannot divide by zero.'], solution: [opts[opts.findIndex((o) => o.includes('divide by zero'))]] }),
      ],
      params: { p, q },
    };
  },
  verify(inst) {
    const { p } = inst.params as Record<string, number>;
    expectClose(3 * p * p - 3 * p * p, 0, "f'(p) = 0");
  },
});

const context = defineTemplate({
  id: 'p2.10.numerical-methods-context',
  family: 'p2.10.context',
  title: 'Numerical methods in context: when does a model reach a value?',
  spec: ['P9.5', 'P9.3'],
  chapter: 'P2.10',
  sections: ['10.4'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 6,
  time: 8,
  commands: ['Show that', 'Use', 'Find'],
  tags: ['numerical methods', 'modelling', 'Newton–Raphson'],
  generate(r) {
    const A = r.pick([20, 30, 40, 50]),
      k = r.pick([0.1, 0.2, 0.25, 0.3]),
      b = r.pick([1, 2, 3]),
      H = r.int(Math.round(A * 0.3), Math.round(A * 0.7));
    // height h(t) = A t e^{−kt} + b ... solve h(t) = H on the rising part
    const f = (t: number) => A * t * Math.exp(-k * t) + b - H;
    const df = (t: number) => A * Math.exp(-k * t) * (1 - k * t);
    r.require(f(0) < 0);
    const tPeak = 1 / k;
    r.require(f(tPeak) > 0);
    const root = bisect(f, 0, tPeak);
    const t0 = Math.round(root);
    r.require(Math.abs(t0 - root) < 0.6 && df(t0) > 0.5 && t0 > 0);
    const t1 = t0 - f(t0) / df(t0);
    const T1 = ans.num(t1, { dp: 3 });
    const ctx = r.pick(['the height, $h$ m, of a rocket', 'the concentration, $h$ mg/l, of a drug in the blood', 'the depth, $h$ cm, of water in a reservoir']);
    return {
      stem: md`A model for ${ctx} $t$ hours after an event is $h = ${A}te^{-${k}t} + ${b}$. The time when $h = ${H}$ (on the rising part of the graph) is a root of $\mathrm{f}(t) = ${A}te^{-${k}t} + ${b - H} = 0$.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Show that $\mathrm{f}'(t) = ${A}e^{-${k}t}(1 - ${k}t)$.`, answer: ans.self(md`Product rule: $\frac{\mathrm{d}}{\mathrm{d}t}\left(${A}te^{-${k}t}\right) = ${A}e^{-${k}t} + ${A}t \times (-${k})e^{-${k}t} = ${A}e^{-${k}t}(1 - ${k}t)$.`), scheme: [M1('Uses the product rule'), A1(md`$${A}e^{-${k}t} - ${fmtNum(A * k)}te^{-${k}t}$`), { code: 'A1*', text: 'Correctly factorised (given answer)', final: true }], hints: ['The first term is a product of t and an exponential.', md`$\frac{\mathrm{d}}{\mathrm{d}t}e^{-${k}t} = -${k}e^{-${k}t}$`, 'Take out the common factor.'], solution: [md`$\mathrm{f}'(t) = ${A}e^{-${k}t} - ${fmtNum(A * k)}te^{-${k}t} = ${A}e^{-${k}t}(1 - ${k}t)$`] }),
        part({ label: 'b', marks: 3, prompt: md`Using $t_0 = ${t0}$, apply the Newton–Raphson method once to find $t_1$, to 3 decimal places.`, answer: T1, scheme: [M1(md`$\mathrm{f}(${t0})$ and $\mathrm{f}'(${t0})$`), M1(md`$t_1 = ${t0} - \frac{\mathrm{f}(${t0})}{\mathrm{f}'(${t0})}$`), A1(md`$${answerTex(T1)}$`)], hints: [md`$t_1 = t_0 - \dfrac{\mathrm{f}(t_0)}{\mathrm{f}'(t_0)}$`, md`$\mathrm{f}(${t0}) = ${fmtSF(f(t0), 5)}$`, md`$\mathrm{f}'(${t0}) = ${fmtSF(df(t0), 5)}$`], solution: [md`$t_1 = ${t0} - \dfrac{${fmtSF(f(t0), 5)}}{${fmtSF(df(t0), 5)}} = ${answerTex(T1)}$`] }),
      ],
      params: { A, k, b, H, root, t0 },
    };
  },
  verify(inst) {
    const { root, t0 } = inst.params as Record<string, number>;
    const t1 = (inst.parts[1].answer as NumericSpec).value;
    expect(Math.abs(t1 - root) < Math.abs(t0 - root), 'improves');
  },
});

void dM1;

const templates: Template[] = [signChange, signFailure, locateInteger, iterationValues, iterationRoot, convergence, newton, newtonFail, context];
export default templates;
