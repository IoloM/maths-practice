/** Pure Year 2, Chapter 9 — chain, product and quotient rules; connected rates; parametric and implicit differentiation. */
import { Q } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { derivative, expect, expectClose } from '../../../engine/core/numeric';
import { fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, CommonError, CoordSpec, EquationSpec, ExactSpec, ExprSpec, ListSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, md, part, sgn } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';

const exq = (q: Q | number) => num(Q.from(q));
const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
const DYDX = md`\frac{\mathrm{d}y}{\mathrm{d}x}`;
const lin = (a: number, b: number, v = 'x') => sumTex([[a, v], [b, '']]);

// ---------------------------------------------------------------- 9.3 chain rule
const chain = defineTemplate({
  id: 'p2.9.chain-rule',
  family: 'p2.9.chain-rule',
  title: 'Differentiate using the chain rule and find a gradient',
  spec: ['P7.4', 'P7.2'],
  chapter: 'P2.9',
  sections: ['9.3'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Find'],
  tags: ['chain rule', 'differentiation', 'gradient'],
  generate(r) {
    const fam = r.pick(['power', 'exp', 'ln', 'sqrt'] as const);
    let yTex: string, dTex: string, domain: Record<string, [number, number]>, x0: number, gTex: string;
    let errs: CommonError[] = [];
    if (fam === 'power') {
      const a = r.pick([2, 3, 4, 5, -2]),
        b = r.int(-5, 7),
        n = r.pick([Q.of(3), Q.of(4), Q.of(5), Q.of(-1), Q.of(-2), Q.of(1, 2), Q.of(3, 2), Q.of(-1, 2)]);
      const inner = lin(a, b);
      yTex = `(${inner})^{${n.toLatex()}}`;
      dTex = `${n.mul(a).toLatex()}(${inner})^{${n.sub(1).toLatex()}}`;
      // choose x0 so that the inner value is 1, 4 or 9 (nice for fractional powers)
      const target = r.pick(n.d === 1 ? [1, 2, 3, 4] : [1, 4, 9]);
      r.require((target - b) % a === 0);
      x0 = (target - b) / a;
      const lo = (0.5 - b) / a,
        hi = (6 - b) / a;
      domain = { x: [Math.min(lo, hi), Math.max(lo, hi)] };
      gTex = `${n.mul(a).toLatex()}(${target})^{${n.sub(1).toLatex()}}`;
      errs = [err('no-inner', ans.expr(ex(`${n.toLatex()}(${inner})^{${n.sub(1).toLatex()}}`), ['x'], { domain }), 'Multiply by the derivative of the inside bracket as well.', 1)];
    } else if (fam === 'exp') {
      const p = r.intNZ(-3, 3),
        q = r.int(-5, 5);
      const g = sumTex([[p, 'x^{2}'], [q, 'x']]);
      yTex = `e^{${g}}`;
      dTex = `(${sumTex([[2 * p, 'x'], [q, '']])})e^{${g}}`;
      domain = { x: [-1.2, 1.2] };
      x0 = r.pick([0, 1, -1]);
      const gx = p * x0 * x0 + q * x0;
      gTex = `${2 * p * x0 + q}${gx === 0 ? '' : `e^{${gx}}`}`;
    } else if (fam === 'ln') {
      const p = r.int(1, 4),
        q = r.int(1, 9),
        k = r.pick([1, 2, 3]);
      yTex = `${k === 1 ? '' : k}\\ln(${p === 1 ? '' : p}x^{2} + ${q})`;
      dTex = `\\frac{${2 * p * k}x}{${p === 1 ? '' : p}x^{2} + ${q}}`;
      domain = { x: [-3, 3] };
      x0 = r.intNZ(-3, 3);
      gTex = Q.of(2 * p * k * x0, p * x0 * x0 + q).toLatex();
    } else {
      const p = r.int(1, 5),
        q = r.int(1, 12),
        k = r.pick([1, 2, 3, 4]);
      yTex = `${k === 1 ? '' : k}\\sqrt{${p === 1 ? '' : p}x^{2} + ${q}}`;
      dTex = `\\frac{${p * k}x}{\\sqrt{${p === 1 ? '' : p}x^{2} + ${q}}}`;
      domain = { x: [-3, 3] };
      let xx = 0;
      for (const c of [1, 2, 3, 4, -1, -2]) if (Number.isInteger(Math.sqrt(p * c * c + q))) xx = c;
      x0 = xx || 1;
      const rt = Math.sqrt(p * x0 * x0 + q);
      gTex = Number.isInteger(rt) ? Q.of(p * k * x0, rt).toLatex() : `\\frac{${p * k * x0}}{\\sqrt{${p * x0 * x0 + q}}}`;
    }
    const D: ExprSpec = ans.expr(ex(dTex), ['x'], { domain });
    const Gs = ans.exact(ex(gTex), ['exact']);
    return {
      stem: md`$y = ${yTex}$`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find $${DYDX}$.`, answer: D, scheme: [M1(fam === 'power' ? md`$k(${'\\ldots'})^{n-1}$ form` : fam === 'exp' ? md`$(\ldots)e^{\ldots}$ form` : md`$\dfrac{\text{derivative of inside}}{\text{inside}}$ form`), A1(md`$${dTex}$`)], hints: ['Use the chain rule: differentiate the outside function, then multiply by the derivative of the inside.', fam === 'power' ? md`$\dfrac{\mathrm{d}}{\mathrm{d}x}(ax + b)^{n} = an(ax + b)^{n-1}$` : fam === 'exp' ? md`$\dfrac{\mathrm{d}}{\mathrm{d}x}e^{\mathrm{f}(x)} = \mathrm{f}'(x)e^{\mathrm{f}(x)}$` : fam === 'ln' ? md`$\dfrac{\mathrm{d}}{\mathrm{d}x}\ln \mathrm{f}(x) = \dfrac{\mathrm{f}'(x)}{\mathrm{f}(x)}$` : md`Write the root as a power $\frac{1}{2}$, then use the chain rule.`, 'Simplify the coefficient.'], errors: errs, solution: [md`$${DYDX} = ${answerTex(D)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the exact gradient of the curve at the point where $x = ${x0}$.`, answer: Gs, scheme: [M1(md`Substitutes $x = ${x0}$`), A1(md`$${answerTex(Gs)}$`)], hints: [md`Substitute $x = ${x0}$ into your $${DYDX}$.`, 'Simplify carefully.', 'Leave e or roots in exact form.'], solution: [md`At $x = ${x0}$: $${DYDX} = ${answerTex(Gs)}$`] }),
      ],
      params: { fam, yTex, x0 },
    };
  },
  verify(inst) {
    const { yTex, x0 } = inst.params as { yTex: string; x0: number };
    const Y = ex(yTex);
    const f = (x: number) => evaluate(Y, { x });
    const d = (inst.parts[0].answer as ExprSpec).value;
    const [lo, hi] = (inst.parts[0].answer as ExprSpec).domain!.x;
    for (const x of [lo + (hi - lo) * 0.3, lo + (hi - lo) * 0.7]) expectClose(evaluate(d, { x }), derivative(f, x), 'derivative', 1e-6);
    expectClose(valOf(inst.parts[1].answer as ExactSpec), derivative(f, x0), 'gradient', 1e-6);
  },
});

// ---------------------------------------------------------------- 9.4 product rule
const product = defineTemplate({
  id: 'p2.9.product-rule-stationary-points',
  family: 'p2.9.product-quotient',
  title: 'Product rule and exact stationary points',
  spec: ['P7.4', 'P7.3'],
  chapter: 'P2.9',
  sections: ['9.4'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find', 'Show that'],
  tags: ['product rule', 'stationary points', 'exponentials', 'logarithms'],
  generate(r) {
    const fam = r.pick(['exp', 'exp', 'ln'] as const);
    const m = r.pick([1, 2, 3]);
    const A = r.pick([1, 1, 2, 3, 4, 5, -1, -2, -3]);
    const co = A === 1 ? '' : A === -1 ? '-' : `${A}`;
    let yTex: string, dTex: string, xs: ExactSpec[], domain: Record<string, [number, number]>, fac: string;
    if (fam === 'exp') {
      const k = r.intNZ(-3, 3);
      yTex = `${co}${m === 1 ? 'x' : `x^{${m}}`}e^{${k === 1 ? '' : k === -1 ? '-' : k}x}`;
      fac = `${co}${m === 1 ? '' : m === 2 ? 'x' : `x^{${m - 1}}`}e^{${k === 1 ? '' : k === -1 ? '-' : k}x}(${sumTex([[k, 'x'], [m, '']])})`;
      dTex = fac;
      xs = [...(m >= 2 ? [ans.exact(num(0))] : []), ans.exact(exq(Q.of(-m, k)))];
      domain = { x: [-2, 2] };
    } else {
      yTex = `${co}${m === 1 ? 'x' : `x^{${m}}`}\\ln x`;
      fac = `${co}${m === 1 ? '' : m === 2 ? 'x' : `x^{${m - 1}}`}(${m === 1 ? '' : m}\\ln x + 1)`;
      dTex = fac;
      xs = [ans.exact(ex(`e^{${Q.of(-1, m).toLatex()}}`), ['exact'])];
      domain = { x: [0.2, 4] };
    }
    const D: ExprSpec = ans.expr(ex(dTex), ['x'], { domain });
    const L: ListSpec = ans.list(xs, { v: 'x' });
    return {
      stem: md`The curve $C$ has equation $y = ${yTex}$${fam === 'ln' ? ', $x > 0$' : ''}.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find $${DYDX}$, giving your answer in a fully factorised form.`, answer: D, scheme: [M1(md`Product rule: $u'v + uv'$`), A1('Correct unsimplified derivative'), A1(md`$${fac}$`)], hints: [md`Let $u = ${co}${m === 1 ? 'x' : `x^{${m}}`}$ and $v = ${fam === 'exp' ? yTex.slice(yTex.indexOf('e^')) : '\\ln x'}$.`, md`$${DYDX} = u'v + uv'$`, 'Take out the common factors.'], solution: [md`$${DYDX} = ${answerTex(D)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Find the exact $x$-coordinate${xs.length > 1 ? 's' : ''} of the stationary point${xs.length > 1 ? 's' : ''} of $C$.`, answer: L, scheme: [M1(md`Sets $${DYDX} = 0$`), dM1(fam === 'exp' ? md`Uses $e^{kx} \neq 0$` : 'Solves for ln x'), A1(md`$${answerTex(L)}$`)], hints: ['Stationary points have zero gradient.', fam === 'exp' ? 'The exponential factor is never zero, so look at the other factors.' : md`Since $x > 0$, solve $${m === 1 ? '' : m}\ln x + 1 = 0$.`, fam === 'ln' ? 'Exponentiate to undo ln.' : 'Each factor that can be zero gives a solution.'], solution: [md`$${fac} = 0$`, md`$${answerTex(L)}$`] }),
      ],
      params: { fam, yTex },
    };
  },
  verify(inst) {
    const { yTex } = inst.params as { yTex: string };
    const Y = ex(yTex);
    const f = (x: number) => evaluate(Y, { x });
    const D = inst.parts[0].answer as ExprSpec;
    const [lo, hi] = D.domain!.x;
    for (const x of [lo + 0.37 * (hi - lo), lo + 0.81 * (hi - lo)]) expectClose(evaluate(D.value, { x }), derivative(f, x), 'derivative', 1e-6);
    for (const x of (inst.parts[1].answer as ListSpec).items.map(valOf)) expect(Math.abs(derivative(f, x)) < 1e-6 * Math.max(1, Math.abs(f(x))), 'stationary');
  },
});

// ---------------------------------------------------------------- 9.5 quotient rule
const quotient = defineTemplate({
  id: 'p2.9.quotient-rule',
  family: 'p2.9.product-quotient',
  title: 'Quotient rule: simplify the derivative and use it',
  spec: ['P7.4'],
  chapter: 'P2.9',
  sections: ['9.5'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find', 'Show that', 'Explain'],
  tags: ['quotient rule', 'stationary points'],
  generate(r) {
    const fam = r.pick(['linear', 'exp', 'ln'] as const);
    if (fam === 'linear') {
      const a = r.intNZ(-5, 5),
        b = r.int(-6, 6),
        c = r.pick([1, 2, 3]),
        d = r.intNZ(-6, 6);
      const k = a * d - b * c;
      r.require(k !== 0);
      const den = lin(c, d);
      const D: ExprSpec = ans.expr(ex(`\\frac{${k}}{(${den})^{2}}`), ['x'], { domain: { x: [-d / c + 0.5, -d / c + 5] } });
      const opts = [md`The numerator $${k}$ is never zero, so $${DYDX} \neq 0$ for any $x$`, md`The denominator is never zero`, md`$${DYDX}$ is always positive`];
      const C: ChoiceSpec = ans.choice(opts, 0);
      return {
        stem: md`$y = \dfrac{${lin(a, b)}}{${den}}$, $x \neq ${Q.of(-d, c).toLatex()}$`,
        parts: [
          part({ label: 'a', marks: 3, prompt: md`Show that $${DYDX} = \dfrac{k}{(${den})^{2}}$, where $k$ is a constant, and give $${DYDX}$.`, answer: D, scheme: [M1(md`Quotient rule: $\dfrac{vu' - uv'}{v^{2}}$`), A1(md`$\dfrac{${a}(${den}) - ${c}(${lin(a, b)})}{(${den})^{2}}$`), A1(md`$\dfrac{${k}}{(${den})^{2}}$`)], hints: [md`$u = ${lin(a, b)}$, $v = ${den}$.`, md`$${DYDX} = \dfrac{vu' - uv'}{v^{2}}$`, 'Expand the numerator: the x terms cancel.'], errors: [err('wrong-order', ans.expr(ex(`\\frac{${-k}}{(${den})^{2}}`), ['x'], { domain: { x: [-d / c + 0.5, -d / c + 5] } }), "The numerator is vu' − uv', not uv' − vu'.", 1)], solution: [md`$${DYDX} = \dfrac{${a}(${den}) - ${c}(${lin(a, b)})}{(${den})^{2}} = ${answerTex(D)}$`] }),
          part({ label: 'b', marks: 2, prompt: md`Hence explain why the curve has no stationary points.`, answer: C, scheme: [B1(md`$k = ${k} \neq 0$`), B1('Conclusion')], hints: ['Stationary points need dy/dx = 0.', 'Can a fraction with a non-zero constant numerator be zero?', 'Write a conclusion.'], solution: [opts[0]] }),
        ],
        params: { fam, yTex: `\\frac{${lin(a, b)}}{${den}}` },
      };
    }
    if (fam === 'exp') {
      const k = r.pick([1, 2, 3, -1, -2]),
        a = r.int(-4, 4);
      const yTex = `\\frac{e^{${k === 1 ? '' : k === -1 ? '-' : k}x}}{x${a === 0 ? '' : sgn(a)}}`;
      const dTex = `\\frac{e^{${k === 1 ? '' : k === -1 ? '-' : k}x}(${sumTex([[k, 'x'], [k * a - 1, '']])})}{(x${a === 0 ? '' : sgn(a)})^{2}}`;
      const xs = Q.of(1, k).sub(a);
      const D: ExprSpec = ans.expr(ex(dTex), ['x'], { domain: { x: [-a + 0.4, -a + 3] } });
      const X = ans.exact(exq(xs));
      return {
        stem: md`$y = ${yTex}$, $x \neq ${-a}$`,
        parts: [
          part({ label: 'a', marks: 3, prompt: md`Find $${DYDX}$, simplifying your answer.`, answer: D, scheme: [M1('Quotient rule'), A1('Correct unsimplified'), A1(md`$${dTex}$`)], hints: [md`$u = e^{${k === 1 ? '' : k === -1 ? '-' : k}x}$, $v = x${a === 0 ? '' : sgn(a)}$`, md`$${DYDX} = \dfrac{vu' - uv'}{v^{2}}$`, 'Factorise the exponential out of the numerator.'], solution: [md`$${DYDX} = ${answerTex(D)}$`] }),
          part({ label: 'b', marks: 2, prompt: md`Find the exact $x$-coordinate of the stationary point.`, answer: X, scheme: [M1('Sets the numerator to zero'), A1(md`$x = ${xs.toLatex()}$`)], hints: ['A fraction is zero when its numerator is zero.', 'The exponential is never zero.', md`Solve $${sumTex([[k, 'x'], [k * a - 1, '']])} = 0$.`], solution: [md`$${sumTex([[k, 'x'], [k * a - 1, '']])} = 0 \Rightarrow x = ${answerTex(X)}$`] }),
        ],
        params: { fam, yTex },
      };
    }
    const m = r.pick([1, 2, 3]);
    const yTex = `\\frac{\\ln x}{${m === 1 ? 'x' : `x^{${m}}`}}`;
    const dTex = `\\frac{1 - ${m === 1 ? '' : m}\\ln x}{x^{${m + 1}}}`;
    const D: ExprSpec = ans.expr(ex(dTex), ['x'], { domain: { x: [0.3, 4] } });
    const X = ans.exact(ex(`e^{${Q.of(1, m).toLatex()}}`), ['exact']);
    return {
      stem: md`$y = ${yTex}$, $x > 0$`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find $${DYDX}$, simplifying your answer.`, answer: D, scheme: [M1('Quotient rule'), A1('Correct unsimplified'), A1(md`$${dTex}$`)], hints: [md`$u = \ln x$, $v = ${m === 1 ? 'x' : `x^{${m}}`}$`, md`$${DYDX} = \dfrac{vu' - uv'}{v^{2}}$`, 'Cancel a power of x.'], solution: [md`$${DYDX} = ${answerTex(D)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the exact $x$-coordinate of the stationary point.`, answer: X, scheme: [M1(md`$1 - ${m === 1 ? '' : m}\ln x = 0$`), A1(md`$x = e^{${Q.of(1, m).toLatex()}}$`)], hints: ['Set the numerator equal to zero.', md`$\ln x = ${Q.of(1, m).toLatex()}$`, 'Exponentiate.'], solution: [md`$\ln x = ${Q.of(1, m).toLatex()} \Rightarrow x = ${answerTex(X)}$`] }),
      ],
      params: { fam, yTex },
    };
  },
  verify(inst) {
    const { fam, yTex } = inst.params as { fam: string; yTex: string };
    const Y = ex(yTex);
    const f = (x: number) => evaluate(Y, { x });
    const D = inst.parts[0].answer as ExprSpec;
    const [lo, hi] = D.domain!.x;
    for (const x of [lo + 0.3 * (hi - lo), lo + 0.75 * (hi - lo)]) expectClose(evaluate(D.value, { x }), derivative(f, x), 'derivative', 1e-6);
    if (fam !== 'linear') {
      const xs = valOf(inst.parts[1].answer as ExactSpec);
      expect(Math.abs(derivative(f, xs)) < 1e-6 * Math.max(1, Math.abs(f(xs))), 'stationary');
    }
  },
});

