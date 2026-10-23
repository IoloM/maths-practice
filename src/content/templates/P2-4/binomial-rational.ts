/** Pure Year 2, Chapter 4 — the binomial expansion for rational n: (1 + kx)ⁿ, (a + bx)ⁿ, validity, approximation, partial fractions. */
import { Q } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, ExprSpec, IntervalSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ans, defineTemplate, err, iv, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';
import { PARTIAL_FRACTIONS } from '../P2-11/methods';

/** Generalised binomial coefficient n(n − 1)…(n − r + 1)/r! for rational n. */
export function gbinom(n: Q, r: number): Q {
  let c = Q.ONE;
  for (let i = 0; i < r; i++) c = c.mul(n.sub(i)).div(i + 1);
  return c;
}
/** Coefficients of (1 + kx)ⁿ up to the x^(terms−1) term. */
const series1 = (n: Q, k: Q, terms: number) => Array.from({ length: terms }, (_, r) => gbinom(n, r).mul(k.pow(r)));
const xPow = (i: number) => (i === 0 ? '' : i === 1 ? 'x' : `x^{${i}}`);
/** 1 + 3x − 2x² … in ascending powers. */
const seriesTex = (cs: Q[]) => sumTex(cs.map((c, i) => [c, xPow(i)]));
/** Parsed from the ascending LaTeX so the model answer reads 1 + 3x − 2x² …, as the question asks. */
const seriesExpr = (cs: Q[]) => ex(seriesTex(cs));
const lin = (a: Q | number, b: Q | number) => sumTex([[a, ''], [b, 'x']]);
/** " + c·body" or " − |c|·body" for writing out a working line. */
const term = (c: Q, body: string) => (c.sign < 0 ? ` - ${c.abs().toLatex()}${body}` : ` + ${c.toLatex()}${body}`);

/** (base)ⁿ as a question would print it: roots and reciprocals for the common powers. */
function powTex(base: string, n: Q, display: boolean): string {
  if (display) {
    if (n.eq(Q.of(1, 2))) return `\\sqrt{${base}}`;
    if (n.eq(Q.of(-1, 2))) return `\\dfrac{1}{\\sqrt{${base}}}`;
    if (n.eq(Q.of(1, 3))) return `\\sqrt[3]{${base}}`;
    if (n.eq(Q.of(-1, 3))) return `\\dfrac{1}{\\sqrt[3]{${base}}}`;
    if (n.eq(-1)) return `\\dfrac{1}{${base}}`;
    if (n.isInt && n.lt(0)) return `\\dfrac{1}{(${base})^{${-n.n}}}`;
  }
  return `\\left(${base}\\right)^{${n.toLatex()}}`;
}
/** −c < x < c */
const symmetric = (c: Q): IntervalSpec => ans.interval([iv(num(c.neg()), num(c), false, false)]);
const small = (q: Q) => Math.abs(q.n) <= 2000 && q.d <= 2000;

const N_RATIONAL = [Q.of(-1), Q.of(-2), Q.of(-3), Q.of(1, 2), Q.of(-1, 2), Q.of(1, 3), Q.of(-1, 3), Q.of(3, 2), Q.of(-3, 2), Q.of(2, 3), Q.of(-2, 3), Q.of(1, 4), Q.of(-1, 4)];
const K_VALUES = [2, -2, 3, -3, 4, -4, 5, -5, Q.of(1, 2), Q.of(-1, 2), Q.of(1, 3), Q.of(-1, 3), Q.of(3, 2), Q.of(-3, 2)].map((k) => Q.from(k));

const VALIDITY_HINT = md`An expansion of $(1 + u)^{n}$ with $n$ not a positive integer is valid for $|u| < 1$.`;

