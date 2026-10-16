/** Pure Year 1, Chapter 10 — exact values, identities and trigonometric equations (degrees). */
import { evaluate } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, ListSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';
import { solveTrigDeg, type TrigF } from '../shared/trig';

const rad = (d: number) => (d * Math.PI) / 180;

const EXACT: Record<number, [string, string, string]> = {
  0: ['0', '1', '0'],
  30: ['\\frac{1}{2}', '\\frac{\\sqrt{3}}{2}', '\\frac{\\sqrt{3}}{3}'],
  45: ['\\frac{\\sqrt{2}}{2}', '\\frac{\\sqrt{2}}{2}', '1'],
  60: ['\\frac{\\sqrt{3}}{2}', '\\frac{1}{2}', '\\sqrt{3}'],
  90: ['1', '0', ''],
};
function exactTrig(f: 'sin' | 'cos' | 'tan', d: number): string {
  const ref = d % 180 === 90 ? 90 : [0, 30, 45, 60].find((x) => [x, 180 - x, 180 + x, 360 - x].includes(d))!;
  const idx = f === 'sin' ? 0 : f === 'cos' ? 1 : 2;
  const v = EXACT[ref][idx];
  const sign = Math.sign(f === 'sin' ? Math.sin(rad(d)) : f === 'cos' ? Math.cos(rad(d)) : Math.tan(rad(d)));
  return sign < 0 ? `-${v}` : v;
}