// ---------------------------------------------------------------- 9.9 connected rates of change
const RATES = [
  { what: 'A spherical balloon is being inflated', V: 'V', r: 'r', formula: 'V = \\frac{4}{3}\\pi r^{3}', dV: '4\\pi r^{2}', f: (x: number) => 4 * Math.PI * x * x, units: ['cm', 'cm^{3} s^{-1}', 'cm s^{-1}'], verb: 'increasing' },
  { what: 'Oil is leaking from a tanker and spreading as a circle', V: 'A', r: 'r', formula: 'A = \\pi r^{2}', dV: '2\\pi r', f: (x: number) => 2 * Math.PI * x, units: ['m', 'm^{2} s^{-1}', 'm s^{-1}'], verb: 'increasing' },
  { what: 'A cube of ice is melting, keeping its shape', V: 'V', r: 'x', formula: 'V = x^{3}', dV: '3x^{2}', f: (x: number) => 3 * x * x, units: ['cm', 'cm^{3} s^{-1}', 'cm s^{-1}'], verb: 'decreasing' },
  { what: 'Water is poured into a conical funnel (vertex down) whose depth h cm and surface radius r cm satisfy r = h/2', V: 'V', r: 'h', formula: 'V = \\frac{1}{12}\\pi h^{3}', dV: '\\frac{1}{4}\\pi h^{2}', f: (x: number) => (Math.PI * x * x) / 4, units: ['cm', 'cm^{3} s^{-1}', 'cm s^{-1}'], verb: 'increasing' },
];

