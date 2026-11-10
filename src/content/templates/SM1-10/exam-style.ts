/** Mechanics Year 1, Chapter 10 — long exam-style question: a car towing a trailer, then the tow bar breaks. */
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, A1ft, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { U, towDiagram } from '../shared/mech';

const N3 = (v: number, unit?: string) => ans.num(v, { sf: 3 }, unit ? { unit } : {});
const g3 = (v: number) => fmtSF(v, 3);

const longTow = defineTemplate({
  id: 'sm1.10.long-car-trailer-tow-bar-breaks',
  family: 'sm1.10.connected',
  title: 'Exam-style: a car tows a trailer — acceleration, tension, then the tow bar breaks',
  spec: ['M8.4', 'M8.2', 'M7.3'],
  chapter: 'SM1.10',
  sections: ['10.5'],
  level: 'AS',
  paper: [3],
  difficulty: 4,
  marks: 10,
  time: 12,
  commands: ['Find', 'State'],
  tags: ['exam-style', 'connected particles', 'tow bar', 'suvat'],
  generate(r) {
    const M = r.step(800, 1500, 50),
      m = r.step(200, 800, 50);
    const rc = r.step(200, 600, 20),
      rt = r.step(100, 400, 20);
    const D = r.step(1500, 4000, 100);
    const a = (D - rc - rt) / (M + m);
    r.require(a > 0.3 && a < 2.5);
    const T = m * a + rt;
    const u = r.int(10, 25);
    const dec = rt / m;
    const dist = (u * u) / (2 * dec);
    r.require(dist < 2000);
    const A = N3(a, U.ms2),
      Tn = N3(T, U.N),
      S = N3(dist, U.m);
    const light: ChoiceSpec = ans.choice(
      [
        'The tension is the same all the way along the tow bar.',
        'The tow bar does not stretch, so the car and trailer have the same acceleration.',
        'The tow bar is rigid, so it can push as well as pull.',
        'The resistance to motion acts on the car only.',
      ],
      0,
    );
    return {
      stem: md`A car of mass $${M}$ kg tows a trailer of mass $${m}$ kg along a straight horizontal road. The trailer is attached to the car by a tow bar, which is horizontal and parallel to the direction of motion. The resistances to motion of the car and the trailer are constant, of magnitudes $${rc}$ N and $${rt}$ N. The engine of the car produces a constant driving force of $${D}$ N. The tow bar is modelled as a light rod, and the car and trailer as particles.`,
      diagram: { svg: towDiagram(`car ${M} kg`, `trailer ${m} kg`), alt: 'A car pulling a trailer to the right with driving force D, joined by a tow bar.' },
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: 'Find the acceleration of the car and trailer.',
          answer: A,
          scheme: [M1('Equation of motion for the whole system'), A1(md`$${D} - ${rc} - ${rt} = ${M + m}a$`), A1(md`$a = ${g3(a)}$ m s$^{-2}$`)],
          hints: ['Treat the car and trailer as one body: the tension is internal.', md`Resultant force $= ${D} - ${rc} - ${rt}$; total mass $= ${M + m}$ kg.`, 'Use F = ma.'],
          errors: [err('car-mass-only', N3((D - rc - rt) / M, U.ms2), 'The force accelerates the car and the trailer: use the total mass.', 1)],
          solution: [md`$${D} - ${rc} - ${rt} = ${M + m}a \Rightarrow a = ${answerTex(A)}$`],
        }),
        part({
          label: 'b',
          marks: 3,
          prompt: 'Find the tension in the tow bar.',
          answer: Tn,
          ft: (prev) => (prev.a?.value ? N3(m * prev.a.value + rt, U.N) : null),
          scheme: [M1('Equation of motion for the trailer (or the car)'), A1(md`$T - ${rt} = ${m}a$`), A1ft(md`$T = ${g3(T)}$ N`)],
          hints: ['Now look at the trailer on its own.', 'Forces on the trailer: the tension forwards and its resistance backwards.', md`$T - ${rt} = ${m} \times ${g3(a)}$`],
          errors: [err('forgot-resistance', N3(m * a, U.N), md`The trailer's resistance of $${rt}$ N acts on it too.`, 1)],
          solution: [md`Trailer: $T - ${rt} = ${m} \times ${g3(a)} \Rightarrow T = ${answerTex(Tn)}$`],
        }),
        part({
          label: 'c',
          marks: 3,
          prompt: md`When the speed of the car and trailer is $${u}$ m s$^{-1}$, the tow bar breaks. The resistance to the motion of the trailer is unchanged. Find the distance the trailer travels after the tow bar breaks, before it comes to rest.`,
          answer: S,
          scheme: [M1(md`Trailer's deceleration: $${rt} = ${m}a \Rightarrow a = ${g3(dec)}$`), dM1(md`$0^{2} = ${u}^{2} - 2(${g3(dec)})s$`), A1(md`$s = ${g3(dist)}$ m`)],
          hints: ['After the break, the only horizontal force on the trailer is its resistance.', md`Deceleration $= ${rt} \div ${m} = ${g3(dec)}$ m s$^{-2}$.`, md`Use $v^{2} = u^{2} + 2as$ with $v = 0$.`],
          errors: [err('old-acceleration', N3((u * u) / (2 * a), U.m), "After the break the trailer isn't being pulled: it decelerates under its resistance alone.")],
          solution: [md`$${rt} = ${m}a \Rightarrow$ deceleration $${g3(dec)}$ m s$^{-2}$`, md`$0 = ${u}^{2} - 2(${g3(dec)})s \Rightarrow s = ${answerTex(S)}$`],
        }),
        part({
          label: 'd',
          marks: 1,
          prompt: 'State how you have used the modelling assumption that the tow bar is light.',
          answer: light,
          scheme: [B1('The tension is the same throughout the tow bar')],
          hints: ['A light rod has no mass.', 'If it has no mass, what can you say about the forces at its two ends?', 'Think about the tension.'],
          solution: ['The tension is the same throughout the tow bar (so the same force acts on the car and on the trailer).'],
        }),
      ],
      params: { M, m, rc, rt, D, u },
    };
  },
  verify(inst) {
    const { M, m, rc, rt, D, u } = inst.params as Record<string, number>;
    const a = (inst.parts[0].answer as NumericSpec).value,
      T = (inst.parts[1].answer as NumericSpec).value;
    expectClose(D - rc - T, M * a, 'car on its own');
    expectClose(T - rt, m * a, 'trailer on its own');
    // trailer after the break: time to stop from v = u + at, then average speed × time
    const t = u / (rt / m);
    const s = (u / 2) * t;
    expect(Math.abs(s - (inst.parts[2].answer as NumericSpec).value) < 1e-6 * s, 'stopping distance');
  },
});

export default [longTow] satisfies Template[];
