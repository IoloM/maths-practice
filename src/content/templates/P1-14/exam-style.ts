/** Pure Year 1, Chapter 14 — long exam-style question: an exponential model y = A + Be^(−kt). */
import { Q } from '../../../engine/core/rational';
import { evaluate } from '../../../engine/core/expr';
import { derivative, expectClose } from '../../../engine/core/numeric';
import { fmtSF, texNum } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex } from '../shared/calculus';

interface Context {
  stem: (A: number) => string;
  v: string;
  unit: string;
  tUnit: string;
  rateUnit: string;
  A: number[];
  start: [number, number];
  t1: number[];
  limitation: string;
}

const CONTEXTS: Context[] = [
  {
    stem: (A) => md`A cup of tea is made and left to cool in a room. Its temperature, $\theta$ °C, $t$ minutes after it is made is modelled by $\theta = ${texNum(A)} + Be^{-kt}$, where $B$ and $k$ are positive constants.`,
    v: '\\theta',
    unit: '°C',
    tUnit: 'minutes',
    rateUnit: '°C per minute',
    A: [18, 20, 22],
    start: [85, 95],
    t1: [4, 5, 6, 8, 10],
    limitation: 'The room temperature may not stay constant; or the model predicts the tea never quite reaches room temperature; or stirring, a lid or adding milk would change the rate of cooling.',
  },
  {
    stem: (A) => md`An oven is switched off. Its temperature, $\theta$ °C, $t$ minutes later is modelled by $\theta = ${texNum(A)} + Be^{-kt}$, where $B$ and $k$ are positive constants.`,
    v: '\\theta',
    unit: '°C',
    tUnit: 'minutes',
    rateUnit: '°C per minute',
    A: [19, 21, 24],
    start: [180, 240],
    t1: [10, 15, 20],
    limitation: 'The kitchen temperature may change (e.g. while cooking continues); or the door being opened would change the rate of cooling; or the model is only valid while the oven is off.',
  },
  {
    stem: (A) => md`The value, £$V$, of a car $t$ years after it was bought new is modelled by $V = ${texNum(A)} + Be^{-kt}$, where $B$ and $k$ are positive constants.`,
    v: 'V',
    unit: '£',
    tUnit: 'years',
    rateUnit: '£ per year',
    A: [1000, 1500, 2000],
    start: [16000, 30000],
    t1: [2, 3, 4],
    limitation: 'The car will not keep a value of at least the constant amount for ever (it may be scrapped); or mileage, condition or the market also affect the value; or values of some cars rise again when they become classics.',
  },
];

