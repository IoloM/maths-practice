/** Pure Year 2, Chapter 11 — further differential equations, limits of sums and the fundamental theorem of calculus. */
import { Q } from '../../../engine/core/rational';
import { Poly } from '../../../engine/core/poly';
import { evaluate, num } from '../../../engine/core/expr';
import { derivative, expect, expectClose, integrate } from '../../../engine/core/numeric';
import { fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, ExactSpec, ExprSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, md, part, sgn } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { dx, ex, sumTex } from '../shared/calculus';

const exq = (q: Q | number) => num(Q.from(q));
const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);

// ---------------------------------------------------------------- 11.10 forming differential equations
const CONSTRUCT = [
  { text: 'Water leaks from a tank. The rate of decrease of the volume $V$ m$^{3}$ of water in the tank is proportional to the square root of $V$.', v: 'V', rhs: '-k\\sqrt{V}', f: (V: number, k: number) => -k * Math.sqrt(V), dom: [1, 9] as [number, number] },
  { text: 'A population of $P$ rabbits lives on an island that can support at most $N$ rabbits. The rate of increase of $P$ is proportional to the product of $P$ and $(N - P)$. Take $N = ${N}$.', v: 'P', rhs: 'kP(${N} - P)', f: (P: number, k: number, N: number) => k * P * (N - P), dom: [5, 40] as [number, number] },
  { text: 'Water flows into a tank at a constant rate of $${Qr}$ cm$^{3}$ s$^{-1}$ and leaks out at a rate proportional to the depth $h$ cm. The tank has constant cross-sectional area $${A}$ cm$^{2}$, so its volume is $${A}h$.', v: 'h', rhs: '\\frac{${Qr} - kh}{${A}}', f: (h: number, k: number, _N: number, Qr: number, A: number) => (Qr - k * h) / A, dom: [1, 10] as [number, number] },
  { text: 'The rate at which a rumour spreads through a school of ${N} students is proportional to the number of students, $x$, who have not yet heard it.', v: 'x', rhs: 'k(${N} - x)', f: (x: number, k: number, N: number) => k * (N - x), dom: [10, 200] as [number, number] },
];
const fillC = (s: string, N: number, Qr: number, A: number) => s.replace(/\$\{N\}/g, String(N)).replace(/\$\{Qr\}/g, String(Qr)).replace(/\$\{A\}/g, String(A));

