/** Statistics Year 1, Chapter 6 — more discrete distributions: two unknowns, and a long exam-style question. */
import { Q } from '../../../engine/core/rational';
import { dec as decimal, evaluate, num } from '../../../engine/core/expr';
import { binomCdf } from '../../../engine/stats/distributions';
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { binomCdfBeta, d4, pX } from '../shared/stats';

/** an exact probability shown as a decimal */
const dec = (q: Q) => ans.exact(decimal(q.value, fmtNum(q.value)), undefined, { allowDecimal: true });
const exV = (s: ExactSpec) => evaluate(s.value);
const tableTex = (xs: (number | string)[], ps: string[], v = 'x') => md`\begin{array}{c|${'c'.repeat(xs.length)}} ${v} & ${xs.join(' & ')} \\ \hline \mathrm{P}(X = ${v}) & ${ps.join(' & ')} \end{array}`;

/** P(X1 + X2 = s) for independent X1, X2 with the same distribution. */
function sumProb(xs: number[], ps: Q[], s: number): { p: Q; pairs: [number, number][] } {
  let p = Q.ZERO;
  const pairs: [number, number][] = [];
  for (let i = 0; i < xs.length; i++)
    for (let j = 0; j < xs.length; j++)
      if (xs[i] + xs[j] === s) {
        p = p.add(ps[i].mul(ps[j]));
        pairs.push([xs[i], xs[j]]);
      }
  return { p, pairs };
}

