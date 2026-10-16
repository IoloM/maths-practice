/** Pure Year 1, Chapter 4 — graphs and transformations; proportion and reciprocal models. */
import { Q } from '../../../engine/core/rational';
import { Poly } from '../../../engine/core/poly';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { plot, yRangeOf } from '../../../engine/core/svg';
import { answerTex } from '../../../engine/marking/mark';
import type { CoordSpec, ExactSpec, ExprSpec, ListSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';

const fac = (r0: number) => (r0 === 0 ? 'x' : `(x ${r0 < 0 ? '+' : '-'} ${Math.abs(r0)})`);
const exV = (s: ExactSpec) => evaluate(s.value);

const cubicIntercepts = defineTemplate({
  id: 'p1.4.cubic-intercepts',
  family: 'p1.4.curve-sketching',
  title: 'Where a factorised cubic meets the axes',
  spec: ['P2.7'],
  chapter: 'P1.4',
  sections: ['4.1'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 4,
  time: 4,
  commands: ['Find', 'Sketch'],
  tags: ['curve sketching', 'cubic', 'intercepts'],
  generate(r) {
    const k = r.pick([1, -1, 2, -2]);
    const repeated = r.bool(0.4);
    const a = r.int(-4, 4);
    const b = repeated ? a : r.intExcept(-4, 5, [a]);
    const c = r.intExcept(-4, 5, [a, b]);
    const poly = Poly.fromRoots([a, b, c], k);
    const roots = [...new Set([a, b, c])].sort((u, v) => u - v);
    const L: ListSpec = ans.list(roots.map((x) => ans.exact(num(x))), { v: 'x' });
    const Y: ExactSpec = ans.exact(num(poly.evalQ(0)), [], { label: 'y =' });
    const fTex = `${k === 1 ? '' : k === -1 ? '-' : k}${repeated ? `${fac(a)}^{2}` : `${fac(a)}${fac(b)}`}${fac(c)}`;
    const f = (x: number) => poly.eval(x);
    const svg = plot({ x: [Math.min(...roots) - 1.5, Math.max(...roots) + 1.5], y: yRangeOf([f], Math.min(...roots) - 1.2, Math.max(...roots) + 1.2, 0.1), curves: [{ f, label: 'C' }] });
    return {
      stem: md`The curve $C$ has equation $y = ${fTex}$.`,
      diagram: { svg, alt: 'Sketch of the cubic curve C.' },
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the $x$-coordinates of the points where $C$ meets the $x$-axis.`, answer: L, scheme: [M1('Sets each factor to zero'), A1(md`$${answerTex(L)}$`)], hints: ['The curve meets the x-axis where y = 0.', 'Set each bracket equal to zero.', repeated ? 'A squared factor gives a repeated root: the curve touches the axis there.' : 'There are three different roots.'], errors: [err('signs', ans.list(roots.map((x) => ans.exact(num(-x))), { v: 'x' }), 'If (x − a) = 0 then x = a — check your signs.')], solution: [md`$y = 0$ when $${answerTex(L)}$${repeated ? md` (the curve touches the $x$-axis at $x = ${a}$)` : ''}`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the $y$-coordinate of the point where $C$ meets the $y$-axis.`, answer: Y, scheme: [M1(md`Substitutes $x = 0$`), A1(md`$y = ${poly.evalQ(0).toLatex()}$`)], hints: ['On the y-axis, x = 0.', 'Substitute x = 0 into the equation.', 'Multiply the constants in each bracket.'], solution: [md`$x = 0$: $${answerTex(Y)}$`] }),
      ],
      params: { a, b, c, k },
    };
  },
  verify(inst) {
    const { a, b, c, k } = inst.params as Record<string, number>;
    for (const it of (inst.parts[0].answer as ListSpec).items) {
      const x = exV(it as ExactSpec);
      expectClose(k * (x - a) * (x - b) * (x - c), 0, 'root', 1e-12);
    }
    expectClose(exV(inst.parts[1].answer as ExactSpec), -k * a * b * c, 'y-intercept');
  },
});

