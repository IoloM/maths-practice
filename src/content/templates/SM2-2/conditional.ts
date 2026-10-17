/** Statistics Year 2, Chapter 2 — conditional probability: two-way tables, Venn diagrams, trees, probability formulae, modelling. */
import { Q } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { esc } from '../../../engine/core/svg';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, ExactSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';

const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
const fq = (q: Q) => ans.exact(num(q), undefined, { allowDecimal: true });
const pct = (x: number) => `${fmtNum(x * 100)}\\%`;

// ---------------------------------------------------------------- 2.2 two-way tables
const TABLES = [
  { what: 'A survey of students records their year group and their favourite sport.', rows: ['Year 12', 'Year 13'], cols: ['Football', 'Netball', 'Swimming'] },
  { what: 'Customers at a café are classified by age group and drink ordered.', rows: ['Under 30', '30 or over'], cols: ['Coffee', 'Tea', 'Juice'] },
  { what: 'Members of a club are classified by how they travel to meetings and whether they are adults or juniors.', rows: ['Adult', 'Junior'], cols: ['Car', 'Bus', 'Walk'] },
];

const twoWay = defineTemplate({
  id: 'sm2.2.two-way-table-conditional',
  family: 'sm2.2.conditional',
  title: 'Conditional probability from a two-way table, and independence',
  spec: ['S3.2', 'S3.1'],
  chapter: 'SM2.2',
  sections: ['2.2'],
  level: 'A2',
  paper: [3],
  difficulty: 2,
  marks: 6,
  time: 7,
  commands: ['Find', 'Determine'],
  tags: ['conditional probability', 'two-way tables', 'independence'],
  generate(r) {
    const T = r.pick(TABLES);
    const indep = r.bool(0.35);
    let cells: number[][];
    if (indep) {
      const rowT = [r.int(2, 6), r.int(2, 6)],
        colT = [r.int(1, 5), r.int(1, 5), r.int(1, 5)];
      const f = r.pick([2, 3, 4, 5]);
      cells = rowT.map((a) => colT.map((b) => a * b * f));
    } else cells = [0, 1].map(() => [0, 1, 2].map(() => r.int(4, 40)));
    const rowSum = cells.map((row) => row.reduce((s, x) => s + x, 0)),
      colSum = [0, 1, 2].map((j) => cells[0][j] + cells[1][j]);
    const N = rowSum[0] + rowSum[1];
    const i = r.int(0, 1),
      j = r.int(0, 2);
    const isIndep = cells[i][j] * N === rowSum[i] * colSum[j];
    const P1 = fq(Q.of(rowSum[i], N)),
      P2 = fq(Q.of(cells[i][j], N)),
      P3 = fq(Q.of(cells[i][j], colSum[j])),
      P4 = fq(Q.of(cells[1 - i][j], rowSum[1 - i]));
    const opts = [md`Independent, because $\mathrm{P}(\text{${T.cols[j]}} \mid \text{${T.rows[i]}}) = \mathrm{P}(\text{${T.cols[j]}})$`, md`Not independent, because $\mathrm{P}(\text{${T.cols[j]}} \mid \text{${T.rows[i]}}) \neq \mathrm{P}(\text{${T.cols[j]}})$`];
    const C: ChoiceSpec = ans.choice(opts, isIndep ? 0 : 1);
    const table = `\\begin{array}{l|ccc|c} & \\text{${T.cols.join('} & \\text{')}} & \\text{Total} \\\\ \\hline ${[0, 1].map((a) => `\\text{${T.rows[a]}} & ${cells[a].join(' & ')} & ${rowSum[a]}`).join(' \\\\ ')} \\\\ \\hline \\text{Total} & ${colSum.join(' & ')} & ${N} \\end{array}`;
    return {
      stem: md`${T.what} One person is chosen at random.` + `\n\n$$${table}$$`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find the probability that the person is in the group “${T.rows[i]}”.`, answer: P1, scheme: [B1(md`$\dfrac{${rowSum[i]}}{${N}}$`)], hints: ['Use the row total.', 'Divide by the grand total.', 'Simplify if you like.'], solution: [md`$\dfrac{${rowSum[i]}}{${N}} = ${answerTex(P1)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Find the probability that the person is in “${T.rows[i]}” and chose “${T.cols[j]}”.`, answer: P2, scheme: [B1(md`$\dfrac{${cells[i][j]}}{${N}}$`)], hints: ['Use the single cell.', 'Divide by the grand total.', 'This is P(A ∩ B).'], solution: [md`$\dfrac{${cells[i][j]}}{${N}} = ${answerTex(P2)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Given that the person chose “${T.cols[j]}”, find the probability that they are in “${T.rows[i]}”.`, answer: P3, scheme: [M1(md`Denominator is the column total $${colSum[j]}$`), A1(md`$\dfrac{${cells[i][j]}}{${colSum[j]}}$`)], hints: ['“Given that” restricts you to that column.', md`Out of the $${colSum[j]}$ who chose ${T.cols[j]}, how many are in ${T.rows[i]}?`, 'That fraction is the conditional probability.'], errors: [err('wrong-total', fq(Q.of(cells[i][j], N)), 'Given information changes the denominator to the column total.')], solution: [md`$\dfrac{${cells[i][j]}}{${colSum[j]}} = ${answerTex(P3)}$`] }),
        part({ label: 'd', marks: 1, prompt: md`Find $\mathrm{P}(\text{${T.cols[j]}} \mid \text{${T.rows[1 - i]}})$.`, answer: P4, scheme: [B1(md`$\dfrac{${cells[1 - i][j]}}{${rowSum[1 - i]}}$`)], hints: ['Restrict to the row given.', 'Use that row total as the denominator.', 'Read off the cell.'], solution: [md`$\dfrac{${cells[1 - i][j]}}{${rowSum[1 - i]}} = ${answerTex(P4)}$`] }),
        part({ label: 'e', marks: 1, prompt: md`Determine whether choosing “${T.cols[j]}” is independent of being in “${T.rows[i]}”.`, answer: C, scheme: [B1('Compares a conditional with the unconditional probability (or product rule), with conclusion')], hints: ['Independent means knowing one does not change the probability of the other.', md`Compare $\dfrac{${cells[i][j]}}{${rowSum[i]}}$ with $\dfrac{${colSum[j]}}{${N}}$.`, 'Simplify both fractions.'], solution: [md`$\mathrm{P}(\text{${T.cols[j]}} \mid \text{${T.rows[i]}}) = ${Q.of(cells[i][j], rowSum[i]).toLatex()}$, $\mathrm{P}(\text{${T.cols[j]}}) = ${Q.of(colSum[j], N).toLatex()}$.`, opts[isIndep ? 0 : 1]] }),
      ],
      params: { cells, i, j },
    };
  },
  verify(inst) {
    const { cells, i, j } = inst.params as { cells: number[][]; i: number; j: number };
    const N = cells.flat().reduce((s, x) => s + x, 0);
    const col = cells[0][j] + cells[1][j];
    expectClose(valOf(inst.parts[2].answer as ExactSpec), cells[i][j] / col, 'P(row | col)');
    const PA = (cells[i][0] + cells[i][1] + cells[i][2]) / N;
    expectClose(valOf(inst.parts[2].answer as ExactSpec) * (col / N), valOf(inst.parts[1].answer as ExactSpec), 'multiplication rule');
    expect(PA > 0, 'row probability');
  },
});

// ---------------------------------------------------------------- 2.3 Venn diagram with three events
function venn3Svg(r: Record<string, string>): string {
  // A and C do not overlap; B overlaps both
  const pts: [string, number, number][] = [
    ['a', 70, 105],
    ['ab', 128, 105],
    ['b', 175, 80],
    ['bc', 222, 105],
    ['c', 280, 105],
    ['o', 330, 185],
  ];
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 200" class="dg" role="img">`,
    `<rect class="dg-curve" fill="none" x="6" y="6" width="338" height="188" rx="4"/>`,
    `<circle class="dg-curve" fill="none" cx="95" cy="105" r="60"/>`,
    `<circle class="dg-curve" fill="none" cx="175" cy="105" r="62"/>`,
    `<circle class="dg-curve" fill="none" cx="255" cy="105" r="60"/>`,
    `<text class="dg-label" x="40" y="40">A</text><text class="dg-label" x="170" y="34">B</text><text class="dg-label" x="300" y="40">C</text>`,
    ...pts.map(([k, x, y]) => `<text class="dg-label" x="${x}" y="${y}" text-anchor="${k === 'o' ? 'end' : 'middle'}">${esc(r[k])}</text>`),
    `</svg>`,
  ].join('');
}

const venn3 = defineTemplate({
  id: 'sm2.2.venn-three-events-conditional',
  family: 'sm2.2.conditional',
  title: 'Venn diagram with three events: unknown counts and conditional probabilities',
  spec: ['S3.2', 'S3.1'],
  chapter: 'SM2.2',
  sections: ['2.3'],
  level: 'A2',
  paper: [3],
  difficulty: 3,
  marks: 7,
  time: 9,
  commands: ['Find'],
  tags: ['conditional probability', 'Venn diagrams', 'mutually exclusive'],
  generate(r) {
    const R = { a: r.int(4, 20), ab: r.int(2, 12), b: r.int(3, 20), bc: r.int(2, 12), c: r.int(4, 20), o: r.int(3, 25) };
    const N = Object.values(R).reduce((s, x) => s + x, 0);
    const what = r.pick([
      ['students', 'study Art', 'study Biology', 'study Computing'],
      ['people at a gym', 'swim', 'use the bikes', 'do yoga'],
      ['households', 'own a cat', 'own a dog', 'own a rabbit'],
    ]);
    const lbl = { a: String(R.a), ab: 'x', b: String(R.b), bc: String(R.bc), c: String(R.c), o: String(R.o) };
    const X = ans.exact(num(R.ab));
    const Bt = R.ab + R.b + R.bc;
    const P1 = fq(Q.of(R.bc, R.bc + R.c)),
      P2 = fq(Q.of(R.ab, Bt));
    const P4 = fq(Q.of(R.ab + R.bc, R.a + R.ab + R.bc + R.c));
    return {
      stem: md`The Venn diagram shows the numbers of ${what[0]} in a group of $${N}$ who ${what[1]} ($A$), ${what[2]} ($B$) and ${what[3]} ($C$). No-one does both $A$ and $C$. One person is chosen at random.`,
      diagram: { svg: venn3Svg(lbl), alt: `Venn diagram with three circles A, B and C; A and C do not overlap. Regions: A only ${R.a}, A and B x, B only ${R.b}, B and C ${R.bc}, C only ${R.c}, none ${R.o}.` },
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find the value of $x$.`, answer: X, scheme: [B1(md`$x = ${R.ab}$`)], hints: [md`The total of all the regions is $${N}$.`, 'Subtract the known regions.', md`$x = ${N} - ${R.a + R.b + R.bc + R.c + R.o}$`], solution: [md`$x = ${N} - ${R.a + R.b + R.bc + R.c + R.o} = ${answerTex(X)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find $\mathrm{P}(B \mid C)$.`, answer: P1, scheme: [M1(md`Restricts to $C$: denominator $${R.bc + R.c}$`), A1(md`$\dfrac{${R.bc}}{${R.bc + R.c}}$`)], hints: ['Given C: only look inside circle C.', md`There are $${R.bc + R.c}$ people in $C$.`, 'How many of them are also in B?'], errors: [err('reversed', fq(Q.of(R.bc, Bt)), 'That is P(C | B). Here the condition is C.')], solution: [md`$\mathrm{P}(B \mid C) = \dfrac{${R.bc}}{${R.bc + R.c}} = ${answerTex(P1)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find $\mathrm{P}(A \mid B)$.`, answer: P2, scheme: [M1(md`Denominator $n(B) = ${Bt}$`), A1(md`$\dfrac{${R.ab}}{${Bt}}$`)], hints: ['Restrict to circle B.', md`$n(B) = x + ${R.b} + ${R.bc}$`, 'Count those also in A.'], solution: [md`$\mathrm{P}(A \mid B) = \dfrac{${R.ab}}{${Bt}} = ${answerTex(P2)}$`] }),
        part({ label: 'd', marks: 2, prompt: md`Find $\mathrm{P}(B \mid A \cup C)$.`, answer: P4, scheme: [M1(md`Denominator $n(A \cup C) = ${R.a + R.ab + R.bc + R.c}$`), A1(md`$\dfrac{${R.ab + R.bc}}{${R.a + R.ab + R.bc + R.c}}$`)], hints: ['Restrict to everyone in A or C.', md`$n(A \cup C) = ${R.a} + x + ${R.bc} + ${R.c}$`, 'How many of those are in B?'], solution: [md`$\dfrac{${R.ab + R.bc}}{${R.a + R.ab + R.bc + R.c}} = ${answerTex(P4)}$`] }),
      ],
      params: { R },
    };
  },
  verify(inst) {
    const { R } = inst.params as { R: Record<string, number> };
    expect(valOf(inst.parts[0].answer as ExactSpec) === R.ab, 'x');
    expectClose(valOf(inst.parts[1].answer as ExactSpec), R.bc / (R.bc + R.c), 'B|C');
  },
});

// ---------------------------------------------------------------- 2.5 tree diagrams: Bayes-type
const screening = defineTemplate({
  id: 'sm2.2.tree-diagram-reverse-conditional',
  family: 'sm2.2.tree-diagrams',
  title: 'Tree diagram with conditional branches; reverse conditional probability',
  spec: ['S3.2', 'S3.3'],
  chapter: 'SM2.2',
  sections: ['2.5'],
  level: 'A2',
  paper: [3],
  difficulty: 3,
  marks: 7,
  time: 8,
  commands: ['Find', 'Comment'],
  tags: ['conditional probability', 'tree diagrams', 'screening'],
  generate(r) {
    const C = r.pick([
      { pop: 'people in a town', cond: 'have a particular condition', test: 'A screening test', pos: 'tests positive', fp: 'gives a positive result for' },
      { pop: 'items from a factory', cond: 'are faulty', test: 'An automatic check', pos: 'is rejected', fp: 'wrongly rejects' },
      { pop: 'emails received', cond: 'are spam', test: 'A filter', pos: 'is flagged', fp: 'wrongly flags' },
    ]);
    const d = r.pick([0.01, 0.02, 0.04, 0.05, 0.1, 0.15]),
      s = r.pick([0.9, 0.92, 0.95, 0.98, 0.99]),
      f = r.pick([0.02, 0.03, 0.05, 0.08, 0.1]);
    const pPos = d * s + (1 - d) * f;
    const post = (d * s) / pPos;
    const negWrong = (d * (1 - s)) / (1 - pPos);
    const A1s = ans.num(pPos, { sf: 3 }, { exactAllowed: true }),
      A2s = ans.num(post, { sf: 3 }),
      A3s = ans.num(negWrong, { sf: 3 });
    const opts = [
      post < 0.8 ? `Even with a positive result, the probability of actually belonging to the group is only about ${fmtSF(post, 2)}, because false positives from the large group outside it are relatively common` : `A positive result makes it very likely (about ${fmtSF(post, 2)}) that it belongs to the group, but there is still a chance of a false positive`,
      'The test is useless because it makes mistakes',
      'A positive result means it certainly belongs to the group',
    ];
    const Ch: ChoiceSpec = ans.choice(opts, 0);
    const pr = (x: number) => fmtNum(x);
    return {
      stem: md`It is known that $${pct(d)}$ of ${C.pop} ${C.cond}. ${C.test} correctly identifies $${pct(s)}$ of those that do, but also ${C.fp} $${pct(f)}$ of those that do not.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`One is chosen at random. Find the probability that it ${C.pos}.`, answer: A1s, scheme: [M1(md`$${pr(d)} \times ${pr(s)} + ${pr(1 - d)} \times ${pr(f)}$`), A1(md`$${fmtNum(pPos, 6)}$`)], hints: ['Draw a tree: first branch for the condition, second for the result.', 'There are two ways to get a positive.', 'Multiply along each branch, then add.'], errors: [err('one-branch', ans.num(d * s, { sf: 3 }), 'Include the false positives as well.', 1)], solution: [md`$${pr(d)} \times ${pr(s)} + ${pr(1 - d)} \times ${pr(f)} = ${answerTex(A1s)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Given that it ${C.pos}, find the probability that it really does belong to the group.`, answer: A2s, scheme: [M1(md`$\dfrac{${pr(d)} \times ${pr(s)}}{\text{their (a)}}$`), A1(md`awrt $${fmtSF(post, 3)}$`)], hints: [md`$\mathrm{P}(D \mid +) = \dfrac{\mathrm{P}(D \cap +)}{\mathrm{P}(+)}$`, md`$\mathrm{P}(D \cap +) = ${pr(d)} \times ${pr(s)}$`, 'Divide by your answer to (a).'], errors: [err('forward', ans.num(s, { sf: 3 }), 'That is P(positive | in group). The question asks the reverse.')], solution: [md`$\dfrac{${fmtNum(d * s, 6)}}{${fmtNum(pPos, 6)}} = ${answerTex(A2s)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Given that it does not give a positive result, find the probability that it does belong to the group.`, answer: A3s, scheme: [M1(md`$\dfrac{${pr(d)} \times ${pr(1 - s)}}{1 - \text{their (a)}}$`), A1(md`awrt $${fmtSF(negWrong, 3)}$`)], hints: ['Use the "negative" branches.', md`$\mathrm{P}(D \cap -) = ${pr(d)} \times ${pr(1 - s)}$`, md`$\mathrm{P}(-) = 1 - \mathrm{P}(+)$`], solution: [md`$\dfrac{${fmtNum(d * (1 - s), 6)}}{${fmtNum(1 - pPos, 6)}} = ${answerTex(A3s)}$`] }),
        part({ label: 'd', marks: 1, prompt: md`Comment on your answer to part (b).`, answer: Ch, scheme: [B1('Sensible comment in context')], hints: ['Is the answer to (b) close to 1?', 'How rare is the group?', 'Compare the number of true and false positives.'], solution: [opts[0]] }),
      ],
      params: { d, s, f },
    };
  },
  verify(inst) {
    const { d, s, f } = inst.params as Record<string, number>;
    // frequency check with a population of 10^6
    const N = 1e6,
      D = N * d,
      TP = D * s,
      FP = (N - D) * f;
    expectClose(valOf(inst.parts[0].answer as NumericSpec), (TP + FP) / N, 'P(+)');
    expectClose(valOf(inst.parts[1].answer as NumericSpec), TP / (TP + FP), 'P(D | +)');
    expectClose(valOf(inst.parts[2].answer as NumericSpec), (D - TP) / (N - TP - FP), 'P(D | −)');
  },
});

// ---------------------------------------------------------------- modelling: systems and Markov-style trees
const systems = defineTemplate({
  id: 'sm2.2.components-in-series-and-parallel',
  family: 'sm2.2.modelling',
  title: 'Probability model for components in series and in parallel',
  spec: ['S3.3', 'S3.1'],
  chapter: 'SM2.2',
  sections: ['2.4'],
  level: 'A2',
  paper: [3],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find', 'Give a reason'],
  tags: ['probability', 'modelling', 'independence', 'assumptions'],
  generate(r) {
    const p = r.pick([0.8, 0.85, 0.9, 0.95, 0.75]),
      q = r.pick([0.7, 0.8, 0.9, 0.6, 0.95]);
    const what = r.pick([['A torch', 'battery', 'bulb', 'lights'], ['A security system', 'sensor', 'alarm', 'works'], ['A remote-controlled car', 'motor', 'receiver', 'runs']]);
    const series = p * q,
      parallel = 1 - (1 - p) * (1 - p),
      backup = p * (1 - (1 - q) * (1 - q));
    const S = ans.num(series, { sf: 3 }, { exactAllowed: true }),
      P = ans.num(parallel, { sf: 3 }, { exactAllowed: true }),
      B = ans.num(backup, { sf: 3 }, { exactAllowed: true });
    const opts = [`Components may fail together (for example from the same damage, heat or a shared power supply), so failures may not be independent`, 'The probabilities are greater than 0.5', 'There are only two components'];
    const C: ChoiceSpec = ans.choice(opts, 0);
    return {
      stem: md`${what[0]} needs a ${what[1]} and a ${what[2]} to work. The probability that a ${what[1]} works is $${p}$ and the probability that a ${what[2]} works is $${q}$. Assume components work independently.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find the probability that the ${what[0].toLowerCase().replace(/^an? /, '')} ${what[3]}.`, answer: S, scheme: [B1(md`$${p} \times ${q} = ${fmtNum(series, 6)}$`)], hints: ['Both components must work.', 'Independent: multiply.', md`$${p} \times ${q}$`], solution: [md`$${p} \times ${q} = ${answerTex(S)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`A design with two ${what[1]}s, either of which is enough, is tested. Find the probability that at least one of the two ${what[1]}s works.`, answer: P, scheme: [M1(md`$1 - (1 - ${p})^{2}$`), A1(md`$${fmtNum(parallel, 6)}$`)], hints: ['At least one = 1 − P(both fail).', md`P(a ${what[1]} fails) $= ${fmtNum(1 - p)}$`, 'Square it and subtract from 1.'], solution: [md`$1 - ${fmtNum(1 - p)}^{2} = ${answerTex(P)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`In a final design there is one ${what[1]} and two ${what[2]}s, either of which is enough. Find the probability that it ${what[3]}.`, answer: B, scheme: [M1(md`$${p} \times \left(1 - (1 - ${q})^{2}\right)$`), A1(md`awrt $${fmtSF(backup, 3)}$`)], hints: [`The ${what[1]} must work, and at least one ${what[2]} must work.`, md`P(at least one ${what[2]}) $= 1 - ${fmtNum(1 - q)}^{2}$`, 'Multiply.'], solution: [md`$${p} \times (1 - ${fmtNum(1 - q)}^{2}) = ${answerTex(B)}$`] }),
        part({ label: 'd', marks: 1, prompt: md`Give a reason why the independence assumption may not be realistic.`, answer: C, scheme: [B1('Sensible reason')], hints: ['Could one cause make both fail?', 'Think about the environment the device is used in.', 'Are the parts from the same batch?'], solution: [opts[0]] }),
      ],
      params: { p, q },
    };
  },
  verify(inst) {
    const { p, q } = inst.params as Record<string, number>;
    let pw = 0;
    // enumerate: component states (main, backup1, backup2)
    for (const a of [0, 1]) for (const b of [0, 1]) for (const c of [0, 1]) if (a && (b || c)) pw += (a ? p : 1 - p) * (b ? q : 1 - q) * (c ? q : 1 - q);
    expectClose(valOf(inst.parts[2].answer as NumericSpec), pw, 'backup design');
  },
});

const weather = defineTemplate({
  id: 'sm2.2.two-day-weather-model',
  family: 'sm2.2.modelling',
  title: 'A conditional model for the weather on successive days',
  spec: ['S3.3', 'S3.2'],
  chapter: 'SM2.2',
  sections: ['2.5'],
  level: 'A2',
  paper: [3],
  difficulty: 4,
  marks: 7,
  time: 8,
  commands: ['Find', 'Give a reason'],
  tags: ['conditional probability', 'tree diagrams', 'modelling', 'assumptions'],
  generate(r) {
    const a = r.pick([0.5, 0.6, 0.65, 0.7, 0.75]), // P(rain tomorrow | rain today)
      b = r.pick([0.1, 0.15, 0.2, 0.25, 0.3]); // P(rain tomorrow | dry today)
    const today = r.pick(['dry', 'wet'] as const);
    const p1 = today === 'wet' ? a : b; // P(rain day 1)
    const p2 = p1 * a + (1 - p1) * b; // P(rain day 2)
    const both = p1 * a;
    const cond = both / p2; // P(rain day 1 | rain day 2)
    const A1s = ans.num(p2, { sf: 3 }, { exactAllowed: true }),
      A2s = ans.num(both, { sf: 3 }, { exactAllowed: true }),
      A3s = ans.num(cond, { sf: 3 });
    const opts = ['The probabilities may change with the season, and the weather may depend on more than just the previous day', 'Probabilities cannot be greater than 0.5', 'Rain is impossible to predict'];
    const C: ChoiceSpec = ans.choice(opts, 0);
    return {
      stem: md`A model for the weather in a town says: if it rains on one day, the probability that it rains the next day is $${a}$; if it is dry on one day, the probability that it rains the next day is $${b}$. Today (day 0) is ${today}.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find the probability that it rains on day 2.`, answer: A1s, scheme: [M1('Tree diagram for days 1 and 2'), M1(md`$${fmtNum(p1)} \times ${a} + ${fmtNum(1 - p1)} \times ${b}$`), A1(md`$${fmtNum(p2, 6)}$`)], hints: [md`Day 1: P(rain) $= ${fmtNum(p1)}$ because today is ${today}.`, 'Day 2 depends on day 1: two branches lead to rain on day 2.', 'Multiply along each branch and add.'], errors: [err('ignores-day1', ans.num(p1, { sf: 3 }), 'Day 2 depends on what happens on day 1 — use the tree.')], solution: [md`$${fmtNum(p1)} \times ${a} + ${fmtNum(1 - p1)} \times ${b} = ${answerTex(A1s)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Find the probability that it rains on both day 1 and day 2.`, answer: A2s, scheme: [B1(md`$${fmtNum(p1)} \times ${a} = ${fmtNum(both, 6)}$`)], hints: ['One branch of the tree.', md`$\mathrm{P}(R_{1}) \times \mathrm{P}(R_{2} \mid R_{1})$`, 'Multiply.'], solution: [md`$${fmtNum(p1)} \times ${a} = ${answerTex(A2s)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Given that it rains on day 2, find the probability that it also rained on day 1.`, answer: A3s, scheme: [M1('(b) ÷ (a)'), A1(md`awrt $${fmtSF(cond, 3)}$`)], hints: [md`$\mathrm{P}(R_{1} \mid R_{2}) = \dfrac{\mathrm{P}(R_{1} \cap R_{2})}{\mathrm{P}(R_{2})}$`, 'Use your answers to (a) and (b).', 'Divide.'], solution: [md`$\dfrac{${fmtNum(both, 6)}}{${fmtNum(p2, 6)}} = ${answerTex(A3s)}$`] }),
        part({ label: 'd', marks: 1, prompt: md`Give one limitation of this model.`, answer: C, scheme: [B1('Sensible limitation')], hints: ['Would these probabilities be the same in winter and summer?', 'Does tomorrow only depend on today?', 'Think about real weather systems.'], solution: [opts[0]] }),
      ],
      params: { a, b, p1 },
    };
  },
  verify(inst) {
    const { a, b, p1 } = inst.params as Record<string, number>;
    const p2 = p1 * a + (1 - p1) * b;
    expectClose(valOf(inst.parts[0].answer as NumericSpec), p2, 'day 2');
    expectClose(valOf(inst.parts[2].answer as NumericSpec) * p2, p1 * a, 'Bayes');
  },
});

const templates: Template[] = [twoWay, venn3, screening, systems, weather];
export default templates;
