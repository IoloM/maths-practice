/** Pure Year 2, Chapter 11 — differential equations (separable, modelling), constructing DEs, integration as the limit of a sum. */
import { Q } from '../../../engine/core/rational';
import { Poly } from '../../../engine/core/poly';
import { evaluate, num } from '../../../engine/core/expr';
import { derivative, expect, expectClose, integrate } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, ExprSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';

const exponentialDE = defineTemplate({
  id: 'p2.11.de-exponential-growth-decay',
  family: 'p2.11.differential-equations',
  title: 'Solve dy/dx = ky with an initial condition',
  spec: ['P8.7', 'P6.2'],
  chapter: 'P2.11',
  sections: ['11.10'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 4,
  time: 5,
  commands: ['Find', 'Solve'],
  tags: ['differential equations', 'separation of variables', 'exponential'],
  generate(r) {
    const k = r.pick([Q.of(2), Q.of(3), Q.of(-1), Q.of(-2), Q.of(1, 2), Q.of(-1, 2), Q.of(3, 2), Q.of(-3)]);
    const y0 = r.pick([2, 3, 4, 5, 6, 8, 10, 12]);
    const x0 = r.pick([0, 0, 1]);
    const kTex = k.eq(1) ? '' : k.eq(-1) ? '-' : k.toLatex();
    const solTex = x0 === 0 ? `${y0}e^{${k.isInt ? `${k.n === 1 ? '' : k.n === -1 ? '-' : k.n}x` : `${k.toLatex()}x`}}` : `${y0}e^{${k.toLatex()}(x - 1)}`;
    const E: ExprSpec = ans.expr(ex(solTex), ['x'], { domain: { x: [-1.5, 1.5] }, label: 'y =' });
    return {
      stem: md`Given that $y = ${y0}$ when $x = ${x0}$,`,
      parts: [
        part({
          marks: 4,
          prompt: md`solve the differential equation $\dfrac{\mathrm{d}y}{\mathrm{d}x} = ${kTex}y$, giving $y$ in terms of $x$.`,
          answer: E,
          scheme: [M1(md`Separates: $\int \frac{1}{y}\,\mathrm{d}y = \int ${kTex === '' ? '1' : kTex === '-' ? '-1' : kTex}\,\mathrm{d}x$`), A1(md`$\ln y = ${kTex}x + c$`), M1(md`Uses $y = ${y0}$ when $x = ${x0}$`), A1(md`$${answerTex(E)}$`)],
          hints: ['Separate the variables: get all the y terms with dy and all the x terms with dx.', md`$\int \frac{1}{y}\,\mathrm{d}y = \ln y$.`, md`$\ln y = ${kTex}x + c$, so $y = Ae^{${kTex}x}$. Use the condition to find $A$.`],
          errors: [err('no-condition', ans.expr(ex(`e^{${k.toLatex()}x}`), ['x'], { domain: { x: [-1.5, 1.5] } }), 'Use the given condition to find the constant.', 2)],
          solution: [md`$\int \frac{1}{y}\,\mathrm{d}y = \int ${kTex === '' ? '1' : kTex === '-' ? '-1' : kTex}\,\mathrm{d}x \Rightarrow \ln y = ${kTex}x + c$`, md`$y = Ae^{${k.toLatex()}x}$; using $y = ${y0}$ at $x = ${x0}$:`, md`$${answerTex(E)}$`],
        }),
      ],
      params: { k: k.value, y0, x0 },
    };
  },
  verify(inst) {
    const { k, y0, x0 } = inst.params as Record<string, number>;
    const e = (inst.parts[0].answer as ExprSpec).value;
    const y = (x: number) => evaluate(e, { x });
    expectClose(y(x0), y0, 'initial condition');
    for (const x of [-1, 0.3, 1.2]) expectClose(derivative(y, x), k * y(x), "y' = ky", 1e-6);
  },
});

const separableXY = defineTemplate({
  id: 'p2.11.de-separable-particular',
  family: 'p2.11.differential-equations',
  title: 'Separable differential equation: particular solution',
  spec: ['P8.7'],
  chapter: 'P2.11',
  sections: ['11.10'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 6,
  time: 8,
  commands: ['Find'],
  tags: ['differential equations', 'separation of variables', 'particular solution'],
  generate(r) {
    const variant = r.pick(['xy', 'xOverY'] as const);
    if (variant === 'xy') {
      const a = r.pick([1, 2, 3, 4, 6]),
        b = r.int(-3, 3);
      const y0 = r.pick([2, 3, 4, 5, 10]);
      const pTex = sumTex([[a, 'x'], [b, '']]);
      const expo = Poly.coeffs([0, b, Q.of(a, 2)]);
      const solTex = `${y0}e^{${expo.toLatex()}}`;
      const E = ans.expr(ex(solTex), ['x'], { domain: { x: [-1, 1] }, label: 'y =' });
      return {
        stem: md`The variables $x$ and $y$ satisfy $\dfrac{\mathrm{d}y}{\mathrm{d}x} = (${pTex})y$, and $y = ${y0}$ when $x = 0$.`,
        parts: [
          part({
            marks: 6,
            prompt: md`Find $y$ in terms of $x$.`,
            answer: E,
            scheme: [M1('Separates the variables'), A1(md`$\int \frac{1}{y}\,\mathrm{d}y = \int (${pTex})\,\mathrm{d}x$`), M1('Integrates both sides'), A1(md`$\ln y = ${expo.toLatex()} + c$`), dM1(md`Uses $(0, ${y0})$ to find the constant`), A1(md`$${answerTex(E)}$`)],
            hints: ['Divide both sides by y and multiply by dx.', md`$\int \frac{1}{y}\,\mathrm{d}y = \int (${pTex})\,\mathrm{d}x$`, md`$\ln y = ${expo.toLatex()} + c$; at $x = 0$, $\ln ${y0} = c$.`],
            errors: [err('forgot-constant', ans.expr(ex(`e^{${expo.toLatex()}}`), ['x'], { domain: { x: [-1, 1] } }), 'Use the initial condition to find the constant.', 4)],
            solution: [md`$\int \frac{1}{y}\,\mathrm{d}y = \int (${pTex})\,\mathrm{d}x \Rightarrow \ln y = ${expo.toLatex()} + c$`, md`$x = 0$, $y = ${y0}$: $c = \ln ${y0}$, so $y = e^{\ln ${y0}}e^{${expo.toLatex()}}$`, md`$${answerTex(E)}$`],
          }),
        ],
        params: { variant, a, b, y0 },
      };
    }
    const k = r.pick([1, 2, 3, 4]);
    const x0 = r.int(0, 3),
      y0 = r.int(1, 6);
    const C = y0 * y0 - k * x0 * x0;
    const rhs = sumTex([[k, 'x^{2}'], [C, '']]);
    const E = ans.expr(ex(rhs), ['x'], { domain: { x: [0, 3] }, label: 'y^{2} =' });
    return {
      stem: md`The curve $C$ satisfies $\dfrac{\mathrm{d}y}{\mathrm{d}x} = \dfrac{${k === 1 ? '' : k}x}{y}$, $y > 0$, and passes through $(${x0}, ${y0})$.`,
      parts: [
        part({
          marks: 6,
          prompt: md`Find an expression for $y^{2}$ in terms of $x$.`,
          answer: E,
          scheme: [M1('Separates: ∫ y dy = ∫ kx dx'), A1(md`$\frac{1}{2}y^{2}$`), A1(md`$\frac{${k}}{2}x^{2} + c$`), dM1(md`Uses $(${x0}, ${y0})$`), A1(md`$c = ${fmtNum(C / 2)}$`), A1(md`$${answerTex(E)}$`)],
          hints: ['Multiply both sides by y, then integrate.', md`$\int y\,\mathrm{d}y = \int ${k === 1 ? '' : k}x\,\mathrm{d}x$`, md`$\frac{1}{2}y^{2} = \frac{${k}}{2}x^{2} + c$; substitute $(${x0}, ${y0})$.`],
          errors: [err('half-dropped-one-side', ans.expr(ex(sumTex([[Q.of(k, 2), 'x^{2}'], [Q.of(y0 * y0).sub(Q.of(k * x0 * x0, 2)), '']])), ['x'], { domain: { x: [0, 3] } }), 'Both sides have a factor ½ after integrating — multiply the whole equation by 2.', 3)],
          solution: [md`$\int y\,\mathrm{d}y = \int ${k === 1 ? '' : k}x\,\mathrm{d}x \Rightarrow \frac{1}{2}y^{2} = \frac{${k}}{2}x^{2} + c$`, md`At $(${x0}, ${y0})$: $\frac{${y0 * y0}}{2} = \frac{${k * x0 * x0}}{2} + c$`, md`$${answerTex(E)}$`],
        }),
      ],
      params: { variant, k, x0, y0 },
    };
  },
  verify(inst) {
    const p = inst.params as Record<string, number | string>;
    const e = (inst.parts[0].answer as ExprSpec).value;
    if (p.variant === 'xy') {
      const { a, b, y0 } = p as Record<string, number>;
      const y = (x: number) => evaluate(e, { x });
      expectClose(y(0), y0, 'initial');
      for (const x of [-0.7, 0.4, 0.9]) expectClose(derivative(y, x), (a * x + b) * y(x), 'DE', 1e-6);
    } else {
      const { k, x0, y0 } = p as Record<string, number>;
      const y = (x: number) => Math.sqrt(evaluate(e, { x }));
      expectClose(y(x0), y0, 'through point');
      for (const x of [x0 + 0.5, x0 + 1.2]) expectClose(derivative(y, x), (k * x) / y(x), 'DE', 1e-6);
    }
  },
});

const cooling = defineTemplate({
  id: 'p2.11.de-newton-cooling',
  family: 'p2.11.de-modelling',
  title: "Modelling: Newton's law of cooling",
  spec: ['P8.8', 'P8.7', 'P6.7'],
  chapter: 'P2.11',
  sections: ['11.11'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 8,
  time: 11,
  commands: ['Show that', 'Find', 'State'],
  tags: ['differential equations', 'modelling', 'exponential decay', 'context'],
  generate(r) {
    const R = r.pick([15, 18, 20, 22, 25]);
    const th0 = r.pick([70, 80, 85, 90, 95, 100]);
    const t1 = r.pick([5, 8, 10, 12, 15]);
    const th1 = r.int(Math.round(R + (th0 - R) * 0.5), Math.round(R + (th0 - R) * 0.85));
    const k = Math.log((th0 - R) / (th1 - R)) / t1;
    const T = r.pick([20, 25, 30, 40, 45, 60]);
    const thT = R + (th0 - R) * Math.exp(-k * T);
    const ctx = r.pick(['a cup of tea', 'a bowl of soup', 'a metal block', 'a baked loaf']);
    const K = ans.num(k, { sf: 3 });
    const TT = ans.num(thT, { sf: 3 }, { unit: '^{\\circ}\\text{C}' });
    const L = ans.exact(num(R), [], { unit: '^{\\circ}\\text{C}' });
    return {
      stem: md`The temperature $\theta$ °C of ${ctx}, $t$ minutes after it is placed in a room at $${R}$ °C, satisfies $\dfrac{\mathrm{d}\theta}{\mathrm{d}t} = -k(\theta - ${R})$, where $k$ is a positive constant. Initially $\theta = ${th0}$.`,
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: md`Show that $\theta = ${R} + ${th0 - R}e^{-kt}$.`,
          answer: ans.self(md`$\displaystyle\int \frac{1}{\theta - ${R}}\,\mathrm{d}\theta = \int -k\,\mathrm{d}t \Rightarrow \ln(\theta - ${R}) = -kt + c$. At $t = 0$, $\theta = ${th0}$, so $c = \ln ${th0 - R}$. Hence $\theta - ${R} = ${th0 - R}e^{-kt}$ and $\theta = ${R} + ${th0 - R}e^{-kt}$.`),
          scheme: [M1('Separates and integrates to a ln'), M1('Uses initial condition to find the constant'), { code: 'A1*', text: md`Obtains $\theta = ${R} + ${th0 - R}e^{-kt}$ with no errors`, final: true }],
          hints: ['Separate the variables.', md`$\int \frac{1}{\theta - ${R}}\,\mathrm{d}\theta = \ln(\theta - ${R})$.`, md`Use $\theta = ${th0}$ when $t = 0$, then make $\theta$ the subject.`],
          solution: [md`$\ln(\theta - ${R}) = -kt + c$; $t = 0$: $c = \ln ${th0 - R}$`, md`$\theta = ${R} + ${th0 - R}e^{-kt}$`],
        }),
        part({
          label: 'b',
          marks: 3,
          prompt: md`Given that $\theta = ${th1}$ when $t = ${t1}$, find the value of $k$.`,
          answer: K,
          scheme: [M1(md`$${th1} = ${R} + ${th0 - R}e^{-${t1}k}$`), M1('Takes logs correctly'), A1(md`$k = ${answerTex(K)}$`)],
          hints: ['Substitute into the result of part (a).', md`$e^{-${t1}k} = \frac{${th1 - R}}{${th0 - R}}$`, 'Take natural logs of both sides.'],
          errors: [err('sign', ans.num(-k, { sf: 3 }), 'k is positive: check the sign when you take logs.', 2)],
          solution: [md`$e^{-${t1}k} = \frac{${th1 - R}}{${th0 - R}} \Rightarrow k = \frac{1}{${t1}}\ln\frac{${th0 - R}}{${th1 - R}} = ${answerTex(K)}$`],
        }),
        part({
          label: 'c',
          marks: 1,
          prompt: md`Find the temperature after $${T}$ minutes.`,
          answer: TT,
          ft: (prev) => (prev.b?.value && prev.b.value > 0 ? ans.num(R + (th0 - R) * Math.exp(-prev.b.value * T), { sf: 3 }) : null),
          scheme: [B1(md`$${fmtSF(thT, 3)}$ °C`)],
          hints: ['Substitute t into the model.', md`$\theta = ${R} + ${th0 - R}e^{-${fmtSF(k, 4)} \times ${T}}$`, 'Use the unrounded k.'],
          solution: [md`$\theta = ${R} + ${th0 - R}e^{-${fmtSF(k, 5)} \times ${T}} = ${answerTex(TT)}$`],
        }),
        part({
          label: 'd',
          marks: 1,
          prompt: 'According to the model, what temperature does the object approach in the long term?',
          answer: L,
          scheme: [B1(md`$${R}$ °C (room temperature), as $e^{-kt} \to 0$`)],
          hints: ['What happens to e^{−kt} as t becomes large?', 'e^{−kt} → 0.', 'So θ approaches the constant term.'],
          solution: [md`As $t \to \infty$, $e^{-kt} \to 0$, so $\theta \to ${answerTex(L)}$ (room temperature).`],
        }),
      ],
      params: { R, th0, t1, th1, T },
    };
  },
  verify(inst) {
    const { R, th0, t1, th1, T } = inst.params as Record<string, number>;
    const k = (inst.parts[1].answer as NumericSpec).value;
    // Euler-integrate the DE independently
    let th = th0;
    const h = 0.001;
    for (let t = 0; t < t1 - 1e-9; t += h) {
      const k1 = -k * (th - R),
        k2 = -k * (th + (h / 2) * k1 - R),
        k3 = -k * (th + (h / 2) * k2 - R),
        k4 = -k * (th + h * k3 - R);
      th += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    }
    expectClose(th, th1, 'θ(t1) by RK4', 1e-6);
    expectClose((inst.parts[2].answer as NumericSpec).value, R + (th0 - R) * Math.exp(-k * T), 'θ(T)');
  },
});