const constructDE = defineTemplate({
  id: 'p2.11.construct-de-from-wording',
  family: 'p2.11.differential-equations',
  title: 'Form a differential equation from a description, then find the constant',
  spec: ['P7.6', 'P8.8'],
  chapter: 'P2.11',
  sections: ['11.10'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Write down', 'Find', 'Show that'],
  tags: ['differential equations', 'modelling', 'proportion'],
  generate(r) {
    const i = r.int(0, CONSTRUCT.length - 1);
    const C = CONSTRUCT[i];
    const N = r.pick([100, 200, 400, 500, 800]),
      Qr = r.pick([20, 30, 40, 50]),
      A = r.pick([200, 250, 400, 500]);
    const rhs = fillC(C.rhs, N, Qr, A);
    const E: ExprSpec = ans.expr(ex(rhs), [C.v, 'k'], { domain: { [C.v]: C.dom, k: [0.1, 2] } });
    // a measurement: when v = v1, the rate is R1, find k
    const v1 = i === 0 ? r.pick([4, 9, 16, 25]) : i === 1 ? r.pick([N / 4, N / 2, N / 5]) : i === 2 ? r.int(5, 30) : r.pick([N / 2, N / 4, (3 * N) / 4]);
    const k = Number(fmtSF(r.pick([0.02, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5]) / (i === 1 ? N : 1), 3));
    const R1 = C.f(v1, k, N, Qr, A);
    const R1s = Number(fmtSF(R1, 3));
    const kG = i === 0 ? -R1s / Math.sqrt(v1) : i === 1 ? R1s / (v1 * (N - v1)) : i === 2 ? (Qr - R1s * A) / v1 : R1s / (N - v1);
    r.require(kG > 0);
    const K = ans.num(kG, { sf: 3 });
    const d = `\\frac{\\mathrm{d}${C.v}}{\\mathrm{d}t}`;
    const rate = i === 0 ? md`decreasing at $${fmtSF(-R1s, 3)}$ m$^{3}$ per hour` : i === 2 ? md`changing at $${R1s}$ cm per second` : md`increasing at $${R1s}$ per day`;
    return {
      stem: fillC(C.text, N, Qr, A),
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Write down a differential equation for $${d}$, using $k$ for the positive constant of proportionality.`, answer: E, scheme: [M1(i === 0 ? 'Proportional with a negative sign for a decrease' : i === 2 ? 'Rate in minus rate out' : 'Proportional to the stated quantity'), A1(md`$${d} = ${rhs}$`)], hints: ['"Proportional to" means "equals a constant times".', i === 0 ? 'A decrease means the derivative is negative.' : i === 2 ? md`Rate of change of volume $= ${A}${d}$ = rate in − rate out.` : 'Write the rate of change on the left.', `The variable is ${C.v} and the time is t.`], errors: i === 0 ? [err('sign', ans.expr(ex('k\\sqrt{V}'), ['V', 'k'], { domain: { V: C.dom, k: [0.1, 2] } }), 'The volume is decreasing, so dV/dt must be negative.', 1)] : [], solution: [md`$${d} = ${answerTex(E)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`When $${C.v} = ${v1}$, $${C.v}$ is ${rate}. Find the value of $k$.`, answer: K, scheme: [M1('Substitutes the given values into their equation'), dM1('Solves for k'), A1(md`awrt $${fmtSF(kG, 3)}$`)], hints: [md`Substitute $${C.v} = ${v1}$ and $${d} = ${fmtSF(R1s, 3)}$.`, 'Rearrange for k.', 'Give 3 significant figures.'], solution: [md`$${fmtSF(R1s, 3)} = ${fillC(C.rhs, N, Qr, A).replace(new RegExp(C.v, 'g'), `(${v1})`)} \Rightarrow k = ${answerTex(K)}$`] }),
      ],
      params: { i, N, Qr, A, v1, R1s },
    };
  },
  verify(inst) {
    const { i, N, Qr, A, v1, R1s } = inst.params as Record<string, number>;
    const C = CONSTRUCT[i];
    const E = (inst.parts[0].answer as ExprSpec).value;
    for (const [v, k] of [[C.dom[0] + 1, 0.3], [C.dom[1] - 1, 1.2]]) expectClose(evaluate(E, { [C.v]: v, k }), C.f(v, k, N, Qr, A), 'DE');
    const k = valOf(inst.parts[1].answer as NumericSpec);
    expectClose(evaluate(E, { [C.v]: v1, k }), R1s, 'k fits data', 1e-9);
  },
});

