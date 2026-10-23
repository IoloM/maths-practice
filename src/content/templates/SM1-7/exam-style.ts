/** Statistics Year 1, Chapter 7 — long exam-style question: binomial model, probabilities, two-tailed critical region, conclusion. */
import { binomCdf, binomPmf } from '../../../engine/stats/distributions';
import { neg, num, sym } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, IntervalSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, err, iv, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { binomCdfBeta, binomPmfDirect, d4, pX, pct, pTex, pickContext } from '../shared/stats';

const INF = sym('infty');

/** Largest c with P(X ⩽ c) ⩽ t, or −1 if none. */
const lowerCrit = (n: number, p: number, t: number) => {
  let c = -1;
  while (c + 1 <= n && binomCdf(n, p, c + 1) <= t) c++;
  return c;
};
/** Smallest c with P(X ⩾ c) ⩽ t, or n + 1 if none. */
const upperCrit = (n: number, p: number, t: number) => {
  let c = n + 1;
  while (c - 1 >= 0 && 1 - binomCdf(n, p, c - 2) <= t) c--;
  return c;
};

const binomialTest = defineTemplate({
  id: 'sm1.7.long-binomial-model-and-two-tailed-test',
  family: 'sm1.7.exam-style',
  title: 'Exam-style: binomial model, probabilities, two-tailed critical region and conclusion',
  spec: ['S5.2', 'S4.1', 'S5.1'],
  chapter: 'SM1.7',
  sections: ['7.4', '7.2', '6.2'],
  level: 'AS',
  paper: [3],
  difficulty: 4,
  marks: 12,
  time: 15,
  commands: ['Give', 'Find', 'State'],
  tags: ['exam-style', 'binomial distribution', 'hypothesis test', 'critical region', 'two-tailed'],
  generate(r) {
    const ctx = pickContext(r);
    const n = r.pick([20, 25, 30, 40, 50]);
    const p = r.pick([0.15, 0.2, 0.25, 0.3, 0.35, 0.4]);
    const alpha = r.pick([0.05, 0.1]);
    const t = alpha / 2;
    const cl = lowerCrit(n, p, t),
      cu = upperCrit(n, p, t);
    r.require(cl >= 0 && cu <= n);
    const actual = binomCdf(n, p, cl) + (1 - binomCdf(n, p, cu - 1));
    const mu = n * p;
    const k = r.int(Math.max(1, Math.round(mu) - 2), Math.round(mu) + 2);
    const m = r.int(Math.round(mu), Math.round(mu) + 3);
    const pk = binomPmf(n, p, k),
      pm = 1 - binomCdf(n, p, m);
    // observed value: in the critical region or not
    const inCR = r.bool();
    const obs = inCR ? (r.bool() ? r.int(Math.max(0, cl - 1), cl) : r.int(cu, Math.min(n, cu + 1))) : r.int(cl + 1, cu - 1);
    const PK: NumericSpec = ans.num(pk, { dp: 4 });
    const PM: NumericSpec = ans.num(pm, { dp: 4 });
    const CR: IntervalSpec = ans.interval([iv(neg(INF), num(cl), false, true), iv(num(cu), INF, true, false)], 'X', { integer: true });
    const AS: NumericSpec = ans.num(actual, { dp: 4 });
    const lvl = pct(alpha);
    const optsAll = [
      md`${obs} is in the critical region: reject $\mathrm{H_0}$. There is evidence at the $${lvl}$ level that the proportion of ${ctx.noun} has changed.`,
      md`${obs} is not in the critical region: do not reject $\mathrm{H_0}$. There is insufficient evidence at the $${lvl}$ level that the proportion of ${ctx.noun} has changed.`,
      md`${obs} is in the critical region, which proves the proportion of ${ctx.noun} has changed.`,
      md`${obs} is not in the critical region, which proves the proportion of ${ctx.noun} is $${pTex(p)}$.`,
    ];
    const C: ChoiceSpec = ans.choice(optsAll, inCR ? 0 : 1);
    const looseUpper = upperCrit(n, p, alpha);
    return {
      stem: md`${ctx.person} claims that $${pct(p)}$ of ${ctx.population} ${ctx.are}. A random sample of $${n}$ ${ctx.items} is taken, and $X$ is the number in the sample that ${ctx.are}.`,
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Give two reasons why a binomial distribution may be a suitable model for $X$.`,
          answer: ans.self(md`There is a fixed number of trials ($${n}$ ${ctx.items}); each ${ctx.item} either ${ctx.is} or not; the ${ctx.items} are independent of each other; the probability that a ${ctx.item} ${ctx.is} is the same for each one.`),
          scheme: [B1(md`A fixed number of trials ($n = ${n}$) or two outcomes for each ${ctx.item}`), B1('Independent trials or a constant probability, in context')],
          hints: ['There are four conditions for a binomial model.', 'Think about how many trials there are, and what each trial can result in.', 'Think about independence and whether the probability stays the same.'],
          solution: [md`Fixed number of trials ($${n}$); two outcomes for each ${ctx.item}; ${ctx.items} independent; constant probability $${pTex(p)}$. (Any two, in context.)`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Assuming the claim is true, find $${pX('=', k)}$.`,
          answer: PK,
          scheme: [M1(md`$\binom{${n}}{${k}}(${pTex(p)})^{${k}}(${pTex(1 - p)})^{${n - k}}$`), A1(md`awrt $${d4(pk)}$`)],
          hints: [md`$X \sim \mathrm{B}(${n}, ${pTex(p)})$`, md`$\mathrm{P}(X = r) = \binom{n}{r}p^{r}(1 - p)^{n - r}$`, 'Or use the binomial point function on your calculator.'],
          errors: [err('cumulative', ans.num(binomCdf(n, p, k), { dp: 4 }), md`That is $${pX('<=', k)}$; the question asks for exactly $${k}$.`, 0)],
          solution: [md`$${pX('=', k)} = \binom{${n}}{${k}}(${pTex(p)})^{${k}}(${pTex(1 - p)})^{${n - k}} = ${answerTex(PK)}$`],
        }),
        part({
          label: 'c',
          marks: 2,
          prompt: md`Assuming the claim is true, find $${pX('>', m)}$.`,
          answer: PM,
          scheme: [M1(md`$1 - ${pX('<=', m)}$`), A1(md`awrt $${d4(pm)}$`)],
          hints: [md`$${pX('>', m)} = 1 - ${pX('<=', m)}$`, 'Use the cumulative binomial function.', 'Be careful with the end point: more than means not including.'],
          errors: [err('included-m', ans.num(1 - binomCdf(n, p, m - 1), { dp: 4 }), md`$${pX('>', m)}$ does not include $${m}$: use $1 - ${pX('<=', m)}$.`, 1)],
          solution: [md`$${pX('>', m)} = 1 - ${pX('<=', m)} = 1 - ${d4(binomCdf(n, p, m))} = ${answerTex(PM)}$`],
        }),
        part({
          label: 'd',
          marks: 3,
          prompt: md`A researcher wants to test, at the $${lvl}$ level of significance, whether the proportion is different from $${pct(p)}$. Using $\mathrm{H_0}: p = ${pTex(p)}$ and $\mathrm{H_1}: p \neq ${pTex(p)}$, find the critical region for this test. The probability in each tail should be as close as possible to, without exceeding, $${pTex(t)}$.`,
          answer: CR,
          scheme: [M1(md`Uses cumulative probabilities of $\mathrm{B}(${n}, ${pTex(p)})$ in both tails, compared with $${pTex(t)}$`), A1(md`$X \leqslant ${cl}$`), A1(md`$X \geqslant ${cu}$`)],
          hints: [md`Two-tailed at $${lvl}$: $${pTex(t)}$ in each tail.`, md`Lower tail: the largest $c$ with $${pX('<=', 'c')} \leqslant ${pTex(t)}$. ($${pX('<=', cl)} = ${d4(binomCdf(n, p, cl))}$, $${pX('<=', cl + 1)} = ${d4(binomCdf(n, p, cl + 1))}$.)`, md`Upper tail: the smallest $c$ with $${pX('>=', 'c')} \leqslant ${pTex(t)}$.`],
          errors: looseUpper === cu ? [] : [err('whole-alpha-in-tail', ans.interval([iv(neg(INF), num(lowerCrit(n, p, alpha)), false, true), iv(num(looseUpper), INF, true, false)], 'X', { integer: true }), md`For a two-tailed test, put half the significance level ($${pTex(t)}$) in each tail.`, 1)],
          solution: [
            md`$${pX('<=', cl)} = ${d4(binomCdf(n, p, cl))} \leqslant ${pTex(t)}$, $\;${pX('<=', cl + 1)} = ${d4(binomCdf(n, p, cl + 1))} > ${pTex(t)}$`,
            md`$${pX('>=', cu)} = ${d4(1 - binomCdf(n, p, cu - 1))} \leqslant ${pTex(t)}$, $\;${pX('>=', cu - 1)} = ${d4(1 - binomCdf(n, p, cu - 2))} > ${pTex(t)}$`,
            md`Critical region: $${answerTex(CR)}$`,
          ],
        }),
        part({
          label: 'e',
          marks: 1,
          prompt: md`State the actual significance level of this test.`,
          answer: AS,
          scheme: [B1(md`awrt $${d4(actual)}$`)],
          hints: ['The actual significance level is the probability of landing in the critical region when H₀ is true.', 'Add the probabilities of the two tails.', md`$${pX('<=', cl)} + ${pX('>=', cu)}$`],
          solution: [md`$${d4(binomCdf(n, p, cl))} + ${d4(1 - binomCdf(n, p, cu - 1))} = ${answerTex(AS)}$`],
        }),
        part({
          label: 'f',
          marks: 2,
          prompt: md`In the sample, $${obs}$ ${ctx.items} ${ctx.are}. Choose the correct conclusion.`,
          answer: C,
          scheme: [B1(md`${inCR ? 'In' : 'Not in'} the critical region: ${inCR ? 'reject' : 'do not reject'} $\mathrm{H_0}$`), B1('Non-assertive conclusion in context')],
          hints: ['Is your observed value in the critical region from (d)?', 'Conclusions should talk about evidence, not proof.', 'Mention the context.'],
          solution: [optsAll[inCR ? 0 : 1]],
        }),
      ],
      params: { n, p, alpha, k, m, obs, cl, cu },
    };
  },
  verify(inst) {
    const { n, p, alpha, k, m, obs, cl, cu } = inst.params as Record<string, number>;
    expectClose((inst.parts[1].answer as NumericSpec).value, binomPmfDirect(n, p, k), 'P(X = k)', 1e-9);
    expectClose((inst.parts[2].answer as NumericSpec).value, 1 - binomCdfBeta(n, p, m), 'P(X > m)', 1e-9);
    const t = alpha / 2;
    expect(binomCdfBeta(n, p, cl) <= t && binomCdfBeta(n, p, cl + 1) > t, 'lower critical value');
    expect(1 - binomCdfBeta(n, p, cu - 1) <= t && 1 - binomCdfBeta(n, p, cu - 2) > t, 'upper critical value');
    expectClose((inst.parts[4].answer as NumericSpec).value, binomCdfBeta(n, p, cl) + 1 - binomCdfBeta(n, p, cu - 1), 'actual significance', 1e-9);
    const inCR = obs <= cl || obs >= cu;
    expect((inst.parts[5].answer as ChoiceSpec).correct[0] === (inCR ? 0 : 1), 'conclusion');
  },
});

const templates: Template[] = [binomialTest];
export default templates;
