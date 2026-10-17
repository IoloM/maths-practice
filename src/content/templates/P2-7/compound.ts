/** Pure Year 2, Chapter 7 — addition and double-angle formulae, R cos(θ ± α), equations using them (7.1–7.5). */
import { Q, surdSimplify } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { AnswerSpec, ExactSpec, ListSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, md, part, sgn } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';
import { baseSolutionsDeg, piMultiple, piTex, type TrigF } from '../shared/trig';

const exq = (q: Q | number) => num(Q.from(q));
const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
const D = Math.PI / 180;
const TRIPLES: [number, number, number][] = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
];
const surdTex = (n: number) => {
  const [a, b] = surdSimplify(n);
  return b === 1 ? `${a}` : `${a === 1 ? '' : a}\\sqrt{${b}}`;
};
const degList = (xs: number[], v = '\\theta') => ans.list(xs.map((x) => (Math.abs(x - Math.round(x)) < 1e-9 ? ans.exact(exq(Math.round(x))) : ans.num(x, { dp: 1 }))), { v, angle: 'deg' });

// ---------------------------------------------------------------- 7.1–7.2 addition formulae with exact ratios
const compoundExact = defineTemplate({
  id: 'p2.7.addition-formulae-exact-ratios',
  family: 'p2.7.addition-formulae',
  title: 'Exact values of sin(A ± B), cos(A ± B), tan(A ± B) from given ratios',
  spec: ['P5.6', 'P5.5'],
  chapter: 'P2.7',
  sections: ['7.1', '7.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 7,
  time: 8,
  commands: ['Find', 'Show that'],
  tags: ['addition formulae', 'compound angles', 'exact values'],
  generate(r) {
    const [p1, q1, h1] = r.pick(TRIPLES),
      [p2, q2, h2] = r.pick(TRIPLES);
    const swapA = r.bool(),
      swapB = r.bool();
    const sA = Q.of(swapA ? q1 : p1, h1),
      cA = Q.of(swapA ? p1 : q1, h1);
    const obtuseB = r.bool(0.6);
    const sB = Q.of(swapB ? q2 : p2, h2),
      cB = Q.of(swapB ? p2 : q2, h2).mul(obtuseB ? -1 : 1);
    r.require(!(sA.eq(sB) && cA.eq(cB.abs())));
    const sum = sA.mul(cB).add(cA.mul(sB)),
      cdiff = cA.mul(cB).add(sA.mul(sB));
    const tA = sA.div(cA),
      tB = sB.div(cB);
    const den = Q.of(1).add(tA.mul(tB));
    r.require(!den.isZero);
    const tdiff = tA.sub(tB).div(den);
    const which = r.pick(['cos-diff', 'tan-diff'] as const);
    const CA = ans.exact(exq(cA)),
      S = ans.exact(exq(sum)),
      T = which === 'cos-diff' ? ans.exact(exq(cdiff)) : ans.exact(exq(tdiff));
    return {
      stem: md`Angle $A$ is acute and $\sin A = ${sA.toLatex()}$. Angle $B$ is ${obtuseB ? 'obtuse' : 'acute'} and $\sin B = ${sB.toLatex()}$.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find the exact value of $\cos A$.`, answer: CA, scheme: [B1(md`$${cA.toLatex()}$`)], hints: [md`Use $\sin^{2} A + \cos^{2} A = 1$.`, 'Or draw a right-angled triangle.', 'A is acute, so cos A is positive.'], solution: [md`$\cos A = \sqrt{1 - \left(${sA.toLatex()}\right)^{2}} = ${answerTex(CA)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Find the exact value of $\sin(A + B)$.`, answer: S, scheme: [M1(md`$\cos B = ${cB.toLatex()}$ (${obtuseB ? 'negative as B is obtuse' : 'positive as B is acute'})`), M1(md`$\sin A\cos B + \cos A\sin B$`), A1(md`$${sum.toLatex()}$`)], hints: [md`Find $\cos B$ first — ${obtuseB ? 'B is obtuse, so cos B is negative' : 'B is acute, so cos B is positive'}.`, md`$\sin(A + B) = \sin A\cos B + \cos A\sin B$`, 'Substitute the four exact ratios.'], errors: obtuseB ? [err('cosB-sign', ans.exact(exq(sA.mul(cB.neg()).add(cA.mul(sB)))), 'B is obtuse, so cos B is negative.', 2)] : [], solution: [md`$\cos B = ${cB.toLatex()}$`, md`$\sin(A + B) = \left(${sA.toLatex()}\right)\left(${cB.toLatex()}\right) + \left(${cA.toLatex()}\right)\left(${sB.toLatex()}\right) = ${answerTex(S)}$`] }),
        part({ label: 'c', marks: 3, prompt: which === 'cos-diff' ? md`Find the exact value of $\cos(A - B)$.` : md`Find the exact value of $\tan(A - B)$.`, answer: T, scheme: which === 'cos-diff' ? [M1(md`$\cos A\cos B + \sin A\sin B$`), A1('Correct substitution'), A1(md`$${cdiff.toLatex()}$`)] : [M1(md`$\tan A = ${tA.toLatex()}$, $\tan B = ${tB.toLatex()}$`), M1(md`$\dfrac{\tan A - \tan B}{1 + \tan A\tan B}$`), A1(md`$${tdiff.toLatex()}$`)], hints: which === 'cos-diff' ? [md`$\cos(A - B) = \cos A\cos B + \sin A\sin B$`, 'Note the + sign for cos(A − B).', 'Substitute and simplify.'] : [md`$\tan A = \dfrac{\sin A}{\cos A}$`, md`$\tan(A - B) = \dfrac{\tan A - \tan B}{1 + \tan A\tan B}$`, 'Simplify the compound fraction carefully.'], solution: which === 'cos-diff' ? [md`$\cos(A - B) = \left(${cA.toLatex()}\right)\left(${cB.toLatex()}\right) + \left(${sA.toLatex()}\right)\left(${sB.toLatex()}\right) = ${answerTex(T)}$`] : [md`$\tan A = ${tA.toLatex()}$, $\tan B = ${tB.toLatex()}$`, md`$\tan(A - B) = \dfrac{${tA.toLatex()} - \left(${tB.toLatex()}\right)}{1 + \left(${tA.toLatex()}\right)\left(${tB.toLatex()}\right)} = ${answerTex(T)}$`] }),
      ],
      params: { A: Math.asin(sA.value), B: obtuseB ? Math.PI - Math.asin(sB.value) : Math.asin(sB.value), which },
    };
  },
  verify(inst) {
    const { A, B, which } = inst.params as { A: number; B: number; which: string };
    expectClose(valOf(inst.parts[0].answer as ExactSpec), Math.cos(A), 'cos A');
    expectClose(valOf(inst.parts[1].answer as ExactSpec) + 2, Math.sin(A + B) + 2, 'sin(A+B)');
    expectClose(valOf(inst.parts[2].answer as ExactSpec) + 2, (which === 'cos-diff' ? Math.cos(A - B) : Math.tan(A - B)) + 2, 'part c');
  },
});