const exactValues = defineTemplate({
  id: 'p1.9.exact-trig-values',
  family: 'p1.9.exact-values',
  title: 'Exact values of sin, cos and tan in all quadrants',
  spec: ['P5.3', 'P5.1'],
  chapter: 'P1.10',
  sections: ['10.1', '10.2'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 3,
  time: 4,
  commands: ['Find', 'Write down'],
  tags: ['exact values', 'trigonometry', 'quadrants'],
  generate(r) {
    const angles = [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330];
    const d1 = r.pick(angles),
      d2 = r.pick(angles);
    const f1 = r.pick(['sin', 'cos'] as const),
      f2 = r.pick(['sin', 'cos', 'tan'] as const);
    const k = r.intNZ(-3, 3);
    const tex = `\\${f1} ${d1}^{\\circ} ${k < 0 ? '-' : '+'} ${Math.abs(k) === 1 ? '' : Math.abs(k)}\\${f2} ${d2}^{\\circ}`;
    const val = `${exactTrig(f1, d1)} ${k < 0 ? '-' : '+'} ${Math.abs(k) === 1 ? '' : Math.abs(k)}\\left(${exactTrig(f2, d2)}\\right)`;
    const A = ans.exact(ex(val), ['exact']);
    return {
      parts: [part({ marks: 3, prompt: md`Find the exact value of $${tex}$.`, answer: A, scheme: [B1(md`$\${f1} ${d1}^{\circ} = ${exactTrig(f1, d1)}$`), B1(md`$\${f2} ${d2}^{\circ} = ${exactTrig(f2, d2)}$`), A1(md`$${answerTex(A)}$`)], hints: ['Find the related acute angle for each and decide the sign from the quadrant (CAST).', md`$${d1}^{\circ}$ is in quadrant $${Math.floor(d1 / 90) + 1}$; $${d2}^{\circ}$ is in quadrant $${Math.floor(d2 / 90) + 1}$.`, 'Use the exact values for 30°, 45° and 60°.'], errors: [err('decimal', ans.num(evaluate(ex(val)), { sf: 3 }), 'Give the exact value using surds.', 2)], solution: [md`$\${f1} ${d1}^{\circ} = ${exactTrig(f1, d1)}$, $\${f2} ${d2}^{\circ} = ${exactTrig(f2, d2)}$`, md`$${tex} = ${answerTex(A)}$`] })],
      params: { d1, d2, f1, f2, k },
    };
  },
  verify(inst) {
    const { d1, d2, f1, f2, k } = inst.params as { d1: number; d2: number; f1: string; f2: string; k: number };
    const F = (f: string, d: number) => (f === 'sin' ? Math.sin(rad(d)) : f === 'cos' ? Math.cos(rad(d)) : Math.tan(rad(d)));
    expectClose(evaluate((inst.parts[0].answer as ExactSpec).value), F(f1, d1) + k * F(f2, d2), 'value');
  },
});
const DEG = (xs: number[]) => ans.list(xs.map((x) => ans.num(x, { sf: 3 })), { v: 'x', angle: 'deg' });
const listVals = (L: ListSpec) => L.items.map((i) => (i as NumericSpec).value);

/** Independent check: every listed x satisfies g(x) ≈ 0 and no other zero exists on a fine grid. */
function checkSolutions(g: (x: number) => number, xs: number[], lo = 0, hi = 360) {
  for (const x of xs) expectClose(g(x), 0, `solution ${x}`, 1e-7);
  for (let x = lo; x < hi; x += 0.05) {
    if (Math.abs(g(x)) < 1e-4 && !xs.some((s) => Math.abs(s - x) < 1.2 || Math.abs(s - x - 360) < 1.2 || Math.abs(s - x + 360) < 1.2)) throw new Error(`missed solution near ${x}`);
  }
}

const tanEquation = defineTemplate({
  id: 'p1.10.tan-identity-equation',
  family: 'p1.10.equations',
  title: 'Use tan x = sin x / cos x to solve an equation',
  spec: ['P5.5', 'P5.7'],
  chapter: 'P1.10',
  sections: ['10.3', '10.4'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 3,
  time: 4,
  commands: ['Solve'],
  tags: ['trigonometric equations', 'identities', 'tan'],
  generate(r) {
    const a = r.intNZ(-6, 6),
      b = r.intNZ(-6, 6);
    const k = b / a;
    const xs = solveTrigDeg('tan', k, 1, 0);
    const L = DEG(xs);
    return {
      parts: [
        part({
          marks: 3,
          prompt: md`Solve, for $0^{\circ} \leqslant x < 360^{\circ}$, $${sumTex([[a, '\\sin x']])} = ${sumTex([[b, '\\cos x']])}$, giving your answers to 3 significant figures where appropriate.`,
          answer: L,
          scheme: [M1(md`$\tan x = ${fmtNum(Math.round(k * 1e4) / 1e4)}$`), A1(md`$x = ${fmtSF(xs[0], 3)}^{\circ}$`), A1(md`$${answerTex(L)}$`)],
          hints: ['Divide both sides by cos x.', md`$\frac{\sin x}{\cos x} = \tan x$`, md`$\tan x = \frac{${b}}{${a}}$. tan repeats every 180°.`],
          errors: [err('one-solution', DEG([xs[0]]), 'tan has period 180°: add 180° to find the second solution.', 2)],
          solution: [md`$\tan x = \frac{${b}}{${a}}$`, md`$${answerTex(L)}$`],
        }),
      ],
      params: { a, b },
    };
  },
  verify(inst) {
    const { a, b } = inst.params as Record<string, number>;
    checkSolutions((x) => a * Math.sin(rad(x)) - b * Math.cos(rad(x)), listVals(inst.parts[0].answer as ListSpec));
  },
});

const pythag = defineTemplate({
  id: 'p1.10.pythagorean-identity-exact',
  family: 'p1.10.identities',
  title: 'Use sin²θ + cos²θ = 1 to find exact values',
  spec: ['P5.5'],
  chapter: 'P1.10',
  sections: ['10.3'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 4,
  time: 5,
  commands: ['Find'],
  tags: ['identities', 'exact values', 'quadrants'],
  generate(r) {
    const [p, q] = r.pick([
      [1, 3],
      [2, 3],
      [1, 4],
      [3, 5],
      [4, 5],
      [2, 5],
      [5, 13],
      [12, 13],
      [1, 2],
      [3, 4],
      [1, 5],
      [2, 7],
      [3, 7],
      [4, 7],
      [5, 6],
      [1, 6],
      [7, 25],
      [24, 25],
      [8, 17],
      [15, 17],
    ]);
    const given = r.pick(['sin', 'cos'] as const);
    const quadrant = r.pick(given === 'sin' ? [2] : [4]) as number;
    const other = Math.sqrt(q * q - p * p);
    const isInt = Number.isInteger(other);
    const otherTex = isInt ? `\\frac{${other}}{${q}}` : `\\frac{\\sqrt{${q * q - p * p}}}{${q}}`;
    // quadrant 2: sin +, cos −, tan −; quadrant 4: sin −, cos +, tan −
    const otherVal = given === 'sin' ? `-${otherTex}` : `-${otherTex}`;
    const tanTex = given === 'sin' ? `-\\frac{${p}}{${isInt ? other : `\\sqrt{${q * q - p * p}}`}}` : `-\\frac{${isInt ? other : `\\sqrt{${q * q - p * p}}`}}{${p}}`;
    const O = ans.exact(ex(otherVal), ['exact']),
      T = ans.exact(ex(tanTex), ['exact']);
    const range = quadrant === 2 ? '90^{\\circ} < \\theta < 180^{\\circ}' : '270^{\\circ} < \\theta < 360^{\\circ}';
    const otherF = given === 'sin' ? 'cos' : 'sin';
    return {
      stem: md`Given that $\${given} \theta = \frac{${p}}{${q}}$ and $${range}$,`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`find the exact value of $\${otherF} \theta$.`, answer: O, scheme: [M1(md`$\${otherF}^{2}\theta = 1 - \frac{${p * p}}{${q * q}}$`), A1(md`$${otherVal}$ (negative in this quadrant)`)], hints: ['Use sin²θ + cos²θ = 1.', md`$\${otherF}^{2}\theta = 1 - \left(\frac{${p}}{${q}}\right)^{2} = \frac{${q * q - p * p}}{${q * q}}$`, `Decide the sign from the quadrant (CAST).`], errors: [err('positive', ans.exact(ex(otherTex)), md`In this quadrant $\${otherF}\theta$ is negative.`, 1)], solution: [md`$\${otherF}^{2}\theta = \frac{${q * q - p * p}}{${q * q}}$; in this quadrant $\${otherF}\theta < 0$, so $\${otherF}\theta = ${answerTex(O)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`find the exact value of $\tan\theta$.`, answer: T, scheme: [M1(md`$\tan\theta = \frac{\sin\theta}{\cos\theta}$`), A1(md`$${answerTex(T)}$`)], hints: ['tan θ = sin θ ÷ cos θ.', 'Use your answer to part (a).', 'tan is negative in this quadrant.'], solution: [md`$\tan\theta = \dfrac{\sin\theta}{\cos\theta} = ${answerTex(T)}$`] }),
      ],
      params: { p, q, given, quadrant },
    };
  },
  verify(inst) {
    const { p, q, given, quadrant } = inst.params as { p: number; q: number; given: string; quadrant: number };
    const base = given === 'sin' ? Math.asin(p / q) : Math.acos(p / q);
    const th = quadrant === 2 ? Math.PI - base : 2 * Math.PI - base;
    const o = evaluate((inst.parts[0].answer as ExactSpec).value),
      t = evaluate((inst.parts[1].answer as ExactSpec).value);
    expectClose(o, given === 'sin' ? Math.cos(th) : Math.sin(th), 'other ratio');
    expectClose(t, Math.tan(th), 'tan');
  },
});

const quadraticCos = defineTemplate({
  id: 'p1.10.quadratic-in-cos-or-sin',
  family: 'p1.10.harder-equations',
  title: 'Trig equation reducible to a quadratic using sin² + cos² = 1',
  spec: ['P5.5', 'P5.7'],
  chapter: 'P1.10',
  sections: ['10.5', '10.6'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 6,
  time: 8,
  commands: ['Show that', 'Hence', 'Solve'],
  tags: ['trigonometric equations', 'identities', 'quadratics'],
  generate(r) {
    // target quadratic in c = cos x: (p c − 1)(c − s) with roots c1 = 1/p, c2 = s (|s| > 1 or valid)
    const useSin = r.bool();
    const f = useSin ? 'sin' : 'cos';
    const g = useSin ? 'cos' : 'sin';
    const roots = r.pick([
      [0.5, -1],
      [0.5, 2],
      [-0.5, 3],
      [1 / 3, -2],
      [0.25, 2],
      [-0.5, 1],
      [0.75, -2],
      [-0.25, 2],
      [0.5, -2],
      [-0.5, -3],
      [1 / 3, 2],
      [0.25, -3],
      [0.75, 3],
      [-0.75, 2],
    ]);
    const mult = r.pick([1, 1, 2, -1]);
    const [c1, c2] = roots;
    // quadratic: A c² + B c + C = 0 with integer coefficients
    const den = c1 === 1 / 3 ? 3 : c1 === 0.25 || c1 === 0.75 || c1 === -0.25 ? 4 : 2;
    const A = den * mult,
      B = Math.round(-den * (c1 + c2) * mult * 1e9) / 1e9,
      C = Math.round(den * c1 * c2 * mult * 1e9) / 1e9;
    // original: A(1 − g²) form: A f² + B f + C = 0 where f² = 1 − g² → −A g² + B f + (A + C) = 0
    const eqTex = `${sumTex([[A, `\\${g}^{2} x`], [-B, `\\${f} x`], [-(A + C), '']])} = 0`;
    const xs = [...new Set([c1, c2].filter((v) => Math.abs(v) <= 1).flatMap((v) => solveTrigDeg(f, v, 1, 0)))].sort((a, b) => a - b);
    r.require(xs.length >= 2 && Number.isInteger(B) && Number.isInteger(C));
    const L = DEG(xs);
    const qTex = `${sumTex([[A, `\\${f}^{2} x`], [B, `\\${f} x`], [C, '']])} = 0`;
    return {
      stem: md`Solve, for $0^{\circ} \leqslant x < 360^{\circ}$, the equation $${eqTex}$.`,
      parts: [
        part({
          marks: 6,
          prompt: md`Give your answers to 3 significant figures where appropriate.`,
          answer: L,
          scheme: [M1(md`Uses $\${g}^{2} x = 1 - \${f}^{2} x$`), A1(md`$${qTex}$`), M1(md`Solves the quadratic in $\${f} x$`), A1(md`$\${f} x = ${fmtNum(Math.round(c1 * 1e4) / 1e4)}$${Math.abs(c2) <= 1 ? md`, $${fmtNum(c2)}$` : md` (reject $${fmtNum(c2)}$)`}`), dM1('Finds angles in the range'), A1(md`$${answerTex(L)}$`)],
          hints: [md`Replace $\${g}^{2} x$ with $1 - \${f}^{2} x$ so everything is in terms of $\${f} x$.`, md`You get the quadratic $${qTex}$.`, md`Factorise; reject any solution with $|\${f} x| > 1$.`],
          errors: [err('not-rejected', DEG(xs.slice(0, 1)), 'Some solutions are missing — find every angle in the interval for each valid value.', 3)],
          solution: [md`$${A}(1 - \${f}^{2} x) ${sumTex([[-B, `\\${f} x`]]).startsWith('-') ? '' : '+'} ${sumTex([[-B, `\\${f} x`], [-(A + C), '']])} = 0 \Rightarrow ${qTex}$`, md`$\${f} x = ${fmtNum(Math.round(c1 * 1e4) / 1e4)}$${Math.abs(c2) <= 1 ? ` or $${fmtNum(c2)}$` : ` (or $${fmtNum(c2)}$, which has no solutions)`}`, md`$${answerTex(L)}$`],
        }),
      ],
      params: { A, B, C, f, g },
    };
  },
  verify(inst) {
    const { A, B, C, f } = inst.params as { A: number; B: number; C: number; f: string };
    const F = (x: number) => (f === 'sin' ? Math.sin(rad(x)) : Math.cos(rad(x)));
    checkSolutions((x) => A * F(x) ** 2 + B * F(x) + C, listVals(inst.parts[0].answer as ListSpec));
  },
});

const shifted = defineTemplate({
  id: 'p1.10.solve-shifted-angle',
  family: 'p1.10.equations',
  title: 'Solve sin(x + α) = k or cos(x − α) = k',
  spec: ['P5.7'],
  chapter: 'P1.10',
  sections: ['10.5'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 4,
  time: 5,
  commands: ['Solve'],
  tags: ['trigonometric equations', 'transformed angle'],
  generate(r) {
    const f = r.pick(['sin', 'cos', 'tan'] as const);
    const alpha = r.pick([10, 15, 20, 25, 30, 40, 45, 50, 60, 70]) * r.sign();
    const k = f === 'tan' ? r.pick([0.5, 1, 1.5, 2, -1, -0.5, 3]) : r.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, -0.3, -0.5, -0.6, -0.8]);
    const xs = solveTrigDeg(f, k, 1, alpha);
    r.require(xs.length >= 2);
    const L = DEG(xs);
    return {
      parts: [
        part({
          marks: 4,
          prompt: md`Solve, for $0^{\circ} \leqslant x < 360^{\circ}$, $\${f}(x ${alpha < 0 ? '-' : '+'} ${Math.abs(alpha)}^{\circ}) = ${k}$, giving your answers to 3 significant figures.`,
          answer: L,
          scheme: [M1(md`Finds a principal value of $x ${alpha < 0 ? '-' : '+'} ${Math.abs(alpha)}$`), A1('One correct value of x'), M1('Uses symmetry to find a second value in range'), A1(md`$${answerTex(L)}$`)],
          hints: [md`Let $\theta = x ${alpha < 0 ? '-' : '+'} ${Math.abs(alpha)}^{\circ}$. Find the range for $\theta$ first: $${alpha}^{\circ} \leqslant \theta < ${360 + alpha}^{\circ}$.`, md`Solve $\${f}\theta = ${k}$ in that range.`, md`Then $x = \theta ${alpha < 0 ? '+' : '-'} ${Math.abs(alpha)}^{\circ}$.`],
          errors: [err('wrong-shift', DEG(solveTrigDeg(f, k, 1, -alpha)), md`$x ${alpha < 0 ? '-' : '+'} ${Math.abs(alpha)} = \theta$ means $x = \theta ${alpha < 0 ? '+' : '-'} ${Math.abs(alpha)}$ — check the direction.`, 1)],
          solution: [md`$\theta = x ${alpha < 0 ? '-' : '+'} ${Math.abs(alpha)}^{\circ}$, so $\${f}\theta = ${k}$ for $${alpha}^{\circ} \leqslant \theta < ${360 + alpha}^{\circ}$`, md`$${answerTex(L)}$`],
        }),
      ],
      params: { f, alpha, k },
    };
  },
  verify(inst) {
    const { f, alpha, k } = inst.params as { f: string; alpha: number; k: number };
    const F = (x: number) => (f === 'sin' ? Math.sin(rad(x + alpha)) : f === 'cos' ? Math.cos(rad(x + alpha)) : Math.tan(rad(x + alpha)));
    checkSolutions((x) => (f === 'tan' ? Math.sin(rad(x + alpha)) - k * Math.cos(rad(x + alpha)) : F(x) - k), listVals(inst.parts[0].answer as ListSpec));
  },
});

const multiple = defineTemplate({
  id: 'p1.10.solve-multiple-angle',
  family: 'p1.10.equations',
  title: 'Solve an equation in a multiple angle (e.g. cos 2x = k)',
  spec: ['P5.7'],
  chapter: 'P1.10',
  sections: ['10.5'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 4,
  time: 6,
  commands: ['Solve'],
  tags: ['trigonometric equations', 'multiple angles'],
  generate(r) {
    const f = r.pick(['sin', 'cos', 'tan'] as const);
    const b = r.pick([2, 3]);
    const k = f === 'tan' ? r.pick([1, -1, 0.5, 2, Math.sqrt(3)]) : r.pick([0.5, -0.5, 0.3, 0.6, -0.4, 0.8]);
    const lo = r.pick([0, -180]),
      hi = lo + (b === 3 ? 180 : 360);
    const xs = solveTrigDeg(f, k, b, 0, lo, hi);
    r.require(xs.length >= 2 && xs.length <= 8);
    const L = DEG(xs);
    const kTex = k === Math.sqrt(3) ? '\\sqrt{3}' : String(k);
    return {
      parts: [
        part({
          marks: 4,
          prompt: md`Solve, for $${lo}^{\circ} \leqslant x < ${hi}^{\circ}$, the equation $\${f} ${b}x = ${kTex}$, giving your answers to 3 significant figures where appropriate.`,
          answer: L,
          scheme: [M1(md`Solves for $${b}x$ first`), M1(md`Considers the extended range $${b * lo}^{\circ} \leqslant ${b}x < ${b * hi}^{\circ}$`), A1('Half of the solutions'), A1(md`$${answerTex(L)}$`)],
          hints: [md`Let $\theta = ${b}x$. The range becomes $${b * lo}^{\circ} \leqslant \theta < ${b * hi}^{\circ}$.`, md`Find all $\theta$ in that range with $\${f}\theta = ${kTex}$.`, md`Divide each by $${b}$.`],
          errors: [err('range-not-extended', DEG(solveTrigDeg(f, k, 1, 0, lo, hi).map((t) => t / b)), md`You need all values of $${b}x$ up to $${b * hi}^{\circ}$, not just up to $${hi}^{\circ}$.`, 2)],
          solution: [md`$\theta = ${b}x$, $${b * lo}^{\circ} \leqslant \theta < ${b * hi}^{\circ}$; solving $\${f}\theta = ${kTex}$ and dividing by $${b}$:`, md`$${answerTex(L)}$`],
        }),
      ],
      params: { f, b, k, lo, hi },
    };
  },
  verify(inst) {
    const { f, b, k, lo, hi } = inst.params as { f: string; b: number; k: number; lo: number; hi: number };
    const g = (x: number) => (f === 'sin' ? Math.sin(rad(b * x)) - k : f === 'cos' ? Math.cos(rad(b * x)) - k : Math.sin(rad(b * x)) - k * Math.cos(rad(b * x)));
    checkSolutions(g, listVals(inst.parts[0].answer as ListSpec), lo, hi);
  },
});

void B1;

const templates: Template[] = [exactValues, tanEquation, pythag, quadraticCos, shifted, multiple];
export default templates;
