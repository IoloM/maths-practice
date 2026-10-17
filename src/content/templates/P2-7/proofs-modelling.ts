/** Pure Year 2, Chapter 7 — proving identities (7.6) and trigonometry in modelling (7.7). */
import { Q, gcd } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, ExactSpec, ListSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, A1cso, B1, M1, ans, defineTemplate, dM1, md, part, sgn } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';
import { baseSolutionsDeg, solveTrigDeg, type TrigF } from '../shared/trig';
import { G } from '../shared/mech';

const exq = (q: Q | number) => num(Q.from(q));
const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
const D = Math.PI / 180;
const degList = (xs: number[], v = '\\theta') => ans.list(xs.map((x) => (Math.abs(x - Math.round(x)) < 1e-9 ? ans.exact(exq(Math.round(x))) : ans.num(x, { dp: 1 }))), { v, angle: 'deg' });
/** Roots of g on [lo, hi) from a fine grid: sign changes (ignoring asymptote jumps) and touching zeros. */
function gridRoots(g: (x: number) => number, lo: number, hi: number, h = 0.01): number[] {
  const out: number[] = [];
  for (let x = lo; x < hi - h / 2; x += h) {
    const y0 = g(x),
      y1 = g(x + h),
      ym = g(x - h);
    if (!Number.isFinite(y0) || !Number.isFinite(y1)) continue;
    let hit: number | null = null;
    if (y0 * y1 < 0 && Math.abs(y0 - y1) < 20) hit = x;
    else if (Math.abs(y0) < 1e-7 && (!Number.isFinite(ym) || Math.abs(y0) <= Math.abs(ym)) && Math.abs(y0) <= Math.abs(y1)) hit = x;
    if (hit !== null && !out.some((o) => Math.abs(o - hit!) < 0.05)) out.push(hit);
  }
  return out;
}

// ---------------------------------------------------------------- 7.6 prove a double-angle identity, hence solve
type Ident = {
  lhs: string;
  rhs: string;
  proof: string[];
  ks: number[];
  /** the equation lhs = k is equivalent to f(bθ) = val(k) */
  f: TrigF;
  b: number;
  val: (k: number) => number;
  lhsFn: (t: number) => number;
};
const IDS: Ident[] = [
  { lhs: '\\frac{\\sin 2\\theta}{1 + \\cos 2\\theta}', rhs: '\\tan\\theta', proof: [md`$\dfrac{\sin 2\theta}{1 + \cos 2\theta} = \dfrac{2\sin\theta\cos\theta}{1 + (2\cos^{2}\theta - 1)}$`, md`$= \dfrac{2\sin\theta\cos\theta}{2\cos^{2}\theta} = \dfrac{\sin\theta}{\cos\theta} = \tan\theta$`], ks: [2, 3, -2, 0.5, 4, -0.75, 1.5, 5], f: 'tan', b: 1, val: (k) => k, lhsFn: (t) => Math.sin(2 * t) / (1 + Math.cos(2 * t)) },
  { lhs: '\\frac{1 - \\cos 2\\theta}{\\sin 2\\theta}', rhs: '\\tan\\theta', proof: [md`$\dfrac{1 - \cos 2\theta}{\sin 2\theta} = \dfrac{1 - (1 - 2\sin^{2}\theta)}{2\sin\theta\cos\theta}$`, md`$= \dfrac{2\sin^{2}\theta}{2\sin\theta\cos\theta} = \dfrac{\sin\theta}{\cos\theta} = \tan\theta$`], ks: [2, 3, -3, 0.4, 2.5, -1.5, 6], f: 'tan', b: 1, val: (k) => k, lhsFn: (t) => (1 - Math.cos(2 * t)) / Math.sin(2 * t) },
  { lhs: '\\cos^{4}\\theta - \\sin^{4}\\theta', rhs: '\\cos 2\\theta', proof: [md`$\cos^{4}\theta - \sin^{4}\theta = (\cos^{2}\theta - \sin^{2}\theta)(\cos^{2}\theta + \sin^{2}\theta)$`, md`$= (\cos^{2}\theta - \sin^{2}\theta)(1) = \cos 2\theta$`], ks: [0.3, 0.6, -0.2, -0.7, 0.45, 0.8], f: 'cos', b: 2, val: (k) => k, lhsFn: (t) => Math.cos(t) ** 4 - Math.sin(t) ** 4 },
  { lhs: '(\\cos\\theta + \\sin\\theta)^{2}', rhs: '1 + \\sin 2\\theta', proof: [md`$(\cos\theta + \sin\theta)^{2} = \cos^{2}\theta + 2\sin\theta\cos\theta + \sin^{2}\theta$`, md`$= 1 + 2\sin\theta\cos\theta = 1 + \sin 2\theta$`], ks: [0.4, 1.3, 1.6, 0.7, 1.8, 0.2], f: 'sin', b: 2, val: (k) => k - 1, lhsFn: (t) => (Math.cos(t) + Math.sin(t)) ** 2 },
  { lhs: '\\tan\\theta + \\cot\\theta', rhs: '2\\operatorname{cosec} 2\\theta', proof: [md`$\tan\theta + \cot\theta = \dfrac{\sin\theta}{\cos\theta} + \dfrac{\cos\theta}{\sin\theta} = \dfrac{\sin^{2}\theta + \cos^{2}\theta}{\sin\theta\cos\theta}$`, md`$= \dfrac{1}{\frac{1}{2}\sin 2\theta} = \dfrac{2}{\sin 2\theta} = 2\operatorname{cosec} 2\theta$`], ks: [3, 4, -3, 2.5, -5, 6], f: 'sin', b: 2, val: (k) => 2 / k, lhsFn: (t) => Math.tan(t) + 1 / Math.tan(t) },
  { lhs: '\\frac{1 + \\cos 2\\theta}{\\sin 2\\theta}', rhs: '\\cot\\theta', proof: [md`$\dfrac{1 + \cos 2\theta}{\sin 2\theta} = \dfrac{1 + (2\cos^{2}\theta - 1)}{2\sin\theta\cos\theta}$`, md`$= \dfrac{2\cos^{2}\theta}{2\sin\theta\cos\theta} = \dfrac{\cos\theta}{\sin\theta} = \cot\theta$`], ks: [2, 3, -2, 0.5, -4, 1.5], f: 'tan', b: 1, val: (k) => 1 / k, lhsFn: (t) => (1 + Math.cos(2 * t)) / Math.sin(2 * t) },
  { lhs: '\\frac{2\\tan\\theta}{1 + \\tan^{2}\\theta}', rhs: '\\sin 2\\theta', proof: [md`$\dfrac{2\tan\theta}{1 + \tan^{2}\theta} = \dfrac{2\tan\theta}{\sec^{2}\theta} = 2\dfrac{\sin\theta}{\cos\theta}\cos^{2}\theta$`, md`$= 2\sin\theta\cos\theta = \sin 2\theta$`], ks: [0.3, 0.5, -0.4, 0.8, -0.6, 0.25], f: 'sin', b: 2, val: (k) => k, lhsFn: (t) => (2 * Math.tan(t)) / (1 + Math.tan(t) ** 2) },
];