const SURD_TABLE: Record<number, { sin: string; cos: string; tan: string }> = {
  15: { sin: '\\frac{\\sqrt{6} - \\sqrt{2}}{4}', cos: '\\frac{\\sqrt{6} + \\sqrt{2}}{4}', tan: '2 - \\sqrt{3}' },
  75: { sin: '\\frac{\\sqrt{6} + \\sqrt{2}}{4}', cos: '\\frac{\\sqrt{6} - \\sqrt{2}}{4}', tan: '2 + \\sqrt{3}' },
  105: { sin: '\\frac{\\sqrt{6} + \\sqrt{2}}{4}', cos: '\\frac{\\sqrt{2} - \\sqrt{6}}{4}', tan: '-2 - \\sqrt{3}' },
  165: { sin: '\\frac{\\sqrt{6} - \\sqrt{2}}{4}', cos: '-\\frac{\\sqrt{6} + \\sqrt{2}}{4}', tan: '\\sqrt{3} - 2' },
};
const SPLIT: Record<number, string> = { 15: '45^{\\circ} - 30^{\\circ}', 75: '45^{\\circ} + 30^{\\circ}', 105: '60^{\\circ} + 45^{\\circ}', 165: '120^{\\circ} + 45^{\\circ}' };

const exactSurd = defineTemplate({
  id: 'p2.7.addition-formulae-exact-surds',
  family: 'p2.7.addition-formulae',
  title: 'Exact surd values of sin, cos, tan of 15°, 75°, 105°, 165°',
  spec: ['P5.6'],
  chapter: 'P2.7',
  sections: ['7.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find', 'Show that'],
  tags: ['addition formulae', 'exact values', 'surds', 'non-calculator'],
  generate(r) {
    const rad = r.bool(0.35);
    const fs: ('sin' | 'cos' | 'tan')[] = r.shuffle(['sin', 'cos', 'tan']);
    const angs = fs.map(() => r.pick([15, 75, 105, 165]));
    const angTex = (d: number) => (rad ? piTex(piMultiple(d)) : `${d}^{\\circ}`);
    return {
      stem: 'Using the addition formulae, and without a calculator, find the exact value of each of the following. Simplify your answers.',
      parts: fs.map((f, i) => {
        const d = angs[i];
        const A = ans.exact(ex(SURD_TABLE[d][f]), ['exact']);
        const formula = f === 'sin' ? md`$\sin(A \pm B) = \sin A\cos B \pm \cos A\sin B$` : f === 'cos' ? md`$\cos(A \pm B) = \cos A\cos B \mp \sin A\sin B$` : md`$\tan(A \pm B) = \dfrac{\tan A \pm \tan B}{1 \mp \tan A\tan B}$`;
        return part({
          label: 'abc'[i],
          marks: 2,
          prompt: md`$${'\\' + f}\left(${angTex(d)}\right)$`,
          answer: A,
          scheme: [M1(md`Writes $${angTex(d)}$ as $${SPLIT[d]}$ and uses the correct formula`), A1(md`$${SURD_TABLE[d][f]}$`)],
          hints: [md`$${d}^{\circ} = ${SPLIT[d]}$`, formula, f === 'tan' ? 'Rationalise the denominator at the end.' : 'Use exact values for 30°, 45°, 60° and 120°.'],
          solution: [md`$${'\\' + f}\left(${angTex(d)}\right) = ${'\\' + f}\left(${SPLIT[d]}\right) = ${answerTex(A)}$`],
        });
      }),
      params: { fs, angs },
    };
  },
  verify(inst) {
    const { fs, angs } = inst.params as { fs: string[]; angs: number[] };
    fs.forEach((f, i) => {
      const t = angs[i] * D;
      const v = f === 'sin' ? Math.sin(t) : f === 'cos' ? Math.cos(t) : Math.tan(t);
      expectClose(valOf(inst.parts[i].answer as ExactSpec) + 5, v + 5, `${f} ${angs[i]}`);
    });
  },
});

