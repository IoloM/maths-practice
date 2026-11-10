/** Pure Year 1, Chapter 10 — long exam-style question: show a trig equation is a quadratic, solve it, then a transformed version. */
import { expectClose } from '../../../engine/core/numeric';
import { fmtNum } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { ListSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, A1cso, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { sumTex } from '../shared/calculus';
import { solveTrigDeg } from '../shared/trig';

const rad = (d: number) => (d * Math.PI) / 180;
const DEG1 = (xs: number[], v: string) => ans.list(xs.map((x) => ans.num(x, { dp: 1 })), { v, angle: 'deg' });
const vals = (L: ListSpec) => L.items.map((i) => (i as NumericSpec).value);

/** Every listed x satisfies g(x) ≈ 0, and there is no other zero on a fine grid ([lo, hi) is one period, so a zero just below hi is the one at lo). */
function checkSolutions(g: (x: number) => number, xs: number[], lo: number, hi: number) {
  for (const x of xs) expectClose(g(x), 0, `solution ${x}`, 1e-6);
  for (let x = lo; x < hi; x += 0.02) {
    if (Math.abs(g(x)) < 1e-4 && !xs.some((s) => Math.abs(s - x) < 0.6 || Math.abs(s - (x - (hi - lo))) < 0.6)) throw new Error(`missed solution near ${x}`);
  }
}

/** Root pairs (c1 usable, c2 maybe outside [−1, 1]) for A f² + B f + C = 0 with integer coefficients. */
const ROOTS: [number, number, number][] = [
  [1, 2, -1],
  [1, 2, 2],
  [-1, 2, 3],
  [1, 3, -2],
  [1, 4, 2],
  [3, 4, -2],
  [-1, 4, 2],
  [1, 2, -2],
  [-1, 2, -3],
  [1, 3, 2],
  [1, 4, -3],
  [3, 4, 3],
  [-3, 4, 2],
  [2, 3, -2],
  [-2, 3, 2],
  [2, 5, 2],
];

const longTrig = defineTemplate({
  id: 'p1.10.long-quadratic-trig-equation-then-transformed',
  family: 'p1.10.harder-equations',
  title: 'Exam-style: show a trig equation is a quadratic, solve it, then solve a transformed version',
  spec: ['P5.5', 'P5.7'],
  chapter: 'P1.10',
  sections: ['10.5', '10.6'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 9,
  time: 11,
  commands: ['Show that', 'Hence', 'Solve'],
  tags: ['exam-style', 'trigonometric equations', 'identities', 'quadratics'],
  generate(r) {
    const useSin = r.bool();
    const f = useSin ? 'sin' : 'cos';
    const g = useSin ? 'cos' : 'sin';
    const sf = `\\${f}`,
      sg = `\\${g}`;
    const [p, q, c2] = r.pick(ROOTS);
    const c1 = p / q;
    const mult = r.pick([1, 1, -1]);
    // q·(f − c1)(f − c2)·mult = (q f − p)(f − c2)·mult
    const A = q * mult,
      B = -(p + q * c2) * mult,
      C = p * c2 * mult;
    const eq = (arg: string) => `${sumTex([[A, `${sg}^{2} ${arg}`], [-B, `${sf} ${arg}`], [-(A + C), '']])} = 0`;
    const quad = (arg: string) => `${sumTex([[A, `${sf}^{2} ${arg}`], [B, `${sf} ${arg}`], [C, '']])} = 0`;
    const valid = [c1, c2].filter((v) => Math.abs(v) <= 1);
    const thetas = [...new Set(valid.flatMap((v) => solveTrigDeg(f, v, 1, 0)))].sort((a, b) => a - b);
    r.require(thetas.length >= 2);
    // (c): θ = bx + c over a range of x that maps onto 0 ⩽ θ < 360 (or a shifted window)
    const kind = r.pick(['double', 'triple', 'shift'] as const);
    const b = kind === 'double' ? 2 : kind === 'triple' ? 3 : 1;
    const alpha = kind === 'shift' ? r.pick([20, 30, 40, 45, 60]) * r.sign() : 0;
    const hi = kind === 'double' ? 180 : kind === 'triple' ? 120 : 360;
    const arg = kind === 'shift' ? `(x ${alpha < 0 ? '-' : '+'} ${Math.abs(alpha)}^{\\circ})` : `${b}x`;
    const xs = [...new Set(valid.flatMap((v) => solveTrigDeg(f, v, b, alpha, 0, hi)))].sort((a, z) => a - z);
    r.require(xs.length >= 2);
    const LB = DEG1(thetas, '\\theta');
    const LC = DEG1(xs, 'x');
    const fv = `${sf}\\theta`;
    const reject = valid.length < 2 ? md` (reject $${fv} = ${fmtNum(c2)}$: no solutions)` : '';
    const cTex = (v: number) => (Number.isInteger(v) ? String(v) : `${v < 0 ? '-' : ''}\\frac{${Math.abs(v === c1 ? p : v * q)}}{${q}}`);
    const rootsTex = valid.map((v) => `${fv} = ${cTex(v)}`).join(', \\; ');
    const wrongC = DEG1(thetas.filter((t) => t < hi), 'x');
    return {
      stem: md`In this question you must show all stages of your working. Solutions relying entirely on calculator technology are not acceptable.`,
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Show that the equation $${eq('\\theta')}$ can be written as $${quad('\\theta')}$.`,
          answer: ans.self(md`Using $${sg}^{2}\theta = 1 - ${sf}^{2}\theta$: $${A}(1 - ${sf}^{2}\theta) ${B < 0 ? '+' : '-'} ${Math.abs(B) === 1 ? '' : Math.abs(B)}${sf}\theta ${A + C < 0 ? '+' : '-'} ${Math.abs(A + C)} = 0$, which rearranges to $${quad('\\theta')}$.`),
          scheme: [M1(md`Uses $${sg}^{2}\theta = 1 - ${sf}^{2}\theta$`), A1cso(md`Rearranges to $${quad('\\theta')}$`)],
          hints: [md`Use $\sin^{2}\theta + \cos^{2}\theta = 1$ to remove $${sg}^{2}\theta$.`, md`Replace $${sg}^{2}\theta$ with $1 - ${sf}^{2}\theta$.`, 'Expand and collect the terms on one side.'],
          solution: [md`$${A}(1 - ${sf}^{2}\theta) ${B < 0 ? '+' : '-'} ${Math.abs(B) === 1 ? '' : Math.abs(B)}${sf}\theta ${A + C < 0 ? '+' : '-'} ${Math.abs(A + C)} = 0 \Rightarrow ${quad('\\theta')}$`],
        }),
        part({
          label: 'b',
          marks: 4,
          prompt: md`Hence solve, for $0^{\circ} \leqslant \theta < 360^{\circ}$, the equation $${eq('\\theta')}$, giving your answers to one decimal place.`,
          answer: LB,
          scheme: [M1('Solves the quadratic (factorises or uses the formula)'), A1(md`$${rootsTex}$${reject}`), dM1('Uses symmetry to find angles in range'), A1(md`$${answerTex(LB)}$`)],
          hints: [md`Let $c = ${sf}\theta$ and solve $${sumTex([[A, 'c^{2}'], [B, 'c'], [C, '']])} = 0$.`, md`$${rootsTex}$${reject}`, md`Find every $\theta$ in $[0^{\circ}, 360^{\circ})$ for each valid value.`],
          errors: [err('principal-only', DEG1(valid.map((v) => (f === 'sin' ? Math.asin(v) : Math.acos(v)) * (180 / Math.PI)).filter((t) => t >= 0), '\\theta'), 'You have only the calculator values: use the graph to find the other angles in range.', 2)],
          solution: [md`$${quad('\\theta')}$ gives $${rootsTex}$${reject}`, md`$${answerTex(LB)}$`],
        }),
        part({
          label: 'c',
          marks: 3,
          prompt: md`Hence solve, for $0^{\circ} \leqslant x < ${hi}^{\circ}$, the equation $${eq(arg)}$, giving your answers to one decimal place.`,
          answer: LC,
          scheme: [M1(kind === 'shift' ? md`Sets $x ${alpha < 0 ? '-' : '+'} ${Math.abs(alpha)}^{\circ}$ equal to their values from (b), or works in the shifted range` : md`Divides their values by ${b} and includes the extra solutions from $${b}x$ going up to $360^{\circ}$`), A1('At least two correct values'), A1(md`$${answerTex(LC)}$`)],
          hints: [md`Let $\theta = ${kind === 'shift' ? `x ${alpha < 0 ? '-' : '+'} ${Math.abs(alpha)}^{\circ}` : `${b}x`}$. Find the range of $\theta$ first.`, kind === 'shift' ? md`$${alpha}^{\circ} \leqslant \theta < ${360 + alpha}^{\circ}$` : md`$0^{\circ} \leqslant \theta < 360^{\circ}$`, kind === 'shift' ? md`Then $x = \theta ${alpha < 0 ? '+' : '-'} ${Math.abs(alpha)}^{\circ}$.` : md`Then $x = \theta \div ${b}$.`],
          errors: [err('untransformed', wrongC, kind === 'shift' ? 'These are values of θ: change them back to x.' : `These are values of ${b}x: divide by ${b}.`, 1)],
          solution: [kind === 'shift' ? md`$\theta = x ${alpha < 0 ? '-' : '+'} ${Math.abs(alpha)}^{\circ}$ with $${alpha}^{\circ} \leqslant \theta < ${360 + alpha}^{\circ}$` : md`$\theta = ${b}x$ with $0^{\circ} \leqslant \theta < 360^{\circ}$, so $x = \theta \div ${b}$`, md`$${answerTex(LC)}$`],
        }),
      ],
      params: { A, B, C, f, b, alpha, hi },
    };
  },
  verify(inst) {
    const { A, B, C, f, b, alpha, hi } = inst.params as { A: number; B: number; C: number; f: string; b: number; alpha: number; hi: number };
    const F = (t: number) => (f === 'sin' ? Math.sin(rad(t)) : Math.cos(rad(t)));
    const G = (t: number) => (f === 'sin' ? Math.cos(rad(t)) : Math.sin(rad(t)));
    // the original equation (in g² and f), not the quadratic
    const orig = (t: number) => A * G(t) ** 2 - B * F(t) - (A + C);
    checkSolutions(orig, vals(inst.parts[1].answer as ListSpec), 0, 360);
    checkSolutions((x) => orig(b * x + alpha), vals(inst.parts[2].answer as ListSpec), 0, hi);
  },
});

export default [longTrig] satisfies Template[];
