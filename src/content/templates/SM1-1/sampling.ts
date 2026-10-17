/** Statistics Year 1, Chapter 1 — populations, samples, sampling methods, types of data, the large data set. */
import { evaluate, num } from '../../../engine/core/expr';
import { expect } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, ExactSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';

const valOf = (s: ExactSpec) => evaluate(s.value);

// ---------------------------------------------------------------- 1.2 stratified sampling
const STRATA = [
  { what: 'A secondary school', unit: 'students', groups: ['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11'] },
  { what: 'A company', unit: 'employees', groups: ['Sales', 'Production', 'Administration', 'Research'] },
  { what: 'A gym', unit: 'members', groups: ['Off-peak', 'Standard', 'Premium'] },
  { what: 'A sports club', unit: 'members', groups: ['Juniors', 'Adults', 'Seniors'] },
  { what: 'A hospital', unit: 'staff', groups: ['Nurses', 'Doctors', 'Porters', 'Administrators'] },
];

const stratified = defineTemplate({
  id: 'sm1.1.stratified-sample',
  family: 'sm1.1.sampling',
  title: 'Stratified sampling: how many from each group',
  spec: ['S1.1'],
  chapter: 'SM1.1',
  sections: ['1.2'],
  level: 'AS',
  paper: [3],
  difficulty: 1,
  marks: 4,
  time: 4,
  commands: ['Find', 'Give a reason'],
  tags: ['sampling', 'stratified sampling'],
  generate(r) {
    const C = r.pick(STRATA);
    const g = C.groups.length;
    const n = r.pick([20, 25, 30, 40, 50, 60]);
    const f = r.pick([4, 5, 6, 8, 10, 12, 15, 20]);
    // split n into g positive parts
    const ks = Array.from({ length: g }, () => 1);
    for (let t = 0; t < n - g; t++) ks[r.int(0, g - 1)]++;
    const sizes = ks.map((k) => k * f);
    const N = n * f;
    const i = r.int(0, g - 1);
    let j = r.int(0, g - 1);
    if (j === i) j = (i + 1) % g;
    const Ai = ans.exact(num(ks[i])),
      Aj = ans.exact(num(ks[j]));
    const opts = ['Each group is represented in proportion to its size, so the sample reflects the population structure', 'It is the quickest and cheapest method', 'It does not need a sampling frame'];
    const Ch: ChoiceSpec = ans.choice(opts, 0);
    const table = `\\begin{array}{${'c'.repeat(g)}} ${C.groups.map((x) => `\\text{${x}}`).join(' & ')} \\\\ \\hline ${sizes.join(' & ')} \\end{array}`;
    return {
      stem: md`${C.what} has $${N}$ ${C.unit}, divided into groups as shown. A stratified sample of size $${n}$ is to be taken.` + `\n\n$$${table}$$`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the number of ${C.unit} from ${C.groups[i]} that should be in the sample.`, answer: Ai, scheme: [M1(md`$\dfrac{${sizes[i]}}{${N}} \times ${n}$`), A1(md`$${ks[i]}$`)], hints: ['In a stratified sample each group is sampled in proportion to its size.', md`The fraction of the population in ${C.groups[i]} is $\dfrac{${sizes[i]}}{${N}}$.`, md`Multiply by the sample size $${n}$.`], solution: [md`$\dfrac{${sizes[i]}}{${N}} \times ${n} = ${answerTex(Ai)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Find the number of ${C.unit} from ${C.groups[j]} that should be in the sample.`, answer: Aj, scheme: [B1(md`$${ks[j]}$`)], hints: ['Use the same method.', md`$\dfrac{${sizes[j]}}{${N}} \times ${n}$`, 'Check the group numbers add up to the sample size.'], solution: [md`$\dfrac{${sizes[j]}}{${N}} \times ${n} = ${answerTex(Aj)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`Give one advantage of stratified sampling in this situation.`, answer: Ch, scheme: [B1('Proportional representation of each group')], hints: ['Think about what stratifying guarantees.', 'The groups may differ in their responses.', 'Compare with a simple random sample, which might miss a group.'], solution: [opts[0]] }),
      ],
      params: { sizes, n, i, j },
    };
  },
  verify(inst) {
    const { sizes, n, i, j } = inst.params as { sizes: number[]; n: number; i: number; j: number };
    const N = sizes.reduce((s, x) => s + x, 0);
    expect(valOf(inst.parts[0].answer as ExactSpec) === (sizes[i] * n) / N, 'group i');
    expect(valOf(inst.parts[1].answer as ExactSpec) === (sizes[j] * n) / N, 'group j');
  },
});

