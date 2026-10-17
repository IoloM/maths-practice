/** Mechanics Year 2, Chapter 6 — projectiles: horizontal projection, projection at an angle, passing a given point. */
import { evaluate } from '../../../engine/core/expr';
import { expectClose } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { plot } from '../../../engine/core/svg';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, ExactSpec, ListSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, ACC_G, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { G, pickAngle } from '../shared/mech';

const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
const NG = (v: number, unit: string) => ans.num(v, ACC_G, { unit });
const MS = '\\text{m s}^{-1}';

/** Simulate a projectile with a small time step; returns the landing time, range and greatest height. */
function simulate(ux: number, uy: number, y0: number): { t: number; x: number; top: number; vx: number; vy: number } {
  let x = 0,
    y = y0,
    vy = uy,
    t = 0,
    top = y0;
  const dt = 2e-5;
  for (;;) {
    const ny = y + vy * dt - 0.5 * G * dt * dt;
    if (ny < 0 && t > 0) {
      const f = y / (y - ny);
      return { t: t + f * dt, x: x + ux * f * dt, top, vx: ux, vy: vy - G * f * dt };
    }
    y = ny;
    vy -= G * dt;
    x += ux * dt;
    t += dt;
    top = Math.max(top, y);
  }
}

// ---------------------------------------------------------------- 6.1 horizontal projection
const horizontal = defineTemplate({
  id: 'sm2.6.horizontal-projection',
  family: 'sm2.6.projectiles',
  title: 'Horizontal projection from a height: time, distance and landing velocity',
  spec: ['M7.5'],
  chapter: 'SM2.6',
  sections: ['6.1'],
  level: 'A2',
  paper: [3],
  difficulty: 2,
  marks: 7,
  time: 8,
  commands: ['Find', 'State'],
  tags: ['projectiles', 'horizontal projection', 'suvat'],
  generate(r) {
    const h = r.pick([4.9, 10, 19.6, 20, 30, 44.1, 50]),
      u = r.pick([5, 8, 10, 12, 15, 20]);
    const t = Math.sqrt((2 * h) / G),
      x = u * t,
      vy = G * t,
      sp = Math.hypot(u, vy),
      ang = (Math.atan(vy / u) * 180) / Math.PI;
    const ctx = r.pick(['cliff', 'wall', 'plane'] as const);
    const H = md`$${fmtNum(h)}$ m above the ground`;
    const stemText = ctx === 'cliff' ? md`A ball is thrown horizontally with speed $${u}$ m s$^{-1}$ from the top of a vertical cliff, ${H}.` : ctx === 'wall' ? md`A stone is kicked horizontally with speed $${u}$ m s$^{-1}$ off the top of a vertical wall, ${H}.` : md`A parcel is released from a plane flying horizontally at $${u}$ m s$^{-1}$, ${H}.`;
    const T = NG(t, '\\text{s}'),
      X = NG(x, '\\text{m}'),
      S = NG(sp, MS),
      A = ans.num(ang, { sf: 3 }, { unit: '^{\\circ}' });
    const opts = ['The object is a particle and air resistance is negligible', 'The ground is smooth', 'The object is a rigid rod'];
    const C: ChoiceSpec = ans.choice(opts, 0);
    return {
      stem: md`${stemText} Take $g = 9.8$ m s$^{-2}$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the time taken to reach the ground.`, answer: T, scheme: [M1(md`$${fmtNum(h)} = \frac{1}{2}(9.8)t^{2}$`), A1(md`$t = ${fmtSF(t, 3)}$ s`)], hints: ['Vertically: initial vertical speed is 0.', md`$s = ut + \frac{1}{2}at^{2}$ with $u = 0$, $a = 9.8$ (downwards).`, 'Solve for t.'], solution: [md`$${fmtNum(h)} = 4.9t^{2} \Rightarrow t = ${answerTex(T)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Find the horizontal distance travelled.`, answer: X, scheme: [B1(md`$${u} \times ${fmtSF(t, 4)} = ${fmtSF(x, 3)}$ m`)], hints: ['Horizontally there is no acceleration.', 'distance = speed × time.', 'Use your time from (a).'], solution: [md`$x = ${u} \times ${fmtSF(t, 4)} = ${answerTex(X)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the speed on hitting the ground.`, answer: S, scheme: [M1(md`Vertical component $${fmtSF(vy, 4)}$ and Pythagoras with $${u}$`), A1(md`$${fmtSF(sp, 3)}$ m s$^{-1}$`)], hints: ['Find the vertical velocity component at landing: v = u + at.', 'The horizontal component is unchanged.', 'Combine with Pythagoras.'], errors: [err('vertical-only', NG(vy, MS), 'Include the horizontal component too.', 1)], solution: [md`$v_{y} = 9.8 \times ${fmtSF(t, 4)} = ${fmtSF(vy, 4)}$`, md`speed $= \sqrt{${u}^{2} + ${fmtSF(vy, 4)}^{2}} = ${answerTex(S)}$`] }),
        part({ label: 'd', marks: 1, prompt: md`Find the angle below the horizontal at which it hits the ground.`, answer: A, scheme: [B1(md`$\tan^{-1}\dfrac{${fmtSF(vy, 4)}}{${u}} = ${fmtSF(ang, 3)}^{\circ}$`)], hints: ['Use the two velocity components.', 'tan θ = vertical ÷ horizontal.', 'Degrees.'], solution: [md`$\tan\theta = \dfrac{${fmtSF(vy, 4)}}{${u}} \Rightarrow \theta = ${answerTex(A)}$`] }),
        part({ label: 'e', marks: 1, prompt: md`State a modelling assumption you have used.`, answer: C, scheme: [B1('Particle / no air resistance')], hints: ['What forces have you included?', 'What shape is the object assumed to be?', 'Is the motion affected by the air?'], solution: [opts[0]] }),
      ],
      params: { h, u },
    };
  },
  verify(inst) {
    const { h, u } = inst.params as Record<string, number>;
    const s = simulate(u, 0, h);
    expectClose(valOf(inst.parts[0].answer as NumericSpec), s.t, 'time', 1e-4);
    expectClose(valOf(inst.parts[1].answer as NumericSpec), s.x, 'distance', 1e-4);
    expectClose(valOf(inst.parts[2].answer as NumericSpec), Math.hypot(s.vx, s.vy), 'speed', 1e-4);
  },
});

