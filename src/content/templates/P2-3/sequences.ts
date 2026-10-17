/** Pure Year 2, Chapter 3 — sequences, recurrence relations and sigma notation (3.6–3.7). */
import { Q } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, ExactSpec, ExprSpec, ListSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, md, part, sgn } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';

const exq = (q: Q | number) => num(Q.from(q));
const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
const sigma = (lo: number | string, hi: number | string, body: string) => `\\sum_{r=${lo}}^{${hi}} ${body}`;

// ---------------------------------------------------------------- 3.7 nth term and monotonicity
const nthTerm = defineTemplate({
  id: 'p2.3.nth-term-quadratic-sequence',
  family: 'p2.3.sequences',
  title: 'Terms of a sequence given by a formula; increasing or decreasing',
  spec: ['P4.2'],
  chapter: 'P2.3',
  sections: ['3.7'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 2,
  marks: 6,
  time: 6,
  commands: ['Find', 'Determine'],
  tags: ['sequences', 'nth term', 'increasing', 'decreasing'],
  generate(r) {
    const p = r.pick([1, 2, 3]),
      q = r.int(-12, 10),
      c = r.int(-10, 10);
    r.require(3 * p + q !== 0);
    const u = (n: number) => p * n * n + q * n + c;
    const uTex = sumTex([[p, 'n^{2}'], [q, 'n'], [c, '']]);
    const k = r.int(3, 8);
    const m = r.int(k + 2, 16);
    const other = -q / p - m;
    r.require(!(other > 0 && Number.isInteger(other)));
    const V = u(m);
    const inc = 3 * p + q > 0;
    const opts = ['Increasing', 'Decreasing', 'Neither increasing nor decreasing'];
    const C: ChoiceSpec = ans.choice(opts, inc ? 0 : 2);
    const Uk = ans.exact(exq(u(k))),
      M = ans.exact(exq(m));
    return {
      stem: md`A sequence is defined by $u_{n} = ${uTex}$, $n \geqslant 1$.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find $u_{${k}}$.`, answer: Uk, scheme: [B1(md`$${u(k)}$`)], hints: [md`Substitute $n = ${k}$.`, md`$${p === 1 ? '' : p}(${k})^{2} ${q < 0 ? '-' : '+'} ${Math.abs(q)}(${k}) ${c < 0 ? '-' : '+'} ${Math.abs(c)}$`, 'Work it out carefully.'], solution: [md`$u_{${k}} = ${answerTex(Uk)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Given that $u_{m} = ${V}$, find the value of $m$.`, answer: M, scheme: [M1(md`$${uTex.replace(/n/g, 'm')} = ${V}$`), dM1('Solves the quadratic'), A1(md`$m = ${m}$ only`)], hints: [md`Set $${uTex.replace(/n/g, 'm')} = ${V}$.`, 'Rearrange to a quadratic equal to zero and solve.', 'm must be a positive integer — reject any other solution.'], solution: [md`$${p === 1 ? '' : p}m^{2}${q === 0 ? '' : sgn(q, 'm')}${c - V === 0 ? '' : sgn(c - V)} = 0$`, md`$m = ${m}$ or $m = ${Q.from(other).toLatex()}$; since $m$ is a positive integer, $m = ${answerTex(M)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Determine whether the sequence is increasing, decreasing or neither.`, answer: C, scheme: [M1(md`$u_{n+1} - u_{n} = ${sumTex([[2 * p, 'n'], [p + q, '']])}$`), A1('Correct conclusion with reason')], hints: [md`Consider $u_{n+1} - u_{n}$.`, md`$u_{n+1} - u_{n} = ${sumTex([[2 * p, 'n'], [p + q, '']])}$`, 'Is it positive for every n ≥ 1?'], solution: [md`$u_{n+1} - u_{n} = ${sumTex([[2 * p, 'n'], [p + q, '']])}$, which is ${inc ? 'positive for all $n \\geqslant 1$' : `negative when $n = 1$ but positive for large $n$`}.`, `So the sequence is ${opts[inc ? 0 : 2].toLowerCase()}.`] }),
      ],
      params: { p, q, c, k, m, V },
    };
  },
  verify(inst) {
    const { p, q, c, k, m, V } = inst.params as Record<string, number>;
    const u = (n: number) => p * n * n + q * n + c;
    expect(valOf(inst.parts[0].answer as ExactSpec) === u(k), 'u_k');
    expect(u(valOf(inst.parts[1].answer as ExactSpec)) === V && m > 0, 'u_m');
    let up = true,
      down = true;
    for (let n = 1; n < 60; n++) {
      if (u(n + 1) <= u(n)) up = false;
      if (u(n + 1) >= u(n)) down = false;
    }
    const want = up ? 0 : down ? 1 : 2;
    expect((inst.parts[2].answer as ChoiceSpec).correct[0] === want, 'monotonicity');
  },
});