const rates = defineTemplate({
  id: 'p2.9.connected-rates-of-change',
  family: 'p2.9.connected-rates',
  title: 'Connected rates of change using the chain rule',
  spec: ['P7.4'],
  chapter: 'P2.9',
  sections: ['9.9'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find'],
  tags: ['connected rates of change', 'chain rule', 'modelling'],
  generate(r) {
    const i = r.int(0, RATES.length - 1);
    const C = RATES[i];
    const rate = r.pick([2, 3, 4, 5, 8, 10, 12, 15, 20]);
    const R = r.int(2, 12);
    const ans1 = rate / C.f(R);
    const dV: ExprSpec = ans.expr(ex(C.dV), [C.r], { domain: { [C.r]: [0.5, 5] } });
    const Ans = ans.num(ans1, { sf: 3 }, { unit: `\\text{${C.units[2].replace('^{-1}', '⁻¹')}}` });
    const dvdt = `\\frac{\\mathrm{d}${C.V}}{\\mathrm{d}t}`,
      drdt = `\\frac{\\mathrm{d}${C.r}}{\\mathrm{d}t}`,
      dvdr = `\\frac{\\mathrm{d}${C.V}}{\\mathrm{d}${C.r}}`;
    return {
      stem: md`${C.what}. Its ${C.V === 'A' ? 'area' : 'volume'} is $${C.formula}$, and it is ${C.verb} at a constant rate of $${rate}$ ${C.units[1].replace(/\^\{(-?\d+)\}/g, (_, d) => (d === '-1' ? '⁻¹' : d === '2' ? '²' : '³'))}.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find $${dvdr}$.`, answer: dV, scheme: [B1(md`$${C.dV}$`)], hints: [`Differentiate the formula with respect to ${C.r}.`, 'Constants like π stay as they are.', 'Use the power rule.'], solution: [md`$${dvdr} = ${answerTex(dV)}$`] }),
        part({ label: 'b', marks: 4, prompt: md`Find the rate at which $${C.r}$ is ${C.verb} when $${C.r} = ${R}$.`, answer: Ans, scheme: [M1(md`$${dvdt} = ${dvdr} \times ${drdt}$`), A1(md`$${rate} = ${C.dV.replace(new RegExp(C.r, 'g'), `(${R})`)} \times ${drdt}$`), dM1(md`Solves for $${drdt}$`), A1(md`awrt $${fmtSF(ans1, 3)}$`)], hints: [md`Chain rule: $${dvdt} = ${dvdr} \times ${drdt}$.`, md`$${dvdt} = ${rate}$ (use the size of the rate).`, md`Substitute $${C.r} = ${R}$ into $${dvdr}$ and divide.`], errors: [err('multiplied', ans.num(rate * C.f(R), { sf: 3 }), md`Rearrange: $${drdt} = ${dvdt} \div ${dvdr}$.`)], solution: [md`$${drdt} = \dfrac{${rate}}{${C.dV.replace(new RegExp(C.r, 'g'), `(${R})`)}} = ${answerTex(Ans)}$`] }),
      ],
      params: { i, rate, R },
    };
  },
  verify(inst) {
    const { i, rate, R } = inst.params as Record<string, number>;
    const C = RATES[i];
    const V = ex(C.formula.slice(C.formula.indexOf('=') + 1));
    const dvdr = derivative((x) => evaluate(V, { [C.r]: x }), R);
    expectClose(valOf(inst.parts[1].answer as NumericSpec), rate / dvdr, 'rate', 1e-6);
  },
});

