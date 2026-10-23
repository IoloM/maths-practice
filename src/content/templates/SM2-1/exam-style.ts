/** Statistics Year 2, Chapter 1 — long exam-style question: an exponential model from log data, prediction, and a PMCC test. */
import { mean, pmcc, pmccCritical } from '../../../engine/stats/distributions';
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtDP, fmtNum, fmtSF, roundSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { HypothesisSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { pct } from '../shared/stats';

const CONTEXTS = [
  { y: 'the number of bacteria, $y$ thousand,', t: 'hours', tName: 'hour', growth: (b: string) => md`the number of bacteria is multiplied by about $${b}$ each hour` },
  { y: 'the number of followers, $y$ hundred, of a new online channel,', t: 'weeks', tName: 'week', growth: (b: string) => md`the number of followers is multiplied by about $${b}$ each week` },
  { y: 'the value, $y$ pounds, of a collectable toy,', t: 'years', tName: 'year', growth: (b: string) => md`the value is multiplied by about $${b}$ each year` },
];

/** Least-squares line of y on x. */
function regression(xs: number[], ys: number[]) {
  const mx = mean(xs),
    my = mean(ys);
  const sxy = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  const m = sxy / sxx;
  return { c: my - m * mx, m };
}

const logRegression = defineTemplate({
  id: 'sm2.1.long-exponential-model-and-correlation-test',
  family: 'sm2.1.exam-style',
  title: 'Exam-style: exponential model from log data, prediction, reliability and a correlation test',
  spec: ['S2.2', 'S5.1', 'P6.6'],
  chapter: 'SM2.1',
  sections: ['1.1', '1.3'],
  level: 'A2',
  paper: [3],
  difficulty: 4,
  marks: 12,
  time: 15,
  commands: ['Find', 'Explain', 'Test'],
  tags: ['exam-style', 'regression', 'logarithms', 'exponential model', 'hypothesis test', 'PMCC'],
  generate(r) {
    const ctx = r.pick(CONTEXTS);
    const n = r.int(6, 9);
    const a = r.real(2, 30, 1),
      b = r.real(1.15, 1.9, 2);
    const ts = Array.from({ length: n }, (_, i) => i + 1);
    const ys = ts.map((t) => roundSF(a * b ** t * (1 + r.real(-0.08, 0.08, 3)), 3));
    const logs = ys.map((y) => Math.log10(y));
    const fit = regression(ts, logs);
    const c = Number(fmtDP(fit.c, 4)),
      m = Number(fmtDP(fit.m, 4));
    const rv = Number(fmtDP(pmcc(ts, logs), 3));
    const alpha = r.pick([0.01, 0.025, 0.05]);
    const cv = pmccCritical(n, alpha);
    r.require(rv > 0 && Math.abs(rv - cv) > 0.01);
    const reject = rv > cv;
    const A = 10 ** c,
      B = 10 ** m;
    const t1 = n - 1 + 0.5;
    const y1 = 10 ** (c + m * t1);
    const t2 = 4 * n;
    const Aa: NumericSpec = ans.num(A, { sf: 3 }),
      Bb: NumericSpec = ans.num(B, { sf: 3 }),
      Y1: NumericSpec = ans.num(y1, { sf: 3 });
    const lvl = pct(alpha);
    const yes = md`There is evidence at the $${lvl}$ level of positive correlation between $t$ and $\log_{10} y$.`;
    const no = md`There is insufficient evidence at the $${lvl}$ level of positive correlation between $t$ and $\log_{10} y$.`;
    const cause = md`This shows that time causes $y$ to increase.`;
    const opts = r.shuffle([yes, no, cause]);
    const H: HypothesisSpec = ans.hyp({
      param: 'rho',
      h0: 0,
      h1: '>',
      stat: { label: 'Critical value', spec: ans.num(cv, { dp: 4 }) },
      reject,
      conclusions: opts,
      correctConclusion: opts.indexOf(reject ? yes : no),
      marks: { hyp: 1, stat: 1, decision: 1, conclusion: 1 },
    });
    const table = [`| $t$ | ${ts.join(' | ')} |`, `|---|${ts.map(() => '---').join('|')}|`, `| $y$ | ${ys.map((y) => fmtNum(y)).join(' | ')} |`].join('\n');
    return {
      stem: md`It is suggested that ${ctx.y} $t$ ${ctx.t} after the start of a study can be modelled by $y = ab^{t}$, where $a$ and $b$ are constants. The data are:

${table}

The regression line of $\log_{10} y$ on $t$ is $\log_{10} y = ${fmtNum(c)} + ${fmtNum(m)}t$.`,
      parts: [
        part({
          label: 'a',
          marks: 4,
          prompt: md`Use the regression line to find the value of $a$ and the value of $b$, each to 3 significant figures. Enter $a$.`,
          answer: Aa,
          scheme: [M1(md`$\log_{10} y = \log_{10} a + t\log_{10} b$`), A1(md`$a = 10^{${fmtNum(c)}} = ${fmtSF(A, 3)}$`), M1(md`$\log_{10} b = ${fmtNum(m)}$`), A1(md`$b = ${fmtSF(B, 3)}$`)],
          hints: ['Take logs (base 10) of y = abᵗ.', md`$\log_{10} y = \log_{10} a + t\log_{10} b$: compare with the line.`, md`$a = 10^{${fmtNum(c)}}$, $\;b = 10^{${fmtNum(m)}}$`],
          errors: [err('no-antilog', ans.num(c, { sf: 3 }), md`That is $\log_{10} a$: $a = 10^{${fmtNum(c)}}$.`, 1)],
          solution: [md`$\log_{10} a = ${fmtNum(c)} \Rightarrow a = ${answerTex(Aa)}$`, md`$\log_{10} b = ${fmtNum(m)} \Rightarrow b = ${fmtSF(B, 3)}$`],
        }),
        part({
          label: 'b',
          marks: 1,
          prompt: md`Enter the value of $b$ from part (a), and interpret it in context.`,
          answer: Bb,
          scheme: [B1(md`$b = ${fmtSF(B, 3)}$: ${ctx.growth(fmtSF(B, 3))}`)],
          hints: [md`$b = 10^{${fmtNum(m)}}$`, md`Increasing $t$ by 1 multiplies $y$ by $b$.`, `Say what that means for this context.`],
          solution: [md`$b = ${answerTex(Bb)}$: ${ctx.growth(fmtSF(B, 3))} (about $${fmtSF((B - 1) * 100, 2)}\%$ growth per ${ctx.tName}).`],
        }),
        part({
          label: 'c',
          marks: 2,
          prompt: md`Use the model to estimate $y$ when $t = ${fmtNum(t1)}$.`,
          answer: Y1,
          scheme: [M1(md`$10^{${fmtNum(c)} + ${fmtNum(m)} \times ${fmtNum(t1)}}$ or $ab^{${fmtNum(t1)}}$ with their $a$, $b$`), A1(md`awrt $${fmtSF(y1, 3)}$`)],
          hints: [md`Substitute $t = ${fmtNum(t1)}$ into the regression line to get $\log_{10} y$.`, md`$\log_{10} y = ${fmtNum(c)} + ${fmtNum(m)}(${fmtNum(t1)}) = ${fmtDP(c + m * t1, 4)}$`, 'Then y = 10 to that power.'],
          errors: [err('log-value', ans.num(c + m * t1, { sf: 3 }), md`That is $\log_{10} y$: raise 10 to this power.`, 1)],
          solution: [md`$\log_{10} y = ${fmtDP(c + m * t1, 4)} \Rightarrow y = ${answerTex(Y1)}$`],
        }),
        part({
          label: 'd',
          marks: 1,
          prompt: md`Explain why the model may not give a reliable estimate of $y$ when $t = ${t2}$.`,
          answer: ans.self(md`$t = ${t2}$ is well outside the range of the data ($1 \leqslant t \leqslant ${n}$), so this is extrapolation: the trend may not continue.`),
          scheme: [B1('Outside the range of the data (extrapolation)')],
          hints: [md`What values of $t$ were used to build the model?`, md`$t = ${t2}$ compared with the data`, 'The word examiners look for begins with "extra…".'],
          solution: [md`The data cover $1 \leqslant t \leqslant ${n}$; $t = ${t2}$ is extrapolation, so the pattern may not continue.`],
        }),
        part({
          label: 'e',
          marks: 4,
          prompt: md`The product moment correlation coefficient between $t$ and $\log_{10} y$ for these data is $${fmtNum(rv)}$. Test, at the $${lvl}$ level of significance, whether there is positive correlation between $t$ and $\log_{10} y$. State your hypotheses clearly.`,
          answer: H,
          scheme: [B1(md`$\mathrm{H_0}: \rho = 0$, $\mathrm{H_1}: \rho > 0$`), B1(md`Critical value $${fmtDP(cv, 4)}$`), dM1(md`Compares $${fmtNum(rv)}$ with $${fmtDP(cv, 4)}$: ${reject ? 'reject' : 'do not reject'} $\mathrm{H_0}$`), A1('Conclusion in context')],
          hints: [md`$\mathrm{H_0}: \rho = 0$ against $\mathrm{H_1}: \rho > 0$ (one-tailed).`, md`Look up the one-tailed $${lvl}$ critical value for $n = ${n}$ in the PMCC table.`, md`Is $${fmtNum(rv)}$ bigger than $${fmtDP(cv, 4)}$?`],
          errors: [err('two-tailed-column', ans.num(pmccCritical(n, alpha / 2), { dp: 4 }), 'This test is one-tailed: use the one-tailed column.')],
          solution: [md`$\mathrm{H_0}: \rho = 0$, $\;\mathrm{H_1}: \rho > 0$; critical value $${fmtDP(cv, 4)}$ ($n = ${n}$, $${lvl}$)`, md`$${fmtNum(rv)} ${reject ? '>' : '<'} ${fmtDP(cv, 4)}$: ${reject ? 'reject' : 'do not reject'} $\mathrm{H_0}$.`, opts[opts.indexOf(reject ? yes : no)]],
        }),
      ],
      params: { ts, ys, c, m, rv, alpha, n, t1 },
    };
  },
  verify(inst) {
    const { ys, c, m, rv, alpha, n, t1 } = inst.params as { ts: number[]; ys: number[]; c: number; m: number; rv: number; alpha: number; n: number; t1: number };
    const ts = Array.from({ length: n }, (_, i) => i + 1);
    const logs = ys.map((y) => Math.log10(y));
    // slope = r · s_logy / s_t, intercept through the means
    const sd = (xs: number[]) => Math.sqrt(xs.reduce((s, x) => s + (x - mean(xs)) ** 2, 0) / xs.length);
    const slope = pmcc(ts, logs) * (sd(logs) / sd(ts));
    expect(Math.abs(slope - m) < 6e-5, 'regression slope');
    expect(Math.abs(mean(logs) - slope * mean(ts) - c) < 6e-5, 'regression intercept');
    expect(Math.abs(pmcc(ts, logs) - rv) < 6e-4, 'r');
    expectClose((inst.parts[0].answer as NumericSpec).value, 10 ** c, 'a');
    expectClose((inst.parts[1].answer as NumericSpec).value, 10 ** m, 'b');
    expectClose((inst.parts[2].answer as NumericSpec).value, 10 ** c * (10 ** m) ** t1, 'prediction');
    const H = inst.parts[4].answer as HypothesisSpec;
    expect(H.reject === rv > pmccCritical(n, alpha), 'decision');
  },
});

const templates: Template[] = [logRegression];
export default templates;