// ---------------------------------------------------------------- 7.3 double-angle formulae
const doubleAngle = defineTemplate({
  id: 'p2.7.double-angle-exact-values',
  family: 'p2.7.double-angle',
  title: 'Exact values of sin 2x, cos 2x and tan 2x from one ratio and a quadrant',
  spec: ['P5.6'],
  chapter: 'P2.7',
  sections: ['7.3'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find'],
  tags: ['double-angle formulae', 'exact values', 'CAST'],
  generate(r) {
    const [p, q, h] = r.pick(TRIPLES);
    const quad = r.pick([2, 3, 4]);
    const sw = r.bool();
    const s0 = Q.of(sw ? q : p, h),
      c0 = Q.of(sw ? p : q, h);
    const s = quad === 2 ? s0 : s0.neg(),
      c = quad === 4 ? c0 : c0.neg();
    const given = r.pick(['sin', 'cos', 'tan'] as const);
    const gv = given === 'sin' ? s : given === 'cos' ? c : s.div(c);
    const range = quad === 2 ? md`90^{\circ} < x < 180^{\circ}` : quad === 3 ? md`180^{\circ} < x < 270^{\circ}` : md`270^{\circ} < x < 360^{\circ}`;
    const s2 = s.mul(c).mul(2),
      c2 = c.mul(c).sub(s.mul(s)),
      t2 = s2.div(c2);
    const S2 = ans.exact(exq(s2)),
      C2 = ans.exact(exq(c2)),
      T2 = ans.exact(exq(t2));
    const other = given === 'sin' ? md`$\cos x = ${c.toLatex()}$` : given === 'cos' ? md`$\sin x = ${s.toLatex()}$` : md`$\sin x = ${s.toLatex()}$, $\cos x = ${c.toLatex()}$`;
    return {
      stem: md`Given that $${'\\' + given} x = ${gv.toLatex()}$ and $${range}$, find the exact value of`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`$\sin 2x$`, answer: S2, scheme: [M1(md`Finds the missing ratio with the correct sign: ${other}`), A1(md`$\sin 2x = 2\sin x\cos x = ${s2.toLatex()}$`)], hints: ['Draw a right-angled triangle, then use CAST for the signs.', md`In this quadrant: ${other}.`, md`$\sin 2x = 2\sin x\cos x$`], errors: [err('sign', ans.exact(exq(s2.neg())), 'Check the signs of sin x and cos x in this quadrant.')], solution: [other, md`$\sin 2x = 2\left(${s.toLatex()}\right)\left(${c.toLatex()}\right) = ${answerTex(S2)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`$\cos 2x$`, answer: C2, scheme: [M1(md`Uses $\cos 2x = \cos^{2} x - \sin^{2} x$ (or $2\cos^{2} x - 1$ or $1 - 2\sin^{2} x$)`), A1(md`$${c2.toLatex()}$`)], hints: [md`$\cos 2x = \cos^{2} x - \sin^{2} x$`, 'Any of the three versions works.', 'Squaring removes the signs.'], solution: [md`$\cos 2x = \left(${c.toLatex()}\right)^{2} - \left(${s.toLatex()}\right)^{2} = ${answerTex(C2)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`$\tan 2x$`, answer: T2, scheme: [M1(md`$\dfrac{\sin 2x}{\cos 2x}$ or $\dfrac{2\tan x}{1 - \tan^{2} x}$`), A1(md`$${t2.toLatex()}$`)], hints: [md`$\tan 2x = \dfrac{\sin 2x}{\cos 2x}$`, 'Use your answers to (a) and (b).', md`Or use $\tan 2x = \dfrac{2\tan x}{1 - \tan^{2} x}$.`], solution: [md`$\tan 2x = \dfrac{${s2.toLatex()}}{${c2.toLatex()}} = ${answerTex(T2)}$`] }),
      ],
      params: { x: Math.atan2(s.value, c.value) },
    };
  },
  verify(inst) {
    const { x } = inst.params as { x: number };
    expectClose(valOf(inst.parts[0].answer as ExactSpec) + 3, Math.sin(2 * x) + 3, 'sin 2x');
    expectClose(valOf(inst.parts[1].answer as ExactSpec) + 3, Math.cos(2 * x) + 3, 'cos 2x');
    expectClose(valOf(inst.parts[2].answer as ExactSpec) + 3, Math.tan(2 * x) + 3, 'tan 2x');
  },
});