// ---------------------------------------------------------------- 9.7 parametric differentiation
const paramDiff = defineTemplate({
  id: 'p2.9.parametric-differentiation',
  family: 'p2.9.parametric-implicit',
  title: 'Parametric differentiation: gradient, tangent and stationary point',
  spec: ['P7.5', 'P3.3'],
  chapter: 'P2.9',
  sections: ['9.7'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 8,
  time: 9,
  commands: ['Find', 'Show that'],
  tags: ['parametric differentiation', 'tangent', 'stationary points'],
  generate(r) {
    const a = r.int(-4, 4),
      k = r.int(1, 3),
      b = 3 * k * k,
      c = r.int(-5, 5);
    // x = t² + a, y = t³ − b t + c
    const t0 = r.pick([1, 2, -1, -2, 3]);
    r.require(t0 !== k && t0 !== -k);
    const m = Q.of(3 * t0 * t0 - b, 2 * t0);
    const x0 = t0 * t0 + a,
      y0 = t0 ** 3 - b * t0 + c;
    const cc = Q.of(y0).sub(m.mul(x0));
    const D: ExprSpec = ans.expr(ex(`\\frac{3t^{2} - ${b}}{2t}`), ['t'], { domain: { t: [0.3, 3] } });
    const T: EquationSpec = ans.eq(ex('y'), ex(sumTex([[m, 'x'], [cc, '']])), ['x', 'y'], ['y=mx+c']);
    const S: CoordSpec = ans.coord(ans.exact(exq(k * k + a)), ans.exact(exq(k ** 3 - b * k + c)));
    const xTex = `t^{2}${a === 0 ? '' : sgn(a)}`,
      yTex = `t^{3} - ${b}t${c === 0 ? '' : sgn(c)}`;
    return {
      stem: md`The curve $C$ has parametric equations $x = ${xTex}$, $y = ${yTex}$, $t \in \mathbb{R}$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find $${DYDX}$ in terms of $t$.`, answer: D, scheme: [M1(md`$\dfrac{\mathrm{d}y}{\mathrm{d}t} \div \dfrac{\mathrm{d}x}{\mathrm{d}t}$`), A1(md`$\dfrac{3t^{2} - ${b}}{2t}$`)], hints: [md`$${DYDX} = \dfrac{\mathrm{d}y/\mathrm{d}t}{\mathrm{d}x/\mathrm{d}t}$`, md`$\dfrac{\mathrm{d}x}{\mathrm{d}t} = 2t$`, md`$\dfrac{\mathrm{d}y}{\mathrm{d}t} = 3t^{2} - ${b}$`], errors: [err('upside-down', ans.expr(ex(`\\frac{2t}{3t^{2} - ${b}}`), ['t'], { domain: { t: [0.3, 3] } }), 'It is (dy/dt) ÷ (dx/dt), not the other way round.')], solution: [md`$${DYDX} = ${answerTex(D)}$`] }),
        part({ label: 'b', marks: 4, prompt: md`Find an equation of the tangent to $C$ at the point where $t = ${t0}$, in the form $y = mx + c$.`, answer: T, scheme: [M1(md`Gradient at $t = ${t0}$: $${m.toLatex()}$`), B1(md`Point $(${x0}, ${y0})$`), M1('Uses y − y₁ = m(x − x₁)'), A1(md`$${answerTex(T)}$`)], hints: [md`Substitute $t = ${t0}$ into your $${DYDX}$.`, md`The point is $(x(${t0}), y(${t0})) = (${x0}, ${y0})$.`, 'Use y − y₁ = m(x − x₁) and rearrange.'], solution: [md`Gradient $${m.toLatex()}$ at $(${x0}, ${y0})$`, md`$${answerTex(T)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the coordinates of the stationary point of $C$ for which $t > 0$.`, answer: S, scheme: [M1(md`$3t^{2} - ${b} = 0 \Rightarrow t = ${k}$`), A1(md`$${answerTex(S)}$`)], hints: ['Stationary points have dy/dx = 0: set the numerator to zero.', md`$3t^{2} = ${b}$`, 'Substitute t into both x and y.'], solution: [md`$t = ${k}$: $${answerTex(S)}$`] }),
      ],
      params: { a, b, c, t0, k },
    };
  },
  verify(inst) {
    const { a, b, c, t0 } = inst.params as Record<string, number>;
    const x = (t: number) => t * t + a,
      y = (t: number) => t ** 3 - b * t + c;
    const T = inst.parts[1].answer as EquationSpec;
    expectClose(evaluate(T.rhs, { x: x(t0) }) + 100, y(t0) + 100, 'tangent through point');
    const h = 1e-5;
    const slope = (y(t0 + h) - y(t0 - h)) / (x(t0 + h) - x(t0 - h));
    expectClose(evaluate(T.rhs, { x: 1 }) - evaluate(T.rhs, { x: 0 }), slope, 'tangent gradient', 1e-6);
    const S = inst.parts[2].answer as CoordSpec;
    const ts = Math.sqrt(valOf(S.x) - a);
    expect(Math.abs(3 * ts * ts - b) < 1e-9 && Math.abs(y(ts) - valOf(S.y)) < 1e-9, 'stationary point');
  },
});

