/** Statistics Year 2, Chapter 3 — long exam-style question: normal probabilities, inverse normal, three items, a test for the mean. */
import { binomPmf, invPhi, normalCdf, normalPdf, phi } from '../../../engine/stats/distributions';
import { expect, expectClose, integrate } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { HypothesisSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { d4, pTex, pct } from '../shared/stats';
import { N, pickNorm } from './normal';

const pdfInt = (mu: number, s: number, a: number, b: number) => integrate((x) => normalPdf(x, mu, s), a, b, 1e-13);

const normalLong = defineTemplate({
  id: 'sm2.3.long-normal-probabilities-and-test-for-mean',
  family: 'sm2.3.exam-style',
  title: 'Exam-style: normal distribution — probabilities, inverse normal, three items and a test for the mean',
  spec: ['S4.2', 'S5.3', 'S4.1'],
  chapter: 'SM2.3',
  sections: ['3.2', '3.3', '3.7'],
  level: 'A2',
  paper: [3],
  difficulty: 4,
  marks: 13,
  time: 16,
  commands: ['Find', 'Test'],
  tags: ['exam-style', 'normal distribution', 'inverse normal', 'hypothesis test', 'sample mean'],
  generate(r) {
    const { c, mu, sigma } = pickNorm(r);
    const dpv = c.step < 1 ? 2 : 1;
    const a = Number(fmtNum(mu - r.real(0.4, 1.6, 1) * sigma, dpv));
    const pa = normalCdf(a, mu, sigma);
    const q = r.pick([0.05, 0.1, 0.15, 0.2, 0.25]);
    const w = mu + invPhi(1 - q) * sigma;
    const one = 3 * pa * (1 - pa) ** 2;
    // test for the mean, one-tailed (the new process is believed to have reduced / increased the mean)
    const side = r.pick(['upper', 'lower'] as const);
    const n = r.pick([10, 12, 16, 20, 25, 30, 36, 40]);
    const alpha = r.pick([0.01, 0.05, 0.1]);
    const se = sigma / Math.sqrt(n);
    const zt = r.real(0.7, 3.0, 2) * (side === 'upper' ? 1 : -1);
    const xbar = Number(fmtNum(mu + zt * se, c.step < 1 ? 3 : 2));
    const z = (xbar - mu) / se;
    const pv = side === 'upper' ? 1 - phi(z) : phi(z);
    r.require(Math.abs(pv - alpha) > Math.max(0.003, alpha * 0.2) && pv < 0.45);
    const reject = pv < alpha;
    const dir = side === 'upper' ? 'increased' : 'decreased';
    const what = c.what.replace(/^the /, '');
    const lvl = pct(alpha);
    const yes = md`There is sufficient evidence at the $${lvl}$ level that the mean ${what} has ${dir}.`;
    const no = md`There is insufficient evidence at the $${lvl}$ level that the mean ${what} has ${dir}.`;
    const proof = md`This proves the mean is still exactly $${fmtNum(mu)}$.`;
    const opts = r.shuffle([yes, no, proof]);
    const H: HypothesisSpec = ans.hyp({
      param: 'mu',
      h0: mu,
      h1: side === 'upper' ? '>' : '<',
      stat: { label: md`Test statistic $z$ or $p$-value`, spec: ans.num(pv, { sf: 3 }, { alts: [z] }) },
      reject,
      conclusions: opts,
      correctConclusion: opts.indexOf(reject ? yes : no),
      marks: { hyp: 1, stat: 2, decision: 1, conclusion: 1 },
    });
    const PA: NumericSpec = ans.num(pa, { dp: 4 });
    const W: NumericSpec = ans.num(w, { sf: 3 });
    const ONE: NumericSpec = ans.num(one, { dp: 4 });
    const X = c.what.charAt(0).toUpperCase() + c.what.slice(1);
    return {
      stem: md`${X} is modelled by the random variable $X \sim ${N(mu, sigma)}$.`,
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Find $\mathrm{P}(X < ${fmtNum(a)})$.`,
          answer: PA,
          scheme: [M1(md`Standardises: $\dfrac{${fmtNum(a)} - ${fmtNum(mu)}}{${fmtNum(sigma)}}$ or uses the normal function`), A1(md`awrt $${d4(pa)}$`)],
          hints: ['Use the normal cumulative function on your calculator.', md`$z = \dfrac{${fmtNum(a)} - ${fmtNum(mu)}}{${fmtNum(sigma)}} = ${fmtSF((a - mu) / sigma, 4)}$`, 'The value is below the mean, so the probability is less than 0.5.'],
          errors: [err('wrong-side', ans.num(1 - pa, { dp: 4 }), md`That is $\mathrm{P}(X > ${fmtNum(a)})$: the question asks for less than.`, 0)],
          solution: [md`$\mathrm{P}(X < ${fmtNum(a)}) = \mathrm{P}(Z < ${fmtSF((a - mu) / sigma, 4)}) = ${answerTex(PA)}$`],
        }),
        part({
          label: 'b',
          marks: 3,
          prompt: md`Find the value of $w$ such that $\mathrm{P}(X > w) = ${pTex(q)}$.`,
          answer: W,
          scheme: [B1(md`$z = ${fmtSF(invPhi(1 - q), 4)}$`), M1(md`$\dfrac{w - ${fmtNum(mu)}}{${fmtNum(sigma)}} = ${fmtSF(invPhi(1 - q), 4)}$`), A1(md`awrt $${fmtSF(w, 3)}$`)],
          hints: [md`$\mathrm{P}(X > w) = ${pTex(q)}$ means $\mathrm{P}(X < w) = ${pTex(1 - q)}$.`, md`The inverse normal of $${pTex(1 - q)}$ gives $z = ${fmtSF(invPhi(1 - q), 4)}$.`, md`$w = ${fmtNum(mu)} + z \times ${fmtNum(sigma)}$`],
          errors: [err('left-tail', ans.num(mu + invPhi(q) * sigma, { sf: 3 }), md`$w$ has $${pTex(q)}$ above it, so it is above the mean: use $${pTex(1 - q)}$ in the inverse normal.`, 1)],
          solution: [md`$\mathrm{P}(X < w) = ${pTex(1 - q)} \Rightarrow \dfrac{w - ${fmtNum(mu)}}{${fmtNum(sigma)}} = ${fmtSF(invPhi(1 - q), 4)}$`, md`$w = ${answerTex(W)}$`],
        }),
        part({
          label: 'c',
          marks: 3,
          prompt: md`Three are chosen at random. Find the probability that exactly one of them is less than $${fmtNum(a)}$.`,
          answer: ONE,
          scheme: [M1(md`$p(1 - p)^{2}$ with $p = $ their (a)`), M1('Multiplies by 3 (the arrangements)'), A1(md`awrt $${d4(one)}$`)],
          hints: [md`Each one is below $${fmtNum(a)}$ with probability $p = ${d4(pa)}$, independently.`, md`This is $\mathrm{B}(3, p)$: $\mathrm{P}(Y = 1) = 3p(1 - p)^{2}$.`, 'The 3 counts which of the three is the small one.'],
          errors: [err('no-arrangements', ans.num(pa * (1 - pa) ** 2, { dp: 4 }), 'Any of the three could be the one below: multiply by 3.', 2)],
          solution: [md`$3 \times ${d4(pa)} \times (1 - ${d4(pa)})^{2} = ${answerTex(ONE)}$`],
        }),
        part({
          label: 'd',
          marks: 5,
          prompt: md`After a change in the process, a random sample of $${n}$ is taken and its mean is $${fmtNum(xbar)}$. Assuming the standard deviation is unchanged, test, at the $${lvl}$ level of significance, whether the mean has ${dir}. State your hypotheses clearly.`,
          answer: H,
          scheme: [
            B1(md`$\mathrm{H_0}: \mu = ${fmtNum(mu)}$, $\mathrm{H_1}: \mu ${side === 'upper' ? '>' : '<'} ${fmtNum(mu)}$`),
            M1(md`$\bar{X} \sim \mathrm{N}\left(${fmtNum(mu)}, \dfrac{${fmtNum(sigma)}^{2}}{${n}}\right)$`),
            A1(md`$p$-value awrt $${fmtSF(pv, 3)}$ (or $z = ${fmtSF(z, 3)}$)`),
            dM1(md`Compares with $${pTex(alpha)}$ (or the critical value of $z$): ${reject ? 'reject' : 'do not reject'} $\mathrm{H_0}$`),
            A1('Correct conclusion in context'),
          ],
          hints: [md`Under $\mathrm{H_0}$, $\bar{X} \sim \mathrm{N}\left(${fmtNum(mu)}, \dfrac{${fmtNum(sigma)}^{2}}{${n}}\right)$: standard deviation $\dfrac{${fmtNum(sigma)}}{\sqrt{${n}}}$.`, md`Find $\mathrm{P}(\bar{X} ${side === 'upper' ? '>' : '<'} ${fmtNum(xbar)})$.`, md`Compare it with $${pTex(alpha)}$.`],
          errors: [err('no-root-n', ans.num(side === 'upper' ? 1 - phi((xbar - mu) / sigma) : phi((xbar - mu) / sigma), { sf: 3 }), md`The sample mean has standard deviation $\sigma/\sqrt{n}$, not $\sigma$.`)],
          solution: [
            md`$\mathrm{H_0}: \mu = ${fmtNum(mu)}$, $\;\mathrm{H_1}: \mu ${side === 'upper' ? '>' : '<'} ${fmtNum(mu)}$`,
            md`$\mathrm{P}(\bar{X} ${side === 'upper' ? '>' : '<'} ${fmtNum(xbar)}) = ${fmtSF(pv, 3)}$ $\;(z = ${fmtSF(z, 3)})$`,
            md`$${fmtSF(pv, 3)} ${reject ? '<' : '>'} ${pTex(alpha)}$, so ${reject ? 'reject' : 'do not reject'} $\mathrm{H_0}$.`,
            opts[opts.indexOf(reject ? yes : no)],
          ],
        }),
      ],
      params: { mu, sigma, a, q, n, alpha, xbar, side },
    };
  },
  verify(inst) {
    const { mu, sigma, a, q, n, alpha, xbar, side } = inst.params as { mu: number; sigma: number; a: number; q: number; n: number; alpha: number; xbar: number; side: string };
    const pa = pdfInt(mu, sigma, mu - 14 * sigma, a);
    expectClose((inst.parts[0].answer as NumericSpec).value, pa, 'P(X < a)', 1e-7);
    const w = (inst.parts[1].answer as NumericSpec).value;
    expectClose(pdfInt(mu, sigma, w, mu + 14 * sigma), q, 'P(X > w)', 1e-6);
    expectClose((inst.parts[2].answer as NumericSpec).value, binomPmf(3, pa, 1), 'exactly one of three', 1e-6);
    const se = sigma / Math.sqrt(n);
    const pv = side === 'upper' ? pdfInt(mu, se, xbar, mu + 14 * se) : pdfInt(mu, se, mu - 14 * se, xbar);
    const H = inst.parts[3].answer as HypothesisSpec;
    expectClose(H.stat!.spec.value, pv, 'p-value', 1e-6);
    expect(H.reject === pv < alpha, 'decision');
  },
});

const templates: Template[] = [normalLong];
export default templates;
