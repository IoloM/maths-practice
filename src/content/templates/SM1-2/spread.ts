/** Statistics Year 1, Chapter 2 — measures of location and spread (variance, standard deviation, coding). */
import { expectClose } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import type { Rng } from '../../../engine/core/rng';

const S3 = (v: number, extra: Partial<NumericSpec> = {}) => ans.num(v, { sf: 3 }, extra);
const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);

interface DataCtx {
  what: string;
  sym: string;
  unit: string;
  centre: [number, number];
  spread: [number, number];
  dp: number;
}
const DATA: DataCtx[] = [
  { what: 'the daily total rainfall, in mm, at a weather station', sym: 'r', unit: 'mm', centre: [1, 6], spread: [0.8, 3], dp: 1 },
  { what: 'the daily maximum gust, in knots, at Leuchars', sym: 'g', unit: 'knots', centre: [18, 35], spread: [4, 9], dp: 0 },
  { what: 'the daily mean temperature, in °C, at Camborne', sym: 't', unit: '°C', centre: [12, 18], spread: [1.2, 3.5], dp: 1 },
  { what: 'the time, in minutes, students spend on homework', sym: 'h', unit: 'minutes', centre: [40, 90], spread: [8, 25], dp: 0 },
  { what: 'the mass, in kg, of a sample of suitcases', sym: 'm', unit: 'kg', centre: [14, 22], spread: [2, 5], dp: 1 },
  { what: 'the length, in cm, of a sample of leaves', sym: 'l', unit: 'cm', centre: [5, 12], spread: [0.6, 2.5], dp: 1 },
];

function sample(r: Rng, n: number) {
  const c = r.pick(DATA);
  const m = r.real(c.centre[0], c.centre[1], c.dp);
  const s = r.real(c.spread[0], c.spread[1], c.dp + 1);
  const xs = Array.from({ length: n }, () => Number((m + s * (r.next() + r.next() + r.next() - 1.5) * 1.4).toFixed(c.dp)));
  return { c, xs };
}

const summary = defineTemplate({
  id: 'sm1.2.mean-sd-summary-statistics',
  family: 'sm1.2.variance',
  title: 'Mean and standard deviation from summary statistics',
  spec: ['S2.3'],
  chapter: 'SM1.2',
  sections: ['2.4'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Find', 'Calculate'],
  tags: ['standard deviation', 'variance', 'summary statistics'],
  generate(r) {
    const n = r.int(12, 40);
    const { c, xs } = sample(r, n);
    const Sx = Number(sum(xs).toFixed(c.dp));
    const Sxx = Number(sum(xs.map((x) => x * x)).toFixed(2 * c.dp));
    const mean = Sx / n;
    const variance = Sxx / n - mean * mean;
    r.require(variance > 0.01);
    const sd = Math.sqrt(variance);
    const sdSample = Math.sqrt((Sxx - (Sx * Sx) / n) / (n - 1));
    const M = S3(mean, { unit: c.unit === '°C' ? '^{\\circ}\\text{C}' : `\\text{${c.unit}}` });
    const SD = S3(sd, { alts: [sdSample] });
    return {
      stem: md`The random variable $${c.sym}$ represents ${c.what}. For a sample of $${n}$ days or items: $\sum ${c.sym} = ${fmtNum(Sx)}$ and $\sum ${c.sym}^{2} = ${fmtNum(Sxx)}$.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find the mean of $${c.sym}$.`, answer: M, scheme: [B1(md`$\bar{${c.sym}} = ${fmtSF(mean, 4)}$`)], hints: ['Mean = Σx ÷ n.', md`$\bar{${c.sym}} = \dfrac{${fmtNum(Sx)}}{${n}}$`, 'Give your answer to 3 significant figures.'], solution: [md`$\bar{${c.sym}} = \dfrac{${fmtNum(Sx)}}{${n}} = ${answerTex(M)}$`] }),
        part({
          label: 'b',
          marks: 3,
          prompt: md`Find the standard deviation of $${c.sym}$.`,
          answer: SD,
          scheme: [M1(md`Uses $\dfrac{\sum ${c.sym}^{2}}{n} - \bar{${c.sym}}^{2}$ (or $S_{${c.sym}${c.sym}}$)`), A1(md`Variance $= ${fmtSF(variance, 4)}$`), A1(md`$\sigma = ${answerTex(SD)}$`)],
          hints: [
            md`Variance $= \dfrac{\sum x^{2}}{n} - \bar{x}^{2}$; standard deviation is its square root.`,
            md`$\dfrac{${fmtNum(Sxx)}}{${n}} - \left(\dfrac{${fmtNum(Sx)}}{${n}}\right)^{2}$`,
            md`Keep the unrounded mean when you square it.`,
          ],
          errors: [
            err('variance-not-sd', S3(variance), 'That is the variance — take the square root to get the standard deviation.', 2),
            err('no-mean-squared', S3(Math.sqrt(Sxx / n)), md`You forgot to subtract $\bar{x}^{2}$.`, 1),
            err('premature-rounding', S3(Math.sqrt(Sxx / n - Number(mean.toFixed(1)) ** 2)), 'Rounding the mean too early changes the answer a lot here — use the exact value.', 2),
          ],
          solution: [
            md`$\sigma^{2} = \dfrac{${fmtNum(Sxx)}}{${n}} - \left(\dfrac{${fmtNum(Sx)}}{${n}}\right)^{2} = ${fmtSF(variance, 5)}$`,
            md`$\sigma = \sqrt{${fmtSF(variance, 5)}} = ${answerTex(SD)}$ (using $S/(n-1)$ gives $${fmtSF(sdSample, 3)}$, also accepted)`,
          ],
        }),
      ],
      params: { n, Sx, Sxx },
    };
  },
  verify(inst) {
    const { n, Sx, Sxx } = inst.params as Record<string, number>;
    const mean = Sx / n;
    const sxx = Sxx - (Sx * Sx) / n; // S_xx route
    expectClose((inst.parts[0].answer as NumericSpec).value, mean, 'mean');
    expectClose((inst.parts[1].answer as NumericSpec).value, Math.sqrt(sxx / n), 'sd via Sxx', 1e-9);
  },
});

