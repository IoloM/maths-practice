/** Statistics Year 1, Chapter 7 — a test by its p-value, then the acceptance region. */
import { binomCdf, binomPmf } from '../../../engine/stats/distributions';
import { neg, num, sym } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, IntervalSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, err, iv, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { binomCdfBeta, d4, pX, pct, pTex, pickContext } from '../shared/stats';

const INF = sym('infty');

/** Smallest c with P(X ⩾ c) ⩽ a (upper tail), or largest c with P(X ⩽ c) ⩽ a (lower tail). */
const upperCrit = (n: number, p: number, a: number) => {
  let c = n + 1;
  while (c - 1 >= 0 && 1 - binomCdf(n, p, c - 2) <= a) c--;
  return c;
};
const lowerCrit = (n: number, p: number, a: number) => {
  let c = -1;
  while (c + 1 <= n && binomCdf(n, p, c + 1) <= a) c++;
  return c;
};

const pValueAcceptance = defineTemplate({
  id: 'sm1.7.p-value-and-acceptance-region',
  family: 'sm1.7.binomial-test',
  title: 'Hypotheses, a p-value and conclusion, then the acceptance region',
  spec: ['S5.1', 'S5.2'],
  chapter: 'SM1.7',
  sections: ['7.1', '7.3'],
  level: 'AS',
  paper: [3],
  difficulty: 3,
  marks: 8,
  time: 10,
  commands: ['Write down', 'Find', 'State'],
  tags: ['hypothesis test', 'p-value', 'acceptance region', 'binomial'],
  generate(r) {
    const n = r.pick([15, 20, 25, 30, 40, 50]);
    const p = r.pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4]);
    const alpha = r.pick([0.05, 0.1, 0.01]);
    const side = r.pick(['upper', 'lower'] as const);
    const mu = n * p;
    const sd = Math.sqrt(mu * (1 - p));
    const x = side === 'upper' ? r.int(Math.ceil(mu + 0.5), Math.min(n, Math.ceil(mu + 2.5 * sd) + 1)) : r.int(Math.max(0, Math.floor(mu - 2.5 * sd) - 1), Math.floor(mu - 0.5));
    const pv = side === 'upper' ? 1 - binomCdf(n, p, x - 1) : binomCdf(n, p, x);
    r.require(pv > 0.0005 && pv < 0.45 && Math.abs(pv - alpha) > Math.max(0.003, alpha * 0.15));
    const reject = pv < alpha;
    const c = side === 'upper' ? upperCrit(n, p, alpha) : lowerCrit(n, p, alpha);
    r.require(side === 'upper' ? c <= n && c >= 1 : c >= 0 && c < n);
    const ctx = pickContext(r);
    const dir = side === 'upper' ? 'increased' : 'decreased';
    const h1 = side === 'upper' ? '>' : '<';
    const hyps = [
      md`$\mathrm{H_0} : p = ${pTex(p)}$, $\mathrm{H_1} : p ${h1} ${pTex(p)}$`,
      md`$\mathrm{H_0} : p = ${pTex(p)}$, $\mathrm{H_1} : p \neq ${pTex(p)}$`,
      md`$\mathrm{H_0} : p ${h1} ${pTex(p)}$, $\mathrm{H_1} : p = ${pTex(p)}$`,
      md`$\mathrm{H_0} : p = ${pTex(Math.round((x / n) * 1000) / 1000)}$, $\mathrm{H_1} : p ${h1} ${pTex(Math.round((x / n) * 1000) / 1000)}$`,
    ];
    const H: ChoiceSpec = ans.choice(hyps, 0);
    const PV: NumericSpec = ans.num(pv, { dp: 4 });
    const yes = md`Reject $\mathrm{H_0}$: there is sufficient evidence at the $${pct(alpha)}$ level that the proportion of ${ctx.noun} has ${dir}.`;
    const no = md`Do not reject $\mathrm{H_0}$: there is insufficient evidence at the $${pct(alpha)}$ level that the proportion of ${ctx.noun} has ${dir}.`;
    const proof = md`${reject ? 'Reject' : 'Do not reject'} $\mathrm{H_0}$: this proves that the proportion of ${ctx.noun} has ${reject ? dir : 'not changed'}.`;
    const C: ChoiceSpec = ans.choice([yes, no, proof], reject ? 0 : 1);
    const AR: IntervalSpec = ans.interval(side === 'upper' ? [iv(neg(INF), num(c - 1), false, true)] : [iv(num(c + 1), INF, true, false)], 'X', { integer: true });
    const CRwrong = ans.interval(side === 'upper' ? [iv(num(c), INF, true, false)] : [iv(neg(INF), num(c), false, true)], 'X', { integer: true });
    const edge = side === 'upper' ? [1 - binomCdf(n, p, c - 2), 1 - binomCdf(n, p, c - 1)] : [binomCdf(n, p, c + 1), binomCdf(n, p, c)];
    const statOp = side === 'upper' ? '>=' : '<=';
    return {
      stem: md`${ctx.person} claims that $${pct(p)}$ of ${ctx.population} ${ctx.are}. A researcher believes that the proportion has ${dir}. In a random sample of $${n}$ ${ctx.items}, $${x}$ ${ctx.are}. The researcher tests the belief at the $${pct(alpha)}$ level of significance.`,
      parts: [
        part({
          label: 'a',
          marks: 1,
          prompt: md`Write down suitable hypotheses for the test.`,
          answer: H,
          scheme: [B1(md`$\mathrm{H_0} : p = ${pTex(p)}$, $\mathrm{H_1} : p ${h1} ${pTex(p)}$`)],
          hints: ['Hypotheses are about the population proportion p, not the sample.', `The researcher thinks it has ${dir}: a one-tailed test.`, md`$\mathrm{H_0}$ always has the equals sign.`],
          solution: [md`$\mathrm{H_0} : p = ${pTex(p)}$, $\mathrm{H_1} : p ${h1} ${pTex(p)}$`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Find the $p$-value for the test.`,
          answer: PV,
          scheme: [M1(md`$X \sim \mathrm{B}(${n}, ${pTex(p)})$ and attempts $${pX(statOp, x)}$`), A1(md`awrt $${d4(pv)}$`)],
          hints: ['The p-value is the probability, if H₀ is true, of a result at least as extreme as the one observed.', md`Under $\mathrm{H_0}$, $X \sim \mathrm{B}(${n}, ${pTex(p)})$.`, side === 'upper' ? md`$${pX('>=', x)} = 1 - ${pX('<=', x - 1)}$` : md`Find $${pX('<=', x)}$.`],
          errors: [err('pmf', ans.num(binomPmf(n, p, x), { dp: 4 }), md`That is $${pX('=', x)}$: the $p$-value includes every result at least as extreme.`), err('end-point', ans.num(side === 'upper' ? 1 - binomCdf(n, p, x) : binomCdf(n, p, x - 1), { dp: 4 }), md`Include $${x}$ itself: $${pX(statOp, x)}$.`)],
          solution: [side === 'upper' ? md`$${pX('>=', x)} = 1 - ${pX('<=', x - 1)} = ${d4(pv)}$` : md`$${pX('<=', x)} = ${d4(pv)}$`],
        }),
        part({
          label: 'c',
          marks: 2,
          prompt: md`State, with a reason, the conclusion of the test.`,
          answer: C,
          scheme: [M1(md`Compares $${d4(pv)}$ with $${pTex(alpha)}$`), A1('Correct conclusion in context, not overstated')],
          hints: ['Reject H₀ if the p-value is less than the significance level.', md`Compare $${d4(pv)}$ with $${pTex(alpha)}$.`, 'A test gives evidence; it never proves anything.'],
          solution: [md`$${d4(pv)} ${reject ? '<' : '>'} ${pTex(alpha)}$`, reject ? yes : no],
        }),
        part({
          label: 'd',
          marks: 3,
          prompt: md`Find the acceptance region for this test.`,
          answer: AR,
          scheme: [M1(md`Finds the critical value: $${pX(statOp, side === 'upper' ? c - 1 : c + 1)} = ${d4(edge[0])}$, $${pX(statOp, c)} = ${d4(edge[1])}$`), A1(md`Critical region $${answerTex(CRwrong)}$`), A1(md`Acceptance region $${answerTex(AR)}$`)],
          hints: ['The acceptance region is every value of X that is not in the critical region.', side === 'upper' ? md`Find the smallest $c$ with $${pX('>=', 'c')} \leqslant ${pTex(alpha)}$.` : md`Find the largest $c$ with $${pX('<=', 'c')} \leqslant ${pTex(alpha)}$.`, md`The critical region is $${answerTex(CRwrong)}$; the acceptance region is the rest.`],
          errors: [err('critical-not-acceptance', CRwrong, 'That is the critical region. The acceptance region is the values that do not lead to rejecting H₀.', 2)],
          solution: [md`$${pX(statOp, side === 'upper' ? c - 1 : c + 1)} = ${d4(edge[0])} > ${pTex(alpha)}$, $${pX(statOp, c)} = ${d4(edge[1])} \leqslant ${pTex(alpha)}$`, md`Critical region $${answerTex(CRwrong)}$, so the acceptance region is $${answerTex(AR)}$.`],
        }),
      ],
      params: { n, p, alpha, side, x, c },
    };
  },
  verify(inst) {
    const { n, p, alpha, side, x, c } = inst.params as { n: number; p: number; alpha: number; side: string; x: number; c: number };
    const pv = side === 'upper' ? 1 - binomCdfBeta(n, p, x - 1) : binomCdfBeta(n, p, x);
    expectClose((inst.parts[1].answer as NumericSpec).value, pv, 'p-value', 1e-9);
    const C = inst.parts[2].answer as ChoiceSpec;
    expect(C.correct[0] === (pv < alpha ? 0 : 1), 'conclusion');
    if (side === 'upper') expect(1 - binomCdfBeta(n, p, c - 1) <= alpha && 1 - binomCdfBeta(n, p, c - 2) > alpha, 'upper critical value');
    else expect(binomCdfBeta(n, p, c) <= alpha && binomCdfBeta(n, p, c + 1) > alpha, 'lower critical value');
    // the observed value is in the acceptance region exactly when H0 is not rejected
    expect((side === 'upper' ? x <= c - 1 : x >= c + 1) === pv >= alpha, 'acceptance region matches the decision');
  },
});

export default [pValueAcceptance] satisfies Template[];
