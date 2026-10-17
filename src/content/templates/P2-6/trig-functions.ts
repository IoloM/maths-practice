/** Pure Year 2, Chapter 6 — sec, cosec and cot; identities; inverse trigonometric functions. */
import { Q } from '../../../engine/core/rational';
import { evaluate, neg, num, sym } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { CoordSpec, ExactSpec, ExprSpec, IntervalSpec, ListSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, err, iv, md, part, sgn } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';
import { baseSolutionsDeg, piMultiple, piTex, SPECIAL } from '../shared/trig';

const INF = sym('infty');
const exq = (q: Q | number) => num(Q.from(q));
const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
const R = Math.PI / 180;

type Six = 'sin' | 'cos' | 'tan' | 'sec' | 'cosec' | 'cot';
const fnTex = (f: Six) => (f === 'cosec' ? '\\operatorname{cosec}' : `\\${f}`);
const BASE: Record<number, Record<Six, string>> = {
  30: { sin: '\\frac{1}{2}', cos: '\\frac{\\sqrt{3}}{2}', tan: '\\frac{\\sqrt{3}}{3}', sec: '\\frac{2\\sqrt{3}}{3}', cosec: '2', cot: '\\sqrt{3}' },
  45: { sin: '\\frac{\\sqrt{2}}{2}', cos: '\\frac{\\sqrt{2}}{2}', tan: '1', sec: '\\sqrt{2}', cosec: '\\sqrt{2}', cot: '1' },
  60: { sin: '\\frac{\\sqrt{3}}{2}', cos: '\\frac{1}{2}', tan: '\\sqrt{3}', sec: '2', cosec: '\\frac{2\\sqrt{3}}{3}', cot: '\\frac{\\sqrt{3}}{3}' },
};
const val6 = (f: Six, deg: number) => {
  const s = Math.sin(deg * R),
    c = Math.cos(deg * R);
  return { sin: s, cos: c, tan: s / c, sec: 1 / c, cosec: 1 / s, cot: c / s }[f];
};
/** Exact LaTeX for f(deg), deg a non-quadrantal multiple of 30° or 45°. */
function exact6(f: Six, deg: number): string {
  const d = ((deg % 360) + 360) % 360;
  const ref = d <= 90 ? d : d <= 180 ? 180 - d : d <= 270 ? d - 180 : 360 - d;
  const t = BASE[ref][f];
  return val6(f, deg) < 0 ? `-${t}` : t;
}
const ANGLES = [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330];
const degList = (xs: number[], v = 'x') => ans.list(xs.map((x) => (Math.abs(x - Math.round(x)) < 1e-9 ? ans.exact(exq(Math.round(x))) : ans.num(x, { dp: 1 }))), { v, angle: 'deg' });