const asymptotes = defineTemplate({
  id: 'p1.4.reciprocal-asymptotes',
  family: 'p1.4.reciprocal',
  title: 'Asymptotes and intercepts of y = a/(x + b) + c',
  spec: ['P2.7', 'P2.9'],
  chapter: 'P1.4',
  sections: ['4.3', '4.5'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Write down', 'Find'],
  tags: ['reciprocal graphs', 'asymptotes', 'translations'],
  generate(r) {
    const a = r.intNZ(-6, 6),
      b = r.intNZ(-5, 5),
      c = r.intNZ(-5, 5);
    const xInt = Q.of(-a, c).sub(b);
    r.require(!xInt.isZero && !xInt.eq(-b));
    const V = ans.exact(num(-b), [], { label: 'x =' }),
      H = ans.exact(num(c), [], { label: 'y =' });
    const X = ans.exact(num(xInt), [], { label: 'x =' });
    const fTex = `\\frac{${a}}{x ${b < 0 ? '-' : '+'} ${Math.abs(b)}} ${c < 0 ? '-' : '+'} ${Math.abs(c)}`;
    const f = (x: number) => a / (x + b) + c;
    const svg = plot({ x: [-b - 6, -b + 6], y: [c - 8, c + 8], curves: [{ f, from: -b - 6, to: -b - 0.05 }, { f, from: -b + 0.05, to: -b + 6, label: 'C' }], vlines: [{ x: -b, dash: true }], hlines: [{ y: c, dash: true }] });
    return {
      stem: md`The curve $C$ has equation $y = ${fTex}$, $x \neq ${-b}$.`,
      diagram: { svg, alt: 'Graph of a reciprocal curve with a vertical and a horizontal asymptote shown dashed.' },
      parts: [
        part({ label: 'a', marks: 1, prompt: 'Write down the equation of the vertical asymptote.', answer: V, scheme: [B1(md`$x = ${-b}$`)], hints: ['Where is the denominator zero?', md`$x ${b < 0 ? '-' : '+'} ${Math.abs(b)} = 0$`, 'That x-value is never reached.'], solution: [md`$${answerTex(V)}$`] }),
        part({ label: 'b', marks: 1, prompt: 'Write down the equation of the horizontal asymptote.', answer: H, scheme: [B1(md`$y = ${c}$`)], hints: ['What happens to the fraction as x becomes very large?', 'The fraction tends to 0.', 'So y tends to the constant term.'], solution: [md`$${answerTex(H)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the $x$-coordinate of the point where $C$ crosses the $x$-axis.`, answer: X, scheme: [M1('Sets y = 0 and solves'), A1(md`$x = ${xInt.toLatex()}$`)], hints: ['Set y = 0.', md`$\frac{${a}}{x ${b < 0 ? '-' : '+'} ${Math.abs(b)}} = ${-c}$`, 'Multiply both sides by the denominator.'], solution: [md`$\frac{${a}}{x ${b < 0 ? '-' : '+'} ${Math.abs(b)}} = ${-c} \Rightarrow x ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${Q.of(-a, c).toLatex()} \Rightarrow ${answerTex(X)}$`] }),
      ],
      params: { a, b, c },
    };
  },
  verify(inst) {
    const { a, b, c } = inst.params as Record<string, number>;
    const x = exV(inst.parts[2].answer as ExactSpec);
    expectClose(a / (x + b) + c, 0, 'x-intercept', 1e-12);
    expect(Math.abs(a / (1e6 + b) + c - exV(inst.parts[1].answer as ExactSpec)) < 1e-4, 'horizontal asymptote');
  },
});

const proportion = defineTemplate({
  id: 'p1.4.proportion',
  family: 'p1.4.proportion',
  title: 'Direct and inverse proportion',
  spec: ['P2.7'],
  chapter: 'P1.4',
  sections: ['4.3'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 3,
  time: 4,
  commands: ['Find'],
  tags: ['proportion', 'graphs'],
  generate(r) {
    const kind = r.pick([
      { words: 'directly proportional to $x^{2}$', f: (x: number) => x * x, tex: 'x^{2}' },
      { words: 'inversely proportional to $x$', f: (x: number) => 1 / x, tex: '\\frac{1}{x}' },
      { words: 'directly proportional to $\\sqrt{x}$', f: (x: number) => Math.sqrt(x), tex: '\\sqrt{x}' },
      { words: 'inversely proportional to $x^{2}$', f: (x: number) => 1 / (x * x), tex: '\\frac{1}{x^{2}}' },
      { words: 'directly proportional to $x^{3}$', f: (x: number) => x ** 3, tex: 'x^{3}' },
    ]);
    const x1 = r.pick([1, 2, 4, 9]),
      k = r.pick([2, 3, 5, 6, 12, 18, 24, 36]);
    const y1 = k * kind.f(x1);
    const x2 = r.pick([1, 3, 4, 9, 16].filter((v) => v !== x1));
    const y2 = k * kind.f(x2);
    const Y = ans.num(y2, { sf: 3 });
    return {
      stem: md`$y$ is ${kind.words}. When $x = ${x1}$, $y = ${fmtNum(Math.round(y1 * 1e6) / 1e6)}$.`,
      parts: [part({ marks: 3, prompt: md`Find $y$ when $x = ${x2}$.`, answer: Y, scheme: [M1(md`$y = k${kind.tex}$`), A1(md`$k = ${k}$`), A1(md`$y = ${answerTex(Y)}$`)], hints: ['Write the relationship with a constant k.', md`$y = k${kind.tex}$`, 'Use the given pair of values to find k.'], solution: [md`$y = k${kind.tex}$; $k = ${k}$`, md`When $x = ${x2}$: $y = ${answerTex(Y)}$`] })],
      params: { k, x2, which: kind.tex },
    };
  },
  verify(inst) {
    const y = (inst.parts[0].answer as NumericSpec).value;
    expect(Number.isFinite(y) && y > 0, 'positive value');
  },
});

const reciprocalModel = defineTemplate({
  id: 'p1.4.reciprocal-model',
  family: 'p1.4.modelling',
  title: 'Inverse proportion as a model (pressure and volume)',
  spec: ['P2.11', 'P2.7'],
  chapter: 'P1.4',
  sections: ['4.3'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Find', 'Comment'],
  tags: ['modelling', 'inverse proportion', 'reciprocal'],
  generate(r) {
    const ctx = r.pick([
      { y: 'pressure, $P$ kPa,', x: 'volume, $V$ litres,', ys: 'P', xs: 'V', lim: 'At very small volumes the gas would no longer behave as the model predicts (P would become unrealistically large).' },
      { y: 'time, $T$ hours, to finish a job', x: 'number of workers, $n$,', ys: 'T', xs: 'n', lim: 'With many workers, they would get in each other’s way, so T would not keep decreasing as predicted.' },
      { y: 'brightness, $B$ units,', x: 'distance, $d$ metres, from a lamp', ys: 'B', xs: 'd', lim: 'Close to the lamp the brightness cannot become infinite.' },
    ]);
    const x1 = r.pick([2, 4, 5, 8, 10]),
      y1 = r.pick([30, 40, 45, 60, 75, 90, 120]);
    const k = x1 * y1;
    const x2 = r.pick([3, 6, 12, 15, 20, 25].filter((v) => v !== x1));
    const K = ans.exact(num(k), [], { label: 'k =' }),
      Y2 = ans.num(k / x2, { sf: 3 });
    const opts = r.shuffle([ctx.lim, 'The model is only valid for whole-number values.', 'The model predicts the quantity becomes negative.']);
    return {
      stem: md`The ${ctx.y} is inversely proportional to the ${ctx.x} so that $${ctx.ys} = \dfrac{k}{${ctx.xs}}$. When $${ctx.xs} = ${x1}$, $${ctx.ys} = ${y1}$.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find the value of $k$.`, answer: K, scheme: [B1(md`$k = ${k}$`)], hints: ['Substitute the given pair of values.', md`$${y1} = \frac{k}{${x1}}$`, 'Multiply both sides.'], solution: [md`$${x1} \times ${y1} = ${k}$, so $${answerTex(K)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find $${ctx.ys}$ when $${ctx.xs} = ${x2}$.`, answer: Y2, scheme: [M1('Substitutes into their model'), A1(md`$${answerTex(Y2)}$`)], hints: ['Use your k.', md`$${ctx.ys} = \frac{${k}}{${x2}}$`, 'Give 3 s.f. if not exact.'], solution: [md`$${ctx.ys} = \frac{${k}}{${x2}} = ${answerTex(Y2)}$`] }),
        part({ label: 'c', marks: 1, prompt: 'Give one limitation of this model.', answer: ans.choice(opts, opts.indexOf(ctx.lim)), scheme: [B1('Sensible limitation in context')], hints: ['What does the model predict for very small or very large values?', 'Is that realistic?', 'Think about the real situation.'], solution: [ctx.lim] }),
      ],
      params: { k, x2 },
    };
  },
  verify(inst) {
    const { k, x2 } = inst.params as Record<string, number>;
    expectClose((inst.parts[1].answer as NumericSpec).value * x2, k, 'inverse proportion');
  },
});

const transformPoint = defineTemplate({
  id: 'p1.4.transform-a-point',
  family: 'p1.4.transformations',
  title: 'Image of a point under graph transformations',
  spec: ['P2.9'],
  chapter: 'P1.4',
  sections: ['4.5', '4.6', '4.7'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Write down'],
  tags: ['transformations', 'translations', 'stretches'],
  generate(r) {
    const px = r.intNZ(-6, 6),
      py = r.intNZ(-6, 6);
    const pick = () =>
      r.pick([
        { tex: 'y = \\mathrm{f}(x) + c', go: (x: number, y: number, c: number) => [x, y + c] as const, c: r.intNZ(-5, 5) },
        { tex: 'y = \\mathrm{f}(x + c)', go: (x: number, y: number, c: number) => [x - c, y] as const, c: r.intNZ(-5, 5) },
        { tex: 'y = c\\mathrm{f}(x)', go: (x: number, y: number, c: number) => [x, c * y] as const, c: r.pick([2, 3, -1, -2, 4]) },
        { tex: 'y = \\mathrm{f}(cx)', go: (x: number, y: number, c: number) => [x / c, y] as const, c: r.pick([2, 3, -1, 4]) },
      ]);
    const t1 = pick(),
      t2 = pick();
    r.require(t1.tex !== t2.tex);
    const sub = (t: typeof t1) => t.tex.replace('c\\mathrm', `${t.c === -1 ? '-' : t.c}\\mathrm`).replace('cx', `${t.c === -1 ? '-' : t.c}x`).replace('+ c', `${t.c < 0 ? '-' : '+'} ${Math.abs(t.c)}`);
    const [ax, ay] = t1.go(px, py, t1.c);
    const [bx, by] = t2.go(px, py, t2.c);
    const A: CoordSpec = ans.coord(ans.exact(num(Q.from(ax))), ans.exact(num(Q.from(ay))));
    const B: CoordSpec = ans.coord(ans.exact(num(Q.from(bx))), ans.exact(num(Q.from(by))));
    return {
      stem: md`The point $P(${px}, ${py})$ lies on the curve $y = \mathrm{f}(x)$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Write down the coordinates of the image of $P$ on the curve $${sub(t1)}$.`, answer: A, scheme: [B1('One coordinate correct'), B1(md`$${answerTex(A)}$`)], hints: ['Changes outside f affect y; changes inside f affect x (in the opposite way you might expect).', 'f(x + c) moves the graph c to the left; f(cx) divides x-coordinates by c.', 'cf(x) multiplies y-coordinates by c; f(x) + c moves up by c.'], solution: [md`$${answerTex(A)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Write down the coordinates of the image of $P$ on the curve $${sub(t2)}$.`, answer: B, scheme: [B1('One coordinate correct'), B1(md`$${answerTex(B)}$`)], hints: ['Is the change inside or outside the bracket?', 'Inside: x changes (opposite direction / reciprocal factor).', 'Outside: y changes as you would expect.'], solution: [md`$${answerTex(B)}$`] }),
      ],
      params: { px, py, t1: [t1.tex, t1.c], t2: [t2.tex, t2.c] },
    };
  },
  verify(inst) {
    const { px, py, t1, t2 } = inst.params as { px: number; py: number; t1: [string, number]; t2: [string, number] };
    // check by constructing f with f(px) = py: f(x) = py + (x − px) (any function through P works for the point)
    for (const [i, [tex, c]] of [t1, t2].entries()) {
      const C = inst.parts[i].answer as CoordSpec;
      const X = exV(C.x as ExactSpec),
        Y = exV(C.y as ExactSpec);
      const f = (x: number) => py + 3 * (x - px);
      const g = tex.includes('f}(x) + c') ? (x: number) => f(x) + c : tex.includes('f}(x + c)') ? (x: number) => f(x + c) : tex.startsWith('y = c') ? (x: number) => c * f(x) : (x: number) => f(c * x);
      expectClose(g(X), Y, `image ${i}`, 1e-9);
    }
  },
});

const translateEquation = defineTemplate({
  id: 'p1.4.translate-equation',
  family: 'p1.4.transformations',
  title: 'Equation of a translated or stretched quadratic/cubic',
  spec: ['P2.9', 'P2.6'],
  chapter: 'P1.4',
  sections: ['4.5', '4.7'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 3,
  time: 4,
  commands: ['Find'],
  tags: ['transformations', 'expanding'],
  generate(r) {
    const f = Poly.coeffs([r.int(-6, 6), r.intNZ(-5, 5), 1]);
    const h = r.intNZ(-4, 4),
      v = r.int(-5, 5);
    // y = f(x − h) + v
    const g = Poly.coeffs([-h, 1]);
    const shifted = Poly.coeffs([f.coef(0)]).add(g.scale(f.coef(1))).add(g.mul(g).scale(f.coef(2))).add(Poly.coeffs([v]));
    const E: ExprSpec = ans.expr(shifted.toExpr(), ['x'], { forms: ['expanded'], label: 'y =' });
    return {
      stem: md`The curve $C$ has equation $y = ${f.toLatex()}$. It is translated by the vector $\begin{pmatrix} ${h} \\ ${v} \end{pmatrix}$ to give the curve $C'$.`,
      parts: [part({ marks: 3, prompt: md`Find an equation of $C'$, giving your answer in the form $y = ax^{2} + bx + c$.`, answer: E, scheme: [M1(md`Replaces $x$ by $(x ${-h < 0 ? '-' : '+'} ${Math.abs(h)})$`), M1(md`Adds $${v}$`), A1(md`$${answerTex(E)}$`)], hints: [md`A translation by $\begin{pmatrix} a \\ b \end{pmatrix}$ gives $y = \mathrm{f}(x - a) + b$.`, md`Replace every $x$ with $(x ${-h < 0 ? '-' : '+'} ${Math.abs(h)})$, then add $${v}$.`, 'Expand and simplify.'], errors: [err('wrong-direction', ans.expr(Poly.coeffs([f.coef(0)]).add(Poly.coeffs([h, 1]).scale(f.coef(1))).add(Poly.coeffs([h, 1]).mul(Poly.coeffs([h, 1])).scale(f.coef(2))).add(Poly.coeffs([v])).toExpr(), ['x']), md`A move of $${h}$ in the $x$-direction means replacing $x$ by $x - ${h}$, not $x + ${h}$.`, 1)], solution: [md`$y = \mathrm{f}(x - ${h}) + ${v}$`, md`$${answerTex(E)}$`] })],
      params: { f: [f.coef(0).value, f.coef(1).value], h, v },
    };
  },
  verify(inst) {
    const { f, h, v } = inst.params as { f: number[]; h: number; v: number };
    const e = (inst.parts[0].answer as ExprSpec).value;
    const F = (x: number) => f[0] + f[1] * x + x * x;
    for (const x of [-2, 0.5, 3]) expectClose(evaluate(e, { x: x + h }), F(x) + v, 'translated point');
  },
});

const stretchRoots = defineTemplate({
  id: 'p1.4.stretch-roots',
  family: 'p1.4.transformations',
  title: 'Roots and intercepts after a stretch or reflection',
  spec: ['P2.9'],
  chapter: 'P1.4',
  sections: ['4.6'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 3,
  time: 4,
  commands: ['Write down', 'Find'],
  tags: ['transformations', 'stretches', 'roots'],
  generate(r) {
    const roots = r.distinct(3, -5, 6).sort((a, b) => a - b);
    const k = r.pick([2, 3, -1, 0.5]);
    const which = r.pick(['inside', 'outside'] as const);
    const newRoots = which === 'inside' ? roots.map((x) => Q.from(x).div(Q.from(k))) : roots.map((x) => Q.from(x));
    const sorted = [...newRoots].sort((a, b) => a.value - b.value);
    const L = ans.list(sorted.map((x) => ans.exact(num(x))), { v: 'x' });
    const kTex = k === 0.5 ? '\\frac{1}{2}' : k === -1 ? '-' : String(k);
    const tTex = which === 'inside' ? `y = \\mathrm{f}(${kTex}x)` : `y = ${kTex}\\mathrm{f}(x)`;
    return {
      stem: md`The curve $y = \mathrm{f}(x)$ crosses the $x$-axis only at $x = ${roots.join(', ')}$.`,
      parts: [part({ marks: 3, prompt: md`Write down the $x$-coordinates of the points where the curve $${tTex}$ crosses the $x$-axis.`, answer: L, scheme: [M1(which === 'inside' ? md`Divides each root by $${kTex === '-' ? '-1' : kTex}$` : 'Recognises the roots are unchanged'), A1('Two correct'), A1(md`$${answerTex(L)}$`)], hints: [which === 'inside' ? md`$\mathrm{f}(kx)$ is a stretch parallel to the $x$-axis with scale factor $\frac{1}{k}$.` : md`$k\mathrm{f}(x)$ is a stretch parallel to the $y$-axis — points on the $x$-axis do not move.`, 'Where does the new graph meet y = 0?', which === 'inside' ? md`Solve $kx = ${roots[0]}$, etc.` : 'y = 0 when f(x) = 0.'], errors: which === 'inside' ? [err('multiplied', ans.list(roots.map((x) => ans.exact(num(Q.from(x).mul(Q.from(k))))), { v: 'x' }), md`For $\mathrm{f}(kx)$, divide the x-coordinates by $k$ — do not multiply.`)] : [], solution: [md`$${answerTex(L)}$`] })],
      params: { roots, k, which },
    };
  },
  verify(inst) {
    const { roots, k, which } = inst.params as { roots: number[]; k: number; which: string };
    const f = (x: number) => roots.reduce((p, rt) => p * (x - rt), 1);
    const g = which === 'inside' ? (x: number) => f(k * x) : (x: number) => k * f(x);
    for (const it of (inst.parts[0].answer as ListSpec).items) expectClose(g(exV(it as ExactSpec)), 0, 'root', 1e-9);
  },
});

void fmtSF;
void sumTex;
void ex;

const templates: Template[] = [cubicIntercepts, asymptotes, proportion, reciprocalModel, transformPoint, translateEquation, stretchRoots];
export default templates;
