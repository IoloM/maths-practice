/** Mechanics Year 1, Chapter 9 — long exam-style question: one car accelerates to a top speed and overtakes another. */
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { U } from '../shared/mech';

const N3 = (v: number, unit: string) => ans.num(v, { sf: 3 }, { unit });

const overtaking = defineTemplate({
  id: 'sm1.9.long-car-overtakes-a-lorry',
  family: 'sm1.9.exam-style',
  title: 'Exam-style: a car accelerates to its top speed and overtakes a lorry',
  spec: ['M7.3', 'M7.2'],
  chapter: 'SM1.9',
  sections: ['9.3', '9.4'],
  level: 'AS',
  paper: [3],
  difficulty: 4,
  marks: 11,
  time: 14,
  commands: ['Find', 'State'],
  tags: ['exam-style', 'constant acceleration', 'suvat', 'velocity–time graphs', 'modelling'],
  generate(r) {
    const acc = r.pick([1.2, 1.5, 2, 2.5, 3]);
    const V = r.pick([18, 20, 24, 25, 28, 30]);
    const Ul = r.pick([12, 14, 15, 16, 18, 20, 22]);
    // the car only catches the lorry after reaching top speed when V < 2U, and must be faster: U < V
    r.require(Ul < V && V < 2 * Ul - 1);
    const t1 = V / acc;
    const gap = Ul * t1 - (V * V) / (2 * acc);
    const tc = (V * V) / (2 * acc * (V - Ul));
    const dc = Ul * tc;
    const T1 = N3(t1, U.s),
      GAP = N3(gap, U.m),
      TC = N3(tc, U.s),
      DC = N3(dc, U.m);
    return {
      stem: md`A car is waiting at a junction $O$ on a straight road. At the instant a lorry passes $O$, travelling at a constant $${Ul}$ m s$^{-1}$, the car sets off in the same direction. The car accelerates uniformly at $${fmtNum(acc)}$ m s$^{-2}$ until it reaches $${V}$ m s$^{-1}$, then continues at this constant speed. The car and the lorry are modelled as particles.`,
      parts: [
        part({
          label: 'a',
          marks: 1,
          prompt: 'Find the time the car takes to reach its top speed.',
          answer: T1,
          scheme: [B1(md`$t = \dfrac{${V}}{${fmtNum(acc)}} = ${fmtSF(t1, 3)}$ s`)],
          hints: ['v = u + at', md`$u = 0$, $v = ${V}$, $a = ${fmtNum(acc)}$`, 'Rearrange for t.'],
          solution: [md`$${V} = 0 + ${fmtNum(acc)}t \Rightarrow t = ${answerTex(T1)}$`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: 'Find how far ahead of the car the lorry is at that moment.',
          answer: GAP,
          scheme: [M1(md`Car: $s = \tfrac{1}{2}(${fmtNum(acc)})t^{2}$ or $\dfrac{${V}^{2}}{2(${fmtNum(acc)})}$; lorry: $${Ul}t$`), A1(md`$${fmtSF(gap, 3)}$ m`)],
          hints: [md`Car distance: $s = \tfrac{1}{2}at^{2}$ with your time.`, 'Lorry distance: constant speed × time.', 'Subtract.'],
          errors: [err('car-only', N3((V * V) / (2 * acc), U.m), "That's how far the car has gone; compare it with the lorry's distance.", 1)],
          solution: [md`Car: $\dfrac{${V}^{2}}{2 \times ${fmtNum(acc)}} = ${fmtSF((V * V) / (2 * acc), 4)}$ m; lorry: $${Ul} \times ${fmtSF(t1, 4)} = ${fmtSF(Ul * t1, 4)}$ m`, md`Gap $= ${answerTex(GAP)}$`],
        }),
        part({
          label: 'c',
          marks: 5,
          prompt: 'Find the time, measured from when the lorry passes O, at which the car overtakes the lorry.',
          answer: TC,
          scheme: [
            M1(md`Car's distance for $t > ${fmtSF(t1, 3)}$: $${fmtSF((V * V) / (2 * acc), 4)} + ${V}(t - ${fmtSF(t1, 4)})$`),
            A1('Correct expression for the car'),
            M1(md`Lorry: $${Ul}t$, and equates the distances`),
            dM1('Solves for t'),
            A1(md`$t = ${answerTex(TC)}$`),
          ],
          hints: [md`The car is still behind when it reaches top speed, so it overtakes later, while moving at $${V}$ m s$^{-1}$.`, md`Car: $\dfrac{${V}^{2}}{2(${fmtNum(acc)})} + ${V}\left(t - ${fmtSF(t1, 4)}\right)$; lorry: $${Ul}t$.`, 'Set them equal and solve the linear equation.'],
          errors: [err('accelerating-throughout', N3((2 * Ul) / acc, U.s), 'That assumes the car keeps accelerating, but it stops accelerating at its top speed.', 1)],
          solution: [md`$${fmtSF((V * V) / (2 * acc), 4)} + ${V}(t - ${fmtSF(t1, 4)}) = ${Ul}t$`, md`$${V - Ul}t = ${fmtSF(V * t1 - (V * V) / (2 * acc), 4)} \Rightarrow t = ${answerTex(TC)}$`],
        }),
        part({
          label: 'd',
          marks: 2,
          prompt: 'Find the distance from O at which the car overtakes the lorry.',
          answer: DC,
          ft: (prev) => (prev.c?.value && prev.c.value > 0 ? N3(Ul * prev.c.value, U.m) : null),
          scheme: [M1(md`$${Ul} \times$ their time`), A1(md`$${fmtSF(dc, 3)}$ m`)],
          hints: ["Use the lorry's motion: it's simpler.", md`$${Ul} \times$ your answer to (c)`, 'Check with the car if you like.'],
          solution: [md`$${Ul} \times ${fmtSF(tc, 4)} = ${answerTex(DC)}$`],
        }),
        part({
          label: 'e',
          marks: 1,
          prompt: 'State one limitation of modelling the car and the lorry as particles.',
          answer: ans.self('The vehicles have length: overtaking means the whole car passes the whole lorry, which takes longer than the particle model suggests.'),
          scheme: [B1('Their length is ignored (overtaking really means the whole car gets past the whole lorry)')],
          hints: ['What does a particle ignore?', 'Think about what "overtakes" means for real vehicles.', 'Real cars and lorries have length.'],
          solution: ['The model ignores the lengths of the vehicles: in reality the car must travel further to get completely past the lorry.'],
        }),
      ],
      params: { acc, V, Ul },
    };
  },
  verify(inst) {
    const { acc, V, Ul } = inst.params as Record<string, number>;
    const car = (t: number) => (t <= V / acc ? 0.5 * acc * t * t : (V * V) / (2 * acc) + V * (t - V / acc));
    const t1 = (inst.parts[0].answer as NumericSpec).value;
    expectClose(acc * t1, V, 'reaches top speed');
    expectClose((inst.parts[1].answer as NumericSpec).value, Ul * t1 - car(t1), 'gap');
    // first time the car's distance reaches the lorry's (bisection on t > 0)
    let lo = t1,
      hi = 10 * t1;
    expect(car(hi) > Ul * hi, 'car eventually ahead');
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (car(mid) < Ul * mid) lo = mid;
      else hi = mid;
    }
    expectClose((inst.parts[2].answer as NumericSpec).value, hi, 'overtaking time', 1e-9);
    expectClose((inst.parts[3].answer as NumericSpec).value, Ul * hi, 'overtaking distance', 1e-9);
  },
});

const templates: Template[] = [overtaking];
export default templates;