// ---------------------------------------------------------------- fundamental theorem: unknown limit
const unknownLimit = defineTemplate({
  id: 'p2.11.find-limit-from-definite-integral',
  family: 'p2.11.definite-integrals',
  title: 'Find an unknown limit k given the value of a definite integral',
  spec: ['P8.1', 'P8.3'],
  chapter: 'P2.11',
  sections: ['11.1'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find', 'Show that'],
  tags: ['definite integration', 'fundamental theorem of calculus', 'equations'],
  generate(r) {
    const fam = r.pick(['poly', 'recip', 'exp'] as const);
    if (fam === 'poly') {
      const p = r.int(1, 4),
        q = r.int(0, 6),
        lo = r.int(0, 2);
      const f = Poly.coeffs([q, 2 * p]); // 2p x + q  (positive for x ≥ 0) — F = p x² + q x
      const k0 = r.int(lo + 1, lo + 6);
      const F = f.integ();
      const V = F.evalQ(k0).sub(F.evalQ(lo));
      const K = ans.exact(exq(k0));
      const quad = sumTex([[p, 'k^{2}'], [q, 'k'], [V.add(F.evalQ(lo)).neg(), '']]);
      return {
        parts: [
          part({ marks: 5, prompt: md`Given that $k > ${lo}$ and $\displaystyle\int_{${lo}}^{k} (${f.toLatex()})${dx} = ${V.toLatex()}$, find the value of $k$.`, answer: K, scheme: [M1('Integrates'), A1(md`$\left[${F.toLatex()}\right]_{${lo}}^{k}$`), M1('Substitutes the limits and sets equal to the value'), dM1(md`Solves $${quad} = 0$`), A1(md`$k = ${k0}$ (rejecting the other root)`)], hints: ['Integrate, then substitute the limits k and ' + lo + '.', md`$\left[${F.toLatex()}\right]_{${lo}}^{k} = ${V.toLatex()}$`, 'This gives a quadratic in k: choose the root with k > ' + lo + '.'], solution: [md`$${F.toLatex().replace(/x/g, 'k')} - ${F.evalQ(lo).toLatex()} = ${V.toLatex()} \Rightarrow ${quad} = 0$`.replace('- 0 =', '='), md`$k = ${answerTex(K)}$`] }),
        ],
        params: { fam, lo, fTex: f.toLatex(), V: V.value },
      };
    }
    if (fam === 'recip') {
      const a = r.int(1, 5),
        m = r.int(2, 6);
      // ∫_1^k a/x dx = a ln k = a ln m  → k = m
      const K = ans.exact(exq(m));
      return {
        parts: [
          part({ marks: 5, prompt: md`Given that $k > 1$ and $\displaystyle\int_{1}^{k} \frac{${a}}{x}${dx} = ${a === 1 ? '' : a}\ln ${m}$, find the exact value of $k$.`, answer: K, scheme: [M1(md`$${a}\ln x$`), A1(md`$${a}\ln k - ${a}\ln 1$`), M1('Uses ln 1 = 0'), dM1('Solves for k'), A1(md`$k = ${m}$`)], hints: [md`$\displaystyle\int \frac{1}{x}${dx} = \ln|x|$`, md`$\ln 1 = 0$.`, md`So $${a}\ln k = ${a}\ln ${m}$.`], solution: [md`$\left[${a}\ln x\right]_{1}^{k} = ${a}\ln k = ${a}\ln ${m} \Rightarrow k = ${answerTex(K)}$`] }),
        ],
        params: { fam, lo: 1, fTex: `\\frac{${a}}{x}`, V: a * Math.log(m) },
      };
    }
    const c = r.pick([1, 2, 3]),
      m = r.pick([2, 3, 4, 5]);
    // ∫_0^k e^{cx} dx = (e^{ck} − 1)/c = (m − 1)/c → k = ln(m)/c
    const kTex = c === 1 ? `\\ln ${m}` : `\\frac{1}{${c}}\\ln ${m}`;
    const K = ans.exact(ex(kTex), ['exact']);
    return {
      parts: [
        part({ marks: 5, prompt: md`Given that $\displaystyle\int_{0}^{k} e^{${c === 1 ? '' : c}x}${dx} = ${Q.of(m - 1, c).toLatex()}$, find the exact value of $k$.`, answer: K, scheme: [M1(md`$\dfrac{1}{${c}}e^{${c === 1 ? '' : c}x}$`), A1(md`$\dfrac{1}{${c}}\left(e^{${c === 1 ? '' : c}k} - 1\right)$`), M1('Sets equal to the value'), dM1('Takes ln to solve'), A1(md`$k = ${kTex}$`)], hints: [md`$\displaystyle\int e^{cx}${dx} = \frac{1}{c}e^{cx}$`, md`Substitute the limits: $e^{0} = 1$.`, 'Make the exponential the subject, then take ln.'], solution: [md`$\dfrac{1}{${c}}\left(e^{${c === 1 ? '' : c}k} - 1\right) = ${Q.of(m - 1, c).toLatex()} \Rightarrow e^{${c === 1 ? '' : c}k} = ${m} \Rightarrow k = ${answerTex(K)}$`] }),
      ],
      params: { fam, lo: 0, fTex: `e^{${c === 1 ? '' : c}x}`, V: (m - 1) / c },
    };
  },
  verify(inst) {
    const { lo, fTex, V } = inst.params as { lo: number; fTex: string; V: number };
    const f = ex(fTex);
    const k = valOf(inst.parts[0].answer as ExactSpec);
    expectClose(integrate((x) => evaluate(f, { x }), lo, k, 1e-12), V, 'integral value', 1e-8);
  },
});

// ---------------------------------------------------------------- 11.1 integration as the limit of a sum
const limitSum = defineTemplate({
  id: 'p2.11.limit-of-sum-exact',
  family: 'p2.11.limit-of-sum',
  title: 'Write the limit of a sum as an integral and evaluate it exactly',
  spec: ['P8.4'],
  chapter: 'P2.11',
  sections: ['11.1'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 4,
  time: 5,
  commands: ['Find', 'Show that'],
  tags: ['limit of a sum', 'definite integration', 'exact'],
  generate(r) {
    const fam = r.pick(['exp', 'recip', 'root', 'sin'] as const);
    let fTex: string, a: string, b: string, valTex: string, an: number, bn: number;
    if (fam === 'exp') {
      const k = r.pick([1, 2, 3]),
        A = r.int(1, 6);
      an = 0;
      bn = r.pick([1, 2]);
      fTex = `${A === 1 ? '' : A}e^{${k === 1 ? '' : k}x}`;
      a = '0';
      b = String(bn);
      valTex = `${Q.of(A, k).eq(1) ? '' : Q.of(A, k).toLatex()}\\left(e^{${k * bn}} - 1\\right)`;
    } else if (fam === 'recip') {
      const A = r.int(1, 5);
      an = r.int(1, 3);
      bn = an * r.int(2, 4);
      fTex = `\\frac{${A}}{x}`;
      a = String(an);
      b = String(bn);
      valTex = `${A === 1 ? '' : A}\\ln ${bn / an}`;
    } else if (fam === 'root') {
      const A = r.pick([3, 6, 9, 1, 2]);
      an = r.pick([0, 1, 4]);
      bn = r.pick([4, 9, 16, 25].filter((v) => v > an));
      fTex = `${A === 1 ? '' : A}\\sqrt{x}`;
      a = String(an);
      b = String(bn);
      valTex = Q.of(2 * A, 3).mul(Math.round(bn ** 1.5) - Math.round(an ** 1.5)).toLatex();
    } else {
      const A = r.int(1, 6);
      const m = r.pick([2, 1]);
      an = 0;
      bn = Math.PI / m;
      fTex = `${A === 1 ? '' : A}\\sin x`;
      a = '0';
      b = m === 1 ? '\\pi' : '\\frac{\\pi}{2}';
      valTex = String(m === 1 ? 2 * A : A);
    }
    const V = ans.exact(ex(valTex), ['exact']);
    return {
      parts: [
        part({
          marks: 4,
          prompt: md`Find the exact value of $\displaystyle\lim_{\delta x \to 0} \sum_{x = ${a}}^{${b}} ${fTex}\,\delta x$.`,
          answer: V,
          scheme: [B1(md`Recognises the limit as $\displaystyle\int_{${a}}^{${b}} ${fTex}${dx}$`), M1('Integrates'), M1('Substitutes the limits'), A1(md`$${valTex}$`)],
          hints: [md`As $\delta x \to 0$, $\sum y\,\delta x$ becomes $\int y${dx}$.`, md`So the limit is $\displaystyle\int_{${a}}^{${b}} ${fTex}${dx}$.`, 'Integrate and use the limits; leave your answer exact.'],
          errors: [],
          solution: [md`$\displaystyle\int_{${a}}^{${b}} ${fTex}${dx} = ${answerTex(V)}$`],
        }),
      ],
      params: { fTex, an, bn },
    };
  },
  verify(inst) {
    const { fTex, an, bn } = inst.params as { fTex: string; an: number; bn: number };
    const f = ex(fTex);
    // Riemann sum with a fine δx, compared with the exact answer
    const n = 20000,
      h = (bn - an) / n;
    let s = 0;
    for (let i = 0; i < n; i++) s += evaluate(f, { x: an + (i + 0.5) * h }) * h;
    expectClose(valOf(inst.parts[0].answer as ExactSpec), s, 'limit of sum', 1e-6);
  },
});

// ---------------------------------------------------------------- 11.10 separable equations (further)
const separable = defineTemplate({
  id: 'p2.11.separable-de-particular-solution',
  family: 'p2.11.differential-equations',
  title: 'Separable differential equations: particular solutions in the form y = f(x)',
  spec: ['P8.7'],
  chapter: 'P2.11',
  sections: ['11.10'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 6,
  time: 8,
  commands: ['Find', 'Solve'],
  tags: ['differential equations', 'separation of variables', 'particular solution'],
  generate(r) {
    const fam = r.pick(['y2', 'power', 'exp'] as const);
    let deTex: string, cond: string, solTex: string, dom: [number, number], steps: string[];
    let x0: number, y0: number;
    if (fam === 'y2') {
      const p = r.int(-4, 4),
        m = r.int(2, 9);
      deTex = `(2x${p === 0 ? '' : sgn(p)})y^{2}`;
      x0 = 0;
      y0 = 1 / m;
      cond = md`$y = \frac{1}{${m}}$ when $x = 0$`;
      solTex = `\\frac{1}{${m} - x^{2}${p === 0 ? '' : sgn(-p, 'x')}}`;
      dom = [-0.4, 0.4];
      steps = [md`$\displaystyle\int y^{-2}\,\mathrm{d}y = \int (2x${p === 0 ? '' : sgn(p)})${dx} \Rightarrow -\frac{1}{y} = x^{2}${p === 0 ? '' : sgn(p, 'x')} + c$`, md`$x = 0, y = \frac{1}{${m}}$: $c = -${m}$`];
    } else if (fam === 'power') {
      const k = r.pick([2, 3, -1, -2, 1]),
        A = r.int(2, 9);
      deTex = `\\frac{${k === 1 ? '' : k}y}{x}`;
      x0 = 1;
      y0 = A;
      cond = md`$y = ${A}$ when $x = 1$, $x > 0$, $y > 0$`;
      solTex = `${A}x^{${k}}`;
      dom = [0.5, 2];
      steps = [md`$\displaystyle\int \frac{1}{y}\,\mathrm{d}y = \int \frac{${k}}{x}${dx} \Rightarrow \ln y = ${k === 1 ? '' : k}\ln x + c$`, md`$x = 1, y = ${A}$: $c = \ln ${A}$, so $y = ${A}x^{${k}}$`];
    } else {
      const c = r.int(1, 4);
      deTex = 'e^{x - y}';
      x0 = 0;
      y0 = Math.log(1 + c);
      cond = md`$y = \ln ${1 + c}$ when $x = 0$`;
      solTex = `\\ln(e^{x} + ${c})`;
      dom = [-1, 1];
      steps = [md`$\displaystyle\int e^{y}\,\mathrm{d}y = \int e^{x}${dx} \Rightarrow e^{y} = e^{x} + c$`, md`$x = 0$: $${1 + c} = 1 + c \Rightarrow c = ${c}$`];
    }
    const Y: ExprSpec = ans.expr(ex(solTex), ['x'], { domain: { x: dom } });
    return {
      parts: [
        part({
          marks: 6,
          prompt: md`Find the particular solution of the differential equation $\dfrac{\mathrm{d}y}{\mathrm{d}x} = ${deTex}$ for which ${cond}, giving your answer in the form $y = \mathrm{f}(x)$.`,
          answer: Y,
          scheme: [M1('Separates the variables correctly'), A1('Integrates the y side'), A1('Integrates the x side'), M1('Uses the condition to find the constant'), dM1('Rearranges to y = f(x)'), A1(md`$y = ${solTex}$`)],
          hints: ['Get all the y terms with dy and all the x terms with dx.', fam === 'exp' ? md`$e^{x - y} = \dfrac{e^{x}}{e^{y}}$` : fam === 'y2' ? md`Divide by $y^{2}$: $\displaystyle\int y^{-2}\,\mathrm{d}y$.` : 'Divide by y.', 'Find c from the condition before rearranging for y.'],
          solution: [...steps, md`$y = ${answerTex(Y)}$`],
        }),
      ],
      params: { fam, x0, y0, deTex },
    };
  },
  verify(inst) {
    const { x0, y0, deTex } = inst.params as { x0: number; y0: number; deTex: string };
    const Y = (inst.parts[0].answer as ExprSpec).value;
    const y = (x: number) => evaluate(Y, { x });
    expectClose(y(x0), y0, 'initial condition');
    const D = ex(deTex);
    for (const x of [x0 + 0.13, x0 + 0.27]) expectClose(derivative(y, x), evaluate(D, { x, y: y(x) }), 'satisfies the DE', 1e-6);
  },
});

// ---------------------------------------------------------------- 11.11 modelling with differential equations
const tank = defineTemplate({
  id: 'p2.11.de-draining-tank',
  family: 'p2.11.de-modelling',
  title: 'Draining tank: dh/dt = −k√h, find k and the time to empty',
  spec: ['P8.8', 'P8.7'],
  chapter: 'P2.11',
  sections: ['11.11'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 8,
  time: 10,
  commands: ['Show that', 'Find', 'Interpret'],
  tags: ['differential equations', 'modelling', 'separation of variables'],
  generate(r) {
    const s0 = r.int(3, 8),
      s1 = r.int(1, s0 - 1),
      T1 = r.int(2, 20);
    const H0 = s0 * s0,
      H1 = s1 * s1;
    const k = Q.of(2 * (s0 - s1), T1);
    const tEmpty = Q.of(2 * s0).div(k);
    const what = r.pick([['Water drains from a tank', 'cm', 'minutes'], ['Oil drains from a container', 'cm', 'seconds'], ['Rainwater drains from a water butt', 'cm', 'minutes']]);
    const K = ans.exact(exq(k)),
      TE = ans.exact(exq(tEmpty), undefined, { unit: `\\text{${what[2]}}` });
    const SOL: ExprSpec = ans.expr(ex(`\\left(${s0} - \\frac{${k.n}t}{${2 * k.d}}\\right)^{2}`), ['t'], { domain: { t: [0, tEmpty.value * 0.9] } });
    const opts = ['The model predicts the tank keeps emptying at a decreasing rate until h = 0; in reality the outlet may block or the flow may not depend only on h', 'The model predicts negative depths', 'The model says the tank never empties'];
    const C: ChoiceSpec = ans.choice(opts, 0);
    return {
      stem: md`${what[0]}. The depth of liquid, $h$ ${what[1]}, $t$ ${what[2]} after it starts to drain is modelled by $\dfrac{\mathrm{d}h}{\mathrm{d}t} = -k\sqrt{h}$, where $k$ is a positive constant. Initially $h = ${H0}$, and when $t = ${T1}$, $h = ${H1}$.`,
      parts: [
        part({ label: 'a', marks: 4, prompt: md`Find the value of $k$.`, answer: K, scheme: [M1(md`Separates: $\displaystyle\int h^{-\frac{1}{2}}\,\mathrm{d}h = \int -k\,\mathrm{d}t$`), A1(md`$2\sqrt{h} = -kt + c$`), M1(md`Uses $h = ${H0}$ at $t = 0$: $c = ${2 * s0}$`), A1(md`$k = ${k.toLatex()}$`)], hints: [md`Divide by $\sqrt{h}$ and integrate both sides.`, md`$\displaystyle\int h^{-\frac{1}{2}}\,\mathrm{d}h = 2\sqrt{h}$`, md`Use $t = 0$, $h = ${H0}$ to find $c$, then $t = ${T1}$, $h = ${H1}$ to find $k$.`], solution: [md`$2\sqrt{h} = -kt + ${2 * s0}$`, md`$t = ${T1}$: $${2 * s1} = -${T1}k + ${2 * s0} \Rightarrow k = ${answerTex(K)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Hence find an expression for $h$ in terms of $t$.`, answer: SOL, scheme: [M1('Rearranges for √h, then squares'), A1(md`$h = \left(${s0} - \frac{${k.n}t}{${2 * k.d}}\right)^{2}$`)], hints: [md`$\sqrt{h} = ${s0} - \frac{k}{2}t$`, 'Square both sides.', 'Use your value of k.'], solution: [md`$h = ${answerTex(SOL)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`Find the time taken for the ${what[0].split(' ')[0].toLowerCase()} to drain completely, according to the model.`, answer: TE, scheme: [B1(md`$t = \dfrac{${2 * s0}}{k} = ${tEmpty.toLatex()}$`)], hints: ['Empty means h = 0.', md`$2\sqrt{0} = -kt + ${2 * s0}$`, 'Solve for t.'], solution: [md`$0 = -${k.toLatex()}t + ${2 * s0} \Rightarrow t = ${answerTex(TE)}$`] }),
        part({ label: 'd', marks: 1, prompt: md`Give one limitation of the model.`, answer: C, scheme: [B1('Sensible limitation')], hints: ['Think about the real outlet.', 'Does the flow really depend only on the depth?', 'What happens close to empty?'], solution: [opts[0]] }),
      ],
      params: { H0, k: k.value },
    };
  },
  verify(inst) {
    const { H0, k } = inst.params as Record<string, number>;
    const h = (t: number) => evaluate((inst.parts[1].answer as ExprSpec).value, { t });
    expectClose(h(0), H0, 'initial depth');
    for (const t of [0.5, 1.5]) expectClose(derivative(h, t), -k * Math.sqrt(h(t)), 'satisfies the DE', 1e-6);
    expect(Math.abs(h(valOf(inst.parts[2].answer as ExactSpec))) < 1e-9, 'empty');
  },
});

const templates: Template[] = [constructDE, unknownLimit, limitSum, separable, tank];
export default templates;
