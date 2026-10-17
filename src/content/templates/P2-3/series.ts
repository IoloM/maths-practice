/** Pure Year 2, Chapter 3 — arithmetic and geometric sequences and series, sum to infinity, modelling (3.1–3.5, 3.8). */
import { Q } from '../../../engine/core/rational';
import { evaluate, neg, num, sym } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, ExactSpec, IntervalSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, iv, md, part, sgn } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { contains, toNumSet } from '../../../engine/marking/intervals';

const exq = (q: Q | number) => num(Q.from(q));
const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
const lin = (a: number, b: number, v = 'k') => `${a === 1 ? '' : a === -1 ? '-' : a}${v}${b === 0 ? '' : sgn(b)}`;

// ---------------------------------------------------------------- 3.1–3.2 arithmetic
const apTwoTerms = defineTemplate({
  id: 'p2.3.arithmetic-from-two-terms',
  family: 'p2.3.arithmetic',
  title: 'Arithmetic sequence from two given terms, then a sum',
  spec: ['P4.4'],
  chapter: 'P2.3',
  sections: ['3.1', '3.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 2,
  marks: 5,
  time: 6,
  commands: ['Find'],
  tags: ['arithmetic sequences', 'arithmetic series', 'simultaneous equations'],
  generate(r) {
    const a = r.int(-20, 30),
      d = r.pick([-5, -4, -3, -2, 2, 3, 4, 5, 6, 7, Q.of(1, 2).value, Q.of(3, 2).value, Q.of(5, 2).value]);
    const p = r.int(3, 8),
      q = p + r.int(3, 15);
    const u = (n: number) => a + (n - 1) * d;
    const N = r.int(15, 40);
    const S = (N / 2) * (2 * a + (N - 1) * d);
    r.require(Number.isInteger(u(p) * 2) && Number.isInteger(S * 2));
    const Ds = ans.exact(exq(Q.from(d))),
      As = ans.exact(exq(a)),
      Ss = ans.exact(exq(Q.from(S)));
    const fq = (x: number) => Q.from(x).toLatex();
    return {
      stem: md`The ${p}th term of an arithmetic sequence is $${fq(u(p))}$ and the ${q}th term is $${fq(u(q))}$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the common difference.`, answer: Ds, scheme: [M1(md`$a + ${p - 1}d = ${fq(u(p))}$ and $a + ${q - 1}d = ${fq(u(q))}$`), A1(md`$d = ${fq(d)}$`)], hints: [md`$u_{n} = a + (n - 1)d$`, md`Write $u_{${p}}$ and $u_{${q}}$ as equations in $a$ and $d$.`, 'Subtract one equation from the other.'], solution: [md`$${q - p}d = ${fq(u(q))} - (${fq(u(p))}) \Rightarrow d = ${answerTex(Ds)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Find the first term.`, answer: As, scheme: [B1(md`$a = ${a}$`)], hints: ['Substitute your d into either equation.', md`$a = u_{${p}} - ${p - 1}d$`, 'Simplify.'], solution: [md`$a = ${fq(u(p))} - ${p - 1}(${fq(d)}) = ${answerTex(As)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the sum of the first $${N}$ terms.`, answer: Ss, scheme: [M1(md`$S_{${N}} = \frac{${N}}{2}\left(2(${a}) + ${N - 1}(${fq(d)})\right)$`), A1(md`$${fq(S)}$`)], hints: [md`$S_{n} = \frac{n}{2}\left(2a + (n - 1)d\right)$`, md`$n = ${N}$`, 'Substitute your a and d.'], errors: [err('n-not-n-minus-1', ans.exact(exq(Q.from((N / 2) * (2 * a + N * d)))), 'The formula uses (n − 1)d, not nd.', 1)], solution: [md`$S_{${N}} = \frac{${N}}{2}\left(${2 * a} + ${N - 1} \times ${fq(d)}\right) = ${answerTex(Ss)}$`.replace('+ -', '- ')] }),
      ],
      params: { a, d, p, q, N },
    };
  },
  verify(inst) {
    const { a, d, N } = inst.params as Record<string, number>;
    expectClose(valOf(inst.parts[0].answer as ExactSpec), d, 'd');
    expectClose(valOf(inst.parts[1].answer as ExactSpec), a, 'a');
    let s = 0;
    for (let n = 1; n <= N; n++) s += a + (n - 1) * d;
    expectClose(valOf(inst.parts[2].answer as ExactSpec), s, 'sum');
  },
});