const freqTable = defineTemplate({
  id: 'sm1.2.mean-sd-frequency-table',
  family: 'sm1.2.variance',
  title: 'Mean and standard deviation from a frequency table',
  spec: ['S2.3'],
  chapter: 'SM1.2',
  sections: ['2.1', '2.4'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Calculate'],
  tags: ['standard deviation', 'frequency table', 'discrete data'],
  generate(r) {
    const start = r.int(0, 3);
    const xs = Array.from({ length: r.int(5, 7) }, (_, i) => start + i);
    const fs = xs.map(() => r.int(1, 18));
    const n = sum(fs);
    const Sfx = sum(xs.map((x, i) => x * fs[i]));
    const Sfx2 = sum(xs.map((x, i) => x * x * fs[i]));
    const mean = Sfx / n;
    const variance = Sfx2 / n - mean * mean;
    const sd = Math.sqrt(variance);
    const ctx = r.pick(['the number of goals scored in a football match', 'the number of books read by a student last month', 'the number of people in a car passing a checkpoint', 'the number of emails a worker receives in an hour']);
    const M = S3(mean),
      SD = S3(sd, { alts: [Math.sqrt((Sfx2 - (Sfx * Sfx) / n) / (n - 1))] });
    const table = `| $x$ | ${xs.join(' | ')} |\n|---|${xs.map(() => '---').join('|')}|\n| Frequency $f$ | ${fs.join(' | ')} |`;
    return {
      stem: md`The table shows ${ctx}, $x$, for a sample.\n\n${table}`,
      parts: [
        part({ label: 'a', marks: 2, prompt: 'Calculate the mean of x.', answer: M, scheme: [M1(md`$\dfrac{\sum fx}{\sum f} = \dfrac{${Sfx}}{${n}}$`), A1(md`$${answerTex(M)}$`)], hints: ['Multiply each value by its frequency, add them, divide by the total frequency.', md`$\sum fx = ${Sfx}$`, md`$\sum f = ${n}$`], errors: [err('divide-by-classes', S3(Sfx / xs.length), 'Divide by the total frequency Σf, not the number of different values.')], solution: [md`$\bar{x} = \dfrac{\sum fx}{\sum f} = \dfrac{${Sfx}}{${n}} = ${answerTex(M)}$`] }),
        part({
          label: 'b',
          marks: 2,
          prompt: 'Calculate the standard deviation of x.',
          answer: SD,
          scheme: [M1(md`$\sqrt{\dfrac{\sum fx^{2}}{\sum f} - \bar{x}^{2}}$ with $\sum fx^{2} = ${Sfx2}$`), A1(md`$${answerTex(SD)}$`)],
          hints: [md`Find $\sum fx^{2}$ (multiply $x^{2}$ by its frequency).`, md`$\sigma = \sqrt{\dfrac{\sum fx^{2}}{\sum f} - \bar{x}^{2}}$`, md`$\sum fx^{2} = ${Sfx2}$`],
          errors: [err('sum-fx-squared', S3(Math.sqrt(Sfx ** 2 / n - mean ** 2) || 0.000001), 'Use Σfx², not (Σfx)².')],
          solution: [md`$\sum fx^{2} = ${Sfx2}$`, md`$\sigma = \sqrt{\dfrac{${Sfx2}}{${n}} - \left(\dfrac{${Sfx}}{${n}}\right)^{2}} = ${answerTex(SD)}$`],
        }),
      ],
      params: { xs, fs },
    };
  },
  verify(inst) {
    const { xs, fs } = inst.params as { xs: number[]; fs: number[] };
    const data = xs.flatMap((x, i) => Array(fs[i]).fill(x) as number[]);
    const m = sum(data) / data.length;
    expectClose((inst.parts[0].answer as NumericSpec).value, m, 'mean');
    expectClose((inst.parts[1].answer as NumericSpec).value, Math.sqrt(sum(data.map((x) => (x - m) ** 2)) / data.length), 'sd from raw data');
  },
});

const grouped = defineTemplate({
  id: 'sm1.2.grouped-mean-sd',
  family: 'sm1.2.grouped',
  title: 'Estimating mean and standard deviation from grouped data',
  spec: ['S2.3'],
  chapter: 'SM1.2',
  sections: ['2.1', '2.4'],
  level: 'AS',
  paper: [3],
  difficulty: 3,
  marks: 5,
  time: 7,
  commands: ['Estimate'],
  tags: ['grouped data', 'midpoints', 'standard deviation'],
  generate(r) {
    const w = r.pick([5, 10, 20]);
    const start = r.int(0, 4) * w;
    const k = r.int(4, 6);
    const bounds = Array.from({ length: k + 1 }, (_, i) => start + i * w * (i === k ? 1 : 1));
    // make one wider class for realism
    if (r.bool()) bounds[k] = bounds[k] + w;
    const mids = bounds.slice(0, -1).map((b, i) => (b + bounds[i + 1]) / 2);
    const fs = mids.map(() => r.int(2, 25));
    const n = sum(fs);
    const Sfx = sum(mids.map((m, i) => m * fs[i]));
    const Sfx2 = sum(mids.map((m, i) => m * m * fs[i]));
    const mean = Sfx / n;
    const sd = Math.sqrt(Sfx2 / n - mean * mean);
    const ctx = r.pick(['the time, $t$ minutes, taken to complete a journey', 'the mass, $m$ g, of apples picked from an orchard', 'the length, $l$ mm, of a sample of worms', 'the daily total sunshine, in tenths of an hour, at Hurn']);
    const table = `| Class | ${bounds.slice(0, -1).map((b, i) => `${b} – ${bounds[i + 1]}`).join(' | ')} |\n|---|${fs.map(() => '---').join('|')}|\n| Frequency | ${fs.join(' | ')} |`;
    const M = S3(mean),
      SD = S3(sd, { alts: [Math.sqrt((Sfx2 - (Sfx * Sfx) / n) / (n - 1))] });
    const upperMean = sum(bounds.slice(1).map((b, i) => b * fs[i])) / n;
    return {
      stem: md`The table summarises ${ctx} for a sample.\n\n${table}`,
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: 'Estimate the mean.',
          answer: M,
          scheme: [B1(md`Uses midpoints $${mids.join(', ')}$`), M1(md`$\dfrac{\sum fx}{\sum f} = \dfrac{${fmtNum(Sfx)}}{${n}}$`), A1(md`$${answerTex(M)}$`)],
          hints: ['You do not know the individual values — use the midpoint of each class.', md`Midpoints: $${mids.join(', ')}$`, md`Mean $\approx \dfrac{\sum fx}{\sum f}$ using midpoints for $x$.`],
          errors: [err('upper-bounds', S3(upperMean), 'Use class midpoints, not upper class boundaries.', 1)],
          solution: [md`Midpoints: $${mids.join(', ')}$; $\sum fx = ${fmtNum(Sfx)}$, $\sum f = ${n}$`, md`Mean $\approx ${answerTex(M)}$`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: 'Estimate the standard deviation.',
          answer: SD,
          scheme: [M1(md`$\sqrt{\dfrac{\sum fx^{2}}{\sum f} - \bar{x}^{2}}$ with $\sum fx^{2} = ${fmtNum(Sfx2)}$`), A1(md`$${answerTex(SD)}$`)],
          hints: [md`Use midpoints again: $\sum fx^{2}$.`, md`$\sigma = \sqrt{\dfrac{\sum fx^{2}}{\sum f} - \bar{x}^{2}}$`, md`$\sum fx^{2} = ${fmtNum(Sfx2)}$`],
          solution: [md`$\sigma \approx \sqrt{\dfrac{${fmtNum(Sfx2)}}{${n}} - (${fmtSF(mean, 5)})^{2}} = ${answerTex(SD)}$`],
        }),
      ],
      params: { mids, fs },
    };
  },
  verify(inst) {
    const { mids, fs } = inst.params as { mids: number[]; fs: number[] };
    const data = mids.flatMap((x, i) => Array(fs[i]).fill(x) as number[]);
    const m = sum(data) / data.length;
    expectClose((inst.parts[0].answer as NumericSpec).value, m, 'mean');
    expectClose((inst.parts[1].answer as NumericSpec).value, Math.sqrt(sum(data.map((x) => (x - m) ** 2)) / data.length), 'sd');
  },
});

