/** Statistics Year 2, Chapter 3 — A* stretch: a normal probability feeds a binomial model, then an inverse-normal design question (normal, binomial, inverse normal). */
import { fmtDP, fmtNum, fmtSF } from '../../../engine/core/format';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { binomCdf, invPhi, normalCdf } from '../../../engine/stats/distributions';

const CONTEXTS = [
  { thing: 'apple', things: 'apples', unit: 'g', measure: 'mass', heavy: 'heavy', pack: 'bag', mus: [130, 140, 150, 160, 170], sigmas: [8, 10, 12, 15] },
  { thing: 'egg', things: 'eggs', unit: 'g', measure: 'mass', heavy: 'large', pack: 'box', mus: [55, 58, 60, 62, 65], sigmas: [3, 4, 5] },
  { thing: 'battery', things: 'batteries', unit: 'hours', measure: 'lifetime', heavy: 'long-life', pack: 'pack', mus: [40, 45, 50, 55, 60], sigmas: [4, 5, 6, 8] },
];
/** table value for P(Z > z) = 5%, 10%, 2.5%, 1% */
const Z: [number, number][] = [
  [0.05, 1.6449],
  [0.1, 1.2816],
  [0.025, 1.96],
  [0.01, 2.3263],
];

const normalThenBinomial = defineTemplate({
  id: 'sm2.3.stretch-normal-then-binomial-then-design',
  family: 'stretch.normal-then-binomial-then-design',
  title: 'A* stretch: a normal probability feeds a binomial model, then choose a new mean',
  spec: ['S4.2', 'S4.1', 'S4.3'],
  chapter: 'SM2.3',
  level: 'A2',
  paper: [3],
  difficulty: 5,
  marks: 10,
  time: 13,
  commands: ['Find'],
  tags: ['stretch', 'synoptic', 'normal distribution', 'binomial distribution', 'inverse normal', 'modelling'],
  generate(r) {
    const ctx = r.pick(CONTEXTS);
    const mu = r.pick(ctx.mus);
    const sigma = r.pick(ctx.sigmas);
    const w = mu + Math.round(sigma * r.pick([0.6, 0.8, 1, 1.2, 1.5]));
    const p = 1 - normalCdf(w, mu, sigma);
    r.require(p > 0.05 && p < 0.35);
    const n = r.pick([6, 8, 10, 12, 15]);
    const k = r.int(2, 4);
    const atLeast = (pp: number) => 1 - binomCdf(n, pp, k - 1);
    const v = atLeast(p);
    r.require(v > 0.05 && v < 0.95);
    const [tail, z] = r.pick(Z);
    r.require(tail < p);
    const mu2 = w - z * sigma;
    const P: NumericSpec = ans.num(p, { sf: 3 });
    const V: NumericSpec = ans.num(v, { sf: 3 }, { alts: [atLeast(Number(fmtDP(p, 4))), atLeast(Number(fmtSF(p, 3)))] });
    const M: NumericSpec = ans.num(mu2, { sf: 3 }, { unit: `\\text{ ${ctx.unit}}` });
    const pT = fmtDP(p, 4);
    const pct = fmtNum(tail * 100);
    return {
      stem: md`The ${ctx.measure}s, $X$ ${ctx.unit}, of ${ctx.things} from a supplier are modelled as $X \sim \mathrm{N}(${mu}, ${sigma}^{2})$. A ${ctx.thing} is called *${ctx.heavy}* if its ${ctx.measure} is more than $${w}$ ${ctx.unit}.`,
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Find the probability that a randomly chosen ${ctx.thing} is ${ctx.heavy}.`,
          answer: P,
          scheme: [M1(md`$\mathrm{P}(X > ${w})$, e.g. $\mathrm{P}\left(Z > \dfrac{${w} - ${mu}}{${sigma}}\right)$`), A1(md`$${answerTex(P)}$`)],
          hints: [md`You want $\mathrm{P}(X > ${w})$.`, md`Standardise: $z = \dfrac{${w} - ${mu}}{${sigma}} = ${fmtDP((w - mu) / sigma, 4)}$`, 'Normal CD on the calculator, from the value up to a very large number.'],
          solution: [md`$\mathrm{P}(X > ${w}) = ${pT}\ldots$`, md`$${answerTex(P)}$`],
        }),
        part({
          label: 'b',
          marks: 4,
          prompt: md`${ctx.things[0].toUpperCase()}${ctx.things.slice(1)} are sold in ${ctx.pack}s of $${n}$, chosen at random. Find the probability that a ${ctx.pack} contains at least $${k}$ ${ctx.heavy} ${ctx.things}.`,
          answer: V,
          scheme: [M1(md`$Y \sim \mathrm{B}(${n}, ${pT})$, where $Y$ is the number of ${ctx.heavy} ${ctx.things}`), M1(md`$\mathrm{P}(Y \ge ${k}) = 1 - \mathrm{P}(Y \le ${k - 1})$`), dM1('Evaluates with a binomial cumulative probability'), A1(md`$${answerTex(V)}$`)],
          hints: [md`Each ${ctx.thing} is ${ctx.heavy} or not, independently, with the probability from (a): a binomial model.`, md`$Y \sim \mathrm{B}(${n}, ${pT})$`, md`"At least $${k}$" is $1 - \mathrm{P}(Y \le ${k - 1})$.`],
          errors: [err('more-than', ans.num(1 - binomCdf(n, p, k), { sf: 3 }), md`"At least $${k}$" includes $${k}$: use $1 - \mathrm{P}(Y \le ${k - 1})$, not $1 - \mathrm{P}(Y \le ${k})$.`, 2)],
          solution: [md`$Y \sim \mathrm{B}(${n}, ${pT})$`, md`$\mathrm{P}(Y \ge ${k}) = 1 - \mathrm{P}(Y \le ${k - 1}) = 1 - ${fmtDP(binomCdf(n, p, k - 1), 4)}$`, md`$= ${answerTex(V)}$`],
        }),
        part({
          label: 'c',
          marks: 4,
          prompt: md`The supplier wants only $${pct}\%$ of ${ctx.things} to be ${ctx.heavy}, without changing the standard deviation. Find the mean that would give this.`,
          answer: M,
          scheme: [M1(md`$\dfrac{${w} - \mu}{${sigma}} = z$`), B1(md`$z = ${z}$ (or better)`), dM1(md`Solves: $\mu = ${w} - ${z} \times ${sigma}$`), A1(md`$${answerTex(M)}$`)],
          hints: [md`You need $\mathrm{P}(X > ${w}) = ${fmtNum(tail)}$ with a new mean $\mu$ and the same $\sigma = ${sigma}$.`, md`$\mathrm{P}(Z > z) = ${fmtNum(tail)}$ gives $z = ${z}$ (from the percentage points table, or inverse normal).`, md`$\dfrac{${w} - \mu}{${sigma}} = ${z}$`],
          errors: [err('wrong-sign', ans.num(w + z * sigma, { sf: 3 }), md`The mean must be below $${w}$ for only $${pct}\%$ to be above it: $\mu = ${w} - ${z} \times ${sigma}$.`)],
          solution: [md`$\dfrac{${w} - \mu}{${sigma}} = ${z}$`, md`$\mu = ${w} - ${z} \times ${sigma} = ${fmtDP(mu2, 2)}$`, md`$${answerTex(M)}$`],
        }),
      ],
      params: { mu, sigma, w, n, k, tail },
    };
  },
  verify(inst) {
    const { mu, sigma, w, n, k, tail } = inst.params as Record<string, number>;
    const p = (inst.parts[0].answer as NumericSpec).value;
    expectClose(p, 1 - normalCdf(w, mu, sigma), 'P(X > w)');
    let at = 0;
    for (let y = k; y <= n; y++) {
      let c = 1;
      for (let i = 0; i < y; i++) c = (c * (n - i)) / (i + 1);
      at += c * p ** y * (1 - p) ** (n - y);
    }
    expectClose((inst.parts[1].answer as NumericSpec).value, at, 'P(Y ≥ k)');
    const m2 = (inst.parts[2].answer as NumericSpec).value;
    expect(Math.abs(1 - normalCdf(w, m2, sigma) - tail) < 2e-5, 'the new mean gives the tail');
    expectClose(invPhi(1 - tail), (w - m2) / sigma, 'z', 1e-4);
  },
});

const templates: Template[] = [normalThenBinomial];
export default templates;