const proveHence = defineTemplate({
  id: 'p2.7.prove-double-angle-identity-hence-solve',
  family: 'p2.7.proofs',
  title: 'Prove a double-angle identity, then use it to solve an equation',
  spec: ['P5.8', 'P5.7'],
  chapter: 'P2.7',
  sections: ['7.6'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 7,
  time: 9,
  commands: ['Prove', 'Hence'],
  tags: ['proof', 'identities', 'double-angle formulae', 'trigonometric equations'],
  generate(r) {
    const i = r.int(0, IDS.length - 1);
    const I = IDS[i];
    const k = r.pick(I.ks);
    const [lo, hi] = r.pick([
      [0, 360],
      [0, 180],
      [-180, 180],
    ] as [number, number][]);
    const v = I.val(k);
    r.require(Math.abs(v) < 1 || I.f === 'tan');
    const sols = solveTrigDeg(I.f, v, I.b, 0, lo, hi).filter((t) => Number.isFinite(I.lhsFn(t * D)) && Math.abs(I.lhsFn(t * D)) < 1e6);
    r.require(sols.length >= 1);
    const L = degList(sols);
    const kTex = Q.from(k).toLatex();
    const reduced = I.f === 'tan' ? md`$\tan\theta = ${Q.from(v).toLatex()}$` : md`$${I.f === 'sin' ? '\\sin' : '\\cos'} ${I.b === 1 ? '' : I.b}\theta = ${Q.from(v).toLatex()}$`;
    return {
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Prove that $${I.lhs} \equiv ${I.rhs}$.`, answer: ans.self(I.proof.join(' ')), scheme: [M1('Uses a correct double-angle (or Pythagorean) identity'), M1('Simplifies to a single expression'), A1cso('Fully correct proof, starting from one side and reaching the other', true)], hints: ['Start with the more complicated side.', I.lhs.includes('2\\theta') ? md`Replace the double angles: $\sin 2\theta = 2\sin\theta\cos\theta$ and choose the version of $\cos 2\theta$ that simplifies.` : md`Expand or factorise, then use $\sin^{2}\theta + \cos^{2}\theta = 1$.`, 'Keep going until you reach the other side exactly — do not work on both sides at once.'], solution: I.proof }),
        part({ label: 'b', marks: 4, prompt: md`Hence solve, for $${lo}^{\circ} ${lo < 0 ? '<' : '\\leqslant'} \theta < ${hi}^{\circ}$, the equation $${I.lhs} = ${kTex}$, giving your answers to 1 decimal place where appropriate.`, answer: L, scheme: [M1(md`Uses the identity: $${I.rhs} = ${kTex}$`), A1(reduced), dM1('Finds solutions in the interval (adjusting for any multiple angle)'), A1(md`$${answerTex(L)}$`)], hints: [md`By part (a), the equation becomes $${I.rhs} = ${kTex}$.`, md`Rearrange to ${reduced}.`, I.b === 2 ? 'Solve for 2θ over the doubled interval, then halve.' : 'Use the periodicity of tan: solutions are 180° apart.'], solution: [md`$${I.rhs} = ${kTex} \Rightarrow$ ${reduced}`, md`$\theta = ${answerTex(L)}$`] }),
      ],
      params: { i, k, lo, hi },
    };
  },
  verify(inst) {
    const { i, k, lo, hi } = inst.params as Record<string, number>;
    const I = IDS[i];
    const xs = (inst.parts[1].answer as ListSpec).items.map(valOf);
    for (const x of xs) expectClose(I.lhsFn(x * D) + 10, k + 10, `θ = ${x}`, 1e-9);
    const roots = gridRoots((t) => I.lhsFn(t * D) - k, lo + (lo < 0 ? 0.001 : 0), hi);
    expect(roots.length === xs.length, `grid found ${roots.length} roots, answers have ${xs.length}`);
  },
});

// ---------------------------------------------------------------- 7.6 show that an equation reduces to a quadratic, hence solve
const SPOOL = [Q.of(1, 2), Q.of(-1, 2), Q.of(1, 3), Q.of(-1, 3), Q.of(2, 3), Q.of(-2, 3), Q.of(1, 4), Q.of(3, 4), Q.of(-3, 4), Q.of(1), Q.of(-1), Q.of(2), Q.of(-2), Q.of(3, 2), Q.of(3), Q.of(4, 5), Q.of(-4, 5), Q.of(2, 5), Q.of(3, 5)];

const showQuadratic = defineTemplate({
  id: 'p2.7.show-equation-is-quadratic-hence-solve',
  family: 'p2.7.proofs',
  title: 'Show that a trigonometric equation can be written as a quadratic, then solve it',
  spec: ['P5.8', 'P5.5', 'P5.7'],
  chapter: 'P2.7',
  sections: ['7.6'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 7,
  time: 9,
  commands: ['Show that', 'Hence', 'Solve'],
  tags: ['identities', 'trigonometric equations', 'quadratic', 'proof'],
  generate(r) {
    const type = r.pick(['cos2-sin', 'sin2-cos', 'tan-cos', 'sin-tan'] as const);
    const inSin = type === 'cos2-sin' || type === 'tan-cos';
    let s1: Q, s2: Q;
    do {
      s1 = r.pick(SPOOL);
      s2 = type === 'tan-cos' || type === 'sin-tan' ? Q.of(-1).div(s1) : r.pick(SPOOL);
    } while (s1.eq(s2) || (Math.abs(s1.value) > 1 && Math.abs(s2.value) > 1));
    const p0 = s1.d * s2.d;
    // p(u − s1)(u − s2) = p u² − p(s1 + s2) u + p s1 s2, then cancel any common factor
    const c1r = s1.add(s2).mul(-p0),
      c0r = s1.mul(s2).mul(p0);
    r.require(c1r.d === 1 && c0r.d === 1);
    const g = gcd(gcd(p0, Math.abs(c1r.n)), Math.abs(c0r.n)) || 1;
    const p = p0 / g,
      c1 = c1r.div(g),
      c0 = c0r.div(g);
    r.require(Math.abs(c1.value) <= 30);
    const v = 'u';
    const quad = sumTex([[p, `${v}^{2}`], [c1, v], [c0, '']]);
    let eqTex: string, step: string;
    if (type === 'cos2-sin') {
      // p s² + c1 s + c0 = 0  ⇔  p(1 − cos²) + c1 sin + c0 = 0  ⇔  p cos²x − c1 sin x = p + c0
      eqTex = `${p === 1 ? '' : p}\\cos^{2} x${c1.isZero ? '' : sgn(c1.neg(), '\\sin x')} = ${c0.add(p).toLatex()}`;
      step = md`$\cos^{2} x = 1 - \sin^{2} x$`;
    } else if (type === 'sin2-cos') {
      eqTex = `${p === 1 ? '' : p}\\sin^{2} x${c1.isZero ? '' : sgn(c1.neg(), '\\cos x')} = ${c0.add(p).toLatex()}`;
      step = md`$\sin^{2} x = 1 - \cos^{2} x$`;
    } else if (type === 'tan-cos') {
      // p s² + c1 s − p = 0 (c0 = −p): c1 sin x = p cos² x  ⇔  c1 tan x = p cos x
      r.require(!c1.isZero);
      eqTex = `${c1.eq(1) ? '' : c1.eq(-1) ? '-' : c1.toLatex()}\\tan x = ${p === 1 ? '' : p}\\cos x`;
      step = md`Multiply by $\cos x$: $${c1.toLatex()}\sin x = ${p}\cos^{2} x = ${p}(1 - \sin^{2} x)$`;
    } else {
      // p c² + c1 c − p = 0  ⇔  p sin² x = c1 cos x  ⇔  p sin x tan x = c1
      r.require(!c1.isZero);
      eqTex = `${p === 1 ? '' : p}\\sin x\\tan x = ${c1.toLatex()}`;
      step = md`$\sin x\tan x = \dfrac{\sin^{2} x}{\cos x}$, so $${p}\sin^{2} x = ${c1.toLatex()}\cos x$ and $\sin^{2} x = 1 - \cos^{2} x$`;
    }
    const QE = ans.eq(ex(quad), num(0), [v]);
    const sols = [...new Set([s1, s2].flatMap((s) => baseSolutionsDeg(inSin ? 'sin' : 'cos', s.value, 0, 360)).map((x) => Math.round(x * 1e9) / 1e9))].sort((a, b) => a - b);
    r.require(sols.length >= 1 && sols.length <= 4);
    const L = degList(sols, 'x');
    const trig = inSin ? '\\sin x' : '\\cos x';
    return {
      stem: md`$${eqTex}$`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Show that this equation can be written as $a${v}^{2} + b${v} + c = 0$, where $${v} = ${trig}$ and $a$, $b$, $c$ are integers. Give the equation.`, answer: QE, scheme: [M1(md`Uses ${step}`), dM1('Collects all terms on one side'), A1(md`$${quad} = 0$`)], hints: [md`Write everything in terms of $${trig}$.`, md`Use ${step}.`, 'Collect terms and tidy the coefficients.'], solution: [md`Using ${step}:`, md`$${answerTex(QE)}$ with $${v} = ${trig}$.`] }),
        part({ label: 'b', marks: 4, prompt: md`Hence solve the equation for $0 \leqslant x < 360^{\circ}$, giving your answers to 1 decimal place where appropriate.`, answer: L, scheme: [M1('Solves the quadratic'), A1(md`$${v} = ${s1.toLatex()}$ or $${s2.toLatex()}$`), M1(`Rejects any value outside [−1, 1] and finds solutions in range`), A1(md`$${answerTex(L)}$`)], hints: [md`Solve $${quad} = 0$ (factorise).`, `One root may be impossible for ${inSin ? 'sin' : 'cos'} x.`, 'Use CAST to find every solution in 0 ≤ x < 360°.'], solution: [md`$${v} = ${s1.toLatex()}$ or $${v} = ${s2.toLatex()}$`, md`$x = ${answerTex(L)}$`] }),
      ],
      params: { type, p, c1: c1.value, c0: c0.value },
    };
  },
  verify(inst) {
    const { type, p, c1, c0 } = inst.params as { type: string; p: number; c1: number; c0: number };
    const g = (deg: number) => {
      const x = deg * D;
      if (type === 'cos2-sin') return p * Math.cos(x) ** 2 - c1 * Math.sin(x) - (c0 + p);
      if (type === 'sin2-cos') return p * Math.sin(x) ** 2 - c1 * Math.cos(x) - (c0 + p);
      if (type === 'tan-cos') return c1 * Math.tan(x) - p * Math.cos(x);
      return p * Math.sin(x) * Math.tan(x) - c1;
    };
    const xs = (inst.parts[1].answer as ListSpec).items.map(valOf);
    for (const x of xs) expect(Math.abs(g(x)) < 1e-6, `x = ${x} solves the equation`);
    const roots = gridRoots(g, 0, 360);
    expect(roots.length === xs.length, `grid found ${roots.length} roots for ${xs.length} answers`);
  },
});