const oneTerm = defineTemplate({
  id: 'p2.4.expand-one-plus-kx',
  family: 'p2.4.binomial-rational',
  title: 'Binomial expansion of (1 + kx)ⁿ for rational n, with validity',
  spec: ['P4.1'],
  chapter: 'P2.4',
  sections: ['4.1'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 2,
  marks: 5,
  time: 6,
  commands: ['Find', 'State'],
  tags: ['binomial expansion', 'rational powers', 'validity'],
  generate(r) {
    const n = r.pick(N_RATIONAL),
      k = r.pick(K_VALUES);
    const cs = series1(n, k, 4);
    r.require(cs.every(small) && !cs.some((c) => c.isZero));
    const display = r.bool(0.6);
    const fTex = powTex(lin(1, k), n, display);
    const E: ExprSpec = ans.expr(seriesExpr(cs), ['x']);
    const V = symmetric(k.abs().inv());
    const notRaised = Array.from({ length: 4 }, (_, i) => gbinom(n, i).mul(i === 0 ? Q.ONE : k));
    // n(n + 1)(n + 2)/r! = (−1)^r · C(−n, r)
    const rising = Array.from({ length: 4 }, (_, i) => gbinom(n.neg(), i).mul(Q.of(-1).pow(i)).mul(k.pow(i)));
    return {
      stem: md`$\mathrm{f}(x) = ${fTex}$`,
      parts: [
        part({
          label: 'a',
          marks: 4,
          prompt: md`Find the binomial expansion of $\mathrm{f}(x)$, in ascending powers of $x$, up to and including the term in $x^{3}$. Give each coefficient as a fraction in its simplest form.`,
          answer: E,
          scheme: [
            B1(md`$${seriesTex(cs.slice(0, 2))}$`),
            M1(md`Correct form for the $x^{2}$ or $x^{3}$ term, e.g. $\dfrac{n(n-1)}{2!}(${k.toLatex()}x)^{2}$ with $n = ${n.toLatex()}$`),
            A1(md`$${seriesTex([Q.ZERO, Q.ZERO, cs[2]])}$`),
            A1(md`$${answerTex(E)}$`),
          ],
          hints: [
            md`$(1 + u)^{n} = 1 + nu + \dfrac{n(n-1)}{2!}u^{2} + \dfrac{n(n-1)(n-2)}{3!}u^{3} + \dots$`,
            md`Here $n = ${n.toLatex()}$ and $u = ${k.eq(1) ? '' : k.eq(-1) ? '-' : k.toLatex()}x$ — keep $u$ in brackets when you square and cube it.`,
            md`$\dfrac{n(n-1)}{2!} = ${gbinom(n, 2).toLatex()}$ and $\dfrac{n(n-1)(n-2)}{3!} = ${gbinom(n, 3).toLatex()}$.`,
          ],
          errors: [
            err('k-not-raised', ans.expr(seriesExpr(notRaised), ['x']), md`Raise the whole of $(${k.toLatex()}x)$ to each power, not just $x$.`, 2),
            err('rising-factorial', ans.expr(seriesExpr(rising), ['x']), md`The bracket factors go down: $n(n-1)(n-2)$, not $n(n+1)(n+2)$.`, 1),
          ],
          solution: [
            md`$n = ${n.toLatex()}$, $u = ${k.toLatex()}x$`,
            md`$1${term(n, `(${k.toLatex()}x)`)}${term(gbinom(n, 2), `(${k.toLatex()}x)^{2}`)}${term(gbinom(n, 3), `(${k.toLatex()}x)^{3}`)}$`,
            md`$= ${answerTex(E)} + \dots$`,
          ],
        }),
        part({
          label: 'b',
          marks: 1,
          prompt: md`State the range of values of $x$ for which this expansion is valid.`,
          answer: V,
          scheme: [B1(md`$|x| < ${k.abs().inv().toLatex()}$`)],
          hints: [VALIDITY_HINT, md`Here $u = ${k.toLatex()}x$.`, md`$|${k.toLatex()}x| < 1$`],
          errors: k.abs().eq(1) ? [] : [err('inverted', symmetric(k.abs()), md`$|${k.toLatex()}x| < 1$ gives $|x| < ${k.abs().inv().toLatex()}$ — divide by $${k.abs().toLatex()}$.`, 0)],
          solution: [md`Valid for $|${k.toLatex()}x| < 1$, i.e. $|x| < ${k.abs().inv().toLatex()}$, so $${answerTex(V)}$`],
        }),
      ],
      params: { n: n.value, k: k.value },
    };
  },
  verify(inst) {
    const { n, k } = inst.params as Record<string, number>;
    const e = (inst.parts[0].answer as ExprSpec).value;
    for (const u of [0.001, -0.0015]) {
      const x = u / k;
      expect(Math.abs(evaluate(e, { x }) - (1 + k * x) ** n) < 1e-9, 'series matches the function near 0');
    }
    const V = (inst.parts[1].answer as IntervalSpec).set[0];
    expectClose(evaluate(V.hi), 1 / Math.abs(k), 'radius of convergence');
  },
});

/** (a, n) with aⁿ rational. */
const A_FOR_N: [Q, number[]][] = [
  [Q.of(1, 2), [4, 9, 16, 25]],
  [Q.of(-1, 2), [4, 9, 16, 25]],
  [Q.of(3, 2), [4, 9]],
  [Q.of(-3, 2), [4, 9]],
  [Q.of(1, 3), [8, 27]],
  [Q.of(-1, 3), [8, 27]],
  [Q.of(2, 3), [8, 27]],
  [Q.of(-1), [2, 3, 4, 5]],
  [Q.of(-2), [2, 3, 4]],
  [Q.of(-3), [2, 3]],
];

const aPlusBx = defineTemplate({
  id: 'p2.4.expand-a-plus-bx',
  family: 'p2.4.binomial-rational',
  title: 'Binomial expansion of (a + bx)ⁿ for rational n, with validity',
  spec: ['P4.1'],
  chapter: 'P2.4',
  sections: ['4.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find', 'State'],
  tags: ['binomial expansion', 'rational powers', 'validity'],
  generate(r) {
    const [n, as] = r.pick(A_FOR_N);
    const a = Q.of(r.pick(as)),
      b = Q.of(r.intNZ(-6, 6));
    const an = a.powQ(n);
    r.require(an !== null && !b.abs().eq(a));
    const ratio = b.div(a);
    const cs = series1(n, ratio, 3).map((c) => c.mul(an!));
    r.require(cs.every(small) && !cs.some((c) => c.isZero));
    const display = r.bool(0.6);
    const fTex = powTex(lin(a, b), n, display);
    const E: ExprSpec = ans.expr(seriesExpr(cs), ['x']);
    const V = symmetric(a.div(b).abs());
    const aNotPowered = series1(n, ratio, 3).map((c) => c.mul(a));
    const bNotDivided = series1(n, b, 3).map((c) => c.mul(an!));
    return {
      stem: md`$\mathrm{f}(x) = ${fTex}$`,
      parts: [
        part({
          label: 'a',
          marks: 5,
          prompt: md`Find the first three terms, in ascending powers of $x$, of the binomial expansion of $\mathrm{f}(x)$. Give each coefficient as a simplified fraction.`,
          answer: E,
          scheme: [
            B1(md`Takes out $${a.toLatex()}^{${n.toLatex()}} = ${an!.toLatex()}$`),
            M1(md`Expands $\left(${lin(1, ratio)}\right)^{${n.toLatex()}}$ with the correct form for the $x^{2}$ term`),
            A1(md`$${seriesTex(series1(n, ratio, 2))} + \dots$`),
            M1(md`Multiplies their expansion by $${an!.toLatex()}$`),
            A1(md`$${answerTex(E)}$`),
          ],
          hints: [
            md`Write $(${lin(a, b)})^{${n.toLatex()}} = ${a.toLatex()}^{${n.toLatex()}}\left(1 + \dfrac{${b.toLatex()}}{${a.toLatex()}}x\right)^{${n.toLatex()}}$.`,
            md`$${a.toLatex()}^{${n.toLatex()}} = ${an!.toLatex()}$; now expand $(1 + u)^{${n.toLatex()}}$ with $u = ${ratio.toLatex()}x$.`,
            md`$(1 + u)^{n} = 1 + nu + \dfrac{n(n-1)}{2!}u^{2} + \dots$, then multiply every term by $${an!.toLatex()}$.`,
          ],
          errors: [
            err('a-not-powered', ans.expr(seriesExpr(aNotPowered), ['x']), md`The factor taken out is $${a.toLatex()}^{${n.toLatex()}}$, not $${a.toLatex()}$.`, 2),
            err('b-not-divided', ans.expr(seriesExpr(bNotDivided), ['x']), md`After taking out $${a.toLatex()}$, the bracket is $\left(1 + \frac{${b.toLatex()}}{${a.toLatex()}}x\right)$ — divide $${b.toLatex()}$ by $${a.toLatex()}$.`, 1),
          ],
          solution: [
            md`$\mathrm{f}(x) = ${an!.toLatex()}\left(${lin(1, ratio)}\right)^{${n.toLatex()}}$`,
            md`$= ${an!.toLatex()}\left(${seriesTex(series1(n, ratio, 3))} + \dots\right)$`,
            md`$= ${answerTex(E)} + \dots$`,
          ],
        }),
        part({
          label: 'b',
          marks: 1,
          prompt: md`State the range of values of $x$ for which this expansion is valid.`,
          answer: V,
          scheme: [B1(md`$|x| < ${a.div(b).abs().toLatex()}$`)],
          hints: [VALIDITY_HINT, md`Here $u = ${ratio.toLatex()}x$.`, md`$\left|${ratio.toLatex()}x\right| < 1$`],
          errors: [err('inverted', symmetric(ratio.abs()), md`$\left|${ratio.toLatex()}x\right| < 1$ gives $|x| < ${a.div(b).abs().toLatex()}$.`, 0)],
          solution: [md`Valid for $\left|${ratio.toLatex()}x\right| < 1$, i.e. $|x| < ${a.div(b).abs().toLatex()}$, so $${answerTex(V)}$`],
        }),
      ],
      params: { a: a.value, b: b.value, n: n.value },
    };
  },
  verify(inst) {
    const { a, b, n } = inst.params as Record<string, number>;
    const e = (inst.parts[0].answer as ExprSpec).value;
    for (const u of [0.0005, -0.0008]) {
      const x = (u * a) / b;
      const f = (a + b * x) ** n;
      expect(Math.abs(evaluate(e, { x }) - f) < 1e-8 * Math.max(1, Math.abs(f)), 'series matches the function near 0');
    }
    expectClose(evaluate((inst.parts[1].answer as IntervalSpec).set[0].hi), Math.abs(a / b), 'radius of convergence');
  },
});

/** n = s²d with s as large as possible (so d is square-free). */
function splitSquare(n: number): [number, number] {
  for (let f = Math.floor(Math.sqrt(n)); f > 1; f--) if (n % (f * f) === 0) return [f, n / (f * f)];
  return [1, n];
}
/**
 * Substituting x = 1/N (N a square) into √(1 + mx) gives √(N + m)/√N = s√d/√N, so the
 * expansion approximates √d. Kept to |m/N| ⩽ ¼ so the three-term approximation is good.
 */
const SURDS = [16, 25, 36, 49, 64, 81, 100, 121, 144].flatMap((N) =>
  Array.from({ length: Math.floor(N / 2) + 1 }, (_, i) => i - Math.floor(N / 4))
    .filter((m) => m !== 0)
    .map((m) => ({ N, m, split: splitSquare(N + m) }))
    .filter(({ split: [s0, d] }) => s0 > 1 && d > 1)
    .map(({ N, m, split: [s0, d] }) => ({ N, m, s: s0, d })),
);

const surd = defineTemplate({
  id: 'p2.4.approximate-a-surd',
  family: 'p2.4.binomial-approximation',
  title: 'Use a binomial expansion to approximate a square root as a fraction',
  spec: ['P4.1'],
  chapter: 'P2.4',
  sections: ['4.1'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 8,
  commands: ['Find', 'Hence'],
  tags: ['binomial expansion', 'approximation', 'surds'],
  generate(r) {
    const { N, m: mN, s, d } = r.pick(SURDS);
    const c = r.pick([1, 2, 3, 4, 5].filter((c0) => mN % c0 === 0)); // x = c/N with m = mN/c
    const m = Q.of(mN / c),
      x0 = Q.of(c, N);
    const half = Q.of(1, 2);
    const cs = series1(half, m, 3);
    const est = cs.reduce((acc, ci, i) => acc.add(ci.mul(x0.pow(i))), Q.ZERO);
    const rootN = Math.sqrt(N);
    const approx = est.mul(rootN).div(s);
    const E: ExprSpec = ans.expr(seriesExpr(cs), ['x']);
    const S: ExactSpec = ans.exact(num(approx), ['simplest-fraction']);
    const rootVal = Q.of(N + mN, N);
    return {
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: md`Find the binomial expansion of $\sqrt{${lin(1, m)}}$, in ascending powers of $x$, up to and including the term in $x^{2}$.`,
          answer: E,
          scheme: [B1(md`$${seriesTex(cs.slice(0, 2))}$`), M1(md`$\dfrac{\frac{1}{2}\left(-\frac{1}{2}\right)}{2!}(${m.toLatex()}x)^{2}$`), A1(md`$${answerTex(E)}$`)],
          hints: [md`$\sqrt{1 + u} = (1 + u)^{\frac{1}{2}} = 1 + \tfrac{1}{2}u + \dfrac{\frac{1}{2}\left(-\frac{1}{2}\right)}{2!}u^{2} + \dots$`, md`$u = ${m.toLatex()}x$`, md`$\dfrac{\frac{1}{2}\left(-\frac{1}{2}\right)}{2} = -\dfrac{1}{8}$`],
          errors: [err('k-not-squared', ans.expr(seriesExpr([Q.ONE, cs[1], Q.of(-1, 8).mul(m)]), ['x']), md`Square the whole of $(${m.toLatex()}x)$.`, 2)],
          solution: [md`$\left(${lin(1, m)}\right)^{\frac{1}{2}} = 1 + \tfrac{1}{2}(${m.toLatex()}x) - \tfrac{1}{8}(${m.toLatex()}x)^{2} + \dots = ${answerTex(E)} + \dots$`],
        }),
        part({
          label: 'b',
          marks: 3,
          prompt: md`By substituting $x = ${x0.toLatex()}$ into your answer to part (a), find an approximation for $\sqrt{${d}}$, giving your answer as a fraction in its simplest form.`,
          answer: S,
          ft: (prev) => (prev.a?.expr ? ans.num((rootN / s) * evaluate(prev.a.expr, { x: x0.value }), { sf: 5 }) : null),
          scheme: [M1(md`$\sqrt{${lin(1, m)}}$ at $x = ${x0.toLatex()}$ is $\sqrt{${rootVal.toLatex()}} = \dfrac{${s}\sqrt{${d}}}{${rootN}}$`), M1(md`Substitutes $x = ${x0.toLatex()}$ into their expansion`), A1(md`$\sqrt{${d}} \approx ${answerTex(S)}$`)],
          hints: [md`Work out $${lin(1, m)}$ when $x = ${x0.toLatex()}$.`, md`$\sqrt{${rootVal.toLatex()}} = \dfrac{\sqrt{${N + mN}}}{${rootN}} = \dfrac{${s}\sqrt{${d}}}{${rootN}}$`, md`So $\sqrt{${d}} = \dfrac{${rootN}}{${s}} \times \sqrt{${rootVal.toLatex()}}$ — use your expansion for the square root.`],
          errors: [err('forgot-scale', ans.exact(num(est)), md`That is the approximation for $\sqrt{${rootVal.toLatex()}}$. Since $\sqrt{${rootVal.toLatex()}} = \frac{${s}\sqrt{${d}}}{${rootN}}$, multiply by $\frac{${rootN}}{${s}}$.`, 2)],
          solution: [md`$x = ${x0.toLatex()}$: $\sqrt{${rootVal.toLatex()}} \approx ${est.toLatex()}$`, md`$\dfrac{${s}\sqrt{${d}}}{${rootN}} \approx ${est.toLatex()} \Rightarrow \sqrt{${d}} \approx ${answerTex(S)}$`],
        }),
      ],
      params: { m: m.value, x0: x0.value, s, d, N },
    };
  },
  verify(inst) {
    const { m, x0, s, d, N } = inst.params as Record<string, number>;
    const e = (inst.parts[0].answer as ExprSpec).value;
    expect(Math.abs(evaluate(e, { x: 1e-3 / m }) - Math.sqrt(1 + 1e-3)) < 1e-9, 'expansion near 0');
    const u = m * x0;
    expectClose(((s * Math.sqrt(d)) / Math.sqrt(N)) ** 2, 1 + u, 'surd identity');
    const approx = evaluate((inst.parts[1].answer as ExactSpec).value);
    // next term of the series is u³/16
    expect(Math.abs(approx - Math.sqrt(d)) <= ((0.1 * Math.abs(u) ** 3 * Math.sqrt(N)) / s) + 1e-12, 'close to the true root');
  },
});