const population = defineTemplate({
  id: 'p2.11.de-population-model',
  family: 'p2.11.de-modelling',
  title: 'Modelling growth with dP/dt = kP and its limitations',
  spec: ['P8.8', 'P8.7', 'P6.7'],
  chapter: 'P2.11',
  sections: ['11.11'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 6,
  time: 9,
  commands: ['Find', 'Comment'],
  tags: ['differential equations', 'modelling', 'exponential growth', 'limitations'],
  generate(r) {
    const ctx = r.pick([
      { what: 'the number of bacteria, $P$ thousand,', t: '$t$ hours after the start of an experiment', unit: 'hours', lim: 'nutrients and space will run out, so growth will slow down' },
      { what: 'the number of rabbits, $P$,', t: '$t$ years after they were introduced to an island', unit: 'years', lim: 'food and space on the island are limited, so the population cannot grow without bound' },
      { what: 'the number of users of an app, $P$ thousand,', t: '$t$ weeks after launch', unit: 'weeks', lim: 'the number of potential users is finite' },
    ]);
    const P0 = r.pick([50, 80, 120, 200, 250, 400]);
    const t1 = r.pick([2, 3, 4, 5]);
    const factor = r.real(1.3, 2.5, 2);
    const P1 = Math.round(P0 * factor);
    const k = Math.log(P1 / P0) / t1;
    const T = t1 * r.pick([2, 3, 4]);
    const PT = P0 * Math.exp(k * T);
    const K = ans.num(k, { sf: 3 });
    const PP = ans.num(PT, { sf: 3 });
    const opts = r.shuffle([`The model predicts unlimited growth, but ${ctx.lim}.`, 'The model gives negative values of P for large t.', 'The model is only valid when P is decreasing.']);
    const C = ans.choice(opts, opts.findIndex((o) => o.startsWith('The model predicts unlimited')));
    return {
      stem: md`${ctx.what.charAt(0).toUpperCase() + ctx.what.slice(1)} ${ctx.t}, is modelled by $\dfrac{\mathrm{d}P}{\mathrm{d}t} = kP$, where $k$ is a constant. Initially $P = ${P0}$, and $P = ${P1}$ when $t = ${t1}$.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find the value of $k$.`, answer: K, scheme: [M1(md`Solves to $P = ${P0}e^{kt}$`), M1(md`$${P1} = ${P0}e^{${t1}k}$ and takes logs`), A1(md`$k = ${answerTex(K)}$`)], hints: ['Separating variables gives P = Ae^{kt}.', md`$A = ${P0}$ from the initial condition.`, md`$e^{${t1}k} = \frac{${P1}}{${P0}}$`], solution: [md`$P = ${P0}e^{kt}$; $${P1} = ${P0}e^{${t1}k} \Rightarrow k = \frac{1}{${t1}}\ln\frac{${P1}}{${P0}} = ${answerTex(K)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Use the model to predict $P$ when $t = ${T}$.`, answer: PP, ft: (prev) => (prev.a?.value ? ans.num(P0 * Math.exp(prev.a.value * T), { sf: 3 }) : null), scheme: [M1('Substitutes t into their model'), A1(md`$${answerTex(PP)}$`)], hints: ['Use P = P₀e^{kt}.', md`$P = ${P0}e^{${fmtSF(k, 4)} \times ${T}}$`, 'Use the unrounded k.'], solution: [md`$P = ${P0}e^{${fmtSF(k, 5)} \times ${T}} = ${answerTex(PP)}$`] }),
        part({ label: 'c', marks: 1, prompt: 'Give one limitation of this model.', answer: C, scheme: [B1('Unlimited growth is unrealistic, in context')], hints: ['What happens to P as t → ∞?', 'Is that realistic?', 'Think about resources.'], solution: [opts[opts.findIndex((o) => o.startsWith('The model predicts unlimited'))]] }),
      ],
      params: { P0, P1, t1, T },
    };
  },
  verify(inst) {
    const { P0, P1, t1, T } = inst.params as Record<string, number>;
    const k = (inst.parts[0].answer as NumericSpec).value;
    expectClose(P0 * Math.exp(k * t1), P1, 'fits data');
    expectClose((inst.parts[1].answer as NumericSpec).value, P0 * (P1 / P0) ** (T / t1), 'prediction via ratio');
  },
});

