/** Statistics Year 1, Chapter 5 — probability: Venn diagrams, mutually exclusive and independent events, tree diagrams, modelling. */
import { Q } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { esc } from '../../../engine/core/svg';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, ExactSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';

const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
const pq = (q: Q) => ans.exact(num(q), undefined, { allowDecimal: true });
const dTex = (q: Q) => fmtNum(q.value, 4);

/** Two-set Venn diagram with region labels: [only A, A and B, only B, neither]. */
export function venn2Svg(labels: [string, string, string, string], names: [string, string] = ['A', 'B']): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" class="dg" role="img">`,
    `<rect class="dg-curve" fill="none" x="8" y="8" width="304" height="184" rx="4"/>`,
    `<circle class="dg-curve" fill="none" cx="125" cy="100" r="70"/>`,
    `<circle class="dg-curve" fill="none" cx="195" cy="100" r="70"/>`,
    `<text class="dg-label" x="70" y="38">${esc(names[0])}</text>`,
    `<text class="dg-label" x="244" y="38">${esc(names[1])}</text>`,
    `<text class="dg-label" x="95" y="105" text-anchor="middle">${esc(labels[0])}</text>`,
    `<text class="dg-label" x="160" y="105" text-anchor="middle">${esc(labels[1])}</text>`,
    `<text class="dg-label" x="225" y="105" text-anchor="middle">${esc(labels[2])}</text>`,
    `<text class="dg-label" x="290" y="180" text-anchor="end">${esc(labels[3])}</text>`,
    `</svg>`,
  ].join('');
}