// ---------------------------------------------------------------- 7.5 R cos(θ ± α)
type RForm = { lhs: (a: number, b: number) => string; rhs: string; f: TrigF; sgn: 1 | -1; maxAt: (al: number, full: number) => number };
const RFORMS: RForm[] = [
  { lhs: (a, b) => `${a === 1 ? '' : a}\\cos\\theta + ${b === 1 ? '' : b}\\sin\\theta`, rhs: 'R\\cos(\\theta - \\alpha)', f: 'cos', sgn: -1, maxAt: (al) => al },
  { lhs: (a, b) => `${a === 1 ? '' : a}\\sin\\theta + ${b === 1 ? '' : b}\\cos\\theta`, rhs: 'R\\sin(\\theta + \\alpha)', f: 'sin', sgn: 1, maxAt: (al, full) => full / 4 - al },
  { lhs: (a, b) => `${a === 1 ? '' : a}\\sin\\theta - ${b === 1 ? '' : b}\\cos\\theta`, rhs: 'R\\sin(\\theta - \\alpha)', f: 'sin', sgn: -1, maxAt: (al, full) => full / 4 + al },
  { lhs: (a, b) => `${a === 1 ? '' : a}\\cos\\theta - ${b === 1 ? '' : b}\\sin\\theta`, rhs: 'R\\cos(\\theta + \\alpha)', f: 'cos', sgn: 1, maxAt: (al, full) => full - al },
];