const coding = defineTemplate({
  id: 'sm1.2.coding',
  family: 'sm1.2.coding',
  title: 'Coding: mean and standard deviation of original data',
  spec: ['S2.3'],
  chapter: 'SM1.2',
  sections: ['2.5'],
  level: 'AS',
  paper: [3],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find'],
  tags: ['coding', 'standard deviation', 'variance'],
  generate(r) {
    const n = r.int(10, 30);
    const a = r.pick([100, 200, 50, 20, 500, 1000, 10]);
    const b = r.pick([2, 5, 10, 0.1, 4]);
    const ys = Array.from({ length: n }, () => r.int(-6, 12));
    const Sy = sum(ys),
      Syy = sum(ys.map((y) => y * y));
    const ym = Sy / n,
      ysd = Math.sqrt(Syy / n - ym * ym);
    r.require(ysd > 0.5);
    const xm = a + b * ym,
      xsd = b * ysd;
    const M = S3(xm),
      SD = S3(xsd, { alts: [b * Math.sqrt((Syy - (Sy * Sy) / n) / (n - 1))] });
    const codeTex = b === 1 ? `y = x - ${a}` : `y = \\dfrac{x - ${a}}{${fmtNum(b)}}`;
    return {
      stem: md`A set of $${n}$ values of $x$ is coded using $${codeTex}$. The coded data give $\sum y = ${Sy}$ and $\sum y^{2} = ${Syy}$.`,
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Find the mean of $x$.`,
          answer: M,
          scheme: [M1(md`$\bar{y} = \dfrac{${Sy}}{${n}}$ and $\bar{x} = ${a} + ${fmtNum(b)}\bar{y}$`), A1(md`$\bar{x} = ${answerTex(M)}$`)],
          hints: [md`Find $\bar{y}$ first, then reverse the coding.`, md`From $${codeTex}$: $x = ${a} + ${fmtNum(b)}y$.`, md`$\bar{y} = ${fmtSF(ym, 5)}$`],
          errors: [err('coded-mean', S3(ym), 'That is the mean of the coded values y — convert back to x.'), err('wrong-order', S3((ym + a) * b), md`Undo the coding in the right order: $x = ${a} + ${fmtNum(b)}y$.`, 1)],
          solution: [md`$\bar{y} = \dfrac{${Sy}}{${n}} = ${fmtSF(ym, 5)}$`, md`$\bar{x} = ${a} + ${fmtNum(b)} \times ${fmtSF(ym, 5)} = ${answerTex(M)}$`],
        }),
        part({
          label: 'b',
          marks: 3,
          prompt: md`Find the standard deviation of $x$.`,
          answer: SD,
          scheme: [M1(md`$\sigma_y = \sqrt{\dfrac{${Syy}}{${n}} - \bar{y}^{2}}$`), A1(md`$\sigma_y = ${fmtSF(ysd, 4)}$`), A1(md`$\sigma_x = ${fmtNum(b)}\sigma_y = ${answerTex(SD)}$`)],
          hints: ['Adding or subtracting a constant does not change the spread.', md`Multiplying by $${fmtNum(b)}$ multiplies the standard deviation by $${fmtNum(b)}$.`, md`$\sigma_y = ${fmtSF(ysd, 4)}$`],
          errors: [
            err('coded-sd', S3(ysd), 'That is the standard deviation of y — multiply by the scale factor.', 2),
            err('added-a', S3(a + b * ysd), md`The $${a}$ shifts every value equally, so it does not affect the standard deviation.`, 2),
            err('variance-scale', S3(b * b * ysd), md`The standard deviation scales by $${fmtNum(b)}$ (the variance scales by $${fmtNum(b)}^{2}$).`, 2),
          ],
          solution: [md`$\sigma_y = \sqrt{\dfrac{${Syy}}{${n}} - (${fmtSF(ym, 5)})^{2}} = ${fmtSF(ysd, 5)}$`, md`$\sigma_x = ${fmtNum(b)} \times ${fmtSF(ysd, 5)} = ${answerTex(SD)}$`],
        }),
      ],
      params: { ys, a, b },
    };
  },
  verify(inst) {
    const { ys, a, b } = inst.params as { ys: number[]; a: number; b: number };
    const xs = ys.map((y) => a + b * y);
    const m = sum(xs) / xs.length;
    expectClose((inst.parts[0].answer as NumericSpec).value, m, 'mean of decoded data');
    expectClose((inst.parts[1].answer as NumericSpec).value, Math.sqrt(sum(xs.map((x) => (x - m) ** 2)) / xs.length), 'sd of decoded data');
  },
});

const combined = defineTemplate({
  id: 'sm1.2.combined-samples',
  family: 'sm1.2.combined',
  title: 'Combining two samples: mean and standard deviation',
  spec: ['S2.3'],
  chapter: 'SM1.2',
  sections: ['2.4'],
  level: 'AS',
  paper: [3],
  difficulty: 4,
  marks: 6,
  time: 8,
  commands: ['Find', 'Show that'],
  tags: ['standard deviation', 'combined data', 'summary statistics'],
  generate(r) {
    const n1 = r.int(8, 30),
      n2 = r.int(8, 30);
    const m1 = r.real(20, 60, 1),
      m2 = m1 + r.real(-8, 8, 1);
    const s1 = r.real(2, 9, 1),
      s2 = r.real(2, 9, 1);
    const sx1 = m1 * n1,
      sx2 = m2 * n2;
    const sxx1 = n1 * (s1 * s1 + m1 * m1),
      sxx2 = n2 * (s2 * s2 + m2 * m2);
    const N = n1 + n2;
    const mean = (sx1 + sx2) / N;
    const sd = Math.sqrt((sxx1 + sxx2) / N - mean * mean);
    const ctx = r.pick([
      ['Group A', 'Group B', 'test marks'],
      ['the morning shift', 'the afternoon shift', 'times, in minutes, to assemble a product'],
      ['Leeming', 'Heathrow', 'daily mean temperatures in July (°C)'],
    ]);
    const M = S3(mean),
      SD = S3(sd);
    return {
      stem: md`Summary statistics for ${ctx[2]}: ${ctx[0]} has $n = ${n1}$, mean $${fmtNum(m1)}$ and standard deviation $${fmtNum(s1)}$; ${ctx[1]} has $n = ${n2}$, mean $${fmtNum(m2)}$ and standard deviation $${fmtNum(s2)}$. The two groups are combined.`,
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: 'Find the mean of the combined group.',
          answer: M,
          scheme: [M1(md`$\dfrac{${n1} \times ${fmtNum(m1)} + ${n2} \times ${fmtNum(m2)}}{${N}}$`), A1(md`$${answerTex(M)}$`)],
          hints: ['Find the total of each group: n × mean.', 'Add the totals and divide by the combined size.', md`Totals: $${fmtNum(sx1)}$ and $${fmtNum(sx2)}$.`],
          errors: [err('average-of-means', S3((m1 + m2) / 2), 'You cannot just average the two means when the groups are different sizes.')],
          solution: [md`$\sum x = ${n1} \times ${fmtNum(m1)} + ${n2} \times ${fmtNum(m2)} = ${fmtNum(sx1 + sx2)}$`, md`Mean $= \dfrac{${fmtNum(sx1 + sx2)}}{${N}} = ${answerTex(M)}$`],
        }),
        part({
          label: 'b',
          marks: 4,
          prompt: 'Find the standard deviation of the combined group.',
          answer: SD,
          scheme: [
            M1(md`Uses $\sigma^{2} = \dfrac{\sum x^{2}}{n} - \bar{x}^{2}$ to find $\sum x^{2}$ for one group`),
            A1(md`$\sum x^{2}$ values $${fmtNum(sxx1)}$ and $${fmtNum(sxx2)}$`),
            dM1(md`$\sqrt{\dfrac{\sum x^{2}}{${N}} - \bar{x}^{2}}$ for the combined group`),
            A1(md`$${answerTex(SD)}$`),
          ],
          hints: [md`Rearrange $\sigma^{2} = \dfrac{\sum x^{2}}{n} - \bar{x}^{2}$ to find $\sum x^{2}$ for each group.`, md`$\sum x^{2} = n(\sigma^{2} + \bar{x}^{2})$`, md`Group 1: $\sum x^{2} = ${n1}(${fmtNum(s1)}^{2} + ${fmtNum(m1)}^{2}) = ${fmtNum(sxx1)}$`],
          errors: [err('average-sds', S3((s1 + s2) / 2), 'Standard deviations cannot be averaged — combine Σx² and Σx.')],
          solution: [
            md`$\sum x^{2}$: $${n1}(${fmtNum(s1)}^{2} + ${fmtNum(m1)}^{2}) = ${fmtNum(sxx1)}$ and $${n2}(${fmtNum(s2)}^{2} + ${fmtNum(m2)}^{2}) = ${fmtNum(sxx2)}$`,
            md`$\sigma = \sqrt{\dfrac{${fmtNum(sxx1 + sxx2)}}{${N}} - (${fmtSF(mean, 5)})^{2}} = ${answerTex(SD)}$`,
          ],
        }),
      ],
      params: { n1, n2, m1, m2, s1, s2 },
    };
  },
  verify(inst) {
    const { n1, n2, m1, m2, s1, s2 } = inst.params as Record<string, number>;
    const N = n1 + n2;
    const m = (n1 * m1 + n2 * m2) / N;
    // law of total variance (independent route)
    const v = (n1 * s1 * s1 + n2 * s2 * s2) / N + (n1 * (m1 - m) ** 2 + n2 * (m2 - m) ** 2) / N;
    expectClose((inst.parts[0].answer as NumericSpec).value, m, 'mean');
    expectClose((inst.parts[1].answer as NumericSpec).value, Math.sqrt(v), 'sd via total variance', 1e-9);
  },
});

const interpolation = defineTemplate({
  id: 'sm1.2.median-interpolation',
  family: 'sm1.2.grouped',
  title: 'Median and quartiles by linear interpolation',
  spec: ['S2.3'],
  chapter: 'SM1.2',
  sections: ['2.2'],
  level: 'AS',
  paper: [3],
  difficulty: 3,
  marks: 5,
  time: 7,
  commands: ['Estimate'],
  tags: ['median', 'interquartile range', 'interpolation', 'grouped data'],
  generate(r) {
    const w = r.pick([5, 10, 20]);
    const start = r.int(1, 5) * w;
    const k = 5;
    const bounds = Array.from({ length: k + 1 }, (_, i) => start + i * w);
    const fs = bounds.slice(0, -1).map(() => r.int(4, 30));
    const n = sum(fs);
    const cum = fs.reduce<number[]>((acc, f) => [...acc, (acc[acc.length - 1] ?? 0) + f], []);
    const at = (pos: number) => {
      const i = cum.findIndex((c) => c >= pos);
      const before = i ? cum[i - 1] : 0;
      return bounds[i] + ((pos - before) / fs[i]) * w;
    };
    const med = at(n / 2),
      q1 = at(n / 4),
      q3 = at((3 * n) / 4);
    const ctx = r.pick(['the times, in seconds, taken by runners to complete a race', 'the masses, in grams, of a sample of potatoes', 'the heights, in cm, of a sample of seedlings']);
    const table = `| Class | ${bounds.slice(0, -1).map((b, i) => `${b} – ${bounds[i + 1]}`).join(' | ')} |\n|---|${fs.map(() => '---').join('|')}|\n| Frequency | ${fs.join(' | ')} |`;
    const Md = S3(med, { alts: [at((n + 1) / 2)] }),
      I = S3(q3 - q1, { alts: [at((3 * (n + 1)) / 4) - at((n + 1) / 4)] });
    const mi = cum.findIndex((c) => c >= n / 2);
    return {
      stem: md`The table shows ${ctx}. The data are continuous.\n\n${table}`,
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: 'Use linear interpolation to estimate the median.',
          answer: Md,
          scheme: [M1(md`$${bounds[mi]} + \dfrac{${n / 2} - ${mi ? cum[mi - 1] : 0}}{${fs[mi]}} \times ${w}$`), A1(md`$${answerTex(Md)}$`)],
          hints: [md`The median is the $\frac{n}{2}$th value: $\frac{${n}}{2} = ${n / 2}$.`, md`It lies in the class $${bounds[mi]}$ – $${bounds[mi + 1]}$.`, md`Interpolate: lower boundary + (position − frequency before) ÷ class frequency × class width.`],
          solution: [md`$\frac{n}{2} = ${n / 2}$, in class $${bounds[mi]}$–$${bounds[mi + 1]}$`, md`Median $= ${bounds[mi]} + \dfrac{${n / 2} - ${mi ? cum[mi - 1] : 0}}{${fs[mi]}} \times ${w} = ${answerTex(Md)}$`],
        }),
        part({
          label: 'b',
          marks: 3,
          prompt: 'Estimate the interquartile range.',
          answer: I,
          scheme: [M1(md`$Q_1$ at position $${n / 4}$`), M1(md`$Q_3$ at position $${(3 * n) / 4}$`), A1(md`IQR $= ${fmtSF(q3, 4)} - ${fmtSF(q1, 4)} = ${answerTex(I)}$`)],
          hints: [md`$Q_1$ is the $\frac{n}{4}$th value and $Q_3$ the $\frac{3n}{4}$th.`, md`Positions $${n / 4}$ and $${(3 * n) / 4}$.`, 'Interpolate each in the same way as the median, then subtract.'],
          solution: [md`$Q_1 \approx ${fmtSF(q1, 4)}$, $Q_3 \approx ${fmtSF(q3, 4)}$`, md`IQR $\approx ${answerTex(I)}$`],
        }),
      ],
      params: { bounds, fs },
    };
  },
  verify(inst) {
    const { bounds, fs } = inst.params as { bounds: number[]; fs: number[] };
    // spread each class uniformly, then read off positions
    const n = sum(fs);
    const pos = (p: number) => {
      let acc = 0;
      for (let i = 0; i < fs.length; i++) {
        if (acc + fs[i] >= p) return bounds[i] + ((p - acc) / fs[i]) * (bounds[i + 1] - bounds[i]);
        acc += fs[i];
      }
      return NaN;
    };
    expectClose((inst.parts[0].answer as NumericSpec).value, pos(n / 2), 'median');
    expectClose((inst.parts[1].answer as NumericSpec).value, pos((3 * n) / 4) - pos(n / 4), 'IQR');
  },
});

const addValue = defineTemplate({
  id: 'sm1.2.add-a-value',
  family: 'sm1.2.combined',
  title: 'Effect of adding a value on the mean and standard deviation',
  spec: ['S2.3'],
  chapter: 'SM1.2',
  sections: ['2.4'],
  level: 'AS',
  paper: [3],
  difficulty: 4,
  marks: 5,
  time: 7,
  commands: ['Find'],
  tags: ['standard deviation', 'summary statistics', 'problem solving'],
  generate(r) {
    const n = r.int(9, 24);
    const m = r.real(10, 50, 1);
    const s = r.real(1.5, 8, 1);
    const extra = Number((m + r.real(-3, 3, 1) * s).toFixed(1));
    const Sx = n * m,
      Sxx = n * (s * s + m * m);
    const nm = (Sx + extra) / (n + 1);
    const ns = Math.sqrt((Sxx + extra * extra) / (n + 1) - nm * nm);
    const M = S3(nm),
      SD = S3(ns);
    return {
      stem: md`A data set of $${n}$ values has mean $${fmtNum(m)}$ and standard deviation $${fmtNum(s)}$. A further value of $${fmtNum(extra)}$ is added to the data set.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: 'Find the new mean.', answer: M, scheme: [M1(md`$\dfrac{${n} \times ${fmtNum(m)} + ${fmtNum(extra)}}{${n + 1}}$`), A1(md`$${answerTex(M)}$`)], hints: ['Find the total of the original values.', md`$\sum x = ${n} \times ${fmtNum(m)}$`, md`Add $${fmtNum(extra)}$ and divide by $${n + 1}$.`], solution: [md`New mean $= \dfrac{${fmtNum(Sx)} + ${fmtNum(extra)}}{${n + 1}} = ${answerTex(M)}$`] }),
        part({
          label: 'b',
          marks: 3,
          prompt: 'Find the new standard deviation.',
          answer: SD,
          scheme: [M1(md`$\sum x^{2} = ${n}(${fmtNum(s)}^{2} + ${fmtNum(m)}^{2}) = ${fmtNum(Sxx)}$`), M1(md`$\sqrt{\dfrac{\sum x^{2} + ${fmtNum(extra)}^{2}}{${n + 1}} - (\text{new mean})^{2}}$`), A1(md`$${answerTex(SD)}$`)],
          hints: [md`Work out $\sum x^{2}$ for the original data from $\sigma^{2} = \dfrac{\sum x^{2}}{n} - \bar{x}^{2}$.`, md`Add $${fmtNum(extra)}^{2}$ to $\sum x^{2}$.`, 'Then use the new n and new mean.'],
          solution: [md`$\sum x^{2} = ${fmtNum(Sxx)}$; new $\sum x^{2} = ${fmtNum(Sxx + extra * extra)}$`, md`$\sigma = \sqrt{\dfrac{${fmtNum(Sxx + extra * extra)}}{${n + 1}} - (${fmtSF(nm, 5)})^{2}} = ${answerTex(SD)}$`],
        }),
      ],
      params: { n, m, s, extra },
    };
  },
  verify(inst) {
    const { n, m, s, extra } = inst.params as Record<string, number>;
    // build an explicit data set with this mean and sd, then append
    const base = Array.from({ length: n }, (_, i) => m + s * (i % 2 ? 1 : -1) * (n % 2 && i === n - 1 ? 0 : 1));
    if (n % 2) {
      const k = Math.sqrt(n / (n - 1));
      for (let i = 0; i < n - 1; i++) base[i] = m + s * k * (i % 2 ? 1 : -1);
    }
    const all = [...base, extra];
    const mm = sum(all) / all.length;
    expectClose((inst.parts[0].answer as NumericSpec).value, mm, 'new mean', 1e-9);
    expectClose((inst.parts[1].answer as NumericSpec).value, Math.sqrt(sum(all.map((x) => (x - mm) ** 2)) / all.length), 'new sd', 1e-9);
  },
});

const templates: Template[] = [summary, freqTable, grouped, coding, combined, interpolation, addValue];
export default templates;
