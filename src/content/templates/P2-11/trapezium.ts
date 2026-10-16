/** Pure Year 2, Chapter 11.9 — the trapezium rule (spec 9.4). */
import { expect, expectClose, integrate, secondDerivative } from '../../../engine/core/numeric';
import { fmtDP, fmtNum, fmtSF } from '../../../engine/core/format';
import { evaluate } from '../../../engine/core/expr';
import { answerTex } from '../../../engine/marking/mark';
import type { NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import type { Rng } from '../../../engine/core/rng';
import { plot, yRangeOf } from '../../../engine/core/svg';
import { ex } from '../shared/calculus';

interface TF {
  tex: string;
  f: (x: number) => number;
  a: number;
  h: number;
  n: number;
}

function pickFn(r: Rng): TF {
  const kind = r.pick(['sqrt', 'log', 'exp', 'recip', 'xlog'] as const);
  const n = r.pick([4, 5, 6]);
  if (kind === 'sqrt') {
    const k = r.int(1, 4);
    return { tex: `\\sqrt{${k}x^{3} + 1}`, f: (x) => Math.sqrt(k * x ** 3 + 1), a: 0, h: r.pick([0.25, 0.5]), n };
  }
  if (kind === 'log') {
    const k = r.int(1, 3);
    return { tex: `\\ln\\left(${k}x + 1\\right)`, f: (x) => Math.log(k * x + 1), a: r.pick([0, 1]), h: r.pick([0.5, 1]), n };
  }
  if (kind === 'exp') {
    const k = r.pick([1, 2]);
    return { tex: `e^{-${k === 1 ? '' : k}x^{2}}`, f: (x) => Math.exp(-k * x * x), a: 0, h: r.pick([0.2, 0.25]), n };
  }
  if (kind === 'recip') {
    const k = r.int(1, 4);
    return { tex: `\\frac{${k + 2}}{x^{2} + ${k}}`, f: (x) => (k + 2) / (x * x + k), a: 0, h: r.pick([0.5, 1]), n };
  }
  return { tex: 'x\\ln x', f: (x) => x * Math.log(x), a: 1, h: r.pick([0.25, 0.5]), n };
}

function trap(F: TF) {
  const ys = Array.from({ length: F.n + 1 }, (_, i) => F.f(F.a + i * F.h));
  const ys4 = ys.map((y) => Number(fmtDP(y, 4)));
  const est = (F.h / 2) * (ys4[0] + ys4[F.n] + 2 * ys4.slice(1, -1).reduce((s, y) => s + y, 0));
  const estFull = (F.h / 2) * (ys[0] + ys[F.n] + 2 * ys.slice(1, -1).reduce((s, y) => s + y, 0));
  return { ys, ys4, est, estFull };
}

const tableTex = (F: TF, ys4: number[], hide: number[]) =>
  `| $x$ | ${ys4.map((_, i) => fmtNum(F.a + i * F.h)).join(' | ')} |\n|---|${ys4.map(() => '---').join('|')}|\n| $y$ | ${ys4.map((y, i) => (hide.includes(i) ? '' : fmtDP(y, 4))).join(' | ')} |`;

const trapezium = defineTemplate({
  id: 'p2.11.trapezium-rule',
  family: 'p2.11.trapezium',
  title: 'Complete a table and use the trapezium rule',
  spec: ['P9.4'],
  chapter: 'P2.11',
  sections: ['11.9'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find', 'Use'],
  tags: ['trapezium rule', 'numerical integration', 'table'],
  generate(r) {
    const F = pickFn(r);
    const { ys4, est } = trap(F);
    const hide = r.sample(Array.from({ length: F.n - 1 }, (_, i) => i + 1), 2).sort((a, b) => a - b);
    const b = F.a + F.n * F.h;
    const H1 = ans.num(ys4[hide[0]], { dp: 4 }),
      H2 = ans.num(ys4[hide[1]], { dp: 4 });
    const E = ans.num(est, { sf: 4 }, { alts: [trap(F).estFull] });
    return {
      stem: md`The table shows values of $y = ${F.tex}$, with values of $y$ given to 4 decimal places.\n\n${tableTex(F, ys4, hide)}`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find the missing value of $y$ when $x = ${fmtNum(F.a + hide[0] * F.h)}$.`, answer: H1, scheme: [B1(md`$${fmtDP(ys4[hide[0]], 4)}$`)], hints: ['Substitute the x-value into the equation.', 'Give 4 decimal places.', 'Check your calculator mode (radians, ln).'], solution: [md`$y = ${answerTex(H1)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Find the missing value of $y$ when $x = ${fmtNum(F.a + hide[1] * F.h)}$.`, answer: H2, scheme: [B1(md`$${fmtDP(ys4[hide[1]], 4)}$`)], hints: ['Substitute the x-value into the equation.', 'Give 4 decimal places.', 'Check your calculator mode.'], solution: [md`$y = ${answerTex(H2)}$`] }),
        part({
          label: 'c',
          marks: 4,
          prompt: md`Use the trapezium rule with all the values of $y$ in the completed table to find an estimate for $\displaystyle\int_{${fmtNum(F.a)}}^{${fmtNum(b)}} ${F.tex}\,\mathrm{d}x$, giving your answer to 4 significant figures.`,
          answer: E,
          scheme: [B1(md`Strip width $h = ${F.h}$`), M1(md`$\frac{h}{2}\left[y_0 + y_{${F.n}} + 2(y_1 + \dots + y_{${F.n - 1}})\right]$`), A1('Correct bracket'), A1(md`$${answerTex(E)}$`)],
          hints: [md`$\int_a^b y\,\mathrm{d}x \approx \frac{h}{2}\left[y_0 + y_n + 2(y_1 + y_2 + \dots + y_{n-1})\right]$`, md`Here $h = ${F.h}$ and there are $${F.n}$ strips.`, 'The first and last y-values are counted once; the others twice.'],
          errors: [err('h-not-halved', ans.num(est * 2, { sf: 4 }), 'Multiply by h/2, not h.', 2), err('all-doubled', ans.num((F.h / 2) * 2 * ys4.reduce((s, y) => s + y, 0), { sf: 4 }), 'Only the middle y-values are doubled; the end values appear once.', 2)],
          solution: [md`$\frac{${F.h}}{2}\left[${fmtDP(ys4[0], 4)} + ${fmtDP(ys4[F.n], 4)} + 2(${ys4.slice(1, -1).map((y) => fmtDP(y, 4)).join(' + ')})\right] = ${answerTex(E)}$`],
        }),
      ],
      params: { tex: F.tex, a: F.a, b, n: F.n },
    };
  },
  verify(inst) {
    const { tex, a, b, n } = inst.params as { tex: string; a: number; b: number; n: number };
    const f = ex(tex);
    const exact = integrate((x) => evaluate(f, { x }), a, b, 1e-12);
    const est = (inst.parts[2].answer as NumericSpec).value;
    // trapezium error bound: |E| ⩽ (b − a)h²/12 · max|f''|
    let m2 = 0;
    for (let i = 0; i <= 200; i++) m2 = Math.max(m2, Math.abs(secondDerivative((x) => evaluate(f, { x }), a + ((b - a) * i) / 200 + 1e-6)));
    const h = (b - a) / n;
    expect(Math.abs(est - exact) <= ((b - a) * h * h * m2) / 12 + 3e-4, 'within the trapezium error bound');
  },
});

const overUnder = defineTemplate({
  id: 'p2.11.trapezium-over-under',
  family: 'p2.11.trapezium',
  title: 'Trapezium rule: overestimate or underestimate?',
  spec: ['P9.4', 'P7.1'],
  chapter: 'P2.11',
  sections: ['11.9'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 7,
  commands: ['Find', 'State', 'Explain'],
  tags: ['trapezium rule', 'concave', 'convex', 'estimation'],
  generate(r) {
    const F = pickFn(r);
    const b = F.a + F.n * F.h;
    const { est, ys4 } = trap(F);
    // convexity sign over the interval
    let pos = 0,
      neg = 0;
    for (let i = 1; i < 40; i++) {
      const d2 = secondDerivative(F.f, F.a + ((b - F.a) * i) / 40);
      if (d2 > 1e-6) pos++;
      else if (d2 < -1e-6) neg++;
    }
    r.require(pos === 0 || neg === 0);
    const convex = pos > 0;
    const E = ans.num(est, { sf: 4 }, { alts: [trap(F).estFull] });
    const C = ans.choice([md`An overestimate: the curve is convex, so each trapezium's top lies above the curve.`, md`An underestimate: the curve is concave, so each trapezium's top lies below the curve.`], convex ? 0 : 1);
    const svg = plot({ x: [Math.min(-0.2, F.a - 0.2), b + 0.3], y: yRangeOf([F.f], F.a, b, 0.2), curves: [{ f: F.f, from: F.a, to: b + 0.2, label: 'C' }] });
    return {
      stem: md`The curve $C$ has equation $y = ${F.tex}$. Values of $y$ are shown, to 4 decimal places.\n\n${tableTex(F, ys4, [])}`,
      diagram: { svg, alt: `Graph of the curve C between x = ${F.a} and x = ${b}.` },
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Use the trapezium rule with all the values in the table to estimate $\displaystyle\int_{${fmtNum(F.a)}}^{${fmtNum(b)}} y\,\mathrm{d}x$, to 4 significant figures.`, answer: E, scheme: [B1(md`$h = ${F.h}$`), M1('Correct bracket structure'), A1(md`$${answerTex(E)}$`)], hints: [md`$\frac{h}{2}[y_0 + y_n + 2(\text{middle values})]$`, md`$h = ${F.h}$`, 'Ends once, middles twice.'], solution: [md`Estimate $= ${answerTex(E)}$`] }),
        part({ label: 'b', marks: 2, prompt: 'State, with a reason, whether your estimate is an overestimate or an underestimate.', answer: C, scheme: [B1(convex ? 'Overestimate' : 'Underestimate'), B1('Reason using the shape of the curve (convex/concave)')], hints: ['Look at the shape of the curve on the diagram.', 'For a curve that bends upwards (convex), straight-line tops are above the curve.', md`Sign of $\frac{\mathrm{d}^{2}y}{\mathrm{d}x^{2}}$ tells you.`], solution: [convex ? md`The curve is convex ($y'' > 0$), so the trapezia lie above it: overestimate.` : md`The curve is concave ($y'' < 0$), so the trapezia lie below it: underestimate.`] }),
      ],
      params: { tex: F.tex, a: F.a, b, convex },
    };
  },
  verify(inst) {
    const { tex, a, b, convex } = inst.params as { tex: string; a: number; b: number; convex: boolean };
    const f = ex(tex);
    const exact = integrate((x) => evaluate(f, { x }), a, b, 1e-12);
    const est = (inst.parts[0].answer as NumericSpec).value;
    expect(convex ? est > exact - 1e-4 : est < exact + 1e-4, 'over/under matches convexity');
  },
});