const twoUnknowns = defineTemplate({
  id: 'sm1.6.discrete-two-unknowns',
  family: 'sm1.6.discrete',
  title: 'Discrete distribution with two unknowns, then two independent observations',
  spec: ['S3.1'],
  chapter: 'SM1.6',
  sections: ['6.1', '6.2'],
  level: 'AS',
  paper: [3],
  difficulty: 3,
  marks: 7,
  time: 8,
  commands: ['Find'],
  tags: ['discrete distributions', 'probability', 'independent events'],
  generate(r) {
    const start = r.pick([0, 1, 2]);
    const step = r.pick([1, 1, 2]);
    const xs = [0, 1, 2, 3].map((i) => start + i * step);
    // a = m·b (or a = b + d); the two known probabilities make the rest up to 1
    const b = Q.of(r.pick([5, 10, 15, 20]), 100);
    const ratio = r.bool();
    const m = r.pick([2, 3]),
      dd = Q.of(r.pick([5, 10, 15]), 100);
    const a = ratio ? b.mul(m) : b.add(dd);
    const known = Q.ONE.sub(a).sub(b);
    r.require(known.gt(Q.of(1, 10)));
    const p3 = Q.of(r.int(1, Math.round(known.value * 20) - 1), 20);
    const p4 = known.sub(p3);
    r.require(p4.gt(0));
    const ps = [a, b, p3, p4];
    // relation states P(X = x0) in terms of P(X = x1)
    const relTex = ratio ? md`$\mathrm{P}(X = ${xs[0]}) = ${m}\,\mathrm{P}(X = ${xs[1]})$` : md`$\mathrm{P}(X = ${xs[0]})$ is $${fmtNum(dd.value)}$ more than $\mathrm{P}(X = ${xs[1]})$`;
    const B = dec(b),
      A = dec(a);
    const cut = xs[1];
    const PG: ExactSpec = dec(p3.add(p4).add(b));
    const s = r.pick([xs[1] + xs[2], xs[0] + xs[3], xs[1] + xs[3], xs[2] + xs[2]]);
    const { p: ps2, pairs } = sumProb(xs, ps, s);
    r.require(pairs.length >= 2);
    const S2: ExactSpec = dec(ps2);
    const oneOrder = pairs.filter(([u, v]) => u <= v).reduce((tq, [u, v]) => tq.add(ps[xs.indexOf(u)].mul(ps[xs.indexOf(v)])), Q.ZERO);
    const pTex = (q: Q) => fmtNum(q.value);
    return {
      stem: md`The discrete random variable $X$ has the probability distribution $${tableTex(xs, ['a', 'b', pTex(p3), pTex(p4)])}$ where $a$ and $b$ are probabilities. Given that ${relTex},`,
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: md`find the value of $b$`,
          answer: B,
          scheme: [M1(md`Uses $\sum \mathrm{P}(X = x) = 1$: $a + b = ${pTex(a.add(b))}$`), M1(ratio ? md`Uses $a = ${m}b$` : md`Uses $a = b + ${pTex(dd)}$`), A1(md`$b = ${pTex(b)}$`)],
          hints: ['The probabilities add up to 1.', md`$a + b + ${pTex(p3)} + ${pTex(p4)} = 1$, so $a + b = ${pTex(a.add(b))}$.`, ratio ? md`Substitute $a = ${m}b$.` : md`Substitute $a = b + ${pTex(dd)}$.`],
          errors: [err('a-for-b', dec(a), 'That is a: the question asks for b.', 1)],
          solution: [md`$a + b = 1 - ${pTex(p3)} - ${pTex(p4)} = ${pTex(a.add(b))}$`, ratio ? md`$${m}b + b = ${pTex(a.add(b))} \Rightarrow b = ${pTex(b)}$` : md`$2b + ${pTex(dd)} = ${pTex(a.add(b))} \Rightarrow b = ${pTex(b)}$`],
        }),
        part({
          label: 'b',
          marks: 1,
          prompt: md`and the value of $a$.`,
          answer: A,
          scheme: [B1(md`$a = ${pTex(a)}$`)],
          hints: ['Use your value of b.', ratio ? md`$a = ${m}b$` : md`$a = b + ${pTex(dd)}$`, md`$a = ${pTex(a)}$`],
          solution: [md`$a = ${pTex(a)}$`],
        }),
        part({
          label: 'c',
          marks: 1,
          prompt: md`Find $${pX('>=', cut)}$.`,
          answer: PG,
          scheme: [B1(md`$${answerTex(PG)}$`)],
          hints: [md`Add the probabilities for $x \geqslant ${cut}$.`, md`$b + ${pTex(p3)} + ${pTex(p4)}$`, md`Or $1 - a$.`],
          errors: [err('strict', dec(p3.add(p4)), md`$\geqslant$ includes $x = ${cut}$.`)],
          solution: [md`$${pX('>=', cut)} = ${pTex(b)} + ${pTex(p3)} + ${pTex(p4)} = ${answerTex(PG)}$`],
        }),
        part({
          label: 'd',
          marks: 2,
          prompt: md`Two independent observations, $X_1$ and $X_2$, are taken of $X$. Find $\mathrm{P}(X_1 + X_2 = ${s})$.`,
          answer: S2,
          scheme: [M1(md`Identifies the pairs: ${pairs.map(([u, v]) => `$(${u}, ${v})$`).join(', ')}`), A1(md`$${fmtNum(ps2.value)}$`)],
          hints: [`List every pair (X₁, X₂) that adds up to ${s}.`, md`The pairs are ${pairs.map(([u, v]) => `$(${u}, ${v})$`).join(', ')}.`, 'Multiply the probabilities for each pair (independent), then add.'],
          errors: pairs.some(([u, v]) => u !== v) ? [err('one-order', dec(oneOrder), 'The two observations can come in either order: count (u, v) and (v, u).', 1)] : [],
          solution: [md`$\mathrm{P}(X_1 + X_2 = ${s}) = ${pairs.map(([u, v]) => `${pTex(ps[xs.indexOf(u)])} \\times ${pTex(ps[xs.indexOf(v)])}`).join(' + ')} = ${fmtNum(ps2.value)}$`],
        }),
      ],
      params: { xs, ps: ps.map((q) => q.value), s, ratio, m, dd: dd.value },
    };
  },
  verify(inst) {
    const { xs, ps, s, ratio, m, dd } = inst.params as { xs: number[]; ps: number[]; s: number; ratio: boolean; m: number; dd: number };
    const b = exV(inst.parts[0].answer as ExactSpec),
      a = exV(inst.parts[1].answer as ExactSpec);
    expectClose(a + b + ps[2] + ps[3], 1, 'sums to 1');
    expectClose(a, ratio ? m * b : b + dd, 'relation');
    expectClose(exV(inst.parts[2].answer as ExactSpec), b + ps[2] + ps[3], 'P(X ≥ x1)');
    let t = 0;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (xs[i] + xs[j] === s) t += [a, b, ps[2], ps[3]][i] * [a, b, ps[2], ps[3]][j];
    expectClose(exV(inst.parts[3].answer as ExactSpec), t, 'sum of two observations');
  },
});

