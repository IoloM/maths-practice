/** Statistics Year 1, Chapter 6 — probability distributions and the binomial distribution. */
import { binomCdf, binomPmf } from '../../../engine/stats/distributions';
import { Q } from '../../../engine/core/rational';
import { num, evaluate } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { binomCdfBeta, binomPmfDirect, d4, pX, pickContext, pTex, N_VALUES, P_VALUES } from '../shared/stats';

const P4 = (v: number, extra: Partial<NumericSpec> = {}) => ans.num(v, { dp: 4 }, extra);
const B = (n: number, p: number) => md`\mathrm{B}(${n}, ${pTex(p)})`;

const exactProb = defineTemplate({
  id: 'sm1.6.binomial-exact',
  family: 'sm1.6.binomial-probabilities',
  title: 'Binomial probability P(X = r)',
  spec: ['S4.1'],
  chapter: 'SM1.6',
  sections: ['6.2'],
  level: 'AS',
  paper: [3],
  difficulty: 1,
  marks: 2,
  time: 3,
  commands: ['Find'],
  tags: ['binomial', 'probability'],
  generate(r) {
    const n = r.pick(N_VALUES);
    const p = r.pick(P_VALUES);
    const x = r.int(Math.max(1, Math.round(n * p) - 3), Math.min(n - 1, Math.round(n * p) + 3));
    const v = binomPmf(n, p, x);
    r.require(v > 0.01);
    const c = pickContext(r);
    const A = P4(v);
    return {
      stem: md`The probability that one of ${c.population} ${c.is} is $${pTex(p)}$, independently of all others. A random sample of $${n}$ ${c.items} is taken. The random variable $X$ is the number of ${c.items} in the sample that ${c.are}.`,
      parts: [
        part({
          marks: 2,
          prompt: md`Find $${pX('=', x)}$.`,
          answer: A,
          scheme: [M1(md`Uses $X \sim ${B(n, p)}$: $\binom{${n}}{${x}}(${pTex(p)})^{${x}}(${pTex(1 - p)})^{${n - x}}$`), A1(md`awrt $${d4(v)}$`)],
          hints: [
            'This is a binomial probability for exactly one value.',
            md`$\mathrm{P}(X = r) = \binom{n}{r}p^{r}(1-p)^{n-r}$, or use the binomial pdf function on your calculator.`,
            md`Here $n = ${n}$, $p = ${pTex(p)}$ and $r = ${x}$.`,
          ],
          errors: [
            err('cumulative', P4(binomCdf(n, p, x)), md`That is $${pX('<=', x)}$ — the question asks for exactly $${x}$ (use the binomial pdf, not cdf).`),
            err('p-q-swapped', P4(binomPmf(n, 1 - p, x)), 'You have used 1 − p as the probability of success.'),
          ],
          solution: [md`$X \sim ${B(n, p)}$`, md`$${pX('=', x)} = \binom{${n}}{${x}}(${pTex(p)})^{${x}}(${pTex(1 - p)})^{${n - x}} = ${answerTex(A)}$`],
        }),
      ],
      params: { n, p, x },
    };
  },
  verify(inst) {
    const { n, p, x } = inst.params as { n: number; p: number; x: number };
    expectClose((inst.parts[0].answer as NumericSpec).value, binomPmfDirect(n, p, x), 'pmf', 1e-9);
  },
});

