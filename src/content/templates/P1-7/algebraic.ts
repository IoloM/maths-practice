/** Pure Year 1, Chapter 7 — algebraic methods: fractions, division, factor theorem, proof. */
import { Q, isPrime } from '../../../engine/core/rational';
import { Poly } from '../../../engine/core/poly';
import { type Expr, evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import { exprToPoly } from '../../../engine/marking/forms';
import type { CustomForm, ExprSpec, ListSpec, ExactSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';

const fac = (r0: number) => (r0 === 0 ? 'x' : `(x ${r0 < 0 ? '+' : '-'} ${Math.abs(r0)})`);

const SIMPLIFIED_FRACTION: CustomForm = {
  label: 'simplified fraction',
  check(e: Expr) {
    const s = e.k === 'neg' ? e.a : e;
    if (s.k !== 'div') return 'Write your answer as a single simplified fraction.';
    const n = exprToPoly(s.a, 'x'),
      d = exprToPoly(s.b, 'x');
    if (!n || !d) return null;
    return n.degree <= 1 && d.degree <= 1 ? null : 'Cancel the common factor so the fraction is fully simplified.';
  },
};

const factorTheorem = defineTemplate({
  id: 'p1.7.factor-theorem-find-k',
  family: 'p1.7.factor-theorem',
  title: 'Factor theorem: find a constant, then factorise fully',
  spec: ['P2.6'],
  chapter: 'P1.7',
  sections: ['7.3'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 8,
  commands: ['Find', 'Hence', 'Factorise'],
  tags: ['factor theorem', 'polynomials', 'factorising'],
  generate(r) {
    const p = r.intNZ(-4, 4),
      q = r.intExcept(-5, 5, [p]),
      s = r.intExcept(-5, 5, [p, q]);
    const lead = r.pick([1, 1, 2]);
    r.require(lead === 1 || s % 2 !== 0);
    // f(x) = lead(x − p)(x − q)(x − s/lead) only integer coefficients when lead = 1; keep lead = 1 or use (2x − s)
    const f = lead === 1 ? Poly.fromRoots([p, q, s]) : Poly.fromRoots([p, q]).mul(Poly.coeffs([-s, 2]));
    const k = f.coef(1).n;
    const fTex = sumTex([[f.coef(3), 'x^{3}'], [f.coef(2), 'x^{2}'], [1, 'kx'], [f.coef(0), '']]);
    const K = ans.list([ans.exact(num(k))], { v: 'k' });
    const factTex = lead === 1 ? `${fac(p)}${fac(q)}${fac(s)}` : `${fac(p)}${fac(q)}(2x ${s < 0 ? '+' : '-'} ${Math.abs(s)})`;
    const F: ExprSpec = ans.expr(ex(factTex), ['x'], { forms: ['fully-factorised'], domain: { x: [-5, 5] } });
    return {
      stem: md`$\mathrm{f}(x) = ${fTex}$, where $k$ is a constant. Given that $${fac(p)}$ is a factor of $\mathrm{f}(x)$,`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`find the value of $k$.`, answer: K, scheme: [M1(md`Uses $\mathrm{f}(${p}) = 0$`), A1('Correct equation in k'), A1(md`$k = ${k}$`)], hints: [md`Factor theorem: if $(x - a)$ is a factor, then $\mathrm{f}(a) = 0$.`, md`Substitute $x = ${p}$ and set equal to zero.`, 'Solve the linear equation for k.'], errors: [err('wrong-sign-x', ans.list([ans.exact(num(Q.from(-(f.coef(3).value * (-p) ** 3 + f.coef(2).value * p * p + f.coef(0).value)).div(-p)))], { v: 'k' }), md`Use $\mathrm{f}(${p}) = 0$ — for the factor $${fac(p)}$ substitute $x = ${p}$.`)], solution: [md`$\mathrm{f}(${p}) = ${f.coef(3).value * p ** 3} + ${f.coef(2).value * p * p} + ${p}k + ${f.coef(0).value} = 0$`, md`$\Rightarrow k = ${k}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Hence factorise $\mathrm{f}(x)$ completely.`, answer: F, scheme: [M1(md`Divides by $${fac(p)}$ (or compares coefficients)`), A1('Correct quadratic factor'), A1(md`$${answerTex(F)}$`)], hints: [md`Divide $\mathrm{f}(x)$ by $${fac(p)}$ to get a quadratic.`, 'Factorise the quadratic.', 'Check by expanding.'], solution: [md`$\mathrm{f}(x) = ${fac(p)}\left(${f.divLinear(p).q.toLatex()}\right)$`, md`$= ${answerTex(F)}$`] }),
      ],
      params: { c: [f.coef(0).value, f.coef(1).value, f.coef(2).value, f.coef(3).value], p },
    };
  },
  verify(inst) {
    const { c, p } = inst.params as { c: number[]; p: number };
    const k = evaluate(((inst.parts[0].answer as ListSpec).items[0] as ExactSpec).value);
    expectClose(c[3] * p ** 3 + c[2] * p * p + k * p + c[0], 0, 'f(p) = 0', 1e-9);
    const e = (inst.parts[1].answer as ExprSpec).value;
    for (const x of [-2.5, 0.7, 3.1]) expectClose(evaluate(e, { x }), c[3] * x ** 3 + c[2] * x * x + c[1] * x + c[0], 'factorised form');
  },
});

const division = defineTemplate({
  id: 'p1.7.polynomial-division',
  family: 'p1.7.division',
  title: 'Divide a cubic by a linear factor',
  spec: ['P2.6'],
  chapter: 'P1.7',
  sections: ['7.2'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 3,
  time: 4,
  commands: ['Find', 'Divide'],
  tags: ['polynomials', 'algebraic division'],
  generate(r) {
    const p = r.intNZ(-5, 5);
    const qd = Poly.coeffs([r.int(-8, 8), r.int(-6, 6), r.pick([1, 2, 3, -1, 4])]);
    const f = qd.mul(Poly.coeffs([-p, 1]));
    const E: ExprSpec = ans.expr(qd.toExpr(), ['x'], { forms: ['expanded'] });
    return {
      parts: [
        part({
          marks: 3,
          prompt: md`Given that $${fac(p)}$ is a factor of $${f.toLatex()}$, divide $${f.toLatex()}$ by $${fac(p)}$, giving the quotient in the form $ax^{2} + bx + c$.`,
          answer: E,
          scheme: [M1('Long division (or comparing coefficients)'), A1('Two terms correct'), A1(md`$${answerTex(E)}$`)],
          hints: ['Divide the leading term first: how many times does x go into the first term?', 'Multiply back, subtract, bring down the next term and repeat.', md`The first term of the quotient is $${qd.coef(2).toLatex() === '1' ? '' : qd.coef(2).toLatex()}x^{2}$.`],
          solution: [md`$${f.toLatex()} = ${fac(p)}\left(${qd.toLatex()}\right)$`, md`Quotient: $${answerTex(E)}$`],
        }),
      ],
      params: { p, q: [qd.coef(0).value, qd.coef(1).value, qd.coef(2).value] },
    };
  },
  verify(inst) {
    const { p, q } = inst.params as { p: number; q: number[] };
    const e = (inst.parts[0].answer as ExprSpec).value;
    for (const x of [-2, 1.5, 4]) expectClose(evaluate(e, { x }) * (x - p), (q[0] + q[1] * x + q[2] * x * x) * (x - p), 'division');
  },
});

const fraction = defineTemplate({
  id: 'p1.7.simplify-algebraic-fraction',
  family: 'p1.7.algebraic-fractions',
  title: 'Simplify an algebraic fraction by factorising',
  spec: ['P2.6'],
  chapter: 'P1.7',
  sections: ['7.1'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 3,
  time: 4,
  commands: ['Simplify'],
  tags: ['algebraic fractions', 'factorising', 'cancelling'],
  generate(r) {
    const a = r.intNZ(-6, 6),
      b = r.intExcept(-6, 6, [a]),
      c = r.intExcept(-6, 6, [a, b]);
    const k = r.pick([1, 2, 3]);
    const top = Poly.fromRoots([a, b], k),
      bot = Poly.fromRoots([a, c]);
    const ansTex = `\\frac{${k === 1 ? '' : k}${fac(b)}}{${fac(c)}}`.replace(/\(x/g, 'x').replace(/\)}/g, '}').replace(/\)\}/, '}');
    const E: ExprSpec = ans.expr(ex(`\\frac{${k === 1 ? '' : k}${fac(b)}}{${fac(c)}}`), ['x'], { forms: [SIMPLIFIED_FRACTION], domain: { x: [Math.max(a, c) + 0.3, Math.max(a, c) + 4] } });
    void ansTex;
    return {
      parts: [
        part({
          marks: 3,
          prompt: md`Simplify fully $\dfrac{${top.toLatex()}}{${bot.toLatex()}}$.`,
          answer: E,
          scheme: [M1('Factorises numerator or denominator'), A1(md`$\frac{${k === 1 ? '' : k}${fac(a)}${fac(b)}}{${fac(a)}${fac(c)}}$`), A1(md`$${answerTex(E)}$`)],
          hints: ['Factorise the top and the bottom.', 'Look for a common factor.', 'Cancel it.'],
          solution: [md`$\dfrac{${top.toLatex()}}{${bot.toLatex()}} = \dfrac{${k === 1 ? '' : k}${fac(a)}${fac(b)}}{${fac(a)}${fac(c)}} = ${answerTex(E)}$`],
        }),
      ],
      params: { a, b, c, k },
    };
  },
  verify(inst) {
    const { a, b, c, k } = inst.params as Record<string, number>;
    const e = (inst.parts[0].answer as ExprSpec).value;
    for (const x of [c + 0.7, a + 1.3, 9.1]) if (x !== a && x !== c) expectClose(evaluate(e, { x }), (k * (x - a) * (x - b)) / ((x - a) * (x - c)), 'equivalent');
  },
});