type Form = 'kx' | 'k(x+c)' | 'kx2' | 'k(c-x)';

const longDiscrete = defineTemplate({
  id: 'sm1.6.long-discrete-function-then-binomial',
  family: 'sm1.6.discrete',
  title: 'Exam-style: P(X = x) given by a formula — find k, probabilities, two observations and a binomial',
  spec: ['S3.1', 'S3.2'],
  chapter: 'SM1.6',
  sections: ['6.1', '6.2', '6.4'],
  level: 'AS',
  paper: [3],
  difficulty: 4,
  marks: 10,
  time: 12,
  commands: ['Find', 'Show that'],
  tags: ['exam-style', 'discrete distributions', 'binomial'],
  generate(r) {
    const form = r.pick(['kx', 'k(x+c)', 'kx2', 'k(c-x)'] as const) as Form;
    const N = r.int(4, 6);
    const c = form === 'k(x+c)' ? r.int(1, 3) : form === 'k(c-x)' ? N + r.int(1, 3) : 0;
    const xs = Array.from({ length: N }, (_, i) => i + 1);
    const w = (x: number) => (form === 'kx' ? x : form === 'k(x+c)' ? x + c : form === 'kx2' ? x * x : c - x);
    const total = xs.reduce((t, x) => t + w(x), 0);
    const k = Q.of(1, total);
    const P = (x: number) => k.mul(w(x));
    const fTex = form === 'kx' ? 'kx' : form === 'k(x+c)' ? `k(x + ${c})` : form === 'kx2' ? 'kx^{2}' : `k(${c} - x)`;
    const t = r.int(2, N - 1);
    const above = xs.filter((x) => x > t).reduce((s, x) => s.add(P(x)), Q.ZERO);
    const same = xs.reduce((s, x) => s.add(P(x).mul(P(x))), Q.ZERO);
    // repeat the experiment n times; Y counts the times X takes its most likely value
    const top = form === 'k(c-x)' ? 1 : N;
    const pTop = P(top).value;
    const n = r.pick([8, 10, 12, 15, 20]);
    const atLeast = r.pick([2, 3]);
    const pY = 1 - binomCdf(n, pTop, atLeast - 1);
    r.require(pY > 0.02 && pY < 0.98);
    const K: ExactSpec = ans.exact(num(k));
    // probabilities: exact fractions or awrt 3 s.f.
    const AB: NumericSpec = ans.num(above.value, { sf: 3 });
    const SM: NumericSpec = ans.num(same.value, { sf: 3 });
    const PY: NumericSpec = ans.num(pY, { sf: 3 });
    const wTex = xs.map((x) => String(w(x))).join(' + ');
    return {
      stem: md`The discrete random variable $X$ has probability function $\mathrm{P}(X = x) = ${fTex}$ for $x = ${xs.join(', ')}$, and $\mathrm{P}(X = x) = 0$ otherwise, where $k$ is a constant.`,
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Find the exact value of $k$.`,
          answer: K,
          scheme: [M1(md`Sums the probabilities to 1: $k(${wTex}) = 1$`), A1(md`$k = ${k.toLatex()}$`)],
          hints: ['All the probabilities add up to 1.', md`$\mathrm{P}(X = 1) + \dots + \mathrm{P}(X = ${N}) = 1$`, md`$k(${wTex}) = 1$`],
          errors: [err('missing-term', ans.exact(num(Q.of(1, total - w(N)))), md`Include every value of $x$ from $1$ to $${N}$.`)],
          solution: [md`$k(${wTex}) = ${total}k = 1 \Rightarrow k = ${k.toLatex()}$`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Find $${pX('>', t)}$.`,
          answer: AB,
          ft: (prev) => (prev.a?.value ? ans.num(prev.a.value * xs.filter((x) => x > t).reduce((s2, x) => s2 + w(x), 0), { sf: 3 }) : null),
          scheme: [M1(md`$\mathrm{P}(X = ${t + 1}) + \dots + \mathrm{P}(X = ${N})$`), A1(md`$${above.toLatex()}$`)],
          hints: [md`$X > ${t}$ means $x = ${xs.filter((x) => x > t).join(', ')}$.`, md`$\mathrm{P}(X = x) = ${k.toLatex()} \times ${fTex.replace('k', '')}$`, 'Add those probabilities.'],
          errors: [err('includes-t', ans.num(above.add(P(t)).value, { sf: 3 }), md`$X > ${t}$ does not include $x = ${t}$.`)],
          solution: [md`$${pX('>', t)} = ${k.toLatex()}(${xs.filter((x) => x > t).map(w).join(' + ')}) = ${above.toLatex()} \approx ${answerTex(AB)}$`],
        }),
        part({
          label: 'c',
          marks: 3,
          prompt: md`Two independent observations of $X$ are taken. Find the probability that they are equal.`,
          answer: SM,
          scheme: [M1(md`$\sum \mathrm{P}(X = x)^{2}$`), M1('All the squared terms added'), A1(md`$${same.toLatex()}$`)],
          hints: ['Both observations are 1, or both are 2, or …', 'Independent: P(both are x) = P(X = x)².', md`Add $\mathrm{P}(X = x)^{2}$ for $x = 1, \dots, ${N}$.`],
          errors: [err('not-squared', ans.num(1, { sf: 3 }), 'Each probability must be squared (both observations must be that value).')],
          solution: [md`$${xs.map((x) => `\\left(${P(x).toLatex()}\\right)^{2}`).join(' + ')} = ${same.toLatex()} \approx ${answerTex(SM)}$`],
        }),
        part({
          label: 'd',
          marks: 3,
          prompt: md`The random variable $X$ is observed $${n}$ times. Find the probability that $X = ${top}$ on at least $${atLeast}$ of these occasions.`,
          answer: PY,
          scheme: [M1(md`$Y \sim \mathrm{B}(${n}, ${P(top).toLatex()})$`), M1(md`$\mathrm{P}(Y \geqslant ${atLeast}) = 1 - \mathrm{P}(Y \leqslant ${atLeast - 1})$`), A1(md`awrt $${d4(pY)}$`)],
          hints: [md`Let $Y$ be the number of times $X = ${top}$: a binomial distribution.`, md`$Y \sim \mathrm{B}(${n}, ${P(top).toLatex()})$`, md`$\mathrm{P}(Y \geqslant ${atLeast}) = 1 - \mathrm{P}(Y \leqslant ${atLeast - 1})$`],
          errors: [err('wrong-tail', ans.num(1 - binomCdf(n, pTop, atLeast), { sf: 3 }), md`"At least $${atLeast}$" includes $${atLeast}$: use $1 - \mathrm{P}(Y \leqslant ${atLeast - 1})$.`, 1)],
          solution: [md`$Y \sim \mathrm{B}(${n}, ${P(top).toLatex()})$`, md`$\mathrm{P}(Y \geqslant ${atLeast}) = 1 - \mathrm{P}(Y \leqslant ${atLeast - 1}) = ${answerTex(PY)}$`],
        }),
      ],
      params: { form, N, c, t, n, atLeast, top },
    };
  },
  verify(inst) {
    const { form, N, c, t, n, atLeast, top } = inst.params as { form: Form; N: number; c: number; t: number; n: number; atLeast: number; top: number };
    const k = exV(inst.parts[0].answer as ExactSpec);
    const w = (x: number) => (form === 'kx' ? x : form === 'k(x+c)' ? x + c : form === 'kx2' ? x * x : c - x);
    const p = (x: number) => k * w(x);
    let tot = 0,
      above = 0,
      same = 0;
    for (let x = 1; x <= N; x++) {
      expect(p(x) > 0 && p(x) < 1, 'valid probability');
      tot += p(x);
      if (x > t) above += p(x);
      same += p(x) ** 2;
    }
    expectClose(tot, 1, 'sums to 1');
    expectClose((inst.parts[1].answer as NumericSpec).value, above, 'P(X > t)');
    expectClose((inst.parts[2].answer as NumericSpec).value, same, 'P(equal)');
    for (let x = 1; x <= N; x++) expect(p(top) >= p(x) - 1e-12, 'top is the most likely value');
    expectClose((inst.parts[3].answer as NumericSpec).value, 1 - binomCdfBeta(n, p(top), atLeast - 1), 'binomial');
  },
});

export default [twoUnknowns, longDiscrete] satisfies Template[];
