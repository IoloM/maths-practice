/** Statistics Year 1, Chapter 6 — long exam-style question: the binomial model, its probabilities, and repeated samples. */
import { binomCdf, binomPmf } from '../../../engine/stats/distributions';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { binomPmfDirect, d4, pX, pickContext, pTex } from '../shared/stats';

const P4 = (v: number) => ans.num(v, { dp: 4 });
const B = (n: number, p: number) => md`\mathrm{B}(${n}, ${pTex(p)})`;

const samples = defineTemplate({
  id: 'sm1.6.long-binomial-model-and-repeated-samples',
  family: 'sm1.6.exam-style',
  title: 'Exam-style: a binomial model, cumulative probabilities and repeated samples',
  spec: ['S4.1'],
  chapter: 'SM1.6',
  sections: ['6.2', '6.3', '6.4'],
  level: 'AS',
  paper: [3],
  difficulty: 4,
  marks: 12,
  time: 14,
  commands: ['State', 'Find'],
  tags: ['exam-style', 'binomial', 'cumulative', 'two-stage', 'modelling'],
  generate(r) {
    const n = r.pick([15, 20, 25, 30]);
    const p = r.pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4]);
    const c = pickContext(r);
    const mid = Math.round(n * p);
    const k1 = mid + r.pick([-1, 0, 1]);
    const k2 = mid + r.pick([1, 2, 3]);
    const lo = Math.max(1, mid - r.pick([1, 2])),
      hi = mid + r.pick([2, 3, 4]);
    const t = mid + r.pick([1, 2]);
    const m = r.pick([5, 6, 8, 10]);
    const q = 1 - binomCdf(n, p, t);
    r.require(k1 >= 0 && binomPmf(n, p, k1) > 0.05 && lo < hi && hi <= n && q > 0.05 && q < 0.6);
    const atLeast2 = 1 - (1 - q) ** m - m * q * (1 - q) ** (m - 1);
    const A1v = P4(binomPmf(n, p, k1)),
      A2v = P4(binomCdf(n, p, k2 - 1)),
      A3v = P4(binomCdf(n, p, hi - 1) - binomCdf(n, p, lo - 1)),
      A4v = P4(atLeast2);
    return {
      stem: md`The probability that one of ${c.population} ${c.is} is $${pTex(p)}$. A random sample of $${n}$ ${c.items} is taken, and $X$ is the number of them that ${c.are}.`,
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`State two assumptions needed for $X \sim ${B(n, p)}$ to be a suitable model.`,
          answer: ans.self(`Each ${c.item} ${c.is} or not independently of the others; the probability ${pTex(p)} is the same for every ${c.item} (and there is a fixed number, ${n}, of trials).`),
          scheme: [B1('Independence of the trials (in context)'), B1(md`Constant probability $p = ${pTex(p)}$ (in context)`)],
          hints: ['What has to be true of each trial for a binomial model?', 'Think: independent, and the same probability each time.', `Say it about the ${c.items}.`],
          solution: [`The ${c.items} are independent of one another; each has the same probability, ${pTex(p)}, and there is a fixed number of trials.`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Find $${pX('=', k1)}$.`,
          answer: A1v,
          scheme: [M1(md`$\binom{${n}}{${k1}}(${pTex(p)})^{${k1}}(${pTex(1 - p)})^{${n - k1}}$`), A1(md`awrt $${d4(binomPmf(n, p, k1))}$`)],
          hints: ['Exactly one value: the binomial pdf.', md`$\mathrm{P}(X = r) = \binom{n}{r}p^{r}(1-p)^{n-r}$`, md`$r = ${k1}$`],
          errors: [err('cumulative', P4(binomCdf(n, p, k1)), md`That is $${pX('<=', k1)}$ — you want exactly $${k1}$.`)],
          solution: [md`$${pX('=', k1)} = \binom{${n}}{${k1}}(${pTex(p)})^{${k1}}(${pTex(1 - p)})^{${n - k1}} = ${answerTex(A1v)}$`],
        }),
        part({
          label: 'c',
          marks: 2,
          prompt: md`Find $${pX('<', k2)}$.`,
          answer: A2v,
          scheme: [M1(md`Uses $${pX('<=', k2 - 1)}$`), A1(md`awrt $${d4(binomCdf(n, p, k2 - 1))}$`)],
          hints: [md`For whole numbers, $X < ${k2}$ means $X \leqslant ${k2 - 1}$.`, 'Use the cumulative binomial function (or the tables).', md`$${pX('<=', k2 - 1)}$`],
          errors: [err('included-end', P4(binomCdf(n, p, k2)), md`That includes $X = ${k2}$: "less than" stops at $${k2 - 1}$.`)],
          solution: [md`$${pX('<', k2)} = ${pX('<=', k2 - 1)} = ${answerTex(A2v)}$`],
        }),
        part({
          label: 'd',
          marks: 2,
          prompt: md`Find $\mathrm{P}(${lo} \leqslant X < ${hi})$.`,
          answer: A3v,
          scheme: [M1(md`$${pX('<=', hi - 1)} - ${pX('<=', lo - 1)}$`), A1(md`awrt $${d4(binomCdf(n, p, hi - 1) - binomCdf(n, p, lo - 1))}$`)],
          hints: [md`Which whole numbers are included? From $${lo}$ up to $${hi - 1}$.`, 'Subtract two cumulative probabilities.', md`$${pX('<=', hi - 1)} - ${pX('<=', lo - 1)}$`],
          errors: [err('boundaries', P4(binomCdf(n, p, hi) - binomCdf(n, p, lo)), md`Check the ends: $${lo}$ is included and $${hi}$ is not, so use $${pX('<=', hi - 1)} - ${pX('<=', lo - 1)}$.`, 1)],
          solution: [md`$\mathrm{P}(${lo} \leqslant X \leqslant ${hi - 1}) = ${d4(binomCdf(n, p, hi - 1))} - ${d4(binomCdf(n, p, lo - 1))} = ${answerTex(A3v)}$`],
        }),
        part({
          label: 'e',
          marks: 4,
          prompt: md`$${m}$ such samples of $${n}$ are taken. Find the probability that at least $2$ of these samples have more than $${t}$ ${c.items} that ${c.are}.`,
          answer: A4v,
          scheme: [
            B1(md`$${pX('>', t)} = 1 - ${pX('<=', t)} = ${d4(q)}$`),
            M1(md`$Y \sim \mathrm{B}(${m}, ${d4(q)})$`),
            M1(md`$1 - \mathrm{P}(Y = 0) - \mathrm{P}(Y = 1)$`),
            A1(md`awrt $${d4(atLeast2)}$`),
          ],
          hints: [md`First find the probability that one sample has more than $${t}$: $${pX('>', t)}$.`, md`The number of samples like that, $Y$, is binomial too: $Y \sim \mathrm{B}(${m}, \text{that probability})$.`, md`$\mathrm{P}(Y \geqslant 2) = 1 - \mathrm{P}(Y = 0) - \mathrm{P}(Y = 1)$`],
          errors: [err('only-zero', P4(1 - (1 - q) ** m), 'That is P(Y ⩾ 1): take away P(Y = 1) as well.', 2), err('exactly-two', P4(binomPmf(m, q, 2)), 'That is exactly 2: "at least 2" includes 3, 4, … as well.', 2)],
          solution: [md`$${pX('>', t)} = 1 - ${d4(binomCdf(n, p, t))} = ${d4(q)}$`, md`$Y \sim \mathrm{B}(${m}, ${d4(q)})$: $\mathrm{P}(Y \geqslant 2) = 1 - (${d4(1 - q)})^{${m}} - ${m}(${d4(q)})(${d4(1 - q)})^{${m - 1}} = ${answerTex(A4v)}$`],
        }),
      ],
      params: { n, p, k1, k2, lo, hi, t, m },
    };
  },
  verify(inst) {
    const { n, p, k1, k2, lo, hi, t, m } = inst.params as Record<string, number>;
    const pmf = (x: number) => binomPmfDirect(n, p, x);
    const sum = (a: number, b: number) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => pmf(a + i)).reduce((s, x) => s + x, 0);
    const val = (i: number) => (inst.parts[i].answer as NumericSpec).value;
    expectClose(val(1), pmf(k1), 'P(X = k1)', 1e-9);
    expectClose(val(2), sum(0, k2 - 1), 'P(X < k2)', 1e-9);
    expectClose(val(3), sum(lo, hi - 1), 'P(lo ≤ X < hi)', 1e-9);
    const q = sum(t + 1, n);
    const py = (y: number) => binomPmfDirect(m, q, y);
    expectClose(val(4), Array.from({ length: m - 1 }, (_, i) => py(i + 2)).reduce((s, x) => s + x, 0), 'P(Y ≥ 2)', 1e-9);
    expect(val(4) > 0 && val(4) < 1, 'a probability');
  },
});

const templates: Template[] = [samples];
export default templates;