type Lin = { c: number; a: number }; // c + ax
const pfFactors: Lin[] = [
  { c: 1, a: 1 },
  { c: 1, a: -1 },
  { c: 1, a: 2 },
  { c: 1, a: -2 },
  { c: 1, a: 3 },
  { c: 1, a: -3 },
  { c: 2, a: 1 },
  { c: 2, a: -1 },
  { c: 3, a: 1 },
  { c: 3, a: -1 },
  { c: 2, a: 3 },
  { c: 3, a: -2 },
];

const partialFractions = defineTemplate({
  id: 'p2.4.partial-fractions-then-expand',
  family: 'p2.4.binomial-partial-fractions',
  title: 'Partial fractions, then a binomial expansion and its validity',
  spec: ['P4.1', 'P2.10'],
  chapter: 'P2.4',
  sections: ['4.3'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 9,
  time: 11,
  commands: ['Express', 'Hence', 'Find'],
  tags: ['binomial expansion', 'partial fractions', 'validity'],
  generate(r) {
    const [L1, L2] = r.sample(pfFactors, 2);
    r.require(L1.c * L2.a !== L2.c * L1.a);
    const A = r.intNZ(-5, 5),
      B = r.intNZ(-5, 5);
    // numerator A(c2 + a2 x) + B(c1 + a1 x)
    const N0 = A * L2.c + B * L1.c,
      N1 = A * L2.a + B * L1.a;
    r.require(N0 !== 0 || N1 !== 0);
    const l1 = lin(L1.c, L1.a),
      l2 = lin(L2.c, L2.a);
    const fTex = `\\dfrac{${lin(N0, N1)}}{(${l1})(${l2})}`;
    const pfTex = [
      [A, l1],
      [B, l2],
    ]
      .map(([c, den], i) => `${Number(c) < 0 ? '-' : i ? '+' : ''}\\frac{${Math.abs(Number(c))}}{${den}}`)
      .join(' ');
    const lo = Math.max(-L1.c / L1.a, -L2.c / L2.a);
    const PF: ExprSpec = ans.expr(ex(pfTex), ['x'], { domain: { x: [Math.max(lo, 0) + 1, Math.max(lo, 0) + 4] }, forms: [PARTIAL_FRACTIONS] });
    // A/(c + ax) = (A/c)(1 + (a/c)x)^(−1)
    const part1 = series1(Q.of(-1), Q.of(L1.a, L1.c), 3).map((q) => q.mul(Q.of(A, L1.c)));
    const part2 = series1(Q.of(-1), Q.of(L2.a, L2.c), 3).map((q) => q.mul(Q.of(B, L2.c)));
    const cs = part1.map((q, i) => q.add(part2[i]));
    r.require(cs.every(small) && !cs[2].isZero);
    const E: ExprSpec = ans.expr(seriesExpr(cs), ['x']);
    const rad = Q.of(L1.c, Math.abs(L1.a)).lt(Q.of(L2.c, Math.abs(L2.a))) ? Q.of(L1.c, Math.abs(L1.a)) : Q.of(L2.c, Math.abs(L2.a));
    const radBig = Q.of(L1.c, Math.abs(L1.a)).lt(Q.of(L2.c, Math.abs(L2.a))) ? Q.of(L2.c, Math.abs(L2.a)) : Q.of(L1.c, Math.abs(L1.a));
    const V = symmetric(rad);
    const noDivide = series1(Q.of(-1), Q.of(L1.a), 3)
      .map((q) => q.mul(A))
      .map((q, i) => q.add(series1(Q.of(-1), Q.of(L2.a), 3)[i].mul(B)));
    return {
      stem: md`$\mathrm{f}(x) = ${fTex}$`,
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: md`Express $\mathrm{f}(x)$ in partial fractions.`,
          answer: PF,
          scheme: [B1(md`$\dfrac{A}{${l1}} + \dfrac{B}{${l2}}$`), M1(md`$${lin(N0, N1)} \equiv A(${l2}) + B(${l1})$ and finds a constant`), A1(md`$${pfTex}$`)],
          hints: [
            md`Write $\mathrm{f}(x) \equiv \dfrac{A}{${l1}} + \dfrac{B}{${l2}}$.`,
            md`Multiply through: $${lin(N0, N1)} \equiv A(${l2}) + B(${l1})$.`,
            md`Substitute $x = ${Q.of(-L1.c, L1.a).toLatex()}$ and $x = ${Q.of(-L2.c, L2.a).toLatex()}$.`,
          ],
          solution: [md`$A = ${A}$, $B = ${B}$: $\;\mathrm{f}(x) = ${pfTex}$`],
        }),
        part({
          label: 'b',
          marks: 5,
          prompt: md`Hence, or otherwise, find the series expansion of $\mathrm{f}(x)$, in ascending powers of $x$, up to and including the term in $x^{2}$. Give each coefficient as a simplified fraction.`,
          answer: E,
          scheme: [
            M1(md`Writes $\dfrac{${A}}{${l1}}$ as $${Q.of(A, L1.c).toLatex()}\left(${lin(1, Q.of(L1.a, L1.c))}\right)^{-1}$ (or similar for the other fraction)`),
            M1(md`Expands $(1 + u)^{-1} = 1 - u + u^{2} - \dots$ for either fraction`),
            A1(md`One series correct: $${seriesTex(part1)}$ or $${seriesTex(part2)}$`),
            dM1('Adds the two series'),
            A1(md`$${answerTex(E)}$`),
          ],
          hints: [
            md`$\dfrac{A}{c + ax} = \dfrac{A}{c}\left(1 + \dfrac{a}{c}x\right)^{-1}$`,
            md`$(1 + u)^{-1} = 1 - u + u^{2} - \dots$`,
            md`$\dfrac{${A}}{${l1}} = ${seriesTex(part1)} + \dots$; do the same for the other fraction and add.`,
          ],
          errors: L1.c === 1 && L2.c === 1 ? [] : [err('no-divide', ans.expr(seriesExpr(noDivide), ['x']), 'Take the constant out first: c + ax = c(1 + (a/c)x), so you also divide by c.', 2)],
          solution: [md`$\dfrac{${A}}{${l1}} = ${seriesTex(part1)} + \dots$`, md`$\dfrac{${B}}{${l2}} = ${seriesTex(part2)} + \dots$`, md`$\mathrm{f}(x) = ${answerTex(E)} + \dots$`],
        }),
        part({
          label: 'c',
          marks: 1,
          prompt: md`Find the range of values of $x$ for which the expansion in part (b) is valid.`,
          answer: V,
          scheme: [B1(md`$|x| < ${rad.toLatex()}$`)],
          hints: ['Each fraction has its own range of validity.', md`$\dfrac{1}{${l1}}$ needs $|x| < ${Q.of(L1.c, Math.abs(L1.a)).toLatex()}$; $\dfrac{1}{${l2}}$ needs $|x| < ${Q.of(L2.c, Math.abs(L2.a)).toLatex()}$.`, 'Both must hold, so take the smaller range.'],
          errors: rad.eq(radBig) ? [] : [err('larger-range', symmetric(radBig), 'Both expansions must be valid at once, so use the smaller range.', 0)],
          solution: [md`Both are valid only when $|x| < ${rad.toLatex()}$, so $${answerTex(V)}$`],
        }),
      ],
      params: { c1: L1.c, a1: L1.a, c2: L2.c, a2: L2.a, A, B },
    };
  },
  verify(inst) {
    const { c1, a1, c2, a2, A, B } = inst.params as Record<string, number>;
    const f = (x: number) => (A * (c2 + a2 * x) + B * (c1 + a1 * x)) / ((c1 + a1 * x) * (c2 + a2 * x));
    const pf = (inst.parts[0].answer as ExprSpec).value;
    expectClose(evaluate(pf, { x: 7.3 }), f(7.3), 'partial fractions identity');
    const e = (inst.parts[1].answer as ExprSpec).value;
    for (const x of [1e-4, -2e-4]) expect(Math.abs(evaluate(e, { x }) - f(x)) < 1e-8, 'series matches f near 0');
    const rad = Math.min(c1 / Math.abs(a1), c2 / Math.abs(a2));
    expectClose(evaluate((inst.parts[2].answer as IntervalSpec).set[0].hi), rad, 'validity');
  },
});

