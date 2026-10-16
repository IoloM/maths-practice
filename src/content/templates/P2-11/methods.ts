/** Pure Year 2, Chapter 11 — reverse chain rule, substitution, integration by parts, partial fractions. */
import { Q, gcd } from '../../../engine/core/rational';
import { Poly } from '../../../engine/core/poly';
import { type Expr, evaluate } from '../../../engine/core/expr';
import { answerTex } from '../../../engine/marking/mark';
import { exprToPoly } from '../../../engine/marking/forms';
import type { CustomForm, ExactSpec, ExprSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { checkAntiderivative, checkDefiniteTex, dx, ex, linTex, sumTex } from '../shared/calculus';

const kx = (k: number, v = 'x') => (k === 1 ? v : k === -1 ? `-${v}` : `${k}${v}`);
const xa = (a: number) => linTex(1, a);

/** "Expressed in partial fractions": a sum of terms, each constant ÷ (linear)ⁿ. */
export const PARTIAL_FRACTIONS: CustomForm = {
  label: 'partial fractions',
  check(e: Expr) {
    const terms = e.k === 'add' ? e.a : [e];
    if (terms.length < 2) return 'Write the answer as a sum of separate fractions (partial fractions).';
    const ok = terms.every((t0) => {
      let t = t0;
      if (t.k === 'neg') t = t.a;
      if (t.k === 'mul' && t.a.length === 2 && (t.a[0].k === 'num' || t.a[0].k === 'dec')) t = t.a[1];
      if (t.k !== 'div') return false;
      const n = exprToPoly(t.a, 'x');
      let d = t.b;
      if (d.k === 'pow' && d.b.k === 'num' && d.b.v.isInt) d = d.a;
      const dp = exprToPoly(d, 'x');
      return !!n && n.degree <= 0 && !!dp && dp.degree === 1;
    });
    return ok ? null : 'Each partial fraction should be a constant over a linear factor (or its square).';
  },
};

const fPrimeOverF = defineTemplate({
  id: 'p2.11.reverse-chain-f-prime-over-f',
  family: 'p2.11.reverse-chain',
  title: "Integrals of the form k f′(x)/f(x)",
  spec: ['P8.5', 'P8.2'],
  chapter: 'P2.11',
  sections: ['11.4'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 3,
  time: 4,
  commands: ['Find'],
  tags: ['integration', 'reverse chain rule', 'logarithm'],
  generate(r) {
    const variant = r.pick(['quad', 'trig', 'exp'] as const);
    let fTex: string, FTex: string, inner: string, lo = 0.1,
      hi = 3;
    const m = r.pick([Q.of(1, 2), Q.ONE, Q.of(3, 2), Q.of(2), Q.of(3), Q.of(-1), Q.of(5, 2), Q.of(4)]);
    if (variant === 'quad') {
      const b = r.int(-4, 4),
        c = r.int(Math.floor((b * b) / 4) + 1, 12);
      inner = sumTex([[1, 'x^{2}'], [b, 'x'], [c, '']]);
      const num = Poly.coeffs([m.mul(b), m.mul(2)]);
      fTex = `\\frac{${num.toLatex()}}{${inner}}`;
      FTex = sumTex([[m, `\\ln\\left(${inner}\\right)`]]);
      lo = -3;
    } else if (variant === 'trig') {
      const a = r.int(2, 5);
      const f = r.pick(['sin', 'cos'] as const);
      inner = f === 'sin' ? `${a} + \\sin x` : `${a} + \\cos x`;
      const top = f === 'sin' ? sumTex([[m, '\\cos x']]) : sumTex([[m.neg(), '\\sin x']]);
      fTex = `\\frac{${top}}{${inner}}`;
      FTex = sumTex([[m, `\\ln\\left(${inner}\\right)`]]);
      lo = -3;
    } else {
      const a = r.int(1, 6),
        k = r.pick([1, 2, 3]);
      inner = `e^{${kx(k)}} + ${a}`;
      const top = sumTex([[m.mul(k), `e^{${kx(k)}}`]]);
      fTex = `\\frac{${top}}{${inner}}`;
      FTex = sumTex([[m, `\\ln\\left(${inner}\\right)`]]);
      lo = -2;
      hi = 2;
    }
    const A = ans.integral(ex(FTex), 'x', { x: [lo, hi] });
    return {
      parts: [
        part({
          marks: 3,
          prompt: md`Find $\displaystyle\int ${fTex}${dx}$.`,
          answer: A,
          scheme: [M1(md`Recognises $\int \frac{f'(x)}{f(x)}\,\mathrm{d}x = \ln|f(x)|$ with $f(x) = ${inner}$`), A1(md`Correct coefficient $${m.toLatex()}$`), A1(md`$${answerTex(A)}$`)],
          hints: ['Look at the denominator: is the numerator a multiple of its derivative?', md`$\int \dfrac{f'(x)}{f(x)}\,\mathrm{d}x = \ln|f(x)| + c$.`, md`Differentiate $${inner}$ and compare with the numerator.`],
          errors: [err('no-coefficient', ans.integral(ex(`\\ln\\left(${inner}\\right)`), 'x', { x: [lo, hi] }), 'Check the multiple: compare the numerator with the derivative of the denominator.', 2)],
          solution: [md`$\dfrac{\mathrm{d}}{\mathrm{d}x}\left(${inner}\right)$ is a multiple of the numerator, so the integral is a multiple of $\ln\left(${inner}\right)$.`, md`$\displaystyle\int ${fTex}${dx} = ${answerTex(A)}$`],
        }),
      ],
      params: { fTex, lo, hi },
    };
  },
  verify(inst) {
    checkAntiderivative(inst, 0, inst.params.fTex as string, inst.params.lo as number, inst.params.hi as number);
  },
});

const chainPower = defineTemplate({
  id: 'p2.11.reverse-chain-power',
  family: 'p2.11.reverse-chain',
  title: 'Reverse chain rule: x(ax² + b)ⁿ and trig powers',
  spec: ['P8.5'],
  chapter: 'P2.11',
  sections: ['11.4'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 4,
  time: 5,
  commands: ['Find'],
  tags: ['integration', 'reverse chain rule'],
  generate(r) {
    const variant = r.pick(['poly', 'trig'] as const);
    const k = r.intNZ(-6, 8);
    let fTex: string, FTex: string, guess: string, lo = 0.1,
      hi = 2.5;
    if (variant === 'poly') {
      const a = r.pick([1, 2, 3]),
        b = r.int(1, 6);
      const n = r.pick([Q.of(2), Q.of(3), Q.of(4), Q.of(1, 2), Q.of(-3), Q.of(-2), Q.of(3, 2)]);
      const inner = sumTex([[a, 'x^{2}'], [b, '']]);
      fTex = n.eq(Q.of(1, 2)) ? `${k === 1 ? '' : k === -1 ? '-' : k}x\\sqrt{${inner}}` : `${k === 1 ? '' : k === -1 ? '-' : k}x\\left(${inner}\\right)^{${n.toLatex()}}`;
      const n1 = n.add(1);
      FTex = sumTex([[Q.of(k).div(Q.of(2 * a).mul(n1)), `\\left(${inner}\\right)^{${n1.toLatex()}}`]]);
      guess = `(${inner})^{${n1.toLatex()}}`;
      lo = -2;
    } else {
      const n = r.int(2, 5);
      const f = r.pick(['sin', 'cos'] as const);
      fTex = f === 'sin' ? `${k === 1 ? '' : k === -1 ? '-' : k}\\sin^{${n}} x\\cos x` : `${k === 1 ? '' : k === -1 ? '-' : k}\\cos^{${n}} x\\sin x`;
      FTex = f === 'sin' ? sumTex([[Q.of(k, n + 1), `\\sin^{${n + 1}} x`]]) : sumTex([[Q.of(-k, n + 1), `\\cos^{${n + 1}} x`]]);
      guess = `\\${f}^{${n + 1}} x`;
      lo = -3;
      hi = 3;
    }
    const A = ans.integral(ex(FTex), 'x', { x: [lo, hi] });
    return {
      parts: [
        part({
          marks: 4,
          prompt: md`Find $\displaystyle\int ${fTex}${dx}$.`,
          answer: A,
          scheme: [M1(md`Integral of the form $k${guess}$`), M1('Differentiates their guess to find k (or uses a substitution)'), A1('Correct coefficient'), A1(md`$${answerTex(A)}$`)],
          hints: ['The integrand is a function of an inner expression multiplied by (a multiple of) the derivative of that inner expression.', md`Try differentiating $${guess}$ and compare with the integrand.`, 'Adjust the coefficient so that the derivative matches exactly.'],
          errors: [err('raised-power-only', ans.integral(ex(`${guess}`), 'x', { x: [lo, hi] }), 'Right form, but find the coefficient by differentiating your answer and comparing.', 2)],
          solution: [md`Try $${guess}$ and differentiate using the chain rule, then adjust the coefficient.`, md`$\displaystyle\int ${fTex}${dx} = ${answerTex(A)}$`],
        }),
      ],
      params: { fTex, lo, hi },
    };
  },
  verify(inst) {
    checkAntiderivative(inst, 0, inst.params.fTex as string, inst.params.lo as number, inst.params.hi as number);
  },
});

const subDefinite = defineTemplate({
  id: 'p2.11.substitution-definite',
  family: 'p2.11.substitution',
  title: 'Definite integral by substitution: x√(x + c)',
  spec: ['P8.5'],
  chapter: 'P2.11',
  sections: ['11.5'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 6,
  time: 8,
  commands: ['Use', 'Find'],
  tags: ['integration', 'substitution', 'exact', 'limits'],
  generate(r) {
    const c = r.pick([1, 4, 9, 16]);
    const top = r.pick([4, 9, 16, 25, 36, 49].filter((t) => t > c));
    const b = top - c;
    const k = r.pick([1, 2, 3, 4]);
    const over = r.bool();
    const fTex = over ? `\\frac{${k === 1 ? '' : k}x}{\\sqrt{x + ${c}}}` : `${k === 1 ? '' : k}x\\sqrt{x + ${c}}`;
    const G = over ? Poly.of([[k, Q.of(1, 2)], [-k * c, Q.of(-1, 2)]]) : Poly.of([[k, Q.of(3, 2)], [-k * c, Q.of(1, 2)]]); // k(u − c)u^{±1/2}
    const val = G.definite(c, top);
    const Gi = G.integ();
    const A: ExactSpec = ans.exact(ex(val.toLatex()), ['exact']);
    return {
      parts: [
        part({
          marks: 6,
          prompt: md`Use the substitution $u = x + ${c}$ to find the exact value of $\displaystyle\int_{0}^{${b}} ${fTex}${dx}$.`,
          answer: A,
          scheme: [
            B1(md`$\mathrm{d}u = \mathrm{d}x$ and limits $u = ${c}$ and $u = ${top}$`),
            M1(md`Writes integrand in $u$: $${k === 1 ? '' : k}(u - ${c})u^{\frac{1}{2}}$`),
            A1(md`$${G.toLatex({ v: 'u' })}$`),
            M1('Integrates: uⁿ → uⁿ⁺¹'),
            dM1('Substitutes the u limits and subtracts'),
            A1(md`$${answerTex(A)}$`),
          ],
          hints: [md`With $u = x + ${c}$: $x = u - ${c}$ and $\mathrm{d}x = \mathrm{d}u$. Change the limits too.`, md`The integral becomes $\displaystyle\int_{${c}}^{${top}} ${k === 1 ? '' : k}(u - ${c})\sqrt{u}\,\mathrm{d}u$.`, md`Expand: $${G.toLatex({ v: 'u' })}$.`],
          errors: [err('kept-x-limits', ans.num(Gi.eval(b) - Gi.eval(0), { sf: 3 }), md`When you substitute, change the limits to $u$-values: $u = ${c}$ to $u = ${top}$.`, 3)],
          solution: [
            md`$u = x + ${c} \Rightarrow x = u - ${c}$, $\mathrm{d}x = \mathrm{d}u$; $x = 0 \to u = ${c}$, $x = ${b} \to u = ${top}$`,
            md`$\displaystyle\int_{${c}}^{${top}} \left(${G.toLatex({ v: 'u' })}\right)\mathrm{d}u = \left[${Gi.toLatex({ v: 'u' })}\right]_{${c}}^{${top}}$`,
            md`$= \left(${Gi.evalQ(top).toLatex()}\right) - \left(${Gi.evalQ(c).toLatex()}\right) = ${answerTex(A)}$`,
          ],
        }),
      ],
      params: { fTex, b },
    };
  },
  verify(inst) {
    const { fTex, b } = inst.params as { fTex: string; b: number };
    checkDefiniteTex(fTex, 0, b, evaluate((inst.parts[0].answer as ExactSpec).value));
  },
});

const subIndefinite = defineTemplate({
  id: 'p2.11.substitution-indefinite',
  family: 'p2.11.substitution',
  title: 'Indefinite integral by a given substitution',
  spec: ['P8.5'],
  chapter: 'P2.11',
  sections: ['11.5'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 5,
  time: 7,
  commands: ['Use', 'Find'],
  tags: ['integration', 'substitution'],
  generate(r) {
    const variant = r.pick(['exp', 'root'] as const);
    const a = r.int(1, 6);
    const k = r.pick([1, 2, 3, 4]);
    let fTex: string, FTex: string, subTex: string, uForm: string, lo: number, hi: number;
    if (variant === 'exp') {
      fTex = `\\frac{${k === 1 ? '' : k}e^{2x}}{e^{x} + ${a}}`;
      subTex = `u = e^{x} + ${a}`;
      uForm = sumTex([[k, ''], [-k * a, '\\frac{1}{u}']]);
      FTex = sumTex([[k, 'e^{x}'], [-k * a, `\\ln\\left(e^{x} + ${a}\\right)`]]);
      lo = -2;
      hi = 2;
    } else {
      fTex = `\\frac{${k}}{${a} + \\sqrt{x}}`;
      subTex = `u = ${a} + \\sqrt{x}`;
      uForm = sumTex([[2 * k, ''], [-2 * k * a, '\\frac{1}{u}']]);
      FTex = sumTex([[2 * k, '\\sqrt{x}'], [-2 * k * a, `\\ln\\left(${a} + \\sqrt{x}\\right)`]]);
      lo = 0.2;
      hi = 6;
    }
    const A = ans.integral(ex(FTex), 'x', { x: [lo, hi] });
    return {
      parts: [
        part({
          marks: 5,
          prompt: md`Use the substitution $${subTex}$ to find $\displaystyle\int ${fTex}${dx}$.`,
          answer: A,
          scheme: [B1(variant === 'exp' ? md`$\frac{\mathrm{d}u}{\mathrm{d}x} = e^{x}$` : md`$\frac{\mathrm{d}u}{\mathrm{d}x} = \frac{1}{2\sqrt{x}}$, so $\mathrm{d}x = 2(u - ${a})\,\mathrm{d}u$`), M1('Obtains an integral in u only'), A1(md`$\displaystyle\int \left(${uForm}\right)\mathrm{d}u$`), M1('Integrates to include a ln u term'), A1(md`$${answerTex(A)}$`)],
          hints: [md`Find $\frac{\mathrm{d}u}{\mathrm{d}x}$ and replace $\mathrm{d}x$ by something in terms of $\mathrm{d}u$.`, variant === 'exp' ? md`$e^{2x} = e^{x} \cdot e^{x}$ and $e^{x} = u - ${a}$.` : md`$\sqrt{x} = u - ${a}$, so $\mathrm{d}x = 2\sqrt{x}\,\mathrm{d}u = 2(u - ${a})\,\mathrm{d}u$.`, md`The integral becomes $\displaystyle\int \left(${uForm}\right)\mathrm{d}u$.`],
          errors: [],
          solution: [md`With $${subTex}$, the integral becomes $\displaystyle\int \left(${uForm}\right)\mathrm{d}u = ${sumTex(variant === 'exp' ? [[k, 'u'], [-k * a, '\\ln u']] : [[2 * k, 'u'], [-2 * k * a, '\\ln u']])} + c$.`, md`Substituting back (and absorbing constants into $c$): $${answerTex(A)}$`],
        }),
      ],
      params: { fTex, lo, hi },
    };
  },
  verify(inst) {
    checkAntiderivative(inst, 0, inst.params.fTex as string, inst.params.lo as number, inst.params.hi as number);
  },
});

const partsExpTrig = defineTemplate({
  id: 'p2.11.parts-linear-times-exp-or-trig',
  family: 'p2.11.parts',
  title: 'Integration by parts: (ax + b)eᵏˣ or x sin/cos kx',
  spec: ['P8.5'],
  chapter: 'P2.11',
  sections: ['11.6'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 4,
  time: 6,
  commands: ['Find'],
  tags: ['integration', 'by parts'],
  generate(r) {
    const variant = r.pick(['exp', 'cos', 'sin'] as const);
    const a = r.intNZ(-4, 5),
      b = r.int(-5, 5);
    const k = r.pick(variant === 'exp' ? [1, 2, 3, -1, -2] : [1, 2, 3, 4]);
    const lin = linTex(a, b);
    let fTex: string, FTex: string, first: string;
    if (variant === 'exp') {
      fTex = `\\left(${lin}\\right)e^{${kx(k)}}`;
      FTex = `${sumTex([[Q.of(1, k), `\\left(${lin}\\right)e^{${kx(k)}}`], [Q.of(-a, k * k), `e^{${kx(k)}}`]])}`;
      first = md`$u = ${lin}$, $\frac{\mathrm{d}v}{\mathrm{d}x} = e^{${kx(k)}}$, so $v = \frac{1}{${k}}e^{${kx(k)}}$`;
    } else if (variant === 'cos') {
      fTex = `\\left(${lin}\\right)\\cos ${kx(k)}`;
      FTex = sumTex([[Q.of(1, k), `\\left(${lin}\\right)\\sin ${kx(k)}`], [Q.of(a, k * k), `\\cos ${kx(k)}`]]);
      first = md`$u = ${lin}$, $v = \frac{1}{${k}}\sin ${kx(k)}$`;
    } else {
      fTex = `\\left(${lin}\\right)\\sin ${kx(k)}`;
      FTex = sumTex([[Q.of(-1, k), `\\left(${lin}\\right)\\cos ${kx(k)}`], [Q.of(a, k * k), `\\sin ${kx(k)}`]]);
      first = md`$u = ${lin}$, $v = -\frac{1}{${k}}\cos ${kx(k)}$`;
    }
    const A = ans.integral(ex(FTex), 'x', { x: [-2, 2] });
    return {
      parts: [
        part({
          marks: 4,
          prompt: md`Find $\displaystyle\int ${fTex}${dx}$.`,
          answer: A,
          scheme: [M1(md`Integration by parts in the right direction: ${first}`), A1(md`$uv - \int v\frac{\mathrm{d}u}{\mathrm{d}x}\,\mathrm{d}x$ correct`), dM1('Integrates the second term'), A1(md`$${answerTex(A)}$`)],
          hints: [md`Use $\int u\frac{\mathrm{d}v}{\mathrm{d}x}\,\mathrm{d}x = uv - \int v\frac{\mathrm{d}u}{\mathrm{d}x}\,\mathrm{d}x$.`, 'Choose u to be the linear factor (it becomes simpler when differentiated).', first],
          errors: [err('sign-error', ans.integral(ex(variant === 'exp' ? sumTex([[Q.of(1, k), `\\left(${lin}\\right)e^{${kx(k)}}`], [Q.of(a, k * k), `e^{${kx(k)}}`]]) : variant === 'cos' ? sumTex([[Q.of(1, k), `\\left(${lin}\\right)\\sin ${kx(k)}`], [Q.of(-a, k * k), `\\cos ${kx(k)}`]]) : sumTex([[Q.of(-1, k), `\\left(${lin}\\right)\\cos ${kx(k)}`], [Q.of(-a, k * k), `\\sin ${kx(k)}`]])), 'x', { x: [-2, 2] }), 'Check the sign of the second term: it is uv MINUS ∫ v du/dx dx.', 2)],
          solution: [first, md`$\displaystyle\int ${fTex}${dx} = ${answerTex(A)}$`],
        }),
      ],
      params: { fTex },
    };
  },
  verify(inst) {
    checkAntiderivative(inst, 0, inst.params.fTex as string, -2, 2);
  },
});

const partsLn = defineTemplate({
  id: 'p2.11.parts-ln-definite',
  family: 'p2.11.parts',
  title: 'Integration by parts with ln x (exact definite)',
  spec: ['P8.5', 'P8.3'],
  chapter: 'P2.11',
  sections: ['11.6'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 6,
  time: 8,
  commands: ['Find'],
  tags: ['integration', 'by parts', 'logarithm', 'exact'],
  generate(r) {
    const n = r.int(0, 3);
    const U = r.pick(['e', '2', '3', '4'] as const);
    const kc = r.pick([1, 2, 3, 4, 6]);
    const n1 = n + 1;
    const xPow = n === 0 ? '' : n === 1 ? 'x' : `x^{${n}}`;
    const fTex = `${kc === 1 ? '' : kc}${xPow}\\ln x`;
    let valTex: string;
    if (U === 'e') {
      valTex = n === 0 ? `${kc}` : sumTex([[Q.of(kc * n, n1 * n1), `e^{${n1}}`], [Q.of(kc, n1 * n1), '']]);
    } else {
      const u = Number(U);
      const top = Q.of(kc * u ** n1, n1);
      const rest = Q.of(kc * (u ** n1 - 1), n1 * n1);
      valTex = sumTex([[top, `\\ln ${u}`], [rest.neg(), '']]);
    }
    const A: ExactSpec = ans.exact(ex(valTex), ['exact']);
    const upTex = U === 'e' ? '\\mathrm{e}' : U;
    return {
      parts: [
        part({
          marks: 6,
          prompt: md`Find the exact value of $\displaystyle\int_{1}^{${upTex}} ${fTex}${dx}$.`,
          answer: A,
          scheme: [
            M1(md`Parts with $u = \ln x$, $\frac{\mathrm{d}v}{\mathrm{d}x} = ${xPow || '1'}$`),
            A1(md`$\frac{x^{${n1}}}{${n1}}\ln x - \int \frac{x^{${n1}}}{${n1}} \cdot \frac{1}{x}\,\mathrm{d}x$`),
            dM1('Integrates the second term'),
            A1(md`$\left[\frac{x^{${n1}}}{${n1}}\ln x - \frac{x^{${n1}}}{${n1 * n1}}\right]$`),
            dM1('Substitutes the limits'),
            A1(md`$${answerTex(A)}$`),
          ],
          hints: ['Choose u = ln x — you can differentiate ln x easily but not integrate it.', md`Then $\frac{\mathrm{d}v}{\mathrm{d}x} = ${xPow || '1'}$, so $v = \frac{x^{${n1}}}{${n1}}$.`, md`$\int v\frac{\mathrm{d}u}{\mathrm{d}x}\,\mathrm{d}x = \int \frac{x^{${n}}}{${n1}}\,\mathrm{d}x$.`],
          errors: [err('decimal', ans.num(evaluate(ex(valTex)), { sf: 3 }), 'Give the exact value.', 5)],
          solution: [md`$\displaystyle\int ${fTex}${dx} = \frac{x^{${n1}}}{${n1}}\ln x - \frac{x^{${n1}}}{${n1 * n1}}$`, md`Evaluating from $1$ to $${upTex}$ (note $\ln 1 = 0$${U === 'e' ? ', $\\ln \\mathrm{e} = 1$' : ''}): $${answerTex(A)}$`],
        }),
      ],
      params: { fTex, b: U === 'e' ? Math.E : Number(U) },
    };
  },
  verify(inst) {
    const { fTex, b } = inst.params as { fTex: string; b: number };
    checkDefiniteTex(fTex, 1, b, evaluate((inst.parts[0].answer as ExactSpec).value));
  },
});

const partsTwice = defineTemplate({
  id: 'p2.11.parts-twice',
  family: 'p2.11.parts',
  title: 'Integration by parts twice',
  spec: ['P8.5'],
  chapter: 'P2.11',
  sections: ['11.6'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 5,
  marks: 6,
  time: 9,
  commands: ['Find'],
  tags: ['integration', 'by parts', 'repeated'],
  generate(r) {
    const variant = r.pick(['exp', 'cos', 'sin'] as const);
    const k = r.pick(variant === 'exp' ? [1, 2, 3, -1, -2] : [1, 2, 3]);
    const c = r.pick([1, 2, 3, 4]);
    const cx2 = c === 1 ? 'x^{2}' : `${c}x^{2}`;
    let fTex: string, FTex: string;
    if (variant === 'exp') {
      fTex = `${cx2}e^{${kx(k)}}`;
      FTex = sumTex([[Q.of(c, k), `x^{2}e^{${kx(k)}}`], [Q.of(-2 * c, k * k), `xe^{${kx(k)}}`], [Q.of(2 * c, k * k * k), `e^{${kx(k)}}`]]);
    } else if (variant === 'cos') {
      fTex = `${cx2}\\cos ${kx(k)}`;
      FTex = sumTex([[Q.of(c, k), `x^{2}\\sin ${kx(k)}`], [Q.of(2 * c, k * k), `x\\cos ${kx(k)}`], [Q.of(-2 * c, k * k * k), `\\sin ${kx(k)}`]]);
    } else {
      fTex = `${cx2}\\sin ${kx(k)}`;
      FTex = sumTex([[Q.of(-c, k), `x^{2}\\cos ${kx(k)}`], [Q.of(2 * c, k * k), `x\\sin ${kx(k)}`], [Q.of(2 * c, k * k * k), `\\cos ${kx(k)}`]]);
    }
    const A = ans.integral(ex(FTex), 'x', { x: [-2, 2] });
    return {
      parts: [
        part({
          marks: 6,
          prompt: md`Find $\displaystyle\int ${fTex}${dx}$.`,
          answer: A,
          scheme: [M1(md`First application with $u = ${cx2}$`), A1('Correct first stage'), M1('Second application of parts on the remaining integral'), A1('Correct second stage'), dM1('Combines all terms'), A1(md`$${answerTex(A)}$`)],
          hints: [md`Take $u = ${cx2}$. After one application you will have an integral of the form $\int x \times (\dots)\,\mathrm{d}x$.`, 'Apply integration by parts again to that integral, with u = x.', 'Collect the three terms carefully — watch the signs.'],
          errors: [],
          solution: [md`Apply parts twice (first with $u = ${cx2}$, then with $u = x$):`, md`$\displaystyle\int ${fTex}${dx} = ${answerTex(A)}$`],
        }),
      ],
      params: { fTex },
    };
  },
  verify(inst) {
    checkAntiderivative(inst, 0, inst.params.fTex as string, -2, 2);
  },
});

function pfSetup(r: import('../../../engine/core/rng').Rng) {
  const a = r.int(-3, 4),
    b = r.intExcept(-3, 5, [a]);
  const A = r.intNZ(-5, 6),
    B = r.intNZ(-5, 6);
  // A/(x+a) + B/(x+b) = ((A+B)x + Ab + Ba)/((x+a)(x+b))
  const p = A + B,
    q = A * b + B * a;
  return { a, b, A, B, p, q };
}

const pfDefinite = defineTemplate({
  id: 'p2.11.partial-fractions-definite',
  family: 'p2.11.partial-fractions',
  title: 'Partial fractions, then an exact definite integral',
  spec: ['P8.6', 'P2.10'],
  chapter: 'P2.11',
  sections: ['11.7'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 8,
  time: 11,
  commands: ['Express', 'Hence', 'Find'],
  tags: ['integration', 'partial fractions', 'logarithms', 'exact'],
  generate(r) {
    const s = pfSetup(r);
    r.require(s.p !== 0 || s.q !== 0);
    const lo = Math.max(-s.a, -s.b) + r.int(1, 3);
    const hi = lo + r.int(1, 4);
    const fTex = `\\frac{${linTex(s.p, s.q)}}{(${xa(s.a)})(${xa(s.b)})}`;
    const pfTex = sumTex([[Math.sign(s.A), `\\frac{${Math.abs(s.A)}}{${xa(s.a)}}`], [Math.sign(s.B), `\\frac{${Math.abs(s.B)}}{${xa(s.b)}}`]]);
    const E: ExprSpec = ans.expr(ex(pfTex), ['x'], { domain: { x: [lo, hi + 1] }, forms: [PARTIAL_FRACTIONS] });
    // value: A ln((hi+a)/(lo+a)) + B ln((hi+b)/(lo+b)) = ln R
    const r1 = Q.of(hi + s.a, lo + s.a),
      r2 = Q.of(hi + s.b, lo + s.b);
    const R = r1.pow(s.A).mul(r2.pow(s.B));
    r.require(R.n < 1e6 && R.d < 1e6 && !R.eq(1));
    const V: ExactSpec = ans.exact(ex(`\\ln\\left(${R.toLatex()}\\right)`), ['exact', 'single-log']);
    return {
      stem: md`$\mathrm{f}(x) = ${fTex}$, $\; x > ${Math.max(-s.a, -s.b)}$.`,
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: md`Express $\mathrm{f}(x)$ in partial fractions.`,
          answer: E,
          scheme: [M1(md`$${linTex(s.p, s.q)} \equiv A(${xa(s.b)}) + B(${xa(s.a)})$`), A1(md`One of $A = ${s.A}$, $B = ${s.B}$`), A1(md`$${pfTex}$`)],
          hints: [md`Write $\mathrm{f}(x) = \dfrac{A}{${xa(s.a)}} + \dfrac{B}{${xa(s.b)}}$ and multiply through by the denominator.`, md`Substitute $x = ${-s.a}$ and $x = ${-s.b}$ to find $A$ and $B$.`, md`$${linTex(s.p, s.q)} \equiv A(${xa(s.b)}) + B(${xa(s.a)})$`],
          solution: [md`$${linTex(s.p, s.q)} \equiv A(${xa(s.b)}) + B(${xa(s.a)})$`, md`$x = ${-s.a}$: $A = ${s.A}$; $\; x = ${-s.b}$: $B = ${s.B}$`, md`$\mathrm{f}(x) = ${answerTex(E)}$`],
        }),
        part({
          label: 'b',
          marks: 5,
          prompt: md`Hence find $\displaystyle\int_{${lo}}^{${hi}} \mathrm{f}(x)${dx}$, giving your answer in the form $\ln k$, where $k$ is a rational number.`,
          answer: V,
          scheme: [M1(md`$\frac{A}{x + a} \to A\ln|x + a|$`), A1(md`$${s.A}\ln|${xa(s.a)}| ${s.B < 0 ? '-' : '+'} ${Math.abs(s.B)}\ln|${xa(s.b)}|$`), dM1('Substitutes limits'), M1('Uses log laws to combine'), A1(md`$${answerTex(V)}$`)],
          hints: ['Integrate each partial fraction to a logarithm.', md`$\left[${s.A}\ln(${xa(s.a)}) ${s.B < 0 ? '-' : '+'} ${Math.abs(s.B)}\ln(${xa(s.b)})\right]_{${lo}}^{${hi}}$`, 'Use k ln m = ln mᵏ and ln a + ln b = ln ab to combine into one logarithm.'],
          errors: [err('decimal', ans.num(Math.log(R.value), { sf: 3 }), 'Give the exact answer as a single logarithm.', 3)],
          solution: [
            md`$\left[${s.A}\ln(${xa(s.a)}) ${s.B < 0 ? '-' : '+'} ${Math.abs(s.B)}\ln(${xa(s.b)})\right]_{${lo}}^{${hi}} = ${s.A}\ln\frac{${hi + s.a}}{${lo + s.a}} ${s.B < 0 ? '-' : '+'} ${Math.abs(s.B)}\ln\frac{${hi + s.b}}{${lo + s.b}}$`,
            md`$= ${answerTex(V)}$`,
          ],
        }),
      ],
      params: { fTex, lo, hi },
    };
  },
  verify(inst) {
    const { fTex, lo, hi } = inst.params as { fTex: string; lo: number; hi: number };
    checkDefiniteTex(fTex, lo, hi, evaluate((inst.parts[1].answer as ExactSpec).value));
    const e = (inst.parts[0].answer as ExprSpec).value;
    const f = ex(fTex);
    for (const x of [lo + 0.3, hi + 0.7]) expect2(Math.abs(evaluate(e, { x }) - evaluate(f, { x })) < 1e-9, 'partial fractions identity');
  },
});

function expect2(c: boolean, m: string) {
  if (!c) throw new Error(m);
}

const pfIndefinite = defineTemplate({
  id: 'p2.11.partial-fractions-indefinite',
  family: 'p2.11.partial-fractions',
  title: 'Integrate a rational function using partial fractions',
  spec: ['P8.6'],
  chapter: 'P2.11',
  sections: ['11.7'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 7,
  commands: ['Find'],
  tags: ['integration', 'partial fractions', 'logarithms'],
  generate(r) {
    const s = pfSetup(r);
    const k = r.pick([1, 1, 2]);
    // optional scaling of one denominator: (kx + a)
    const den2 = k === 1 ? xa(s.b) : linTex(k, s.b);
    const A = s.A,
      B = s.B;
    // A/(x+a) + B/(kx+b) = (A(kx+b) + B(x+a)) / ...
    const p = A * k + B,
      q = A * s.b + B * s.a;
    r.require(p !== 0 || q !== 0);
    const fTex = `\\frac{${linTex(p, q)}}{(${xa(s.a)})(${den2})}`;
    const FTex = sumTex([[A, `\\ln\\left|${xa(s.a)}\\right|`], [Q.of(B, k), `\\ln\\left|${den2}\\right|`]]);
    const lo = Math.max(-s.a, -s.b / k) + 0.3;
    const Ans = ans.integral(ex(FTex), 'x', { x: [lo, lo + 4] });
    return {
      parts: [
        part({
          marks: 5,
          prompt: md`Find $\displaystyle\int ${fTex}${dx}$, $x > ${fmtNum(Math.max(-s.a, -s.b / k))}$.`,
          answer: Ans,
          scheme: [M1('Splits into partial fractions'), A1(md`$\frac{${A}}{${xa(s.a)}} ${B < 0 ? '-' : '+'} \frac{${Math.abs(B)}}{${den2}}$`), M1('Integrates to logarithms'), A1('One term correct'), A1(md`$${answerTex(Ans)}$`)],
          hints: ['Write the fraction as A/(first factor) + B/(second factor).', 'Find A and B by substituting values of x that make a factor zero.', md`Then $\int \frac{B}{kx + b}\,\mathrm{d}x = \frac{B}{k}\ln|kx + b|$.`],
          errors: k > 1 ? [err('no-divide-k', ans.integral(ex(sumTex([[A, `\\ln\\left|${xa(s.a)}\\right|`], [B, `\\ln\\left|${den2}\\right|`]])), 'x', { x: [lo, lo + 4] }), md`Divide by $${k}$ when integrating $\frac{1}{${den2}}$.`, 4)] : [],
          solution: [md`$${fTex} = \frac{${A}}{${xa(s.a)}} ${B < 0 ? '-' : '+'} \frac{${Math.abs(B)}}{${den2}}$`, md`$\displaystyle\int ${fTex}${dx} = ${answerTex(Ans)}$`],
        }),
      ],
      params: { fTex, lo },
    };
  },
  verify(inst) {
    const lo = inst.params.lo as number;
    checkAntiderivative(inst, 0, inst.params.fTex as string, lo, lo + 4);
  },
});

function fmtNum(x: number) {
  return Number.isInteger(x) ? String(x) : String(Math.round(x * 100) / 100);
}

const pfRepeated = defineTemplate({
  id: 'p2.11.partial-fractions-repeated-factor',
  family: 'p2.11.partial-fractions',
  title: 'Partial fractions with a repeated factor, then integrate',
  spec: ['P8.6', 'P2.10'],
  chapter: 'P2.11',
  sections: ['11.7'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 5,
  marks: 9,
  time: 13,
  commands: ['Express', 'Hence', 'Find'],
  tags: ['integration', 'partial fractions', 'repeated factor', 'exact'],
  generate(r) {
    const a = r.int(-2, 3),
      b = r.intExcept(-2, 4, [a]);
    const A = r.intNZ(-4, 5),
      B = r.intNZ(-4, 5),
      C = r.intNZ(-6, 6);
    // A/(x+a) + B/(x+b) + C/(x+b)^2 over (x+a)(x+b)^2
    const num = Poly.coeffs([A]).mul(Poly.fromRoots([-b, -b])).add(Poly.coeffs([B]).mul(Poly.fromRoots([-a, -b]))).add(Poly.coeffs([C]).mul(Poly.fromRoots([-a])));
    const lo = Math.max(-a, -b) + r.int(1, 2),
      hi = lo + r.int(1, 3);
    const fTex = `\\frac{${num.toLatex()}}{(${xa(a)})(${xa(b)})^{2}}`;
    const pfTex = sumTex([[Math.sign(A), `\\frac{${Math.abs(A)}}{${xa(a)}}`], [Math.sign(B), `\\frac{${Math.abs(B)}}{${xa(b)}}`], [Math.sign(C), `\\frac{${Math.abs(C)}}{(${xa(b)})^{2}}`]]);
    const E = ans.expr(ex(pfTex), ['x'], { domain: { x: [lo, hi + 1] }, forms: [PARTIAL_FRACTIONS] });
    const rat = Q.of(C).mul(Q.of(1, lo + b).sub(Q.of(1, hi + b)));
    const valTex = sumTex([[A, `\\ln\\left(${Q.of(hi + a, lo + a).toLatex()}\\right)`], [B, `\\ln\\left(${Q.of(hi + b, lo + b).toLatex()}\\right)`], [rat, '']]);
    const V = ans.exact(ex(valTex), ['exact']);
    return {
      stem: md`$\mathrm{f}(x) = ${fTex}$, $\; x > ${Math.max(-a, -b)}$.`,
      parts: [
        part({
          label: 'a',
          marks: 4,
          prompt: md`Express $\mathrm{f}(x)$ in the form $\dfrac{A}{${xa(a)}} + \dfrac{B}{${xa(b)}} + \dfrac{C}{(${xa(b)})^{2}}$.`,
          answer: E,
          scheme: [M1('Correct identity for the numerator'), A1('One constant correct'), A1('Two constants correct'), A1(md`$${pfTex}$`)],
          hints: [md`$${num.toLatex()} \equiv A(${xa(b)})^{2} + B(${xa(a)})(${xa(b)}) + C(${xa(a)})$`, md`Substitute $x = ${-a}$ to find $A$ and $x = ${-b}$ to find $C$.`, md`Compare coefficients of $x^{2}$ to find $B$.`],
          solution: [md`$${num.toLatex()} \equiv A(${xa(b)})^{2} + B(${xa(a)})(${xa(b)}) + C(${xa(a)})$`, md`$A = ${A}$, $B = ${B}$, $C = ${C}$: $\mathrm{f}(x) = ${answerTex(E)}$`],
        }),
        part({
          label: 'b',
          marks: 5,
          prompt: md`Hence find the exact value of $\displaystyle\int_{${lo}}^{${hi}} \mathrm{f}(x)${dx}$.`,
          answer: V,
          scheme: [M1('ln terms from the linear factors'), M1(md`$\frac{C}{(x + b)^{2}} \to -\frac{C}{x + b}$`), A1('Correct integral'), dM1('Substitutes limits'), A1(md`$${answerTex(V)}$`)],
          hints: [md`$\int \frac{1}{(x + b)^{2}}\,\mathrm{d}x = -\frac{1}{x + b}$ — it is not a logarithm.`, 'Integrate each term, then substitute the limits.', 'Combine logs or leave as separate log terms — both are exact.'],
          errors: [err('repeated-as-log', ans.exact(ex(sumTex([[A, `\\ln\\left(${Q.of(hi + a, lo + a).toLatex()}\\right)`], [Q.of(B + C), `\\ln\\left(${Q.of(hi + b, lo + b).toLatex()}\\right)`]]))), 'The squared term does not integrate to a logarithm: ∫ (x + b)⁻² dx = −(x + b)⁻¹.', 2)],
          solution: [md`$\displaystyle\int \mathrm{f}(x)${dx} = ${sumTex([[A, `\\ln(${xa(a)})`], [B, `\\ln(${xa(b)})`], [-C, `\\frac{1}{${xa(b)}}`]])}$`, md`Between $${lo}$ and $${hi}$: $${answerTex(V)}$`],
        }),
      ],
      params: { fTex, lo, hi },
    };
  },
  verify(inst) {
    const { fTex, lo, hi } = inst.params as { fTex: string; lo: number; hi: number };
    checkDefiniteTex(fTex, lo, hi, evaluate((inst.parts[1].answer as ExactSpec).value));
  },
});

void gcd;

const templates: Template[] = [fPrimeOverF, chainPower, subDefinite, subIndefinite, partsExpTrig, partsLn, partsTwice, pfDefinite, pfIndefinite, pfRepeated];
export default templates;
