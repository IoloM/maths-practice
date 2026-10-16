/** Statistics Year 1, Chapter 7 — hypothesis testing with the binomial distribution. */
import { binomCdf, binomPmf } from '../../../engine/stats/distributions';
import { num, sym, neg } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { HypothesisSpec, IntervalSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ans, defineTemplate, err, iv, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import type { Rng } from '../../../engine/core/rng';
import { binomCdfBeta, d4, pX, pickContext, pTex, pct, type BinContext } from '../shared/stats';

const INF = sym('infty');

type Tail = 'upper' | 'lower' | 'two';

function conclusions(r: Rng, ctx: BinContext, alpha: number, direction: string, reject: boolean): { options: string[]; correct: number } {
  const lvl = pct(alpha);
  const yes = md`There is sufficient evidence at the $${lvl}$ level to support the claim that the proportion of ${ctx.noun} has ${direction}.`;
  const no = md`There is insufficient evidence at the $${lvl}$ level to support the claim that the proportion of ${ctx.noun} has ${direction}.`;
  const proofYes = md`This proves that the proportion of ${ctx.noun} has ${direction}.`;
  const proofNo = md`This proves that the proportion of ${ctx.noun} has not changed.`;
  const opts = r.shuffle([yes, no, reject ? proofYes : proofNo]);
  return { options: opts, correct: opts.indexOf(reject ? yes : no) };
}

interface TestSetup {
  n: number;
  p: number;
  alpha: number;
  x: number;
  pv: number;
  thr: number;
  reject: boolean;
  side: 'upper' | 'lower';
}

function setup(r: Rng, tail: Tail): TestSetup {
  const n = r.pick([10, 12, 15, 20, 25, 30, 40, 50]);
  const p = r.pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5]);
  const alpha = tail === 'two' ? r.pick([0.05, 0.1]) : r.pick([0.01, 0.05, 0.1]);
  const thr = tail === 'two' ? alpha / 2 : alpha;
  const side: 'upper' | 'lower' = tail === 'two' ? r.pick(['upper', 'lower'] as const) : tail;
  const mu = n * p;
  const x = side === 'upper' ? r.int(Math.ceil(mu + 0.5), Math.min(n, Math.ceil(mu) + Math.ceil(2.5 * Math.sqrt(mu * (1 - p))) + 1)) : r.int(Math.max(0, Math.floor(mu) - Math.ceil(2.5 * Math.sqrt(mu * (1 - p))) - 1), Math.floor(mu - 0.5));
  const pv = side === 'upper' ? 1 - binomCdf(n, p, x - 1) : binomCdf(n, p, x);
  r.require(pv > 0.0005 && pv < 0.45);
  r.require(Math.abs(pv - thr) > Math.max(0.003, thr * 0.15)); // no borderline cases
  return { n, p, alpha, x, pv, thr, reject: pv < thr, side };
}

