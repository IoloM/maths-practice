/** Statistics Year 1, Chapter 4 — correlation and linear regression (interpretation only, as in 9MA0). */
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';

interface Ctx {
  x: string;
  y: string;
  xs: string;
  ys: string;
  unitX: string;
  unitY: string;
  range: [number, number];
  a: [number, number];
  b: [number, number];
}
const CTX: Ctx[] = [
  { x: 'temperature, $t$ °C', y: 'number of cold drinks sold, $d$', xs: 't', ys: 'd', unitX: '°C', unitY: 'drinks', range: [8, 28], a: [5, 40], b: [2, 9] },
  { x: 'hours of revision, $h$', y: 'test mark, $m$', xs: 'h', ys: 'm', unitX: 'hours', unitY: 'marks', range: [2, 20], a: [15, 40], b: [1.5, 4] },
  { x: 'age of a car, $a$ years', y: 'value, $v$ (£ thousand)', xs: 'a', ys: 'v', unitX: 'years', unitY: '£ thousand', range: [1, 10], a: [18, 30], b: [-2.5, -1] },
  { x: 'daily mean temperature, $t$ °C', y: 'daily mean relative humidity, $h$ %', xs: 't', ys: 'h', unitX: '°C', unitY: '%', range: [10, 22], a: [95, 110], b: [-2.5, -0.8] },
  { x: 'length of a fish, $l$ cm', y: 'mass, $w$ g', xs: 'l', ys: 'w', unitX: 'cm', unitY: 'g', range: [20, 45], a: [-120, -40], b: [6, 14] },
];