// ---------------------------------------------------------------- 5.2–5.3 Venn diagram with an unknown, and independence
const vennTwo = defineTemplate({
  id: 'sm1.5.venn-diagram-independence',
  family: 'sm1.5.venn',
  title: 'Venn diagram with an unknown probability; test for independence',
  spec: ['S3.1'],
  chapter: 'SM1.5',
  sections: ['5.2', '5.3'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 6,
  time: 7,
  commands: ['Find', 'Determine'],
  tags: ['probability', 'Venn diagrams', 'independent events'],
  generate(r) {
    const indep = r.bool();
    let pA: Q, pB: Q, both: Q;
    if (indep) {
      pA = r.pick([Q.of(2, 5), Q.of(1, 2), Q.of(3, 10), Q.of(3, 5), Q.of(1, 4), Q.of(7, 10)]);
      pB = r.pick([Q.of(1, 2), Q.of(2, 5), Q.of(1, 5), Q.of(3, 10), Q.of(1, 4), Q.of(3, 5)]);
      both = pA.mul(pB);
    } else {
      pA = Q.of(r.int(20, 60), 100);
      pB = Q.of(r.int(15, 55), 100);
      both = Q.of(r.int(5, Math.min(pA.n * (100 / pA.d), pB.n * (100 / pB.d)) - 3), 100);
      r.require(!both.eq(pA.mul(pB)));
    }
    const onlyA = pA.sub(both),
      onlyB = pB.sub(both),
      neither = Q.of(1).sub(onlyA).sub(onlyB).sub(both);
    r.require(onlyA.value > 0 && onlyB.value > 0 && neither.value > 0 && both.value > 0);
    r.require([onlyA, onlyB, both, neither].every((q) => (q.value * 10000) % 1 === 0 || Math.abs(q.value * 10000 - Math.round(q.value * 10000)) < 1e-9));
    const hide = r.pick([0, 3] as const); // unknown region: only A, or neither
    const labels: [string, string, string, string] = [dTex(onlyA), dTex(both), dTex(onlyB), dTex(neither)];
    labels[hide] = 'x';
    const X = pq(hide === 0 ? onlyA : neither);
    const U = pq(onlyA.add(onlyB).add(both)),
      Pb = pq(pB);
    const opts = [md`Independent, because $\mathrm{P}(A \cap B) = \mathrm{P}(A) \times \mathrm{P}(B)$`, md`Not independent, because $\mathrm{P}(A \cap B) \neq \mathrm{P}(A) \times \mathrm{P}(B)$`, md`Not independent, because $A$ and $B$ overlap`];
    const C: ChoiceSpec = ans.choice(opts, indep ? 0 : 1);
    return {
      stem: md`The Venn diagram shows the probabilities associated with two events $A$ and $B$.${hide === 0 ? md` Given that $\mathrm{P}(A) = ${dTex(pA)}$:` : ''}`,
      diagram: { svg: venn2Svg(labels), alt: `Venn diagram for events A and B with region probabilities: only A ${labels[0]}, A and B ${labels[1]}, only B ${labels[2]}, neither ${labels[3]}.` },
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find the value of $x$.`, answer: X, scheme: [B1(md`$x = ${dTex(hide === 0 ? onlyA : neither)}$`)], hints: hide === 0 ? [md`$\mathrm{P}(A)$ is the total of the regions inside circle $A$.`, md`$x + ${dTex(both)} = ${dTex(pA)}$`, 'Subtract.'] : ['All the probabilities in the diagram add up to 1.', md`$x = 1 - (${dTex(onlyA)} + ${dTex(both)} + ${dTex(onlyB)})$`, 'Subtract from 1.'], solution: [md`$x = ${answerTex(X)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Find $\mathrm{P}(B)$.`, answer: Pb, scheme: [B1(md`$${dTex(pB)}$`)], hints: ['Add the regions inside circle B.', md`$${dTex(both)} + ${dTex(onlyB)}$`, 'Both regions are inside B.'], solution: [md`$\mathrm{P}(B) = ${answerTex(Pb)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find $\mathrm{P}(A \cup B)$.`, answer: U, scheme: [M1('Adds the three regions inside the circles'), A1(md`$${dTex(onlyA.add(onlyB).add(both))}$`)], hints: ['A ∪ B means A or B or both.', 'Add all the regions inside either circle.', md`Or use $\mathrm{P}(A) + \mathrm{P}(B) - \mathrm{P}(A \cap B)$.`], errors: [err('double-count', pq(pA.add(pB)), md`Adding $\mathrm{P}(A) + \mathrm{P}(B)$ counts $A \cap B$ twice.`)], solution: [md`$${dTex(onlyA)} + ${dTex(both)} + ${dTex(onlyB)} = ${answerTex(U)}$`] }),
        part({ label: 'd', marks: 2, prompt: md`Determine whether $A$ and $B$ are independent.`, answer: C, scheme: [M1(md`Compares $\mathrm{P}(A) \times \mathrm{P}(B) = ${dTex(pA.mul(pB))}$ with $\mathrm{P}(A \cap B) = ${dTex(both)}$`), A1('Correct conclusion')], hints: [md`$A$ and $B$ are independent if $\mathrm{P}(A \cap B) = \mathrm{P}(A)\,\mathrm{P}(B)$.`, md`$\mathrm{P}(A) \times \mathrm{P}(B) = ${dTex(pA)} \times ${dTex(pB)}$`, 'Compare with the middle region.'], solution: [md`$${dTex(pA)} \times ${dTex(pB)} = ${dTex(pA.mul(pB))}$ ${indep ? '=' : '\\neq'} $${dTex(both)}$, so ${indep ? 'independent' : 'not independent'}.`] }),
      ],
      params: { pA: pA.value, pB: pB.value, both: both.value, indep },
    };
  },
  verify(inst) {
    const { pA, pB, both, indep } = inst.params as { pA: number; pB: number; both: number; indep: boolean };
    expectClose(valOf(inst.parts[2].answer as ExactSpec), pA + pB - both, 'union');
    expect(Math.abs(pA * pB - both) < 1e-12 === indep, 'independence');
  },
});

// ---------------------------------------------------------------- 5.3 mutually exclusive vs independent
const meVsIndep = defineTemplate({
  id: 'sm1.5.mutually-exclusive-or-independent',
  family: 'sm1.5.venn',
  title: 'Probabilities for mutually exclusive and for independent events',
  spec: ['S3.1'],
  chapter: 'SM1.5',
  sections: ['5.3'],
  level: 'AS',
  paper: [3],
  difficulty: 3,
  marks: 7,
  time: 8,
  commands: ['Find'],
  tags: ['probability', 'mutually exclusive', 'independent events', 'equations'],
  generate(r) {
    const pA = Q.of(r.int(1, 9), 10),
      pB = Q.of(r.int(1, 9), 10);
    r.require(pA.add(pB).value < 1);
    const ME = pq(pA.add(pB));
    const IN = pq(pA.add(pB).sub(pA.mul(pB)));
    const AnB = pq(pA.mul(Q.of(1).sub(pB)));
    // unknown: P(C) such that A and C independent with P(A ∪ C) = v
    const pC = Q.of(r.int(1, 9), 10);
    const v = pA.add(pC).sub(pA.mul(pC));
    const Cs = pq(pC);
    return {
      stem: md`Events $A$ and $B$ have $\mathrm{P}(A) = ${dTex(pA)}$ and $\mathrm{P}(B) = ${dTex(pB)}$.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find $\mathrm{P}(A \cup B)$ given that $A$ and $B$ are mutually exclusive.`, answer: ME, scheme: [B1(md`$${dTex(pA.add(pB))}$`)], hints: ['Mutually exclusive events cannot happen together.', md`So $\mathrm{P}(A \cap B) = 0$.`, md`$\mathrm{P}(A \cup B) = \mathrm{P}(A) + \mathrm{P}(B)$`], solution: [md`$\mathrm{P}(A \cup B) = ${dTex(pA)} + ${dTex(pB)} = ${answerTex(ME)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find $\mathrm{P}(A \cup B)$ given instead that $A$ and $B$ are independent.`, answer: IN, scheme: [M1(md`$\mathrm{P}(A \cap B) = ${dTex(pA)} \times ${dTex(pB)}$`), A1(md`$${dTex(pA.add(pB).sub(pA.mul(pB)))}$`)], hints: [md`Independent: $\mathrm{P}(A \cap B) = \mathrm{P}(A)\mathrm{P}(B)$.`, md`$\mathrm{P}(A \cup B) = \mathrm{P}(A) + \mathrm{P}(B) - \mathrm{P}(A \cap B)$`, 'Substitute.'], errors: [err('treated-as-me', pq(pA.add(pB)), 'Independent events can happen together — subtract P(A ∩ B).')], solution: [md`$${dTex(pA)} + ${dTex(pB)} - ${dTex(pA.mul(pB))} = ${answerTex(IN)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`For independent $A$ and $B$, find $\mathrm{P}(A \cap B')$.`, answer: AnB, scheme: [B1(md`$${dTex(pA)} \times ${dTex(Q.of(1).sub(pB))} = ${dTex(pA.mul(Q.of(1).sub(pB)))}$`)], hints: ["If A and B are independent, so are A and B′.", md`$\mathrm{P}(B') = 1 - ${dTex(pB)}$`, 'Multiply.'], solution: [md`$${dTex(pA)} \times ${dTex(Q.of(1).sub(pB))} = ${answerTex(AnB)}$`] }),
        part({ label: 'd', marks: 3, prompt: md`Another event $C$ is independent of $A$, and $\mathrm{P}(A \cup C) = ${dTex(v)}$. Find $\mathrm{P}(C)$.`, answer: Cs, scheme: [M1(md`$${dTex(v)} = ${dTex(pA)} + c - ${dTex(pA)}c$`), dM1('Solves the linear equation'), A1(md`$${dTex(pC)}$`)], hints: [md`Let $\mathrm{P}(C) = c$. Then $\mathrm{P}(A \cap C) = ${dTex(pA)}c$.`, md`$\mathrm{P}(A \cup C) = ${dTex(pA)} + c - ${dTex(pA)}c$`, 'Collect the c terms and solve.'], solution: [md`$${dTex(v)} = ${dTex(pA)} + ${dTex(Q.of(1).sub(pA))}c \Rightarrow c = ${answerTex(Cs)}$`] }),
      ],
      params: { pA: pA.value, pB: pB.value, v: v.value },
    };
  },
  verify(inst) {
    const { pA, pB, v } = inst.params as Record<string, number>;
    expectClose(valOf(inst.parts[1].answer as ExactSpec), 1 - (1 - pA) * (1 - pB), 'independent union');
    const c = valOf(inst.parts[3].answer as ExactSpec);
    expectClose(1 - (1 - pA) * (1 - c), v, 'P(C)');
  },
});

// ---------------------------------------------------------------- 5.4 tree diagrams without replacement
const treeNoReplace = defineTemplate({
  id: 'sm1.5.tree-diagram-without-replacement',
  family: 'sm1.5.tree-diagrams',
  title: 'Two selections without replacement: tree diagram probabilities',
  spec: ['S3.1', 'S3.2'],
  chapter: 'SM1.5',
  sections: ['5.4'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 6,
  time: 7,
  commands: ['Find'],
  tags: ['probability', 'tree diagrams', 'without replacement'],
  generate(r) {
    const ctx = r.pick([
      ['A bag contains', 'red', 'blue', 'counters'],
      ['A box contains', 'milk', 'dark', 'chocolates'],
      ['A drawer contains', 'black', 'white', 'socks'],
      ['A jar contains', 'orange', 'lemon', 'sweets'],
    ]);
    const a = r.int(2, 9),
      b = r.int(2, 9);
    const n = a + b;
    const both1 = Q.of(a * (a - 1), n * (n - 1)),
      diff = Q.of(2 * a * b, n * (n - 1)),
      atLeast2 = Q.of(1).sub(Q.of(a * (a - 1), n * (n - 1)));
    const S1 = ans.exact(num(both1)),
      S2 = ans.exact(num(diff)),
      S3 = ans.exact(num(atLeast2));
    return {
      stem: md`${ctx[0]} $${a}$ ${ctx[1]} ${ctx[3]} and $${b}$ ${ctx[2]} ${ctx[3]}. Two ${ctx[3]} are taken at random, one after the other, without replacement.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the probability that both are ${ctx[1]}.`, answer: S1, scheme: [M1(md`$\dfrac{${a}}{${n}} \times \dfrac{${a - 1}}{${n - 1}}$`), A1(md`$${both1.toLatex()}$`)], hints: ['Draw a tree diagram.', md`After one ${ctx[1]} is taken there are $${a - 1}$ ${ctx[1]} left out of $${n - 1}$.`, 'Multiply along the branches.'], errors: [err('with-replacement', ans.exact(num(Q.of(a * a, n * n))), 'Without replacement, the second probability changes.')], solution: [md`$\dfrac{${a}}{${n}} \times \dfrac{${a - 1}}{${n - 1}} = ${answerTex(S1)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the probability that one of each colour is taken.`, answer: S2, scheme: [M1('Two branches: one way round, then the other'), A1(md`$${diff.toLatex()}$`)], hints: ['There are two orders: first then second, or the reverse.', md`$\dfrac{${a}}{${n}} \times \dfrac{${b}}{${n - 1}} + \dfrac{${b}}{${n}} \times \dfrac{${a}}{${n - 1}}$`, 'Add the two branch probabilities.'], errors: [err('one-order', ans.exact(num(Q.of(a * b, n * (n - 1)))), 'There are two orders — count both.', 1)], solution: [md`$2 \times \dfrac{${a}}{${n}} \times \dfrac{${b}}{${n - 1}} = ${answerTex(S2)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the probability that at least one ${ctx[2].replace(/s$/, '')} ${ctx[3].replace(/s$/, '')} is taken.`, answer: S3, scheme: [M1(md`$1 - \mathrm{P}(\text{both ${ctx[1]}})$`), A1(md`$${atLeast2.toLatex()}$`)], hints: ['"At least one" is easiest as 1 − P(none).', `None means both are ${ctx[1]}.`, 'Use part (a).'], solution: [md`$1 - ${both1.toLatex()} = ${answerTex(S3)}$`] }),
      ],
      params: { a, b },
    };
  },
  verify(inst) {
    const { a, b } = inst.params as Record<string, number>;
    // brute-force over ordered pairs
    const items = [...Array(a).fill('A'), ...Array(b).fill('B')];
    let AA = 0,
      AB = 0,
      tot = 0;
    for (let i = 0; i < items.length; i++)
      for (let j = 0; j < items.length; j++) {
        if (i === j) continue;
        tot++;
        if (items[i] === 'A' && items[j] === 'A') AA++;
        if (items[i] !== items[j]) AB++;
      }
    expectClose(valOf(inst.parts[0].answer as ExactSpec), AA / tot, 'both');
    expectClose(valOf(inst.parts[1].answer as ExactSpec), AB / tot, 'one of each');
    expectClose(valOf(inst.parts[2].answer as ExactSpec), 1 - AA / tot, 'at least one');
  },
});

// ---------------------------------------------------------------- modelling with probability
const independenceModel = defineTemplate({
  id: 'sm1.5.independence-model-critique',
  family: 'sm1.5.modelling',
  title: 'A probability model assuming independence, and a critique of the assumption',
  spec: ['S3.3', 'S3.1'],
  chapter: 'SM1.5',
  sections: ['5.3', '5.4'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 6,
  time: 7,
  commands: ['Find', 'Give a reason'],
  tags: ['probability', 'modelling', 'independence', 'assumptions'],
  generate(r) {
    const C = r.pick([
      { what: 'A train is late on any given day with probability', thing: 'late', unit: 'days', why: 'Bad weather or engineering works can affect several days in a row, so lateness on different days is not independent' },
      { what: 'A footballer scores in any given match with probability', thing: 'scores', unit: 'matches', why: 'Form, injuries and the strength of opponents mean results in different matches may be linked, and the probability may change' },
      { what: 'A machine produces a faulty item with probability', thing: 'faulty', unit: 'items', why: 'Faults may come in clusters (for example if a machine part wears), so items are not independent' },
      { what: 'It rains on any given day in a holiday resort with probability', thing: 'rains', unit: 'days', why: 'Weather systems last several days, so rain on one day makes rain the next day more likely' },
    ]);
    const p = r.pick([0.05, 0.1, 0.15, 0.2, 0.25, 0.3]);
    const n = r.int(3, 7),
      k = r.int(2, 3);
    const all = p ** k,
      atLeast = 1 - (1 - p) ** n,
      firstOn = (1 - p) ** (k - 1) * p;
    const A1s = ans.num(all, { sf: 3 }, { exactAllowed: true }),
      A2s = ans.num(atLeast, { sf: 3 }, { exactAllowed: true }),
      A3s = ans.num(firstOn, { sf: 3 }, { exactAllowed: true });
    const opts = [C.why, 'The probability is too small to be useful', 'There are not enough trials'];
    const Ch: ChoiceSpec = ans.choice(opts, 0);
    const th = C.thing === 'late' ? 'it is late' : C.thing === 'scores' ? 'the footballer scores' : C.thing === 'faulty' ? 'an item is faulty' : 'it rains';
    return {
      stem: md`${C.what} $${p}$, independently of other ${C.unit}.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find the probability that ${th} on each of $${k}$ particular ${C.unit}.`, answer: A1s, scheme: [B1(md`$${p}^{${k}} = ${fmtSF(all, 3)}$`)], hints: ['Independent events: multiply.', md`$${p} \times ${p}${k === 3 ? ` \\times ${p}` : ''}$`, 'Give 3 s.f. or an exact value.'], solution: [md`$${p}^{${k}} = ${answerTex(A1s)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the probability that this happens on at least one of $${n}$ ${C.unit}.`, answer: A2s, scheme: [M1(md`$1 - (1 - ${p})^{${n}}$`), A1(md`awrt $${fmtSF(atLeast, 3)}$`)], hints: ['At least one = 1 − P(none).', md`P(none) $= ${fmtNum(1 - p)}^{${n}}$`, 'Subtract from 1.'], errors: [err('n-times-p', ans.num(n * p, { sf: 3 }), 'You cannot just multiply n by p — that can even exceed 1.')], solution: [md`$1 - ${fmtNum(1 - p)}^{${n}} = ${answerTex(A2s)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the probability that the first time this happens is on the ${k === 2 ? '2nd' : '3rd'} of the ${C.unit}.`, answer: A3s, scheme: [M1(md`$(1 - ${p})^{${k - 1}} \times ${p}$`), A1(md`awrt $${fmtSF(firstOn, 3)}$`)], hints: [`The first ${k - 1} must not have it happen.`, md`$${fmtNum(1 - p)}^{${k - 1}} \times ${p}$`, 'Multiply.'], solution: [md`$${fmtNum(1 - p)}^{${k - 1}} \times ${p} = ${answerTex(A3s)}$`] }),
        part({ label: 'd', marks: 1, prompt: md`Give a reason why the assumption of independence may not be valid.`, answer: Ch, scheme: [B1('Valid reason in context')], hints: ['Could one day (or item) affect the next?', 'Think about what causes the event.', 'Would the probability stay the same each time?'], solution: [C.why] }),
      ],
      params: { p, n, k },
    };
  },
  verify(inst) {
    const { p, n, k } = inst.params as Record<string, number>;
    // simulate exactly by enumeration of outcomes over n trials
    let at = 0;
    for (let mask = 0; mask < 1 << n; mask++) {
      let pr = 1;
      for (let i = 0; i < n; i++) pr *= mask & (1 << i) ? p : 1 - p;
      if (mask) at += pr;
    }
    expectClose(valOf(inst.parts[1].answer as NumericSpec), at, 'at least one');
    expectClose(valOf(inst.parts[0].answer as NumericSpec), p ** k, 'all');
  },
});

const templates: Template[] = [vennTwo, meVsIndep, treeNoReplace, independenceModel];
export default templates;