// ---------------------------------------------------------------- 1.2–1.3 systematic sampling; identifying methods
const METHODS = ['Simple random sampling', 'Systematic sampling', 'Stratified sampling', 'Quota sampling', 'Opportunity sampling'];
const SCENARIOS: { text: string; m: number }[] = [
  { text: 'A researcher stands outside a supermarket and asks the first 30 people who walk past.', m: 4 },
  { text: 'An interviewer is told to question 20 men and 20 women, and chooses whoever is available until each quota is filled.', m: 3 },
  { text: 'Every student in a school is given a number, and a random number generator is used to choose 50 different numbers.', m: 0 },
  { text: 'A list of 600 customers is used; a random start between 1 and 12 is chosen and then every 12th customer is selected.', m: 1 },
  { text: 'A factory has three shifts of different sizes; a random sample is taken from each shift, with sizes in proportion to the shift sizes.', m: 2 },
  { text: 'A teacher asks the students sitting nearest the door to fill in a questionnaire.', m: 4 },
  { text: 'A market researcher must interview 15 under-25s, 15 aged 25–60 and 10 over-60s, choosing people in the street.', m: 3 },
  { text: 'Names are put into a hat, mixed, and 10 names are drawn out one at a time.', m: 0 },
];

const systematic = defineTemplate({
  id: 'sm1.1.systematic-sample-and-methods',
  family: 'sm1.1.sampling',
  title: 'Systematic sampling, and identifying a sampling method',
  spec: ['S1.1'],
  chapter: 'SM1.1',
  sections: ['1.2', '1.3'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Find', 'State', 'Explain'],
  tags: ['sampling', 'systematic sampling', 'quota sampling', 'opportunity sampling'],
  generate(r) {
    const n = r.pick([20, 25, 30, 40, 50]);
    const k = r.pick([5, 6, 8, 10, 12, 15, 20, 25]);
    const N = n * k;
    const start = r.int(1, k);
    const m = r.int(3, 9);
    const item = start + (m - 1) * k;
    const what = r.pick(['a list of members of a library', 'the production log of a factory', 'the register of patients at a surgery', 'the list of houses on an estate']);
    const K = ans.exact(num(k)),
      I = ans.exact(num(item));
    const S = r.pick(SCENARIOS);
    const C: ChoiceSpec = ans.choice(METHODS, S.m);
    const opts = ['Not every possible sample of the required size can be chosen — only samples of items exactly k apart', 'It always gives a biased sample', 'It needs the population to be divided into strata'];
    const C2: ChoiceSpec = ans.choice(opts, 0);
    return {
      stem: md`A systematic sample of size $${n}$ is to be taken from ${what}, which contains $${N}$ items numbered $1$ to $${N}$.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find the sampling interval $k$.`, answer: K, scheme: [B1(md`$k = \dfrac{${N}}{${n}} = ${k}$`)], hints: ['Divide the population size by the sample size.', md`$${N} \div ${n}$`, 'That is the gap between selected items.'], solution: [md`$k = ${N} \div ${n} = ${answerTex(K)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`The first item is chosen at random and is item number $${start}$. Find the item number of the ${m === 3 ? '3rd' : `${m}th`} item in the sample.`, answer: I, scheme: [B1(md`$${start} + ${m - 1} \times ${k} = ${item}$`)], hints: ['After the start, add k each time.', md`The ${m === 3 ? '3rd' : `${m}th`} item is $${start} + (${m} - 1) \times ${k}$.`, 'Count carefully.'], solution: [md`$${start} + ${m - 1} \times ${k} = ${answerTex(I)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`Explain why this is not a simple random sample.`, answer: C2, scheme: [B1('Not all samples of size n are equally likely / possible')], hints: ['In a simple random sample, every possible sample of the given size is equally likely.', 'Here, can items 1 and 2 both be chosen?', 'Think about which samples are impossible.'], solution: [opts[0]] }),
        part({ label: 'd', marks: 1, prompt: md`Name the sampling method described here: “${S.text}”`, answer: C, scheme: [B1(METHODS[S.m])], hints: ['Is a sampling frame used, and is the choice random?', 'Quotas mean fixed numbers from groups, chosen non-randomly.', 'Opportunity sampling uses whoever is available.'], solution: [`${METHODS[S.m]}.`] }),
      ],
      params: { n, k, start, m },
    };
  },
  verify(inst) {
    const { n, k, start, m } = inst.params as Record<string, number>;
    const N = n * k;
    const sample = Array.from({ length: n }, (_, i) => start + i * k);
    expect(sample[n - 1] <= N && sample[m - 1] === valOf(inst.parts[1].answer as ExactSpec), 'systematic sample');
  },
});