// ---------------------------------------------------------------- 3.7 recurrence relations
const recurrence = defineTemplate({
  id: 'p2.3.recurrence-unknown-constant',
  family: 'p2.3.recurrence',
  title: 'Recurrence relation u_{n+1} = ku_n + c with an unknown k',
  spec: ['P4.2'],
  chapter: 'P2.3',
  sections: ['3.7'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 7,
  time: 8,
  commands: ['Find', 'Show that'],
  tags: ['sequences', 'recurrence relations', 'quadratic'],
  generate(r) {
    const a = r.intNZ(-4, 6),
      c = r.intNZ(-8, 8),
      k1 = r.int(2, 5);
    const k2 = Q.of(-c, a).sub(k1);
    r.require(!k2.eq(k1) && !(k2.d === 1 && k2.value > 0) && k2.d <= 6);
    const V = Q.of(c).sub(k2.mul(a * k1));
    const U3 = ans.expr(ex(sumTex([[a, 'k^{2}'], [c, 'k'], [c, '']])), ['k']);
    const L = ans.list([ans.exact(exq(k1)), ans.exact(exq(k2))], { v: 'k' });
    const u3 = a * k1 * k1 + c * k1 + c;
    const U4 = ans.exact(exq(k1 * u3 + c));
    return {
      stem: md`A sequence is defined by $u_{1} = ${a}$, $u_{n+1} = ku_{n}${sgn(c)}$, where $k$ is a constant.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find an expression for $u_{3}$ in terms of $k$, simplifying your answer.`, answer: U3, scheme: [M1(md`$u_{2} = ${a === 1 ? '' : a === -1 ? '-' : a}k${sgn(c)}$`), A1(md`$u_{3} = ${sumTex([[a, 'k^{2}'], [c, 'k'], [c, '']])}$`)], hints: [md`$u_{2} = k \times ${a}${sgn(c)}$`, md`$u_{3} = k \times u_{2}${sgn(c)}$`, 'Expand and collect terms.'], solution: [md`$u_{2} = ${a === 1 ? '' : a === -1 ? '-' : a}k${sgn(c)}$`, md`$u_{3} = k(${a === 1 ? '' : a === -1 ? '-' : a}k${sgn(c)})${sgn(c)} = ${answerTex(U3)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Given that $u_{3} = ${V.toLatex()}$, find the possible values of $k$.`, answer: L, scheme: [M1(md`$${sumTex([[a, 'k^{2}'], [c, 'k'], [c, '']])} = ${V.toLatex()}$`), dM1('Rearranges and solves the quadratic'), A1(md`$${answerTex(L)}$`)], hints: ['Set your expression equal to the given value.', 'Rearrange so the quadratic equals zero.', 'Factorise or use the formula — there are two values.'], solution: [md`$${sumTex([[a, 'k^{2}'], [c, 'k'], [Q.of(c).sub(V), '']])} = 0$`, md`$${answerTex(L)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Given also that $k$ is a positive integer, find $u_{4}$.`, answer: U4, scheme: [M1(md`Uses $k = ${k1}$ and $u_{4} = ${k1}u_{3}${sgn(c)}$`), A1(md`$${k1 * u3 + c}$`)], hints: [md`Choose the value of $k$ that is a positive integer.`, md`$u_{3} = ${u3}$ when $k = ${k1}$.`, md`$u_{4} = k u_{3}${sgn(c)}$`], solution: [md`$k = ${k1}$: $u_{4} = ${k1} \times ${u3}${sgn(c)} = ${answerTex(U4)}$`] }),
      ],
      params: { a, c, k1, V: V.value },
    };
  },
  verify(inst) {
    const { a, c, k1, V } = inst.params as Record<string, number>;
    const seq = (k: number, n: number) => {
      let u = a;
      for (let i = 1; i < n; i++) u = k * u + c;
      return u;
    };
    for (const k of (inst.parts[1].answer as ListSpec).items.map(valOf)) expectClose(seq(k, 3), V, 'u3 = V');
    expectClose(evaluate((inst.parts[0].answer as ExprSpec).value, { k: 1.7 }), seq(1.7, 3), 'u3 expression');
    expectClose(valOf(inst.parts[2].answer as ExactSpec), seq(k1, 4), 'u4');
  },
});

