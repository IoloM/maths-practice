/** Statistics Year 1, Chapter 3 — representations of data: histograms, box plots, outliers. */
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { evaluate, num } from '../../../engine/core/expr';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, ListSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import type { Rng } from '../../../engine/core/rng';
import { boxPlotSvg, histogramSvg } from '../shared/statsDiagrams';

const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
const S3 = (v: number) => ans.num(v, { sf: 3 });

interface HistCtx {
  what: string;
  unit: string;
  start: number[];
  widths: number[];
}
const HCTX: HistCtx[] = [
  { what: 'the time, $t$ minutes, taken by people to complete a fun run', unit: 'Time (minutes)', start: [20, 25, 30], widths: [5, 5, 10, 10, 20] },
  { what: 'the length, $l$ cm, of a sample of fish', unit: 'Length (cm)', start: [10, 15], widths: [5, 5, 5, 10, 15] },
  { what: 'the daily total rainfall, $r$ mm, at Hurn', unit: 'Rainfall (mm)', start: [0], widths: [2, 2, 4, 6, 10] },
  { what: 'the mass, $m$ g, of a sample of potatoes', unit: 'Mass (g)', start: [100, 120], widths: [20, 20, 40, 40, 80] },
  { what: 'the daily maximum gust, $g$ knots, at Leeming', unit: 'Gust (knots)', start: [10], widths: [5, 5, 5, 10, 15] },
];

function makeHist(r: Rng) {
  const c = r.pick(HCTX);
  const s = r.pick(c.start);
  const widths = r.shuffle(c.widths).slice(0, r.int(4, 5));
  const bounds = widths.reduce<number[]>((acc, w) => [...acc, acc[acc.length - 1] + w], [s]);
  // frequencies that give tidy frequency densities
  const fd = widths.map((w) => {
    const target = r.pick([0.4, 0.5, 0.8, 1, 1.2, 1.5, 1.6, 2, 2.4, 2.5, 3, 3.2, 3.5, 4, 4.5, 5, 6]);
    return target * (10 / Math.max(...c.widths)) * (r.int(1, 4));
  });
  const fs = fd.map((f, i) => Math.round(f * widths[i]));
  const fdExact = fs.map((f, i) => f / widths[i]);
  return { c, bounds, widths, fs, fd: fdExact };
}

const tableOf = (bounds: number[], fs: number[], first = 'Class') =>
  `| ${first} | ${bounds.slice(0, -1).map((b, i) => `${fmtNum(b)} ⩽ x < ${fmtNum(bounds[i + 1])}`).join(' | ')} |\n|---|${fs.map(() => '---').join('|')}|\n| Frequency | ${fs.join(' | ')} |`;

