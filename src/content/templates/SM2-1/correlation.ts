/** Statistics Year 2, Chapter 1 — regression, correlation and hypothesis testing. */
import { lgamma, pmcc, pmccCritical } from '../../../engine/stats/distributions';
import { expect, expectClose, integrate } from '../../../engine/core/numeric';
import { fmtNum, fmtSF, fmtDP } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { HypothesisSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import type { Rng } from '../../../engine/core/rng';
import { pct, pTex } from '../shared/stats';

interface Pair {
  x: string;
  y: string;
  pos: boolean;
  who: string;
}
const PAIRS: Pair[] = [
  { x: 'the daily mean temperature', y: 'the number of ice creams sold', pos: true, who: 'A café owner' },
  { x: 'the number of hours spent revising', y: 'the test mark', pos: true, who: 'A teacher' },
  { x: 'the age of a car', y: 'its value', pos: false, who: 'A car dealer' },
  { x: 'the engine size of a car', y: 'its fuel economy in miles per gallon', pos: false, who: 'A motoring journalist' },
  { x: 'the daily total sunshine', y: 'the daily maximum temperature', pos: true, who: 'A meteorologist' },
  { x: 'the altitude of a town', y: 'its mean January temperature', pos: false, who: 'A geographer' },
  { x: 'the length of a fish', y: 'its mass', pos: true, who: 'A biologist' },
  { x: 'the daily mean cloud cover', y: 'the daily total sunshine', pos: false, who: 'A student using the large data set' },
];

/** Null density of r for sample size n (independent check of critical values). */
function rDensity(n: number) {
  const a = 0.5,
    b = (n - 2) / 2;
  const lB = lgamma(a) + lgamma(b) - lgamma(a + b);
  return (r: number) => Math.exp(((n - 4) / 2) * Math.log(1 - r * r) - lB);
}

function pmccTest(id: string, tail: 'one' | 'two'): Template {
  return defineTemplate({
    id,
    family: 'sm2.1.pmcc-test',
    title: tail === 'one' ? 'Hypothesis test for correlation (one-tailed)' : 'Hypothesis test for correlation (two-tailed)',
    spec: ['S5.1'],
    chapter: 'SM2.1',
    sections: ['1.3'],
    level: 'A2',
    paper: [3],
    difficulty: 3,
    marks: 4,
    time: 5,
    commands: ['Test'],
    tags: ['hypothesis test', 'correlation', 'PMCC'],
    generate(r) {
      const pr = r.pick(PAIRS);
      const n = r.int(6, 30);
      const alpha = tail === 'one' ? r.pick([0.01, 0.025, 0.05, 0.1]) : r.pick([0.02, 0.05, 0.1]);
      const oneTail = tail === 'one' ? alpha : alpha / 2;
      const cv = pmccCritical(n, oneTail);
      const sign = tail === 'one' ? (pr.pos ? 1 : -1) : r.sign();
      const rv = Number(fmtDP(sign * r.real(0.15, 0.95, 3), 3));
      r.require(Math.abs(Math.abs(rv) - cv) > 0.02);
      const reject = Math.abs(rv) > cv && (tail === 'two' || Math.sign(rv) === sign);
      const dir = tail === 'two' ? 'correlation' : sign > 0 ? 'positive correlation' : 'negative correlation';
      const h1: '>' | '<' | '!=' = tail === 'two' ? '!=' : sign > 0 ? '>' : '<';
      const lvl = pct(alpha);
      const yes = md`There is evidence at the $${lvl}$ level of ${dir} between ${pr.x} and ${pr.y}.`;
      const no = md`There is insufficient evidence at the $${lvl}$ level of ${dir} between ${pr.x} and ${pr.y}.`;
      const cause = md`This shows that changing ${pr.x} causes ${pr.y} to change.`;
      const opts = r.shuffle([yes, no, cause]);
      const H: HypothesisSpec = ans.hyp({
        param: 'rho',
        h0: 0,
        h1,
        stat: { label: 'Critical value', spec: ans.num(cv, { dp: 4 }, { alts: [-cv] }) },
        reject,
        conclusions: opts,
        correctConclusion: opts.indexOf(reject ? yes : no),
        marks: { hyp: 1, stat: 1, decision: 1, conclusion: 1 },
      });
      const h1Tex = h1 === '!=' ? '\\neq' : h1;
      const wrongCv = pmccCritical(n, tail === 'one' ? alpha / 2 : alpha);
      return {
        stem: md`${pr.who} records ${pr.x} and ${pr.y} for a random sample of $${n}$ days or items. The product moment correlation coefficient is $r = ${fmtNum(rv)}$.`,
        parts: [
          part({
            marks: 4,
            prompt: md`Test, at the $${lvl}$ level of significance, whether there is evidence of ${tail === 'two' ? 'correlation' : dir} between ${pr.x} and ${pr.y}. State your hypotheses clearly. (Use the critical value for $n = ${n}$.)`,
            answer: H,
            scheme: [
              B1(md`$\mathrm{H_0} : \rho = 0$, $\mathrm{H_1} : \rho ${h1Tex} 0$`),
              B1(md`Critical value $${tail === 'two' ? '\\pm' : sign < 0 ? '-' : ''}${fmtDP(cv, 4)}$`),
              dM1(md`Compares $${fmtNum(rv)}$ with the critical value and decides: ${reject ? 'reject' : 'do not reject'} $\mathrm{H_0}$`),
              A1('Conclusion in context (no claim of causation)'),
            ],
            hints: [
              md`Hypotheses use $\rho$, the population correlation coefficient, with $\mathrm{H_0} : \rho = 0$.`,
              md`Look up the critical value for $n = ${n}$ at ${tail === 'two' ? md`$${pct(oneTail)}$ in each tail` : md`$${lvl}$ (one tail)`} in the PMCC table (Reference → Tables).`,
              md`The critical value is $${fmtDP(cv, 4)}$. Is $|r| = ${fmtNum(Math.abs(rv))}$ bigger${tail === 'one' ? ' and in the right direction' : ''}?`,
            ],
            errors: [err('wrong-tail-table', ans.num(wrongCv, { dp: 4 }), tail === 'one' ? 'You used the two-tailed column — this test is one-tailed.' : 'You used the one-tailed column — this test is two-tailed, so use half the significance level in each tail.')],
            solution: [
              md`$\mathrm{H_0} : \rho = 0$, $\mathrm{H_1} : \rho ${h1Tex} 0$`,
              md`Critical value ($n = ${n}$, ${tail === 'two' ? `${pct(oneTail)} each tail` : `${lvl} one tail`}): $${fmtDP(cv, 4)}$`,
              md`$|r| = ${fmtNum(Math.abs(rv))} ${Math.abs(rv) > cv ? '>' : '<'} ${fmtDP(cv, 4)}$${tail === 'one' && Math.sign(rv) !== sign ? ' and in the wrong direction' : ''}, so ${reject ? 'reject' : 'do not reject'} $\mathrm{H_0}$.`,
              opts[opts.indexOf(reject ? yes : no)],
            ],
          }),
        ],
        params: { n, oneTail },
      };
    },
    verify(inst) {
      const { n, oneTail } = inst.params as Record<string, number>;
      const cv = (inst.parts[0].answer as HypothesisSpec).stat!.spec.value;
      const f = rDensity(n);
      expectClose(integrate(f, cv, 1 - 1e-12, 1e-12), oneTail, 'tail of r distribution', 1e-6);
    },
  });
}

const testOne = pmccTest('sm2.1.pmcc-test-one-tail', 'one');
const testTwo = pmccTest('sm2.1.pmcc-test-two-tail', 'two');

function logModel(r: Rng) {
  const a = r.real(1.5, 40, 1);
  const b = r.real(1.05, 2.5, 2);
  return { a, b, c: Math.log10(a), m: Math.log10(b) };
}

const expModel = defineTemplate({
  id: 'sm2.1.exponential-model-log',
  family: 'sm2.1.log-models',
  title: 'Exponential model y = abᵗ from a log-linear regression line',
  spec: ['S2.2', 'P6.6'],
  chapter: 'SM2.1',
  sections: ['1.1'],
  level: 'A2',
  paper: [3],
  difficulty: 4,
  marks: 5,
  time: 7,
  commands: ['Find', 'Show that'],
  tags: ['regression', 'logarithms', 'exponential model', 'synoptic'],
  generate(r) {
    const { a, b } = logModel(r);
    const c = Number(fmtDP(Math.log10(a), 4));
    const m = Number(fmtDP(Math.log10(b), 4));
    const A = 10 ** c,
      Bv = 10 ** m;
    const ctx = r.pick([
      { y: 'the number of bacteria, $y$ thousand,', t: '$t$ hours after the start of an experiment' },
      { y: 'the value, $y$ pounds, of a rare coin', t: '$t$ years after it was minted' },
      { y: 'the number of followers, $y$ hundred, of a new online channel', t: '$t$ weeks after launch' },
    ]);
    const Aa = ans.num(A, { sf: 3 }),
      Bb = ans.num(Bv, { sf: 3 });
    return {
      stem: md`It is suggested that ${ctx.y} ${ctx.t} can be modelled by $y = ab^{t}$, where $a$ and $b$ are constants. A regression line of $\log_{10} y$ on $t$ is found to be $\log_{10} y = ${fmtNum(c)} + ${fmtNum(m)}t$.`,
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: md`Find the value of $a$, giving your answer to 3 significant figures.`,
          answer: Aa,
          scheme: [M1(md`Takes logs: $\log_{10} y = \log_{10} a + t\log_{10} b$`), M1(md`$\log_{10} a = ${fmtNum(c)}$`), A1(md`$a = ${answerTex(Aa)}$`)],
          hints: ['Take logs (base 10) of both sides of y = abᵗ.', md`$\log_{10} y = \log_{10} a + t \log_{10} b$ — compare with the regression line.`, md`$a = 10^{${fmtNum(c)}}$`],
          errors: [err('no-antilog', ans.num(c, { sf: 3 }), md`That is $\log_{10} a$. Now find $a = 10^{${fmtNum(c)}}$.`, 2)],
          solution: [md`$\log_{10} y = \log_{10} a + t\log_{10} b$`, md`$\log_{10} a = ${fmtNum(c)} \Rightarrow a = 10^{${fmtNum(c)}} = ${answerTex(Aa)}$`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Find the value of $b$, giving your answer to 3 significant figures.`,
          answer: Bb,
          scheme: [M1(md`$\log_{10} b = ${fmtNum(m)}$`), A1(md`$b = ${answerTex(Bb)}$`)],
          hints: ['The gradient of the line is log b.', md`$\log_{10} b = ${fmtNum(m)}$`, md`$b = 10^{${fmtNum(m)}}$`],
          errors: [err('gradient', ans.num(m, { sf: 3 }), 'That is log₁₀ b — raise 10 to this power.', 1)],
          solution: [md`$\log_{10} b = ${fmtNum(m)} \Rightarrow b = 10^{${fmtNum(m)}} = ${answerTex(Bb)}$`],
        }),
      ],
      params: { c, m },
    };
  },
  verify(inst) {
    const { c, m } = inst.params as Record<string, number>;
    const a = (inst.parts[0].answer as NumericSpec).value,
      b = (inst.parts[1].answer as NumericSpec).value;
    for (const t of [0, 1.5, 4]) expectClose(Math.log10(a * b ** t), c + m * t, 'model matches line', 1e-9);
  },
});

const powerModel = defineTemplate({
  id: 'sm2.1.power-model-log',
  family: 'sm2.1.log-models',
  title: 'Power model y = axⁿ from a log–log regression line',
  spec: ['S2.2', 'P6.6'],
  chapter: 'SM2.1',
  sections: ['1.1'],
  level: 'A2',
  paper: [3],
  difficulty: 4,
  marks: 4,
  time: 6,
  commands: ['Find'],
  tags: ['regression', 'logarithms', 'power model'],
  generate(r) {
    const c = Number(fmtDP(r.real(-0.5, 1.6, 3), 3));
    const n = Number(fmtDP(r.real(0.3, 2.6, 2), 2));
    const ctx = r.pick([
      { y: 'the mass $y$ grams of a seedling', x: 'its height $x$ cm' },
      { y: 'the time $y$ seconds for a pendulum swing', x: 'its length $x$ cm' },
      { y: 'the yield $y$ kg of a crop', x: 'the amount of fertiliser $x$ kg' },
    ]);
    const A = ans.num(10 ** c, { sf: 3 });
    const Nn = ans.num(n, { sf: 3 });
    return {
      stem: md`A model of the form $y = ax^{n}$ is proposed for ${ctx.y} and ${ctx.x}. The regression line of $\log_{10} y$ on $\log_{10} x$ is $\log_{10} y = ${fmtNum(c)} + ${fmtNum(n)}\log_{10} x$.`,
      parts: [
        part({
          label: 'a',
          marks: 1,
          prompt: md`Write down the value of $n$.`,
          answer: Nn,
          scheme: [B1(md`$n = ${fmtNum(n)}$`)],
          hints: ['Take logs of y = axⁿ.', md`$\log y = \log a + n \log x$`, 'n is the gradient of the line.'],
          solution: [md`$\log_{10} y = \log_{10} a + n\log_{10} x$, so $n = ${answerTex(Nn)}$`],
        }),
        part({
          label: 'b',
          marks: 3,
          prompt: md`Find the value of $a$ to 3 significant figures.`,
          answer: A,
          scheme: [M1(md`$\log_{10} a = ${fmtNum(c)}$`), M1(md`$a = 10^{${fmtNum(c)}}$`), A1(md`$a = ${answerTex(A)}$`)],
          hints: ['The intercept is log₁₀ a.', md`$\log_{10} a = ${fmtNum(c)}$`, md`$a = 10^{${fmtNum(c)}}$`],
          errors: [err('no-antilog', ans.num(c, { sf: 3 }), 'That is log₁₀ a; now find a.', 1), err('e-not-10', ans.num(Math.exp(c), { sf: 3 }), 'The logs are base 10, so a = 10^c, not eᶜ.', 2)],
          solution: [md`$a = 10^{${fmtNum(c)}} = ${answerTex(A)}$`],
        }),
      ],
      params: { c, n },
    };
  },
  verify(inst) {
    const { c, n } = inst.params as Record<string, number>;
    const a = (inst.parts[1].answer as NumericSpec).value;
    for (const x of [2, 7.5]) expectClose(Math.log10(a * x ** n), c + n * Math.log10(x), 'power model', 1e-9);
  },
});

const pmccCalc = defineTemplate({
  id: 'sm2.1.pmcc-calculate-interpret',
  family: 'sm2.1.pmcc',
  title: 'Calculate and interpret a PMCC',
  spec: ['S2.2', 'S5.1'],
  chapter: 'SM2.1',
  sections: ['1.2'],
  level: 'A2',
  paper: [3],
  difficulty: 2,
  marks: 3,
  time: 4,
  commands: ['Calculate', 'Interpret'],
  tags: ['correlation', 'PMCC', 'calculator'],
  generate(r) {
    const pr = r.pick(PAIRS);
    const n = r.int(6, 8);
    const slope = (pr.pos ? 1 : -1) * r.real(0.5, 3, 1);
    const xs = r.distinct(n, 2, 30).sort((a, b) => a - b);
    const ys = xs.map((x) => Math.round(20 + slope * x + r.real(-6, 6, 0)));
    const rv = pmcc(xs, ys);
    r.require(Math.abs(rv) > 0.3 && Math.abs(rv) < 0.995 && Math.sign(rv) === (pr.pos ? 1 : -1));
    const R = ans.num(rv, { sf: 3 });
    const strength = Math.abs(rv) >= 0.7 ? 'strong' : Math.abs(rv) >= 0.4 ? 'moderate' : 'weak';
    const sign = rv > 0 ? 'positive' : 'negative';
    const desc = [`strong ${sign}`, `weak ${sign}`, `strong ${rv > 0 ? 'negative' : 'positive'}`, 'no'];
    const C = ans.choice(desc.map((d) => `${d} correlation`), strength === 'strong' ? 0 : 1);
    const table = `| $x$ | ${xs.join(' | ')} |\n|---|${xs.map(() => '---').join('|')}|\n| $y$ | ${ys.join(' | ')} |`;
    return {
      stem: md`${pr.who} records ${pr.x} ($x$) and ${pr.y} ($y$) for $${n}$ cases:\n\n${table}`,
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Use your calculator to find the product moment correlation coefficient between $x$ and $y$.`,
          answer: R,
          scheme: [M1('Enters the data and uses the regression/statistics mode'), A1(md`$r = ${answerTex(R)}$`)],
          hints: ['Use the two-variable statistics mode on your calculator.', 'Enter x and y as paired lists, then read off r.', 'r is between −1 and 1.'],
          solution: [md`From the calculator, $r = ${fmtSF(rv, 6)} = ${answerTex(R)}$ (3 s.f.)`],
        }),
        part({
          label: 'b',
          marks: 1,
          prompt: md`Describe the correlation.`,
          answer: C,
          scheme: [B1(`${strength === 'strong' ? 'Strong' : 'Weak/moderate'} ${sign} correlation`)],
          hints: ['The sign tells you the direction.', 'Values near ±1 are strong; values near 0 are weak.', md`$r = ${fmtSF(rv, 3)}$`],
          solution: [md`$r = ${fmtSF(rv, 3)}$: ${strength === 'strong' ? 'strong' : 'weak'} ${sign} correlation.`],
        }),
      ],
      params: { xs, ys },
    };
  },
  verify(inst) {
    const { xs, ys } = inst.params as { xs: number[]; ys: number[] };
    const n = xs.length;
    const sx = xs.reduce((a, b) => a + b, 0),
      sy = ys.reduce((a, b) => a + b, 0);
    const sxy = xs.reduce((a, x, i) => a + x * ys[i], 0) - (sx * sy) / n;
    const sxx = xs.reduce((a, x) => a + x * x, 0) - (sx * sx) / n;
    const syy = ys.reduce((a, y) => a + y * y, 0) - (sy * sy) / n;
    expectClose((inst.parts[0].answer as NumericSpec).value, sxy / Math.sqrt(sxx * syy), 'r by summary formula', 1e-9);
    expect(Math.abs((inst.parts[0].answer as NumericSpec).value) <= 1, '|r| ⩽ 1');
  },
});

void pTex;
void M1;

const templates: Template[] = [testOne, testTwo, expModel, powerModel, pmccCalc];
export default templates;