const rForm = defineTemplate({
  id: 'p2.7.r-cos-theta-alpha',
  family: 'p2.7.r-form',
  title: 'Write a cos θ + b sin θ in the form R cos(θ ± α) or R sin(θ ± α); maximum and equation',
  spec: ['P5.6', 'P5.7'],
  chapter: 'P2.7',
  sections: ['7.5'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 9,
  time: 11,
  commands: ['Express', 'Find', 'Solve'],
  tags: ['R cos(θ − α)', 'harmonic form', 'maximum', 'trigonometric equations'],
  generate(r) {
    const F = r.pick(RFORMS);
    const a = r.int(1, 9),
      b = r.int(1, 9);
    r.require(a !== b);
    const R2 = a * a + b * b;
    const Rv = Math.sqrt(R2);
    const deg = r.bool(0.6);
    const alDeg = Math.atan(b / a) / D;
    const full = deg ? 360 : 2 * Math.PI;
    const al = deg ? alDeg : alDeg * D;
    const Rs = ans.exact(ex(surdTex(R2)), ['exact', 'surd']);
    const As = ans.num(al, deg ? { dp: 2 } : { dp: 3 }, deg ? { unit: '^{\\circ}' } : {});
    const thMax = F.maxAt(al, full);
    const Tm = ans.num(thMax, deg ? { dp: 1 } : { dp: 2 }, deg ? { unit: '^{\\circ}' } : {});
    const k = r.intNZ(-Math.floor(Rv), Math.floor(Rv));
    r.require(Math.abs(k) < Rv - 0.05);
    // u = θ ∓ α in the shifted interval
    const alD = alDeg;
    const shift = F.sgn * alD; // u = θ + shift
    const us = baseSolutionsDeg(F.f, k / Rv, shift, 360 + shift);
    const thetas = us.map((u) => u - shift).filter((t) => t >= -1e-9 && t < 360 - 1e-9).sort((x, y) => x - y);
    r.require(thetas.length >= 1);
    const L: ListSpec = deg ? degList(thetas) : ans.list(thetas.map((t) => ans.num(t * D, { dp: 2 })), { v: '\\theta', angle: 'rad' });
    const lhs = F.lhs(a, b);
    const unitLo = deg ? '0 \\leqslant \\theta < 360^{\\circ}' : '0 \\leqslant \\theta < 2\\pi';
    const alRange = deg ? '0 < \\alpha < 90^{\\circ}' : '0 < \\alpha < \\frac{\\pi}{2}';
    return {
      stem: md`$\mathrm{f}(\theta) = ${lhs}$`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Given that $\mathrm{f}(\theta) \equiv ${F.rhs}$, where $R > 0$ and $${alRange}$, find the exact value of $R$.`, answer: Rs, scheme: [B1(md`$R = \sqrt{${a}^{2} + ${b}^{2}} = ${surdTex(R2)}$`)], hints: [md`Expand $${F.rhs}$ and compare coefficients.`, md`$R\cos\alpha = ${a}$ and $R\sin\alpha = ${b}$.`, md`Square and add: $R^{2} = ${a}^{2} + ${b}^{2}$.`], solution: [md`$R^{2} = ${a * a} + ${b * b} = ${R2}$, so $R = ${answerTex(Rs)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the value of $\alpha$, giving your answer ${deg ? 'in degrees to 2 decimal places' : 'in radians to 3 decimal places'}.`, answer: As, scheme: [M1(md`$\tan\alpha = \dfrac{${b}}{${a}}$`), A1(md`$\alpha = ${deg ? alDeg.toFixed(2) : al.toFixed(3)}$`)], hints: [md`$R\sin\alpha = ${b}$ and $R\cos\alpha = ${a}$.`, md`Divide: $\tan\alpha = \dfrac{${b}}{${a}}$.`, deg ? 'Calculator in degree mode.' : 'Calculator in radian mode.'], errors: [err('inverted', ans.num(deg ? 90 - alDeg : Math.PI / 2 - al, deg ? { dp: 2 } : { dp: 3 }), md`Check which coefficient goes on top: $\tan\alpha = \dfrac{R\sin\alpha}{R\cos\alpha} = \dfrac{${b}}{${a}}$.`)], solution: [md`$\tan\alpha = \dfrac{${b}}{${a}} \Rightarrow \alpha = ${answerTex(As)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Write down the maximum value of $\mathrm{f}(\theta)$ and find the smallest positive value of $\theta$ at which it occurs. (Enter the value of $\theta$.)`, answer: Tm, scheme: [B1(md`Maximum $= ${surdTex(R2)}$`), B1(md`$\theta = ${deg ? thMax.toFixed(1) : thMax.toFixed(2)}$`)], hints: [md`The maximum of $${F.f === 'cos' ? '\\cos' : '\\sin'}$ is $1$, so the maximum of $\mathrm{f}$ is $R$.`, md`$${F.f === 'cos' ? '\\cos' : '\\sin'}(\ldots) = 1$ when its argument is ${F.f === 'cos' ? (deg ? '0° (or 360°)' : '0 (or 2π)') : deg ? '90°' : 'π/2'}.`, 'Solve for θ.'], solution: [md`Maximum value $${surdTex(R2)}$ when $\theta = ${answerTex(Tm)}$`] }),
        part({ label: 'd', marks: 4, prompt: md`Solve, for $${unitLo}$, the equation $${lhs} = ${k}$, giving your answers ${deg ? 'to 1 decimal place' : 'to 2 decimal places'}.`, answer: L, scheme: [M1(md`$${F.rhs.replace('R', surdTex(R2))} = ${k}$`), M1(md`$${F.f === 'cos' ? '\\cos' : '\\sin'}(\theta ${F.sgn < 0 ? '-' : '+'} \alpha) = \dfrac{${k}}{${surdTex(R2)}}$ and finds a principal value`), dM1('Finds a second value in range'), A1(md`$${answerTex(L)}$`)], hints: ['Use your R form.', md`$${F.f === 'cos' ? '\\cos' : '\\sin'}(\theta ${F.sgn < 0 ? '-' : '+'} \alpha) = \dfrac{${k}}{${surdTex(R2)}}$`, 'Adjust the interval for θ ± α, find all values, then undo the shift.'], solution: [md`$${F.f === 'cos' ? '\\cos' : '\\sin'}(\theta ${F.sgn < 0 ? '-' : '+'} \alpha) = ${fmtSF(k / Rv, 5)}$`, md`$\theta = ${answerTex(L)}$`] }),
      ],
      params: { a, b, F: RFORMS.indexOf(F), deg, k },
    };
  },
  verify(inst) {
    const { a, b, F, deg, k } = inst.params as { a: number; b: number; F: number; deg: boolean; k: number };
    const lhs = (th: number) => {
      const s = Math.sin(th),
        c = Math.cos(th);
      return [a * c + b * s, a * s + b * c, a * s - b * c, a * c - b * s][F];
    };
    const toRad = (v: number) => (deg ? v * D : v);
    const R = valOf(inst.parts[0].answer as ExactSpec);
    const al = toRad(valOf(inst.parts[1].answer as NumericSpec));
    const rhs = (th: number) => [R * Math.cos(th - al), R * Math.sin(th + al), R * Math.sin(th - al), R * Math.cos(th + al)][F];
    for (const th of [0.3, 1.7, 4.1]) expectClose(lhs(th), rhs(th), 'identity', 1e-9);
    const tm = toRad(valOf(inst.parts[2].answer as NumericSpec));
    expectClose(lhs(tm), R, 'maximum', 1e-9);
    const xs = (inst.parts[3].answer as ListSpec).items.map((it) => toRad(valOf(it)));
    for (const x of xs) expectClose(lhs(x) + 20, k + 20, 'solves f = k', 1e-9);
    let count = 0;
    for (let i = 0; i < 36000; i++) {
      const x0 = (i * 2 * Math.PI) / 36000,
        x1 = ((i + 1) * 2 * Math.PI) / 36000;
      if (Math.abs(lhs(x0) - k) < 1e-12 || (lhs(x0) - k) * (lhs(x1) - k) < 0) count++;
    }
    expect(count === xs.length, `found ${count} roots, answers have ${xs.length}`);
  },
});

// ---------------------------------------------------------------- 7.4 equations using double-angle formulae
const POOL = [Q.of(1, 2), Q.of(-1, 2), Q.of(1), Q.of(-1), Q.of(2), Q.of(-2), Q.of(3, 2), Q.of(-3, 2), Q.of(1, 3), Q.of(-1, 3), Q.of(2, 3), Q.of(1, 4), Q.of(3, 4), Q.of(-3, 4), Q.of(3)];

const doubleEq = defineTemplate({
  id: 'p2.7.double-angle-equations',
  family: 'p2.7.double-angle',
  title: 'Solve equations using double-angle formulae',
  spec: ['P5.7', 'P5.6'],
  chapter: 'P2.7',
  sections: ['7.4'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 6,
  time: 8,
  commands: ['Solve', 'Show that'],
  tags: ['double-angle formulae', 'trigonometric equations', 'quadratic'],
  generate(r) {
    const type = r.pick(['cos2x-sin', 'cos2x-cos', 'sin2x'] as const);
    const lo = r.pick([0, -180]),
      hi = lo + 360;
    let eqTex: string, sols: number[], step: string, quad: string;
    let partA: AnswerSpec = ans.exact(num(0));
    if (type === 'sin2x') {
      const k = r.pick([Q.of(1), Q.of(-1), Q.of(3, 5), Q.of(4, 5), Q.of(6, 5), Q.of(-6, 5), Q.of(3, 2), Q.of(1, 2), Q.of(-1, 2)]);
      eqTex = `\\sin 2x = ${k.eq(1) ? '' : k.eq(-1) ? '-' : k.toLatex()}\\cos x`;
      quad = md`\cos x\left(2\sin x ${k.sign < 0 ? '+' : '-'} ${k.abs().toLatex()}\right) = 0`;
      sols = [...baseSolutionsDeg('cos', 0, lo, hi), ...baseSolutionsDeg('sin', k.value / 2, lo, hi)];
      step = md`$2\sin x\cos x = ${k.toLatex()}\cos x$`;
      partA = ans.exact(exq(k));
    } else {
      const f: TrigF = type === 'cos2x-sin' ? 'sin' : 'cos';
      let s1: Q, s2: Q, m: Q, n: Q;
      do {
        s1 = r.pick(POOL);
        s2 = r.pick(POOL);
        // cos2x-sin: 1 − 2s² = m s + n  ⇔ 2s² + m s + (n − 1) = 0  → 2(s − s1)(s − s2)
        // cos2x-cos: 2c² − 1 = m c + n  ⇔ 2c² − m c − (n + 1) = 0 → 2(c − s1)(c − s2)
        m = type === 'cos2x-sin' ? s1.add(s2).mul(-2) : s1.add(s2).mul(2);
        n = type === 'cos2x-sin' ? s1.mul(s2).mul(2).add(1) : s1.mul(s2).mul(-2).sub(1);
      } while (s1.eq(s2) || m.d !== 1 || n.d !== 1 || (Math.abs(s1.value) > 1 && Math.abs(s2.value) > 1));
      const fx = f === 'sin' ? '\\sin x' : '\\cos x';
      eqTex = `\\cos 2x = ${m.isZero ? '' : `${m.eq(1) ? '' : m.eq(-1) ? '-' : m.toLatex()}${fx}`}${n.isZero ? '' : m.isZero ? n.toLatex() : sgn(n)}`;
      r.require(!(m.isZero && n.isZero));
      quad = type === 'cos2x-sin' ? sumTex([[2, `${fx.replace(' x', '^{2} x')}`], [m, fx], [n.sub(1), '']]) + ' = 0' : sumTex([[2, `${fx.replace(' x', '^{2} x')}`], [m.neg(), fx], [n.add(1).neg(), '']]) + ' = 0';
      sols = [s1, s2].flatMap((s) => baseSolutionsDeg(f, s.value, lo, hi));
      const quadS = type === 'cos2x-sin' ? sumTex([[2, 's^{2}'], [m, 's'], [n.sub(1), '']]) : sumTex([[2, 's^{2}'], [m.neg(), 's'], [n.add(1).neg(), '']]);
      partA = ans.eq(ex(quadS), num(0), ['s']);
      step = type === 'cos2x-sin' ? md`$1 - 2\sin^{2} x = \ldots$` : md`$2\cos^{2} x - 1 = \ldots$`;
    }
    sols = [...new Set(sols.map((x) => Math.round(x * 1e9) / 1e9))].sort((x, y) => x - y);
    r.require(sols.length >= 2 && sols.length <= 6);
    const L = degList(sols, 'x');
    const sv = type === 'cos2x-sin' ? '\\sin x' : '\\cos x';
    return {
      stem: md`$${eqTex}$`,
      parts: [
        part({ label: 'a', marks: 2, prompt: type === 'sin2x' ? md`Show that the equation can be written as $\cos x(2\sin x - k) = 0$, and state the value of the constant $k$.` : md`Show that the equation can be written as a quadratic in $s$, where $s = ${sv}$, and give the quadratic.`, answer: partA, scheme: [M1(step), A1(md`$${quad}$`)], hints: [type === 'cos2x-sin' ? md`Use $\cos 2x = 1 - 2\sin^{2} x$ so everything is in $\sin x$.` : type === 'cos2x-cos' ? md`Use $\cos 2x = 2\cos^{2} x - 1$ so everything is in $\cos x$.` : md`Use $\sin 2x = 2\sin x\cos x$.`, type === 'sin2x' ? 'Do not divide by cos x — factorise instead, or you lose solutions.' : 'Collect all the terms on one side.', 'Factorise.'], solution: [step, md`$${quad}$`, ...(type === 'sin2x' ? [md`So $k = ${answerTex(partA)}$`] : [md`With $s = ${sv}$: $${answerTex(partA)}$`])] }),
        part({ label: 'b', marks: 4, prompt: md`Hence solve the equation for $${lo}^{\circ} \leqslant x < ${hi}^{\circ}$, giving your answers to 1 decimal place where appropriate.`, answer: L, scheme: [M1('Solves the quadratic or factorised equation'), A1('Correct values of sin x or cos x (rejecting any outside [−1, 1])'), M1('Finds solutions in the interval'), A1(md`$${answerTex(L)}$`)], hints: ['Solve for the trig ratio first.', 'Reject any value bigger than 1 or less than −1.', 'Use CAST or the graph to find every solution in the interval.'], errors: type === 'sin2x' ? [err('divided-by-cos', degList(sols.filter((x) => Math.abs(Math.cos(x * D)) > 1e-9), 'x'), 'Dividing by cos x loses the solutions where cos x = 0.', 2)] : [], solution: [md`$${quad}$`, md`$x = ${answerTex(L)}$`] }),
      ],
      params: { type, sols },
    };
  },
  verify(inst) {
    const { type } = inst.params as { type: string };
    const xs = (inst.parts[1].answer as ListSpec).items.map(valOf);
    const eqTex = inst.stem!.replace(/^\$|\$$/g, '');
    const [l, rr] = eqTex.split('=');
    const lhs = ex(l),
      rhs = ex(rr);
    const F = (x: number) => evaluate(lhs, { x: x * D }) - evaluate(rhs, { x: x * D });
    for (const x of xs) expect(Math.abs(F(x)) < 1e-6, `${type}: x = ${x} solves the equation`);
  },
});

const templates: Template[] = [compoundExact, exactSurd, doubleAngle, rForm, doubleEq];
export default templates;