function makeTest(id: string, tail: Tail, difficulty: 3 | 4, title: string): Template {
  return defineTemplate({
    id,
    family: 'sm1.7.binomial-test',
    title,
    spec: ['S5.2', 'S5.1'],
    chapter: 'SM1.7',
    sections: [tail === 'two' ? '7.4' : '7.3'],
    level: 'AS',
    paper: [3],
    difficulty,
    marks: 5,
    time: 7,
    commands: ['Test'],
    tags: ['hypothesis test', 'binomial', tail === 'two' ? 'two-tailed' : 'one-tailed'],
    generate(r) {
      const s = setup(r, tail);
      const ctx = pickContext(r);
      const direction = tail === 'two' ? 'changed' : s.side === 'upper' ? 'increased' : 'decreased';
      const h1: '>' | '<' | '!=' = tail === 'two' ? '!=' : s.side === 'upper' ? '>' : '<';
      const statOp = s.side === 'upper' ? '>=' : '<=';
      const c = conclusions(r, ctx, s.alpha, direction, s.reject);
      const statLabel = tail === 'two' ? md`Tail probability $${pX(statOp, s.x)}$` : md`$p$-value`;
      const statSpec = ans.num(s.pv, { dp: 4 }, tail === 'two' ? { alts: [2 * s.pv] } : {});
      const H: HypothesisSpec = ans.hyp({
        param: 'p',
        h0: s.p,
        h1,
        stat: { label: statLabel, spec: statSpec },
        reject: s.reject,
        conclusions: c.options,
        correctConclusion: c.correct,
        marks: { hyp: 1, stat: 2, decision: 1, conclusion: 1 },
      });
      const h1Tex = h1 === '!=' ? '\\neq' : h1;
      const cmp = s.reject ? `${d4(s.pv)} < ${pTex(s.thr)}` : `${d4(s.pv)} > ${pTex(s.thr)}`;
      const wrongTail = s.side === 'upper' ? 1 - binomCdf(s.n, s.p, s.x) : binomCdf(s.n, s.p, s.x - 1);
      return {
        stem: md`${ctx.person} claims that $${pct(s.p)}$ of ${ctx.population} ${ctx.are}. ${tail === 'two' ? md`A researcher thinks that this percentage is not correct.` : md`A researcher believes that the percentage has ${direction}.`} In a random sample of $${s.n}$ ${ctx.items}, $${s.x}$ ${ctx.are}.`,
        parts: [
          part({
            marks: 5,
            prompt: md`Test, at the $${pct(s.alpha)}$ level of significance, whether there is evidence to support the researcher's belief. State your hypotheses clearly.`,
            answer: H,
            scheme: [
              B1(md`$\mathrm{H_0} : p = ${pTex(s.p)}$, $\mathrm{H_1} : p ${h1Tex} ${pTex(s.p)}$`),
              M1(md`Uses $X \sim \mathrm{B}(${s.n}, ${pTex(s.p)})$ and finds $${pX(statOp, s.x)}$`),
              A1(md`awrt $${d4(s.pv)}$`),
              dM1(md`Compares with $${pTex(s.thr)}$${tail === 'two' ? ' (half the significance level)' : ''} and makes a correct decision: ${s.reject ? 'reject' : 'do not reject'} $\mathrm{H_0}$`),
              A1(md`Correct conclusion in context`),
            ],
            hints: [
              md`Write $\mathrm{H_0}$ and $\mathrm{H_1}$ about the population proportion $p$. ${tail === 'two' ? 'The researcher only says the percentage is wrong, so this is two-tailed.' : `The researcher thinks it has ${direction}, so this is one-tailed.`}`,
              md`Under $\mathrm{H_0}$, $X \sim \mathrm{B}(${s.n}, ${pTex(s.p)})$. Find the probability of a result at least as extreme as $${s.x}$: $${pX(statOp, s.x)}$.`,
              md`Compare your probability with $${pTex(s.thr)}$.${tail === 'two' ? ' For a two-tailed test, compare each tail with half the significance level.' : ''}`,
            ],
            errors: [
              err('pmf-not-tail', ans.num(binomPmf(s.n, s.p, s.x), { dp: 4 }), md`You found $${pX('=', s.x)}$. The test needs the probability of $${s.x}$ *or more extreme*: $${pX(statOp, s.x)}$.`),
              err('wrong-tail-end', ans.num(wrongTail, { dp: 4 }), md`Check the end point: "at least as extreme as $${s.x}$" includes $${s.x}$, so use $${pX(statOp, s.x)}$.`),
            ],
            solution: [
              md`$\mathrm{H_0} : p = ${pTex(s.p)}$, $\quad \mathrm{H_1} : p ${h1Tex} ${pTex(s.p)}$`,
              md`Under $\mathrm{H_0}$, $X \sim \mathrm{B}(${s.n}, ${pTex(s.p)})$.`,
              s.side === 'upper' ? md`$${pX('>=', s.x)} = 1 - ${pX('<=', s.x - 1)} = ${d4(s.pv)}$` : md`$${pX('<=', s.x)} = ${d4(s.pv)}$`,
              md`$${cmp}$, so ${s.reject ? md`the result is significant: reject $\mathrm{H_0}$` : md`the result is not significant: do not reject $\mathrm{H_0}$`}.`,
              c.options[c.correct],
            ],
          }),
        ],
        params: { ...s, tail },
      };
    },
    verify(inst) {
      const s = inst.params as unknown as TestSetup & { tail: Tail };
      const pv = s.side === 'upper' ? 1 - binomCdfBeta(s.n, s.p, s.x - 1) : binomCdfBeta(s.n, s.p, s.x);
      const H = inst.parts[0].answer as HypothesisSpec;
      expectClose(H.stat!.spec.value, pv, 'p-value', 1e-9);
      expect(H.reject === pv < (s.tail === 'two' ? s.alpha / 2 : s.alpha), 'decision');
    },
  });
}

