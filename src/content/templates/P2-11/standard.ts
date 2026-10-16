/** Pure Year 2, Chapter 11 — integrating standard functions, f(ax + b), trig identities, exact definite integrals. */
import { Q } from '../../../engine/core/rational';
import { evaluate } from '../../../engine/core/expr';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, IntegralSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import type { Rng } from '../../../engine/core/rng';
import { checkAntiderivative, checkDefiniteTex, dx, ex, linTex, sumTex } from '../shared/calculus';

const kx = (k: number, v = 'x') => (k === 1 ? v : k === -1 ? `-${v}` : `${k}${v}`);
const ekx = (k: number) => `e^{${kx(k)}}`;
const trig = (f: string, k: number) => `\\${f} ${k === 1 ? 'x' : `${k}x`}`;

const standard = defineTemplate({
  id: 'p2.11.integrate-standard-functions',
  family: 'p2.11.standard',
  title: 'Integrate eᵏˣ, 1/x and sin kx',
  spec: ['P8.2'],
  chapter: 'P2.11',
  sections: ['11.1', '11.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Find'],
  tags: ['integration', 'exponential', 'logarithm', 'trigonometry'],
  generate(r) {
    const a = r.intNZ(-6, 8),
      k = r.pick([-3, -2, -1, 2, 3, 4]);
    const b = r.intNZ(-7, 7);
    const c = r.intNZ(-6, 6),
      m = r.pick([1, 2, 3, 4]);
    const trigF = r.pick(['sin', 'cos'] as const);
    const fTex = sumTex([
      [a, ekx(k)],
      [Math.sign(b), `\\frac{${Math.abs(b)}}{x}`],
      [c, trig(trigF, m)],
    ]);
    const FTex = sumTex([
      [Q.of(a, k), ekx(k)],
      [b, '\\ln x'],
      [trigF === 'sin' ? Q.of(-c, m) : Q.of(c, m), trig(trigF === 'sin' ? 'cos' : 'sin', m)],
    ]);
    const A: IntegralSpec = ans.integral(ex(FTex), 'x', { x: [0.4, 3] });
    const noDivTex = sumTex([
      [a, ekx(k)],
      [b, '\\ln x'],
      [trigF === 'sin' ? -c : c, trig(trigF === 'sin' ? 'cos' : 'sin', m)],
    ]);
    const signTex = sumTex([
      [Q.of(a, k), ekx(k)],
      [b, '\\ln x'],
      [trigF === 'sin' ? Q.of(c, m) : Q.of(-c, m), trig(trigF === 'sin' ? 'cos' : 'sin', m)],
    ]);
    return {
      parts: [
        part({
          marks: 4,
          prompt: md`Given that $x > 0$, find $\displaystyle\int \left(${fTex}\right)${dx}$.`,
          answer: A,
          scheme: [M1(md`$${ekx(k)} \to \frac{1}{${k}}${ekx(k)}$`), B1(md`$\frac{${b}}{x} \to ${b}\ln x$`), M1(md`$${'\\' + trigF} ${m === 1 ? '' : m}x \to ${trigF === 'sin' ? '-' : ''}\frac{1}{${m}}${trigF === 'sin' ? '\\cos' : '\\sin'} ${m === 1 ? '' : m}x$`), A1(md`$${answerTex(A)}$`)],
          hints: [
            'Integrate each term using the standard results.',
            md`$\int e^{kx}\,\mathrm{d}x = \frac{1}{k}e^{kx}$, $\int \frac{1}{x}\,\mathrm{d}x = \ln|x|$, $\int \sin kx\,\mathrm{d}x = -\frac{1}{k}\cos kx$, $\int \cos kx\,\mathrm{d}x = \frac{1}{k}\sin kx$.`,
            md`The exponential term integrates to $\frac{${a}}{${k}}${ekx(k)}$.`,
          ],
          errors: [
            err('no-divide-k', ans.integral(ex(noDivTex), 'x', { x: [0.4, 3] }), 'Remember to divide by the coefficient of x: ∫ e^{kx} dx = (1/k)e^{kx}, ∫ sin kx dx = −(1/k) cos kx.', 2),
            err('trig-sign', ans.integral(ex(signTex), 'x', { x: [0.4, 3] }), 'Check the sign: ∫ sin kx dx = −(1/k) cos kx and ∫ cos kx dx = +(1/k) sin kx.', 3),
          ],
          solution: [md`$\displaystyle\int \left(${fTex}\right)${dx} = ${answerTex(A)}$`],
        }),
      ],
      params: { fTex },
    };
  },
  verify(inst) {
    checkAntiderivative(inst, 0, inst.params.fTex as string, 0.4, 3);
  },
});

