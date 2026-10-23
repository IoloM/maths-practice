/** Pure Year 2, Chapter 2 — long exam-style question: f(x) = e^(px) + q and g(x) = ln(x + s) — range, inverse, composite, solving. */
import { Q } from '../../../engine/core/rational';
import { evaluate, neg, num, sym } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, ExprSpec, IntervalSpec, ListSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, iv, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';

const INF = sym('infty');
const F = (n: string) => `\\mathrm{${n}}`;
const xPlus = (s: number) => sumTex([[1, 'x'], [s, '']]);

const expLog = defineTemplate({
  id: 'p2.2.long-exponential-and-log-functions',
  family: 'p2.2.exam-style',
  title: 'Exam-style: exponential and log functions — range, inverse, composite and an equation',
  spec: ['P2.8', 'P6.3', 'P6.5'],
  chapter: 'P2.2',
  sections: ['2.3', '2.4'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 11,
  time: 14,
  commands: ['State', 'Find', 'Solve'],
  tags: ['exam-style', 'composite functions', 'inverse functions', 'domain and range', 'exponentials', 'logarithms'],
  generate(r) {
    const p = r.int(1, 3),
      q = r.intNZ(-6, 6),
      s = r.int(1, 5);
    const w = r.int(2, p === 3 ? 3 : 5);
    const c = w ** p + q; // fg(x) = (x + s)^p + q = c  ⇒  x + s = w
    const pe = p === 1 ? 'x' : `${p}x`;
    const fTex = sumTex([
      [1, `e^{${pe}}`],
      [q, ''],
    ]);
    const gTex = `\\ln(${xPlus(s)})`;
    const R: IntervalSpec = ans.interval([iv(num(Q.of(q)), INF, false, false)], 'y', { aliases: ['f(x)', 'f', 'y'], display: `${F('f')}(x)` });
    const invTex = `${p === 1 ? '' : `\\frac{1}{${p}}`}\\ln(${sumTex([[1, 'x'], [-q, '']])})`;
    const INV: ExprSpec = ans.expr(ex(invTex), ['x'], { domain: { x: [q + 0.5, q + 6] }, label: '\\mathrm{f}^{-1}(x) =' });
    const DINV: IntervalSpec = ans.interval([iv(num(Q.of(q)), INF, false, false)], 'x', { aliases: ['x'] });
    // simplest form: (x + s)^p + q, which for p = 1 collapses to x + (s + q)
    const fgTex = p === 1 ? sumTex([[1, 'x'], [s + q, '']]) : sumTex([[1, `(${xPlus(s)})^{${p}}`], [q, '']]);
    const FG: ExprSpec = ans.expr(ex(fgTex), ['x'], { domain: { x: [-s + 0.3, -s + 4] }, label: '\\mathrm{fg}(x) =' });
    const DFG: IntervalSpec = ans.interval([iv(num(Q.of(-s)), INF, false, false)], 'x');
    const SOL: ListSpec = ans.list([ans.exact(num(Q.of(w - s)))], { v: 'x' });
    const bothRoots = ans.list([ans.exact(num(Q.of(w - s))), ans.exact(num(Q.of(-w - s)))], { v: 'x' });
    return {
      stem: md`The functions $\mathrm{f}$ and $\mathrm{g}$ are defined by $\mathrm{f}(x) = ${fTex}$, $\;x \in \mathbb{R}$, and $\mathrm{g}(x) = ${gTex}$, $\;x > ${-s}$.`,
      parts: [
        part({
          label: 'a',
          marks: 1,
          prompt: md`State the range of $\mathrm{f}$.`,
          answer: R,
          scheme: [B1(md`$\mathrm{f}(x) > ${q}$`)],
          hints: [md`$e^{${pe}} > 0$ for every $x$.`, `Add ${q} to both sides.`, md`The range is a set of values of $\mathrm{f}(x)$, not of $x$.`],
          errors: [err('non-strict', ans.interval([iv(num(Q.of(q)), INF, true, false)], 'y', { aliases: ['f(x)', 'f', 'y'] }), md`$e^{${pe}}$ is never 0, so $\mathrm{f}(x)$ never equals $${q}$: use $>$.`, 0)],
          solution: [md`$e^{${pe}} > 0 \Rightarrow ${answerTex(R)}$`],
        }),
        part({
          label: 'b',
          marks: 3,
          prompt: md`Find $\mathrm{f}^{-1}(x)$.`,
          answer: INV,
          scheme: [M1(md`$y = ${fTex} \Rightarrow e^{${pe}} = y ${q > 0 ? '-' : '+'} ${Math.abs(q)}$`), dM1('Takes ln of both sides and makes x the subject'), A1(md`$\mathrm{f}^{-1}(x) = ${invTex}$`)],
          hints: [md`Write $y = ${fTex}$ and make $x$ the subject.`, md`$e^{${pe}} = ${sumTex([[1, 'y'], [-q, '']])}$`, 'Take natural logs, then swap y for x.'],
          errors: [err('ln-each-term', ans.expr(ex(sumTex([[Q.of(1, p), '\\ln x'], [Q.of(-1, p), `\\ln ${Math.abs(q)}`]])), ['x'], { domain: { x: [Math.abs(q) + 0.5, Math.abs(q) + 6] } }), md`$\ln(a - b)$ is not $\ln a - \ln b$: take ln of the whole bracket.`, 1)],
          solution: [md`$e^{${pe}} = ${sumTex([[1, 'y'], [-q, '']])} \Rightarrow ${pe} = \ln(${sumTex([[1, 'y'], [-q, '']])})$`, md`$${answerTex(INV)}$`],
        }),
        part({
          label: 'c',
          marks: 1,
          prompt: md`State the domain of $\mathrm{f}^{-1}$.`,
          answer: DINV,
          scheme: [B1(md`$x > ${q}$`)],
          hints: [md`The domain of $\mathrm{f}^{-1}$ is the range of $\mathrm{f}$.`, 'Use your answer to (a).', 'Write it in terms of x.'],
          solution: [md`Domain of $\mathrm{f}^{-1}$ = range of $\mathrm{f}$: $${answerTex(DINV)}$`],
        }),
        part({
          label: 'd',
          marks: 2,
          prompt: md`Find $\mathrm{fg}(x)$, giving your answer in its simplest form.`,
          answer: FG,
          scheme: [M1(md`$\mathrm{f}(\ln(${xPlus(s)})) = e^{${p === 1 ? '' : p}\ln(${xPlus(s)})} ${q > 0 ? '+' : '-'} ${Math.abs(q)}$`), A1(md`$${fgTex}$`)],
          hints: [md`$\mathrm{fg}(x) = \mathrm{f}(\mathrm{g}(x))$: put $\mathrm{g}(x)$ into $\mathrm{f}$.`, md`$${p === 1 ? '' : p}\ln(${xPlus(s)}) = \ln\left((${xPlus(s)})^{${p}}\right)$`, md`$e^{\ln u} = u$`],
          errors: [err('gf-instead', ans.expr(ex(`\\ln(${sumTex([[1, `e^{${pe}}`], [q + s, '']])})`), ['x'], { domain: { x: [0.2, 3] } }), md`That is $\mathrm{gf}(x)$. $\mathrm{fg}(x)$ means apply $\mathrm{g}$ first, then $\mathrm{f}$.`, 0)],
          solution: [md`$\mathrm{fg}(x) = e^{${p === 1 ? '' : p}\ln(${xPlus(s)})} ${q > 0 ? '+' : '-'} ${Math.abs(q)}$`, md`$${answerTex(FG)}$`],
        }),
        part({
          label: 'e',
          marks: 1,
          prompt: md`State the domain of $\mathrm{fg}$.`,
          answer: DFG,
          scheme: [B1(md`$x > ${-s}$`)],
          hints: [md`$\mathrm{fg}$ can only take inputs that $\mathrm{g}$ accepts.`, md`The domain of $\mathrm{g}$ is $x > ${-s}$.`, 'f accepts every real number, so nothing else is removed.'],
          errors: [err('all-reals', ans.interval([iv(neg(INF), INF, false, false)], 'x'), 'fg(x) looks defined everywhere, but g only accepts its own domain.', 0)],
          solution: [md`$\mathrm{fg}$ is only defined where $\mathrm{g}$ is: $${answerTex(DFG)}$`],
        }),
        part({
          label: 'f',
          marks: 3,
          prompt: md`Solve the equation $\mathrm{fg}(x) = ${c}$.`,
          answer: SOL,
          scheme: [M1(md`$${fgTex} = ${c}$`), dM1(md`$${p === 1 ? xPlus(s) : `(${xPlus(s)})^{${p}}`} = ${w ** p}$`), A1(md`$x = ${w - s}$ only${p % 2 === 0 ? md`, rejecting $x = ${-w - s}$ (not in the domain)` : ''}`)],
          hints: ['Use your answer to (d).', md`$${p === 1 ? xPlus(s) : `(${xPlus(s)})^{${p}}`} = ${w ** p}$`, p % 2 === 0 ? md`Check each solution against the domain of $\mathrm{fg}$.` : 'Take the root, then subtract.'],
          errors: p % 2 === 0 ? [err('both-roots', bothRoots, md`$x = ${-w - s}$ is not in the domain of $\mathrm{fg}$ ($x > ${-s}$), so reject it.`, 2)] : [],
          solution: [md`$${p === 1 ? xPlus(s) : `(${xPlus(s)})^{${p}}`} = ${w ** p} \Rightarrow ${xPlus(s)} = ${w}${p % 2 === 0 ? md` \text{ (or } ${-w} \text{, rejected since } x > ${-s})` : ''}$`, md`$x = ${w - s}$`],
        }),
      ],
      params: { p, q, s, c },
    };
  },
  verify(inst) {
    const { p, q, s, c } = inst.params as Record<string, number>;
    const f = (x: number) => Math.exp(p * x) + q,
      g = (x: number) => Math.log(x + s);
    const inv = (inst.parts[1].answer as ExprSpec).value;
    for (const x of [q + 0.7, q + 3.1]) expectClose(f(evaluate(inv, { x })), x, 'f(f⁻¹(x)) = x');
    const fg = (inst.parts[3].answer as ExprSpec).value;
    for (const x of [-s + 0.4, -s + 2.5]) expectClose(evaluate(fg, { x }), f(g(x)), 'fg');
    const sol = (inst.parts[5].answer as ListSpec).items.map((it) => evaluate((it as ExactSpec).value));
    expect(sol.length === 1 && sol[0] > -s, 'solution in the domain');
    expectClose(f(g(sol[0])), c, 'solves fg(x) = c');
  },
});

const templates: Template[] = [expLog];
export default templates;