// ---------------------------------------------------------------- 6.1 exact values of sec, cosec, cot
const exactRecip = defineTemplate({
  id: 'p2.6.exact-sec-cosec-cot',
  family: 'p2.6.reciprocal-functions',
  title: 'Exact values of sec, cosec and cot',
  spec: ['P5.4', 'P5.3'],
  chapter: 'P2.6',
  sections: ['6.1'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 2,
  marks: 3,
  time: 4,
  commands: ['Find', 'Write down'],
  tags: ['sec', 'cosec', 'cot', 'exact values', 'non-calculator'],
  generate(r) {
    const rad = r.bool(0.4);
    const fs: Six[] = ['sec', 'cosec', 'cot'];
    const degs = fs.map(() => r.pick(ANGLES));
    const angTex = (d: number) => (rad ? piTex(piMultiple(d)) : `${d}^{\\circ}`);
    const parts = fs.map((f, i) => {
      const d = degs[i];
      const A = ans.exact(ex(exact6(f, d)), ['exact']);
      const via = f === 'sec' ? 'cos' : f === 'cosec' ? 'sin' : 'tan';
      return part({
        label: 'abc'[i],
        marks: 1,
        prompt: md`$${fnTex(f)}\left(${angTex(d)}\right)$`,
        answer: A,
        scheme: [B1(md`$${exact6(f, d)}$`)],
        hints: [md`$${fnTex(f)} \theta = \dfrac{1}{${'\\' + via} \theta}$`, md`Find $${'\\' + via}\left(${angTex(d)}\right) = ${exact6(via as Six, d)}$ using the CAST diagram.`, 'Take the reciprocal and rationalise if needed.'],
        solution: [md`$${'\\' + via}\left(${angTex(d)}\right) = ${exact6(via as Six, d)}$, so the value is $${answerTex(A)}$`],
      });
    });
    return { stem: 'Without using a calculator, find the exact value of', parts, params: { degs } };
  },
  verify(inst) {
    const { degs } = inst.params as { degs: number[] };
    const fs: Six[] = ['sec', 'cosec', 'cot'];
    fs.forEach((f, i) => expectClose(valOf(inst.parts[i].answer as ExactSpec), val6(f, degs[i]), f));
  },
});

// ---------------------------------------------------------------- 6.4 identities: sec² = 1 + tan², cosec² = 1 + cot²
const recipEquation = defineTemplate({
  id: 'p2.6.solve-with-sec-cosec-identities',
  family: 'p2.6.reciprocal-functions',
  title: 'Solve equations using sec²x = 1 + tan²x or cosec²x = 1 + cot²x',
  spec: ['P5.4', 'P5.5', 'P5.7'],
  chapter: 'P2.6',
  sections: ['6.3', '6.4'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 6,
  time: 8,
  commands: ['Show that', 'Solve'],
  tags: ['sec', 'cosec', 'cot', 'identities', 'trigonometric equations', 'quadratic'],
  generate(r) {
    const type = r.pick(['sec-tan', 'cosec-cot', 'sec-only'] as const);
    const pool = [Q.of(1), Q.of(-1), Q.of(2), Q.of(-2), Q.of(3), Q.of(-3), Q.of(1, 2), Q.of(-1, 2), Q.of(1, 3), Q.of(3, 2), Q.of(-3, 2)];
    const t1 = r.pick(pool),
      t2 = r.pick(pool);
    r.require(!t1.eq(t2));
    const a = r.int(1, 3) * t1.d * t2.d;
    // a(t − t1)(t − t2) = a t² − a(t1 + t2) t + a t1 t2
    const B = t1.add(t2).mul(-a),
      C = t1.mul(t2).mul(a);
    r.require(B.d === 1 && C.d === 1);
    const lo = 0,
      hi = 360;
    let eqTex: string, sols: number[], via: string, varName: string;
    if (type === 'sec-tan') {
      // a sec²x + B tan x + (C − a) = 0
      eqTex = `${a === 1 ? '' : a}\\sec^{2} x${B.isZero ? '' : sgn(B, '\\tan x')}${C.sub(a).isZero ? '' : sgn(C.sub(a))} = 0`;
      varName = '\\tan x';
      sols = [...baseSolutionsDeg('tan', t1.value, lo, hi), ...baseSolutionsDeg('tan', t2.value, lo, hi)];
      via = md`$\sec^{2} x = 1 + \tan^{2} x$`;
    } else if (type === 'cosec-cot') {
      eqTex = `${a === 1 ? '' : a}\\operatorname{cosec}^{2} x${B.isZero ? '' : sgn(B, '\\cot x')}${C.sub(a).isZero ? '' : sgn(C.sub(a))} = 0`;
      varName = '\\cot x';
      sols = [...baseSolutionsDeg('tan', 1 / t1.value, lo, hi), ...baseSolutionsDeg('tan', 1 / t2.value, lo, hi)];
      via = md`$\operatorname{cosec}^{2} x = 1 + \cot^{2} x$`;
    } else {
      // a sec²x + B sec x + C = 0 directly (sec = t)
      eqTex = `${a === 1 ? '' : a}\\sec^{2} x${B.isZero ? '' : sgn(B, '\\sec x')}${C.isZero ? '' : sgn(C)} = 0`;
      varName = '\\sec x';
      sols = [t1, t2].flatMap((t) => (Math.abs(t.value) >= 1 ? baseSolutionsDeg('cos', 1 / t.value, lo, hi) : []));
      via = md`$\sec x = \dfrac{1}{\cos x}$, and $|\sec x| \geqslant 1$`;
    }
    sols = [...new Set(sols.map((x) => Math.round(x * 1e9) / 1e9))].sort((x, y) => x - y);
    r.require(sols.length >= 1 && sols.length <= 6);
    const quadTex = sumTex([[a, 't^{2}'], [B, 't'], [C, '']]);
    const QE = ans.eq(ex(quadTex), num(0), ['t']);
    const L = degList(sols);
    return {
      stem: md`In this question, let $t = ${varName}$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Show that the equation $${eqTex}$ can be written as a quadratic equation in $t$, and give that quadratic equation.`, answer: QE, scheme: [M1(type === 'sec-only' ? md`Writes the equation with $t = \sec x$` : md`Uses ${via}`), A1(md`$${quadTex} = 0$`)], hints: [type === 'sec-only' ? 'This is already a quadratic in sec x.' : md`Use ${via}.`, md`Replace $${varName}$ with $t$.`, 'Collect terms so the right-hand side is 0.'], solution: [md`Using ${via}: $${quadTex} = 0$`] }),
        part({ label: 'b', marks: 4, prompt: md`Hence solve $${eqTex}$ for $0 \leqslant x < 360^{\circ}$, giving your answers to 1 decimal place where appropriate.`, answer: L, scheme: [M1('Solves the quadratic'), A1(md`$t = ${t1.toLatex()}$ or $t = ${t2.toLatex()}$`), M1(type === 'sec-only' ? md`Uses $\cos x = \dfrac{1}{t}$, rejecting $|\cos x| > 1$` : md`Uses ${type === 'sec-tan' ? md`$\tan x = t$` : md`$\tan x = \dfrac{1}{t}$`} and finds solutions in range`), A1(md`$${answerTex(L)}$`)], hints: [md`Solve $${quadTex} = 0$.`, type === 'sec-only' ? 'sec x = t means cos x = 1/t; a value of cos outside [−1, 1] gives no solutions.' : type === 'cosec-cot' ? 'cot x = t means tan x = 1/t.' : 'tan x = t: the solutions repeat every 180°.', 'Give every solution in 0 ≤ x < 360°.'], errors: [err('only-principal', degList(sols.filter((x) => x < 180)), 'tan and cos repeat — look for the other solutions in the interval.', 2)], solution: [md`$t = ${t1.toLatex()}$ or $t = ${t2.toLatex()}$`, md`$x = ${answerTex(L)}$`] }),
      ],
      params: { type, a, B: B.value, C: C.value },
    };
  },
  verify(inst) {
    const { type, a, B, C } = inst.params as { type: string; a: number; B: number; C: number };
    const xs = (inst.parts[1].answer as ListSpec).items.map(valOf);
    const lhs = (x: number) => {
      const s = Math.sin(x * R),
        c = Math.cos(x * R);
      if (type === 'sec-tan') return a / (c * c) + (B * s) / c + (C - a);
      if (type === 'cosec-cot') return a / (s * s) + (B * c) / s + (C - a);
      return a / (c * c) + B / c + C;
    };
    for (const x of xs) expect(Math.abs(lhs(x)) < 1e-6, `x = ${x} satisfies the equation`);
    // independent completeness check on a fine grid: sign changes plus touching zeros (local minima of |lhs| at 0)
    const found: number[] = [];
    const h = 0.01;
    for (let x = 0; x < 360; x += h) {
      const y0 = lhs(x),
        y1 = lhs(x + h),
        ym = lhs(x - h);
      if (!Number.isFinite(y0) || !Number.isFinite(y1)) continue;
      let hit: number | null = null;
      if (y0 * y1 < 0 && Math.abs(y0 - y1) < 50) hit = x;
      else if (Math.abs(y0) < 1e-6 && (!Number.isFinite(ym) || Math.abs(y0) <= Math.abs(ym)) && Math.abs(y0) <= Math.abs(y1)) hit = x;
      if (hit !== null && hit < 360 - 0.05 && !found.some((f) => Math.abs(f - hit!) < 0.05)) found.push(hit);
    }
    const roots = found.length;
    expect(roots === xs.length, `grid found ${roots} roots for ${xs.length} answers`);
  },
});

