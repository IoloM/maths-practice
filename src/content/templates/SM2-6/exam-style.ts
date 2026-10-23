/** Mechanics Year 2, Chapter 6 — long exam-style question: a projectile from the top of a cliff into the sea. */
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtSF } from '../../../engine/core/format';
import { plot } from '../../../engine/core/svg';
import { answerTex } from '../../../engine/marking/mark';
import type { NumericSpec } from '../../../engine/marking/types';
import { A1, ACC_G, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { G, U, pickAngle } from '../shared/mech';

const NG = (v: number, unit?: string) => ans.num(v, ACC_G, unit ? { unit } : {});

const cliff = defineTemplate({
  id: 'sm2.6.long-projectile-from-a-cliff',
  family: 'sm2.6.exam-style',
  title: 'Exam-style: projectile from a cliff — greatest height, time of flight, range, impact speed, refinement',
  spec: ['M7.5', 'M7.3'],
  chapter: 'SM2.6',
  sections: ['6.3', '6.4'],
  level: 'A2',
  paper: [3],
  difficulty: 4,
  marks: 13,
  time: 16,
  commands: ['Find', 'Suggest'],
  tags: ['exam-style', 'projectiles', 'suvat', 'modelling'],
  generate(r) {
    const a = pickAngle(r);
    const u = r.pick([14, 15, 18, 20, 21, 24, 25, 28]);
    const H = r.pick([20, 25, 30, 35, 40, 45, 50, 60, 70]);
    const ux = u * a.cos,
      uy = u * a.sin;
    const top = H + (uy * uy) / (2 * G);
    // H + uy t − ½gt² = 0
    const T = (uy + Math.sqrt(uy * uy + 2 * G * H)) / G;
    const range = ux * T;
    const vy = uy - G * T;
    const speed = Math.hypot(ux, vy);
    const below = (Math.atan2(-vy, ux) * 180) / Math.PI;
    // taking s = +H by mistake: 4.9t² − u_y t + H = 0 (only has roots when the ball would rise H)
    const disc = uy * uy - 2 * G * H;
    const wrongSign = disc >= 0 ? (uy + Math.sqrt(disc)) / G : 0;
    const TOP = NG(top, U.m),
      TT = NG(T, U.s),
      RR = NG(range, U.m),
      SP = NG(speed, U.ms);
    const angleWords = a.exact ? md`at an angle $\alpha$ above the horizontal, where ${a.given}` : md`at $${a.tex}$ above the horizontal`;
    const svg = plot({
      x: [-range * 0.12, range * 1.08],
      y: [-H * 0.1, top * 1.15],
      w: 340,
      h: 220,
      curves: [{ para: { x: (t) => ux * t, y: (t) => H + uy * t - 0.5 * G * t * t, t: [0, T] }, dash: true }],
      vlines: [{ x: 0, from: 0, to: H, label: `${H} m` }],
      points: [
        { x: 0, y: H, label: 'O', dot: true, dx: -12 },
        { x: range, y: 0, label: 'S', dot: true, dy: 14 },
      ],
      axes: { x: 'sea level', y: '' },
    });
    return {
      stem: md`A ball is projected from a point $O$ at the top of a vertical cliff, $${H}$ m above the sea, with speed $${u}$ m s$^{-1}$ ${angleWords}. It moves freely under gravity and hits the sea at the point $S$. The ball is modelled as a particle.`,
      diagram: { svg, alt: `A vertical cliff of height ${H} m with the ball's curved path from O at the top, rising then falling to S on the sea.` },
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: 'Find the greatest height of the ball above the sea.',
          answer: TOP,
          scheme: [B1(md`Vertical component $${u}${a.exact ? `\\times ${a.sinTex}` : `\\sin ${a.tex}`} = ${fmtSF(uy, 4)}$`), M1(md`$0 = ${fmtSF(uy, 4)}^{2} - 2gs$`), A1(md`$${fmtSF(uy * uy / (2 * G), 4)} + ${H} = ${answerTex(TOP)}$`)],
          hints: ['At the greatest height the vertical velocity is zero.', md`Vertical: $u = ${fmtSF(uy, 4)}$, $v = 0$, $a = -9.8$.`, `Use v² = u² + 2as, then add the height of the cliff.`],
          errors: [err('forgot-cliff', NG((uy * uy) / (2 * G), U.m), md`That is the height above $O$; add the $${H}$ m cliff.`, 2)],
          solution: [md`$0 = ${fmtSF(uy, 4)}^{2} - 2(9.8)s \Rightarrow s = ${fmtSF((uy * uy) / (2 * G), 4)}$ m above $O$`, md`Height above the sea: $${answerTex(TOP)}$`],
        }),
        part({
          label: 'b',
          marks: 4,
          prompt: 'Find the time taken for the ball to travel from O to S.',
          answer: TT,
          scheme: [M1(md`$-${H} = ${fmtSF(uy, 4)}t - 4.9t^{2}$`), A1('Correct quadratic'), dM1('Solves the quadratic'), A1(md`$t = ${answerTex(TT)}$`)],
          hints: [md`Take up as positive: the ball ends $${H}$ m below $O$, so $s = -${H}$.`, 's = ut + ½at² with a = −9.8', 'Solve the quadratic and take the positive root.'],
          errors: wrongSign > 0 ? [err('displacement-sign', NG(wrongSign, U.s), md`The ball finishes below $O$: use $s = -${H}$, not $+${H}$.`, 1)] : [],
          solution: [md`$4.9t^{2} - ${fmtSF(uy, 4)}t - ${H} = 0 \Rightarrow t = ${answerTex(TT)}$ (positive root)`],
        }),
        part({
          label: 'c',
          marks: 2,
          prompt: 'Find the horizontal distance from the foot of the cliff to S.',
          answer: RR,
          ft: (prev) => (prev.b?.value && prev.b.value > 0 ? NG(ux * prev.b.value, U.m) : null),
          scheme: [M1(md`$${fmtSF(ux, 4)} \times$ their time`), A1(md`$${answerTex(RR)}$`)],
          hints: ['Horizontally there is no acceleration.', md`Horizontal component $${fmtSF(ux, 4)}$ m s$^{-1}$`, 'distance = speed × time'],
          solution: [md`$${fmtSF(ux, 4)} \times ${fmtSF(T, 4)} = ${answerTex(RR)}$`],
        }),
        part({
          label: 'd',
          marks: 3,
          prompt: 'Find the speed of the ball as it hits the sea.',
          answer: SP,
          scheme: [M1(md`Vertical velocity: $${fmtSF(uy, 4)} - 9.8t$ (or $v^{2} = u^{2} + 2as$ with $s = -${H}$)`), M1('Pythagoras with the horizontal component'), A1(md`$${answerTex(SP)}$`)],
          hints: ['The horizontal component of velocity never changes.', md`Vertically, $v^{2} = ${fmtSF(uy, 4)}^{2} + 2(9.8)(${H})$.`, 'Speed = √(horizontal² + vertical²)'],
          errors: [err('vertical-only', NG(Math.abs(vy), U.ms), 'That is only the vertical component: combine it with the horizontal one.', 2)],
          solution: [md`$v_{y}^{2} = ${fmtSF(uy, 4)}^{2} + 2(9.8)(${H}) \Rightarrow |v_{y}| = ${fmtSF(Math.abs(vy), 4)}$`, md`Speed $= \sqrt{${fmtSF(ux, 4)}^{2} + ${fmtSF(Math.abs(vy), 4)}^{2}} = ${answerTex(SP)}$ (at $${fmtSF(below, 3)}^{\circ}$ below the horizontal)`],
        }),
        part({
          label: 'e',
          marks: 1,
          prompt: 'Suggest one refinement to the model that would make it more realistic.',
          answer: ans.self('Include air resistance; or model the ball as having size rather than as a particle; or take account of spin or wind.'),
          scheme: [B1('Air resistance, the size of the ball, spin or wind')],
          hints: ['What has the particle model ignored?', 'Think about the air.', 'Think about the size and spin of the ball.'],
          solution: ['Include air resistance (or treat the ball as an object with size, or include spin or wind).'],
        }),
      ],
      params: { u, H, sin: a.sin, cos: a.cos },
    };
  },
  verify(inst) {
    const { u, H, sin, cos } = inst.params as Record<string, number>;
    // step the motion numerically
    let x = 0,
      y = H,
      vx = u * cos,
      vy = u * sin,
      t = 0,
      top = H;
    const dt = 1e-5;
    while (y > 0) {
      vy -= G * dt;
      y += vy * dt;
      x += vx * dt;
      t += dt;
      top = Math.max(top, y);
    }
    expect(Math.abs(top - (inst.parts[0].answer as NumericSpec).value) < 1e-3, 'greatest height');
    expect(Math.abs(t - (inst.parts[1].answer as NumericSpec).value) < 1e-3, 'time of flight');
    expect(Math.abs(x - (inst.parts[2].answer as NumericSpec).value) < 0.02, 'range');
    expectClose(Math.hypot(vx, vy), (inst.parts[3].answer as NumericSpec).value, 'impact speed', 1e-3);
    // energy: speed² = u² + 2gH, whatever the angle
    expectClose((inst.parts[3].answer as NumericSpec).value ** 2, u * u + 2 * G * H, 'energy check', 1e-6);
  },
});

const templates: Template[] = [cliff];
export default templates;