const expModel = defineTemplate({
  id: 'p1.14.long-exponential-model',
  family: 'p1.14.exam-style',
  title: 'Exam-style: an exponential model — constants, exact k, a time, a rate and a limitation',
  spec: ['P6.7', 'P6.5', 'P6.2'],
  chapter: 'P1.14',
  sections: ['14.3', '14.7', '14.2'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 11,
  time: 14,
  commands: ['Find', 'Suggest'],
  tags: ['exam-style', 'exponential modelling', 'logarithms', 'rates of change'],
  generate(r) {
    const C = r.pick(CONTEXTS);
    const A = r.pick(C.A);
    const step = C.unit === '£' ? 500 : 5;
    const y0 = A + step * r.int(Math.ceil((C.start[0] - A) / step), Math.floor((C.start[1] - A) / step));
    const B = y0 - A;
    const t1 = r.pick(C.t1);
    // y(t1) − A as a simple fraction of B, so that k = (1/t1) ln(B / (y1 − A)) is exact and tidy
    const frac = r.pick([Q.of(4, 5), Q.of(3, 4), Q.of(2, 3), Q.of(3, 5), Q.of(1, 2), Q.of(5, 7), Q.of(7, 10)]);
    const d1 = frac.mul(B);
    r.require(d1.isInt);
    const y1 = A + d1.value;
    const k = Math.log(B / d1.value) / t1;
    const ratio = Q.of(B).div(d1); // = 1/frac
    const kTex = `\\frac{1}{${t1}}\\ln${ratio.isInt ? ratio.toLatex() : `\\left(${ratio.toLatex()}\\right)`}`;
    // a later value, between A and y1
    const d2 = Math.round(d1.value * r.pick([0.2, 0.25, 0.3, 0.4, 0.5]));
    r.require(d2 > 0 && d2 < d1.value);
    const y2 = A + d2;
    const t2 = Math.log(B / d2) / k;
    const t3 = r.pick(C.t1.filter((t) => t !== t1));
    const rate = k * B * Math.exp(-k * t3);
    const accTime = { sf: 3 } as const;
    const Bans: NumericSpec = ans.num(B, { dp: 0 });
    const K: ExactSpec = ans.exact(ex(kTex), ['exact']);
    const T2: NumericSpec = ans.num(t2, accTime);
    const R: NumericSpec = ans.num(rate, { sf: 3 });
    return {
      stem: `${C.stem(A)} ${md`When $t = 0$, $${C.v} = ${texNum(y0)}$, and when $t = ${t1}$, $${C.v} = ${texNum(y1)}$.`}`,
      parts: [
        part({
          label: 'a',
          marks: 1,
          prompt: md`Find the value of $B$.`,
          answer: Bans,
          scheme: [B1(md`$B = ${texNum(B)}$`)],
          hints: [md`Substitute $t = 0$: $e^{0} = 1$.`, md`$${texNum(y0)} = ${texNum(A)} + B$`, `Subtract ${texNum(A)}.`],
          solution: [md`$t = 0$: $${texNum(y0)} = ${texNum(A)} + B \Rightarrow B = ${texNum(B)}$`],
        }),
        part({
          label: 'b',
          marks: 3,
          prompt: md`Show that $k = \dfrac{1}{${t1}}\ln p$, where $p$ is a rational number to be found, and hence write down the exact value of $k$.`,
          answer: K,
          scheme: [M1(md`$${texNum(y1)} = ${texNum(A)} + ${texNum(B)}e^{-${t1}k}$`), dM1(md`$e^{-${t1}k} = \dfrac{${texNum(d1.value)}}{${texNum(B)}}$ and takes logs correctly`), A1(md`$k = ${kTex}$`)],
          hints: [md`Substitute $t = ${t1}$ and $${C.v} = ${texNum(y1)}$.`, md`$e^{-${t1}k} = \dfrac{${texNum(d1.value)}}{${texNum(B)}}$`, md`Take ln of both sides: $-${t1}k = \ln\left(\dfrac{${texNum(d1.value)}}{${texNum(B)}}\right) = -\ln\left(\dfrac{${texNum(B)}}{${texNum(d1.value)}}\right)$.`],
          errors: [err('decimal-k', ans.num(k, { sf: 3 }), 'That value is right, but the question asks for the exact value in terms of ln.', 2)],
          solution: [md`$e^{-${t1}k} = \dfrac{${texNum(d1.value)}}{${texNum(B)}} \Rightarrow ${t1}k = \ln\left(${ratio.toLatex()}\right)$`, md`$k = ${answerTex(K)}$`],
        }),
        part({
          label: 'c',
          marks: 3,
          prompt: md`Find, according to the model, the time when $${C.v} = ${texNum(y2)}$. Give your answer to 3 significant figures.`,
          answer: T2,
          scheme: [M1(md`$${texNum(y2)} = ${texNum(A)} + ${texNum(B)}e^{-kt}$`), dM1(md`$t = \dfrac{1}{k}\ln\left(\dfrac{${texNum(B)}}{${texNum(d2)}}\right)$ with their $k$`), A1(md`awrt $${fmtSF(t2, 3)}$ ${C.tUnit}`)],
          hints: [md`Set $${C.v} = ${texNum(y2)}$ and rearrange for $e^{-kt}$.`, md`$e^{-kt} = \dfrac{${texNum(d2)}}{${texNum(B)}}$`, 'Take ln and divide by −k (keep k exact or in full).'],
          errors: [err('rounded-k', ans.num(Math.log(B / d2) / Number(fmtSF(k, 2)), accTime), 'Use k in full (or exact): rounding it to 2 s.f. throws the time off.', 2)],
          solution: [md`$e^{-kt} = \dfrac{${texNum(d2)}}{${texNum(B)}} \Rightarrow t = \dfrac{\ln(${texNum(B)}/${texNum(d2)})}{k} = ${answerTex(T2)}$ ${C.tUnit}`],
        }),
        part({
          label: 'd',
          marks: 3,
          prompt: md`Find the rate at which $${C.v}$ is decreasing when $t = ${t3}$, giving your answer in ${C.rateUnit} to 3 significant figures.`,
          answer: R,
          scheme: [M1(md`$\dfrac{\mathrm{d}${C.v}}{\mathrm{d}t} = -kBe^{-kt}$`), dM1(md`Substitutes $t = ${t3}$ with their $k$ and $B$`), A1(md`awrt $${fmtSF(rate, 3)}$`)],
          hints: [md`Differentiate: $\dfrac{\mathrm{d}}{\mathrm{d}t}\left(e^{-kt}\right) = -ke^{-kt}$.`, md`$\dfrac{\mathrm{d}${C.v}}{\mathrm{d}t} = -${texNum(B)}ke^{-kt}$`, `The rate of decrease is the size of this (a positive number).`],
          errors: [err('value-not-rate', ans.num(A + B * Math.exp(-k * t3), { sf: 3 }), md`That is the value of $${C.v}$ at $t = ${t3}$; the rate needs $\dfrac{\mathrm{d}${C.v}}{\mathrm{d}t}$.`, 0)],
          solution: [md`$\dfrac{\mathrm{d}${C.v}}{\mathrm{d}t} = -${texNum(B)}ke^{-kt}$; at $t = ${t3}$: $${fmtSF(-rate, 4)}$`, md`Decreasing at $${answerTex(R)}$ ${C.rateUnit}`],
        }),
        part({
          label: 'e',
          marks: 1,
          prompt: `Suggest one limitation of the model.`,
          answer: ans.self(C.limitation),
          scheme: [B1(`A sensible limitation in context, e.g. ${C.limitation.split(';')[0]}.`)],
          hints: ['Think about what the model assumes stays fixed.', `What happens to ${C.v === 'V' ? 'V' : 'θ'} as t gets very large?`, 'Is anything else likely to affect the real situation?'],
          solution: [C.limitation],
        }),
      ],
      params: { A, B, y0, y1, y2, t1, t3, ratio: ratio.value },
    };
  },
  verify(inst) {
    const { A, B, y0, y1, y2, t1, t3 } = inst.params as Record<string, number>;
    expectClose((inst.parts[0].answer as NumericSpec).value, y0 - A, 'B');
    const k = evaluate((inst.parts[1].answer as ExactSpec).value);
    const y = (t: number) => A + B * Math.exp(-k * t);
    expectClose(y(t1), y1, 'model through the second point');
    expectClose(y((inst.parts[2].answer as NumericSpec).value), y2, 'time for the later value');
    expectClose((inst.parts[3].answer as NumericSpec).value, -derivative(y, t3), 'rate of decrease', 1e-6);
  },
});

const templates: Template[] = [expModel];
export default templates;