const apLeastN = defineTemplate({
  id: 'p2.3.arithmetic-least-n',
  family: 'p2.3.arithmetic',
  title: 'Least number of terms for an arithmetic sum to exceed a value',
  spec: ['P4.4', 'P2.5'],
  chapter: 'P2.3',
  sections: ['3.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find', 'Show that'],
  tags: ['arithmetic series', 'quadratic inequality'],
  generate(r) {
    const a = r.int(2, 30),
      d = r.int(2, 9);
    const V = r.pick([500, 750, 1000, 1500, 2000, 2500, 3000, 5000]);
    // d/2 n² + (a − d/2) n − V > 0  →  d n² + (2a − d) n − 2V > 0
    const crit = (-(2 * a - d) + Math.sqrt((2 * a - d) ** 2 + 8 * d * V)) / (2 * d);
    r.require(Math.abs(crit - Math.round(crit)) > 0.03);
    const n = Math.floor(crit) + 1;
    const Ns = ans.exact(exq(n));
    const quad = `${d}n^{2}${2 * a - d === 0 ? '' : sgn(2 * a - d, 'n')} - ${2 * V}`;
    return {
      stem: md`An arithmetic series has first term $${a}$ and common difference $${d}$.`,
      parts: [
        part({
          marks: 5,
          prompt: md`Find the least number of terms for which the sum of the series exceeds $${V}$.`,
          answer: Ns,
          scheme: [M1(md`$\frac{n}{2}\left(${2 * a} + ${d}(n - 1)\right) > ${V}$`), A1(md`$${quad} > 0$`), dM1('Solves the quadratic to find the critical value'), A1(md`$n = ${fmtSF(crit, 4)}$`), A1(md`$n = ${n}$`)],
          hints: [md`Set $S_{n} > ${V}$ using $S_{n} = \frac{n}{2}\left(2a + (n - 1)d\right)$.`, md`Multiply out: $${quad} > 0$.`, 'Solve the quadratic equation; n must be the next whole number above the positive root.'],
          errors: [err('rounded-down', ans.exact(exq(n - 1)), md`With $n = ${n - 1}$ the sum is $${((n - 1) / 2) * (2 * a + (n - 2) * d)}$, which does not exceed $${V}$ — round up.`, 4)],
          solution: [md`$\frac{n}{2}\left(${2 * a} + ${d}(n - 1)\right) > ${V} \Rightarrow ${quad} > 0$`, md`Positive root: $n = ${fmtSF(crit, 4)}$, so the least integer is $${answerTex(Ns)}$`, md`Check: $S_{${n - 1}} = ${((n - 1) / 2) * (2 * a + (n - 2) * d)}$, $S_{${n}} = ${(n / 2) * (2 * a + (n - 1) * d)}$.`],
        }),
      ],
      params: { a, d, V },
    };
  },
  verify(inst) {
    const { a, d, V } = inst.params as Record<string, number>;
    const n = valOf(inst.parts[0].answer as ExactSpec);
    const S = (k: number) => (k / 2) * (2 * a + (k - 1) * d);
    expect(S(n) > V && S(n - 1) <= V, 'least n');
  },
});

const apAlgebraic = defineTemplate({
  id: 'p2.3.arithmetic-consecutive-terms-in-k',
  family: 'p2.3.arithmetic',
  title: 'Three consecutive terms in k form an arithmetic sequence',
  spec: ['P4.4'],
  chapter: 'P2.3',
  sections: ['3.1', '3.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find', 'Show that'],
  tags: ['arithmetic sequences', 'algebra'],
  generate(r) {
    const k0 = r.int(2, 9);
    const m1 = r.pick([1, 2]),
      m2 = r.pick([2, 3, 4]),
      m3 = r.pick([3, 4, 5, 6]);
    r.require(2 * m2 - m1 - m3 !== 0);
    const t1 = r.int(-6, 8),
      t2 = r.int(-6, 8);
    // choose the third constant so that k0 works: 2(m2 k + t2) = (m1 k + t1) + (m3 k + t3)
    const t3 = 2 * (m2 * k0 + t2) - (m1 * k0 + t1) - m3 * k0;
    const T = [m1 * k0 + t1, m2 * k0 + t2, m3 * k0 + t3];
    const d = T[1] - T[0];
    r.require(d !== 0);
    const N = r.int(10, 30);
    const S = (N / 2) * (2 * T[0] + (N - 1) * d);
    const Ks = ans.exact(exq(k0)),
      Ss = ans.exact(exq(S));
    return {
      stem: md`The first three terms of an arithmetic sequence are $(${lin(m1, t1)})$, $(${lin(m2, t2)})$ and $(${lin(m3, t3)})$, where $k$ is a constant.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find the value of $k$.`, answer: Ks, scheme: [M1(md`$(${lin(m2, t2)}) - (${lin(m1, t1)}) = (${lin(m3, t3)}) - (${lin(m2, t2)})$`), dM1('Solves the linear equation'), A1(md`$k = ${k0}$`)], hints: ['In an arithmetic sequence the difference between consecutive terms is constant.', md`$u_{2} - u_{1} = u_{3} - u_{2}$`, 'Collect the k terms and solve.'], solution: [md`$(${lin(m2, t2)}) - (${lin(m1, t1)}) = (${lin(m3, t3)}) - (${lin(m2, t2)})$`, md`$${lin(2 * m2 - m1 - m3, 2 * t2 - t1 - t3)} = 0 \Rightarrow k = ${answerTex(Ks)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Find the sum of the first $${N}$ terms of the sequence.`, answer: Ss, scheme: [M1(md`First term $${T[0]}$ and $d = ${d}$`), M1('Uses the sum formula'), A1(md`$${S}$`)], hints: [md`Substitute $k = ${k0}$: the terms are $${T.join(', ')}$.`, md`So $a = ${T[0]}$ and $d = ${d}$.`, md`$S_{n} = \frac{n}{2}\left(2a + (n - 1)d\right)$`], solution: [md`Terms: $${T.join(', ')}$, so $a = ${T[0]}$, $d = ${d}$.`, md`$S_{${N}} = \frac{${N}}{2}\left(${2 * T[0]} + ${N - 1}(${d})\right) = ${answerTex(Ss)}$`] }),
      ],
      params: { T, N },
    };
  },
  verify(inst) {
    const { T, N } = inst.params as { T: number[]; N: number };
    expect(T[1] - T[0] === T[2] - T[1], 'AP');
    let s = 0;
    for (let n = 0; n < N; n++) s += T[0] + n * (T[1] - T[0]);
    expect(valOf(inst.parts[1].answer as ExactSpec) === s, 'sum');
  },
});