const findNK = defineTemplate({
  id: 'p2.4.find-n-and-k',
  family: 'p2.4.binomial-coefficients',
  title: 'Find n and k from the start of a binomial expansion',
  spec: ['P4.1'],
  chapter: 'P2.4',
  sections: ['4.1'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 8,
  time: 10,
  commands: ['Find', 'State'],
  tags: ['binomial expansion', 'rational powers', 'simultaneous equations'],
  generate(r) {
    const n = r.pick([Q.of(-1, 2), Q.of(1, 2), Q.of(-2), Q.of(-3), Q.of(1, 3), Q.of(-1, 3), Q.of(-1), Q.of(3, 2), Q.of(-3, 2), Q.of(2, 3), Q.of(-2, 3), Q.of(1, 4)]);
    const k = Q.of(r.pick([2, -2, 3, -3, 4, -4, 6, -6, 8, -8, 9, -9, 12, -12]));
    const [, A, B, C] = series1(n, k, 4);
    r.require(A.isInt && B.isInt && Math.abs(A.value) <= 60 && Math.abs(B.value) <= 600 && small(C));
    const N: ExactSpec = ans.exact(num(n));
    const K: ExactSpec = ans.exact(num(k));
    const C3: ExactSpec = ans.exact(num(C));
    const noFact = A.mul(A).div(A.mul(A).sub(B)); // from n(n − 1)k² = B
    const V = symmetric(k.abs().inv());
    return {
      stem: md`The binomial expansion of $(1 + kx)^{n}$, in ascending powers of $x$, begins $${seriesTex([Q.ONE, A, B])} + \dots$, where $k$ and $n$ are constants and $n$ is not a positive integer.`,
      parts: [
        part({
          label: 'a',
          marks: 4,
          prompt: md`Find the value of $n$.`,
          answer: N,
          scheme: [M1(md`$nk = ${A.toLatex()}$`), M1(md`$\dfrac{n(n-1)}{2}k^{2} = ${B.toLatex()}$`), dM1('Eliminates k to get an equation in n'), A1(md`$n = ${n.toLatex()}$`)],
          hints: ['Write down the first three terms of (1 + kx)ⁿ in terms of n and k.', md`Compare coefficients: $nk = ${A.toLatex()}$ and $\dfrac{n(n-1)}{2}k^{2} = ${B.toLatex()}$.`, md`Substitute $k = \dfrac{${A.toLatex()}}{n}$ into the second equation and solve for $n$.`],
          errors: noFact.eq(n) ? [] : [err('no-factorial', ans.exact(num(noFact)), md`The $x^{2}$ coefficient is $\dfrac{n(n-1)}{2!}k^{2}$ — don't forget the $2!$.`, 2)],
          solution: [md`$nk = ${A.toLatex()}$, $\;\dfrac{n(n-1)k^{2}}{2} = ${B.toLatex()}$`, md`$\dfrac{(n-1)}{2n}(nk)^{2} = ${B.toLatex()} \Rightarrow \dfrac{n-1}{2n} = ${B.div(A.mul(A)).toLatex()}$`, md`$n = ${answerTex(N)}$`],
        }),
        part({
          label: 'b',
          marks: 1,
          prompt: md`Find the value of $k$.`,
          answer: K,
          ft: (prev) => (prev.a?.value ? ans.num(A.value / prev.a.value, { sf: 4 }) : null),
          scheme: [A1(md`$k = ${k.toLatex()}$`)],
          hints: [md`$nk = ${A.toLatex()}$`, md`Divide by your value of $n$.`, md`$k = ${A.toLatex()} \div \left(${n.toLatex()}\right)$`],
          solution: [md`$k = \dfrac{${A.toLatex()}}{${n.toLatex()}} = ${answerTex(K)}$`],
        }),
        part({
          label: 'c',
          marks: 2,
          prompt: md`Find the coefficient of $x^{3}$ in the expansion.`,
          answer: C3,
          scheme: [M1(md`$\dfrac{n(n-1)(n-2)}{3!}k^{3}$ with their $n$ and $k$`), A1(md`$${answerTex(C3)}$`)],
          hints: [md`The $x^{3}$ term is $\dfrac{n(n-1)(n-2)}{3!}(kx)^{3}$.`, md`$n = ${n.toLatex()}$, $k = ${k.toLatex()}$`, md`$\dfrac{n(n-1)(n-2)}{6} = ${gbinom(n, 3).toLatex()}$ and $k^{3} = ${k.pow(3).toLatex()}$.`],
          errors: [err('k-not-cubed', ans.exact(num(gbinom(n, 3).mul(k))), md`Cube $k$ as well: $(kx)^{3} = k^{3}x^{3}$.`, 1)],
          solution: [md`$${gbinom(n, 3).toLatex()} \times (${k.toLatex()})^{3} = ${answerTex(C3)}$`],
        }),
        part({
          label: 'd',
          marks: 1,
          prompt: md`State the range of values of $x$ for which the expansion is valid.`,
          answer: V,
          scheme: [B1(md`$|x| < ${k.abs().inv().toLatex()}$`)],
          hints: [VALIDITY_HINT, md`Here $u = ${k.toLatex()}x$.`, md`$|${k.toLatex()}x| < 1$`],
          errors: [err('inverted', symmetric(k.abs()), md`$|${k.toLatex()}x| < 1$ gives $|x| < ${k.abs().inv().toLatex()}$.`, 0)],
          solution: [md`$|${k.toLatex()}x| < 1 \Rightarrow |x| < ${k.abs().inv().toLatex()}$, so $${answerTex(V)}$`],
        }),
      ],
      params: { n: n.value, k: k.value, A: A.value, B: B.value },
    };
  },
  verify(inst) {
    const { A, B } = inst.params as Record<string, number>;
    // solve the two coefficient equations directly: n = A²/(A² − 2B), k = A/n
    const n = (A * A) / (A * A - 2 * B),
      k = A / n;
    expectClose(evaluate((inst.parts[0].answer as ExactSpec).value), n, 'n');
    expectClose(evaluate((inst.parts[1].answer as ExactSpec).value), k, 'k');
    // x³ coefficient = third derivative of (1 + kx)ⁿ at 0 over 3!
    expectClose(evaluate((inst.parts[2].answer as ExactSpec).value), (n * (n - 1) * (n - 2) * k ** 3) / 6, 'x³ coefficient');
    // and the stem's coefficients really are those of (1 + kx)ⁿ
    const x = 1e-3 / Math.abs(k);
    const C = evaluate((inst.parts[2].answer as ExactSpec).value);
    expect(Math.abs((1 + k * x) ** n - (1 + A * x + B * x * x + C * x ** 3)) < 1e-9, 'series near 0');
  },
});

const product = defineTemplate({
  id: 'p2.4.product-with-binomial',
  family: 'p2.4.binomial-rational',
  title: 'Expand a product such as (p + qx)(a + bx)ⁿ',
  spec: ['P4.1'],
  chapter: 'P2.4',
  sections: ['4.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 8,
  commands: ['Find', 'State'],
  tags: ['binomial expansion', 'rational powers', 'products'],
  generate(r) {
    const [n, as] = r.pick(A_FOR_N.filter(([n0]) => n0.lt(0)));
    const a = Q.of(r.pick(as)),
      b = Q.of(r.intNZ(-4, 4));
    const an = a.powQ(n);
    r.require(an !== null);
    const p = r.intNZ(-4, 5),
      q = r.intNZ(-5, 5);
    const base = series1(n, b.div(a), 3).map((c) => c.mul(an!));
    const cs = [base[0].mul(p), base[1].mul(p).add(base[0].mul(q)), base[2].mul(p).add(base[1].mul(q))];
    r.require(cs.every(small) && base.every(small) && !cs.some((c) => c.isZero));
    const m = n.neg(); // f = (p + qx)/(a + bx)^m
    const fTex = `\\dfrac{${lin(p, q)}}{${m.eq(1) ? lin(a, b) : powTex(lin(a, b), m, true)}}`;
    const E: ExprSpec = ans.expr(seriesExpr(cs), ['x']);
    const onlyP = base.map((c) => c.mul(p));
    const V = symmetric(a.div(b).abs());
    return {
      stem: md`$\mathrm{f}(x) = ${fTex}$`,
      parts: [
        part({
          label: 'a',
          marks: 5,
          prompt: md`Find the first three terms, in ascending powers of $x$, of the binomial expansion of $\mathrm{f}(x)$. Give each coefficient as a simplified fraction.`,
          answer: E,
          scheme: [
            M1(md`Writes $\mathrm{f}(x) = (${lin(p, q)})(${lin(a, b)})^{${n.toLatex()}}$ and takes out $${a.toLatex()}^{${n.toLatex()}}$`),
            A1(md`$(${lin(a, b)})^{${n.toLatex()}} = ${seriesTex(base)} + \dots$`),
            M1(md`Multiplies by $(${lin(p, q)})$, collecting the $x$ and $x^{2}$ terms`),
            A1(md`Two of the three terms correct`),
            A1(md`$${answerTex(E)}$`),
          ],
          hints: [
            md`Write $\mathrm{f}(x) = (${lin(p, q)})(${lin(a, b)})^{${n.toLatex()}}$.`,
            md`$(${lin(a, b)})^{${n.toLatex()}} = ${an!.toLatex()}\left(${lin(1, b.div(a))}\right)^{${n.toLatex()}}$ — expand to the $x^{2}$ term.`,
            md`Then multiply by $(${lin(p, q)})$; you only need terms up to $x^{2}$.`,
          ],
          errors: [err('only-constant', ans.expr(seriesExpr(onlyP), ['x']), md`Multiply by the $${q}x$ term as well — it adds to the $x$ and $x^{2}$ coefficients.`, 3)],
          solution: [md`$(${lin(a, b)})^{${n.toLatex()}} = ${seriesTex(base)} + \dots$`, md`$(${lin(p, q)})\left(${seriesTex(base)}\right) = ${answerTex(E)} + \dots$`],
        }),
        part({
          label: 'b',
          marks: 1,
          prompt: md`State the range of values of $x$ for which this expansion is valid.`,
          answer: V,
          scheme: [B1(md`$|x| < ${a.div(b).abs().toLatex()}$`)],
          hints: [VALIDITY_HINT, md`Here $u = ${b.div(a).toLatex()}x$.`, 'Multiplying by a polynomial does not change where the series is valid.'],
          errors: b.abs().eq(a) ? [] : [err('inverted', symmetric(b.div(a).abs()), md`$\left|${b.div(a).toLatex()}x\right| < 1$ gives $|x| < ${a.div(b).abs().toLatex()}$.`, 0)],
          solution: [md`$\left|${b.div(a).toLatex()}x\right| < 1 \Rightarrow |x| < ${a.div(b).abs().toLatex()}$, so $${answerTex(V)}$`],
        }),
      ],
      params: { a: a.value, b: b.value, n: n.value, p, q },
    };
  },
  verify(inst) {
    const { a, b, n, p, q } = inst.params as Record<string, number>;
    const e = (inst.parts[0].answer as ExprSpec).value;
    for (const u of [5e-4, -7e-4]) {
      const x = (u * a) / b;
      const f = (p + q * x) * (a + b * x) ** n;
      expect(Math.abs(evaluate(e, { x }) - f) < 1e-7 * Math.max(1, Math.abs(f)), 'series matches f near 0');
    }
  },
});

const templates: Template[] = [oneTerm, aPlusBx, surd, partialFractions, findNK, product];
export default templates;