const periodic = defineTemplate({
  id: 'p2.3.periodic-sequence',
  family: 'p2.3.recurrence',
  title: 'A periodic sequence: identify the order and sum many terms',
  spec: ['P4.2', 'P4.3'],
  chapter: 'P2.3',
  sections: ['3.6', '3.7'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find', 'Write down'],
  tags: ['sequences', 'periodic', 'sigma notation', 'recurrence relations'],
  generate(r) {
    const type = r.pick(['recip', 'one-minus'] as const);
    let terms: Q[], rule: string, a: Q;
    if (type === 'recip') {
      a = Q.of(r.int(2, 6));
      const k = r.int(2, 15);
      r.require(k !== a.value * a.value);
      terms = [a, Q.of(k).div(a)];
      rule = `\\frac{${k}}{u_{n}}`;
    } else {
      a = r.pick([Q.of(2), Q.of(3), Q.of(4), Q.of(5), Q.of(-1), Q.of(-2), Q.of(-3), Q.of(1, 2), Q.of(1, 3)]);
      const t2 = Q.of(1).sub(a.inv()),
        t3 = Q.of(1).sub(t2.inv());
      terms = [a, t2, t3];
      rule = '1 - \\frac{1}{u_{n}}';
    }
    const order = terms.length;
    const N = r.int(20, 60);
    const full = Math.floor(N / order),
      rem = N % order;
    const cycle = terms.reduce((s, t) => s.add(t), Q.of(0));
    const S = cycle.mul(full).add(terms.slice(0, rem).reduce((s, t) => s.add(t), Q.of(0)));
    const T2 = ans.exact(exq(terms[1])),
      Ord = ans.exact(exq(order)),
      Sum = ans.exact(exq(S));
    return {
      stem: md`A sequence is defined by $u_{1} = ${a.toLatex()}$, $u_{n+1} = ${rule}$, $n \geqslant 1$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find $u_{2}$${order === 3 ? ' and show that $u_{4} = u_{1}$' : ' and $u_{3}$'}, and hence write down the order of this periodic sequence.`, answer: Ord, scheme: [M1(md`$u_{2} = ${terms[1].toLatex()}$${order === 3 ? md`, $u_{3} = ${terms[2].toLatex()}$` : ''}`), A1(`Order ${order}`)], hints: [md`Substitute $u_{1} = ${a.toLatex()}$ into the rule to get $u_{2}$.`, 'Keep going until the sequence returns to its first term.', 'The order is the number of terms in one repeating block.'], solution: [md`$u_{2} = ${terms[1].toLatex()}$${order === 3 ? md`, $u_{3} = ${terms[2].toLatex()}$, $u_{4} = ${a.toLatex()}$` : md`, $u_{3} = ${a.toLatex()}$`}`, md`The sequence repeats every $${answerTex(Ord)}$ terms.`] }),
        part({ label: 'b', marks: 1, prompt: md`Write down the value of $u_{2}$.`, answer: T2, scheme: [B1(md`$${terms[1].toLatex()}$`)], hints: ['Use your working from (a).', md`$u_{2} = ${type === 'recip' ? md`\dfrac{k}{u_{1}}` : md`1 - \dfrac{1}{u_{1}}`}$`, 'Simplify the fraction.'], solution: [md`$u_{2} = ${answerTex(T2)}$`] }),
        part({ label: 'c', marks: 3, prompt: md`Find $\displaystyle${sigma(1, N, 'u_{r}')}$.`, answer: Sum, scheme: [M1(`Sum of one cycle: ${cycle.toLatex()}`), M1(md`$${full} \times (\text{cycle sum})${rem ? ' + \\text{remaining terms}' : ''}$`), A1(md`$${S.toLatex()}$`)], hints: [md`Add the ${order} terms in one cycle: $${terms.map((t) => t.toLatex()).join(' + ')} = ${cycle.toLatex()}$.`.replace(/\+ -/g, '- '), md`$${N} = ${order} \times ${full}${rem ? ` + ${rem}` : ''}$, so there are ${full} complete cycles${rem ? ` and ${rem} extra term${rem > 1 ? 's' : ''}` : ''}.`, 'Multiply and add on the extra terms.'], solution: [md`One cycle sums to $${cycle.toLatex()}$; there are $${full}$ full cycles${rem ? md` plus $${terms.slice(0, rem).map((t) => t.toLatex()).join(' + ')}$` : ''}.`, md`$\displaystyle${sigma(1, N, 'u_{r}')} = ${answerTex(Sum)}$`] }),
      ],
      params: { type, a: a.value, k: type === 'recip' ? terms[1].mul(a).value : 0, N },
    };
  },
  verify(inst) {
    const { type, a, k, N } = inst.params as { type: string; a: number; k: number; N: number };
    let u = a,
      s = 0;
    const seen = [a];
    for (let n = 1; n <= N; n++) {
      s += u;
      u = type === 'recip' ? k / u : 1 - 1 / u;
      if (n < 6) seen.push(u);
    }
    expectClose(valOf(inst.parts[2].answer as ExactSpec), s, 'sum');
    const ord = valOf(inst.parts[0].answer as ExactSpec);
    expectClose(seen[ord], a, 'period');
    expectClose(valOf(inst.parts[1].answer as ExactSpec), seen[1], 'u2');
  },
});