const fdTemplate = defineTemplate({
  id: 'sm1.3.histogram-frequency-density',
  family: 'sm1.3.histograms',
  title: 'Histograms: frequency density from a table',
  spec: ['S2.1'],
  chapter: 'SM1.3',
  sections: ['3.4'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Find', 'Calculate'],
  tags: ['histogram', 'frequency density', 'unequal class widths'],
  generate(r) {
    const h = makeHist(r);
    r.require(h.fs.every((f) => f >= 2) && new Set(h.widths).size > 1);
    const i = r.int(0, h.fs.length - 1);
    const j = (i + r.int(1, h.fs.length - 1)) % h.fs.length;
    const FD = S3(h.fd[i]);
    const ratioH = h.fd[j] / h.fd[i];
    const height = r.pick([2, 3, 4, 5, 6]);
    const Hh = S3(height * ratioH);
    return {
      stem: md`The table summarises ${h.c.what}.\n\n${tableOf(h.bounds, h.fs)}`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Calculate the frequency density for the class $${fmtNum(h.bounds[i])} \leqslant x < ${fmtNum(h.bounds[i + 1])}$.`, answer: FD, scheme: [M1(md`Frequency $\div$ class width $= \dfrac{${h.fs[i]}}{${h.widths[i]}}$`), A1(md`$${answerTex(FD)}$`)], hints: ['Frequency density = frequency ÷ class width.', md`The class width is $${h.widths[i]}$.`, md`$\dfrac{${h.fs[i]}}{${h.widths[i]}}$`], errors: [err('times', S3(h.fs[i] * h.widths[i]), 'Divide the frequency by the class width — do not multiply.')], solution: [md`Class width $= ${h.widths[i]}$, so frequency density $= \dfrac{${h.fs[i]}}{${h.widths[i]}} = ${answerTex(FD)}$`] }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`On a histogram of these data, the bar for the class $${fmtNum(h.bounds[i])} \leqslant x < ${fmtNum(h.bounds[i + 1])}$ has height $${height}$ cm. Find the height of the bar for the class $${fmtNum(h.bounds[j])} \leqslant x < ${fmtNum(h.bounds[j + 1])}$.`,
          answer: { ...Hh, unit: '\\text{cm}' },
          scheme: [M1('Uses the ratio of frequency densities'), A1(md`$${fmtSF(height * ratioH, 3)}$ cm`)],
          hints: ['Bar heights are proportional to frequency density, not frequency.', md`Frequency density of the second class: $\dfrac{${h.fs[j]}}{${h.widths[j]}}$.`, md`Height $= ${height} \times \dfrac{\text{FD}_2}{\text{FD}_1}$`],
          errors: [err('used-frequency', S3((height * h.fs[j]) / h.fs[i]), 'Bar heights are proportional to frequency density, not frequency.')],
          solution: [md`$\text{FD} = ${fmtSF(h.fd[i], 4)}$ and $${fmtSF(h.fd[j], 4)}$`, md`Height $= ${height} \times \dfrac{${fmtSF(h.fd[j], 4)}}{${fmtSF(h.fd[i], 4)}} = ${answerTex({ ...Hh, unit: '\\text{cm}' })}$`],
        }),
      ],
      params: { fs: h.fs, widths: h.widths, i, j, height },
    };
  },
  verify(inst) {
    const { fs, widths, i, j, height } = inst.params as { fs: number[]; widths: number[]; i: number; j: number; height: number };
    expectClose((inst.parts[0].answer as NumericSpec).value * widths[i], fs[i], 'area = frequency');
    const h2 = (inst.parts[1].answer as NumericSpec).value;
    expectClose((h2 * widths[j]) / (height * widths[i]), fs[j] / fs[i], 'area ratio = frequency ratio');
  },
});

const readHist = defineTemplate({
  id: 'sm1.3.histogram-read',
  family: 'sm1.3.histograms',
  title: 'Reading frequencies from a histogram',
  spec: ['S2.1'],
  chapter: 'SM1.3',
  sections: ['3.4'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Find'],
  tags: ['histogram', 'area = frequency', 'diagram'],
  generate(r) {
    const h = makeHist(r);
    r.require(h.fs.every((f) => f >= 1) && new Set(h.widths).size > 1);
    const i = r.int(0, h.fs.length - 1);
    const total = sum(h.fs);
    const Fi = ans.exact(num(h.fs[i]));
    const Tt = ans.exact(num(total));
    return {
      stem: md`The histogram shows ${h.c.what}.`,
      diagram: { svg: histogramSvg(h.bounds, h.fd, { xLabel: h.c.unit }), alt: `Histogram with classes ${h.bounds.map(fmtNum).join(', ')} and frequency densities ${h.fd.map((x) => fmtNum(x)).join(', ')}.` },
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the number of values in the class $${fmtNum(h.bounds[i])} \leqslant x < ${fmtNum(h.bounds[i + 1])}$.`, answer: Fi, scheme: [M1('Frequency = frequency density × class width'), A1(md`$${h.fs[i]}$`)], hints: ['In a histogram, area represents frequency.', 'Frequency = frequency density × class width.', md`Read the height of the bar and multiply by $${h.widths[i]}$.`], errors: [err('height-only', ans.num(h.fd[i], { sf: 3 }), 'That is the frequency density (the bar height). Multiply by the class width.')], solution: [md`Frequency $= ${fmtNum(h.fd[i])} \times ${h.widths[i]} = ${answerTex(Fi)}$`] }),
        part({ label: 'b', marks: 2, prompt: 'Find the total number of values represented by the histogram.', answer: Tt, scheme: [M1('Adds area of all bars'), A1(md`$${total}$`)], hints: ['Find the frequency for every bar.', 'Each frequency is FD × width.', 'Add them up.'], errors: [err('sum-heights', ans.num(sum(h.fd), { sf: 3 }), 'Add the areas (frequencies), not the heights.')], solution: [md`Frequencies: $${h.fs.join(', ')}$; total $= ${answerTex(Tt)}$`] }),
      ],
      params: { fs: h.fs },
    };
  },
  verify(inst) {
    const { fs } = inst.params as { fs: number[] };
    expectClose(evaluate((inst.parts[1].answer as ExactSpec).value), sum(fs), 'total');
  },
});

