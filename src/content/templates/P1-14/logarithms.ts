/** Pure Year 1, Chapter 14 — logarithms, laws of logarithms and solving exponential equations (14.4–14.7). */
import { Q } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, ExprSpec, ListSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, md, part, sgn } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';
import { lnQ } from './exp-graphs';

const exq = (q: Q | number) => num(Q.from(q));
const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
const logT = (b: number | string, arg: string) => `\\log_{${b}} ${arg}`;
const qTex = (q: Q) => (q.d === 1 ? `${q.n}` : `\\frac{${q.n}}{${q.d}}`);

// ---------------------------------------------------------------- 14.4 logarithms
const evaluateLogs = defineTemplate({
  id: 'p1.14.evaluate-logarithms',
  family: 'p1.14.log-definition',
  title: 'Evaluate logarithms without a calculator',
  spec: ['P6.3'],
  chapter: 'P1.14',
  sections: ['14.4'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 1,
  marks: 4,
  time: 4,
  commands: ['Find', 'Write down'],
  tags: ['logarithms', 'non-calculator', 'indices'],
  generate(r) {
    const a = r.pick([2, 3, 4, 5, 6, 7, 10]);
    const n = r.int(2, a <= 3 ? 6 : a <= 6 ? 4 : 3);
    const m = r.int(1, 3);
    const c = r.pick([2, 3, 5]),
      i = r.pick([2, 3]),
      j = r.pick([1, 2, 4, 5].filter((v) => v % i !== 0));
    const A1s = ans.exact(exq(n)),
      A2s = ans.exact(exq(-m)),
      A3s = ans.exact(exq(Q.of(j, i)));
    const B3 = c ** i,
      N3 = c ** j;
    return {
      stem: 'Without using a calculator, find the exact value of',
      parts: [
        part({ label: 'a', marks: 1, prompt: md`$${logT(a, `${a ** n}`)}$`, answer: A1s, scheme: [B1(md`$${n}$`)], hints: [md`$\log_{a} x = n$ means $a^{n} = x$.`, md`What power of $${a}$ gives $${a ** n}$?`, md`$${a}^{${n}} = ${a ** n}$`], solution: [md`$${a}^{${n}} = ${a ** n}$, so $${logT(a, `${a ** n}`)} = ${answerTex(A1s)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`$${logT(a, `\\left(\\frac{1}{${a ** m}}\\right)`)}$`, answer: A2s, scheme: [B1(md`$${-m}$`)], hints: ['A reciprocal means a negative power.', md`$\frac{1}{${a ** m}} = ${a}^{-${m}}$`, md`So the logarithm is $-${m}$.`], errors: [err('sign', ans.exact(exq(m)), 'The argument is less than 1, so the logarithm is negative.')], solution: [md`$\frac{1}{${a ** m}} = ${a}^{-${m}}$, so the value is $${answerTex(A2s)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`$${logT(B3, `${N3}`)}$`, answer: A3s, scheme: [M1(md`Writes both as powers of $${c}$: $${B3} = ${c}^{${i}}$ and $${N3} = ${c}^{${j}}$`), A1(md`$${qTex(Q.of(j, i))}$`)], hints: [md`Write $${B3}$ and $${N3}$ as powers of the same number.`, md`$${B3} = ${c}^{${i}}$ and $${N3} = ${c}^{${j}}$`, md`So $(${c}^{${i}})^{x} = ${c}^{${j}}$: solve $${i}x = ${j}$.`], errors: [err('reciprocal', ans.exact(exq(Q.of(i, j))), md`Check: $${B3}^{x} = ${N3}$ needs $${i}x = ${j}$, not $${j}x = ${i}$.`)], solution: [md`$${B3}^{x} = ${N3} \Rightarrow ${c}^{${i}x} = ${c}^{${j}} \Rightarrow x = ${answerTex(A3s)}$`] }),
      ],
      params: { a, n, m, B3, N3 },
    };
  },
  verify(inst) {
    const { a, n, m, B3, N3 } = inst.params as Record<string, number>;
    expectClose(valOf(inst.parts[0].answer as ExactSpec), Math.log(a ** n) / Math.log(a), 'a');
    expectClose(valOf(inst.parts[1].answer as ExactSpec), -Math.log(a ** m) / Math.log(a), 'b');
    expectClose(valOf(inst.parts[2].answer as ExactSpec), Math.log(N3) / Math.log(B3), 'c');
  },
});

const logIndex = defineTemplate({
  id: 'p1.14.log-to-index-form',
  family: 'p1.14.log-definition',
  title: 'Solve simple log equations by converting to index form',
  spec: ['P6.3'],
  chapter: 'P1.14',
  sections: ['14.4'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 5,
  time: 5,
  commands: ['Solve', 'Find'],
  tags: ['logarithms', 'index form', 'equations'],
  generate(r) {
    const a = r.int(2, 6),
      n = r.pick([-2, -1, 2, 3, 4]);
    const x0 = r.int(2, 9),
      k = r.pick([2, 3].filter((v) => x0 ** v <= 1000));
    const b2 = r.pick([2, 3, 5]),
      n2 = r.int(1, b2 === 5 ? 2 : 3),
      p = r.int(1, 5),
      q = r.intNZ(-9, 9);
    const X1 = ans.exact(exq(Q.of(a).pow(n))),
      X2 = ans.exact(exq(x0)),
      X3 = ans.exact(exq(Q.of(b2 ** n2 - q, p)));
    const inner = `${p === 1 ? '' : p}x${sgn(q)}`;
    return {
      stem: 'Find the exact value of $x$ in each of the following.',
      parts: [
        part({ label: 'a', marks: 1, prompt: md`$${logT(a, 'x')} = ${n}$`, answer: X1, scheme: [B1(md`$x = ${a}^{${n}} = ${Q.of(a).pow(n).toLatex()}$`)], hints: [md`$\log_{a} x = n \iff x = a^{n}$`, md`So $x = ${a}^{${n}}$.`, n < 0 ? 'A negative power gives a fraction.' : 'Evaluate the power.'], errors: [err('multiplied', ans.exact(exq(a * n)), md`$x = ${a}^{${n}}$, not $${a} \times ${n}$.`)], solution: [md`$x = ${a}^{${n}} = ${answerTex(X1)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`$${logT('x', `${x0 ** k}`)} = ${k}$, where $x > 0$`, answer: X2, scheme: [M1(md`$x^{${k}} = ${x0 ** k}$`), A1(md`$x = ${x0}$`)], hints: ['Here the unknown is the base.', md`$\log_{x} ${x0 ** k} = ${k}$ means $x^{${k}} = ${x0 ** k}$.`, md`Take the ${k === 2 ? 'square' : 'cube'} root.`], solution: [md`$x^{${k}} = ${x0 ** k} \Rightarrow x = ${answerTex(X2)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`$${logT(b2, `(${inner})`)} = ${n2}$`, answer: X3, scheme: [M1(md`$${inner} = ${b2}^{${n2}}$`), A1(md`$x = ${Q.of(b2 ** n2 - q, p).toLatex()}$`)], hints: ['Convert to index form first.', md`$${inner} = ${b2}^{${n2}} = ${b2 ** n2}$`, 'Then solve the linear equation.'], solution: [md`$${inner} = ${b2 ** n2} \Rightarrow x = ${answerTex(X3)}$`] }),
      ],
      params: { a, n, x0, k, b2, n2, p, q },
    };
  },
  verify(inst) {
    const { a, n, x0, k, b2, n2, p, q } = inst.params as Record<string, number>;
    expectClose(Math.log(valOf(inst.parts[0].answer as ExactSpec)) / Math.log(a), n, 'a');
    expectClose(Math.log(x0 ** k) / Math.log(valOf(inst.parts[1].answer as ExactSpec)), k, 'b');
    expectClose(Math.log(p * valOf(inst.parts[2].answer as ExactSpec) + q) / Math.log(b2), n2, 'c');
  },
});

const lnInverse = defineTemplate({
  id: 'p1.14.ln-and-e-inverse-equations',
  family: 'p1.14.log-definition',
  title: 'Solve equations using ln and e as inverse functions',
  spec: ['P6.3', 'P6.5'],
  chapter: 'P1.14',
  sections: ['14.7'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Solve'],
  tags: ['natural logarithm', 'exponentials', 'exact', 'equations'],
  generate(r) {
    const p = r.pick([1, 2, 3, 4, -1]),
      q = r.int(-5, 5),
      c = r.pick([Q.of(2), Q.of(3), Q.of(5), Q.of(7), Q.of(10), Q.of(1, 2), Q.of(3, 2)]);
    const lc = lnQ(c);
    const numA = q === 0 ? lc : `${lc}${sgn(-q)}`;
    const xA = p === 1 ? numA : p === -1 ? (q === 0 ? `-${lc}` : `${q} - ${lc}`) : `\\frac{${numA}}{${p}}`;
    const XA = ans.exact(ex(xA), ['exact']);
    const pb = r.int(1, 4),
      qb = r.intNZ(-6, 6),
      cb = r.pick([1, 2, 3, -1]);
    const eTex = cb === 1 ? 'e' : `e^{${cb}}`;
    const numB = `${eTex}${sgn(-qb)}`;
    const xB = pb === 1 ? numB : `\\frac{${numB}}{${pb}}`;
    const XB = ans.exact(ex(xB), ['exact']);
    const powA = `${p === 1 ? '' : p === -1 ? '-' : p}x${q === 0 ? '' : sgn(q)}`;
    const innerB = `${pb === 1 ? '' : pb}x${sgn(qb)}`;
    return {
      stem: 'Solve each equation, giving your answer as an exact value.',
      parts: [
        part({ label: 'a', marks: 2, prompt: md`$e^{${powA}} = ${qTex(c)}$`, answer: XA, scheme: [M1(md`$${powA} = ${lc}$`), A1(md`$x = ${xA}$`)], hints: ['Take natural logs of both sides.', md`$\ln\left(e^{${powA}}\right) = ${powA}$`, 'Then rearrange the linear equation.'], errors: p === 1 ? [] : [err('not-divided', ans.exact(ex(numA)), md`Divide by $${p}$ as well.`, 1)], solution: [md`$${powA} = ${lc} \Rightarrow x = ${answerTex(XA)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`$\ln(${innerB}) = ${cb}$`, answer: XB, scheme: [M1(md`$${innerB} = ${eTex}$`), A1(md`$x = ${xB}$`)], hints: ['Apply the exponential function to both sides.', md`$e^{\ln(${innerB})} = ${innerB}$`, 'Rearrange to make x the subject.'], solution: [md`$${innerB} = ${eTex} \Rightarrow x = ${answerTex(XB)}$`] }),
      ],
      params: { p, q, c: c.value, pb, qb, cb },
    };
  },
  verify(inst) {
    const { p, q, c, pb, qb, cb } = inst.params as Record<string, number>;
    const xa = valOf(inst.parts[0].answer as ExactSpec),
      xb = valOf(inst.parts[1].answer as ExactSpec);
    expectClose(Math.exp(p * xa + q), c, 'a');
    expectClose(Math.log(pb * xb + qb), cb, 'b');
  },
});

// ---------------------------------------------------------------- 14.5 laws of logarithms
const singleLog = defineTemplate({
  id: 'p1.14.write-as-single-log',
  family: 'p1.14.log-laws',
  title: 'Write an expression as a single logarithm',
  spec: ['P6.4'],
  chapter: 'P1.14',
  sections: ['14.5'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 3,
  time: 4,
  commands: ['Express', 'Write'],
  tags: ['logarithms', 'laws of logarithms', 'single logarithm'],
  generate(r) {
    const variant = r.pick(['letters', 'numeric'] as const);
    const pw = (v: string, n: Q) => (n.eq(1) ? v : n.eq(Q.of(1, 2)) ? `\\sqrt{${v}}` : `${v}^{${n.toLatex()}}`);
    const co = (n: Q) => (n.eq(1) ? '' : n.toLatex());
    if (variant === 'letters') {
      const n1 = r.pick([Q.of(2), Q.of(3), Q.of(4), Q.of(1, 2)]),
        n2 = r.pick([Q.of(1), Q.of(2), Q.of(3)]),
        n3 = r.pick([Q.of(1), Q.of(2), Q.of(3), Q.of(1, 2)]);
      const given = `${co(n1)}\\log_{a} x + ${co(n2)}\\log_{a} y - ${co(n3)}\\log_{a} z`;
      const ansTex = `\\log_{a}\\left(\\frac{${pw('x', n1)}${pw('y', n2)}}{${pw('z', n3)}}\\right)`;
      const E = ans.expr(ex(ansTex), ['a', 'x', 'y', 'z'], { forms: ['single-log'], domain: { a: [1.5, 6], x: [0.5, 5], y: [0.5, 5], z: [0.5, 5] } });
      const wrong = `\\log_{a}\\left(\\frac{${co(n1)}x \\cdot ${co(n2)}y}{${co(n3)}z}\\right)`;
      return {
        parts: [
          part({
            marks: 3,
            prompt: md`Express $${given}$ as a single logarithm.`,
            answer: E,
            scheme: [M1(md`Power law: $${co(n1)}\log_{a} x = \log_{a} ${pw('x', n1)}$ etc.`), M1('Uses the addition and subtraction laws'), A1(md`$${ansTex}$`)],
            hints: [md`Power law: $k\log_{a} x = \log_{a} x^{k}$.`, md`Then $\log_{a} P + \log_{a} Q = \log_{a} PQ$ and $\log_{a} P - \log_{a} Q = \log_{a}\frac{P}{Q}$.`, md`Do the power law first: $${co(n1)}\log_{a} x = \log_{a} ${pw('x', n1)}$.`],
            errors: n1.eq(1) && n2.eq(1) && n3.eq(1) ? [] : [err('coefficients-inside', ans.expr(ex(wrong), ['a', 'x', 'y', 'z'], { domain: { a: [1.5, 6], x: [0.5, 5], y: [0.5, 5], z: [0.5, 5] } }), 'The coefficient becomes a power, not a multiplier: k log x = log xᵏ.')],
            solution: [md`$= \log_{a} ${pw('x', n1)} + \log_{a} ${pw('y', n2)} - \log_{a} ${pw('z', n3)}$`, md`$= ${answerTex(E)}$`],
          }),
        ],
        params: { variant },
      };
    }
    const b = r.pick([2, 3, 5, 10]),
      c = r.pick([1, 2]),
      k = r.pick([2, 3]),
      d = r.intNZ(-4, 6);
    const given = `${k}\\log_{${b}} x - \\log_{${b}} (x ${d < 0 ? '-' : '+'} ${Math.abs(d)}) + ${c}`;
    const ansTex = `\\log_{${b}}\\left(\\frac{${b ** c}x^{${k}}}{x ${d < 0 ? '-' : '+'} ${Math.abs(d)}}\\right)`;
    const E = ans.expr(ex(ansTex), ['x'], { forms: ['single-log'], domain: { x: [Math.max(0.5, -d + 0.5), Math.max(6, -d + 6)] } });
    return {
      parts: [
        part({
          marks: 3,
          prompt: md`Given that $x > ${Math.max(0, -d)}$, express $${given}$ as a single logarithm.`,
          answer: E,
          scheme: [M1(md`$${k}\log_{${b}} x = \log_{${b}} x^{${k}}$`), M1(md`$${c} = \log_{${b}} ${b ** c}$`), A1(md`$${ansTex}$`)],
          hints: [md`Write the number $${c}$ as a logarithm to base $${b}$: $${c} = \log_{${b}} ${b}^{${c}}$.`, 'Use the power law on the first term.', 'Combine using the addition and subtraction laws.'],
          errors: [err('constant-as-log-c', ans.expr(ex(`\\log_{${b}}\\left(\\frac{${c === 1 ? '' : c}x^{${k}}}{x ${d < 0 ? '-' : '+'} ${Math.abs(d)}}\\right)`), ['x'], { domain: { x: [Math.max(0.5, -d + 0.5), Math.max(6, -d + 6)] } }), md`$${c} = \log_{${b}} ${b}^{${c}} = \log_{${b}} ${b ** c}$, not $\log_{${b}} ${c}$.`, 1)],
          solution: [md`$${c} = \log_{${b}} ${b ** c}$ and $${k}\log_{${b}} x = \log_{${b}} x^{${k}}$`, md`$= ${answerTex(E)}$`],
        }),
      ],
      params: { variant },
    };
  },
  verify(inst) {
    const E = inst.parts[0].answer as ExprSpec;
    expect(E.value.k === 'log', 'single log at the top level');
  },
});

const PRIME_PAIRS: [number, number][] = [
  [2, 3],
  [2, 5],
  [3, 5],
  [2, 7],
];

const inTermsPQ = defineTemplate({
  id: 'p1.14.logs-in-terms-of-p-and-q',
  family: 'p1.14.log-laws',
  title: 'Express logarithms in terms of given logarithms',
  spec: ['P6.4'],
  chapter: 'P1.14',
  sections: ['14.5'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Express', 'Find'],
  tags: ['logarithms', 'laws of logarithms'],
  generate(r) {
    const [P1, P2] = r.pick(PRIME_PAIRS);
    let i: number, j: number;
    do {
      i = r.int(0, 4);
      j = r.int(0, 3);
    } while (i + j < 2 || P1 ** i * P2 ** j > 3000);
    const N1 = P1 ** i * P2 ** j;
    const i2 = r.int(1, 3),
      j2 = r.int(1, 2),
      ka = r.pick([1, 2, -1]);
    const up = r.bool();
    const N2 = up ? Q.of(P2 ** j2, P1 ** i2) : Q.of(P1 ** i2, P2 ** j2);
    const E1 = ans.expr(ex(sumTex([[i, 'p'], [j, 'q']])), ['p', 'q']);
    const e2 = up ? sumTex([[j2, 'q'], [-i2, 'p'], [ka, '']]) : sumTex([[i2, 'p'], [-j2, 'q'], [ka, '']]);
    const E2 = ans.expr(ex(e2), ['p', 'q']);
    const numT = `${N2.n}${ka === 1 ? 'a' : ka === 2 ? 'a^{2}' : ''}`,
      denT = `${N2.d === 1 ? '' : N2.d}${ka === -1 ? 'a' : ''}`;
    const arg2 = denT ? `\\frac{${numT}}{${denT}}` : numT;
    return {
      stem: md`Given that $\log_{a} ${P1} = p$ and $\log_{a} ${P2} = q$, express each of the following in terms of $p$ and $q$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`$\log_{a} ${N1}$`, answer: E1, scheme: [M1(md`$${N1} = ${[i ? `${P1}^{${i}}` : '', j ? `${P2}^{${j}}` : ''].filter(Boolean).join(' \\times ')}$ and uses the laws`), A1(md`$${answerTex(E1)}$`)], hints: [md`Write $${N1}$ as a product of powers of $${P1}$ and $${P2}$.`, md`$${N1} = ${[i ? `${P1}^{${i}}` : '', j ? `${P2}^{${j}}` : ''].filter(Boolean).join(' \\times ')}$`, 'Use log(AB) = log A + log B and log Aᵏ = k log A.'], errors: i && j ? [err('multiplied', ans.expr(ex(`${i * j}pq`), ['p', 'q']), 'Logs of a product add — they do not multiply.')] : [], solution: [md`$\log_{a} ${N1} = ${[i ? `${i === 1 ? '' : i}\\log_{a} ${P1}` : '', j ? `${j === 1 ? '' : j}\\log_{a} ${P2}` : ''].filter(Boolean).join(' + ')} = ${answerTex(E1)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`$\log_{a} \left(${arg2}\right)$`, answer: E2, scheme: [M1('Uses the subtraction law'), M1(md`Uses $\log_{a} a = 1$`), A1(md`$${answerTex(E2)}$`)], hints: ['Split the argument into factors and use the laws.', md`$\log_{a} a = 1$, so $\log_{a} a^{2} = 2$.`, 'A quotient gives a subtraction.'], solution: [md`$\log_{a}\left(${arg2}\right) = ${answerTex(E2)}$`] }),
      ],
      params: { P1, P2, N1, N2: N2.value, ka },
    };
  },
  verify(inst) {
    const { P1, P2, N1, N2, ka } = inst.params as Record<string, number>;
    const a = 1.7;
    const env = { p: Math.log(P1) / Math.log(a), q: Math.log(P2) / Math.log(a) };
    expectClose(evaluate((inst.parts[0].answer as ExprSpec).value, env), Math.log(N1) / Math.log(a), 'a');
    expectClose(evaluate((inst.parts[1].answer as ExprSpec).value, env), Math.log(N2 * a ** ka) / Math.log(a), 'b');
  },
});

const logEquation = defineTemplate({
  id: 'p1.14.log-equation-using-laws',
  family: 'p1.14.log-laws',
  title: 'Solve a logarithmic equation using the laws of logs',
  spec: ['P6.4', 'P6.5'],
  chapter: 'P1.14',
  sections: ['14.5', '14.6'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 5,
  time: 7,
  commands: ['Solve'],
  tags: ['logarithms', 'laws of logarithms', 'equations', 'quadratic'],
  generate(r) {
    const variant = r.pick(['sum', 'difference'] as const);
    if (variant === 'sum') {
      const b = r.pick([2, 3]);
      const n = r.int(3, b === 2 ? 7 : 4);
      const i = r.int(1, Math.floor((n - 1) / 2));
      const R = b ** i,
        S = b ** (n - i);
      const c = S - R;
      const L = ans.list([ans.exact(exq(R))], { v: 'x' });
      return {
        parts: [
          part({
            marks: 5,
            prompt: md`Solve $\log_{${b}} x + \log_{${b}} (x + ${c}) = ${n}$.`,
            answer: L,
            scheme: [M1(md`$\log_{${b}} x(x + ${c}) = ${n}$`), M1(md`$x(x + ${c}) = ${b}^{${n}}$`), M1(md`Solves $x^{2} + ${c}x - ${b ** n} = 0$`), A1(md`$x = ${R}$ or $x = ${-S}$`), A1(md`$x = ${R}$ only (rejects $x = ${-S}$ since $\log$ of a negative number is not defined)`, true)],
            hints: ['Combine the two logs into one using the addition law.', md`Then $x(x + ${c}) = ${b}^{${n}} = ${b ** n}$.`, 'Solve the quadratic — then check each root makes the original logs valid.'],
            errors: [err('kept-negative', ans.list([ans.exact(exq(R)), ans.exact(exq(-S))], { v: 'x' }), md`$x = ${-S}$ makes $\log_{${b}} x$ invalid — reject it.`, 4)],
            solution: [md`$\log_{${b}} x(x + ${c}) = ${n} \Rightarrow x^{2} + ${c}x - ${b ** n} = 0$`, md`$(x - ${R})(x + ${S}) = 0$, so $x = ${R}$ or $x = ${-S}$.`, md`$x > 0$ for $\log_{${b}} x$ to exist, so $${answerTex(L)}$`],
          }),
        ],
        params: { variant, b, n, c },
      };
    }
    const b = r.pick([2, 3, 5, 10]);
    const n = b === 10 ? 1 : r.int(1, 2);
    const B = b ** n;
    const p = r.int(1, Math.min(B - 1, 6)),
      d = r.int(1, 5),
      q = r.int(-6, 9);
    const x = Q.of(q + B * d, B - p);
    r.require(x.value > d && p * x.value + q > 0);
    const X = ans.list([ans.exact(exq(x))], { v: 'x' });
    const inner = `${p === 1 ? '' : p}x${q === 0 ? '' : sgn(q)}`;
    return {
      parts: [
        part({
          marks: 5,
          prompt: md`Solve $\log_{${b}} (${inner}) - \log_{${b}} (x - ${d}) = ${n}$.`,
          answer: X,
          scheme: [M1(md`$\log_{${b}} \dfrac{${inner}}{x - ${d}} = ${n}$`), M1(md`$\dfrac{${inner}}{x - ${d}} = ${B}$`), dM1('Multiplies out and solves the linear equation'), A1('Correct linear equation'), A1(md`$x = ${x.toLatex()}$`)],
          hints: ['Use the subtraction law to write the left-hand side as a single log.', md`Convert to index form: $\dfrac{${inner}}{x - ${d}} = ${b}^{${n}}$.`, 'Multiply both sides by (x − ' + d + ') and solve.'],
          errors: p === 1 ? [] : [err('logs-cancelled', ans.list([ans.exact(exq(Q.of(n - q - d, p - 1)))], { v: 'x' }), 'You cannot "cancel" the logs from a difference — combine them into one logarithm first.')],
          solution: [md`$\dfrac{${inner}}{x - ${d}} = ${B} \Rightarrow ${inner} = ${B}x - ${B * d}$`, md`$${B - p}x = ${q + B * d} \Rightarrow ${answerTex(X)}$`],
        }),
      ],
      params: { variant, b, n, p, q, d },
    };
  },
  verify(inst) {
    const P = inst.params as Record<string, number | string>;
    const xs = (inst.parts[0].answer as ListSpec).items.map(valOf);
    const lg = (v: number) => Math.log(v) / Math.log(P.b as number);
    for (const x of xs) {
      if (P.variant === 'sum') expectClose(lg(x) + lg(x + (P.c as number)), P.n as number, 'sum equation');
      else expectClose(lg((P.p as number) * x + (P.q as number)) - lg(x - (P.d as number)), P.n as number, 'difference equation');
    }
  },
});

// ---------------------------------------------------------------- 14.6 solving aˣ = b
const solveAx = defineTemplate({
  id: 'p1.14.solve-a-to-the-x',
  family: 'p1.14.solve-exponential',
  title: 'Solve aˣ = b and a^{px+q} = b using logarithms',
  spec: ['P6.5'],
  chapter: 'P1.14',
  sections: ['14.6'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 5,
  time: 5,
  commands: ['Solve'],
  tags: ['logarithms', 'exponential equations', 'calculator'],
  generate(r) {
    const notPow = (a: number, b: number) => Math.abs(Math.log(b) / Math.log(a) - Math.round(Math.log(b) / Math.log(a))) > 1e-9;
    const a = r.pick([2, 3, 5, 6, 7]),
      b = r.int(3, 80);
    r.require(notPow(a, b));
    const x1 = Math.log(b) / Math.log(a);
    const a2 = r.pick([2, 3, 4, 5, 7]),
      p = r.pick([2, 3, -1, 4]),
      q = r.int(-3, 3),
      b2 = r.int(5, 90);
    r.require(notPow(a2, b2));
    const x2 = (Math.log(b2) / Math.log(a2) - q) / p;
    const X1 = ans.num(x1, { sf: 3 }),
      X2 = ans.num(x2, { sf: 3 });
    const pw = `${p === 1 ? '' : p === -1 ? '-' : p}x${q === 0 ? '' : sgn(q)}`;
    return {
      stem: 'Solve, giving each answer to 3 significant figures,',
      parts: [
        part({ label: 'a', marks: 2, prompt: md`$${a}^{x} = ${b}$`, answer: X1, scheme: [M1(md`$x = \dfrac{\log ${b}}{\log ${a}}$ or $x = \log_{${a}} ${b}$`), A1(md`awrt $${fmtSF(x1, 3)}$`)], hints: ['Take logs of both sides.', md`$x\log ${a} = \log ${b}$`, md`Divide: $x = \dfrac{\log ${b}}{\log ${a}}$.`], errors: [err('flipped', ans.num(1 / x1, { sf: 3 }), md`It is $\dfrac{\log ${b}}{\log ${a}}$, not the other way up.`)], solution: [md`$x = \dfrac{\ln ${b}}{\ln ${a}} = ${answerTex(X1)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`$${a2}^{${pw}} = ${b2}$`, answer: X2, scheme: [M1(md`$(${pw})\log ${a2} = \log ${b2}$`), dM1('Rearranges for x'), A1(md`awrt $${fmtSF(x2, 3)}$`)], hints: ['Take logs of both sides and bring the power down.', md`$${pw} = \dfrac{\log ${b2}}{\log ${a2}} = ${fmtSF(Math.log(b2) / Math.log(a2), 5)}$`, 'Now solve the linear equation for x.'], solution: [md`$${pw} = \dfrac{\ln ${b2}}{\ln ${a2}} = ${fmtSF(Math.log(b2) / Math.log(a2), 5)}$`, md`$x = ${answerTex(X2)}$`] }),
      ],
      params: { a, b, a2, b2, p, q },
    };
  },
  verify(inst) {
    const { a, b, a2, b2, p, q } = inst.params as Record<string, number>;
    const x1 = valOf(inst.parts[0].answer as NumericSpec),
      x2 = valOf(inst.parts[1].answer as NumericSpec);
    expectClose(a ** x1, b, 'a');
    expectClose(a2 ** (p * x2 + q), b2, 'b');
  },
});

const hiddenQuad = defineTemplate({
  id: 'p1.14.exponential-hidden-quadratic',
  family: 'p1.14.solve-exponential',
  title: 'Exponential equations that reduce to a quadratic',
  spec: ['P6.5'],
  chapter: 'P1.14',
  sections: ['14.6', '14.7'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 6,
  time: 7,
  commands: ['Solve'],
  tags: ['exponential equations', 'quadratic', 'substitution', 'logarithms'],
  generate(r) {
    const variant = r.pick(['e', 'a', 'two'] as const);
    let eqTex: string, roots: Q[], base: number | 'e', quad: string;
    if (variant === 'e') {
      const r1 = r.int(1, 8),
        r2 = r.int(1, 9);
      r.require(r1 < r2);
      roots = [Q.of(r1), Q.of(r2)];
      base = 'e';
      eqTex = `e^{2x} - ${r1 + r2 === 1 ? '' : r1 + r2}e^{x} + ${r1 * r2} = 0`;
      quad = `y^{2} - ${r1 + r2}y + ${r1 * r2} = 0`;
    } else if (variant === 'a') {
      const a = r.pick([2, 3, 5]);
      const r1 = r.pick([1, a, a * a, 2, 3, 4, 5, 6, 7].filter((v) => v !== 0)),
        r2 = r.pick([a, a * a, 2, 3, 4, 6, 8, 10, 12]);
      r.require(r1 < r2);
      roots = [Q.of(r1), Q.of(r2)];
      base = a;
      eqTex = `${a}^{2x} - ${r1 + r2}\\left(${a}^{x}\\right) + ${r1 * r2} = 0`;
      quad = `y^{2} - ${r1 + r2}y + ${r1 * r2} = 0`;
    } else {
      const r1 = r.int(2, 9);
      roots = [Q.of(1, 2), Q.of(r1)];
      base = 2;
      eqTex = `2^{2x + 1} - ${2 * r1 + 1}\\left(2^{x}\\right) + ${r1} = 0`;
      quad = `2y^{2} - ${2 * r1 + 1}y + ${r1} = 0`;
    }
    const lnB = base === 'e' ? 1 : Math.log(base);
    const items = roots.map((y) => {
      const v = Math.log(y.value) / lnB;
      if (Math.abs(v - Math.round(v)) < 1e-9) return ans.exact(exq(Math.round(v)));
      if (base === 'e') return ans.exact(ex(lnQ(y)), ['exact']);
      return ans.num(v, { sf: 3 });
    });
    const L = ans.list(items, { v: 'x' });
    const yName = base === 'e' ? 'e^{x}' : `${base}^{x}`;
    const exactWanted = base === 'e';
    return {
      parts: [
        part({
          marks: 6,
          prompt: md`Solve $${eqTex}$, giving your answers ${exactWanted ? 'in exact form' : 'exactly where possible, otherwise to 3 significant figures'}.`,
          answer: L,
          scheme: [M1(md`Uses $y = ${yName}$ to form $${quad}$`), M1('Solves the quadratic'), A1(md`$y = ${roots.map((q) => q.toLatex()).join(',\\ ')}$`), M1(md`Takes logs: $x = ${base === 'e' ? '\\ln y' : `\\log_{${base}} y`}$`), A1('One correct value of x'), A1(md`$${answerTex(L)}$`)],
          hints: [md`Notice that $${base === 'e' ? 'e^{2x}' : `${base}^{2x}`} = \left(${yName}\right)^{2}$.${variant === 'two' ? ' Also $2^{2x+1} = 2 \\times 2^{2x}$.' : ''}`, md`Let $y = ${yName}$: $${quad}$.`, md`Solve for $y$, then solve $${yName} = y$ for each root.`],
          solution: [md`Let $y = ${yName}$: $${quad}$, so $y = ${roots.map((q) => q.toLatex()).join('$ or $y = ')}$.`, md`$${roots.map((q) => `${yName} = ${q.toLatex()}`).join(',\\ ')}$`, md`$${answerTex(L)}$`],
        }),
      ],
      params: { base: base === 'e' ? Math.E : base, roots: roots.map((q) => q.value) },
    };
  },
  verify(inst) {
    const { base, roots } = inst.params as { base: number; roots: number[] };
    const xs = (inst.parts[0].answer as ListSpec).items.map(valOf).sort((a, b) => a - b);
    const want = roots.map((y) => Math.log(y) / Math.log(base)).sort((a, b) => a - b);
    xs.forEach((x, i) => expectClose(x + 10, want[i] + 10, 'root', 1e-3));
  },
});

const bothSides = defineTemplate({
  id: 'p1.14.exponentials-both-sides',
  family: 'p1.14.solve-exponential',
  title: 'Solve a^{x+p} = b^{x+q}',
  spec: ['P6.5', 'P6.4'],
  chapter: 'P1.14',
  sections: ['14.6'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 5,
  time: 6,
  commands: ['Show that', 'Find'],
  tags: ['exponential equations', 'logarithms', 'laws of logarithms'],
  generate(r) {
    const [a, b] = r.shuffle([2, 3, 5, 7]).slice(0, 2);
    const p = r.int(-3, 3),
      q = r.int(-3, 3);
    const m = Q.of(b).pow(q).div(Q.of(a).pow(p)),
      n = Q.of(a, b);
    r.require(!m.eq(1));
    const xv = Math.log(m.value) / Math.log(n.value);
    const exactTex = `\\frac{${lnQ(m)}}{${lnQ(n)}}`;
    const XE = ans.exact(ex(exactTex), ['exact']);
    const XN = ans.num(xv, { sf: 3 });
    const pw = (v: number) => (v === 0 ? 'x' : `x ${v < 0 ? '-' : '+'} ${Math.abs(v)}`);
    return {
      parts: [
        part({ label: 'a', marks: 4, prompt: md`Show that the solution of $${a}^{${pw(p)}} = ${b}^{${pw(q)}}$ can be written as $x = \dfrac{\ln m}{\ln n}$, where $m$ and $n$ are rational numbers, and give the exact solution in this form.`, answer: XE, scheme: [M1(md`Takes logs: $(${pw(p)})\ln ${a} = (${pw(q)})\ln ${b}$`), M1('Collects the x terms on one side'), M1('Uses the laws of logarithms to combine'), A1(md`$x = ${exactTex}$`)], hints: ['Take natural logs of both sides and bring the powers down.', md`Expand: $x\ln ${a}${p === 0 ? '' : ` ${p < 0 ? '-' : '+'} ${Math.abs(p)}\\ln ${a}`} = x\ln ${b}${q === 0 ? '' : ` ${q < 0 ? '-' : '+'} ${Math.abs(q)}\\ln ${b}`}$`, md`Factorise $x(\ln ${a} - \ln ${b})$ and use the laws to combine each side into one logarithm.`], solution: [md`$(${pw(p)})\ln ${a} = (${pw(q)})\ln ${b}$`, md`$x(\ln ${a} - \ln ${b}) = ${sumTex([[q, `\\ln ${b}`], [-p, `\\ln ${a}`]])}$`, md`$x\ln\left(${n.toLatex()}\right) = ${lnQ(m)}$, so $x = ${answerTex(XE)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Hence find $x$ to 3 significant figures.`, answer: XN, scheme: [B1(md`awrt $${fmtSF(xv, 3)}$`)], hints: ['Evaluate your exact answer on a calculator.', 'Use the ln button for both logs.', 'Round to 3 significant figures.'], solution: [md`$x = ${answerTex(XN)}$`] }),
      ],
      params: { a, b, p, q },
    };
  },
  verify(inst) {
    const { a, b, p, q } = inst.params as Record<string, number>;
    const x = valOf(inst.parts[0].answer as ExactSpec);
    expectClose((x + p) * Math.log(a), (x + q) * Math.log(b), 'equation');
    expectClose(valOf(inst.parts[1].answer as NumericSpec), x, 'numeric');
  },
});

const templates: Template[] = [evaluateLogs, logIndex, lnInverse, singleLog, inTermsPQ, logEquation, solveAx, hiddenQuad, bothSides];
export default templates;