const cumulative = defineTemplate({
  id: 'sm1.6.binomial-cumulative',
  family: 'sm1.6.binomial-cumulative',
  title: 'Cumulative binomial probabilities: ⩽, <, ⩾, >',
  spec: ['S4.1'],
  chapter: 'SM1.6',
  sections: ['6.3'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 5,
  time: 6,
  commands: ['Find'],
  tags: ['binomial', 'cumulative', 'inequalities'],
  generate(r) {
    const n = r.pick([10, 12, 15, 20, 25, 30, 40, 50]);
    const p = r.pick(P_VALUES);
    const mu = n * p;
    const a = r.int(Math.max(1, Math.floor(mu) - 3), Math.floor(mu) + 1);
    const b = r.int(Math.max(2, Math.floor(mu) - 2), Math.floor(mu) + 3);
    const c = r.int(Math.max(2, Math.floor(mu)), Math.min(n - 1, Math.floor(mu) + 4));
    const va = binomCdf(n, p, a);
    const vb = binomCdf(n, p, b - 1);
    const vc = 1 - binomCdf(n, p, c - 1);
    r.require([va, vb, vc].every((v) => v > 0.005 && v < 0.995));
    const ctx = pickContext(r);
    const Aa = P4(va),
      Ab = P4(vb),
      Ac = P4(vc);
    return {
      stem: md`For ${ctx.population}, the probability that a randomly chosen ${ctx.item} ${ctx.is} is $${pTex(p)}$. A random sample of $${n}$ ${ctx.items} is taken and $X$ is the number that ${ctx.are}.`,
      parts: [
        part({
          label: 'a',
          marks: 1,
          prompt: md`Find $${pX('<=', a)}$.`,
          answer: Aa,
          scheme: [B1(md`awrt $${d4(va)}$`)],
          hints: ['Use the cumulative binomial function on your calculator (or tables).', md`$X \sim ${B(n, p)}$`, md`Binomial cdf with $n = ${n}$, $p = ${pTex(p)}$, upper value $${a}$.`],
          errors: [err('pdf-not-cdf', P4(binomPmf(n, p, a)), md`That is $${pX('=', a)}$; "$\leqslant$" means add up all values from $0$ to $${a}$.`)],
          solution: [md`$X \sim ${B(n, p)}$, so $${pX('<=', a)} = ${answerTex(Aa)}$`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Find $${pX('<', b)}$.`,
          answer: Ab,
          scheme: [M1(md`Writes $${pX('<', b)} = ${pX('<=', b - 1)}$`), A1(md`awrt $${d4(vb)}$`)],
          hints: [md`For whole numbers, "$< ${b}$" is the same as "$\leqslant ${b - 1}$".`, md`Rewrite as $${pX('<=', b - 1)}$ then use the cumulative function.`, md`$${pX('<', b)} = ${pX('<=', b - 1)}$`],
          errors: [err('lt-as-le', P4(binomCdf(n, p, b)), md`You found $${pX('<=', b)}$. "Less than $${b}$" does not include $${b}$: use $${pX('<=', b - 1)}$.`, 0)],
          solution: [md`$${pX('<', b)} = ${pX('<=', b - 1)} = ${answerTex(Ab)}$`],
        }),
        part({
          label: 'c',
          marks: 2,
          prompt: md`Find $${pX('>=', c)}$.`,
          answer: Ac,
          scheme: [M1(md`Uses $1 - ${pX('<=', c - 1)}$`), A1(md`awrt $${d4(vc)}$`)],
          hints: [
            md`Use the complement: $${pX('>=', c)} = 1 - ${pX('<', c)}$.`,
            md`$${pX('<', c)} = ${pX('<=', c - 1)}$.`,
            md`So $${pX('>=', c)} = 1 - ${pX('<=', c - 1)}$.`,
          ],
          errors: [
            err('complement-off-by-one', P4(1 - binomCdf(n, p, c)), md`You calculated $1 - ${pX('<=', c)}$, which is $${pX('>', c)}$. "At least $${c}$" includes $${c}$, so use $1 - ${pX('<=', c - 1)}$.`, 1),
            err('cdf-not-complement', P4(binomCdf(n, p, c)), md`That is $${pX('<=', c)}$ — you need the probability of $${c}$ or more.`),
          ],
          solution: [md`$${pX('>=', c)} = 1 - ${pX('<=', c - 1)} = 1 - ${d4(binomCdf(n, p, c - 1))} = ${answerTex(Ac)}$`],
        }),
      ],
      params: { n, p, a, b, c },
    };
  },
  verify(inst) {
    const { n, p, a, b, c } = inst.params as Record<string, number>;
    const v = inst.parts.map((pt) => (pt.answer as NumericSpec).value);
    expectClose(v[0], binomCdfBeta(n, p, a), 'P(X<=a)', 1e-9);
    expectClose(v[1], binomCdfBeta(n, p, b - 1), 'P(X<b)', 1e-9);
    expectClose(v[2], 1 - binomCdfBeta(n, p, c - 1), 'P(X>=c)', 1e-9);
  },
});

const between = defineTemplate({
  id: 'sm1.6.binomial-between',
  family: 'sm1.6.binomial-cumulative',
  title: 'Binomial probability between two values',
  spec: ['S4.1'],
  chapter: 'SM1.6',
  sections: ['6.3'],
  level: 'AS',
  paper: [3],
  difficulty: 3,
  marks: 3,
  time: 4,
  commands: ['Find'],
  tags: ['binomial', 'cumulative', 'inequalities'],
  generate(r) {
    const n = r.pick([12, 15, 20, 25, 30, 40, 50]);
    const p = r.pick(P_VALUES);
    const mu = n * p;
    const lo = r.int(Math.max(0, Math.floor(mu) - 4), Math.floor(mu));
    const hi = r.int(lo + 2, Math.min(n, lo + 6));
    const [opL, opR] = r.pick([
      ['<', '<='],
      ['<=', '<'],
      ['<=', '<='],
      ['<', '<'],
    ] as const);
    const from = opL === '<' ? lo + 1 : lo;
    const to = opR === '<' ? hi - 1 : hi;
    r.require(to >= from);
    const v = binomCdf(n, p, to) - binomCdf(n, p, from - 1);
    r.require(v > 0.02 && v < 0.98);
    const ctx = pickContext(r);
    const A = P4(v);
    const opT = (o: string) => (o === '<' ? '<' : '\\leqslant');
    const naive = binomCdf(n, p, hi) - binomCdf(n, p, lo);
    const errs = Math.abs(naive - v) > 1e-4 ? [err('endpoints', P4(naive), md`Check your end points: you need the values $${from}$ to $${to}$ inclusive, i.e. $${pX('<=', to)} - ${pX('<=', from - 1)}$.`, 1)] : [];
    return {
      stem: md`The random variable $X \sim ${B(n, p)}$ models the number of ${ctx.noun} in a sample of $${n}$ ${ctx.items}.`,
      parts: [
        part({
          marks: 3,
          prompt: md`Find $\mathrm{P}(${lo} ${opT(opL)} X ${opT(opR)} ${hi})$.`,
          answer: A,
          scheme: [M1(md`Writes as $${pX('<=', to)} - ${pX('<=', from - 1)}$`), dM1('Uses the cumulative binomial correctly'), A1(md`awrt $${d4(v)}$`)],
          hints: [
            md`List the whole-number values of $X$ included: from $${from}$ to $${to}$.`,
            md`$\mathrm{P}(${from} \leqslant X \leqslant ${to}) = ${pX('<=', to)} - ${pX('<=', from - 1)}$.`,
            md`$${pX('<=', to)} = ${d4(binomCdf(n, p, to))}$`,
          ],
          errors: errs,
          solution: [
            md`The values included are $X = ${from}, \dots, ${to}$.`,
            md`$${pX('<=', to)} - ${pX('<=', from - 1)} = ${d4(binomCdf(n, p, to))} - ${d4(binomCdf(n, p, from - 1))} = ${answerTex(A)}$`,
          ],
        }),
      ],
      params: { n, p, from, to },
    };
  },
  verify(inst) {
    const { n, p, from, to } = inst.params as Record<string, number>;
    let s = 0;
    for (let k = from; k <= to; k++) s += binomPmfDirect(n, p, k);
    expectClose((inst.parts[0].answer as NumericSpec).value, s, 'sum of pmf', 1e-9);
  },
});

const modelContext = defineTemplate({
  id: 'sm1.6.binomial-model-context',
  family: 'sm1.6.binomial-model',
  title: 'Choose a binomial model and use it',
  spec: ['S4.1', 'S4.3'],
  chapter: 'SM1.6',
  sections: ['6.2', '6.3'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 6,
  time: 7,
  commands: ['Write down', 'Find'],
  tags: ['binomial', 'modelling', 'context'],
  generate(r) {
    const n = r.pick([15, 20, 25, 30]);
    const pct = r.pick([5, 10, 15, 20, 25, 30, 35, 40]);
    const p = pct / 100;
    const ctx = pickContext(r);
    const atMost = r.int(Math.max(1, Math.floor(n * p) - 2), Math.floor(n * p) + 1);
    const moreThan = r.int(Math.floor(n * p), Math.floor(n * p) + 3);
    const va = binomCdf(n, p, atMost);
    const vb = 1 - binomCdf(n, p, moreThan);
    r.require(va > 0.02 && va < 0.98 && vb > 0.005 && vb < 0.95);
    const options = [md`$X \sim ${B(n, p)}$`, md`$X \sim \mathrm{B}(${pTex(p)}, ${n})$`, md`$X \sim ${B(n, 1 - p)}$`, md`$X \sim \mathrm{B}(${n}, ${pct})$`];
    const order = r.shuffle([0, 1, 2, 3]);
    const C = ans.choice(order.map((i) => options[i]), order.indexOf(0));
    const Aa = P4(va),
      Ab = P4(vb);
    return {
      stem: md`It is known that $${pct}\%$ of ${ctx.population} ${ctx.are}. A random sample of $${n}$ ${ctx.items} is taken. $X$ is the number of ${ctx.items} in the sample that ${ctx.are}.`,
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Write down a suitable distribution to model $X$.`,
          answer: C,
          scheme: [B1('Binomial'), B1(md`Correct parameters $n = ${n}$, $p = ${pTex(p)}$`)],
          hints: ['There is a fixed number of independent trials, each with two outcomes.', 'Binomial: B(n, p) with n = number of trials, p = probability of success.', md`$n = ${n}$; $p$ is the proportion as a decimal.`],
          solution: [md`$X \sim ${B(n, p)}$ (binomial: fixed $n$, independent ${ctx.items}, constant probability $${pTex(p)}$).`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Find the probability that at most $${atMost}$ of the ${ctx.items} ${ctx.are}.`,
          answer: Aa,
          scheme: [M1(md`$${pX('<=', atMost)}$`), A1(md`awrt $${d4(va)}$`)],
          hints: ['"At most" means "less than or equal to".', md`Find $${pX('<=', atMost)}$.`, md`Use the cumulative binomial with $n = ${n}$, $p = ${pTex(p)}$.`],
          errors: [err('lt', P4(binomCdf(n, p, atMost - 1)), md`"At most $${atMost}$" includes $${atMost}$: use $${pX('<=', atMost)}$.`, 1)],
          solution: [md`$${pX('<=', atMost)} = ${answerTex(Aa)}$`],
        }),
        part({
          label: 'c',
          marks: 2,
          prompt: md`Find the probability that more than $${moreThan}$ of the ${ctx.items} ${ctx.are}.`,
          answer: Ab,
          scheme: [M1(md`$1 - ${pX('<=', moreThan)}$`), A1(md`awrt $${d4(vb)}$`)],
          hints: ['"More than" does not include the number itself.', md`$${pX('>', moreThan)} = 1 - ${pX('<=', moreThan)}$`, md`$${pX('<=', moreThan)} = ${d4(binomCdf(n, p, moreThan))}$`],
          errors: [err('ge', P4(1 - binomCdf(n, p, moreThan - 1)), md`You found $${pX('>=', moreThan)}$; "more than $${moreThan}$" starts at $${moreThan + 1}$.`, 1)],
          solution: [md`$${pX('>', moreThan)} = 1 - ${pX('<=', moreThan)} = 1 - ${d4(binomCdf(n, p, moreThan))} = ${answerTex(Ab)}$`],
        }),
      ],
      params: { n, p, atMost, moreThan },
    };
  },
  verify(inst) {
    const { n, p, atMost, moreThan } = inst.params as Record<string, number>;
    expectClose((inst.parts[1].answer as NumericSpec).value, binomCdfBeta(n, p, atMost), 'at most', 1e-9);
    expectClose((inst.parts[2].answer as NumericSpec).value, 1 - binomCdfBeta(n, p, moreThan), 'more than', 1e-9);
  },
});

const findN = defineTemplate({
  id: 'sm1.6.binomial-find-n',
  family: 'sm1.6.binomial-model',
  title: 'Smallest sample size for at least one success',
  spec: ['S4.1', 'P6.5'],
  chapter: 'SM1.6',
  sections: ['6.3'],
  level: 'AS',
  paper: [3],
  difficulty: 4,
  marks: 4,
  time: 6,
  commands: ['Find'],
  tags: ['binomial', 'logarithms', 'synoptic'],
  generate(r) {
    const p = r.pick([0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1, 0.12, 0.15]);
    const q = r.pick([0.5, 0.6, 0.75, 0.8, 0.9, 0.95, 0.99]);
    const exact = Math.log(1 - q) / Math.log(1 - p);
    r.require(Math.abs(exact - Math.round(exact)) > 0.02);
    const n = Math.ceil(exact);
    const ctx = pickContext(r);
    const L = ans.list([ans.exact(num(n))], { v: 'n' });
    return {
      stem: md`The probability that a randomly chosen ${ctx.item} from ${ctx.population} ${ctx.is} is $${pTex(p)}$, independently of other ${ctx.items}.`,
      parts: [
        part({
          marks: 4,
          prompt: md`Find the smallest number of ${ctx.items} that must be chosen so that the probability that at least one of them ${ctx.is} is greater than $${pTex(q)}$.`,
          answer: L,
          scheme: [
            M1(md`$1 - (${pTex(1 - p)})^{n} > ${pTex(q)}$`),
            M1(md`Uses logarithms (or trial): $n > \dfrac{\ln ${pTex(1 - q)}}{\ln ${pTex(1 - p)}}$`),
            A1(md`$n > ${exact.toFixed(2)}$`),
            A1(md`$${answerTex(L)}$`),
          ],
          hints: [
            md`$\mathrm{P}(\text{at least one}) = 1 - \mathrm{P}(\text{none})$.`,
            md`$\mathrm{P}(\text{none}) = (1 - p)^{n}$. Set up an inequality and solve it with logarithms.`,
            md`$(${pTex(1 - p)})^{n} < ${pTex(1 - q)}$. Remember that dividing by $\ln ${pTex(1 - p)} < 0$ reverses the inequality.`,
          ],
          errors: [err('rounded-down', ans.list([ans.exact(num(n - 1))], { v: 'n' }), md`$n$ must be the next whole number above $${exact.toFixed(2)}$ — rounding down does not meet the condition.`, 3)],
          solution: [
            md`$\mathrm{P}(\text{at least one}) = 1 - (${pTex(1 - p)})^{n} > ${pTex(q)}$`,
            md`$(${pTex(1 - p)})^{n} < ${pTex(1 - q)} \Rightarrow n > \dfrac{\ln ${pTex(1 - q)}}{\ln ${pTex(1 - p)}} = ${exact.toFixed(2)}$`,
            md`So $${answerTex(L)}$.`,
          ],
        }),
      ],
      params: { p, q, n },
    };
  },
  verify(inst) {
    const { p, q, n } = inst.params as Record<string, number>;
    expect(1 - (1 - p) ** n > q, 'n works');
    expect(1 - (1 - p) ** (n - 1) <= q, 'n − 1 fails');
  },
});

const twoStage = defineTemplate({
  id: 'sm1.6.binomial-two-stage',
  family: 'sm1.6.binomial-model',
  title: 'Two-stage binomial probability',
  spec: ['S4.1'],
  chapter: 'SM1.6',
  sections: ['6.3'],
  level: 'AS',
  paper: [3],
  difficulty: 4,
  marks: 5,
  time: 7,
  commands: ['Find'],
  tags: ['binomial', 'multi-step'],
  generate(r) {
    const n = r.pick([10, 12, 15, 20]);
    const p = r.pick([0.2, 0.25, 0.3, 0.35, 0.4]);
    const k = r.int(Math.ceil(n * p), Math.ceil(n * p) + 2);
    const days = r.pick([4, 5, 6, 7]);
    const m = r.int(1, days - 1);
    const q = 1 - binomCdf(n, p, k - 1);
    r.require(q > 0.05 && q < 0.8);
    const v = binomPmf(days, q, m);
    const ctx = pickContext(r);
    const Aa = P4(q);
    const Ab = ans.num(v, { sf: 3 }, { alts: [binomPmf(days, Math.round(q * 1e4) / 1e4, m)] });
    return {
      stem: md`Each day, a random sample of $${n}$ ${ctx.items} is taken from ${ctx.population}. The probability that a ${ctx.item} ${ctx.is} is $${pTex(p)}$, independently. A day is described as *high* if at least $${k}$ of the ${ctx.items} in that day's sample ${ctx.are}.`,
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Find the probability that a given day is high.`,
          answer: Aa,
          scheme: [M1(md`$1 - ${pX('<=', k - 1)}$ with $X \sim ${B(n, p)}$`), A1(md`awrt $${d4(q)}$`)],
          hints: ['Let X be the number in one day’s sample. What distribution does X have?', md`High means $X \geqslant ${k}$.`, md`$${pX('>=', k)} = 1 - ${pX('<=', k - 1)}$`],
          errors: [err('off-by-one', P4(1 - binomCdf(n, p, k)), md`At least $${k}$ includes $${k}$: use $1 - ${pX('<=', k - 1)}$.`, 1)],
          solution: [md`$X \sim ${B(n, p)}$: $${pX('>=', k)} = 1 - ${pX('<=', k - 1)} = ${answerTex(Aa)}$`],
        }),
        part({
          label: 'b',
          marks: 3,
          prompt: md`Find the probability that exactly $${m}$ of the next $${days}$ days are high.`,
          answer: Ab,
          ft: (prev) => {
            const a = prev.a?.value;
            return a !== undefined && a > 0 && a < 1 ? ans.num(binomPmf(days, a, m), { sf: 3 }) : null;
          },
          scheme: [M1(md`$Y \sim \mathrm{B}(${days}, \text{their (a)})$`), M1(md`$\binom{${days}}{${m}}q^{${m}}(1-q)^{${days - m}}$`), A1(md`awrt $${answerTex(Ab)}$`)],
          hints: [
            'Now each day is a trial: it is either high or not.',
            md`Let $Y$ be the number of high days: $Y \sim \mathrm{B}(${days}, q)$ with $q$ from part (a).`,
            md`$\mathrm{P}(Y = ${m}) = \binom{${days}}{${m}}q^{${m}}(1-q)^{${days - m}}$`,
          ],
          solution: [md`$Y \sim \mathrm{B}(${days}, ${d4(q)})$`, md`$\mathrm{P}(Y = ${m}) = \binom{${days}}{${m}}(${d4(q)})^{${m}}(${d4(1 - q)})^{${days - m}} = ${answerTex(Ab)}$`],
        }),
      ],
      params: { n, p, k, days, m },
    };
  },
  verify(inst) {
    const { n, p, k, days, m } = inst.params as Record<string, number>;
    const q = 1 - binomCdfBeta(n, p, k - 1);
    expectClose((inst.parts[0].answer as NumericSpec).value, q, 'high day', 1e-9);
    expectClose((inst.parts[1].answer as NumericSpec).value, binomPmfDirect(days, q, m), 'two stage', 1e-9);
  },
});

const discreteTable = defineTemplate({
  id: 'sm1.6.discrete-distribution-k',
  family: 'sm1.6.discrete',
  title: 'Discrete probability distribution with an unknown constant',
  spec: ['S4.1'],
  chapter: 'SM1.6',
  sections: ['6.1'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Show that', 'Find'],
  tags: ['discrete distribution', 'probability'],
  generate(r) {
    const form = r.pick(['kx', 'k(x+c)', 'kx^2'] as const);
    const c = r.int(1, 3);
    const top = r.int(3, 5);
    const xs = Array.from({ length: top }, (_, i) => i + 1);
    const w = xs.map((x) => (form === 'kx' ? x : form === 'kx^2' ? x * x : x + c));
    const total = w.reduce((s, x) => s + x, 0);
    const k = Q.of(1, total);
    const thr = r.int(2, top);
    const pv = Q.of(w.filter((_, i) => xs[i] >= thr).reduce((s, x) => s + x, 0), total);
    const fTex = form === 'kx' ? 'kx' : form === 'kx^2' ? 'kx^{2}' : `k(x + ${c})`;
    const K: ExactSpec = ans.exact(num(k), ['exact']);
    const Pv: ExactSpec = ans.exact(num(pv), ['exact']);
    return {
      stem: md`The discrete random variable $X$ has probability distribution $\mathrm{P}(X = x) = ${fTex}$ for $x = ${xs.join(', ')}$, where $k$ is a constant.`,
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Find the exact value of $k$.`,
          answer: K,
          scheme: [M1(md`Sets the sum of the probabilities equal to 1: $${w.join('k + ')}k = 1$`), A1(md`$k = ${k.toLatex()}$`)],
          hints: ['All probabilities in a distribution add up to 1.', md`Write $\mathrm{P}(X = x)$ for each $x$ in terms of $k$, then add them.`, md`$${w.map((v) => `${v}k`).join(' + ')} = 1$`],
          errors: [err('decimal', ans.num(k.value, { sf: 3 }), 'Give the exact value as a fraction.', 1)],
          solution: [md`$${w.map((v) => `${v}k`).join(' + ')} = ${total}k = 1$, so $k = ${answerTex(K)}$`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Find $${pX('>=', thr)}$, giving your answer as a fraction.`,
          answer: Pv,
          scheme: [M1(md`Adds the probabilities for $x \geqslant ${thr}$`), A1(md`$${pv.toLatex()}$`)],
          hints: [md`Which values of $x$ satisfy $x \geqslant ${thr}$?`, md`Add $\mathrm{P}(X = x)$ for $x = ${xs.filter((x) => x >= thr).join(', ')}$.`, md`Each probability is $${fTex}$ with $k = ${k.toLatex()}$.`],
          solution: [
            md`$${pX('>=', thr)} = ${xs
              .filter((x) => x >= thr)
              .map((x) => `\\frac{${w[x - 1]}}{${total}}`)
              .join(' + ')} = ${answerTex(Pv)}$`,
          ],
        }),
      ],
      params: { w, thr },
    };
  },
  verify(inst) {
    const { w, thr } = inst.params as { w: number[]; thr: number };
    const k = evaluate((inst.parts[0].answer as ExactSpec).value);
    expectClose(w.reduce((s, x) => s + x * k, 0), 1, 'sum to 1');
    expectClose(evaluate((inst.parts[1].answer as ExactSpec).value), w.slice(thr - 1).reduce((s, x) => s + x * k, 0), 'tail');
  },
});

const conditions = defineTemplate({
  id: 'sm1.6.binomial-conditions',
  family: 'sm1.6.binomial-model',
  title: 'Conditions for a binomial model',
  spec: ['S4.3', 'S4.1'],
  chapter: 'SM1.6',
  sections: ['6.2'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 2,
  time: 2,
  commands: ['State'],
  tags: ['binomial', 'modelling', 'assumptions'],
  generate(r) {
    const ctx = pickContext(r);
    const n = r.pick(N_VALUES);
    const good = [
      md`The ${ctx.items} are independent of each other.`,
      md`The probability that a ${ctx.item} ${ctx.is} is the same for every ${ctx.item}.`,
      md`There is a fixed number ($${n}$) of ${ctx.items} in the sample.`,
      md`Each ${ctx.item} either ${ctx.is} or does not (two outcomes).`,
    ];
    const bad = [
      md`The number of ${ctx.items} that ${ctx.are} must be at least $${Math.ceil(n / 2)}$.`,
      md`The probability that a ${ctx.item} ${ctx.is} must be $0.5$.`,
      md`The sample must contain every ${ctx.item} in the population.`,
      md`The mean number of ${ctx.items} that ${ctx.are} must be a whole number.`,
    ];
    const pickedGood = r.sample(good, 2);
    const pickedBad = r.sample(bad, 3);
    const opts = r.shuffle([...pickedGood, ...pickedBad]);
    const C = ans.choice(
      opts,
      pickedGood.map((g) => opts.indexOf(g)),
      { multi: true },
    );
    return {
      stem: md`A random sample of $${n}$ ${ctx.items} is taken from ${ctx.population} and $X$, the number that ${ctx.are}, is modelled by a binomial distribution.`,
      parts: [
        part({
          marks: 2,
          prompt: md`Select **two** assumptions needed for the binomial model to be suitable.`,
          answer: C,
          scheme: [B1('One correct condition in context'), B1('A second correct condition in context')],
          hints: ['Think about the four conditions for a binomial distribution.', 'Fixed number of trials; two outcomes; independent trials; constant probability.', 'Two of the options state these conditions.'],
          solution: ['A binomial model needs a fixed number of trials, each with two outcomes, independent trials and a constant probability of success.', ...pickedGood.map((g) => `- ${g}`)],
        }),
      ],
      params: {},
    };
  },
  verify(inst) {
    const c = inst.parts[0].answer;
    expect(c.type === 'choice' && c.correct.length === 2, 'two correct options');
  },
});

const templates: Template[] = [exactProb, cumulative, between, modelContext, findN, twoStage, discreteTable, conditions];
export default templates;
