/** Mechanics Year 2, Chapter 6 — A* stretch: the speed needed to hit a target, then the time, the speed on arrival and whether it is rising (projectiles, algebra). */
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, ACC_G, B1, M1, ans, defineTemplate, dM1, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { G, U } from '../shared/mech';

const NG = (v: number, unit: string) => ans.num(v, ACC_G, { unit });
const g3 = (v: number) => fmtSF(v, 3);

const hitTarget = defineTemplate({
  id: 'sm2.6.stretch-speed-to-hit-a-target',
  family: 'stretch.speed-to-hit-a-target',
  title: 'A* stretch: the speed of projection needed to hit a target, and the motion when it gets there',
  spec: ['M7.5', 'M7.3'],
  chapter: 'SM2.6',
  level: 'A2',
  paper: [3],
  difficulty: 5,
  marks: 12,
  time: 15,
  commands: ['Find', 'Determine'],
  tags: ['stretch', 'synoptic', 'projectiles', 'suvat', 'rearranging', 'speed'],
  generate(r) {
    const [s, c, tanTex] = r.pick([
      [0.6, 0.8, '\\frac{3}{4}'],
      [0.8, 0.6, '\\frac{4}{3}'],
      [5 / 13, 12 / 13, '\\frac{5}{12}'],
    ] as const);
    const d = r.int(8, 40);
    const h = r.int(-6, 10);
    const tan = s / c;
    r.require(d * tan - h > 2);
    const U2 = (G * d * d) / (2 * c * c * (d * tan - h));
    const u = Math.sqrt(U2);
    r.require(u >= 8 && u <= 35);
    const T = d / (u * c);
    const vx = u * c;
    const vy = u * s - G * T;
    const speed = Math.hypot(vx, vy);
    r.require(Math.abs(vy) > 0.5);
    const rising = vy > 0;
    const SU = NG(u, U.ms),
      ST = NG(T, U.s),
      SV = NG(speed, U.ms);
    const RISE: ChoiceSpec = ans.choice(['Rising', 'Falling'], rising ? 0 : 1);
    const where = h > 0 ? `$${h}$ m above the level of $O$` : h < 0 ? `$${-h}$ m below the level of $O$` : 'at the same level as $O$';
    const hTex = h < 0 ? `(${h})` : `${h}`;
    return {
      stem: md`A ball is projected from a point $O$ with speed $U\text{ m s}^{-1}$ at an angle $\theta$ above the horizontal, where $\tan\theta = ${tanTex}$. It moves freely under gravity and hits a small target $T$, which is a horizontal distance of $${d}$ m from $O$ and ${where}.`,
      parts: [
        part({
          label: 'a',
          marks: 4,
          prompt: md`Find the value of $U$.`,
          answer: SU,
          scheme: [
            M1(md`Horizontal: $${d} = U\cos\theta \times t$, with $\cos\theta = ${fmtNum(c, 4)}$`),
            M1(md`Vertical: $${hTex} = U\sin\theta \times t - \tfrac{1}{2}g t^{2}$`),
            dM1(md`Eliminates $t$: $${hTex} = ${d}\tan\theta - \dfrac{g \times ${d}^{2}}{2U^{2}\cos^{2}\theta}$`),
            A1(md`$U = ${g3(u)}$`),
          ],
          hints: [md`From $\tan\theta = ${tanTex}$: $\sin\theta = ${fmtNum(s, 4)}$ and $\cos\theta = ${fmtNum(c, 4)}$ (a right-angled triangle).`, md`Horizontally there is no acceleration: $t = \dfrac{${d}}{U\cos\theta}$.`, md`Put that $t$ into $s = ut + \tfrac{1}{2}at^{2}$ vertically, with $s = ${hTex}$ and $a = -g$, then solve for $U^{2}$.`],
          solution: [md`$t = \dfrac{${d}}{${fmtNum(c, 4)}U}$`, md`$${hTex} = ${d} \times ${tanTex} - \dfrac{9.8 \times ${d * d}}{2 \times ${fmtNum(c * c, 4)}U^{2}}$, so $U^{2} = ${g3(U2)}$`, md`$U = ${answerTex(SU)}$`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: 'Find the time taken for the ball to reach the target.',
          answer: ST,
          scheme: [M1(md`$t = \dfrac{${d}}{U\cos\theta}$`), A1(md`$${answerTex(ST)}$`)],
          hints: ['Use the horizontal motion: constant speed U cos θ.', md`$U\cos\theta = ${g3(vx)}$`, md`$t = \dfrac{${d}}{${g3(vx)}}$`],
          solution: [md`$t = \dfrac{${d}}{${g3(vx)}} = ${answerTex(ST)}$`],
        }),
        part({
          label: 'c',
          marks: 4,
          prompt: 'Find the speed of the ball as it reaches the target.',
          answer: SV,
          scheme: [B1(md`Horizontal component $${g3(vx)}$`), M1(md`Vertical: $v = U\sin\theta - gt$`), M1('Speed = √(horizontal² + vertical²)'), A1(md`$${answerTex(SV)}$`)],
          hints: ['The horizontal component of velocity never changes.', md`Vertically $v = ${g3(u * s)} - 9.8 \times ${g3(T)} = ${g3(vy)}$`, 'Combine the two components with Pythagoras.'],
          solution: [md`Horizontal: $${g3(vx)}$; vertical: $${g3(u * s)} - 9.8 \times ${g3(T)} = ${g3(vy)}$`, md`Speed $= \sqrt{${g3(vx)}^{2} + ${g3(vy)}^{2}} = ${answerTex(SV)}$`],
        }),
        part({
          label: 'd',
          marks: 2,
          prompt: 'Is the ball rising or falling when it hits the target?',
          answer: RISE,
          scheme: [M1('Uses the sign of the vertical component of velocity at the target'), A1(`${rising ? 'Rising' : 'Falling'}: the vertical component is ${rising ? 'positive (upwards)' : 'negative (downwards)'}`)],
          hints: ['Look at your vertical velocity from (c).', 'Positive means moving upwards.', md`The vertical component is $${g3(vy)}$.`],
          solution: [md`The vertical component of velocity is $${g3(vy)}$, so the ball is ${rising ? 'still rising' : 'falling'}.`],
        }),
      ],
      params: { s, c, d, h },
    };
  },
  verify(inst) {
    const { s, c, d, h } = inst.params as Record<string, number>;
    const u = (inst.parts[0].answer as NumericSpec).value;
    const t = (inst.parts[1].answer as NumericSpec).value;
    expectClose(u * c * t, d, 'reaches the target horizontally');
    expect(Math.abs(u * s * t - 0.5 * G * t * t - h) < 1e-9, 'reaches the target vertically');
    const vy = u * s - G * t;
    expectClose((inst.parts[2].answer as NumericSpec).value, Math.hypot(u * c, vy), 'speed');
    expect((inst.parts[3].answer as ChoiceSpec).correct[0] === (vy > 0 ? 0 : 1), 'rising or falling');
  },
});

const templates: Template[] = [hitTarget];
export default templates;