// ---------------------------------------------------------------- 7.6 compound-angle identity, hence solve
type CFam = { lhs: (a: string) => string; trig: TrigF; coefKind: 'cos' | 'sin'; f: (x: number, a: number) => number };
const CFAMS: CFam[] = [
  { lhs: (a) => `\\sin(x + ${a}) + \\sin(x - ${a})`, trig: 'sin', coefKind: 'cos', f: (x, a) => Math.sin(x + a) + Math.sin(x - a) },
  { lhs: (a) => `\\sin(x + ${a}) - \\sin(x - ${a})`, trig: 'cos', coefKind: 'sin', f: (x, a) => Math.sin(x + a) - Math.sin(x - a) },
  { lhs: (a) => `\\cos(x + ${a}) + \\cos(x - ${a})`, trig: 'cos', coefKind: 'cos', f: (x, a) => Math.cos(x + a) + Math.cos(x - a) },
  { lhs: (a) => `\\cos(x - ${a}) - \\cos(x + ${a})`, trig: 'sin', coefKind: 'sin', f: (x, a) => Math.cos(x - a) - Math.cos(x + a) },
];
const TWO: Record<'sin' | 'cos', Record<number, { tex: string; v: number }>> = {
  cos: { 30: { tex: '\\sqrt{3}', v: Math.sqrt(3) }, 45: { tex: '\\sqrt{2}', v: Math.SQRT2 }, 60: { tex: '', v: 1 } },
  sin: { 30: { tex: '', v: 1 }, 45: { tex: '\\sqrt{2}', v: Math.SQRT2 }, 60: { tex: '\\sqrt{3}', v: Math.sqrt(3) } },
};