// ---------------------------------------------------------------- 1.4–1.5 types of data, census, the large data set
const VARIABLES: { name: string; type: number }[] = [
  { name: 'Daily maximum temperature (°C)', type: 2 },
  { name: 'Daily total rainfall (mm)', type: 2 },
  { name: 'Daily mean cloud cover (oktas, whole numbers 0–8)', type: 1 },
  { name: 'Daily mean wind speed recorded on the Beaufort scale (whole numbers)', type: 1 },
  { name: 'Daily maximum relative humidity (%)', type: 2 },
  { name: 'Daily total sunshine (hours)', type: 2 },
  { name: 'Daily mean visibility (decametres)', type: 2 },
  { name: 'Cardinal wind direction (N, NE, E, …)', type: 0 },
  { name: 'Number of goals scored in a match', type: 1 },
  { name: 'Favourite colour', type: 0 },
  { name: 'Mass of a newborn baby (kg)', type: 2 },
  { name: 'Number of siblings', type: 1 },
];
const TYPES = ['Qualitative (categorical)', 'Quantitative and discrete', 'Quantitative and continuous'];
const CENSUS = [
  { text: 'A manufacturer wants to know the lifetime of the light bulbs it makes. Testing involves leaving a bulb on until it fails.', ans: 1 },
  { text: 'A class teacher wants to know how many of the 28 students in the class own a bicycle.', ans: 0 },
  { text: 'A fireworks company wants to check that its rockets launch correctly.', ans: 1 },
  { text: 'A national government wants detailed information about every household once every ten years.', ans: 0 },
  { text: 'A café owner wants to know what the 10 000 people in a town think of a new menu.', ans: 1 },
];
const MONTHS = [
  ['May', 31],
  ['June', 30],
  ['July', 31],
  ['August', 31],
  ['September', 30],
  ['October', 31],
] as const;

const dataTypes = defineTemplate({
  id: 'sm1.1.data-types-census-large-data-set',
  family: 'sm1.1.data',
  title: 'Types of data, census or sample, and the large data set',
  spec: ['S1.1', 'S2.4'],
  chapter: 'SM1.1',
  sections: ['1.1', '1.4', '1.5'],
  level: 'AS',
  paper: [3],
  difficulty: 1,
  marks: 4,
  time: 4,
  commands: ['State', 'Give a reason', 'Find'],
  tags: ['types of data', 'census', 'sampling', 'large data set'],
  generate(r) {
    const V = r.pick(VARIABLES);
    const Cs = r.pick(CENSUS);
    const a = r.int(0, 5),
      b = r.int(a, 5);
    r.require(b > a || r.bool(0.3));
    const days = MONTHS.slice(a, b + 1).reduce((s, [, d]) => s + d, 0);
    const station = r.pick(['Heathrow', 'Hurn', 'Leuchars', 'Leeming', 'Camborne', 'Beijing', 'Jacksonville', 'Perth']);
    const year = r.pick([1987, 2015]);
    const T: ChoiceSpec = ans.choice(TYPES, V.type);
    const censusOpts = ['A census, because the population is small (or every member must be included) and it is practical to ask all of them', 'A sample, because testing destroys the item (or the population is too large to survey every member)'];
    const C: ChoiceSpec = ans.choice(censusOpts, Cs.ans);
    const D = ans.exact(num(days));
    const monthText = a === b ? MONTHS[a][0] : `${MONTHS[a][0]} to ${MONTHS[b][0]} inclusive`;
    return {
      parts: [
        part({ label: 'a', marks: 1, prompt: md`State the type of data for the variable: ${V.name}.`, answer: T, scheme: [B1(TYPES[V.type])], hints: ['Is it a number or a category?', 'Discrete data take particular values (often counts); continuous data can take any value in a range.', 'Values recorded as whole numbers on a scale are discrete.'], solution: [`${TYPES[V.type]}.`] }),
        part({ label: 'b', marks: 1, prompt: md`${Cs.text} Should a census or a sample be used?`, answer: C, scheme: [B1('Correct choice with reason')], hints: ['A census surveys every member of the population.', 'Would testing every item destroy them all, or be impractical?', 'Small populations are often surveyed in full.'], solution: [censusOpts[Cs.ans]] }),
        part({ label: 'c', marks: 2, prompt: md`The Edexcel large data set contains daily weather data from May to October for the years 1987 and 2015. A student uses the data for ${station} for ${monthText} ${year}. How many days of data does this period contain?`, answer: D, scheme: [M1('Adds the number of days in each month'), A1(md`$${days}$`)], hints: ['The data are daily, one row per day.', `Count the days in each month: ${MONTHS.slice(a, b + 1).map(([m, d]) => `${m} has ${d}`).join(', ')}.`, 'Add them up.'], solution: [md`$${MONTHS.slice(a, b + 1).map(([, d]) => d).join(' + ')} = ${answerTex(D)}$ days`] }),
      ],
      params: { a, b, days },
    };
  },
  verify(inst) {
    const { a, b } = inst.params as { a: number; b: number };
    const len = [31, 30, 31, 31, 30, 31];
    expect(valOf(inst.parts[2].answer as ExactSpec) === len.slice(a, b + 1).reduce((s, x) => s + x, 0), 'days');
  },
});

const templates: Template[] = [stratified, systematic, dataTypes];
export default templates;