// ---------------------------------------------------------------- 6.2–6.4 projection at an angle
const angled = defineTemplate({
  id: 'sm2.6.projection-at-an-angle',
  family: 'sm2.6.projectiles',
  title: 'Projection at an angle from the ground: time of flight, range, greatest height',
  spec: ['M7.5', 'P5.9'],
  chapter: 'SM2.6',
  sections: ['6.2', '6.3'],
  level: 'A2',
  paper: [3],
  difficulty: 3,
  marks: 7,
  time: 8,
  commands: ['Find', 'Show that'],
  tags: ['projectiles', 'resolving', 'suvat', 'range'],
  generate(r) {
    const A = pickAngle(r);
    r.require(A.deg >= 20);
    const U = r.pick([14, 15, 20, 21, 24.5, 25, 28, 30, 35]);
    const ux = U * A.cos,
      uy = U * A.sin;
    const T = (2 * uy) / G,
      R = ux * T,
      H = (uy * uy) / (2 * G);
    const what = r.pick(['A golf ball is struck', 'A football is kicked', 'A stone is thrown', 'A javelin is launched']);
    const Tt = NG(T, '\\text{s}'),
      Rr = NG(R, '\\text{m}'),
      Hh = NG(H, '\\text{m}');
    const angText = A.exact ? md`at an angle $\alpha$ above the horizontal, where ${A.given}` : md`at an angle of $${A.deg}^{\circ}$ above the horizontal`;
    return {
      stem: md`${what} from a point on horizontal ground with speed $${fmtNum(U)}$ m s$^{-1}$ ${angText}. Take $g = 9.8$ m s$^{-2}$ and model the ball as a particle.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find the time of flight.`, answer: Tt, scheme: [M1(md`Vertical component $${fmtNum(U)}${A.exact ? `\\times ${A.sinTex}` : `\\sin ${A.deg}^{\\circ}`}$`), M1(md`$0 = ut - 4.9t^{2}$ with $u = ${fmtSF(uy, 4)}$`), A1(md`$${fmtSF(T, 3)}$ s`)], hints: ['Resolve the initial velocity vertically.', A.exact ? md`$\sin\alpha = ${A.sinTex}$` : md`Vertical component $= ${fmtNum(U)}\sin ${A.deg}^{\circ}$`, 'It lands when the vertical displacement is 0 again.'], errors: [err('to-top', NG(T / 2, '\\text{s}'), 'That is the time to the highest point — the full flight is twice as long.', 1)], solution: [md`$u_{y} = ${fmtSF(uy, 4)}$; $0 = ${fmtSF(uy, 4)}t - 4.9t^{2} \Rightarrow t = ${answerTex(Tt)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the horizontal range.`, answer: Rr, scheme: [M1(md`Horizontal component $\times$ time`), A1(md`$${fmtSF(R, 3)}$ m`)], hints: ['Resolve the initial velocity horizontally.', A.exact ? md`$\cos\alpha = ${A.cosTex}$` : md`$${fmtNum(U)}\cos ${A.deg}^{\circ}$`, 'Multiply by the time of flight.'], solution: [md`$${fmtSF(ux, 4)} \times ${fmtSF(T, 4)} = ${answerTex(Rr)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the greatest height above the ground.`, answer: Hh, scheme: [M1(md`$0 = ${fmtSF(uy, 4)}^{2} - 2(9.8)s$`), A1(md`$${fmtSF(H, 3)}$ m`)], hints: ['At the top, the vertical velocity is zero.', md`$v^{2} = u^{2} + 2as$ vertically.`, 'Solve for s.'], solution: [md`$s = \dfrac{${fmtSF(uy, 4)}^{2}}{19.6} = ${answerTex(Hh)}$`] }),
      ],
      params: { ux, uy },
    };
  },
  verify(inst) {
    const { ux, uy } = inst.params as Record<string, number>;
    const s = simulate(ux, uy, 0);
    expectClose(valOf(inst.parts[0].answer as NumericSpec), s.t, 'flight time', 1e-4);
    expectClose(valOf(inst.parts[1].answer as NumericSpec), s.x, 'range', 1e-4);
    expectClose(valOf(inst.parts[2].answer as NumericSpec), s.top, 'greatest height', 1e-4);
  },
});