// ---------------------------------------------------------------- 6.5 inverse trigonometric functions
const inverseTrig = defineTemplate({
  id: 'p2.6.inverse-trig-exact-values',
  family: 'p2.6.inverse-trig',
  title: 'Exact values of arcsin, arccos and arctan, and a composite',
  spec: ['P5.4'],
  chapter: 'P2.6',
  sections: ['6.5'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find', 'Show that'],
  tags: ['arcsin', 'arccos', 'arctan', 'inverse functions', 'exact values'],
  generate(r) {
    const SC = SPECIAL.filter((s) => Math.abs(s.v) <= 1 && [0.5, Math.SQRT1_2, Math.sqrt(3) / 2, 1].some((v) => Math.abs(Math.abs(s.v) - v) < 1e-12));
    const TN = SPECIAL.filter((s) => [1, Math.sqrt(3), 1 / Math.sqrt(3)].some((v) => Math.abs(Math.abs(s.v) - v) < 1e-12));
    const k1 = r.pick(SC),
      k2 = r.pick(SC),
      k3 = r.pick(TN);
    const ang = (v: number) => piTex(piMultiple((v * 180) / Math.PI));
    const A1s = ans.exact(ex(ang(Math.asin(k1.v))), ['exact']),
      A2s = ans.exact(ex(ang(Math.acos(k2.v))), ['exact']),
      A3s = ans.exact(ex(ang(Math.atan(k3.v))), ['exact']);
    const comp = r.pick(['sin-arccos', 'cos-arcsin', 'tan-arcsin'] as const);
    const compTex = comp === 'sin-arccos' ? '\\sin(\\arccos x)' : comp === 'cos-arcsin' ? '\\cos(\\arcsin x)' : '\\tan(\\arcsin x)';
    const ansTex = comp === 'tan-arcsin' ? '\\frac{x}{\\sqrt{1 - x^{2}}}' : '\\sqrt{1 - x^{2}}';
    const E: ExprSpec = ans.expr(ex(ansTex), ['x'], { domain: { x: [-0.9, 0.9] } });
    return {
      stem: 'Give exact answers in radians.',
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find $\arcsin\left(${k1.tex}\right)$.`, answer: A1s, scheme: [B1(md`$${answerTex(A1s)}$`)], hints: [md`$\arcsin$ gives an angle in $\left[-\frac{\pi}{2}, \frac{\pi}{2}\right]$.`, md`Which angle has sine $${k1.tex}$?`, 'Use your exact values.'], solution: [md`$\arcsin\left(${k1.tex}\right) = ${answerTex(A1s)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Find $\arccos\left(${k2.tex}\right)$.`, answer: A2s, scheme: [B1(md`$${answerTex(A2s)}$`)], hints: [md`$\arccos$ gives an angle in $[0, \pi]$.`, md`Which angle in that range has cosine $${k2.tex}$?`, 'A negative cosine means a second-quadrant angle.'], errors: k2.v < 0 ? [err('negative-angle', ans.exact(ex(`-${ang(Math.acos(-k2.v))}`)), 'arccos always gives an angle between 0 and π.')] : [], solution: [md`$\arccos\left(${k2.tex}\right) = ${answerTex(A2s)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`Find $\arctan\left(${k3.tex}\right)$.`, answer: A3s, scheme: [B1(md`$${answerTex(A3s)}$`)], hints: [md`$\arctan$ gives an angle in $\left(-\frac{\pi}{2}, \frac{\pi}{2}\right)$.`, md`Which angle has tangent $${k3.tex}$?`, 'Negative values give negative angles.'], solution: [md`$\arctan\left(${k3.tex}\right) = ${answerTex(A3s)}$`] }),
        part({ label: 'd', marks: 2, prompt: md`Show that, for $-1 < x < 1$, $${compTex}$ can be written in terms of $x$ without trigonometric functions, and give the expression.`, answer: E, scheme: [M1(md`Lets $\theta = ${comp === 'sin-arccos' ? '\\arccos' : '\\arcsin'} x$, so $${comp === 'sin-arccos' ? '\\cos' : '\\sin'}\theta = x$, and uses a right-angled triangle or $\sin^{2}\theta + \cos^{2}\theta = 1$`), A1(md`$${ansTex}$ with the sign justified`)], hints: [md`Let $\theta = ${comp === 'sin-arccos' ? '\\arccos' : '\\arcsin'} x$. Then $${comp === 'sin-arccos' ? '\\cos' : '\\sin'}\theta = x$.`, md`Use $\sin^{2}\theta + \cos^{2}\theta = 1$ to find the other ratio.`, comp === 'sin-arccos' ? 'θ is between 0 and π, so sin θ ≥ 0.' : 'θ is between −π/2 and π/2, so cos θ ≥ 0.'], solution: [md`With $\theta = ${comp === 'sin-arccos' ? '\\arccos' : '\\arcsin'} x$: the other ratio is $\sqrt{1 - x^{2}}$ (non-negative in the principal range).`, md`$${compTex} = ${answerTex(E)}$`] }),
      ],
      params: { k1: k1.v, k2: k2.v, k3: k3.v, comp },
    };
  },
  verify(inst) {
    const { k1, k2, k3, comp } = inst.params as { k1: number; k2: number; k3: number; comp: string };
    expectClose(valOf(inst.parts[0].answer as ExactSpec) + 5, Math.asin(k1) + 5, 'arcsin');
    expectClose(valOf(inst.parts[1].answer as ExactSpec) + 5, Math.acos(k2) + 5, 'arccos');
    expectClose(valOf(inst.parts[2].answer as ExactSpec) + 5, Math.atan(k3) + 5, 'arctan');
    const f = (x: number) => (comp === 'sin-arccos' ? Math.sin(Math.acos(x)) : comp === 'cos-arcsin' ? Math.cos(Math.asin(x)) : Math.tan(Math.asin(x)));
    for (const x of [-0.7, 0.3, 0.8]) expectClose(evaluate((inst.parts[3].answer as ExprSpec).value, { x }), f(x), 'composite');
  },
});

