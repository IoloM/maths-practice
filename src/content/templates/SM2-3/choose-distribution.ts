/** Statistics Year 2 — selecting an appropriate distribution (binomial, normal, discrete uniform) and using it. */
import { Q } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum, fmtDP } from '../../../engine/core/format';
import { binomCdf, binomPmf, normalCdf } from '../../../engine/stats/distributions';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, ExactSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';

const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
const DISTS = ['A binomial distribution', 'A normal distribution', 'A discrete uniform distribution'];

const choose = defineTemplate({
  id: 'sm2.3.choose-appropriate-distribution',
  family: 'sm2.3.choosing-distributions',
  title: 'Select an appropriate distribution, state its conditions and use it',
  spec: ['S4.3', 'S4.1', 'S4.2'],
  chapter: 'SM2.3',
  sections: ['3.1'],
  level: 'A2',
  paper: [3],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['State', 'Find', 'Give a reason'],
  tags: ['distributions', 'binomial', 'normal', 'discrete uniform', 'modelling'],
  generate(r) {
    const kind = r.pick([0, 0, 1, 1, 2] as const);
    let stem: string, prob: NumericSpec | ExactSpec, ask: string, how: string[], cond: string[], val: number, det: Record<string, number | boolean>;
    if (kind === 0) {
      const ctx = r.pick([
        ['A biased coin lands heads with probability', 'tossed', 'heads'],
        ['A seed germinates with probability', 'planted', 'seeds that germinate'],
        ['A component is faulty with probability', 'tested', 'faulty components'],
        ['A basketball player scores a free throw with probability', 'attempted', 'successful free throws'],
      ]);
      const p = r.pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45]),
        n = r.pick([8, 10, 12, 15, 20]),
        k = r.int(1, Math.min(6, n - 1));
      const le = r.bool();
      val = le ? binomCdf(n, p, k) : binomPmf(n, p, k);
      det = { n, p, k, le };
      stem = md`${ctx[0]} $${p}$. ${n === 8 ? 'Eight' : `$${n}$`} are ${ctx[1]}, independently. Let $X$ be the number of ${ctx[2]}.`;
      ask = le ? md`Find $\mathrm{P}(X \leqslant ${k})$.` : md`Find $\mathrm{P}(X = ${k})$.`;
      prob = ans.num(val, { dp: 4 }, { alts: [Number(fmtDP(val, 3))] });
      how = [md`$X \sim \mathrm{B}(${n}, ${p})$`, le ? md`Use the cumulative binomial function: $\mathrm{P}(X \leqslant ${k})$.` : md`$\mathrm{P}(X = ${k}) = \binom{${n}}{${k}}(${p})^{${k}}(${fmtNum(1 - p)})^{${n - k}}$`];
      cond = ['A fixed number of independent trials, each with the same probability of success', 'The data are continuous and symmetric', 'Every outcome is equally likely'];
    } else if (kind === 1) {
      const ctx = r.pick([
        ['The heights of adult women in a country', 'cm', 165, 6],
        ['The masses of bags of flour filled by a machine', 'g', 1010, 4],
        ['The times taken by students to complete a puzzle', 'seconds', 95, 12],
        ['The lengths of bolts made by a machine', 'mm', 50, 0.4],
      ] as const);
      const mu = ctx[2],
        sd = ctx[3];
      const x = Number(fmtNum(mu + sd * r.pick([-1.5, -1, -0.5, 0.5, 1, 1.25, 1.5, 2]), 2));
      const less = r.bool();
      val = less ? normalCdf(x, mu, sd) : 1 - normalCdf(x, mu, sd);
      det = { mu, sd, x, less };
      stem = md`${ctx[0]} have mean $${mu}$ ${ctx[1]} and standard deviation $${sd}$ ${ctx[1]}. The distribution is symmetrical and bell-shaped. Let $X$ be the measurement for one randomly chosen item.`;
      ask = less ? md`Find $\mathrm{P}(X < ${x})$.` : md`Find $\mathrm{P}(X > ${x})$.`;
      prob = ans.num(val, { dp: 4 }, { alts: [Number(fmtDP(val, 3))] });
      how = [md`$X \sim \mathrm{N}(${mu}, ${fmtNum(sd)}^{2})$`, 'Use the normal cumulative distribution function on your calculator.'];
      cond = ['The variable is continuous, symmetric about the mean, with most values close to the mean', 'There are a fixed number of independent trials', 'Every value is equally likely'];
    } else {
      const ctx = r.pick([
        ['A fair spinner has sectors numbered', 'spun'],
        ['A fair die has faces numbered', 'rolled'],
        ['Raffle tickets are numbered', 'drawn at random'],
      ]);
      const n = r.pick([5, 6, 8, 10, 12, 20]);
      const k = r.int(1, n - 1);
      val = (n - k) / n;
      det = { n, k };
      stem = md`${ctx[0]} $1$ to $${n}$. One is ${ctx[1]} and $X$ is the number obtained.`;
      ask = md`Find $\mathrm{P}(X > ${k})$.`;
      prob = ans.exact(num(Q.of(n - k, n)), undefined, { allowDecimal: true });
      how = [md`Each value has probability $\dfrac{1}{${n}}$.`, md`Count the values greater than $${k}$: there are $${n - k}$.`];
      cond = ['Each of the n outcomes is equally likely', 'There is a fixed number of independent trials', 'The variable is continuous'];
    }
    const C: ChoiceSpec = ans.choice(DISTS, kind);
    const Cond: ChoiceSpec = ans.choice(cond, 0);
    return {
      stem,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`State a suitable distribution to model $X$.`, answer: C, scheme: [B1(DISTS[kind])], hints: ['Is X a count of successes, a continuous measurement, or one of several equally likely outcomes?', 'Binomial: fixed number of independent trials with constant probability.', 'Normal: continuous, symmetric, bell-shaped.'], solution: [`${DISTS[kind]}: ${how[0]}`] }),
        part({ label: 'b', marks: 1, prompt: md`State a condition needed for this distribution to be appropriate.`, answer: Cond, scheme: [B1('Correct condition in context')], hints: ['What makes this distribution the right one?', 'Think about how the data arise.', 'Each distribution has its own conditions.'], solution: [cond[0]] }),
        part({ label: 'c', marks: 3, prompt: ask, answer: prob, scheme: [M1(how[0]), M1('Correct method for the probability'), A1(md`$${kind === 2 ? answerTex(prob) : fmtDP(val, 4)}$`)], hints: [`Use ${DISTS[kind].replace('A ', 'the ')}.`, how[1], kind === 2 ? 'Write as a fraction.' : 'Give 4 decimal places.'], solution: [how[0], md`$${answerTex(prob)}$`] }),
      ],
      params: { kind, det },
    };
  },
  verify(inst) {
    const { kind, det } = inst.params as { kind: number; det: Record<string, number> & { le?: boolean; less?: boolean } };
    let want: number;
    if (kind === 0) {
      const C = (n: number, r: number) => { let c = 1; for (let i = 1; i <= r; i++) c = (c * (n - r + i)) / i; return c; };
      const pm = (r: number) => C(det.n, r) * det.p ** r * (1 - det.p) ** (det.n - r);
      want = det.le ? Array.from({ length: det.k + 1 }, (_, r) => pm(r)).reduce((a, b) => a + b, 0) : pm(det.k);
    } else if (kind === 1) {
      // Simpson's rule on the pdf from mu − 10σ
      const f = (t: number) => Math.exp(-((t - det.mu) ** 2) / (2 * det.sd ** 2)) / (det.sd * Math.sqrt(2 * Math.PI));
      const a = det.mu - 10 * det.sd, b = det.x, N = 4000, h = (b - a) / N;
      let s = f(a) + f(b);
      for (let i = 1; i < N; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
      const cdf = (s * h) / 3;
      want = det.less ? cdf : 1 - cdf;
    } else want = Array.from({ length: det.n }, (_, i) => i + 1).filter((v) => v > det.k).length / det.n;
    expectClose(valOf(inst.parts[2].answer as NumericSpec | ExactSpec), want, 'probability', 1e-8);
    expect((inst.parts[0].answer as ChoiceSpec).correct[0] === kind, 'distribution');
  },
});

const templates: Template[] = [choose];
export default templates;