export const CONSTRUCT_FIXED = [
  { text: 'The rate of decrease of the volume $V$ of a melting snowball is proportional to its surface area, which is proportional to $V^{\\frac{2}{3}}$.', ok: '\\frac{\\mathrm{d}V}{\\mathrm{d}t} = -kV^{\\frac{2}{3}}', bad: ['\\frac{\\mathrm{d}V}{\\mathrm{d}t} = kV^{\\frac{2}{3}}', '\\frac{\\mathrm{d}V}{\\mathrm{d}t} = -kV^{\\frac{3}{2}}', '\\frac{\\mathrm{d}V}{\\mathrm{d}t} = -\\frac{k}{V^{\\frac{2}{3}}}'] },
  { text: 'The rate at which the height $h$ of water in a leaking tank decreases is proportional to the square root of the height.', ok: '\\frac{\\mathrm{d}h}{\\mathrm{d}t} = -k\\sqrt{h}', bad: ['\\frac{\\mathrm{d}h}{\\mathrm{d}t} = k\\sqrt{h}', '\\frac{\\mathrm{d}h}{\\mathrm{d}t} = -kh^{2}', '\\frac{\\mathrm{d}h}{\\mathrm{d}t} = -\\frac{k}{\\sqrt{h}}'] },
  { text: 'The radius $r$ of a circular ink blot increases at a rate inversely proportional to its radius.', ok: '\\frac{\\mathrm{d}r}{\\mathrm{d}t} = \\frac{k}{r}', bad: ['\\frac{\\mathrm{d}r}{\\mathrm{d}t} = kr', '\\frac{\\mathrm{d}r}{\\mathrm{d}t} = -\\frac{k}{r}', '\\frac{\\mathrm{d}r}{\\mathrm{d}t} = \\frac{k}{r^{2}}'] },
  { text: 'The number of people $N$ who have heard a rumour increases at a rate proportional to the number who have not yet heard it, out of a population of $1000$.', ok: '\\frac{\\mathrm{d}N}{\\mathrm{d}t} = k(1000 - N)', bad: ['\\frac{\\mathrm{d}N}{\\mathrm{d}t} = kN', '\\frac{\\mathrm{d}N}{\\mathrm{d}t} = -k(1000 - N)', '\\frac{\\mathrm{d}N}{\\mathrm{d}t} = k(N - 1000)'] },
  { text: 'The mass $m$ of a radioactive substance decreases at a rate proportional to the mass remaining.', ok: '\\frac{\\mathrm{d}m}{\\mathrm{d}t} = -km', bad: ['\\frac{\\mathrm{d}m}{\\mathrm{d}t} = km', '\\frac{\\mathrm{d}m}{\\mathrm{d}t} = -\\frac{k}{m}', '\\frac{\\mathrm{d}m}{\\mathrm{d}t} = -k'] },
  { text: 'The price $p$ of an item falls at a rate proportional to the square of the price.', ok: '\\frac{\\mathrm{d}p}{\\mathrm{d}t} = -kp^{2}', bad: ['\\frac{\\mathrm{d}p}{\\mathrm{d}t} = kp^{2}', '\\frac{\\mathrm{d}p}{\\mathrm{d}t} = -k\\sqrt{p}', '\\frac{\\mathrm{d}p}{\\mathrm{d}t} = -2kp'] },
];