// ---------------------------------------------------------------- 6.2 graphs of sec, cosec, cot
const recipGraph = defineTemplate({
  id: 'p2.6.transformed-sec-cosec-graph',
  family: 'p2.6.reciprocal-graphs',
  title: 'Range and turning points of y = a + b sec x or y = a + b cosec x',
  spec: ['P5.4', 'P2.9'],
  chapter: 'P2.6',
  sections: ['6.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Write down', 'Find', 'State'],
  tags: ['sec', 'cosec', 'graphs', 'range', 'transformations'],
  generate(r) {
    const f = r.pick(['sec', 'cosec'] as const);
    const a = r.int(-5, 5),
      b = r.pick([1, 2, 3, 4, 5]);
    const yTex = `${a === 0 ? '' : a}${a === 0 ? '' : ' + '}${b === 1 ? '' : b}${f === 'sec' ? '\\sec x' : '\\operatorname{cosec} x'}`;
    const Rg: IntervalSpec = ans.interval([iv(neg(INF), exq(a - b), false, true), iv(exq(a + b), INF, true, false)], 'y');
    // local minimum of a + b sec x in 0 < x < 360: sec x = 1 at x = 0/360 (endpoints), so use the local max at 180 (sec = −1); cosec: min at 90, max at 270
    const xMax = f === 'sec' ? 180 : 270;
    const MaxPt = ans.coord(ans.exact(exq(xMax)), ans.exact(exq(a - b)));
    const asy = f === 'sec' ? [90, 270] : [180];
    const As = ans.list(asy.map((x) => ans.exact(exq(x))), { v: 'x', angle: 'deg' });
    return {
      stem: md`The curve $C$ has equation $y = ${yTex}$, $0 < x < 360^{\circ}$.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Write down the equation${asy.length > 1 ? 's' : ''} of the vertical asymptote${asy.length > 1 ? 's' : ''} of $C$ in this interval, as values of $x$.`, answer: As, scheme: [B1(md`$${answerTex(As)}$`)], hints: [md`$${f === 'sec' ? '\\sec x = \\frac{1}{\\cos x}' : '\\operatorname{cosec} x = \\frac{1}{\\sin x}'}$ is not defined where ${f === 'sec' ? 'cos' : 'sin'} x = 0.`, `Find where ${f === 'sec' ? 'cos' : 'sin'} x = 0 in 0 < x < 360°.`, 'Transformations up/down and stretches parallel to the y-axis do not move vertical asymptotes.'], solution: [md`$${f === 'sec' ? '\\cos' : '\\sin'} x = 0$ at $${answerTex(As)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the coordinates of the local maximum point of $C$.`, answer: MaxPt, scheme: [M1(md`$${f === 'sec' ? '\\sec' : '\\operatorname{cosec}'} x = -1$ at $x = ${xMax}^{\circ}$`), A1(md`$(${xMax}, ${a - b})$`)], hints: [`The local maximum of ${f} x is −1, on the branch below the axis.`, `That happens where ${f === 'sec' ? 'cos x = −1' : 'sin x = −1'}.`, md`Then $y = ${a} + ${b}(-1)$.`], solution: [md`At $x = ${xMax}^{\circ}$, $${f === 'sec' ? '\\sec' : '\\operatorname{cosec}'} x = -1$, so $y = ${a - b}$: $${answerTex(MaxPt)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`State the range of values of $y$.`, answer: Rg, scheme: [M1('Uses |sec x| ≥ 1 (or |cosec x| ≥ 1)'), A1(md`$${answerTex(Rg)}$`)], hints: [md`$${f === 'sec' ? '\\sec' : '\\operatorname{cosec}'} x \leqslant -1$ or $${f === 'sec' ? '\\sec' : '\\operatorname{cosec}'} x \geqslant 1$.`, `Multiply by ${b}, then add ${a}.`, 'There are two separate intervals.'], errors: [err('between', ans.interval([iv(exq(a - b), exq(a + b), true, true)], 'y'), md`$${f} x$ never takes values between −1 and 1, so y never lies between $${a - b}$ and $${a + b}$.`)], solution: [md`$${answerTex(Rg)}$`] }),
      ],
      params: { f, a, b },
    };
  },
  verify(inst) {
    const { f, a, b } = inst.params as { f: string; a: number; b: number };
    const y = (x: number) => a + b / (f === 'sec' ? Math.cos(x * R) : Math.sin(x * R));
    const M = inst.parts[1].answer as CoordSpec;
    const xm = valOf(M.x);
    expectClose(y(xm), valOf(M.y), 'max value');
    expect(y(xm - 1) < y(xm) && y(xm + 1) < y(xm), 'local maximum');
    for (const x of (inst.parts[0].answer as ListSpec).items.map(valOf)) expect(Math.abs(y(x + 1e-7)) > 1e5, 'asymptote');
  },
});

const templates: Template[] = [exactRecip, recipEquation, inverseTrig, recipGraph];
export default templates;