// ---------------------------------------------------------------- 9.8 implicit differentiation
const implicitTangent = defineTemplate({
  id: 'p2.9.implicit-differentiation-tangent',
  family: 'p2.9.parametric-implicit',
  title: 'Implicit differentiation: gradient and normal at a point',
  spec: ['P7.5'],
  chapter: 'P2.9',
  sections: ['9.8'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 8,
  time: 9,
  commands: ['Find', 'Show that'],
  tags: ['implicit differentiation', 'normal', 'tangent'],
  generate(r) {
    const a = r.intNZ(-4, 4),
      b = r.pick([1, 2, 3, -1, -2]),
      e = r.pick([0, 0, 1, 2, -1]);
    const x0 = r.intNZ(-3, 3),
      y0 = r.intNZ(-3, 3);
    // x² + a xy + b y² + e x = c
    const c = x0 * x0 + a * x0 * y0 + b * y0 * y0 + e * x0;
    const nume = 2 * x0 + a * y0 + e,
      deno = a * x0 + 2 * b * y0;
    r.require(deno !== 0 && nume !== 0);
    const m = Q.of(-nume, deno);
    const lhs = sumTex([[1, 'x^{2}'], [a, 'xy'], [b, 'y^{2}'], [e, 'x']]);
    const D: ExprSpec = ans.expr(ex(`-\\frac{${sumTex([[2, 'x'], [a, 'y'], [e, '']])}}{${sumTex([[a, 'x'], [2 * b, 'y']])}}`), ['x', 'y'], { domain: { x: [0.5, 1], y: [3, 4] } });
    const Ms = ans.exact(exq(m));
    const mn = m.inv().neg();
    // normal: y − y0 = mn (x − x0)  →  mn.d·y − mn.n·x + (mn.n x0 − mn.d y0) = 0
    const A = -mn.n,
      B = mn.d,
      Cc = mn.n * x0 - mn.d * y0;
    const sg = A < 0 ? -1 : 1;
    const N: EquationSpec = ans.eq(ex(sumTex([[sg * A, 'x'], [sg * B, 'y'], [sg * Cc, '']])), num(0), ['x', 'y'], ['ax+by+c=0']);
    return {
      stem: md`The curve $C$ has equation $${lhs} = ${c}$. The point $P(${x0}, ${y0})$ lies on $C$.`,
      parts: [
        part({ label: 'a', marks: 4, prompt: md`Find $${DYDX}$ in terms of $x$ and $y$.`, answer: D, scheme: [M1(md`Differentiates $y^{2} \to 2y${DYDX}$`), M1(md`Product rule on $${a === 1 ? '' : a === -1 ? '-' : a}xy$`), A1('Fully correct differentiated equation'), A1(md`$${DYDX} = ${answerTex(D)}$`)], hints: [md`Differentiate every term with respect to $x$: $\dfrac{\mathrm{d}}{\mathrm{d}x}(y^{2}) = 2y${DYDX}$.`, md`For $xy$ use the product rule: $\dfrac{\mathrm{d}}{\mathrm{d}x}(xy) = y + x${DYDX}$.`, md`Collect the $${DYDX}$ terms and factorise.`], solution: [md`$2x + ${a}\left(y + x${DYDX}\right) + ${2 * b}y${DYDX}${e ? sgn(e) : ''} = 0$`, md`$${DYDX} = ${answerTex(D)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Find the gradient of $C$ at $P$.`, answer: Ms, scheme: [B1(md`$${m.toLatex()}$`)], hints: [md`Substitute $x = ${x0}$, $y = ${y0}$.`, 'Simplify the fraction.', 'Watch the signs.'], solution: [md`At $P$: $${DYDX} = ${answerTex(Ms)}$`] }),
        part({ label: 'c', marks: 3, prompt: md`Find an equation of the normal to $C$ at $P$, in the form $ax + by + c = 0$ where $a$, $b$, $c$ are integers.`, answer: N, scheme: [M1(md`Normal gradient $= ${mn.toLatex()}$`), M1('Uses y − y₁ = m(x − x₁)'), A1(md`$${answerTex(N)}$`)], hints: ['The normal is perpendicular to the tangent: gradient −1/m.', md`Normal gradient $= ${mn.toLatex()}$.`, 'Clear fractions and collect all terms on one side.'], solution: [md`Gradient of normal $${mn.toLatex()}$ through $(${x0}, ${y0})$:`, md`$${answerTex(N)}$`] }),
      ],
      params: { a, b, e, c, x0, y0 },
    };
  },
  verify(inst) {
    const { a, b, e, c, x0, y0 } = inst.params as Record<string, number>;
    const F = (x: number, y: number) => x * x + a * x * y + b * y * y + e * x - c;
    expect(Math.abs(F(x0, y0)) < 1e-12, 'P on C');
    const Fx = 2 * x0 + a * y0 + e,
      Fy = a * x0 + 2 * b * y0;
    expectClose(valOf(inst.parts[1].answer as ExactSpec) + 10, -Fx / Fy + 10, 'gradient');
    const N = inst.parts[2].answer as EquationSpec;
    expectClose(evaluate(N.lhs, { x: x0, y: y0 }) + 1, 1, 'normal through P');
    // normal direction is (Fx, Fy)
    expectClose(evaluate(N.lhs, { x: x0 + Fx, y: y0 + Fy }) + 1, 1, 'normal direction', 1e-9);
  },
});

const implicitStationary = defineTemplate({
  id: 'p2.9.implicit-stationary-points',
  family: 'p2.9.parametric-implicit',
  title: 'Stationary points on a curve defined implicitly',
  spec: ['P7.5', 'P7.3'],
  chapter: 'P2.9',
  sections: ['9.8'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 7,
  time: 9,
  commands: ['Find', 'Show that'],
  tags: ['implicit differentiation', 'stationary points'],
  generate(r) {
    const a = r.pick([1, -1, 2, -2]),
      b = Math.abs(a) === 2 ? r.pick([2, 3]) : r.pick([1, 2, 3]);
    const x0 = r.int(1, 4);
    const kq = Q.of(x0 * x0).mul(Q.of(4 * b, a * a).sub(1));
    r.require(kq.d === 1 && kq.value > 0);
    const k = kq.value;
    const y0 = (-2 * x0) / a;
    const lhs = sumTex([[1, 'x^{2}'], [a, 'xy'], [b, 'y^{2}']]);
    const D: ExprSpec = ans.expr(ex(`-\\frac{${sumTex([[2, 'x'], [a, 'y']])}}{${sumTex([[a, 'x'], [2 * b, 'y']])}}`), ['x', 'y'], { domain: { x: [0.5, 1], y: [3, 4] } });
    const P1: CoordSpec = ans.coord(ans.exact(exq(x0)), ans.exact(exq(y0)));
    const P2: CoordSpec = ans.coord(ans.exact(exq(-x0)), ans.exact(exq(-y0)));
    return {
      stem: md`The curve $C$ has equation $${lhs} = ${k}$.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find $${DYDX}$ in terms of $x$ and $y$.`, answer: D, scheme: [M1('Implicit differentiation of y²'), M1('Product rule on the xy term'), A1(md`$${answerTex(D)}$`)], hints: [md`$\dfrac{\mathrm{d}}{\mathrm{d}x}(y^{2}) = 2y${DYDX}$ and $\dfrac{\mathrm{d}}{\mathrm{d}x}(xy) = y + x${DYDX}$.`, md`Collect the $${DYDX}$ terms.`, 'Factorise and divide.'], solution: [md`$${DYDX} = ${answerTex(D)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Find the coordinates of the stationary point on $C$ with a positive $x$-coordinate.`, answer: P1, scheme: [M1(md`Sets the numerator to zero: $y = ${Q.of(-2, a).toLatex()}x$`), dM1('Substitutes into the equation of C'), A1(md`$${answerTex(P1)}$`)], hints: ['At a stationary point dy/dx = 0, so the numerator is zero.', md`That gives $y$ in terms of $x$: $${sumTex([[2, 'x'], [a, 'y']])} = 0$.`, 'Substitute into the equation of C and solve for x.'], solution: [md`$y = ${Q.of(-2, a).toLatex()}x$; substituting: $${Q.of(4 * b, a * a).sub(1).toLatex()}x^{2} = ${k} \Rightarrow x = \pm ${x0}$`, md`$${answerTex(P1)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`Write down the coordinates of the other stationary point.`, answer: P2, scheme: [B1(md`$${answerTex(P2)}$`)], hints: ['Use the negative value of x.', md`$y = ${Q.of(-2, a).toLatex()}x$ still holds.`, 'The curve is symmetric about the origin.'], solution: [md`$${answerTex(P2)}$`] }),
      ],
      params: { a, b, k },
    };
  },
  verify(inst) {
    const { a, b, k } = inst.params as Record<string, number>;
    for (const p of [inst.parts[1].answer, inst.parts[2].answer] as CoordSpec[]) {
      const x = valOf(p.x),
        y = valOf(p.y);
      expectClose(x * x + a * x * y + b * y * y, k, 'on C');
      expect(Math.abs(2 * x + a * y) < 1e-12 && Math.abs(a * x + 2 * b * y) > 1e-9, 'dy/dx = 0');
    }
  },
});

const templates: Template[] = [chain, product, quotient, rates, paramDiff, implicitTangent, implicitStationary];
export default templates;