const upper = makeTest('sm1.7.binomial-test-upper', 'upper', 3, 'Binomial hypothesis test (one-tailed, increase)');
const lower = makeTest('sm1.7.binomial-test-lower', 'lower', 3, 'Binomial hypothesis test (one-tailed, decrease)');
const two = makeTest('sm1.7.binomial-test-two-tailed', 'two', 4, 'Binomial hypothesis test (two-tailed)');

/** Largest lower CR boundary and smallest upper boundary. */
function lowerCrit(n: number, p: number, a: number): number {
  let c = -1;
  while (c + 1 <= n && binomCdf(n, p, c + 1) <= a) c++;
  return c;
}
function upperCrit(n: number, p: number, a: number): number {
  let c = n + 1;
  while (c - 1 >= 0 && 1 - binomCdf(n, p, c - 2) <= a) c--;
  return c;
}

const crOne = defineTemplate({
  id: 'sm1.7.critical-region-one-tail',
  family: 'sm1.7.critical-region',
  title: 'Critical region for a one-tailed test',
  spec: ['S5.1', 'S5.2'],
  chapter: 'SM1.7',
  sections: ['7.2', '7.3'],
  level: 'AS',
  paper: [3],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find', 'State', 'Comment'],
  tags: ['hypothesis test', 'critical region', 'binomial'],
  generate(r) {
    const n = r.pick([10, 12, 15, 20, 25, 30, 40, 50]);
    const p = r.pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45]);
    const alpha = r.pick([0.01, 0.05, 0.1]);
    const side = r.pick(['upper', 'lower'] as const);
    const c = side === 'upper' ? upperCrit(n, p, alpha) : lowerCrit(n, p, alpha);
    r.require(side === 'upper' ? c <= n : c >= 0);
    const actual = side === 'upper' ? 1 - binomCdf(n, p, c - 1) : binomCdf(n, p, c);
    r.require(actual > 0.0005);
    const ctx = pickContext(r);
    const h1 = side === 'upper' ? '>' : '<';
    const set = side === 'upper' ? [iv(num(c), INF, true, false)] : [iv(neg(INF), num(c), false, true)];
    const CR: IntervalSpec = ans.interval(set, 'X', { integer: true });
    const SL = ans.num(actual, { dp: 4 });
    const obs = side === 'upper' ? r.int(Math.max(0, c - 3), Math.min(n, c + 2)) : r.int(Math.max(0, c - 2), c + 3);
    const inCR = side === 'upper' ? obs >= c : obs <= c;
    const C = ans.choice([md`$${obs}$ lies in the critical region, so reject $\mathrm{H_0}$`, md`$${obs}$ does not lie in the critical region, so do not reject $\mathrm{H_0}$`], inCR ? 0 : 1);
    const edge = side === 'upper' ? [c - 1, c] : [c, c + 1];
    const edgeP = side === 'upper' ? edge.map((k) => 1 - binomCdf(n, p, k - 1)) : edge.map((k) => binomCdf(n, p, k));
    const crTex = answerTex(CR);
    return {
      stem: md`${ctx.person} claims that the proportion of ${ctx.noun} is $${pTex(p)}$. A random sample of $${n}$ ${ctx.items} is taken to test whether the proportion has ${side === 'upper' ? 'increased' : 'decreased'}, using $\mathrm{H_0} : p = ${pTex(p)}$ and $\mathrm{H_1} : p ${h1} ${pTex(p)}$ at the $${pct(alpha)}$ level of significance.`,
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: md`Find the critical region for this test.`,
          answer: CR,
          scheme: [
            M1(md`Uses $X \sim \mathrm{B}(${n}, ${pTex(p)})$ and finds a probability near $${pTex(alpha)}$`),
            A1(md`$${side === 'upper' ? pX('>=', edge[1]) : pX('<=', edge[0])} = ${d4(side === 'upper' ? edgeP[1] : edgeP[0])}$ (and the neighbouring value exceeds $${pTex(alpha)}$)`),
            A1(md`Critical region: $${crTex}$`),
          ],
          hints: [
            md`The critical region is the set of values of $X$ in the ${side} tail whose total probability is at most $${pTex(alpha)}$.`,
            side === 'upper' ? md`Find the smallest $c$ with $${pX('>=', 'c')} \leqslant ${pTex(alpha)}$, using $1 - ${pX('<=', 'c - 1')}$.` : md`Find the largest $c$ with $${pX('<=', 'c')} \leqslant ${pTex(alpha)}$.`,
            md`$${side === 'upper' ? pX('>=', edge[0]) : pX('<=', edge[1])} = ${d4(side === 'upper' ? edgeP[0] : edgeP[1])}$, which is more than $${pTex(alpha)}$.`,
          ],
          errors: [
            err('one-too-far', ans.interval(side === 'upper' ? [iv(num(c - 1), INF, true, false)] : [iv(neg(INF), num(c + 1), false, true)], 'X', { integer: true }), md`The probability of that region exceeds $${pTex(alpha)}$ — move the boundary one value further into the tail.`, 1),
          ],
          solution: [
            md`Under $\mathrm{H_0}$, $X \sim \mathrm{B}(${n}, ${pTex(p)})$.`,
            side === 'upper' ? md`$${pX('>=', c - 1)} = ${d4(edgeP[0])} > ${pTex(alpha)}$ and $${pX('>=', c)} = ${d4(edgeP[1])} \leqslant ${pTex(alpha)}$` : md`$${pX('<=', c)} = ${d4(edgeP[0])} \leqslant ${pTex(alpha)}$ and $${pX('<=', c + 1)} = ${d4(edgeP[1])} > ${pTex(alpha)}$`,
            md`Critical region: $${crTex}$`,
          ],
        }),
        part({
          label: 'b',
          marks: 1,
          prompt: md`State the actual significance level of the test.`,
          answer: SL,
          scheme: [B1(md`awrt $${d4(actual)}$`)],
          hints: ['The actual significance level is the probability of the critical region under H₀.', md`It is $${side === 'upper' ? pX('>=', c) : pX('<=', c)}$.`, md`You found this probability in part (a).`],
          solution: [md`Actual significance level $= ${side === 'upper' ? pX('>=', c) : pX('<=', c)} = ${answerTex(SL)}$`],
        }),
        part({
          label: 'c',
          marks: 2,
          prompt: md`In the sample, $${obs}$ ${ctx.items} ${ctx.are}. Comment on this result.`,
          answer: C,
          scheme: [M1('Compares the observed value with the critical region'), A1(md`Correct conclusion: ${inCR ? 'reject' : 'do not reject'} $\mathrm{H_0}$`)],
          hints: ['Is the observed value inside your critical region?', 'Values in the critical region lead to rejecting H₀.', md`The critical region is $${crTex}$.`],
          solution: [md`$${obs}$ ${inCR ? 'is' : 'is not'} in the critical region $${crTex}$, so ${inCR ? 'reject' : 'do not reject'} $\mathrm{H_0}$: there is ${inCR ? 'sufficient' : 'insufficient'} evidence that the proportion of ${ctx.noun} has ${side === 'upper' ? 'increased' : 'decreased'}.`],
        }),
      ],
      params: { n, p, alpha, side, c },
    };
  },
  verify(inst) {
    const { n, p, alpha, side, c } = inst.params as { n: number; p: number; alpha: number; side: string; c: number };
    if (side === 'upper') {
      expect(1 - binomCdfBeta(n, p, c - 1) <= alpha && 1 - binomCdfBeta(n, p, c - 2) > alpha, 'upper boundary');
      expectClose((inst.parts[1].answer as NumericSpec).value, 1 - binomCdfBeta(n, p, c - 1), 'sig level', 1e-9);
    } else {
      expect(binomCdfBeta(n, p, c) <= alpha && binomCdfBeta(n, p, c + 1) > alpha, 'lower boundary');
      expectClose((inst.parts[1].answer as NumericSpec).value, binomCdfBeta(n, p, c), 'sig level', 1e-9);
    }
  },
});