// ---------------------------------------------------------------- 3.6 sigma notation
const sigmaArith = defineTemplate({
  id: 'p2.3.sigma-arithmetic',
  family: 'p2.3.sigma',
  title: 'Evaluate an arithmetic sum written in sigma notation',
  spec: ['P4.3', 'P4.4'],
  chapter: 'P2.3',
  sections: ['3.6'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 2,
  marks: 3,
  time: 4,
  commands: ['Find', 'Evaluate'],
  tags: ['sigma notation', 'arithmetic series'],
  generate(r) {
    const a = r.pick([2, 3, 4, 5, 7, -2, -3]),
      b = r.int(-10, 10);
    const lo = r.pick([1, 1, 1, 5, 10, 11, 21]),
      n = r.int(lo + 10, lo + 50);
    const term = (k: number) => a * k + b;
    const count = n - lo + 1;
    const S = (count * (term(lo) + term(n))) / 2;
    const Sv = ans.exact(exq(S));
    const body = `(${sumTex([[a, 'r'], [b, '']])})`;
    return {
      parts: [
        part({
          marks: 3,
          prompt: md`Find the value of $\displaystyle${sigma(lo, n, body)}$.`,
          answer: Sv,
          scheme: [M1(md`Arithmetic series with first term $${term(lo)}$, last term $${term(n)}$ (or $d = ${a}$)`), M1(md`Number of terms $= ${count}$ and uses $S = \frac{n}{2}(a + l)$`), A1(md`$${S}$`)],
          hints: [md`The terms are $${term(lo)}, ${term(lo + 1)}, ${term(lo + 2)}, \ldots$ — an arithmetic series.`, `Count the terms: from r = ${lo} to r = ${n} there are ${n} − ${lo} + 1 terms.`, md`Use $S_{n} = \frac{n}{2}(\text{first} + \text{last})$.`],
          errors: lo === 1 ? [] : [err('miscount', ans.exact(exq(((count - 1) * (term(lo + 1) + term(n))) / 2)), `Check the number of terms: from ${lo} to ${n} inclusive is ${count} terms.`, 1)],
          solution: [md`First term $${term(lo)}$, last term $${term(n)}$, $${count}$ terms.`, md`$S = \frac{${count}}{2}(${term(lo)} + ${term(n)}) = ${answerTex(Sv)}$`.replace('+ -', '- ')],
        }),
      ],
      params: { a, b, lo, n },
    };
  },
  verify(inst) {
    const { a, b, lo, n } = inst.params as Record<string, number>;
    let s = 0;
    for (let k = lo; k <= n; k++) s += a * k + b;
    expect(valOf(inst.parts[0].answer as ExactSpec) === s, 'direct sum');
  },
});

const sigmaGeo = defineTemplate({
  id: 'p2.3.sigma-geometric',
  family: 'p2.3.sigma',
  title: 'Geometric sums in sigma notation, finite and infinite',
  spec: ['P4.3', 'P4.5'],
  chapter: 'P2.3',
  sections: ['3.6', '3.5'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find', 'Evaluate'],
  tags: ['sigma notation', 'geometric series', 'sum to infinity'],
  generate(r) {
    const c = r.int(1, 6),
      b = r.pick([Q.of(2), Q.of(3), Q.of(-2), Q.of(1, 2)]),
      n = r.int(5, b.abs().value === 3 ? 9 : 12);
    const first = b.mul(c);
    const S = first.mul(Q.of(1).sub(b.pow(n))).div(Q.of(1).sub(b));
    const p = r.int(2, 20),
      q = r.pick([Q.of(1, 2), Q.of(1, 3), Q.of(2, 3), Q.of(3, 4), Q.of(-1, 2), Q.of(1, 4)]);
    const lo = r.pick([0, 1]);
    const Sinf = q.pow(lo).mul(p).div(Q.of(1).sub(q));
    const S1 = ans.exact(exq(S)),
      S2 = ans.exact(exq(Sinf));
    const bodyF = `${c === 1 ? '' : c}(${b.toLatex()})^{r}`;
    const bodyI = `${p}\\left(${q.toLatex()}\\right)^{r}`;
    return {
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find the value of $\displaystyle${sigma(1, n, bodyF)}$.`, answer: S1, scheme: [M1(md`Geometric with $a = ${first.toLatex()}$, $r = ${b.toLatex()}$`), M1(md`Uses $S_{${n}} = \dfrac{a(1 - r^{${n}})}{1 - r}$`), A1(md`$${S.toLatex()}$`)], hints: [md`Write out the first terms: $${first.toLatex()}, ${first.mul(b).toLatex()}, \ldots$`, md`It is geometric: $a = ${first.toLatex()}$, $r = ${b.toLatex()}$, $n = ${n}$.`, md`$S_{n} = \dfrac{a(1 - r^{n})}{1 - r}$`], errors: [err('a-is-c', ans.exact(exq(Q.of(c).mul(Q.of(1).sub(b.pow(n))).div(Q.of(1).sub(b)))), md`Substituting $r = 1$ gives the first term, $${first.toLatex()}$ — not $${c}$.`, 1)], solution: [md`$a = ${first.toLatex()}$, $r = ${b.toLatex()}$: $S_{${n}} = \dfrac{${first.toLatex()}(1 - (${b.toLatex()})^{${n}})}{1 - (${b.toLatex()})} = ${answerTex(S1)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the value of $\displaystyle\sum_{r=${lo}}^{\infty} ${bodyI}$.`, answer: S2, scheme: [M1(md`$S_{\infty} = \dfrac{a}{1 - r}$ with $a = ${q.pow(lo).mul(p).toLatex()}$`), A1(md`$${Sinf.toLatex()}$`)], hints: [md`$|r| = ${q.abs().toLatex()} < 1$, so the sum converges.`, md`The first term (r = ${lo}) is $${q.pow(lo).mul(p).toLatex()}$.`, md`$S_{\infty} = \dfrac{a}{1 - r}$`], solution: [md`$S_{\infty} = \dfrac{${q.pow(lo).mul(p).toLatex()}}{1 - (${q.toLatex()})} = ${answerTex(S2)}$`] }),
      ],
      params: { c, b: b.value, n, p, q: q.value, lo },
    };
  },
  verify(inst) {
    const { c, b, n, p, q, lo } = inst.params as Record<string, number>;
    let s = 0;
    for (let k = 1; k <= n; k++) s += c * b ** k;
    expectClose(valOf(inst.parts[0].answer as ExactSpec), s, 'finite');
    let t = 0;
    for (let k = lo; k < 400; k++) t += p * q ** k;
    expectClose(valOf(inst.parts[1].answer as ExactSpec), t, 'infinite', 1e-9);
  },
});

const sigmaFindN = defineTemplate({
  id: 'p2.3.sigma-find-n',
  family: 'p2.3.sigma',
  title: 'Find the upper limit n of a sigma sum',
  spec: ['P4.3', 'P4.4'],
  chapter: 'P2.3',
  sections: ['3.6', '3.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 5,
  time: 6,
  commands: ['Find', 'Show that'],
  tags: ['sigma notation', 'arithmetic series', 'quadratic'],
  generate(r) {
    const a = r.pick([2, 3, 4, 5, 6]),
      b = r.int(-9, 12);
    const n0 = r.int(8, 40);
    const V = (a * n0 * (n0 + 1)) / 2 + b * n0;
    // a/2 n² + (a/2 + b) n − V = 0 → a n² + (a + 2b) n − 2V = 0
    const other = -(a + 2 * b) / a - n0;
    r.require(!(other > 0 && Number.isInteger(other)));
    const N = ans.exact(exq(n0));
    const body = `(${sumTex([[a, 'r'], [b, '']])})`;
    const quad = sumTex([[a, 'n^{2}'], [a + 2 * b, 'n'], [-2 * V, '']]);
    return {
      parts: [
        part({
          marks: 5,
          prompt: md`Given that $\displaystyle${sigma(1, 'n', body)} = ${V}$, find the value of $n$.`,
          answer: N,
          scheme: [M1(md`Arithmetic: $a = ${a + b}$, $d = ${a}$`), M1(md`$\frac{n}{2}\left(2(${a + b}) + (n - 1)(${a})\right) = ${V}$`), A1(md`$${quad} = 0$`), dM1('Solves the quadratic'), A1(md`$n = ${n0}$ (rejecting the other root)`)],
          hints: [md`The terms are $${a + b}, ${2 * a + b}, ${3 * a + b}, \ldots$: first term $${a + b}$, common difference $${a}$.`, md`Use $S_{n} = \frac{n}{2}\left(2a + (n - 1)d\right)$ and set it equal to $${V}$.`, 'Multiply out to get a quadratic in n; n must be a positive integer.'],
          solution: [md`$\frac{n}{2}\left(${2 * (a + b)} + ${a}(n - 1)\right) = ${V} \Rightarrow ${quad} = 0$`.replace('+ -', '- '), md`$n = ${n0}$ or $n = ${Q.from(other).toLatex()}$; $n$ must be a positive integer, so $n = ${answerTex(N)}$`],
        }),
      ],
      params: { a, b, V },
    };
  },
  verify(inst) {
    const { a, b, V } = inst.params as Record<string, number>;
    const n = valOf(inst.parts[0].answer as ExactSpec);
    let s = 0;
    for (let k = 1; k <= n; k++) s += a * k + b;
    expect(s === V, 'sum equals V');
  },
});

const templates: Template[] = [nthTerm, recurrence, periodic, sigmaArith, sigmaGeo, sigmaFindN];
export default templates;
