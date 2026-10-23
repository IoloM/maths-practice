/** Pure Year 2, Chapter 3 — long exam-style question: comparing an arithmetic and a geometric salary scheme. */
import { Q } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { texNum } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, ExactSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';

const NAMES = ['Ana', 'Ben', 'Chloe', 'Dev', 'Ella', 'Finn', 'Grace', 'Hari', 'Isla', 'Jamal'];

const salaries = defineTemplate({
  id: 'p2.3.long-arithmetic-versus-geometric-salary',
  family: 'p2.3.exam-style',
  title: 'Exam-style: arithmetic versus geometric salary schemes',
  spec: ['P4.6', 'P4.4', 'P4.5'],
  chapter: 'P2.3',
  sections: ['3.8', '3.2', '3.4'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 12,
  time: 15,
  commands: ['Find', 'Show that', 'State'],
  tags: ['exam-style', 'arithmetic series', 'geometric series', 'modelling', 'logarithms'],
  generate(r) {
    const who = r.pick(NAMES);
    const P = 1000 * r.int(20, 30),
      d = 250 * r.int(2, 6);
    const Qs = 1000 * r.int(18, 26),
      pct = r.pick([3, 4, 5, 6]);
    const ratio = 1 + pct / 100;
    const N = r.pick([10, 15, 20]);
    const k = r.int(5, N - 2);
    const uk = P + (k - 1) * d;
    const SA = (N / 2) * (2 * P + (N - 1) * d);
    const SB = (Qs * (ratio ** N - 1)) / (ratio - 1);
    // least n with total under B > T
    const T = 50_000 * Math.round((SB * r.pick([1.3, 1.5, 1.8])) / 50_000);
    const nT = Math.ceil(Math.log(1 + (T * (ratio - 1)) / Qs) / Math.log(ratio) - 1e-12);
    r.require(SB < T && nT <= 60 && Math.abs(SA - SB) > 2000);
    const better = SA > SB ? 0 : 1;
    const U: NumericSpec = ans.num(uk, { dp: 0 });
    const A: NumericSpec = ans.num(SA, { dp: 0 });
    const B: NumericSpec = ans.num(SB, { dp: 0 });
    const Nn: ExactSpec = ans.exact(num(Q.of(nT)));
    const C: ChoiceSpec = ans.choice(['Scheme A', 'Scheme B'], better);
    const rTex = ratio.toFixed(2);
    return {
      stem: md`${who} is offered a job with a choice of two salary schemes. Scheme A: £$${texNum(P)}$ in year 1, increasing by £$${texNum(d)}$ each year. Scheme B: £$${texNum(Qs)}$ in year 1, increasing by $${pct}\%$ each year.`,
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Find ${who}'s salary in year $${k}$ under scheme A.`,
          answer: U,
          scheme: [M1(md`$a + (n - 1)d$ with $a = ${texNum(P)}$, $d = ${texNum(d)}$, $n = ${k}$`), A1(md`£$${texNum(uk)}$`)],
          hints: ['Scheme A is an arithmetic sequence.', md`$u_{n} = a + (n - 1)d$`, md`$u_{${k}} = ${texNum(P)} + ${k - 1} \times ${texNum(d)}$`],
          errors: [err('n-not-minus-1', ans.num(P + k * d, { dp: 0 }), md`Year $${k}$ has had $${k - 1}$ increases, not $${k}$.`, 1)],
          solution: [md`$u_{${k}} = ${texNum(P)} + ${k - 1}(${texNum(d)}) = ${answerTex(U)}$`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Find the total ${who} would earn over the first $${N}$ years under scheme A.`,
          answer: A,
          scheme: [M1(md`$S_{${N}} = \tfrac{${N}}{2}\left[2(${texNum(P)}) + ${N - 1}(${texNum(d)})\right]$`), A1(md`£$${texNum(SA)}$`)],
          hints: [md`$S_{n} = \tfrac{n}{2}\left[2a + (n - 1)d\right]$`, md`$n = ${N}$`, 'Check: the average of the first and last salaries, times the number of years.'],
          solution: [md`$S_{${N}} = \tfrac{${N}}{2}\left[${texNum(2 * P)} + ${texNum((N - 1) * d)}\right] = ${answerTex(A)}$`],
        }),
        part({
          label: 'c',
          marks: 3,
          prompt: md`Find the total ${who} would earn over the first $${N}$ years under scheme B, to the nearest pound.`,
          answer: B,
          scheme: [B1(md`Common ratio $r = ${rTex}$`), M1(md`$S_{${N}} = \dfrac{${texNum(Qs)}(${rTex}^{${N}} - 1)}{${rTex} - 1}$`), A1(md`£$${texNum(Math.round(SB))}$`)],
          hints: [md`Increasing by $${pct}\%$ multiplies by $${rTex}$ each year.`, md`$S_{n} = \dfrac{a(r^{n} - 1)}{r - 1}$`, md`$a = ${texNum(Qs)}$, $r = ${rTex}$, $n = ${N}$`],
          errors: [err('ratio-as-percent', ans.num(Qs * N + (Qs * (pct / 100) * N * (N - 1)) / 2, { dp: 0 }), md`A percentage increase each year is geometric: multiply by $${rTex}$, don't add a fixed amount.`, 0)],
          solution: [md`$S_{${N}} = \dfrac{${texNum(Qs)}(${rTex}^{${N}} - 1)}{${rTex} - 1} = ${answerTex(B)}$ (nearest £)`],
        }),
        part({
          label: 'd',
          marks: 1,
          prompt: md`State which scheme pays more in total over the first $${N}$ years.`,
          answer: C,
          scheme: [B1(`${better === 0 ? 'Scheme A' : 'Scheme B'} (compares their totals from (b) and (c))`)],
          hints: ['Compare your answers to (b) and (c).', 'Which total is larger?', 'Answer with a scheme letter.'],
          solution: [`£${Math.round(SA).toLocaleString('en-GB')} (A) against £${Math.round(SB).toLocaleString('en-GB')} (B), so ${better === 0 ? 'scheme A' : 'scheme B'} pays more.`],
        }),
        part({
          label: 'e',
          marks: 4,
          prompt: md`Under scheme B, find the least number of complete years after which ${who}'s total earnings first exceed £$${texNum(T)}$.`,
          answer: Nn,
          scheme: [
            M1(md`$\dfrac{${texNum(Qs)}(${rTex}^{n} - 1)}{${rTex} - 1} > ${texNum(T)}$`),
            M1(md`$${rTex}^{n} > ${(1 + (T * (ratio - 1)) / Qs).toFixed(4)}$`),
            dM1(md`Takes logs: $n > \dfrac{\log ${(1 + (T * (ratio - 1)) / Qs).toFixed(4)}}{\log ${rTex}}$`),
            A1(md`$n = ${nT}$`),
          ],
          hints: ['Set the geometric sum greater than the target.', md`Rearrange to $${rTex}^{n} > \dots$`, 'Take logs of both sides, then round up to a whole number of years.'],
          errors: [err('rounded-down', ans.exact(num(Q.of(nT - 1))), 'After that many years the total is still below the target: round up.', 3)],
          solution: [md`$${rTex}^{n} > 1 + \dfrac{${texNum(T)}(${rTex} - 1)}{${texNum(Qs)}} = ${(1 + (T * (ratio - 1)) / Qs).toFixed(4)}$`, md`$n > ${(Math.log(1 + (T * (ratio - 1)) / Qs) / Math.log(ratio)).toFixed(3)}$, so $n = ${answerTex(Nn)}$`],
        }),
      ],
      params: { P, d, Qs, ratio, N, k, T },
    };
  },
  verify(inst) {
    const { P, d, Qs, ratio, N, k, T } = inst.params as Record<string, number>;
    // brute force: year by year
    const a: number[] = [],
      b: number[] = [];
    for (let y = 1; y <= 80; y++) {
      a.push(P + (y - 1) * d);
      b.push(Qs * ratio ** (y - 1));
    }
    const sum = (xs: number[], n: number) => xs.slice(0, n).reduce((s, x) => s + x, 0);
    expectClose((inst.parts[0].answer as NumericSpec).value, a[k - 1], 'year k under A');
    expectClose((inst.parts[1].answer as NumericSpec).value, sum(a, N), 'total A');
    expectClose((inst.parts[2].answer as NumericSpec).value, sum(b, N), 'total B');
    const better = (inst.parts[3].answer as ChoiceSpec).correct[0];
    expect((better === 0) === sum(a, N) > sum(b, N), 'which is larger');
    let n = 1;
    while (sum(b, n) <= T) n++;
    expectClose(evaluate((inst.parts[4].answer as ExactSpec).value), n, 'least n');
  },
});

const templates: Template[] = [salaries];
export default templates;