const crTwo = defineTemplate({
  id: 'sm1.7.critical-region-two-tail',
  family: 'sm1.7.critical-region',
  title: 'Critical region for a two-tailed test',
  spec: ['S5.1', 'S5.2'],
  chapter: 'SM1.7',
  sections: ['7.4'],
  level: 'AS',
  paper: [3],
  difficulty: 4,
  marks: 5,
  time: 7,
  commands: ['Find', 'State'],
  tags: ['hypothesis test', 'critical region', 'two-tailed', 'binomial'],
  generate(r) {
    const n = r.pick([15, 20, 25, 30, 40, 50]);
    const p = r.pick([0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5]);
    const alpha = r.pick([0.05, 0.1]);
    const half = alpha / 2;
    const lo = lowerCrit(n, p, half);
    const hi = upperCrit(n, p, half);
    r.require(lo >= 0 && hi <= n);
    const pl = binomCdf(n, p, lo),
      pu = 1 - binomCdf(n, p, hi - 1);
    const ctx = pickContext(r);
    const CR = ans.interval([iv(neg(INF), num(lo), false, true), iv(num(hi), INF, true, false)], 'X', { integer: true });
    const SL = ans.num(pl + pu, { dp: 4 });
    const crTex = answerTex(CR);
    return {
      stem: md`It is thought that the proportion of ${ctx.noun} in ${ctx.population} is $${pTex(p)}$. A random sample of $${n}$ ${ctx.items} is to be used to test, at the $${pct(alpha)}$ level of significance, whether this proportion is different from $${pTex(p)}$.`,
      parts: [
        part({
          label: 'a',
          marks: 4,
          prompt: md`Using $\mathrm{H_0} : p = ${pTex(p)}$ and $\mathrm{H_1} : p \neq ${pTex(p)}$, find the critical region for the test. The probability in each tail should be less than $${pTex(half)}$.`,
          answer: CR,
          scheme: [
            M1(md`Uses $X \sim \mathrm{B}(${n}, ${pTex(p)})$`),
            A1(md`Lower tail: $${pX('<=', lo)} = ${d4(pl)}$`),
            A1(md`Upper tail: $${pX('>=', hi)} = ${d4(pu)}$`),
            A1(md`$${crTex}$`),
          ],
          hints: [
            md`A two-tailed test splits the significance level: each tail can have probability at most $${pTex(half)}$.`,
            md`Lower tail: largest $a$ with $${pX('<=', 'a')} < ${pTex(half)}$. Upper tail: smallest $b$ with $${pX('>=', 'b')} < ${pTex(half)}$.`,
            md`$${pX('<=', lo + 1)} = ${d4(binomCdf(n, p, lo + 1))}$ and $${pX('>=', hi - 1)} = ${d4(1 - binomCdf(n, p, hi - 2))}$ are both too big.`,
          ],
          solution: [
            md`Under $\mathrm{H_0}$, $X \sim \mathrm{B}(${n}, ${pTex(p)})$.`,
            md`$${pX('<=', lo)} = ${d4(pl)}$, $${pX('<=', lo + 1)} = ${d4(binomCdf(n, p, lo + 1))}$`,
            md`$${pX('>=', hi)} = ${d4(pu)}$, $${pX('>=', hi - 1)} = ${d4(1 - binomCdf(n, p, hi - 2))}$`,
            md`Critical region: $${crTex}$`,
          ],
        }),
        part({
          label: 'b',
          marks: 1,
          prompt: md`Find the actual significance level of this test.`,
          answer: SL,
          scheme: [B1(md`$${d4(pl)} + ${d4(pu)} = ${d4(pl + pu)}$`)],
          hints: ['Add the probabilities of both tails.', md`$${pX('<=', lo)} + ${pX('>=', hi)}$`, md`$${d4(pl)} + ${d4(pu)}$`],
          errors: [err('one-tail', ans.num(pu, { dp: 4 }), 'That is only one tail — add the probabilities of both tails.'), err('other-tail', ans.num(pl, { dp: 4 }), 'That is only one tail — add the probabilities of both tails.')],
          solution: [md`Actual significance level $= ${d4(pl)} + ${d4(pu)} = ${answerTex(SL)}$`],
        }),
      ],
      params: { n, p, half, lo, hi },
    };
  },
  verify(inst) {
    const { n, p, half, lo, hi } = inst.params as Record<string, number>;
    expect(binomCdfBeta(n, p, lo) <= half && binomCdfBeta(n, p, lo + 1) > half, 'lower');
    expect(1 - binomCdfBeta(n, p, hi - 1) <= half && 1 - binomCdfBeta(n, p, hi - 2) > half, 'upper');
    expectClose((inst.parts[1].answer as NumericSpec).value, binomCdfBeta(n, p, lo) + 1 - binomCdfBeta(n, p, hi - 1), 'actual level', 1e-9);
  },
});

