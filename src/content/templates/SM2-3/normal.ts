/** Statistics Year 2, Chapter 3 — the normal distribution, approximation and tests for a mean. */
import { binomCdf, invPhi, normalCdf, normalPdf, phi } from '../../../engine/stats/distributions';
import { expect, expectClose, integrate } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { HypothesisSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import type { Rng } from '../../../engine/core/rng';
import { binomCdfBeta, d4, pX, pTex, pct, pickContext } from '../shared/stats';

interface NormCtx {
  what: string;
  unit: string;
  mu: [number, number];
  sigma: [number, number];
  step: number;
}
const CONTEXTS: NormCtx[] = [
  { what: 'the length, in cm, of a bolt made by a machine', unit: '\\text{cm}', mu: [4, 12], sigma: [0.1, 0.5], step: 0.05 },
  { what: 'the mass, in grams, of a bag of flour', unit: '\\text{g}', mu: [480, 520], sigma: [4, 12], step: 1 },
  { what: 'the time, in minutes, taken to complete a puzzle', unit: '\\text{minutes}', mu: [20, 45], sigma: [3, 8], step: 0.5 },
  { what: 'the height, in cm, of a type of sunflower', unit: '\\text{cm}', mu: [140, 190], sigma: [8, 20], step: 1 },
  { what: 'the lifetime, in hours, of a battery', unit: '\\text{hours}', mu: [60, 120], sigma: [5, 15], step: 1 },
  { what: 'the volume, in ml, of drink in a bottle', unit: '\\text{ml}', mu: [495, 510], sigma: [2, 6], step: 0.5 },
  { what: 'the journey time, in minutes, of a bus route', unit: '\\text{minutes}', mu: [30, 60], sigma: [3, 9], step: 0.5 },
];

function pickNorm(r: Rng) {
  const c = r.pick(CONTEXTS);
  const mu = r.step(c.mu[0], c.mu[1], c.step);
  const sigma = r.step(c.sigma[0], c.sigma[1], c.step > 0.5 ? 1 : 0.05);
  return { c, mu, sigma };
}

const N = (mu: number, sigma: number) => md`\mathrm{N}(${fmtNum(mu)}, ${fmtNum(sigma)}^{2})`;
const P4 = (v: number, extra: Partial<NumericSpec> = {}) => ans.num(v, { dp: 4 }, extra);
const pdfInt = (mu: number, s: number, a: number, b: number) => integrate((x) => normalPdf(x, mu, s), a, b, 1e-13);

const probabilities = defineTemplate({
  id: 'sm2.3.normal-probabilities',
  family: 'sm2.3.normal-probabilities',
  title: 'Normal distribution probabilities',
  spec: ['S4.2'],
  chapter: 'SM2.3',
  sections: ['3.2'],
  level: 'A2',
  paper: [3],
  difficulty: 2,
  marks: 5,
  time: 6,
  commands: ['Find'],
  tags: ['normal distribution', 'probability'],
  generate(r) {
    const { c, mu, sigma } = pickNorm(r);
    const a = Number(fmtNum(mu + r.pick([-1, 1]) * r.real(0.3, 1.8, 1) * sigma, 2));
    const b = Number(fmtNum(mu + r.real(0.2, 1.6, 1) * sigma, 2));
    const lo = Number(fmtNum(mu - r.real(0.3, 1.5, 1) * sigma, 2));
    const hi = Number(fmtNum(mu + r.real(0.3, 1.5, 1) * sigma, 2));
    r.require(lo < hi && a !== mu);
    const va = normalCdf(a, mu, sigma);
    const vb = 1 - normalCdf(b, mu, sigma);
    const vc = normalCdf(hi, mu, sigma) - normalCdf(lo, mu, sigma);
    const A = P4(va),
      Bv = P4(vb),
      C = P4(vc);
    return {
      stem: md`The random variable $X$ represents ${c.what}. It is modelled as $X \sim ${N(mu, sigma)}$.`,
      parts: [
        part({
          label: 'a',
          marks: 1,
          prompt: md`Find $${pX('<', fmtNum(a))}$.`,
          answer: A,
          scheme: [B1(md`awrt $${d4(va)}$`)],
          hints: ['Use the normal cdf function on your calculator.', md`Lower limit: a very large negative number; upper limit $${fmtNum(a)}$; $\mu = ${fmtNum(mu)}$, $\sigma = ${fmtNum(sigma)}$.`, md`Or standardise: $z = \dfrac{${fmtNum(a)} - ${fmtNum(mu)}}{${fmtNum(sigma)}}$.`],
          errors: [err('variance-as-sd', P4(normalCdf(a, mu, sigma * sigma)), md`You used $\sigma^{2}$ as the standard deviation. In $\mathrm{N}(\mu, \sigma^{2})$ the second number is the variance; here $\sigma = ${fmtNum(sigma)}$.`)],
          solution: [md`$${pX('<', fmtNum(a))} = ${answerTex(A)}$ (calculator), or $\mathrm{P}\!\left(Z < ${fmtSF((a - mu) / sigma, 4)}\right)$`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Find $${pX('>', fmtNum(b))}$.`,
          answer: Bv,
          scheme: [M1(md`$1 - ${pX('<', fmtNum(b))}$ or standardises correctly`), A1(md`awrt $${d4(vb)}$`)],
          hints: ['"Greater than" — use the upper tail.', md`$${pX('>', fmtNum(b))} = 1 - ${pX('<', fmtNum(b))}$`, md`$z = \dfrac{${fmtNum(b)} - ${fmtNum(mu)}}{${fmtNum(sigma)}} = ${fmtSF((b - mu) / sigma, 4)}$`],
          errors: [err('wrong-tail', P4(1 - vb), 'That is the lower tail. You need the probability of being greater than this value.')],
          solution: [md`$${pX('>', fmtNum(b))} = 1 - ${d4(1 - vb)} = ${answerTex(Bv)}$`],
        }),
        part({
          label: 'c',
          marks: 2,
          prompt: md`Find $\mathrm{P}(${fmtNum(lo)} < X < ${fmtNum(hi)})$.`,
          answer: C,
          scheme: [M1(md`$${pX('<', fmtNum(hi))} - ${pX('<', fmtNum(lo))}$`), A1(md`awrt $${d4(vc)}$`)],
          hints: ['Use the normal cdf with both a lower and an upper limit.', md`$\mathrm{P}(a < X < b) = \mathrm{P}(X < b) - \mathrm{P}(X < a)$`, md`Lower limit $${fmtNum(lo)}$, upper limit $${fmtNum(hi)}$.`],
          solution: [md`$\mathrm{P}(${fmtNum(lo)} < X < ${fmtNum(hi)}) = ${d4(normalCdf(hi, mu, sigma))} - ${d4(normalCdf(lo, mu, sigma))} = ${answerTex(C)}$`],
        }),
      ],
      params: { mu, sigma, a, b, lo, hi },
    };
  },
  verify(inst) {
    const { mu, sigma, a, b, lo, hi } = inst.params as Record<string, number>;
    const v = inst.parts.map((p) => (p.answer as NumericSpec).value);
    expectClose(v[0], pdfInt(mu, sigma, mu - 12 * sigma, a), 'P(X<a)', 1e-8);
    expectClose(v[1], pdfInt(mu, sigma, b, mu + 12 * sigma), 'P(X>b)', 1e-8);
    expectClose(v[2], pdfInt(mu, sigma, lo, hi), 'P(lo<X<hi)', 1e-8);
  },
});

const inverse = defineTemplate({
  id: 'sm2.3.inverse-normal',
  family: 'sm2.3.inverse-normal',
  title: 'Inverse normal: find a value from a probability',
  spec: ['S4.2'],
  chapter: 'SM2.3',
  sections: ['3.3'],
  level: 'A2',
  paper: [3],
  difficulty: 2,
  marks: 3,
  time: 4,
  commands: ['Find'],
  tags: ['normal distribution', 'inverse normal'],
  generate(r) {
    const { c, mu, sigma } = pickNorm(r);
    const pp = r.pick([0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95]);
    const upper = r.bool();
    const target = upper ? 1 - pp : pp;
    const a = mu + sigma * invPhi(target);
    const A = ans.num(a, { sf: 3 }, { unit: c.unit });
    const statement = upper ? pX('>', 'a') : pX('<', 'a');
    return {
      stem: md`The random variable $X$ represents ${c.what}, where $X \sim ${N(mu, sigma)}$.`,
      parts: [
        part({
          marks: 3,
          prompt: md`Find the value of $a$ such that $${statement} = ${pTex(pp)}$. Give your answer to 3 significant figures.`,
          answer: A,
          scheme: [M1(md`Uses inverse normal with ${upper ? md`$${pTex(1 - pp)}$ (lower-tail area)` : md`$${pTex(pp)}$`}, or $z = ${fmtSF(invPhi(target), 4)}$`), M1(md`$\dfrac{a - ${fmtNum(mu)}}{${fmtNum(sigma)}} = ${fmtSF(invPhi(target), 4)}$`), A1(md`$a = ${answerTex(A)}$`)],
          hints: [
            upper ? md`Calculators' inverse normal works with the area to the left. $${pX('>', 'a')} = ${pTex(pp)}$ means $${pX('<', 'a')} = ${pTex(1 - pp)}$.` : 'Use the inverse normal function on your calculator.',
            md`Or use the standard normal: $a = \mu + z\sigma$ where $\Phi(z) = ${pTex(target)}$.`,
            md`$z = ${fmtSF(invPhi(target), 4)}$`,
          ],
          errors: upper ? [err('wrong-tail', ans.num(mu + sigma * invPhi(pp), { sf: 3 }), md`Your value has $${pTex(pp)}$ of the distribution *below* it. You need $${pTex(pp)}$ above it.`, 1)] : [],
          solution: [md`$${pX('<', 'a')} = ${pTex(target)}$`, md`$z = \Phi^{-1}(${pTex(target)}) = ${fmtSF(invPhi(target), 4)}$`, md`$a = ${fmtNum(mu)} + ${fmtSF(invPhi(target), 4)} \times ${fmtNum(sigma)} = ${answerTex(A)}$`],
        }),
      ],
      params: { mu, sigma, pp, upper },
    };
  },
  verify(inst) {
    const { mu, sigma, pp, upper } = inst.params as { mu: number; sigma: number; pp: number; upper: boolean };
    const a = (inst.parts[0].answer as NumericSpec).value;
    const below = pdfInt(mu, sigma, mu - 12 * sigma, a);
    expectClose(upper ? 1 - below : below, pp, 'probability', 1e-7);
  },
});

const findMuSigma = defineTemplate({
  id: 'sm2.3.find-mu-sigma',
  family: 'sm2.3.find-parameters',
  title: 'Find μ and σ from two probabilities',
  spec: ['S4.2', 'P2.4'],
  chapter: 'SM2.3',
  sections: ['3.5'],
  level: 'A2',
  paper: [3],
  difficulty: 4,
  marks: 6,
  time: 8,
  commands: ['Find'],
  tags: ['normal distribution', 'simultaneous equations', 'synoptic'],
  generate(r) {
    const { c, mu, sigma } = pickNorm(r);
    const x1 = Number(fmtNum(mu - r.real(0.4, 1.6, 1) * sigma, 2));
    const x2 = Number(fmtNum(mu + r.real(0.4, 1.6, 1) * sigma, 2));
    const p1 = Number(normalCdf(x1, mu, sigma).toFixed(3));
    const p2 = Number((1 - normalCdf(x2, mu, sigma)).toFixed(3));
    r.require(p1 > 0.02 && p2 > 0.02 && p1 < 0.45 && p2 < 0.45);
    const z1 = invPhi(p1),
      z2 = invPhi(1 - p2);
    const s = (x2 - x1) / (z2 - z1);
    const m = x1 - z1 * s;
    const M = ans.num(m, { sf: 3 }),
      S = ans.num(s, { sf: 3 });
    return {
      stem: md`The random variable $X$ represents ${c.what}, where $X \sim \mathrm{N}(\mu, \sigma^{2})$. It is found that $${pX('<', fmtNum(x1))} = ${pTex(p1)}$ and $${pX('>', fmtNum(x2))} = ${pTex(p2)}$.`,
      parts: [
        part({
          label: 'a',
          marks: 4,
          prompt: md`Find the value of $\sigma$.`,
          answer: S,
          scheme: [
            B1(md`Uses $z = ${fmtSF(z1, 4)}$ or $z = ${fmtSF(z2, 4)}$`),
            M1(md`Standardises both: $\dfrac{${fmtNum(x1)} - \mu}{\sigma} = ${fmtSF(z1, 4)}$, $\dfrac{${fmtNum(x2)} - \mu}{\sigma} = ${fmtSF(z2, 4)}$`),
            dM1('Solves the simultaneous equations'),
            A1(md`$\sigma = ${answerTex(S)}$`),
          ],
          hints: [
            'Convert each probability into a z-value using the inverse normal for N(0, 1).',
            md`Each gives an equation $x = \mu + z\sigma$.`,
            md`$${fmtNum(x1)} = \mu ${z1 < 0 ? '-' : '+'} ${fmtSF(Math.abs(z1), 4)}\sigma$ and $${fmtNum(x2)} = \mu ${z2 < 0 ? '-' : '+'} ${fmtSF(Math.abs(z2), 4)}\sigma$`,
          ],
          solution: [
            md`$\Phi^{-1}(${pTex(p1)}) = ${fmtSF(z1, 4)}$ and $\Phi^{-1}(${pTex(1 - p2)}) = ${fmtSF(z2, 4)}$`,
            md`$${fmtNum(x1)} = \mu + (${fmtSF(z1, 4)})\sigma$, $\quad ${fmtNum(x2)} = \mu + ${fmtSF(z2, 4)}\sigma$`,
            md`Subtracting: $${fmtNum(x2 - x1)} = ${fmtSF(z2 - z1, 4)}\sigma \Rightarrow \sigma = ${answerTex(S)}$`,
          ],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Find the value of $\mu$.`,
          answer: M,
          ft: (prev) => (prev.a?.value ? ans.num(x1 - z1 * prev.a.value, { sf: 3 }) : null),
          scheme: [M1('Substitutes their σ into either equation'), A1(md`$\mu = ${answerTex(M)}$`)],
          hints: ['Substitute σ back into one of your equations.', md`$\mu = ${fmtNum(x1)} - (${fmtSF(z1, 4)})\sigma$`, 'Use the unrounded value of σ.'],
          solution: [md`$\mu = ${fmtNum(x1)} - (${fmtSF(z1, 4)}) \times ${fmtSF(s, 5)} = ${answerTex(M)}$`],
        }),
      ],
      params: { x1, x2, p1, p2 },
    };
  },
  verify(inst) {
    const { x1, x2, p1, p2 } = inst.params as Record<string, number>;
    const s = (inst.parts[0].answer as NumericSpec).value,
      m = (inst.parts[1].answer as NumericSpec).value;
    expectClose(phi((x1 - m) / s), p1, 'P(X<x1)', 1e-9);
    expectClose(1 - phi((x2 - m) / s), p2, 'P(X>x2)', 1e-9);
  },
});

const findSigma = defineTemplate({
  id: 'sm2.3.find-sigma',
  family: 'sm2.3.find-parameters',
  title: 'Find σ given μ and a probability',
  spec: ['S4.2'],
  chapter: 'SM2.3',
  sections: ['3.4', '3.5'],
  level: 'A2',
  paper: [3],
  difficulty: 3,
  marks: 4,
  time: 5,
  commands: ['Find'],
  tags: ['normal distribution', 'standardising'],
  generate(r) {
    const { c, mu, sigma } = pickNorm(r);
    const x = Number(fmtNum(mu + r.pick([-1, 1]) * r.real(0.5, 1.8, 1) * sigma, 2));
    const pp = Number((1 - normalCdf(x, mu, sigma)).toFixed(3));
    r.require(pp > 0.02 && pp < 0.98 && Math.abs(pp - 0.5) > 0.05);
    const z = invPhi(1 - pp);
    const s = (x - mu) / z;
    r.require(s > 0);
    const S = ans.num(s, { sf: 3 });
    return {
      stem: md`The random variable $X$ represents ${c.what}, where $X \sim \mathrm{N}(${fmtNum(mu)}, \sigma^{2})$. Given that $${pX('>', fmtNum(x))} = ${pTex(pp)}$,`,
      parts: [
        part({
          marks: 4,
          prompt: md`find the value of $\sigma$.`,
          answer: S,
          scheme: [M1(md`Standardises: $\dfrac{${fmtNum(x)} - ${fmtNum(mu)}}{\sigma}$`), B1(md`$z = ${fmtSF(z, 4)}$`), dM1('Solves for σ'), A1(md`$\sigma = ${answerTex(S)}$`)],
          hints: ['Write the probability in terms of Z ~ N(0, 1).', md`$\mathrm{P}\left(Z > \dfrac{${fmtNum(x)} - ${fmtNum(mu)}}{\sigma}\right) = ${pTex(pp)}$`, md`So $\dfrac{${fmtNum(x)} - ${fmtNum(mu)}}{\sigma} = \Phi^{-1}(${pTex(1 - pp)}) = ${fmtSF(z, 4)}$`],
          errors: [err('wrong-z-sign', ans.num(-s, { sf: 3 }), 'σ must be positive — check the sign of your z-value.')],
          solution: [md`$\dfrac{${fmtNum(x)} - ${fmtNum(mu)}}{\sigma} = ${fmtSF(z, 4)}$`, md`$\sigma = \dfrac{${fmtNum(x - mu)}}{${fmtSF(z, 4)}} = ${answerTex(S)}$`],
        }),
      ],
      params: { mu, x, pp },
    };
  },
  verify(inst) {
    const { mu, x, pp } = inst.params as Record<string, number>;
    const s = (inst.parts[0].answer as NumericSpec).value;
    expectClose(pdfInt(mu, s, x, mu + 14 * s), pp, 'tail', 1e-7);
  },
});

const approx = defineTemplate({
  id: 'sm2.3.binomial-normal-approximation',
  family: 'sm2.3.approximation',
  title: 'Normal approximation to the binomial',
  spec: ['S4.2', 'S4.3'],
  chapter: 'SM2.3',
  sections: ['3.6'],
  level: 'A2',
  paper: [3],
  difficulty: 4,
  marks: 5,
  time: 7,
  commands: ['Find', 'Write down'],
  tags: ['normal distribution', 'binomial', 'approximation', 'continuity correction'],
  generate(r) {
    const n = r.pick([60, 80, 100, 120, 150, 200, 250]);
    const p = r.pick([0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6]);
    const mu = n * p,
      v = n * p * (1 - p),
      s = Math.sqrt(v);
    const lo = Math.round(mu - r.real(0.3, 1.5, 1) * s);
    const hi = Math.round(mu + r.real(0.3, 1.5, 1) * s);
    r.require(lo < hi);
    const ctx = pickContext(r);
    const val = normalCdf(hi + 0.5, mu, s) - normalCdf(lo - 0.5, mu, s);
    const noCC = normalCdf(hi, mu, s) - normalCdf(lo, mu, s);
    const exactB = binomCdf(n, p, hi) - binomCdf(n, p, lo - 1);
    const M = ans.num(mu, { sf: 3 }),
      V = ans.num(v, { sf: 3 });
    const P = ans.num(val, { dp: 4 }, { alts: [Number(val.toFixed(3))] });
    return {
      stem: md`The random variable $X \sim \mathrm{B}(${n}, ${pTex(p)})$ counts the number of ${ctx.noun} in a sample of $${n}$. A normal distribution $Y \sim \mathrm{N}(\mu, \sigma^{2})$ is used to approximate $X$.`,
      parts: [
        part({
          label: 'a',
          marks: 1,
          prompt: md`Write down the value of $\mu$.`,
          answer: M,
          scheme: [B1(md`$\mu = np = ${fmtNum(mu)}$`)],
          hints: ['The approximating normal has the same mean as the binomial.', 'The mean of B(n, p) is np.', md`$\mu = ${n} \times ${pTex(p)}$`],
          solution: [md`$\mu = np = ${answerTex(M)}$`],
        }),
        part({
          label: 'b',
          marks: 1,
          prompt: md`Write down the value of $\sigma^{2}$.`,
          answer: V,
          scheme: [B1(md`$\sigma^{2} = ${fmtNum(v)}$`)],
          hints: ['Variance of B(n, p) is np(1 − p).', md`$${n} \times ${pTex(p)} \times ${pTex(1 - p)}$`, 'This is the variance, not the standard deviation.'],
          errors: [err('sd-not-variance', ans.num(s, { sf: 3 }), 'That is σ. The question asks for the variance σ².')],
          solution: [md`$\sigma^{2} = ${n} \times ${pTex(p)} \times ${pTex(1 - p)} = ${answerTex(V)}$`],
        }),
        part({
          label: 'c',
          marks: 3,
          prompt: md`Use the approximation to estimate $\mathrm{P}(${lo} \leqslant X \leqslant ${hi})$.`,
          answer: P,
          scheme: [M1(md`Continuity correction: $\mathrm{P}(${lo - 0.5} < Y < ${hi + 0.5})$`), M1('Standardises or uses normal cdf with their μ and σ'), A1(md`awrt $${d4(val)}$`)],
          hints: ['A continuous distribution is approximating a discrete one — use a continuity correction.', md`$${lo} \leqslant X \leqslant ${hi}$ becomes $${lo - 0.5} < Y < ${hi + 0.5}$.`, md`Use $Y \sim \mathrm{N}(${fmtNum(mu)}, ${fmtNum(v)})$, so $\sigma = ${fmtSF(s, 4)}$.`],
          errors: [
            err('no-continuity-correction', ans.num(noCC, { dp: 4 }), md`You have not used a continuity correction. For $${lo} \leqslant X \leqslant ${hi}$ use $${lo - 0.5} < Y < ${hi + 0.5}$.`, 1),
            err('exact-binomial', ans.num(exactB, { dp: 4 }), 'That is the exact binomial probability — the question asks you to use the normal approximation.', 1),
          ],
          solution: [md`$\mathrm{P}(${lo} \leqslant X \leqslant ${hi}) \approx \mathrm{P}(${lo - 0.5} < Y < ${hi + 0.5})$`, md`$= \mathrm{P}\left(${fmtSF((lo - 0.5 - mu) / s, 4)} < Z < ${fmtSF((hi + 0.5 - mu) / s, 4)}\right) = ${answerTex(P)}$`],
        }),
      ],
      params: { n, p, lo, hi },
    };
  },
  verify(inst) {
    const { n, p, lo, hi } = inst.params as Record<string, number>;
    const mu = n * p,
      s = Math.sqrt(n * p * (1 - p));
    expectClose((inst.parts[2].answer as NumericSpec).value, pdfInt(mu, s, lo - 0.5, hi + 0.5), 'approx', 1e-8);
    expect(Math.abs((inst.parts[2].answer as NumericSpec).value - (binomCdfBeta(n, p, hi) - binomCdfBeta(n, p, lo - 1))) < 0.03, 'approximation is close');
  },
});

const properties = defineTemplate({
  id: 'sm2.3.normal-properties',
  family: 'sm2.3.normal-properties',
  title: 'Properties of the normal curve: symmetry and inflection points',
  spec: ['S4.2'],
  chapter: 'SM2.3',
  sections: ['3.1'],
  level: 'A2',
  paper: [3],
  difficulty: 2,
  marks: 4,
  time: 4,
  commands: ['Write down', 'Find'],
  tags: ['normal distribution', 'symmetry', 'points of inflection'],
  generate(r) {
    const { c, mu, sigma } = pickNorm(r);
    const k = Number(fmtNum(r.real(0.3, 1.8, 1) * sigma, 2));
    const pp = Number((1 - normalCdf(mu + k, mu, sigma)).toFixed(4));
    const L = ans.list([ans.num(mu - sigma, { sf: 3 }), ans.num(mu + sigma, { sf: 3 })], { v: 'x' });
    const P = ans.num(1 - 2 * pp, { dp: 4 });
    return {
      stem: md`The random variable $X$ represents ${c.what}, where $X \sim ${N(mu, sigma)}$. The graph of the probability density function of $X$ has two points of inflection.`,
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Write down the $x$-coordinates of the points of inflection.`,
          answer: L,
          scheme: [B1(md`$\mu \pm \sigma$`), B1(md`$${fmtNum(mu - sigma)}$ and $${fmtNum(mu + sigma)}$`)],
          hints: ['The points of inflection of a normal curve are a fixed distance from the mean.', 'They are one standard deviation either side of the mean.', md`$\mu \pm \sigma = ${fmtNum(mu)} \pm ${fmtNum(sigma)}$`],
          solution: [md`Points of inflection at $x = \mu \pm \sigma$: $${answerTex(L)}$`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Given that $${pX('>', fmtNum(mu + k))} = ${pp}$, find $\mathrm{P}(${fmtNum(mu - k)} < X < ${fmtNum(mu + k)})$ without using the normal cdf function.`,
          answer: P,
          scheme: [M1(md`Uses symmetry: $${pX('<', fmtNum(mu - k))} = ${pp}$`), A1(md`$1 - 2(${pp}) = ${d4(1 - 2 * pp)}$`)],
          hints: [md`The normal curve is symmetrical about $\mu = ${fmtNum(mu)}$.`, md`$${fmtNum(mu - k)}$ and $${fmtNum(mu + k)}$ are the same distance from the mean.`, md`Each tail has probability $${pp}$.`],
          errors: [err('one-tail-only', ans.num(1 - pp, { dp: 4 }), 'Subtract both tails: the region below the lower value has the same probability by symmetry.', 1)],
          solution: [md`By symmetry $${pX('<', fmtNum(mu - k))} = ${pX('>', fmtNum(mu + k))} = ${pp}$`, md`So the probability is $1 - 2 \times ${pp} = ${answerTex(P)}$`],
        }),
      ],
      params: { mu, sigma, pp },
    };
  },
  verify(inst) {
    const { mu, sigma, pp } = inst.params as Record<string, number>;
    const l = (inst.parts[0].answer as { items: NumericSpec[] }).items.map((i) => i.value);
    // second derivative of pdf changes sign at μ ± σ
    for (const x of l) {
      const h = 1e-3 * sigma;
      const d2 = (y: number) => normalPdf(y + h, mu, sigma) - 2 * normalPdf(y, mu, sigma) + normalPdf(y - h, mu, sigma);
      expect(d2(x - 0.05 * sigma) * d2(x + 0.05 * sigma) < 0, 'inflection');
    }
    expectClose((inst.parts[1].answer as NumericSpec).value, 1 - 2 * pp, 'symmetry');
  },
});

// ---------------------------------------------------------------- tests for a mean
function meanTest(id: string, tail: 'one' | 'two'): Template {
  return defineTemplate({
    id,
    family: 'sm2.3.normal-mean-test',
    title: tail === 'one' ? 'Hypothesis test for a normal mean (one-tailed)' : 'Hypothesis test for a normal mean (two-tailed)',
    spec: ['S5.3'],
    chapter: 'SM2.3',
    sections: ['3.7'],
    level: 'A2',
    paper: [3],
    difficulty: 4,
    marks: 5,
    time: 7,
    commands: ['Test'],
    tags: ['hypothesis test', 'normal distribution', 'sample mean'],
    generate(r) {
      const { c, mu, sigma } = pickNorm(r);
      const n = r.pick([8, 10, 12, 15, 16, 20, 25, 30, 36, 40, 50]);
      const alpha = tail === 'two' ? r.pick([0.05, 0.1]) : r.pick([0.01, 0.05, 0.1]);
      const side = tail === 'one' ? r.pick(['upper', 'lower'] as const) : r.pick(['upper', 'lower'] as const);
      const se = sigma / Math.sqrt(n);
      const zt = r.real(0.6, 3.2, 2) * (side === 'upper' ? 1 : -1);
      const xbar = Number(fmtNum(mu + zt * se, c.step < 1 ? 3 : 2));
      const z = (xbar - mu) / se;
      const pv = side === 'upper' ? 1 - phi(z) : phi(z);
      const thr = tail === 'two' ? alpha / 2 : alpha;
      r.require(Math.abs(pv - thr) > Math.max(0.003, thr * 0.2) && pv < 0.45);
      const reject = pv < thr;
      const dir = tail === 'two' ? 'changed' : side === 'upper' ? 'increased' : 'decreased';
      const h1: '>' | '<' | '!=' = tail === 'two' ? '!=' : side === 'upper' ? '>' : '<';
      const lvl = pct(alpha);
      const yes = md`There is sufficient evidence at the $${lvl}$ level that the mean ${c.what.replace(/^the /, '')} has ${dir}.`;
      const no = md`There is insufficient evidence at the $${lvl}$ level that the mean ${c.what.replace(/^the /, '')} has ${dir}.`;
      const proof = md`This proves the mean is exactly $${fmtNum(mu)}$.`;
      const opts = r.shuffle([yes, no, proof]);
      const zNoRoot = (xbar - mu) / sigma;
      const H: HypothesisSpec = ans.hyp({
        param: 'mu',
        h0: mu,
        h1,
        stat: { label: md`Test statistic $z$ or $p$-value`, spec: ans.num(pv, { sf: 3 }, { alts: [z, tail === 'two' ? 2 * pv : pv] }) },
        reject,
        conclusions: opts,
        correctConclusion: opts.indexOf(reject ? yes : no),
        marks: { hyp: 1, stat: 2, decision: 1, conclusion: 1 },
      });
      const h1Tex = h1 === '!=' ? '\\neq' : h1;
      return {
        stem: md`${c.what.charAt(0).toUpperCase() + c.what.slice(1)} is normally distributed with mean $${fmtNum(mu)}$ and standard deviation $${fmtNum(sigma)}$. After a change in the process, a random sample of $${n}$ is taken and the sample mean is $${fmtNum(xbar)}$. ${tail === 'two' ? 'It is suspected that the mean has changed.' : `It is suspected that the mean has ${dir}.`} You may assume the standard deviation is unchanged.`,
        parts: [
          part({
            marks: 5,
            prompt: md`Test, at the $${lvl}$ level of significance, whether there is evidence that the mean has ${dir}. State your hypotheses clearly.`,
            answer: H,
            scheme: [
              B1(md`$\mathrm{H_0} : \mu = ${fmtNum(mu)}$, $\mathrm{H_1} : \mu ${h1Tex} ${fmtNum(mu)}$`),
              M1(md`Uses $\bar{X} \sim \mathrm{N}\left(${fmtNum(mu)}, \dfrac{${fmtNum(sigma)}^{2}}{${n}}\right)$ and standardises`),
              A1(md`$z = ${fmtSF(z, 3)}$ or $p = ${fmtSF(pv, 3)}$`),
              dM1(md`Correct comparison with ${tail === 'two' ? md`$${pTex(thr)}$ in each tail` : md`$${pTex(alpha)}$`} and decision`),
              A1('Conclusion in context'),
            ],
            hints: [
              md`The hypotheses are about the population mean $\mu$.`,
              md`Under $\mathrm{H_0}$ the sample mean $\bar{X} \sim \mathrm{N}\left(${fmtNum(mu)}, \frac{${fmtNum(sigma)}^{2}}{${n}}\right)$ — the standard error is $\frac{\sigma}{\sqrt{n}}$.`,
              md`$z = \dfrac{${fmtNum(xbar)} - ${fmtNum(mu)}}{${fmtNum(sigma)}/\sqrt{${n}}}$`,
            ],
            errors: [err('no-root-n', ans.num(side === 'upper' ? 1 - phi(zNoRoot) : phi(zNoRoot), { sf: 3 }, { alts: [zNoRoot] }), md`Use the standard deviation of the *sample mean*, $\sigma/\sqrt{n}$, not $\sigma$.`)],
            solution: [
              md`$\mathrm{H_0} : \mu = ${fmtNum(mu)}$, $\mathrm{H_1} : \mu ${h1Tex} ${fmtNum(mu)}$`,
              md`Under $\mathrm{H_0}$, $\bar{X} \sim \mathrm{N}\left(${fmtNum(mu)}, \frac{${fmtNum(sigma)}^{2}}{${n}}\right)$`,
              md`$z = \dfrac{${fmtNum(xbar)} - ${fmtNum(mu)}}{${fmtNum(sigma)}/\sqrt{${n}}} = ${fmtSF(z, 4)}$, $p$-value $= ${fmtSF(pv, 4)}$`,
              md`$${fmtSF(pv, 3)} ${reject ? '<' : '>'} ${pTex(thr)}$, so ${reject ? 'reject' : 'do not reject'} $\mathrm{H_0}$.`,
              opts[opts.indexOf(reject ? yes : no)],
            ],
          }),
        ],
        params: { mu, sigma, n, xbar, side, thr },
      };
    },
    verify(inst) {
      const { mu, sigma, n, xbar, side, thr } = inst.params as { mu: number; sigma: number; n: number; xbar: number; side: string; thr: number };
      const se = sigma / Math.sqrt(n);
      const pv = side === 'upper' ? pdfInt(mu, se, xbar, mu + 14 * se) : pdfInt(mu, se, mu - 14 * se, xbar);
      const H = inst.parts[0].answer as HypothesisSpec;
      expectClose(H.stat!.spec.value, pv, 'p-value', 1e-7);
      expect(H.reject === pv < thr, 'decision');
    },
  });
}

const meanOne = meanTest('sm2.3.normal-mean-test-one-tail', 'one');
const meanTwo = meanTest('sm2.3.normal-mean-test-two-tail', 'two');

const meanCritical = defineTemplate({
  id: 'sm2.3.normal-mean-critical-value',
  family: 'sm2.3.normal-mean-test',
  title: 'Critical value for the sample mean',
  spec: ['S5.3'],
  chapter: 'SM2.3',
  sections: ['3.7'],
  level: 'A2',
  paper: [3],
  difficulty: 4,
  marks: 4,
  time: 6,
  commands: ['Find'],
  tags: ['hypothesis test', 'normal distribution', 'critical region'],
  generate(r) {
    const { c, mu, sigma } = pickNorm(r);
    const n = r.pick([9, 10, 16, 20, 25, 36, 40, 50, 64]);
    const alpha = r.pick([0.01, 0.025, 0.05, 0.1]);
    const side = r.pick(['upper', 'lower'] as const);
    const zc = invPhi(1 - alpha);
    const se = sigma / Math.sqrt(n);
    const cv = side === 'upper' ? mu + zc * se : mu - zc * se;
    const A = ans.num(cv, { sf: 3 });
    return {
      stem: md`${c.what.charAt(0).toUpperCase() + c.what.slice(1)} is modelled as $\mathrm{N}(\mu, ${fmtNum(sigma)}^{2})$. A test of $\mathrm{H_0} : \mu = ${fmtNum(mu)}$ against $\mathrm{H_1} : \mu ${side === 'upper' ? '>' : '<'} ${fmtNum(mu)}$ is carried out at the $${pct(alpha)}$ level using the mean $\bar{X}$ of a random sample of size $${n}$.`,
      parts: [
        part({
          marks: 4,
          prompt: md`Find the critical value of $\bar{X}$ for this test, so that the critical region is $\bar{X} ${side === 'upper' ? '\\geqslant' : '\\leqslant'} c$. Give $c$ to 3 significant figures.`,
          answer: A,
          scheme: [M1(md`$\bar{X} \sim \mathrm{N}\left(${fmtNum(mu)}, \frac{${fmtNum(sigma)}^{2}}{${n}}\right)$`), B1(md`$z = ${side === 'upper' ? '' : '-'}${fmtSF(zc, 4)}$`), M1(md`$\dfrac{c - ${fmtNum(mu)}}{${fmtNum(sigma)}/\sqrt{${n}}} = ${side === 'upper' ? '' : '-'}${fmtSF(zc, 4)}$`), A1(md`$c = ${answerTex(A)}$`)],
          hints: [md`Under $\mathrm{H_0}$, the sample mean has standard deviation $\sigma/\sqrt{n}$.`, md`Find $z$ with ${side === 'upper' ? md`$\mathrm{P}(Z > z) = ${pTex(alpha)}$` : md`$\mathrm{P}(Z < z) = ${pTex(alpha)}$`}.`, md`$c = ${fmtNum(mu)} ${side === 'upper' ? '+' : '-'} z \times \frac{${fmtNum(sigma)}}{\sqrt{${n}}}$`],
          errors: [err('no-root-n', ans.num(side === 'upper' ? mu + zc * sigma : mu - zc * sigma, { sf: 3 }), md`Use $\sigma/\sqrt{n}$ for the sample mean, not $\sigma$.`, 1)],
          solution: [md`$\bar{X} \sim \mathrm{N}\left(${fmtNum(mu)}, \frac{${fmtNum(sigma)}^{2}}{${n}}\right)$; $z = ${fmtSF(zc, 4)}$`, md`$c = ${fmtNum(mu)} ${side === 'upper' ? '+' : '-'} ${fmtSF(zc, 4)} \times \frac{${fmtNum(sigma)}}{\sqrt{${n}}} = ${answerTex(A)}$`],
        }),
      ],
      params: { mu, sigma, n, alpha, side },
    };
  },
  verify(inst) {
    const { mu, sigma, n, alpha, side } = inst.params as { mu: number; sigma: number; n: number; alpha: number; side: string };
    const cv = (inst.parts[0].answer as NumericSpec).value;
    const se = sigma / Math.sqrt(n);
    const tail = side === 'upper' ? pdfInt(mu, se, cv, mu + 14 * se) : pdfInt(mu, se, mu - 14 * se, cv);
    expectClose(tail, alpha, 'tail area', 1e-7);
  },
});

const chooseDist = defineTemplate({
  id: 'sm2.3.choose-distribution',
  family: 'sm2.3.choose-model',
  title: 'Choosing a suitable distribution',
  spec: ['S4.3'],
  chapter: 'SM2.3',
  sections: ['3.6'],
  level: 'A2',
  paper: [3],
  difficulty: 2,
  marks: 2,
  time: 2,
  commands: ['State', 'Give a reason'],
  tags: ['modelling', 'distributions'],
  generate(r) {
    const ctx = pickContext(r);
    const nc = r.pick(CONTEXTS);
    const scenarios = [
      { text: md`the number of ${ctx.items} in a sample of $${r.int(10, 30)}$ that ${ctx.are}`, ans: 0, reason: 'a fixed number of independent trials, each with the same probability of success' },
      { text: md`${nc.what}`, ans: 1, reason: 'a continuous quantity that is symmetrical about its mean' },
      { text: md`the score when a fair ${r.pick(['six', 'eight', 'ten'])}-sided spinner numbered from 1 is spun once`, ans: 2, reason: 'each outcome is equally likely' },
    ];
    const s = r.pick(scenarios);
    const opts = ['Binomial', 'Normal', 'Discrete uniform'];
    const C = ans.choice(opts, s.ans);
    return {
      parts: [
        part({
          marks: 2,
          prompt: md`A random variable is defined as ${s.text}. Which distribution would be the most suitable model?`,
          answer: C,
          scheme: [B1('Correct distribution'), B1(`Reason: ${s.reason}`)],
          hints: ['Is the variable discrete (counted) or continuous (measured)?', 'Binomial counts successes in a fixed number of trials; normal suits measurements; uniform has equally likely outcomes.', `Look for: ${s.reason}.`],
          solution: [md`${opts[s.ans]}: ${s.reason}.`],
        }),
      ],
      params: {},
    };
  },
  verify(inst) {
    expect(inst.parts[0].answer.type === 'choice', 'choice');
  },
});

const templates: Template[] = [probabilities, inverse, findMuSigma, findSigma, approx, properties, meanOne, meanTwo, meanCritical, chooseDist];
export default templates;