// ---------------------------------------------------------------- 3.3–3.5 geometric
const gpTwoTerms = defineTemplate({
  id: 'p2.3.geometric-from-two-terms',
  family: 'p2.3.geometric',
  title: 'Geometric sequence from two terms: ratio, first term and a sum',
  spec: ['P4.5'],
  chapter: 'P2.3',
  sections: ['3.3', '3.4'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find'],
  tags: ['geometric sequences', 'geometric series'],
  generate(r) {
    const rr = r.pick([Q.of(2), Q.of(3), Q.of(-2), Q.of(1, 2), Q.of(-1, 2), Q.of(1, 3), Q.of(3, 2), Q.of(2, 3)]);
    const gap = r.pick([2, 3]);
    const i = r.int(2, 3),
      j = i + gap;
    const a = Q.of(r.int(1, 9)).mul(rr.d ** (j - 1) <= 300 ? rr.d ** (j - 1) : 1);
    const u = (n: number) => a.mul(rr.pow(n - 1));
    r.require(u(j).n <= 20000 && u(j).d <= 2000);
    const N = r.int(6, 12);
    const S = a.mul(Q.of(1).sub(rr.pow(N))).div(Q.of(1).sub(rr));
    const evenGap = gap % 2 === 0;
    const Rs = ans.exact(exq(rr)),
      As = ans.exact(exq(a)),
      Ss = ans.num(S.value, { sf: 3 }, { exactAllowed: true, exact: exq(S) });
    return {
      stem: md`The ${i}${i === 2 ? 'nd' : 'rd'} term of a geometric sequence is $${u(i).toLatex()}$ and the ${j}th term is $${u(j).toLatex()}$.${evenGap ? md` The common ratio is ${rr.value > 0 ? 'positive' : 'negative'}.` : ''}`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the common ratio.`, answer: Rs, scheme: [M1(md`$r^{${gap}} = \dfrac{${u(j).toLatex()}}{${u(i).toLatex()}}$`), A1(md`$r = ${rr.toLatex()}$`)], hints: [md`$u_{n} = ar^{n-1}$`, md`Divide: $\dfrac{u_{${j}}}{u_{${i}}} = r^{${gap}}$.`, evenGap ? `Take the ${gap === 2 ? 'square' : 'fourth'} root and use the given sign.` : 'Take the cube root.'], errors: evenGap ? [err('wrong-sign', ans.exact(exq(rr.neg())), md`Both $\pm${rr.abs().toLatex()}$ satisfy $r^{${gap}} = ${rr.pow(gap).toLatex()}$ — use the given sign of $r$.`)] : [], solution: [md`$r^{${gap}} = \dfrac{${u(j).toLatex()}}{${u(i).toLatex()}} = ${rr.pow(gap).toLatex()} \Rightarrow r = ${answerTex(Rs)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the first term.`, answer: As, scheme: [M1(md`$a = \dfrac{u_{${i}}}{r^{${i - 1}}}$`), A1(md`$a = ${a.toLatex()}$`)], hints: [md`$u_{${i}} = ar^{${i - 1}}$`, 'Divide by the power of r.', 'Keep it exact.'], solution: [md`$a = \dfrac{${u(i).toLatex()}}{(${rr.toLatex()})^{${i - 1}}} = ${answerTex(As)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the sum of the first $${N}$ terms, giving your answer to 3 significant figures.`, answer: Ss, scheme: [M1(md`$S_{${N}} = \dfrac{a(1 - r^{${N}})}{1 - r}$`), A1(md`awrt $${fmtSF(S.value, 3)}$`)], hints: [md`$S_{n} = \dfrac{a(1 - r^{n})}{1 - r}$`, md`$a = ${a.toLatex()}$, $r = ${rr.toLatex()}$, $n = ${N}$`, 'Use brackets for a negative ratio.'], solution: [md`$S_{${N}} = \dfrac{${a.toLatex()}\left(1 - (${rr.toLatex()})^{${N}}\right)}{1 - (${rr.toLatex()})} = ${S.toLatex()} = ${answerTex(Ss)}$`] }),
      ],
      params: { a: a.value, r: rr.value, N },
    };
  },
  verify(inst) {
    const { a, r, N } = inst.params as Record<string, number>;
    expectClose(valOf(inst.parts[0].answer as ExactSpec), r, 'r');
    expectClose(valOf(inst.parts[1].answer as ExactSpec), a, 'a');
    let s = 0;
    for (let n = 0; n < N; n++) s += a * r ** n;
    expectClose(valOf(inst.parts[2].answer as NumericSpec), s, 'sum');
  },
});

const sumInfinity = defineTemplate({
  id: 'p2.3.sum-to-infinity-with-x',
  family: 'p2.3.geometric',
  title: 'Convergence condition and sum to infinity with a ratio in x',
  spec: ['P4.5', 'P2.5'],
  chapter: 'P2.3',
  sections: ['3.5'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 6,
  time: 7,
  commands: ['Find'],
  tags: ['geometric series', 'sum to infinity', 'convergence', 'inequalities'],
  generate(r) {
    const p = r.pick([1, 2, 3, 4]),
      q = r.int(-5, 5),
      m = r.pick([2, 3, 4, 5]);
    const A = r.int(2, 12);
    // r = (px + q)/m ; |r| < 1 ⟺ (−m − q)/p < x < (m − q)/p
    const lo = Q.of(-m - q, p),
      hi = Q.of(m - q, p);
    const I: IntervalSpec = ans.interval([iv(exq(lo), exq(hi), false, false)], 'x');
    // S∞ = A/(1 − r) = V  →  r = 1 − A/V
    const rv = r.pick([Q.of(1, 2), Q.of(1, 3), Q.of(2, 3), Q.of(1, 4), Q.of(3, 4), Q.of(-1, 2), Q.of(-1, 3), Q.of(2, 5)]);
    const V = Q.of(A).div(Q.of(1).sub(rv));
    const x0 = rv.mul(m).sub(q).div(p);
    const X = ans.exact(exq(x0));
    const rTex = `\\frac{${p === 1 ? '' : p}x${q === 0 ? '' : sgn(q)}}{${m}}`;
    return {
      stem: md`A geometric series has first term $${A}$ and common ratio $${rTex}$.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find the set of values of $x$ for which the series has a sum to infinity.`, answer: I, scheme: [M1(md`$\left|${rTex}\right| < 1$`), M1('Solves to find both critical values'), A1(md`$${answerTex(I)}$`)], hints: ['A geometric series converges only when |r| < 1.', md`$-1 < ${rTex} < 1$`, md`Multiply through by $${m}$, then solve.`], errors: [err('one-sided', ans.interval([iv(neg(sym('infty')), exq(hi), false, false)], 'x'), 'You need −1 < r as well as r < 1.', 1)], solution: [md`$-${m} < ${p === 1 ? '' : p}x${q === 0 ? '' : sgn(q)} < ${m} \Rightarrow ${answerTex(I)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Given that the sum to infinity is $${V.toLatex()}$, find the value of $x$.`, answer: X, scheme: [M1(md`$\dfrac{${A}}{1 - r} = ${V.toLatex()}$`), A1(md`$r = ${rv.toLatex()}$`), A1(md`$x = ${x0.toLatex()}$`)], hints: [md`$S_{\infty} = \dfrac{a}{1 - r}$`, md`Solve $\dfrac{${A}}{1 - r} = ${V.toLatex()}$ for $r$ first.`, md`Then solve $${rTex} = r$ for $x$.`], solution: [md`$1 - r = \dfrac{${A}}{${V.toLatex()}} \Rightarrow r = ${rv.toLatex()}$`, md`$${rTex} = ${rv.toLatex()} \Rightarrow x = ${answerTex(X)}$`] }),
      ],
      params: { p, q, m, A, V: V.value },
    };
  },
  verify(inst) {
    const { p, q, m, A, V } = inst.params as Record<string, number>;
    const set = toNumSet((inst.parts[0].answer as IntervalSpec).set);
    for (let x = -12; x <= 12; x += 0.37) expect(contains(set, x) === Math.abs((p * x + q) / m) < 1, 'convergence set');
    const x = valOf(inst.parts[1].answer as ExactSpec);
    expectClose(A / (1 - (p * x + q) / m), V, 'sum to infinity');
  },
});

const gpLeastN = defineTemplate({
  id: 'p2.3.geometric-least-n-logs',
  family: 'p2.3.geometric',
  title: 'Least n for a geometric sum or term to pass a value (using logs)',
  spec: ['P4.5', 'P6.5'],
  chapter: 'P2.3',
  sections: ['3.4'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 5,
  time: 6,
  commands: ['Find', 'Show that'],
  tags: ['geometric series', 'logarithms', 'inequalities'],
  generate(r) {
    const mode = r.pick(['sum', 'term'] as const);
    const a = r.int(2, 50),
      rr = mode === 'sum' ? r.pick([1.05, 1.1, 1.2, 1.25, 1.5, 2, 3]) : r.pick([0.9, 0.85, 0.8, 0.75, 0.6, 0.5]);
    const V = mode === 'sum' ? a * r.pick([20, 50, 100, 400, 1000]) : a * r.pick([0.05, 0.01, 0.02, 0.1]);
    const crit = mode === 'sum' ? Math.log(1 + (V * (rr - 1)) / a) / Math.log(rr) : 1 + Math.log(V / a) / Math.log(rr);
    r.require(Math.abs(crit - Math.round(crit)) > 0.02);
    const n = Math.floor(crit) + 1;
    const Ns = ans.exact(exq(n));
    const rq = fmtNum(rr);
    return {
      stem: md`A geometric sequence has first term $${a}$ and common ratio $${rq}$.`,
      parts: [
        part({
          marks: 5,
          prompt: mode === 'sum' ? md`Find the smallest value of $n$ for which the sum of the first $n$ terms exceeds $${fmtNum(V)}$.` : md`Find the smallest value of $n$ for which the $n$th term is less than $${fmtNum(V)}$.`,
          answer: Ns,
          scheme: mode === 'sum' ? [M1(md`$\dfrac{${a}(${rq}^{n} - 1)}{${rq} - 1} > ${fmtNum(V)}$`), A1(md`$${rq}^{n} > ${fmtNum(1 + (V * (rr - 1)) / a)}$`), M1('Takes logs of both sides'), A1(md`$n > ${fmtSF(crit, 4)}$`), A1(md`$n = ${n}$`)] : [M1(md`$${a}(${rq})^{n-1} < ${fmtNum(V)}$`), A1(md`$(${rq})^{n-1} < ${fmtNum(V / a)}$`), M1('Takes logs, reversing the inequality when dividing by a negative log'), A1(md`$n > ${fmtSF(crit, 4)}$`), A1(md`$n = ${n}$`)],
          hints: mode === 'sum' ? [md`$S_{n} = \dfrac{a(r^{n} - 1)}{r - 1}$; set it greater than $${fmtNum(V)}$.`, md`Rearrange to $${rq}^{n} > \ldots$ then take logs.`, 'n must be a whole number — round up.'] : [md`$u_{n} = ar^{n-1}$; set it less than $${fmtNum(V)}$.`, md`$\log ${rq} < 0$, so dividing by it reverses the inequality.`, 'Round up to the next whole number.'],
          errors: [err('rounded-down', ans.exact(exq(n - 1)), 'Check: with that n the condition is not yet met — the answer must be the next whole number.', 4)],
          solution: mode === 'sum' ? [md`$${rq}^{n} > ${fmtNum(1 + (V * (rr - 1)) / a, 6)} \Rightarrow n > \dfrac{\log ${fmtNum(1 + (V * (rr - 1)) / a, 6)}}{\log ${rq}} = ${fmtSF(crit, 4)}$`, md`Smallest $n = ${answerTex(Ns)}$`] : [md`$(${rq})^{n-1} < ${fmtNum(V / a, 6)} \Rightarrow n - 1 > \dfrac{\log ${fmtNum(V / a, 6)}}{\log ${rq}} = ${fmtSF(crit - 1, 4)}$`, md`Smallest $n = ${answerTex(Ns)}$`],
        }),
      ],
      params: { mode, a, rr, V },
    };
  },
  verify(inst) {
    const { mode, a, rr, V } = inst.params as { mode: string; a: number; rr: number; V: number };
    const n = valOf(inst.parts[0].answer as ExactSpec);
    const ok = (k: number) => (mode === 'sum' ? (a * (rr ** k - 1)) / (rr - 1) > V : a * rr ** (k - 1) < V);
    expect(ok(n) && !ok(n - 1), 'least n');
  },
});

// ---------------------------------------------------------------- 3.8 modelling
const salary = defineTemplate({
  id: 'p2.3.arithmetic-model-salary',
  family: 'p2.3.modelling',
  title: 'Arithmetic series in context: salary or savings',
  spec: ['P4.6', 'P4.4'],
  chapter: 'P2.3',
  sections: ['3.8'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 7,
  time: 8,
  commands: ['Find', 'Show that'],
  tags: ['arithmetic series', 'modelling', 'money'],
  generate(r) {
    const ctx = r.pick([
      { who: 'An employee', start: [18000, 21000, 24000, 26500], inc: [500, 750, 800, 1000, 1200], per: 'year', thing: 'annual salary', tot: 'total earned' },
      { who: 'A student', start: [20, 25, 30, 40], inc: [2, 3, 4, 5], per: 'month', thing: 'monthly saving', tot: 'total saved' },
      { who: 'A runner', start: [5, 6, 8, 10], inc: [1, 2], per: 'week', thing: 'weekly distance (km)', tot: 'total distance' },
    ]);
    const a = r.pick(ctx.start),
      d = r.pick(ctx.inc);
    const n = r.int(8, 20);
    const un = a + (n - 1) * d,
      Sn = (n / 2) * (2 * a + (n - 1) * d);
    const T = Math.round((Sn * r.pick([2.5, 3, 4])) / (ctx.per === 'year' ? 1000 : 10)) * (ctx.per === 'year' ? 1000 : 10);
    const crit = (-(2 * a - d) + Math.sqrt((2 * a - d) ** 2 + 8 * d * T)) / (2 * d);
    r.require(Math.abs(crit - Math.round(crit)) > 0.02);
    const k = Math.floor(crit) + 1;
    const money = ctx.per !== 'week';
    const pre = money ? '£' : '';
    const U = ans.exact(exq(un)),
      S = ans.exact(exq(Sn)),
      K = ans.exact(exq(k));
    return {
      stem: md`${ctx.who}'s ${ctx.thing} is ${pre}$${a}$ in the first ${ctx.per}. It increases by ${pre}$${d}$ each ${ctx.per}.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the ${ctx.thing} in ${ctx.per} $${n}$.`, answer: U, scheme: [M1(md`$${a} + ${n - 1} \times ${d}$`), A1(md`${pre}$${un}$`)], hints: ['This is an arithmetic sequence.', md`$u_{n} = a + (n - 1)d$`, md`$a = ${a}$, $d = ${d}$, $n = ${n}$`], errors: [err('nd', ans.exact(exq(a + n * d)), 'Use (n − 1)d: in the first period no increase has happened yet.', 1)], solution: [md`$u_{${n}} = ${a} + ${n - 1} \times ${d} = ${answerTex(U)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the ${ctx.tot} over the first $${n}$ ${ctx.per}s.`, answer: S, scheme: [M1(md`$\frac{${n}}{2}\left(2 \times ${a} + ${n - 1} \times ${d}\right)$`), A1(md`${pre}$${Sn}$`)], hints: [md`$S_{n} = \frac{n}{2}\left(2a + (n - 1)d\right)$`, md`or $S_{n} = \frac{n}{2}(a + l)$ using your answer to (a).`, 'Substitute and evaluate.'], solution: [md`$S_{${n}} = \frac{${n}}{2}(${a} + ${un}) = ${answerTex(S)}$`] }),
        part({ label: 'c', marks: 3, prompt: md`Find the number of ${ctx.per}s it takes for the ${ctx.tot} to first exceed ${pre}$${T}$.`, answer: K, scheme: [M1(md`$\frac{n}{2}\left(${2 * a} + ${d}(n - 1)\right) > ${T}$`), dM1('Solves the quadratic'), A1(md`$${k}$ ${ctx.per}s`)], hints: [`Set the sum greater than ${pre}${T}.`, 'Rearrange into a quadratic inequality in n.', 'Solve, then round up to a whole number.'], solution: [md`$${d}n^{2} + ${2 * a - d}n - ${2 * T} > 0 \Rightarrow n > ${fmtSF(crit, 4)}$`, md`So $${answerTex(K)}$ ${ctx.per}s.`] }),
      ],
      params: { a, d, n, T },
    };
  },
  verify(inst) {
    const { a, d, n, T } = inst.params as Record<string, number>;
    const S = (k: number) => (k / 2) * (2 * a + (k - 1) * d);
    expect(valOf(inst.parts[0].answer as ExactSpec) === a + (n - 1) * d, 'term');
    expect(valOf(inst.parts[1].answer as ExactSpec) === S(n), 'sum');
    const k = valOf(inst.parts[2].answer as ExactSpec);
    expect(S(k) > T && S(k - 1) <= T, 'first exceeds');
  },
});

const bounce = defineTemplate({
  id: 'p2.3.geometric-model-bouncing-ball',
  family: 'p2.3.modelling',
  title: 'Geometric series in context: a bouncing ball',
  spec: ['P4.6', 'P4.5'],
  chapter: 'P2.3',
  sections: ['3.8'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 7,
  time: 9,
  commands: ['Find', 'Give a reason'],
  tags: ['geometric series', 'sum to infinity', 'modelling', 'limitations'],
  generate(r) {
    const h = r.pick([2, 3, 4, 5, 6, 8, 10, 12]);
    const f = r.pick([Q.of(1, 2), Q.of(3, 5), Q.of(2, 5), Q.of(3, 4), Q.of(4, 5), Q.of(7, 10), Q.of(9, 10)]);
    const k = r.int(3, 6);
    const hk = f.pow(k).mul(h);
    const total = Q.of(h).add(Q.of(2 * h).mul(f).div(Q.of(1).sub(f)));
    const Hk = ans.num(hk.value, { sf: 3 }, { exactAllowed: true, exact: exq(hk), unit: '\\text{m}' }),
      Tot = ans.num(total.value, { sf: 3 }, { exactAllowed: true, exact: exq(total), unit: '\\text{m}' });
    const opts = ['In reality the ball stops bouncing after a finite number of bounces (energy is lost to sound and heat, and very small bounces do not happen)', 'The ball travels an infinite distance', 'The ball bounces higher each time'];
    const C: ChoiceSpec = ans.choice(opts, 0);
    const pc = Math.round(f.value * 100);
    return {
      stem: md`A ball is dropped from a height of $${h}$ m. After each bounce it rises to $${pc}\%$ of the height it fell from.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the height the ball reaches after the ${k === 3 ? '3rd' : `${k}th`} bounce.`, answer: Hk, scheme: [M1(md`$${h} \times ${fmtNum(f.value)}^{${k}}$`), A1(md`awrt $${fmtSF(hk.value, 3)}$ m`)], hints: [md`Each bounce multiplies the height by $${fmtNum(f.value)}$.`, `After the first bounce the height is ${h} × ${fmtNum(f.value)}.`, `So after ${k} bounces it is ${h} × ${fmtNum(f.value)}^${k}.`], errors: [err('one-too-few', ans.num(f.pow(k - 1).mul(h).value, { sf: 3 }), 'Count the bounces: after the first bounce the height has been multiplied once.')], solution: [md`$${h} \times ${fmtNum(f.value)}^{${k}} = ${answerTex(Hk)}$`] }),
        part({ label: 'b', marks: 4, prompt: md`Assuming the ball continues to bounce in this way indefinitely, find the total distance it travels.`, answer: Tot, scheme: [M1('Recognises each rebound height is travelled twice (up and down)'), M1(md`Sum to infinity: $\dfrac{${h} \times ${fmtNum(f.value)}}{1 - ${fmtNum(f.value)}}$`), dM1(md`$${h} + 2 \times S_{\infty}$`), A1(md`$${fmtNum(total.value, 4)}$ m`)], hints: ['The ball falls h first, then goes up and down for every rebound.', md`The rebound heights form a geometric series with $a = ${fmtNum(f.mul(h).value)}$ and $r = ${fmtNum(f.value)}$.`, 'Total = initial drop + 2 × (sum to infinity of rebound heights).'], errors: [err('not-doubled', ans.num(Q.of(h).add(Q.of(h).mul(f).div(Q.of(1).sub(f))).value, { sf: 3 }), 'Each rebound is travelled twice — once up and once down.', 2)], solution: [md`Rebound heights: $S_{\infty} = \dfrac{${fmtNum(f.mul(h).value)}}{1 - ${fmtNum(f.value)}} = ${fmtNum(f.mul(h).div(Q.of(1).sub(f)).value, 4)}$`, md`Total $= ${h} + 2 \times ${fmtNum(f.mul(h).div(Q.of(1).sub(f)).value, 4)} = ${answerTex(Tot)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`Give one criticism of the model.`, answer: C, scheme: [B1('Sensible criticism')], hints: ['Does a real ball bounce forever?', 'What happens to the energy?', 'Compare the model with reality for tiny bounces.'], solution: [opts[0]] }),
      ],
      params: { h, f: f.value, k },
    };
  },
  verify(inst) {
    const { h, f, k } = inst.params as Record<string, number>;
    expectClose(valOf(inst.parts[0].answer as NumericSpec), h * f ** k, 'height');
    let d = h,
      up = h * f;
    for (let i = 0; i < 2000; i++) {
      d += 2 * up;
      up *= f;
    }
    expectClose(valOf(inst.parts[1].answer as NumericSpec), d, 'total distance', 1e-9);
  },
});

const growthGP = defineTemplate({
  id: 'p2.3.geometric-model-growth',
  family: 'p2.3.modelling',
  title: 'Geometric series in context: percentage growth each year',
  spec: ['P4.6', 'P4.5'],
  chapter: 'P2.3',
  sections: ['3.8'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 7,
  time: 8,
  commands: ['Find', 'Show that'],
  tags: ['geometric series', 'modelling', 'percentage growth', 'logarithms'],
  generate(r) {
    const ctx = r.pick([
      { what: 'A company’s profit', unit: '£', start: [40000, 50000, 75000, 120000], per: 'year' },
      { what: 'The number of visitors to a museum', unit: '', start: [12000, 15000, 20000, 35000], per: 'year' },
      { what: 'The amount of plastic recycled by a town, in tonnes,', unit: '', start: [200, 350, 500, 800], per: 'year' },
    ]);
    const a = r.pick(ctx.start),
      pc = r.pick([2, 3, 4, 5, 6, 8]);
    const g = 1 + pc / 100;
    const n = r.int(5, 12);
    const un = a * g ** (n - 1),
      Sn = (a * (g ** n - 1)) / (g - 1);
    const X = Math.round((a * r.pick([1.5, 1.8, 2, 2.5])) / 100) * 100;
    const crit = 1 + Math.log(X / a) / Math.log(g);
    r.require(Math.abs(crit - Math.round(crit)) > 0.02);
    const k = Math.floor(crit) + 1;
    const U = ans.num(un, { sf: 3 }),
      S = ans.num(Sn, { sf: 3 }),
      K = ans.exact(exq(k));
    const pre = ctx.unit;
    return {
      stem: md`${ctx.what} is ${pre}$${a}$ in the first ${ctx.per}. It is modelled as increasing by $${pc}\%$ each ${ctx.per}.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the value predicted for ${ctx.per} $${n}$, to 3 significant figures.`, answer: U, scheme: [M1(md`$${a} \times ${fmtNum(g)}^{${n - 1}}$`), A1(md`awrt $${fmtSF(un, 3)}$`)], hints: [`A ${pc}% increase means multiplying by ${fmtNum(g)}.`, md`$u_{n} = ar^{n-1}$ with $r = ${fmtNum(g)}$.`, md`$n = ${n}$, so the power is $${n - 1}$.`], errors: [err('power-n', ans.num(a * g ** n, { sf: 3 }), 'The first year has had no increase yet, so use the power n − 1.', 1)], solution: [md`$${a} \times ${fmtNum(g)}^{${n - 1}} = ${answerTex(U)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the total over the first $${n}$ ${ctx.per}s, to 3 significant figures.`, answer: S, scheme: [M1(md`$\dfrac{${a}(${fmtNum(g)}^{${n}} - 1)}{${fmtNum(g)} - 1}$`), A1(md`awrt $${fmtSF(Sn, 3)}$`)], hints: [md`$S_{n} = \dfrac{a(r^{n} - 1)}{r - 1}$`, md`$a = ${a}$, $r = ${fmtNum(g)}$`, md`$n = ${n}$`], solution: [md`$S_{${n}} = \dfrac{${a}(${fmtNum(g)}^{${n}} - 1)}{${fmtNum(g - 1)}} = ${answerTex(S)}$`] }),
        part({ label: 'c', marks: 3, prompt: md`Find the first ${ctx.per} in which the value is predicted to exceed ${pre}$${X}$.`, answer: K, scheme: [M1(md`$${a} \times ${fmtNum(g)}^{n-1} > ${X}$`), M1('Takes logs'), A1(md`${ctx.per} $${k}$`)], hints: [md`Solve $${a} \times ${fmtNum(g)}^{n-1} > ${X}$.`, 'Divide, then take logs of both sides.', 'Round up to a whole number of years.'], solution: [md`$${fmtNum(g)}^{n-1} > ${fmtNum(X / a, 6)} \Rightarrow n - 1 > ${fmtSF(crit - 1, 4)}$`, md`So ${ctx.per} $${answerTex(K)}$.`] }),
      ],
      params: { a, g, n, X },
    };
  },
  verify(inst) {
    const { a, g, n, X } = inst.params as Record<string, number>;
    expectClose(valOf(inst.parts[0].answer as NumericSpec), a * g ** (n - 1), 'term');
    let s = 0;
    for (let i = 0; i < n; i++) s += a * g ** i;
    expectClose(valOf(inst.parts[1].answer as NumericSpec), s, 'sum');
    const k = valOf(inst.parts[2].answer as ExactSpec);
    expect(a * g ** (k - 1) > X && a * g ** (k - 2) <= X, 'first year');
  },
});

const templates: Template[] = [apTwoTerms, apLeastN, apAlgebraic, gpTwoTerms, sumInfinity, gpLeastN, salary, bounce, growthGP];
export default templates;