const counterexample = defineTemplate({
  id: 'p1.7.disproof-counter-example',
  family: 'p1.7.proof',
  title: 'Disproof by counter-example',
  spec: ['P1.1'],
  chapter: 'P1.7',
  sections: ['7.5'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 2,
  time: 3,
  commands: ['Prove', 'Show that'],
  tags: ['proof', 'counter-example'],
  generate(r) {
    const kind = r.pick(['prime-poly', 'prime-poly', 'power', 'linear', 'square-sum', 'sqrt'] as const);
    let statement: string, test: (n: number) => boolean, valueOf: (n: number) => string;
    if (kind === 'prime-poly') {
      const c = r.pick([5, 7, 11, 13, 17, 41]);
      const b = r.pick([-1, 1, 2, 3]);
      statement = md`$${sumTex([[1, 'n^{2}'], [b, 'n'], [c, '']])}$ is prime for every positive integer $n$`;
      test = (n) => !isPrime(n * n + b * n + c);
      valueOf = (n) => `${n * n + b * n + c}`;
    } else if (kind === 'power') {
      const k = r.pick([1, 3, 5, 9, 15]);
      statement = md`$2^{n} + ${k}$ is prime for every positive integer $n$`;
      test = (n) => n <= 30 && !isPrime(2 ** n + k);
      valueOf = (n) => `${2 ** n + k}`;
    } else if (kind === 'linear') {
      const a0 = r.pick([4, 6, 10, 12]),
        b0 = r.pick([1, 3, 5, 7]);
      statement = md`$${a0}n + ${b0}$ is prime for every positive integer $n$`;
      test = (n) => !isPrime(a0 * n + b0);
      valueOf = (n) => `${a0 * n + b0}`;
    } else if (kind === 'square-sum') {
      const k = r.pick([2, 3, 5]);
      statement = md`if $n^{2}$ is a multiple of ${k * k}, then $n$ is a multiple of $${k * k}$`;
      test = (n) => n % (k * k) !== 0 && (n * n) % (k * k) === 0;
      valueOf = (n) => `${n * n}`;
    } else {
      const k = r.pick([2, 3]);
      statement = md`$\sqrt{x} < x$ for all positive real numbers $x$ (consider $x = \frac{1}{${k}}$ and similar)`;
      test = (n) => Math.sqrt(1 / n) >= 1 / n;
      valueOf = (n) => `\\frac{1}{${n}}`;
    }
    const pool = Array.from({ length: 60 }, (_, i) => i + 1);
    const good = pool.filter(test);
    const bad = pool.filter((n) => !test(n));
    r.require(good.length >= 1 && bad.length >= 3);
    const g = r.pick(good.slice(0, 12));
    const opts0 = r.shuffle([g, ...r.sample(bad.slice(0, 20), 3)]);
    const opts = opts0.map((n) => (kind === 'sqrt' ? md`$x = \frac{1}{${n}}$` : md`$n = ${n}$`));
    const C = ans.choice(opts, opts0.indexOf(g));
    return {
      parts: [
        part({
          marks: 2,
          prompt: md`A student claims that ${statement}. Which value is a counter-example that proves the claim is false?`,
          answer: C,
          scheme: [M1('Tests a suitable value'), A1('Shows the statement fails for it and concludes')],
          hints: ['A single example where the statement fails disproves it.', 'Try each value in turn.', kind === 'prime-poly' ? 'Check whether the result has a factor other than 1 and itself.' : 'Check each value carefully.'],
          solution: [kind === 'sqrt' ? md`When $x = \frac{1}{${g}}$, $\sqrt{x} = ${Math.sqrt(1 / g).toFixed(3)} \geqslant ${(1 / g).toFixed(3)} = x$, so the claim is false.` : md`When $n = ${g}$, the value is $${valueOf(g)}$, which shows the claim is false.`],
        }),
      ],
      params: { g },
    };
  },
  verify(inst) {
    expect(inst.parts[0].answer.type === 'choice', 'choice');
  },
});

const exhaustion = defineTemplate({
  id: 'p1.7.proof-by-exhaustion',
  family: 'p1.7.proof',
  title: 'Proof by exhaustion',
  spec: ['P1.1'],
  chapter: 'P1.7',
  sections: ['7.5'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 3,
  time: 5,
  commands: ['Prove'],
  tags: ['proof', 'exhaustion'],
  generate(r) {
    const variant = r.pick(['primes', 'squares'] as const);
    if (variant === 'primes') {
      const hi = r.pick([20, 25, 30, 40]);
      const ps = Array.from({ length: hi }, (_, i) => i).filter((p) => p > 3 && isPrime(p));
      const rows = ps.map((p) => `$${p}$: $(${p - 1})(${p + 1}) = ${(p - 1) * (p + 1)} = 12 \\times ${((p - 1) * (p + 1)) / 12}$`).join('; ');
      return {
        parts: [part({ marks: 3, prompt: md`Given that $p$ is a prime number with $3 < p < ${hi}$, prove by exhaustion that $(p - 1)(p + 1)$ is a multiple of $12$.`, answer: ans.self(md`The primes are $${ps.join(', ')}$. ${rows}. Every case is a multiple of $12$, so the statement is true.`), scheme: [M1('Lists all primes in range'), M1('Evaluates (p − 1)(p + 1) for each'), { code: 'A1*', text: 'All shown to be multiples of 12 with a conclusion', final: true }], hints: [md`List every prime between $3$ and $${hi}$.`, 'Work out (p − 1)(p + 1) for each one.', 'Show each result is 12 × an integer, then write a conclusion.'], solution: [md`Primes: $${ps.join(', ')}$.`, rows, 'All are multiples of 12, which completes the proof.'] })],
        params: { variant, ps },
      };
    }
    if (r.bool(0.5)) {
      const fams = [
        { tex: 'n^{2} + n', f: (n: number) => n * n + n, claim: 'even', ok: (v: number) => v % 2 === 0, why: (v: number) => `${v} = 2 \\times ${v / 2}` },
        { tex: 'n^{3} - n', f: (n: number) => n ** 3 - n, claim: 'a multiple of 6', ok: (v: number) => v % 6 === 0, why: (v: number) => `${v} = 6 \\times ${v / 6}` },
        { tex: '(n + 1)^{2} - n^{2}', f: (n: number) => (n + 1) ** 2 - n * n, claim: 'odd', ok: (v: number) => v % 2 === 1, why: (v: number) => `${v} = 2 \\times ${(v - 1) / 2} + 1` },
        { tex: 'n(n + 1)(n + 2)', f: (n: number) => n * (n + 1) * (n + 2), claim: 'a multiple of 6', ok: (v: number) => v % 6 === 0, why: (v: number) => `${v} = 6 \\times ${v / 6}` },
        { tex: 'n^{2} + 3n', f: (n: number) => n * n + 3 * n, claim: 'even', ok: (v: number) => v % 2 === 0, why: (v: number) => `${v} = 2 \\times ${v / 2}` },
      ];
      const F = r.pick(fams);
      const lo = r.int(1, 4),
        hi = lo + r.int(3, 8);
      const ns = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
      const rows = ns.map((n) => `$n = ${n}$: $${F.why(F.f(n))}$`).join('; ');
      return {
        parts: [part({ marks: 3, prompt: md`Prove by exhaustion that $${F.tex}$ is ${F.claim} for all integers $n$ with $${lo} \leqslant n \leqslant ${hi}$.`, answer: ans.self(md`${rows}. The statement holds in every case, so it is true for $${lo} \leqslant n \leqslant ${hi}$.`), scheme: [M1('Considers every integer in the range'), M1('Correct evaluation in each case'), { code: 'A1*', text: 'Shows each is ' + F.claim + ' and concludes', final: true }], hints: ['Exhaustion means checking every case.', md`There are $${ns.length}$ values of $n$ to test.`, 'Show each result has the property, then write a conclusion.'], solution: [rows, 'Every case works, which completes the proof.'] })],
        params: { variant: 'range', vals: ns.map(F.f), ok: fams.indexOf(F) },
      };
    }
    const m = r.pick([3, 4, 5, 6, 7]);
    const rows = Array.from({ length: m }, (_, k) => `$n = ${m}q + ${k}$: $n^{2} = ${m * m}q^{2} + ${2 * k * m}q + ${k * k}$, remainder $${(k * k) % m}$`).join('; ');
    const rems = [...new Set(Array.from({ length: m }, (_, k) => (k * k) % m))].sort((a0, b0) => a0 - b0);
    return {
      parts: [part({ marks: 3, prompt: md`Prove by exhaustion that the remainder when the square of an integer is divided by $${m}$ is one of $${rems.join(', ')}$.`, answer: ans.self(md`Every integer $n$ can be written as $${m}q + k$ with $k \in \{${Array.from({ length: m }, (_, k) => k).join(', ')}\}$. ${rows}. So the remainder is always one of $${rems.join(', ')}$.`), scheme: [M1(md`Considers all cases $n = ${m}q + k$`), M1('Expands n² in each case'), { code: 'A1*', text: 'Correct remainders with conclusion', final: true }], hints: [md`Every integer has a remainder of $0, 1, \dots, ${m - 1}$ on division by $${m}$.`, md`Write $n = ${m}q + k$ and square it.`, 'Look at the remainder of each expansion.'], solution: [rows, md`So the remainder is always one of $${rems.join(', ')}$.`] })],
      params: { variant, m },
    };
  },
  verify(inst) {
    const p = inst.params as { variant: string; ps?: number[]; m?: number; vals?: number[] };
    if (p.variant === 'range') expect(p.vals!.every(Number.isInteger), 'integers');
    else if (p.variant === 'primes') expect(p.ps!.every((q) => ((q - 1) * (q + 1)) % 12 === 0), 'multiples of 12');
    else expect(Array.from({ length: 50 }, (_, n) => (n * n) % p.m!).every((v) => Array.from({ length: p.m! }, (_, k) => (k * k) % p.m!).includes(v)), 'remainders');
  },
});

const deduction = defineTemplate({
  id: 'p1.7.proof-completing-square',
  family: 'p1.7.proof',
  title: 'Proof by deduction: a quadratic is always positive',
  spec: ['P1.1', 'P2.3'],
  chapter: 'P1.7',
  sections: ['7.4'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 3,
  time: 4,
  commands: ['Prove'],
  tags: ['proof', 'deduction', 'completing the square'],
  generate(r) {
    const b = r.intNZ(-10, 10),
      extra = r.pick([Q.of(1), Q.of(2), Q.of(3), Q.of(5), Q.of(1, 4), Q.of(3, 4), Q.of(5, 4), Q.of(7, 4)]);
    const half = Q.of(b, 2);
    const c = half.mul(half).add(extra);
    r.require(c.isInt);
    const v = r.pick(['n', 'x', 'k']);
    const fTex = sumTex([[1, `${v}^{2}`], [b, v], [c, '']]);
    return {
      parts: [
        part({
          marks: 3,
          prompt: md`Prove that $${fTex} > 0$ for all real values of $${v}$.`,
          answer: ans.self(md`$${fTex} = \left(${v} ${half.sign < 0 ? '-' : '+'} ${half.abs().toLatex()}\right)^{2} + ${extra.toLatex()}$. Since $\left(${v} ${half.sign < 0 ? '-' : '+'} ${half.abs().toLatex()}\right)^{2} \geqslant 0$ for all real $${v}$, the expression is at least $${extra.toLatex()} > 0$. Hence $${fTex} > 0$ for all $n$.`),
          scheme: [M1('Completes the square'), A1(md`$\left(${v} ${half.sign < 0 ? '-' : '+'} ${half.abs().toLatex()}\right)^{2} + ${extra.toLatex()}$`), { code: 'A1*', text: 'Explains the square is ⩾ 0 so the expression is > 0, with conclusion', final: true }],
          hints: ['Complete the square.', 'A squared term is never negative.', 'So the smallest value is the constant term.'],
          solution: [md`$${fTex} = \left(${v} ${half.sign < 0 ? '-' : '+'} ${half.abs().toLatex()}\right)^{2} + ${extra.toLatex()}$`, md`$\left(${v} ${half.sign < 0 ? '-' : '+'} ${half.abs().toLatex()}\right)^{2} \geqslant 0$, so the expression $\geqslant ${extra.toLatex()} > 0$ for all real $${v}$.`],
        }),
      ],
      params: { b, c: c.value },
    };
  },
  verify(inst) {
    const { b, c } = inst.params as Record<string, number>;
    expect(b * b - 4 * c < 0, 'no real roots so always positive');
  },
});

void B1;
void dM1;

const templates: Template[] = [factorTheorem, division, fraction, counterexample, exhaustion, deduction];
export default templates;
