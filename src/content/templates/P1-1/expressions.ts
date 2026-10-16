/** Pure Year 1, Chapter 1 — algebraic expressions: index laws, negative/fractional indices, surds. */
import { Q, intRoot, surdSimplify } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, ExprSpec, ListSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { coefBody, ex, sumTex } from '../shared/calculus';

const xp = (e: Q) => (e.isZero ? '' : e.eq(1) ? 'x' : `x^{${e.toLatex()}}`);

const simplifyIndices = defineTemplate({
  id: 'p1.1.simplify-index-laws',
  family: 'p1.1.indices',
  title: 'Simplify using the laws of indices',
  spec: ['P2.1'],
  chapter: 'P1.1',
  sections: ['1.1', '1.4'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 3,
  time: 3,
  commands: ['Simplify'],
  tags: ['indices', 'algebra'],
  generate(r) {
    const a = r.int(2, 5),
      p = r.pick([Q.of(2), Q.of(3), Q.of(1, 2), Q.of(-1)]),
      q = r.pick([2, 3]);
    const b = r.int(2, 6),
      s = r.pick([Q.of(1, 2), Q.of(3), Q.of(-2), Q.of(5)]);
    const c = r.int(2, 9);
    // (a x^p)^q × c x^1 ÷ (b x^s)
    const coef = Q.of(a ** q * c, b);
    const power = p.mul(q).add(1).sub(s);
    r.require(!power.isZero && coef.d <= 6);
    const lhs = `\\frac{\\left(${a}${xp(p)}\\right)^{${q}} \\times ${c}x}{${b}${xp(s)}}`;
    const E: ExprSpec = ans.expr(ex(coefBody(coef, xp(power))), ['x'], { domain: { x: [0.3, 3] } });
    return {
      parts: [
        part({
          marks: 3,
          prompt: md`Simplify fully $${lhs}$, giving your answer in the form $kx^{n}$.`,
          answer: E,
          scheme: [M1(md`$\left(${a}${xp(p)}\right)^{${q}} = ${a ** q}${xp(p.mul(q))}$`), M1('Adds/subtracts powers correctly'), A1(md`$${answerTex(E)}$`)],
          hints: ['Deal with the bracket first: raise the number and the power of x separately.', md`$(x^{m})^{n} = x^{mn}$, $x^{m} \times x^{n} = x^{m+n}$, $x^{m} \div x^{n} = x^{m-n}$.`, md`$\left(${a}${xp(p)}\right)^{${q}} = ${a ** q}${xp(p.mul(q))}$`],
          errors: [err('bracket-coef', ans.expr(ex(coefBody(Q.of(a * c, b), xp(power))), ['x'], { domain: { x: [0.3, 3] } }), md`Raise the number in the bracket to the power too: $${a}^{${q}} = ${a ** q}$.`, 2)],
          solution: [md`$\left(${a}${xp(p)}\right)^{${q}} = ${a ** q}${xp(p.mul(q))}$`, md`$\dfrac{${a ** q}${xp(p.mul(q))} \times ${c}x}{${b}${xp(s)}} = ${answerTex(E)}$`],
        }),
      ],
      params: { a, p: p.value, q, b, s: s.value, c },
    };
  },
  verify(inst) {
    const { a, p, q, b, s, c } = inst.params as Record<string, number>;
    const e = (inst.parts[0].answer as ExprSpec).value;
    for (const x of [0.7, 1.9, 2.6]) expectClose(evaluate(e, { x }), ((a * x ** p) ** q * c * x) / (b * x ** s), 'value');
  },
});

const evaluateFractional = defineTemplate({
  id: 'p1.1.evaluate-fractional-negative-index',
  family: 'p1.1.indices',
  title: 'Evaluate negative and fractional powers exactly',
  spec: ['P2.1'],
  chapter: 'P1.1',
  sections: ['1.4'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 2,
  time: 2,
  commands: ['Find', 'Evaluate'],
  tags: ['indices', 'fractional powers', 'exact'],
  generate(r) {
    const root = r.pick([2, 3]);
    const base = r.pick(root === 2 ? [[4, 9], [9, 16], [25, 4], [16, 81], [49, 36], [1, 4], [64, 25]] : [[8, 27], [27, 64], [1, 8], [125, 8], [64, 27], [8, 125]]);
    const pw = r.pick([1, 2, 3].filter((x) => x % root !== 0));
    const neg = r.bool(0.7);
    const e = Q.of(neg ? -pw : pw, root);
    const val = Q.of(base[0], base[1]).powQ(e)!;
    r.require(val.n <= 1000 && val.d <= 1000);
    const baseTex = base[1] === 1 ? `${base[0]}` : `\\left(\\frac{${base[0]}}{${base[1]}}\\right)`;
    const A: ExactSpec = ans.exact(num(val), ['exact']);
    const rootVal = Q.of(intRoot(base[0], root)!, intRoot(base[1], root)!);
    return {
      parts: [
        part({
          marks: 2,
          prompt: md`Find the exact value of $${baseTex}^{${e.toLatex()}}$.`,
          answer: A,
          scheme: [M1(md`Finds the ${root === 2 ? 'square' : 'cube'} root: $${rootVal.toLatex()}$${neg ? ' and deals with the negative (reciprocal)' : ''}`), A1(md`$${answerTex(A)}$`)],
          hints: [neg ? 'A negative power means take the reciprocal: flip the fraction.' : 'The denominator of the power is a root.', md`$a^{\frac{m}{n}} = \left(\sqrt[n]{a}\right)^{m}$`, md`$\sqrt[${root}]{${base[0]}/${base[1]}} = ${rootVal.toLatex()}$`],
          errors: [err('ignored-negative', ans.exact(num(val.inv())), 'A negative power means you take the reciprocal.')],
          solution: [md`$${baseTex}^{${e.toLatex()}} = \left(${rootVal.toLatex()}\right)^{${neg ? -pw : pw}} = ${answerTex(A)}$`],
        }),
      ],
      params: { base, e: e.value },
    };
  },
  verify(inst) {
    const { base, e } = inst.params as { base: number[]; e: number };
    expectClose(evaluate((inst.parts[0].answer as ExactSpec).value), (base[0] / base[1]) ** e, 'power');
  },
});

const indexEquation = defineTemplate({
  id: 'p1.1.solve-index-equation',
  family: 'p1.1.indices',
  title: 'Solve an equation by writing both sides as powers of the same base',
  spec: ['P2.1', 'P6.5'],
  chapter: 'P1.1',
  sections: ['1.4'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 3,
  time: 4,
  commands: ['Solve'],
  tags: ['indices', 'equations', 'exponentials'],
  generate(r) {
    const base = r.pick([2, 3, 5]);
    const m = r.pick(base === 2 ? [2, 3, 4] : [2, 3]);
    const n = r.pick([1, 2, 3].filter((x) => x !== m));
    // (base^m)^{ax + b} = (base^n)^{cx + d}
    const a = r.intNZ(-3, 4),
      b = r.int(-5, 5),
      c = r.intNZ(-3, 4),
      d = r.int(-5, 5);
    const lhsA = m * a,
      rhsA = n * c;
    r.require(lhsA !== rhsA);
    const x = Q.of(n * d - m * b, lhsA - rhsA);
    r.require(x.d <= 6 && Math.abs(x.value) < 30);
    const B1v = base ** m,
      B2v = base ** n;
    const A = ans.list([ans.exact(num(x))], { v: 'x' });
    const pw = (k: number, p: number, q: number) => (p === 0 && q === 0 ? '' : `${k}^{${sumTex([[p, 'x'], [q, '']])}}`);
    return {
      parts: [
        part({
          marks: 3,
          prompt: md`Solve $${pw(B1v, a, b)} = ${pw(B2v, c, d)}$.`,
          answer: A,
          scheme: [M1(md`Writes both sides as powers of $${base}$`), M1(md`$${m}(${sumTex([[a, 'x'], [b, '']])}) = ${n}(${sumTex([[c, 'x'], [d, '']])})$`), A1(md`$x = ${x.toLatex()}$`)],
          hints: [md`$${B1v} = ${base}^{${m}}$ and $${B2v} = ${base}^{${n}}$.`, 'When the bases are the same, the powers must be equal.', md`$${base}^{${m}(${sumTex([[a, 'x'], [b, '']])})} = ${base}^{${n}(${sumTex([[c, 'x'], [d, '']])})}$`],
          solution: [md`$${base}^{${m}(${sumTex([[a, 'x'], [b, '']])})} = ${base}^{${n}(${sumTex([[c, 'x'], [d, '']])})}$`, md`$${sumTex([[m * a, 'x'], [m * b, '']])} = ${sumTex([[n * c, 'x'], [n * d, '']])} \Rightarrow ${answerTex(A)}$`],
        }),
      ],
      params: { B1v, B2v, a, b, c, d },
    };
  },
  verify(inst) {
    const { B1v, B2v, a, b, c, d } = inst.params as Record<string, number>;
    const x = evaluate(((inst.parts[0].answer as ListSpec).items[0] as ExactSpec).value);
    expectClose(Math.log(B1v) * (a * x + b), Math.log(B2v) * (c * x + d), 'both sides equal');
  },
});

const powersForm = defineTemplate({
  id: 'p1.1.write-as-sum-of-powers',
  family: 'p1.1.indices',
  title: 'Write a fraction as a sum of powers of x',
  spec: ['P2.1'],
  chapter: 'P1.1',
  sections: ['1.4'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 3,
  time: 3,
  commands: ['Express', 'Write down'],
  tags: ['indices', 'algebraic fractions', 'surds'],
  generate(r) {
    const k = r.pick([1, 2, 3, 4]);
    const e1 = r.int(2, 4),
      c1 = r.intNZ(-6, 8) * k,
      c2 = r.intNZ(-9, 9);
    const den = r.pick(['\\sqrt{x}', 'x\\sqrt{x}', 'x^{2}']);
    const dPow = den === '\\sqrt{x}' ? Q.of(1, 2) : den === 'x\\sqrt{x}' ? Q.of(3, 2) : Q.of(2);
    const numTex = sumTex([[c1, `x^{${e1}}`], [c2, '']]);
    const denTex = `${k === 1 ? '' : k}${den}`;
    const ansTex = sumTex([[Q.of(c1, k), xp(Q.of(e1).sub(dPow))], [Q.of(c2, k), xp(dPow.neg())]]);
    const E = ans.expr(ex(ansTex), ['x'], { domain: { x: [0.3, 3] } });
    return {
      parts: [
        part({
          marks: 3,
          prompt: md`Write $\dfrac{${numTex}}{${denTex}}$ in the form $ax^{p} + bx^{q}$, where $a$, $b$, $p$ and $q$ are constants.`,
          answer: E,
          scheme: [M1(md`Writes the denominator as $${k === 1 ? '' : k}x^{${dPow.toLatex()}}$`), A1('One term correct'), A1(md`$${answerTex(E)}$`)],
          hints: [md`$${den} = x^{${dPow.toLatex()}}$`, 'Split the fraction and divide each term separately.', md`$\dfrac{x^{m}}{x^{n}} = x^{m - n}$`],
          errors: [err('only-first', ans.expr(ex(sumTex([[Q.of(c1, k), xp(Q.of(e1).sub(dPow))], [Q.of(c2, k), '']])), ['x'], { domain: { x: [0.3, 3] } }), 'Divide every term of the numerator by the denominator.', 1)],
          solution: [md`$${den} = x^{${dPow.toLatex()}}$`, md`$\dfrac{${numTex}}{${denTex}} = ${answerTex(E)}$`],
        }),
      ],
      params: { c1, c2, e1, k, d: dPow.value },
    };
  },
  verify(inst) {
    const { c1, c2, e1, k, d } = inst.params as Record<string, number>;
    const e = (inst.parts[0].answer as ExprSpec).value;
    for (const x of [0.5, 1.7, 2.8]) expectClose(evaluate(e, { x }), (c1 * x ** e1 + c2) / (k * x ** d), 'identity');
  },
});

function surdTex(p: Q, q: Q, c: number) {
  return sumTex([[p, ''], [q, `\\sqrt{${c}}`]]);
}

const simplifySurds = defineTemplate({
  id: 'p1.1.simplify-surds',
  family: 'p1.1.surds',
  title: 'Simplify a sum of surds',
  spec: ['P2.2'],
  chapter: 'P1.1',
  sections: ['1.5'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 1,
  marks: 2,
  time: 2,
  commands: ['Simplify'],
  tags: ['surds'],
  generate(r) {
    const c = r.pick([2, 3, 5, 6, 7]);
    const ks = r.distinct(3, 1, 6);
    const signs = [1, r.sign(), r.sign()];
    const parts = ks.map((k) => k * k * c);
    const total = ks.reduce((s, k, i) => s + signs[i] * k, 0);
    r.require(total !== 0);
    const tex = parts.map((p, i) => `${i === 0 ? '' : signs[i] < 0 ? ' - ' : ' + '}\\sqrt{${p}}`).join('');
    const A = ans.exact(ex(sumTex([[total, `\\sqrt{${c}}`]])), ['exact', 'surd']);
    return {
      parts: [
        part({
          marks: 2,
          prompt: md`Simplify $${tex}$, giving your answer in the form $k\sqrt{${c}}$.`,
          answer: A,
          scheme: [M1(md`Writes each surd as a multiple of $\sqrt{${c}}$`), A1(md`$${answerTex(A)}$`)],
          hints: [md`Look for square factors: each number is a square times $${c}$.`, md`$\sqrt{ab} = \sqrt{a}\sqrt{b}$`, md`$\sqrt{${parts[0]}} = ${ks[0]}\sqrt{${c}}$`],
          solution: [md`$${parts.map((p, i) => `${i === 0 ? '' : signs[i] < 0 ? ' - ' : ' + '}${ks[i] === 1 ? '' : ks[i]}\\sqrt{${c}}`).join('')} = ${answerTex(A)}$`],
        }),
      ],
      params: { parts, signs },
    };
  },
  verify(inst) {
    const { parts, signs } = inst.params as { parts: number[]; signs: number[] };
    expectClose(evaluate((inst.parts[0].answer as ExactSpec).value), parts.reduce((s, p, i) => s + signs[i] * Math.sqrt(p), 0), 'value');
  },
});

const rationalise = defineTemplate({
  id: 'p1.1.rationalise-denominator',
  family: 'p1.1.surds',
  title: 'Rationalise the denominator',
  spec: ['P2.2'],
  chapter: 'P1.1',
  sections: ['1.6'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 3,
  time: 4,
  commands: ['Simplify', 'Express'],
  tags: ['surds', 'rationalising'],
  generate(r) {
    const c = r.pick([2, 3, 5, 6, 7]);
    const a = r.int(1, 6),
      b = r.intNZ(-3, 3),
      d = r.int(1, 5),
      e = r.intNZ(-2, 2);
    // (a + b√c)/(d + e√c) = (a + b√c)(d − e√c)/(d² − e²c)
    const den = d * d - e * e * c;
    r.require(den !== 0);
    const p = Q.of(a * d - b * e * c, den),
      q = Q.of(b * d - a * e, den);
    r.require(!q.isZero);
    const top = surdTex(Q.of(a), Q.of(b), c),
      bottom = surdTex(Q.of(d), Q.of(e), c);
    const A = ans.exact(ex(surdTex(p, q, c)), ['exact', 'surd']);
    return {
      parts: [
        part({
          marks: 3,
          prompt: md`Write $\dfrac{${top}}{${bottom}}$ in the form $p + q\sqrt{${c}}$, where $p$ and $q$ are rational numbers.`,
          answer: A,
          scheme: [M1(md`Multiplies numerator and denominator by $${surdTex(Q.of(d), Q.of(-e), c)}$`), A1(md`Denominator $= ${den}$`), A1(md`$${answerTex(A)}$`)],
          hints: ['Multiply top and bottom by the conjugate of the denominator.', md`The conjugate of $${bottom}$ is $${surdTex(Q.of(d), Q.of(-e), c)}$.`, md`$(${bottom})(${surdTex(Q.of(d), Q.of(-e), c)}) = ${d * d} - ${e * e * c} = ${den}$`],
          errors: [err('decimal', ans.num(p.value + q.value * Math.sqrt(c), { sf: 3 }), 'Give the exact answer in the form p + q√c.', 2)],
          solution: [md`$\dfrac{(${top})(${surdTex(Q.of(d), Q.of(-e), c)})}{${den}} = \dfrac{${surdTex(Q.of(a * d - b * e * c), Q.of(b * d - a * e), c)}}{${den}} = ${answerTex(A)}$`],
        }),
      ],
      params: { a, b, c, d, e },
    };
  },
  verify(inst) {
    const { a, b, c, d, e } = inst.params as Record<string, number>;
    expectClose(evaluate((inst.parts[0].answer as ExactSpec).value), (a + b * Math.sqrt(c)) / (d + e * Math.sqrt(c)), 'value');
  },
});

const expandSurds = defineTemplate({
  id: 'p1.1.expand-surd-brackets',
  family: 'p1.1.surds',
  title: 'Expand brackets with surds',
  spec: ['P2.2'],
  chapter: 'P1.1',
  sections: ['1.5'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 2,
  time: 3,
  commands: ['Expand', 'Simplify'],
  tags: ['surds', 'expanding brackets'],
  generate(r) {
    const c = r.pick([2, 3, 5, 7, 11]);
    const a = r.intNZ(-5, 6),
      b = r.intNZ(-4, 4),
      d = r.intNZ(-5, 6),
      e = r.intNZ(-4, 4);
    const p = a * d + b * e * c,
      q = a * e + b * d;
    r.require(q !== 0);
    const A = ans.exact(ex(surdTex(Q.of(p), Q.of(q), c)), ['exact', 'surd']);
    const [s1, s2] = [surdTex(Q.of(a), Q.of(b), c), surdTex(Q.of(d), Q.of(e), c)];
    return {
      parts: [
        part({
          marks: 2,
          prompt: md`Expand and simplify $\left(${s1}\right)\left(${s2}\right)$.`,
          answer: A,
          scheme: [M1('Four terms from the expansion'), A1(md`$${answerTex(A)}$`)],
          hints: ['Multiply every term in the first bracket by every term in the second.', md`$\sqrt{${c}} \times \sqrt{${c}} = ${c}$`, 'Collect the whole numbers and the √ terms separately.'],
          errors: [err('root-squared', ans.exact(ex(surdTex(Q.of(a * d + b * e), Q.of(q), c))), md`$\sqrt{${c}}\times\sqrt{${c}} = ${c}$, not $1$.`, 1)],
          solution: [
            md`$= ${sumTex([[a * d, ''], [a * e, `\sqrt{${c}}`], [b * d, `\sqrt{${c}}`], [b * e * c, '']])}$`,
            md`$= ${answerTex(A)}$`,
          ],
        }),
      ],
      params: { a, b, c, d, e },
    };
  },
  verify(inst) {
    const { a, b, c, d, e } = inst.params as Record<string, number>;
    expectClose(evaluate((inst.parts[0].answer as ExactSpec).value), (a + b * Math.sqrt(c)) * (d + e * Math.sqrt(c)), 'value');
    expect(surdSimplify(c)[0] === 1, 'square-free');
  },
});

void B1;

const templates: Template[] = [simplifyIndices, evaluateFractional, indexEquation, powersForm, simplifySurds, rationalise, expandSurds];
export default templates;