const interpret = defineTemplate({
  id: 'sm1.4.regression-interpret-predict',
  family: 'sm1.4.regression',
  title: 'Interpreting and using a regression line',
  spec: ['S2.2'],
  chapter: 'SM1.4',
  sections: ['4.2'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 5,
  time: 5,
  commands: ['Interpret', 'Estimate', 'Comment'],
  tags: ['regression', 'interpolation', 'extrapolation', 'context'],
  generate(r) {
    const c = r.pick(CTX);
    const a = r.real(c.a[0], c.a[1], 1);
    const b = r.real(c.b[0], c.b[1], 2);
    r.require(Math.abs(b) > 0.3);
    const xIn = r.real(c.range[0] + 1, c.range[1] - 1, 0);
    const xOut = r.bool() ? c.range[1] + r.int(Math.ceil((c.range[1] - c.range[0]) / 2), c.range[1] - c.range[0]) : Math.max(0, c.range[0] - r.int(1, c.range[0]));
    r.require(xOut < c.range[0] || xOut > c.range[1]);
    const est = a + b * xIn;
    const E = ans.num(est, { sf: 3 });
    const dir = b > 0 ? 'increases' : 'decreases';
    const gOptions = r.shuffle([
      md`For each extra ${c.unitX === '°C' ? 'degree' : c.unitX.replace(/s$/, '')}, ${c.y.split(',')[0]} ${dir} by about $${fmtNum(Math.abs(b))}$ ${c.unitY}.`,
      md`${c.y.split(',')[0].replace(/^./, (s) => s.toUpperCase())} is $${fmtNum(a)}$ when ${c.x.split(',')[0]} is $1$.`,
      md`${c.x.split(',')[0].replace(/^./, (s) => s.toUpperCase())} ${dir} by $${fmtNum(Math.abs(b))}$ for each extra ${c.unitY}.`,
    ]);
    const G = ans.choice(gOptions, gOptions.findIndex((o) => o.startsWith('For each extra')));
    const relOptions = [md`Reliable: $${xIn}$ is within the range of the data (interpolation).`, md`Unreliable: $${xIn}$ is outside the range of the data (extrapolation).`];
    const outOptions = [md`Reliable: $${xOut}$ is within the range of the data (interpolation).`, md`Unreliable: $${xOut}$ is outside the range of the data (extrapolation).`];
    const C1 = ans.choice(relOptions, 0);
    const C2 = ans.choice(outOptions, 1);
    return {
      stem: md`Data are collected on ${c.x} and ${c.y}. The values of $${c.xs}$ range from $${c.range[0]}$ to $${c.range[1]}$. The regression line of $${c.ys}$ on $${c.xs}$ is $${c.ys} = ${fmtNum(a)} ${b < 0 ? '-' : '+'} ${fmtNum(Math.abs(b))}${c.xs}$.`,
      parts: [
        part({
          label: 'a',
          marks: 1,
          prompt: md`Give an interpretation of the gradient $${fmtNum(b)}$ in context.`,
          answer: G,
          scheme: [B1('Rate of change of the response variable per unit of the explanatory variable, in context')],
          hints: ['The gradient is the change in y for each 1 unit increase in x.', md`Here $${c.ys}$ changes by $${fmtNum(b)}$ for each unit increase in $${c.xs}$.`, 'Use the context words, not x and y.'],
          solution: [gOptions[gOptions.findIndex((o) => o.startsWith('For each extra'))]],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Estimate $${c.ys}$ when $${c.xs} = ${xIn}$.`,
          answer: E,
          scheme: [M1(md`Substitutes $${c.xs} = ${xIn}$`), A1(md`awrt $${answerTex(E)}$`)],
          hints: ['Substitute into the regression equation.', md`$${c.ys} = ${fmtNum(a)} ${b < 0 ? '-' : '+'} ${fmtNum(Math.abs(b))} \times ${xIn}$`, 'Work it out on your calculator.'],
          solution: [md`$${c.ys} = ${fmtNum(a)} ${b < 0 ? '-' : '+'} ${fmtNum(Math.abs(b))} \times ${xIn} = ${answerTex(E)}$`],
        }),
        part({
          label: 'c',
          marks: 1,
          prompt: md`Comment on the reliability of your estimate in part (b).`,
          answer: C1,
          scheme: [B1('Reliable — interpolation')],
          hints: ['Is the value inside the range of the data?', `The data range from ${c.range[0]} to ${c.range[1]}.`, 'Estimates inside the range (interpolation) are more reliable.'],
          solution: [relOptions[0]],
        }),
        part({
          label: 'd',
          marks: 1,
          prompt: md`Comment on using the line to estimate $${c.ys}$ when $${c.xs} = ${xOut}$.`,
          answer: C2,
          scheme: [B1('Unreliable — extrapolation')],
          hints: ['Is this value inside the range of the data?', `The data range from ${c.range[0]} to ${c.range[1]}.`, 'Extrapolation assumes the trend continues beyond the data.'],
          solution: [outOptions[1]],
        }),
      ],
      params: { a, b, xIn },
    };
  },
  verify(inst) {
    const { a, b, xIn } = inst.params as Record<string, number>;
    expectClose((inst.parts[1].answer as NumericSpec).value, a + b * xIn, 'estimate');
  },
});

const describe = defineTemplate({
  id: 'sm1.4.describe-correlation',
  family: 'sm1.4.correlation',
  title: 'Describing correlation and causation',
  spec: ['S2.2'],
  chapter: 'SM1.4',
  sections: ['4.1'],
  level: 'AS',
  paper: [3],
  difficulty: 1,
  marks: 3,
  time: 3,
  commands: ['Describe', 'State'],
  tags: ['correlation', 'causation', 'explanatory variable'],
  generate(r) {
    const c = r.pick(CTX);
    const rv = Number((r.sign() * r.real(0.05, 0.98, 2)).toFixed(2));
    r.require(Math.abs(rv) > 0.05);
    const strength = Math.abs(rv) >= 0.7 ? 'strong' : Math.abs(rv) >= 0.35 ? 'moderate' : 'weak';
    const sign = rv > 0 ? 'positive' : 'negative';
    const opts = ['strong positive', 'moderate positive', 'weak positive', 'weak negative', 'moderate negative', 'strong negative'];
    const C = ans.choice(opts.map((o) => `${o} correlation`), opts.indexOf(`${strength} ${sign}`));
    const expOpts = [md`${c.x.split(',')[0]}`, md`${c.y.split(',')[0]}`];
    const E = ans.choice(expOpts, 0);
    const causeOpts = r.shuffle([
      'No — correlation does not imply causation; another factor could explain the relationship.',
      `Yes — the correlation coefficient proves that one variable causes the other.`,
      'Yes — any non-zero correlation shows a causal link.',
    ]);
    const Ca = ans.choice(causeOpts, causeOpts.findIndex((o) => o.startsWith('No')));
    return {
      stem: md`For a sample of data on ${c.x} and ${c.y}, the product moment correlation coefficient is $${rv}$.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: 'Describe the correlation.', answer: C, scheme: [B1(`${strength} ${sign}`)], hints: ['Sign: direction. Size: strength.', 'Near ±1 strong; near 0 weak.', md`$r = ${rv}$`], solution: [md`$r = ${rv}$ shows ${strength} ${sign} correlation.`] }),
        part({ label: 'b', marks: 1, prompt: 'Which is the explanatory variable?', answer: E, scheme: [B1('The variable that is not affected by the other')], hints: ['The explanatory variable is the one you control or that comes first.', 'It goes on the horizontal axis.', 'Which variable could affect the other?'], solution: [md`The explanatory (independent) variable is ${c.x.split(',')[0]}.`] }),
        part({ label: 'c', marks: 1, prompt: md`Does this show that a change in ${c.x.split(',')[0]} causes a change in ${c.y.split(',')[0]}?`, answer: Ca, scheme: [B1('Correlation does not imply causation')], hints: ['What can correlation tell you?', 'It measures a linear relationship only.', 'Could a third variable be responsible?'], solution: ['Correlation does not imply causation.'] }),
      ],
      params: { rv },
    };
  },
  verify(inst) {
    const { rv } = inst.params as { rv: number };
    expect(Math.abs(rv) <= 1, 'valid r');
  },
});

const regressionResiduals = defineTemplate({
  id: 'sm1.4.regression-from-coded',
  family: 'sm1.4.regression',
  title: 'Using a regression line with changed units',
  spec: ['S2.2', 'S2.3'],
  chapter: 'SM1.4',
  sections: ['4.2'],
  level: 'AS',
  paper: [3],
  difficulty: 3,
  marks: 4,
  time: 5,
  commands: ['Estimate', 'Find'],
  tags: ['regression', 'units', 'prediction'],
  generate(r) {
    const a = r.real(10, 60, 1);
    const b = r.real(0.5, 4, 2);
    const k = r.pick([10, 100, 1000]);
    const xKm = r.real(1, 9, 1);
    const est = a + b * xKm;
    const ctx = r.pick([
      { y: 'the time, $y$ minutes, taken for a delivery', x: 'the distance travelled, $d$ km' },
      { y: 'the cost, $y$ pounds, of a taxi journey', x: 'the length of the journey, $d$ km' },
      { y: 'the fuel used, $y$ litres, by a van', x: 'the distance driven, $d$ km' },
    ]);
    const E = ans.num(est, { sf: 3 });
    const gradPerUnit = b / k;
    const G = ans.num(gradPerUnit, { sf: 3 });
    const unitName = k === 1000 ? 'metre' : k === 100 ? '10 metres' : '100 metres';
    return {
      stem: md`Data are collected on ${ctx.y} and ${ctx.x}. The regression line of $y$ on $d$ is $y = ${fmtNum(a)} + ${fmtNum(b)}d$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Estimate $y$ for a distance of $${xKm}$ km.`, answer: E, scheme: [M1(md`Substitutes $d = ${xKm}$`), A1(md`awrt $${answerTex(E)}$`)], hints: ['Substitute into the line.', md`$y = ${fmtNum(a)} + ${fmtNum(b)} \times ${xKm}$`, 'Use your calculator.'], solution: [md`$y = ${fmtNum(a)} + ${fmtNum(b)} \times ${xKm} = ${answerTex(E)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`By how much does $y$ increase for each extra ${unitName}? Give your answer to 3 significant figures.`, answer: G, scheme: [M1(md`Divides the gradient by $${k}$`), A1(md`awrt $${answerTex(G)}$`)], hints: ['The gradient is the change per km.', md`1 km $= ${k}$ × (${unitName}).`, md`$${fmtNum(b)} \div ${k}$`], solution: [md`Change per ${unitName} $= ${fmtNum(b)} \div ${k} = ${answerTex(G)}$`] }),
      ],
      params: { a, b, xKm, k },
    };
  },
  verify(inst) {
    const { a, b, xKm, k } = inst.params as Record<string, number>;
    expectClose((inst.parts[0].answer as NumericSpec).value, a + b * xKm, 'estimate');
    expectClose((inst.parts[1].answer as NumericSpec).value * k, b, 'rescaled gradient');
  },
});

const templates: Template[] = [interpret, describe, regressionResiduals];
export default templates;