const PROPS = [
  { words: 'proportional to', f: (x: number) => x, tex: (v: string) => v },
  { words: 'proportional to the square of', f: (x: number) => x * x, tex: (v: string) => `${v}^{2}` },
  { words: 'proportional to the square root of', f: (x: number) => Math.sqrt(x), tex: (v: string) => `\\sqrt{${v}}` },
  { words: 'inversely proportional to', f: (x: number) => 1 / x, tex: (v: string) => `\\frac{1}{${v}}` },
  { words: 'inversely proportional to the square of', f: (x: number) => 1 / (x * x), tex: (v: string) => `\\frac{1}{${v}^{2}}` },
];
const QUANTS = [
  { name: 'the volume of water in a tank', v: 'V', unit: 'litres', t: 'minute' },
  { name: 'the radius of a circular oil slick', v: 'r', unit: 'm', t: 'hour' },
  { name: 'the mass of a dissolving tablet', v: 'm', unit: 'mg', t: 'second' },
  { name: 'the number of fish in a lake', v: 'N', unit: 'fish', t: 'year' },
  { name: 'the height of a growing plant', v: 'h', unit: 'cm', t: 'day' },
];

const construct = defineTemplate({
  id: 'p2.11.construct-differential-equation',
  family: 'p2.11.construct-de',
  title: 'Constructing a differential equation and using it',
  spec: ['P7.6'],
  chapter: 'P2.11',
  sections: ['11.11'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Write down', 'Find'],
  tags: ['differential equations', 'modelling', 'proportion'],
  generate(r) {
    const P = r.pick(PROPS);
    const Qn = r.pick(QUANTS);
    const inc = r.bool();
    const q1 = r.pick([4, 9, 16, 25, 36, 49]);
    const q2 = r.pick([4, 9, 16, 25, 36, 49, 64, 81, 100].filter((x) => x !== q1));
    const r1 = r.pick([0.5, 1, 1.5, 2, 3, 4, 5, 6]);
    const k = r1 / P.f(q1);
    const r2 = k * P.f(q2);
    const v = Qn.v;
    const okTex = `\\frac{\\mathrm{d}${v}}{\\mathrm{d}t} = ${inc ? '' : '-'}k${P.tex(v)}`;
    const others = PROPS.filter((x) => x !== P).slice(0, 2).map((x) => `\\frac{\\mathrm{d}${v}}{\\mathrm{d}t} = ${inc ? '' : '-'}k${x.tex(v)}`);
    const opts = r.shuffle([okTex, `\\frac{\\mathrm{d}${v}}{\\mathrm{d}t} = ${inc ? '-' : ''}k${P.tex(v)}`, ...others]).map((o) => `$${o}$`);
    const C = ans.choice(opts, opts.indexOf(`$${okTex}$`));
    const R2 = ans.num(r2, { sf: 3 });
    return {
      stem: md`${Qn.name.charAt(0).toUpperCase() + Qn.name.slice(1)}, $${v}$ ${Qn.unit}, ${inc ? 'increases' : 'decreases'} at a rate ${P.words} $${v}$. Time $t$ is measured in ${Qn.t}s and $k$ is a positive constant.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: 'Which differential equation models this?', answer: C, scheme: [M1('Derivative with correct proportionality'), A1('Correct sign')], hints: ['"Rate" means a derivative with respect to time.', '"Proportional to X" gives kX; "inversely proportional to X" gives k/X.', inc ? 'Increasing: positive rate.' : 'Decreasing: negative rate.'], solution: [md`$${okTex}$`] }),
        part({
          label: 'b',
          marks: 3,
          prompt: md`When $${v} = ${q1}$, $${v}$ is ${inc ? 'increasing' : 'decreasing'} at $${r1}$ ${Qn.unit} per ${Qn.t}. Find the rate at which $${v}$ is ${inc ? 'increasing' : 'decreasing'} when $${v} = ${q2}$.`,
          answer: R2,
          scheme: [M1(md`$${r1} = k${P.tex(String(q1))}$`), A1(md`$k = ${fmtSF(k, 4)}$`), A1(md`Rate $= ${answerTex(R2)}$`)],
          hints: ['Use the first piece of information to find k.', md`$${r1} = k \\times ${fmtSF(P.f(q1), 4)}$`, md`Then the rate is $k \\times ${fmtSF(P.f(q2), 4)}$.`],
          errors: [err('direct-instead', ans.num((r1 / q1) * q2, { sf: 3 }), 'Check the type of proportionality in the description.', 1)],
          solution: [md`$k = \\frac{${r1}}{${fmtSF(P.f(q1), 5)}} = ${fmtSF(k, 5)}$`, md`Rate when $${v} = ${q2}$: $${fmtSF(k, 5)} \\times ${fmtSF(P.f(q2), 5)} = ${answerTex(R2)}$`],
        }),
      ],
      params: { q1, q2, r1, which: PROPS.indexOf(P) },
    };
  },
  verify(inst) {
    const { q1, q2, r1, which } = inst.params as Record<string, number>;
    const f = PROPS[which].f;
    expectClose((inst.parts[1].answer as NumericSpec).value / r1, f(q2) / f(q1), 'ratio of rates');
  },
});

const constructK = defineTemplate({
  id: 'p2.11.construct-de-find-k',
  family: 'p2.11.construct-de',
  title: 'Form a differential equation and find the constant',
  spec: ['P7.6', 'P8.8'],
  chapter: 'P2.11',
  sections: ['11.11'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 4,
  time: 5,
  commands: ['Write down', 'Find'],
  tags: ['differential equations', 'modelling', 'rates of change'],
  generate(r) {
    const variant = r.pick(['cool', 'leak', 'grow'] as const);
    if (variant === 'cool') {
      const R = r.pick([15, 20, 25]),
        th = r.pick([60, 70, 80, 90]),
        rate = r.pick([1.5, 2, 2.5, 3, 4]);
      const k = rate / (th - R);
      const K = ans.exact(ex(Q.from(k).toLatex()), ['exact'], { allowDecimal: true });
      return {
        stem: md`A liquid cools at a rate proportional to the difference between its temperature $\theta$ °C and the room temperature of $${R}$ °C. So $\dfrac{\mathrm{d}\theta}{\mathrm{d}t} = -k(\theta - ${R})$, where $t$ is in minutes.`,
        parts: [part({ marks: 4, prompt: md`When $\theta = ${th}$, the liquid is cooling at $${rate}$ °C per minute. Find the exact value of $k$.`, answer: K, scheme: [B1(md`$\frac{\mathrm{d}\theta}{\mathrm{d}t} = -${rate}$`), M1(md`$-${rate} = -k(${th} - ${R})$`), A1('Correct equation'), A1(md`$k = ${answerTex(K)}$`)], hints: ['Cooling means θ is decreasing, so dθ/dt is negative.', md`$\frac{\mathrm{d}\theta}{\mathrm{d}t} = -${rate}$ when $\theta = ${th}$.`, md`$-${rate} = -k(${th - R})$`], solution: [md`$-${rate} = -k(${th} - ${R}) \Rightarrow k = \frac{${rate}}{${th - R}} = ${answerTex(K)}$`] })],
        params: { variant, R, th, rate },
      };
    }
    if (variant === 'leak') {
      const h = r.pick([4, 9, 16, 25, 36]),
        rate = r.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.8]);
      const k = rate / Math.sqrt(h);
      const K = ans.exact(ex(Q.from(k).toLatex()), ['exact'], { allowDecimal: true });
      return {
        stem: md`Water leaks from a tank. The depth $h$ m decreases at a rate proportional to $\sqrt{h}$: $\dfrac{\mathrm{d}h}{\mathrm{d}t} = -k\sqrt{h}$, with $t$ in hours.`,
        parts: [part({ marks: 4, prompt: md`When the depth is $${h}$ m, it is falling at $${rate}$ m per hour. Find the exact value of $k$.`, answer: K, scheme: [B1(md`$\frac{\mathrm{d}h}{\mathrm{d}t} = -${rate}$`), M1(md`$-${rate} = -k\sqrt{${h}}$`), A1('Correct equation'), A1(md`$k = ${answerTex(K)}$`)], hints: ['Falling means dh/dt is negative.', md`Substitute $h = ${h}$.`, md`$\sqrt{${h}} = ${Math.sqrt(h)}$`], solution: [md`$-${rate} = -k \times ${Math.sqrt(h)} \Rightarrow k = ${answerTex(K)}$`] })],
        params: { variant, h, rate },
      };
    }
    const r0 = r.pick([2, 3, 4, 5, 8]),
      rate = r.pick([0.5, 1, 1.5, 2, 3]);
    const k = rate * r0;
    const K = ans.exact(ex(Q.from(k).toLatex()), ['exact'], { allowDecimal: true });
    return {
      stem: md`The radius $r$ cm of a circular patch of oil increases at a rate inversely proportional to $r$: $\dfrac{\mathrm{d}r}{\mathrm{d}t} = \dfrac{k}{r}$, with $t$ in seconds.`,
      parts: [part({ marks: 4, prompt: md`When $r = ${r0}$, the radius is increasing at $${rate}$ cm per second. Find the value of $k$.`, answer: K, scheme: [B1(md`$\frac{\mathrm{d}r}{\mathrm{d}t} = ${rate}$`), M1(md`$${rate} = \frac{k}{${r0}}$`), A1('Correct equation'), A1(md`$k = ${answerTex(K)}$`)], hints: ['Increasing: dr/dt is positive.', md`Substitute $r = ${r0}$.`, md`$${rate} = \frac{k}{${r0}}$`], solution: [md`$${rate} = \frac{k}{${r0}} \Rightarrow k = ${answerTex(K)}$`] })],
      params: { variant, r0, rate },
    };
  },
  verify(inst) {
    const p = inst.params as Record<string, number | string>;
    const k = evaluate((inst.parts[0].answer as ExactSpec).value);
    if (p.variant === 'cool') expectClose(-k * ((p.th as number) - (p.R as number)), -(p.rate as number), 'rate');
    else if (p.variant === 'leak') expectClose(-k * Math.sqrt(p.h as number), -(p.rate as number), 'rate');
    else expectClose(k / (p.r0 as number), p.rate as number, 'rate');
  },
});

const limitSum = defineTemplate({
  id: 'p2.11.limit-of-sum',
  family: 'p2.11.limit-of-sum',
  title: 'Integration as the limit of a sum',
  spec: ['P8.4', 'P8.3'],
  chapter: 'P2.11',
  sections: ['11.8'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 4,
  time: 5,
  commands: ['Find', 'Write down'],
  tags: ['integration', 'limit of a sum', 'definite integral'],
  generate(r) {
    const f = Poly.coeffs([r.int(-4, 6), r.int(-3, 5), r.pick([1, 2, 3])]);
    r.require(!f.coef(1).isZero || !f.coef(0).isZero);
    const a = r.int(0, 2),
      b = a + r.int(1, 4);
    const fTex = f.toLatex();
    const val = f.definite(a, b);
    r.require(!val.isZero);
    const V = ans.exact(num(val), ['exact']);
    const opts = r.shuffle([md`$\displaystyle\int_{${a}}^{${b}} \left(${fTex}\right)\mathrm{d}x$`, md`$\displaystyle\int_{0}^{${b - a}} \left(${fTex}\right)\mathrm{d}x$`, md`$\displaystyle\sum_{x=${a}}^{${b}} \left(${fTex}\right)$`, md`$\displaystyle\int_{${a}}^{${b}} \left(${f.diff().toLatex()}\right)\mathrm{d}x$`]);
    const C = ans.choice(opts, opts.findIndex((o) => o.startsWith(`$\\displaystyle\\int_{${a}}^{${b}} \\left(${fTex}`)));
    return {
      stem: md`Consider $\displaystyle\lim_{\delta x \to 0} \sum_{x = ${a}}^{${b}} \left(${fTex}\right)\delta x$.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: 'Which integral is this limit equal to?', answer: C, scheme: [B1('Correct integral with the same limits')], hints: [md`$\lim_{\delta x \to 0} \sum_{x=a}^{b} \mathrm{f}(x)\,\delta x = \int_a^b \mathrm{f}(x)\,\mathrm{d}x$.`, 'The limits of the sum become the limits of the integral.', 'The function being summed is the integrand.'], solution: [md`$\displaystyle\int_{${a}}^{${b}} \left(${fTex}\right)\mathrm{d}x$`] }),
        part({ label: 'b', marks: 3, prompt: 'Find the exact value of the limit.', answer: V, scheme: [M1('Integrates'), dM1('Substitutes limits'), A1(md`$${answerTex(V)}$`)], hints: ['Evaluate the definite integral.', md`$\int \left(${fTex}\right)\mathrm{d}x = ${f.integ().toLatex()}$`, md`Use $x = ${b}$ and $x = ${a}$.`], solution: [md`$\left[${f.integ().toLatex()}\right]_{${a}}^{${b}} = ${answerTex(V)}$`] }),
      ],
      params: { c: [f.coef(0).value, f.coef(1).value, f.coef(2).value], a, b },
    };
  },
  verify(inst) {
    const { c, a, b } = inst.params as { c: number[]; a: number; b: number };
    // genuine Riemann sum with tiny δx approaches the answer
    const n = 200000,
      d = (b - a) / n;
    let s = 0;
    for (let i = 0; i < n; i++) {
      const x = a + (i + 0.5) * d;
      s += (c[0] + c[1] * x + c[2] * x * x) * d;
    }
    expectClose(s, evaluate((inst.parts[1].answer as ExactSpec).value), 'Riemann sum', 1e-8);
  },
});