const secTrig = defineTemplate({
  id: 'p2.11.integrate-cos-sec-squared',
  family: 'p2.11.standard',
  title: 'Integrate cos kx and sec² kx',
  spec: ['P8.2'],
  chapter: 'P2.11',
  sections: ['11.1', '11.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 2,
  marks: 3,
  time: 4,
  commands: ['Find'],
  tags: ['integration', 'trigonometry'],
  generate(r) {
    const a = r.intNZ(-8, 8),
      k = r.pick([1, 2, 3, 4, 5]);
    const b = r.intNZ(-8, 8),
      m = r.pick([1, 2, 3, 4]);
    const third = r.bool() ? r.intNZ(-5, 5) : 0;
    const fTex = sumTex([
      [a, trig('cos', k)],
      [b, `\\sec^{2} ${m === 1 ? 'x' : `${m}x`}`],
      [third, ''],
    ]);
    const FTex = sumTex([
      [Q.of(a, k), trig('sin', k)],
      [Q.of(b, m), trig('tan', m)],
      [third, 'x'],
    ]);
    const hi = Math.min(1.2, 1.2 / m);
    const A = ans.integral(ex(FTex), 'x', { x: [0.05, hi] });
    return {
      parts: [
        part({
          marks: 3,
          prompt: md`Find $\displaystyle\int \left(${fTex}\right)${dx}$.`,
          answer: A,
          scheme: [M1(md`$\cos ${kx(k)} \to \pm\frac{1}{${k}}\sin ${kx(k)}$ or $\sec^{2} ${kx(m)} \to \frac{1}{${m}}\tan ${kx(m)}$`), A1('One term correct'), A1(md`$${answerTex(A)}$`)],
          hints: [md`$\int \sec^{2} kx\,\mathrm{d}x = \frac{1}{k}\tan kx$ (from the formula booklet: $\frac{\mathrm{d}}{\mathrm{d}x}\tan kx = k\sec^{2} kx$).`, md`$\int \cos kx\,\mathrm{d}x = \frac{1}{k}\sin kx$.`, md`First term: $\frac{${a}}{${k}}\sin ${kx(k)}$.`],
          errors: [err('differentiated', ans.expr(ex(sumTex([[-a * k, trig('sin', k)], [2 * b * m, `\\sec^{2} ${kx(m)}\\tan ${kx(m)}`]])), ['x'], { domain: { x: [0.05, hi] } }), 'You differentiated instead of integrating.')],
          solution: [md`$\displaystyle\int \left(${fTex}\right)${dx} = ${answerTex(A)}$`],
        }),
      ],
      params: { fTex, hi },
    };
  },
  verify(inst) {
    checkAntiderivative(inst, 0, inst.params.fTex as string, 0.05, inst.params.hi as number);
  },
});

function linearComposite(r: Rng) {
  const p = r.pick([2, 3, 4, 5]),
    q = r.int(1, 7);
  const L = linTex(p, q);
  const kind = r.pick(['power', 'recip', 'exp'] as const);
  const k = r.intNZ(-6, 6);
  if (kind === 'power') {
    const n = r.pick([Q.of(3), Q.of(4), Q.of(5), Q.of(-2), Q.of(-3), Q.of(1, 2), Q.of(3, 2), Q.of(-1, 2)]);
    const n1 = n.add(1);
    const fTex = n.eq(Q.of(1, 2)) ? `${k === 1 ? '' : k === -1 ? '-' : k}\\sqrt{${L}}` : `${k === 1 ? '' : k === -1 ? '-' : k}\\left(${L}\\right)^{${n.toLatex()}}`;
    const coef = Q.of(k).div(Q.of(p).mul(n1));
    const FTex = sumTex([[coef, `\\left(${L}\\right)^{${n1.toLatex()}}`]]);
    const wrong = sumTex([[Q.of(k).div(n1), `\\left(${L}\\right)^{${n1.toLatex()}}`]]);
    return { fTex, FTex, wrong, kind, p, q, desc: md`$\int (ax + b)^{n}\,\mathrm{d}x = \dfrac{(ax + b)^{n+1}}{a(n+1)}$` };
  }
  if (kind === 'recip') {
    const fTex = `\\frac{${k}}{${L}}`;
    const FTex = sumTex([[Q.of(k, p), `\\ln\\left|${L}\\right|`]]);
    const wrong = sumTex([[k, `\\ln\\left|${L}\\right|`]]);
    return { fTex, FTex, wrong, kind, p, q, desc: md`$\int \dfrac{1}{ax + b}\,\mathrm{d}x = \dfrac{1}{a}\ln|ax + b|$` };
  }
  const fTex = `${k === 1 ? '' : k === -1 ? '-' : k}e^{${L}}`;
  const FTex = sumTex([[Q.of(k, p), `e^{${L}}`]]);
  const wrong = sumTex([[k * p, `e^{${L}}`]]);
  return { fTex, FTex, wrong, kind, p, q, desc: md`$\int e^{ax + b}\,\mathrm{d}x = \dfrac{1}{a}e^{ax + b}$` };
}

const composite = defineTemplate({
  id: 'p2.11.integrate-f-ax-plus-b',
  family: 'p2.11.standard',
  title: 'Integrate f(ax + b)',
  spec: ['P8.2', 'P8.5'],
  chapter: 'P2.11',
  sections: ['11.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 2,
  marks: 3,
  time: 4,
  commands: ['Find'],
  tags: ['integration', 'chain rule', 'linear substitution'],
  generate(r) {
    const c = linearComposite(r);
    const A = ans.integral(ex(c.FTex), 'x', { x: [0.2, 3] });
    return {
      parts: [
        part({
          marks: 3,
          prompt: md`Find $\displaystyle\int ${c.fTex}${dx}$.`,
          answer: A,
          scheme: [M1('Correct form of the integral'), M1(md`Divides by $${c.p}$ (the coefficient of $x$)`), A1(md`$${answerTex(A)}$`)],
          hints: ['Think of the inside as a linear function ax + b.', c.desc, md`Here $a = ${c.p}$.`],
          errors: [err('no-divide-a', ans.integral(ex(c.wrong), 'x', { x: [0.2, 3] }), md`Reverse the chain rule: you must divide by $${c.p}$, the coefficient of $x$.`, 1)],
          solution: [md`Using ${c.desc}: $\displaystyle\int ${c.fTex}${dx} = ${answerTex(A)}$`],
        }),
      ],
      params: { fTex: c.fTex },
    };
  },
  verify(inst) {
    checkAntiderivative(inst, 0, inst.params.fTex as string, 0.2, 3);
  },
});

const identities = defineTemplate({
  id: 'p2.11.integrate-using-trig-identities',
  family: 'p2.11.trig-identities',
  title: 'Integrate sin²kx, cos²kx or tan²kx using identities',
  spec: ['P8.2', 'P5.6'],
  chapter: 'P2.11',
  sections: ['11.3'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 4,
  time: 6,
  commands: ['Find'],
  tags: ['integration', 'trigonometric identities', 'double angle'],
  generate(r) {
    const kind = r.pick(['sin2', 'cos2', 'tan2'] as const);
    const k = r.pick([1, 2, 3, 4]);
    const a = r.pick([1, 2, 3, 4, 6, 8]);
    const K = kx(k),
      K2 = kx(2 * k);
    let fTex: string, FTex: string, idTex: string, rew: string;
    if (kind === 'sin2') {
      fTex = `${a === 1 ? '' : a}\\sin^{2} ${K}`;
      idTex = `\\sin^{2} ${K} = \\frac{1}{2}(1 - \\cos ${K2})`;
      rew = sumTex([[Q.of(a, 2), ''], [Q.of(-a, 2), `\\cos ${K2}`]]);
      FTex = sumTex([[Q.of(a, 2), 'x'], [Q.of(-a, 4 * k), `\\sin ${K2}`]]);
    } else if (kind === 'cos2') {
      fTex = `${a === 1 ? '' : a}\\cos^{2} ${K}`;
      idTex = `\\cos^{2} ${K} = \\frac{1}{2}(1 + \\cos ${K2})`;
      rew = sumTex([[Q.of(a, 2), ''], [Q.of(a, 2), `\\cos ${K2}`]]);
      FTex = sumTex([[Q.of(a, 2), 'x'], [Q.of(a, 4 * k), `\\sin ${K2}`]]);
    } else {
      fTex = `${a === 1 ? '' : a}\\tan^{2} ${K}`;
      idTex = `\\tan^{2} ${K} = \\sec^{2} ${K} - 1`;
      rew = sumTex([[a, `\\sec^{2} ${K}`], [-a, '']]);
      FTex = sumTex([[Q.of(a, k), `\\tan ${K}`], [-a, 'x']]);
    }
    const hi = kind === 'tan2' ? Math.min(1.2, 1.2 / k) : 3;
    const A = ans.integral(ex(FTex), 'x', { x: [0.05, hi] });
    const naive = kind === 'tan2' ? sumTex([[Q.of(a, 3), `\\tan^{3} ${K}`]]) : sumTex([[Q.of(a, 3), `\\${kind === 'sin2' ? 'sin' : 'cos'}^{3} ${K}`]]);
    return {
      parts: [
        part({
          marks: 4,
          prompt: md`Find $\displaystyle\int ${fTex}${dx}$.`,
          answer: A,
          scheme: [M1(md`Uses $${idTex}$`), A1(md`Integrand $= ${rew}$`), dM1('Integrates each term'), A1(md`$${answerTex(A)}$`)],
          hints: ['You cannot integrate a square of a trig function directly — rewrite it with an identity first.', md`Use $${idTex}$.`, md`The integrand becomes $${rew}$.`],
          errors: [err('power-rule', ans.integral(ex(naive), 'x', { x: [0.05, hi] }), 'You cannot treat a trig function like x: rewrite using an identity before integrating.')],
          solution: [md`$${idTex}$, so $${fTex} = ${rew}$.`, md`$\displaystyle\int \left(${rew}\right)${dx} = ${answerTex(A)}$`],
        }),
      ],
      params: { fTex, hi },
    };
  },
  verify(inst) {
    checkAntiderivative(inst, 0, inst.params.fTex as string, 0.05, inst.params.hi as number);
  },
});

const exactLog = defineTemplate({
  id: 'p2.11.definite-exact-log-exp',
  family: 'p2.11.definite-exact',
  title: 'Exact definite integrals with ln and e',
  spec: ['P8.3', 'P8.2'],
  chapter: 'P2.11',
  sections: ['11.1'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 4,
  time: 6,
  commands: ['Find', 'Show that'],
  tags: ['integration', 'exact', 'logarithms', 'exponentials'],
  generate(r) {
    const variant = r.pick(['log', 'exp'] as const);
    if (variant === 'log') {
      const p = r.intNZ(-8, 9),
        q = r.intNZ(-4, 4);
      const a = r.pick([1, 2, 3]),
        b = a * r.pick([2, 3, 4, 5]);
      const fTex = sumTex([[Math.sign(p), `\\frac{${Math.abs(p)}}{x}`], [q, 'x']]);
      const ratio = b / a;
      const rat = Q.of(q).mul(Q.of(b * b - a * a, 2));
      const ansTex = sumTex([[rat, ''], [p, `\\ln ${ratio}`]]);
      const A: ExactSpec = ans.exact(ex(ansTex), ['exact']);
      return {
        parts: [
          part({
            marks: 4,
            prompt: md`Show that $\displaystyle\int_{${a}}^{${b}} \left(${fTex}\right)${dx}$ can be written in the form $m + n\ln k$, and find its exact value.`,
            answer: A,
            scheme: [M1(md`$\frac{${p}}{x} \to ${p}\ln x$`), A1(md`$\left[${sumTex([[p, '\\ln x'], [Q.of(q, 2), 'x^{2}']])}\right]_{${a}}^{${b}}$`), dM1('Substitutes limits and uses a log law'), A1(md`$${answerTex(A)}$`)],
            hints: [md`$\int \frac{1}{x}\,\mathrm{d}x = \ln x$ for $x > 0$.`, md`After substituting, combine $\ln ${b} - \ln ${a} = \ln \frac{${b}}{${a}}$.`, md`$\left[${sumTex([[p, '\\ln x'], [Q.of(q, 2), 'x^{2}']])}\right]_{${a}}^{${b}}$`],
            errors: [err('decimal', ans.num(evaluate(ex(ansTex)), { sf: 3 }), 'Give an exact answer, using ln.', 3)],
            solution: [md`$\left[${sumTex([[p, '\\ln x'], [Q.of(q, 2), 'x^{2}']])}\right]_{${a}}^{${b}} = ${p}(\ln ${b} - \ln ${a}) + \frac{${q}}{2}(${b}^{2} - ${a}^{2})$`, md`$= ${answerTex(A)}$`],
          }),
        ],
        params: { fTex, a, b },
      };
    }
    const k = r.pick([1, 2, 3]);
    const n = r.pick([2, 3, 4, 5]);
    const c = r.intNZ(-6, 6);
    const fTex = sumTex([[c, `e^{${kx(k)}}`]]);
    const val = Q.of(c, k).mul(Q.of(n).pow(k).sub(1));
    const A: ExactSpec = ans.exact(ex(val.toLatex()), ['exact']);
    return {
      parts: [
        part({
          marks: 4,
          prompt: md`Find the exact value of $\displaystyle\int_{0}^{\ln ${n}} ${fTex}${dx}$.`,
          answer: A,
          scheme: [M1(md`$e^{${kx(k)}} \to \frac{1}{${k}}e^{${kx(k)}}$`), A1('Correct integral'), M1(md`Uses $e^{${k}\ln ${n}} = ${n}^{${k}}$`), A1(md`$${answerTex(A)}$`)],
          hints: [md`$\int e^{kx}\,\mathrm{d}x = \frac{1}{k}e^{kx}$.`, md`At the upper limit, $e^{${k}\ln ${n}} = e^{\ln ${n}^{${k}}} = ${n ** k}$.`, md`At the lower limit, $e^{0} = 1$.`],
          errors: [err('kept-e', ans.num(evaluate(ex(val.toLatex())), { sf: 3 }), 'Simplify e^{k ln n} = nᵏ to give an exact answer.', 3)],
          solution: [md`$\left[\frac{${c}}{${k}}e^{${kx(k)}}\right]_{0}^{\ln ${n}} = \frac{${c}}{${k}}\left(${n}^{${k}} - 1\right) = ${answerTex(A)}$`],
        }),
      ],
      params: { fTex, a: 0, b: Math.log(n) },
    };
  },
  verify(inst) {
    const { fTex, a, b } = inst.params as { fTex: string; a: number; b: number };
    checkDefiniteTex(fTex, a, b, evaluate((inst.parts[0].answer as ExactSpec).value));
  },
});

// exact trig values: [cos rational, cos surd coef, sin rational, sin surd coef, surd]
const ANGLES: { tex: string; pi: [number, number]; v: number; cos: [Q, Q]; sin: [Q, Q]; s: number }[] = [
  { tex: '\\frac{\\pi}{6}', pi: [1, 6], v: Math.PI / 6, cos: [Q.ZERO, Q.of(1, 2)], sin: [Q.of(1, 2), Q.ZERO], s: 3 },
  { tex: '\\frac{\\pi}{4}', pi: [1, 4], v: Math.PI / 4, cos: [Q.ZERO, Q.of(1, 2)], sin: [Q.ZERO, Q.of(1, 2)], s: 2 },
  { tex: '\\frac{\\pi}{3}', pi: [1, 3], v: Math.PI / 3, cos: [Q.of(1, 2), Q.ZERO], sin: [Q.ZERO, Q.of(1, 2)], s: 3 },
  { tex: '\\frac{\\pi}{2}', pi: [1, 2], v: Math.PI / 2, cos: [Q.ZERO, Q.ZERO], sin: [Q.ONE, Q.ZERO], s: 2 },
  { tex: '\\frac{2\\pi}{3}', pi: [2, 3], v: (2 * Math.PI) / 3, cos: [Q.of(-1, 2), Q.ZERO], sin: [Q.ZERO, Q.of(1, 2)], s: 3 },
];

const exactTrig = defineTemplate({
  id: 'p2.11.definite-exact-trig',
  family: 'p2.11.definite-exact',
  title: 'Exact definite integral of sin and cos',
  spec: ['P8.3', 'P5.3'],
  chapter: 'P2.11',
  sections: ['11.1', '11.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 4,
  time: 6,
  commands: ['Find'],
  tags: ['integration', 'exact values', 'trigonometry', 'radians'],
  generate(r) {
    const k = r.pick([1, 2, 3]);
    const a = r.intNZ(-6, 6),
      b = r.intNZ(-6, 6);
    const ang = r.pick(ANGLES);
    // ∫_0^{θ/k} (a sin kx + b cos kx) dx = (a/k)(1 − cos θ) + (b/k) sin θ
    const rational = Q.of(a, k).mul(Q.ONE.sub(ang.cos[0])).add(Q.of(b, k).mul(ang.sin[0]));
    const surd = Q.of(-a, k).mul(ang.cos[1]).add(Q.of(b, k).mul(ang.sin[1]));
    const valTex = sumTex([[rational, ''], [surd, `\\sqrt{${ang.s}}`]]);
    const A: ExactSpec = ans.exact(ex(valTex), ['exact']);
    const up = Q.of(ang.pi[0], ang.pi[1] * k);
    const upper = `\\frac{${up.n === 1 ? '' : up.n}\\pi}{${up.d}}`;
    const fTex = sumTex([[a, trig('sin', k)], [b, trig('cos', k)]]);
    return {
      parts: [
        part({
          marks: 4,
          prompt: md`Find the exact value of $\displaystyle\int_{0}^{${upper}} \left(${fTex}\right)${dx}$.`,
          answer: A,
          scheme: [M1('Integrates sin to −cos and cos to sin'), A1(md`$\left[${sumTex([[Q.of(-a, k), trig('cos', k)], [Q.of(b, k), trig('sin', k)]])}\right]$`), dM1('Uses exact values at the limits'), A1(md`$${answerTex(A)}$`)],
          hints: [md`$\int \sin kx\,\mathrm{d}x = -\frac{1}{k}\cos kx$ and $\int \cos kx\,\mathrm{d}x = \frac{1}{k}\sin kx$.`, md`At the upper limit, $${kx(k)} = ${ang.tex}$.`, md`Remember $\cos 0 = 1$ and $\sin 0 = 0$.`],
          errors: [err('decimal', ans.num(evaluate(ex(valTex)), { sf: 3 }), 'Use exact values of sin and cos to give an exact answer.', 3)],
          solution: [
            md`$\left[${sumTex([[Q.of(-a, k), trig('cos', k)], [Q.of(b, k), trig('sin', k)]])}\right]_{0}^{${upper}}$`,
            md`$= ${answerTex(A)}$`,
          ],
        }),
      ],
      params: { fTex, b: ang.v / k },
    };
  },
  verify(inst) {
    const { fTex, b } = inst.params as { fTex: string; b: number };
    checkDefiniteTex(fTex, 0, b, evaluate((inst.parts[0].answer as ExactSpec).value));
  },
});

void B1;

const templates: Template[] = [standard, secTrig, composite, identities, exactLog, exactTrig];
export default templates;