const percentError = defineTemplate({
  id: 'p2.11.trapezium-percentage-error',
  family: 'p2.11.trapezium',
  title: 'Trapezium rule versus exact integration: percentage error',
  spec: ['P9.4', 'P8.3'],
  chapter: 'P2.11',
  sections: ['11.9'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 6,
  time: 8,
  commands: ['Find', 'Calculate'],
  tags: ['trapezium rule', 'exact integration', 'percentage error'],
  generate(r) {
    const k = r.pick([1, 2, 3]);
    const n = r.pick([3, 4, 5]);
    const h = r.pick([0.5, 1]);
    const a = 0,
      b = n * h;
    const A0 = r.pick([1, 2, 3]),
      c0 = r.int(0, 5);
    const f = (x: number) => A0 * Math.exp(k * x) + c0;
    const ys = Array.from({ length: n + 1 }, (_, i) => f(i * h));
    const est = (h / 2) * (ys[0] + ys[n] + 2 * ys.slice(1, -1).reduce((s, y) => s + y, 0));
    const exact = (A0 * (Math.exp(k * b) - 1)) / k + c0 * b;
    const pe = ((est - exact) / exact) * 100;
    const E = ans.num(est, { sf: 4 }),
      X = ans.exact(ex(`\\frac{${A0}}{${k}}\\left(e^{${fmtNum(k * b)}} - 1\\right) + ${fmtNum(c0 * b)}`), ['exact']),
      P = ans.num(pe, { sf: 3 }, { alts: [((Number(fmtSF(est, 4)) - exact) / exact) * 100] });
    const tex = `${A0 === 1 ? '' : A0}e^{${k === 1 ? '' : k}x}${c0 ? ` + ${c0}` : ''}`;
    return {
      stem: md`$\displaystyle I = \int_{0}^{${fmtNum(b)}} \left(${tex}\right)\mathrm{d}x$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Use the trapezium rule with $${n}$ strips of equal width to estimate $I$, giving your answer to 4 significant figures.`, answer: E, scheme: [M1(md`$h = ${h}$ and correct bracket`), A1(md`$${answerTex(E)}$`)], hints: [md`$h = \frac{${fmtNum(b)} - 0}{${n}} = ${h}$`, 'Work out y at each strip boundary.', md`$\frac{h}{2}[y_0 + y_${n} + 2(\dots)]$`], solution: [md`$y$-values: $${ys.map((y) => fmtSF(y, 5)).join(', ')}$; estimate $= ${answerTex(E)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Use integration to find the exact value of $I$.`, answer: X, scheme: [M1(md`$\int e^{${k === 1 ? '' : k}x}\,\mathrm{d}x = \frac{1}{${k}}e^{${k === 1 ? '' : k}x}$`), A1(md`$${answerTex(X)}$`)], hints: ['Integrate term by term.', md`$\int e^{kx}\,\mathrm{d}x = \frac{1}{k}e^{kx}$`, 'Substitute the limits; e⁰ = 1.'], solution: [md`$\left[\frac{${A0}}{${k}}e^{${k === 1 ? '' : k}x}${c0 ? ` + ${c0}x` : ''}\right]_{0}^{${fmtNum(b)}} = ${answerTex(X)}$`] }),
        part({ label: 'c', marks: 2, prompt: 'Find the percentage error in the trapezium rule estimate.', answer: P, scheme: [M1('(estimate − exact) ÷ exact × 100'), A1(md`$${answerTex(P)}\%$`)], hints: ['Percentage error = (approximate − exact) ÷ exact × 100.', md`Exact $\approx ${fmtSF(exact, 6)}$.`, 'Keep it positive if it is an overestimate.'], solution: [md`$\dfrac{${fmtSF(est, 6)} - ${fmtSF(exact, 6)}}{${fmtSF(exact, 6)}} \times 100 = ${answerTex(P)}\%$`] }),
      ],
      params: { k, b, A0, c0 },
    };
  },
  verify(inst) {
    const { k, b, A0, c0 } = inst.params as Record<string, number>;
    expectClose(evaluate((inst.parts[1].answer as { value: import('../../../engine/core/expr').Expr }).value), integrate((x) => A0 * Math.exp(k * x) + c0, 0, b, 1e-12), 'exact');
    expect((inst.parts[2].answer as NumericSpec).value > 0, 'convex ⇒ overestimate');
  },
});

const templates: Template[] = [trapezium, overUnder, percentError];
export default templates;