const estimateHist = defineTemplate({
  id: 'sm1.3.histogram-estimate-range',
  family: 'sm1.3.histograms',
  title: 'Estimating a frequency across classes by interpolation',
  spec: ['S2.1', 'S2.3'],
  chapter: 'SM1.3',
  sections: ['3.4'],
  level: 'AS',
  paper: [3],
  difficulty: 3,
  marks: 3,
  time: 5,
  commands: ['Estimate'],
  tags: ['histogram', 'interpolation', 'estimate'],
  generate(r) {
    const h = makeHist(r);
    r.require(h.fs.every((f) => f >= 2));
    const k = h.bounds.length - 1;
    const i = r.int(0, k - 2);
    const j = r.int(i + 1, k - 1);
    const a = h.bounds[i] + h.widths[i] * r.pick([0.2, 0.4, 0.5, 0.6, 0.8]);
    const b = h.bounds[j] + h.widths[j] * r.pick([0.2, 0.4, 0.5, 0.6, 0.8]);
    const count = (lo: number, hi: number) => {
      let s = 0;
      for (let c = 0; c < k; c++) {
        const L = Math.max(lo, h.bounds[c]),
          R = Math.min(hi, h.bounds[c + 1]);
        if (R > L) s += h.fd[c] * (R - L);
      }
      return s;
    };
    const est = count(a, b);
    const E = S3(est);
    return {
      stem: md`The table summarises ${h.c.what}.\n\n${tableOf(h.bounds, h.fs)}`,
      parts: [
        part({
          marks: 3,
          prompt: md`Estimate the number of values between $${fmtNum(a)}$ and $${fmtNum(b)}$.`,
          answer: E,
          scheme: [M1('Uses a fraction of a partial class (linear interpolation)'), M1('Adds whole classes and both partial classes'), A1(md`$${answerTex(E)}$`)],
          hints: ['Assume values are spread evenly within each class.', 'For a partial class: frequency × (part of width ÷ whole width).', md`From $${fmtNum(a)}$ to $${fmtNum(h.bounds[i + 1])}$ is part of the class $${fmtNum(h.bounds[i])}$–$${fmtNum(h.bounds[i + 1])}$.`],
          solution: [
            md`Partial class: $\dfrac{${fmtNum(h.bounds[i + 1] - a)}}{${h.widths[i]}} \times ${h.fs[i]} = ${fmtSF(h.fd[i] * (h.bounds[i + 1] - a), 4)}$`,
            ...(j > i + 1 ? [md`Whole classes: $${h.fs.slice(i + 1, j).join(' + ')} = ${sum(h.fs.slice(i + 1, j))}$`] : []),
            md`Partial class: $\dfrac{${fmtNum(b - h.bounds[j])}}{${h.widths[j]}} \times ${h.fs[j]} = ${fmtSF(h.fd[j] * (b - h.bounds[j]), 4)}$`,
            md`Total $\approx ${answerTex(E)}$`,
          ],
        }),
      ],
      params: { bounds: h.bounds, fs: h.fs, a, b },
    };
  },
  verify(inst) {
    const { bounds, fs, a, b } = inst.params as { bounds: number[]; fs: number[]; a: number; b: number };
    // cumulative frequency polygon (ogive) read at a and b
    const cf = fs.reduce<number[]>((acc, f) => [...acc, acc[acc.length - 1] + f], [0]);
    const F = (x: number) => {
      const c = bounds.findIndex((_, q) => q < bounds.length - 1 && x >= bounds[q] && x <= bounds[q + 1]);
      return cf[c] + ((x - bounds[c]) / (bounds[c + 1] - bounds[c])) * fs[c];
    };
    const s = F(b) - F(a);
    expectClose((inst.parts[0].answer as NumericSpec).value, s, 'interpolated count', 1e-6);
  },
});