const rectangles = defineTemplate({
  id: 'p2.11.rectangle-estimate',
  family: 'p2.11.limit-of-sum',
  title: 'Rectangles under a curve compared with the integral',
  spec: ['P8.4', 'P9.4'],
  chapter: 'P2.11',
  sections: ['11.8'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 7,
  commands: ['Find', 'Explain'],
  tags: ['limit of a sum', 'rectangles', 'estimation'],
  generate(r) {
    const k = r.pick([1, 2, 3]);
    const a = r.int(0, 2),
      n = r.pick([4, 5, 8, 10]),
      w = r.pick([0.25, 0.5, 1]);
    const b = a + n * w;
    const side = r.pick(['left', 'right'] as const);
    const f = (x: number) => k * x * x + 1;
    let s = 0;
    for (let i = 0; i < n; i++) s += f(a + (side === 'left' ? i : i + 1) * w) * w;
    const exact = Poly.coeffs([1, 0, k]).definite(a, b);
    const S = ans.num(s, { sf: 3 });
    const over = side === 'right';
    const C = ans.choice([md`An overestimate: the curve is increasing, so the ${side} heights are the largest in each strip.`, md`An underestimate: the curve is increasing, so the ${side} heights are the smallest in each strip.`], over ? 0 : 1);
    return {
      stem: md`The region under $y = ${k === 1 ? '' : k}x^{2} + 1$ between $x = ${a}$ and $x = ${fmtNum(b)}$ is split into $${n}$ strips of width $${w}$. Rectangles are drawn using the height of the curve at the ${side}-hand edge of each strip.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: 'Find the total area of the rectangles.', answer: S, scheme: [M1(md`Heights at $x = ${Array.from({ length: n }, (_, i) => fmtNum(a + (side === 'left' ? i : i + 1) * w)).join(', ')}$`), M1(md`Sum $\times ${w}$`), A1(md`$${answerTex(S)}$`)], hints: [md`The ${side}-hand edges are at $x = ${Array.from({ length: n }, (_, i) => fmtNum(a + (side === 'left' ? i : i + 1) * w)).join(', ')}$.`, 'Area of each rectangle = width × height.', 'Add them up.'], solution: [md`Area $= ${w}\left[${Array.from({ length: n }, (_, i) => fmtNum(f(a + (side === 'left' ? i : i + 1) * w))).join(' + ')}\right] = ${answerTex(S)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`The exact area is $${exact.toLatex()}$. Is the rectangle total an overestimate or underestimate? Explain.`, answer: C, scheme: [B1(over ? 'Overestimate' : 'Underestimate'), B1('Reason referring to increasing function and choice of heights')], hints: ['Is the curve increasing or decreasing on this interval?', `Where in each strip is the ${side} height?`, 'Compare with the exact value.'], solution: [md`The function is increasing for $x \geqslant 0$; using ${side}-hand heights gives ${over ? 'the maximum' : 'the minimum'} height in each strip, so this is an ${over ? 'over' : 'under'}estimate (${fmtSF(s, 4)} vs $${exact.toLatex()}$).`] }),
      ],
      params: { k, a, n, w, side },
    };
  },
  verify(inst) {
    const { k, a, n, w } = inst.params as Record<string, number>;
    const s = (inst.parts[0].answer as NumericSpec).value;
    const exact = integrate((x) => k * x * x + 1, a, a + n * w);
    expect(Math.abs(s - exact) > 1e-9, 'not equal');
    expect(inst.params.side === 'right' ? s > exact : s < exact, 'over/under');
  },
});

void dM1;

const templates: Template[] = [exponentialDE, separableXY, cooling, population, construct, constructK, limitSum, rectangles];
export default templates;