const language = defineTemplate({
  id: 'sm1.7.hypothesis-language',
  family: 'sm1.7.language',
  title: 'The language of hypothesis testing',
  spec: ['S5.1'],
  chapter: 'SM1.7',
  sections: ['7.1'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 4,
  time: 4,
  commands: ['State', 'Explain'],
  tags: ['hypothesis test', 'language', 'significance level'],
  generate(r) {
    const ctx = pickContext(r);
    const n = r.pick([12, 15, 20, 25, 30]);
    const p = r.pick([0.2, 0.25, 0.3, 0.35, 0.4]);
    const alpha = r.pick([0.05, 0.1]);
    const c = upperCrit(n, p, alpha);
    r.require(c <= n);
    const actual = 1 - binomCdf(n, p, c - 1);
    const meaningOptions = r.shuffle([
      md`The probability of rejecting $\mathrm{H_0}$ when $\mathrm{H_0}$ is true.`,
      md`The probability that $\mathrm{H_0}$ is true.`,
      md`The probability of not rejecting $\mathrm{H_0}$ when $\mathrm{H_1}$ is true.`,
      md`The probability that $\mathrm{H_1}$ is true.`,
    ]);
    const meaning = ans.choice(meaningOptions, meaningOptions.findIndex((o) => o.startsWith('The probability of rejecting')));
    const P = ans.num(actual, { dp: 4 });
    const testOptions = r.shuffle([
      md`$\mathrm{H_0}$ is a statement about the population proportion $p$.`,
      md`$\mathrm{H_0}$ is a statement about the number of ${ctx.items} in the sample.`,
      md`$\mathrm{H_0}$ is what the researcher wants to prove.`,
    ]);
    const hypQ = ans.choice(testOptions, testOptions.findIndex((o) => o.includes('population')));
    return {
      stem: md`A test of $\mathrm{H_0} : p = ${pTex(p)}$ against $\mathrm{H_1} : p > ${pTex(p)}$ is carried out on a random sample of $${n}$ ${ctx.items}, where $p$ is the proportion of ${ctx.population} that ${ctx.are}. The critical region is $X \geqslant ${c}$.`,
      parts: [
        part({
          label: 'a',
          marks: 1,
          prompt: md`Which statement about the hypotheses is correct?`,
          answer: hypQ,
          scheme: [B1('Hypotheses are about the population parameter')],
          hints: ['Hypotheses are about the population, not the sample.', 'p is a population parameter.', 'The sample is used to make an inference about p.'],
          solution: [md`Hypotheses are always stated in terms of the population parameter $p$; the sample provides evidence about it.`],
        }),
        part({
          label: 'b',
          marks: 1,
          prompt: md`What does the significance level of a test represent?`,
          answer: meaning,
          scheme: [B1(md`Probability of incorrectly rejecting $\mathrm{H_0}$`)],
          hints: ['Think about what could go wrong when you reject H₀.', 'The significance level is a probability calculated assuming H₀ is true.', 'It is the chance of rejecting H₀ even though H₀ is true.'],
          solution: [md`The (actual) significance level is the probability of rejecting $\mathrm{H_0}$ when it is in fact true.`],
        }),
        part({
          label: 'c',
          marks: 2,
          prompt: md`Find the probability of incorrectly rejecting $\mathrm{H_0}$ in this test.`,
          answer: P,
          scheme: [M1(md`$${pX('>=', c)} = 1 - ${pX('<=', c - 1)}$ with $X \sim \mathrm{B}(${n}, ${pTex(p)})$`), A1(md`awrt $${d4(actual)}$`)],
          hints: ['This is the actual significance level.', md`It is the probability of the critical region when $\mathrm{H_0}$ is true.`, md`Find $${pX('>=', c)}$ with $X \sim \mathrm{B}(${n}, ${pTex(p)})$.`],
          errors: [err('stated-alpha', ans.num(alpha, { dp: 4 }), 'That is the nominal significance level. Find the actual probability of the critical region under H₀.')],
          solution: [md`$${pX('>=', c)} = 1 - ${pX('<=', c - 1)} = ${answerTex(P)}$`],
        }),
      ],
      params: { n, p, c },
    };
  },
  verify(inst) {
    const { n, p, c } = inst.params as Record<string, number>;
    expectClose((inst.parts[2].answer as NumericSpec).value, 1 - binomCdfBeta(n, p, c - 1), 'P(CR)', 1e-9);
  },
});

const templates: Template[] = [upper, lower, two, crOne, crTwo, language];
export default templates;