const scaleHist = defineTemplate({
  id: 'sm1.3.histogram-bar-dimensions',
  family: 'sm1.3.histograms',
  title: 'Histogram bar widths and heights from a given scale',
  spec: ['S2.1'],
  chapter: 'SM1.3',
  sections: ['3.4'],
  level: 'AS',
  paper: [3],
  difficulty: 4,
  marks: 5,
  time: 7,
  commands: ['Find'],
  tags: ['histogram', 'scale', 'area', 'problem solving'],
  generate(r) {
    const w1 = r.pick([5, 10, 20]);
    const w2 = w1 * r.pick([0.5, 2, 3, 4]);
    const f1 = r.int(6, 40),
      f2 = r.int(6, 60);
    const cmW = r.pick([1, 1.5, 2, 2.5]);
    const cmH = r.pick([2, 3, 4, 5, 6, 7.5, 8]);
    const lo1 = r.int(1, 6) * 5;
    const width2 = (cmW * w2) / w1;
    const k = f1 / (cmW * cmH); // frequency per cm²
    const height2 = f2 / k / width2;
    r.require(height2 > 0.5 && height2 < 20);
    const Wd = ans.num(width2, { sf: 3 }, { unit: '\\text{cm}' });
    const Ht = ans.num(height2, { sf: 3 }, { unit: '\\text{cm}' });
    return {
      stem: md`A histogram is drawn to represent some grouped continuous data. The class $${lo1} \leqslant x < ${lo1 + w1}$ has frequency $${f1}$ and is represented by a bar $${cmW}$ cm wide and $${cmH}$ cm tall. Another class, of width $${w2}$, has frequency $${f2}$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: 'Find the width of the bar for the second class.', answer: Wd, scheme: [M1(md`Scale: $${w1}$ units ↦ $${cmW}$ cm`), A1(md`$${answerTex(Wd)}$`)], hints: ['The horizontal scale is the same for every bar.', md`$${w1}$ units of $x$ are $${cmW}$ cm.`, md`So $${w2}$ units are $${cmW} \times \dfrac{${w2}}{${w1}}$ cm.`], solution: [md`Width $= ${cmW} \times \dfrac{${w2}}{${w1}} = ${answerTex(Wd)}$`] }),
        part({
          label: 'b',
          marks: 3,
          prompt: 'Find the height of the bar for the second class.',
          answer: Ht,
          ft: (prev) => (prev.a?.value ? ans.num(f2 / k / prev.a.value, { sf: 3 }) : null),
          scheme: [M1(md`Area represents frequency: $${cmW} \times ${cmH} = ${cmW * cmH}$ cm² for $${f1}$`), M1(md`Area for $${f2}$: $${fmtSF(f2 / k, 4)}$ cm²`), A1(md`Height $= ${answerTex(Ht)}$`)],
          hints: ['Area is proportional to frequency.', md`$${f1}$ values are represented by $${cmW * cmH}$ cm².`, md`Find the area for $${f2}$ values, then divide by the width.`],
          errors: [err('height-prop-freq', ans.num((cmH * f2) / f1, { sf: 3 }), 'Height is not proportional to frequency when the widths differ — use area.', 1)],
          solution: [md`$1$ cm² represents $${fmtSF(k, 4)}$ values, so the area for $${f2}$ values is $${fmtSF(f2 / k, 4)}$ cm².`, md`Height $= \dfrac{${fmtSF(f2 / k, 4)}}{${fmtSF(width2, 4)}} = ${answerTex(Ht)}$`],
        }),
      ],
      params: { w1, w2, f1, f2, cmW, cmH },
    };
  },
  verify(inst) {
    const { w1, w2, f1, f2, cmW, cmH } = inst.params as Record<string, number>;
    const wd = (inst.parts[0].answer as NumericSpec).value,
      ht = (inst.parts[1].answer as NumericSpec).value;
    // frequency density ratio check: (ht/cmH) = (f2/w2)/(f1/w1)
    expectClose(ht / cmH, f2 / w2 / (f1 / w1), 'heights ∝ frequency density');
    expectClose(wd / cmW, w2 / w1, 'widths ∝ class width');
  },
});

const outliersIqr = defineTemplate({
  id: 'sm1.3.outliers-iqr',
  family: 'sm1.3.outliers',
  title: 'Outliers using Q₁ − 1.5 × IQR and Q₃ + 1.5 × IQR',
  spec: ['S2.4'],
  chapter: 'SM1.3',
  sections: ['3.1', '3.2'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Find', 'Show that'],
  tags: ['outliers', 'interquartile range', 'box plot'],
  generate(r) {
    const q1 = r.int(10, 50);
    const q3 = q1 + r.int(4, 20);
    const iqr = q3 - q1;
    const k = r.pick([1.5, 1.5, 2]);
    const lo = q1 - k * iqr,
      hi = q3 + k * iqr;
    const cands = r.shuffle([Math.floor(lo) - r.int(1, 6), Math.ceil(lo) + r.int(1, 4), Math.floor(hi) - r.int(1, 4), Math.ceil(hi) + r.int(1, 8), Math.ceil(hi) + r.int(9, 20)]).slice(0, 4);
    const outs = cands.filter((c) => c < lo || c > hi).sort((a, b) => a - b);
    r.require(outs.length >= 1 && outs.length < cands.length);
    const Lo = ans.num(lo, { sf: 3 }),
      Hi = ans.num(hi, { sf: 3 });
    const L: ListSpec = ans.list(outs.map((o) => ans.exact(num(o))));
    const ctx = r.pick(['daily maximum gusts (knots) recorded at Leuchars', 'reaction times (hundredths of a second)', 'marks in a test', 'daily mean windspeeds (knots) at Heathrow']);
    return {
      stem: md`For a set of ${ctx}, the lower quartile is $${q1}$ and the upper quartile is $${q3}$. An outlier is defined as a value less than $Q_1 - ${k}(Q_3 - Q_1)$ or greater than $Q_3 + ${k}(Q_3 - Q_1)$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: 'Find the lower outlier limit.', answer: Lo, scheme: [M1(md`IQR $= ${iqr}$`), A1(md`$${q1} - ${k} \times ${iqr} = ${fmtNum(lo)}$`)], hints: ['IQR = Q₃ − Q₁.', md`Lower limit $= Q_1 - ${k} \times \text{IQR}$.`, md`$${q1} - ${k} \times ${iqr}$`], solution: [md`IQR $= ${q3} - ${q1} = ${iqr}$; lower limit $= ${q1} - ${k} \times ${iqr} = ${answerTex(Lo)}$`] }),
        part({ label: 'b', marks: 1, prompt: 'Find the upper outlier limit.', answer: Hi, scheme: [B1(md`$${fmtNum(hi)}$`)], hints: [md`Upper limit $= Q_3 + ${k} \times \text{IQR}$.`, md`$${q3} + ${k} \times ${iqr}$`, 'Same method as part (a).'], solution: [md`Upper limit $= ${q3} + ${k} \times ${iqr} = ${answerTex(Hi)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`The values $${cands.join(', ')}$ are also in the data set. Which of them are outliers?`, answer: L, scheme: [B1(md`$${outs.join(', ')}$ only`)], hints: ['Compare each value with your limits.', md`Outliers are below $${fmtNum(lo)}$ or above $${fmtNum(hi)}$.`, 'There may be more than one.'], solution: [md`Limits $${fmtNum(lo)}$ and $${fmtNum(hi)}$, so the outliers are $${answerTex(L)}$.`] }),
      ],
      params: { q1, q3, k, cands },
    };
  },
  verify(inst) {
    const { q1, q3, k, cands } = inst.params as { q1: number; q3: number; k: number; cands: number[] };
    const lo = (inst.parts[0].answer as NumericSpec).value,
      hi = (inst.parts[1].answer as NumericSpec).value;
    expectClose(hi - lo, (q3 - q1) * (1 + 2 * k), 'width of fence');
    const outs = (inst.parts[2].answer as ListSpec).items.length;
    expect(outs === cands.filter((c) => c < lo || c > hi).length, 'outlier count');
  },
});

const outliersSd = defineTemplate({
  id: 'sm1.3.outliers-mean-sd',
  family: 'sm1.3.outliers',
  title: 'Outliers using the mean ± k standard deviations',
  spec: ['S2.4', 'S2.3'],
  chapter: 'SM1.3',
  sections: ['3.1'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 3,
  time: 4,
  commands: ['Show that', 'Determine'],
  tags: ['outliers', 'standard deviation', 'cleaning data'],
  generate(r) {
    const mean = r.real(10, 60, 1);
    const sd = r.real(1.5, 8, 1);
    const k = r.pick([2, 3]);
    const value = Number((mean + r.pick([-1, 1]) * r.real(k * 0.6, k * 1.5, 1) * sd).toFixed(1));
    r.require(Math.abs(Math.abs(value - mean) - k * sd) > 0.3);
    const isOut = Math.abs(value - mean) > k * sd;
    const Lim = ans.num(value > mean ? mean + k * sd : mean - k * sd, { sf: 3 });
    const C = ans.choice([`Yes — ${fmtNum(value)} is an outlier`, `No — ${fmtNum(value)} is not an outlier`], isOut ? 0 : 1);
    return {
      stem: md`A data set has mean $${fmtNum(mean)}$ and standard deviation $${fmtNum(sd)}$. An outlier is a value more than $${k}$ standard deviations from the mean.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the ${value > mean ? 'upper' : 'lower'} limit for outliers.`, answer: Lim, scheme: [M1(md`$${fmtNum(mean)} ${value > mean ? '+' : '-'} ${k} \times ${fmtNum(sd)}$`), A1(md`$${answerTex(Lim)}$`)], hints: [md`Limit $= \bar{x} \pm ${k}\sigma$.`, `Use the ${value > mean ? 'plus' : 'minus'} sign.`, md`$${fmtNum(mean)} ${value > mean ? '+' : '-'} ${k} \times ${fmtNum(sd)}$`], solution: [md`$${fmtNum(mean)} ${value > mean ? '+' : '-'} ${k} \times ${fmtNum(sd)} = ${answerTex(Lim)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Is the value $${fmtNum(value)}$ an outlier?`, answer: C, scheme: [B1('Correct conclusion with comparison')], hints: ['Compare with your limit.', 'Outliers are beyond the limit.', md`Limit: $${fmtSF(Lim.value, 3)}$`], solution: [md`$${fmtNum(value)}$ is ${isOut ? 'beyond' : 'within'} the limit $${fmtSF(Lim.value, 3)}$, so it is ${isOut ? '' : 'not '}an outlier.`] }),
      ],
      params: { mean, sd, k, value },
    };
  },
  verify(inst) {
    const { mean, sd, k } = inst.params as Record<string, number>;
    expectClose(Math.abs((inst.parts[0].answer as NumericSpec).value - mean), k * sd, 'limit');
  },
});

const boxCompare = defineTemplate({
  id: 'sm1.3.box-plots-compare',
  family: 'sm1.3.box-plots',
  title: 'Comparing distributions with box plots',
  spec: ['S2.4', 'S2.1'],
  chapter: 'SM1.3',
  sections: ['3.2', '3.5'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Find', 'Compare'],
  tags: ['box plot', 'interquartile range', 'comparing data'],
  generate(r) {
    const mk = () => {
      const med = r.int(20, 40);
      const q1 = med - r.int(2, 8),
        q3 = med + r.int(2, 8);
      return [q1 - r.int(3, 10), q1, med, q3, q3 + r.int(3, 10)] as [number, number, number, number, number];
    };
    const A = mk(),
      B = mk();
    r.require(A[2] !== B[2] && A[3] - A[1] !== B[3] - B[1]);
    const names = r.pick([
      ['Camborne', 'Leeming'],
      ['Group A', 'Group B'],
      ['Year 12', 'Year 13'],
    ]);
    const what = names[0] === 'Camborne' ? 'daily mean temperature (°C × 2)' : 'test score';
    const IQ = ans.exact(num(A[3] - A[1]));
    const higherMed = A[2] > B[2] ? names[0] : names[1];
    const moreSpread = A[3] - A[1] > B[3] - B[1] ? names[0] : names[1];
    const opts = [md`${higherMed} has the higher median, and ${moreSpread} has the larger interquartile range.`, md`${higherMed === names[0] ? names[1] : names[0]} has the higher median, and ${moreSpread} has the larger interquartile range.`, md`${higherMed} has the higher median, and ${moreSpread === names[0] ? names[1] : names[0]} has the larger interquartile range.`];
    const order = r.shuffle([0, 1, 2]);
    const C = ans.choice(order.map((i) => opts[i]), order.indexOf(0));
    const lo = Math.min(A[0], B[0]) - 3,
      hi = Math.max(A[4], B[4]) + 3;
    return {
      stem: md`The box plots summarise the ${what} for ${names[0]} and ${names[1]}.`,
      diagram: { svg: boxPlotSvg([{ label: names[0], five: A }, { label: names[1], five: B }], [lo, hi], what), alt: `Box plots: ${names[0]} min ${A[0]}, Q1 ${A[1]}, median ${A[2]}, Q3 ${A[3]}, max ${A[4]}; ${names[1]} min ${B[0]}, Q1 ${B[1]}, median ${B[2]}, Q3 ${B[3]}, max ${B[4]}.` },
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the interquartile range for ${names[0]}.`, answer: IQ, scheme: [M1('Q₃ − Q₁ read from the diagram'), A1(md`$${A[3] - A[1]}$`)], hints: ['The box spans from Q₁ to Q₃.', 'IQR = Q₃ − Q₁.', md`$${A[3]} - ${A[1]}$`], errors: [err('range', ans.exact(num(A[4] - A[0])), 'That is the range. The IQR is the width of the box.')], solution: [md`IQR $= ${A[3]} - ${A[1]} = ${answerTex(IQ)}$`] }),
        part({ label: 'b', marks: 2, prompt: 'Which statement correctly compares the two distributions?', answer: C, scheme: [B1('Compares a measure of location (median)'), B1('Compares a measure of spread (IQR)')], hints: ['Compare the medians (lines in the boxes).', 'Compare the widths of the boxes.', md`Medians: $${A[2]}$ and $${B[2]}$; IQRs: $${A[3] - A[1]}$ and $${B[3] - B[1]}$.`], solution: [opts[0]] }),
      ],
      params: { A, B },
    };
  },
  verify(inst) {
    const { A } = inst.params as { A: number[] };
    expect(A[1] < A[2] && A[2] < A[3], 'ordered five-number summary');
  },
});

void dM1;

const templates: Template[] = [fdTemplate, readHist, estimateHist, scaleHist, outliersIqr, outliersSd, boxCompare];
export default templates;