const compoundProof = defineTemplate({
  id: 'p2.7.prove-compound-identity-hence-solve',
  family: 'p2.7.proofs',
  title: 'Prove a compound-angle identity, then solve',
  spec: ['P5.8', 'P5.6'],
  chapter: 'P2.7',
  sections: ['7.1', '7.6'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 7,
  time: 8,
  commands: ['Prove', 'Hence', 'Solve'],
  tags: ['proof', 'addition formulae', 'identities', 'trigonometric equations'],
  generate(r) {
    const fi = r.int(0, CFAMS.length - 1);
    const F = CFAMS[fi];
    const a = r.pick([30, 45, 60]);
    const coef = TWO[F.coefKind][a];
    const aTex = `${a}^{\\circ}`;
    const rhs = `${coef.tex}\\${F.trig} x`;
    const k = r.pick([0.5, 0.8, 1.2, -0.6, -1, 0.3, 1.5, -1.3]);
    const v = k / coef.v;
    r.require(Math.abs(v) < 1);
    const sols = baseSolutionsDeg(F.trig, v, 0, 360);
    const L = degList(sols, 'x');
    const expand = F.trig === 'sin' && F.coefKind === 'cos' ? md`$(\sin x\cos ${aTex} + \cos x\sin ${aTex}) + (\sin x\cos ${aTex} - \cos x\sin ${aTex}) = 2\sin x\cos ${aTex}$` : F.trig === 'cos' && F.coefKind === 'sin' ? md`$(\sin x\cos ${aTex} + \cos x\sin ${aTex}) - (\sin x\cos ${aTex} - \cos x\sin ${aTex}) = 2\cos x\sin ${aTex}$` : F.trig === 'cos' ? md`$(\cos x\cos ${aTex} - \sin x\sin ${aTex}) + (\cos x\cos ${aTex} + \sin x\sin ${aTex}) = 2\cos x\cos ${aTex}$` : md`$(\cos x\cos ${aTex} + \sin x\sin ${aTex}) - (\cos x\cos ${aTex} - \sin x\sin ${aTex}) = 2\sin x\sin ${aTex}$`;
    const twoVal = md`$2${F.coefKind === 'cos' ? '\\cos' : '\\sin'} ${aTex} = ${coef.tex || '1'}$`;
    return {
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Prove that $${F.lhs(aTex)} \equiv ${rhs}$.`, answer: ans.self(`${expand} and ${twoVal}, so the identity holds.`), scheme: [M1('Expands both compound angles correctly'), M1('Simplifies, cancelling terms'), A1cso(md`Uses ${twoVal} to reach $${rhs}$`, true)], hints: [md`Expand using $\sin(A \pm B)$ or $\cos(A \pm B)$.`, 'Two of the four terms cancel.', md`Then use the exact value: ${twoVal}.`], solution: [expand, md`and ${twoVal}, giving $${rhs}$.`] }),
        part({ label: 'b', marks: 4, prompt: md`Hence solve, for $0 \leqslant x < 360^{\circ}$, the equation $${F.lhs(aTex)} = ${k}$, giving your answers to 1 decimal place.`, answer: L, scheme: [M1(md`$${rhs} = ${k}$`), A1(md`$${'\\' + F.trig} x = ${fmtSF(v, 4)}$`), dM1('Finds a second solution in range'), A1(md`$${answerTex(L)}$`)], hints: ['Use part (a) to simplify the left-hand side.', md`$${rhs} = ${k}$, so $${'\\' + F.trig} x = ${fmtSF(v, 4)}$`, 'Find both solutions in the interval.'], solution: [md`$${'\\' + F.trig} x = \dfrac{${k}}{${coef.tex || '1'}} = ${fmtSF(v, 4)}$`, md`$x = ${answerTex(L)}$`] }),
      ],
      params: { fi, a, k },
    };
  },
  verify(inst) {
    const { fi, a, k } = inst.params as Record<string, number>;
    const F = CFAMS[fi];
    const xs = (inst.parts[1].answer as ListSpec).items.map(valOf);
    for (const x of xs) expectClose(F.f(x * D, a * D) + 10, k + 10, 'solution', 1e-9);
    expect(gridRoots((t) => F.f(t * D, a * D) - k, 0, 360).length === xs.length, 'all solutions found');
  },
});

// ---------------------------------------------------------------- 7.7 modelling
const ferris = defineTemplate({
  id: 'p2.7.ferris-wheel-model',
  family: 'p2.7.modelling',
  title: 'Trigonometric model: height on a Ferris wheel',
  spec: ['P5.9', 'P5.7'],
  chapter: 'P2.7',
  sections: ['7.7'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 8,
  time: 10,
  commands: ['Find', 'Write down'],
  tags: ['modelling', 'trigonometric functions', 'radians', 'periodic'],
  generate(r) {
    const B = r.int(8, 30),
      A = B + r.int(1, 4),
      P = r.pick([10, 12, 15, 20, 24, 30]);
    const t1 = r.int(1, Math.floor(P / 2));
    const H = r.int(Math.ceil(A - B * 0.7), Math.floor(A + B * 0.7));
    r.require(H !== A);
    const w = (2 * Math.PI) / P;
    const h = (t: number) => A - B * Math.cos(w * t);
    const tH = Math.acos((A - H) / B) / w;
    const dur = P - 2 * tH;
    const Mx = ans.exact(exq(A + B), undefined, { unit: '\\text{m}' }),
      H1 = ans.num(h(t1), { sf: 3 }, { unit: '\\text{m}' }),
      TH = ans.num(tH, { sf: 3 }, { unit: '\\text{minutes}' }),
      Du = ans.num(dur, { sf: 3 }, { unit: '\\text{minutes}' });
    const wTex = `\\frac{${P % 2 === 0 ? '' : 2}\\pi t}{${P % 2 === 0 ? P / 2 : P}}`;
    return {
      stem: md`The height, $h$ metres, of a passenger on a Ferris wheel $t$ minutes after boarding is modelled by $h = ${A} - ${B}\cos\left(${wTex}\right)$, where the angle is in radians.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Write down the maximum height of the passenger.`, answer: Mx, scheme: [B1(md`$${A + B}$ m`)], hints: ['The cosine term is smallest when cos = −1.', md`$h = ${A} - ${B}(-1)$`, 'That is the top of the wheel.'], solution: [md`Maximum when $\cos = -1$: $h = ${answerTex(Mx)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the height of the passenger after $${t1}$ minutes.`, answer: H1, scheme: [M1(md`Substitutes $t = ${t1}$ (radians)`), A1(md`awrt $${fmtSF(h(t1), 3)}$`)], hints: [md`Substitute $t = ${t1}$.`, 'Make sure the calculator is in radian mode.', 'Give 3 significant figures.'], solution: [md`$h = ${A} - ${B}\cos\left(\frac{2\pi \times ${t1}}{${P}}\right) = ${answerTex(H1)}$`] }),
        part({ label: 'c', marks: 3, prompt: md`Find the time after boarding when the passenger first reaches a height of $${H}$ m.`, answer: TH, scheme: [M1(md`$${A} - ${B}\cos(\ldots) = ${H}$`), M1(md`$\cos(\ldots) = \dfrac{${A - H}}{${B}}$ and uses arccos`), A1(md`awrt $${fmtSF(tH, 3)}$`)], hints: [md`Set $h = ${H}$.`, md`Rearrange to $\cos\left(${wTex}\right) = \dfrac{${A - H}}{${B}}$.`, 'The first time uses the principal value of arccos.'], solution: [md`$\cos\left(${wTex}\right) = \dfrac{${A - H}}{${B}} \Rightarrow t = ${answerTex(TH)}$`] }),
        part({ label: 'd', marks: 2, prompt: md`Find, for how long in each revolution the passenger is higher than $${H}$ m.`, answer: Du, scheme: [M1('Uses the symmetry of the cosine curve: second time is (period − first time)'), A1(md`awrt $${fmtSF(dur, 3)}$`)], hints: [md`One revolution takes $${P}$ minutes.`, md`By symmetry, the passenger is next at $${H}$ m at $t = ${P} - ${fmtSF(tH, 4)}$.`, 'Subtract the two times.'], solution: [md`Higher than $${H}$ m for $${P} - 2(${fmtSF(tH, 4)}) = ${answerTex(Du)}$`] }),
      ],
      params: { A, B, P, t1, H },
    };
  },
  verify(inst) {
    const { A, B, P, t1, H } = inst.params as Record<string, number>;
    const h = (t: number) => A - B * Math.cos((2 * Math.PI * t) / P);
    expectClose(valOf(inst.parts[1].answer as NumericSpec), h(t1), 'height');
    const t = valOf(inst.parts[2].answer as NumericSpec);
    expectClose(h(t), H, 'first time');
    for (let s = 0; s < t - 1e-6; s += t / 50) expect(h(s) < H, 'earlier times are lower');
    // measured time above H over one period
    let above = 0;
    const n = 200000;
    for (let i = 0; i < n; i++) if (h(((i + 0.5) * P) / n) > H) above += P / n;
    expectClose(valOf(inst.parts[3].answer as NumericSpec), above, 'time above', 1e-4);
  },
});

const tide = defineTemplate({
  id: 'p2.7.tide-model-r-form',
  family: 'p2.7.modelling',
  title: 'Depth of water modelled with R sin(30t + α)°',
  spec: ['P5.9', 'P5.6'],
  chapter: 'P2.7',
  sections: ['7.5', '7.7'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 8,
  time: 10,
  commands: ['Express', 'Find', 'Give a reason'],
  tags: ['modelling', 'R sin(θ + α)', 'harmonic form', 'tides', 'limitations'],
  generate(r) {
    const m = r.pick([4, 5, 6, 7, 8, 10]),
      a = r.pick([1, 1.5, 2, 2.5, 3]),
      b = r.pick([0.5, 1, 1.2, 1.5, 2]);
    r.require(a !== b && m > Math.hypot(a, b) + 0.5);
    const R = Math.hypot(a, b),
      al = Math.atan(b / a) / D;
    const tMax = (90 - al) / 30;
    const Rs = ans.num(R, { sf: 3 }, { unit: '\\text{m}', exactAllowed: true, exact: ex(`\\sqrt{${fmtNum(a * a + b * b)}}`) }),
      As = ans.num(al, { dp: 2 }, { unit: '^{\\circ}' }),
      Mx = ans.num(m + R, { sf: 3 }, { unit: '\\text{m}' }),
      Tm = ans.num(tMax, { sf: 3 }, { unit: '\\text{hours}' });
    const opts = ['Tides vary with the phases of the moon and the weather, so the depth will not follow exactly the same pattern every day', 'The depth can be negative in the model', 'The model has a maximum value'];
    const C: ChoiceSpec = ans.choice(opts, 0);
    return {
      stem: md`The depth of water, $D$ metres, at the entrance to a harbour $t$ hours after midnight is modelled by $D = ${m} + ${fmtNum(a)}\sin(30t)^{\circ} + ${fmtNum(b)}\cos(30t)^{\circ}$, $0 \leqslant t < 24$.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Write $${fmtNum(a)}\sin(30t)^{\circ} + ${fmtNum(b)}\cos(30t)^{\circ}$ in the form $R\sin(30t + \alpha)^{\circ}$, where $R > 0$ and $0 < \alpha < 90$. Enter the value of $R$ (to 3 s.f. or exact).`, answer: Rs, scheme: [B1(md`$R = \sqrt{${fmtNum(a)}^{2} + ${fmtNum(b)}^{2}} = ${fmtSF(R, 4)}$`), M1(md`$\tan\alpha = \dfrac{${fmtNum(b)}}{${fmtNum(a)}}$`), A1(md`$\alpha = ${al.toFixed(2)}$`)], hints: ['Expand R sin(30t + α) and compare coefficients.', md`$R\cos\alpha = ${fmtNum(a)}$, $R\sin\alpha = ${fmtNum(b)}$.`, 'Square and add for R; divide for tan α.'], solution: [md`$R = \sqrt{${fmtNum(a * a + b * b)}} = ${answerTex(Rs)}$`, md`$\tan\alpha = \dfrac{${fmtNum(b)}}{${fmtNum(a)}} \Rightarrow \alpha = ${al.toFixed(2)}^{\circ}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Find the value of $\alpha$ to 2 decimal places.`, answer: As, scheme: [B1(md`$${al.toFixed(2)}$`)], hints: [md`$\tan\alpha = \dfrac{${fmtNum(b)}}{${fmtNum(a)}}$`, 'Degree mode.', 'Round to 2 d.p.'], solution: [md`$\alpha = ${answerTex(As)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the maximum depth of water predicted by the model, and the time after midnight at which it first occurs. (Enter the maximum depth.)`, answer: Mx, scheme: [B1(md`$${m} + R = ${fmtSF(m + R, 3)}$ m`), B1(md`$30t + \alpha = 90 \Rightarrow t = ${fmtSF(tMax, 3)}$ hours`)], hints: ['The maximum of R sin(…) is R.', md`So $D_{\max} = ${m} + R$.`, 'It occurs when 30t + α = 90.'], solution: [md`$D_{\max} = ${m} + ${fmtSF(R, 4)} = ${answerTex(Mx)}$, at $t = \dfrac{90 - \alpha}{30} = ${fmtSF(tMax, 3)}$ hours`] }),
        part({ label: 'd', marks: 1, prompt: md`Find the time, in hours after midnight, at which the maximum depth first occurs.`, answer: Tm, scheme: [B1(md`awrt $${fmtSF(tMax, 3)}$`)], hints: ['sin is maximum when its argument is 90°.', md`$30t + ${al.toFixed(2)} = 90$`, 'Solve for t.'], solution: [md`$t = \dfrac{90 - ${al.toFixed(2)}}{30} = ${answerTex(Tm)}$`] }),
        part({ label: 'e', marks: 1, prompt: md`Give one reason why this model may not give accurate predictions over several days.`, answer: C, scheme: [B1('Sensible limitation in context')], hints: ['What else affects tides?', 'Is the pattern exactly the same every day?', 'Think about the moon and the weather.'], solution: [opts[0]] }),
      ],
      params: { m, a, b },
    };
  },
  verify(inst) {
    const { m, a, b } = inst.params as Record<string, number>;
    const Dp = (t: number) => m + a * Math.sin(30 * t * D) + b * Math.cos(30 * t * D);
    const R = valOf(inst.parts[0].answer as NumericSpec),
      al = valOf(inst.parts[1].answer as NumericSpec) * D;
    for (const t of [0.7, 3.3, 9.1]) expectClose(m + R * Math.sin(30 * t * D + al), Dp(t), 'R form', 1e-9);
    let best = -Infinity;
    for (let t = 0; t < 12; t += 0.0005) best = Math.max(best, Dp(t));
    expectClose(valOf(inst.parts[2].answer as NumericSpec), best, 'max depth', 1e-6);
    expectClose(Dp(valOf(inst.parts[3].answer as NumericSpec)), best, 'time of max', 1e-6);
  },
});

const projectile = defineTemplate({
  id: 'p2.7.projectile-range-model',
  family: 'p2.7.modelling',
  title: 'Trigonometry in mechanics: the range of a projectile, R = u² sin 2θ / g',
  spec: ['P5.9', 'P5.7'],
  chapter: 'P2.7',
  sections: ['7.7'],
  level: 'A2',
  paper: [1, 2, 3],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find', 'Give a reason'],
  tags: ['modelling', 'projectiles', 'double angle', 'trigonometric equations', 'limitations'],
  generate(r) {
    const u = r.pick([12, 14, 15, 18, 20, 21, 24, 25, 28]);
    const Rmax = (u * u) / G;
    const D0 = Number(fmtSF(Rmax * r.pick([0.5, 0.6, 0.7, 0.75, 0.8, 0.9]), 2));
    const s = (D0 * G) / (u * u);
    r.require(s < 1);
    const th1 = Math.asin(s) / D / 2,
      th2 = 90 - th1;
    const Mx = ans.num(Rmax, { sf: 3 }, { unit: '\\text{m}' });
    const L = degList([th1, th2]);
    const opts = ['It ignores air resistance (and spin), which would reduce the range', 'It assumes the ball is very heavy', 'It uses degrees instead of radians'];
    const C: ChoiceSpec = ans.choice(opts, 0);
    return {
      stem: md`A ball is kicked from horizontal ground with speed $${u}$ m s$^{-1}$ at an angle $\theta$ above the horizontal. The horizontal distance it travels before landing is modelled by $R = \dfrac{${u}^{2}\sin 2\theta}{g}$, where $g = 9.8$ m s$^{-2}$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the maximum value of $R$ predicted by the model.`, answer: Mx, scheme: [M1(md`$\sin 2\theta = 1$, i.e. $\theta = 45^{\circ}$`), A1(md`awrt $${fmtSF(Rmax, 3)}$ m`)], hints: ['The largest value of sin 2θ is 1.', 'That happens when 2θ = 90°.', md`$R = \dfrac{${u * u}}{9.8}$`], solution: [md`Maximum when $\theta = 45^{\circ}$: $R = \dfrac{${u * u}}{9.8} = ${answerTex(Mx)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Find the two possible values of $\theta$, with $0 < \theta < 90^{\circ}$, for which the ball travels $${D0}$ m.`, answer: L, scheme: [M1(md`$\sin 2\theta = \dfrac{${D0} \times 9.8}{${u * u}}$`), dM1('Finds two values of 2θ in (0°, 180°)'), A1(md`$${answerTex(L)}$`)], hints: [md`Set $R = ${D0}$ and make $\sin 2\theta$ the subject.`, md`$0 < 2\theta < 180^{\circ}$ gives two solutions for $2\theta$.`, 'Halve them. (They should add up to 90°.)'], solution: [md`$\sin 2\theta = ${fmtSF(s, 4)} \Rightarrow 2\theta = ${fmtSF(2 * th1, 4)}^{\circ}$ or $${fmtSF(180 - 2 * th1, 4)}^{\circ}$`, md`$\theta = ${answerTex(L)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`Give one limitation of this model.`, answer: C, scheme: [B1('Sensible limitation')], hints: ['What forces does the model include?', 'What about the air?', 'Real balls also spin.'], solution: [opts[0]] }),
      ],
      params: { u, D0 },
    };
  },
  verify(inst) {
    const { u, D0 } = inst.params as Record<string, number>;
    const xs = (inst.parts[1].answer as ListSpec).items.map(valOf);
    for (const th of xs) expectClose((u * u * Math.sin(2 * th * D)) / G, D0, 'range');
    expectClose(xs[0] + xs[1], 90, 'complementary');
  },
});

const templates: Template[] = [proveHence, showQuadratic, compoundProof, ferris, tide, projectile];
export default templates;