// ---------------------------------------------------------------- 6.4 passing over a wall / reaching a height
const wall = defineTemplate({
  id: 'sm2.6.projectile-clearing-a-wall',
  family: 'sm2.6.projectiles',
  title: 'Does the projectile clear the wall? Height at a given distance and times at a height',
  spec: ['M7.5', 'P2.3'],
  chapter: 'SM2.6',
  sections: ['6.3', '6.4'],
  level: 'A2',
  paper: [3],
  difficulty: 4,
  marks: 8,
  time: 10,
  commands: ['Find', 'Determine'],
  tags: ['projectiles', 'quadratic', 'modelling', 'diagram'],
  generate(r) {
    const A = pickAngle(r);
    r.require(A.deg >= 25);
    const U = r.pick([15, 18, 20, 21, 24, 25, 28]);
    const ux = U * A.cos,
      uy = U * A.sin;
    const Rng = (2 * ux * uy) / G;
    const d = Number(fmtSF(Rng * r.pick([0.3, 0.4, 0.6, 0.7, 0.8]), 2));
    const tw = d / ux;
    const yw = uy * tw - 4.9 * tw * tw;
    r.require(yw > 0.5);
    const Hw = Number(fmtNum(yw + r.pick([-1.2, -0.6, 0.5, 1.1, 2]), 1));
    r.require(Hw > 0.3);
    const clears = yw > Hw;
    const y0 = Number(fmtSF(((uy * uy) / (2 * G)) * r.pick([0.4, 0.5, 0.6, 0.75]), 2));
    const disc = uy * uy - 4 * 4.9 * y0;
    const t1 = (uy - Math.sqrt(disc)) / (2 * 4.9),
      t2 = (uy + Math.sqrt(disc)) / (2 * 4.9);
    const Tw = NG(tw, '\\text{s}'),
      Yw = NG(yw, '\\text{m}');
    const opts = [`Yes, it clears the wall: its height at the wall is about ${fmtSF(yw, 3)} m, which is more than ${Hw} m`, `No, it hits the wall: its height at the wall is about ${fmtSF(yw, 3)} m, which is less than ${Hw} m`];
    const C: ChoiceSpec = ans.choice(opts, clears ? 0 : 1);
    const L: ListSpec = ans.list([ans.num(t1, ACC_G), ans.num(t2, ACC_G)], { v: 't' });
    const f = (x: number) => (uy / ux) * x - (4.9 / (ux * ux)) * x * x;
    const svg = plot({ x: [0, Rng * 1.05], y: [0, Math.max((uy * uy) / (2 * G), Hw) * 1.25], curves: [{ f, from: 0, to: Rng }], vlines: [{ x: d, from: 0, to: Hw, label: 'wall' }], axes: { x: 'x', y: 'y' } });
    return {
      stem: md`A ball is kicked from a point $O$ on horizontal ground with speed $${U}$ m s$^{-1}$ ${A.exact ? md`at an angle $\alpha$ above the horizontal, where ${A.given}` : md`at $${A.deg}^{\circ}$ above the horizontal`}. A vertical wall of height $${Hw}$ m stands $${d}$ m from $O$. Take $g = 9.8$ m s$^{-2}$.`,
      diagram: { svg, alt: `Path of the ball from O, with a vertical wall of height ${Hw} m at a horizontal distance ${d} m.` },
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the time taken for the ball to reach the wall.`, answer: Tw, scheme: [M1(md`$${d} = ${fmtSF(ux, 4)}t$`), A1(md`$t = ${fmtSF(tw, 3)}$ s`)], hints: ['Horizontal motion has constant velocity.', A.exact ? md`Horizontal speed $= ${U} \times ${A.cosTex}$` : md`Horizontal speed $= ${U}\cos ${A.deg}^{\circ}$`, 'time = distance ÷ speed.'], solution: [md`$t = \dfrac{${d}}{${fmtSF(ux, 4)}} = ${answerTex(Tw)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the height of the ball when it reaches the wall.`, answer: Yw, scheme: [M1(md`$s = ${fmtSF(uy, 4)}t - 4.9t^{2}$`), A1(md`$${fmtSF(yw, 3)}$ m`)], hints: ['Use the vertical motion with your time from (a).', md`$s = u_{y}t - \frac{1}{2}gt^{2}$`, 'Use the unrounded time.'], solution: [md`$s = ${fmtSF(uy, 4)}(${fmtSF(tw, 4)}) - 4.9(${fmtSF(tw, 4)})^{2} = ${answerTex(Yw)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`Determine whether the ball clears the wall.`, answer: C, scheme: [B1('Compares with the wall height and concludes')], hints: ['Compare your answer to (b) with the wall height.', 'Model the ball as a particle.', 'State a conclusion.'], solution: [opts[clears ? 0 : 1]] }),
        part({ label: 'd', marks: 3, prompt: md`Ignoring the wall, find the two times at which the ball is $${y0}$ m above the ground.`, answer: L, scheme: [M1(md`$${y0} = ${fmtSF(uy, 4)}t - 4.9t^{2}$`), dM1('Solves the quadratic'), A1(md`$t = ${fmtSF(t1, 3)}$ and $${fmtSF(t2, 3)}$`)], hints: ['Set the vertical displacement equal to ' + y0 + '.', md`$4.9t^{2} - ${fmtSF(uy, 4)}t + ${y0} = 0$`, 'Use the quadratic formula; both roots are valid.'], solution: [md`$4.9t^{2} - ${fmtSF(uy, 4)}t + ${y0} = 0 \Rightarrow ${answerTex(L)}$`] }),
      ],
      params: { ux, uy, d, y0 },
    };
  },
  verify(inst) {
    const { ux, uy, d, y0 } = inst.params as Record<string, number>;
    const tw = valOf(inst.parts[0].answer as NumericSpec);
    expectClose(ux * tw, d, 'reaches the wall');
    for (const t of (inst.parts[3].answer as ListSpec).items.map((i) => valOf(i))) expectClose(uy * t - 4.9 * t * t, y0, 'height');
  },
});

const templates: Template[] = [horizontal, angled, wall];
export default templates;
