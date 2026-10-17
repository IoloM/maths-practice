/** Mechanics Year 1, Chapter 9 — language of kinematics, s–t and v–t graphs, constant acceleration, vertical motion. */
import { Q } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { expectClose } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { plot } from '../../../engine/core/svg';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, ACC_G, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { G } from '../shared/mech';

const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
const ex2 = (x: number | Q, unit?: string) => ans.exact(num(Q.from(x)), undefined, { allowDecimal: true, ...(unit ? { unit } : {}) });
const MS = '\\text{m s}^{-1}',
  MS2 = '\\text{m s}^{-2}';

// ---------------------------------------------------------------- 9.1 language: speed/velocity, distance/displacement
const avgSpeedVelocity = defineTemplate({
  id: 'sm1.9.average-speed-and-velocity',
  family: 'sm1.9.language',
  title: 'Average speed versus average velocity for an out-and-back journey',
  spec: ['M7.1', 'M7.2'],
  chapter: 'SM1.9',
  sections: ['9.1'],
  level: 'AS',
  paper: [3],
  difficulty: 1,
  marks: 5,
  time: 5,
  commands: ['Find', 'Explain'],
  tags: ['kinematics', 'speed', 'velocity', 'displacement', 'distance'],
  generate(r) {
    const d1 = r.int(4, 30) * 10,
      t1 = r.int(2, 12) * 10,
      d2 = r.int(1, d1 / 10 - 1) * 10,
      t2 = r.int(2, 12) * 10,
      rest = r.pick([0, 0, 30, 60]);
    const T = t1 + t2 + rest;
    const what = r.pick(['A walker', 'A runner', 'A remote-controlled car', 'A swimmer in a long pool']);
    const dir = r.pick([['east', 'west'], ['north', 'south']]);
    const V1 = ex2(Q.of(d1, t1), MS),
      Sp = ex2(Q.of(d1 + d2, T), MS),
      Ve = ex2(Q.of(d1 - d2, T), MS);
    return {
      stem: md`${what} travels $${d1}$ m due ${dir[0]} in $${t1}$ s${rest ? `, rests for $${rest}$ s,` : ''} and then travels $${d2}$ m due ${dir[1]} in $${t2}$ s, moving at constant speed on each stage.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find the velocity during the first stage, taking ${dir[0]} as positive.`, answer: V1, scheme: [B1(md`$${fmtNum(d1 / t1, 4)}$ m s$^{-1}$`)], hints: ['Velocity = displacement ÷ time.', md`$${d1} \div ${t1}$`, `${dir[0]} is positive.`], solution: [md`$\dfrac{${d1}}{${t1}} = ${answerTex(V1)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the average speed for the whole journey.`, answer: Sp, scheme: [M1('Total distance ÷ total time'), A1(md`$\dfrac{${d1 + d2}}{${T}}$ m s$^{-1}$`)], hints: ['Average speed = total distance ÷ total time.', md`Total distance $= ${d1} + ${d2}$`, rest ? 'Include the time spent resting.' : 'Add the times.'], errors: [err('displacement', ex2(Q.of(d1 - d2, T)), 'Speed uses the total distance travelled, not the displacement.')], solution: [md`$\dfrac{${d1 + d2}}{${T}} = ${answerTex(Sp)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the average velocity for the whole journey.`, answer: Ve, scheme: [M1('Final displacement ÷ total time'), A1(md`$\dfrac{${d1 - d2}}{${T}}$ m s$^{-1}$ (${dir[0]})`)], hints: ['Average velocity = displacement from the start ÷ total time.', md`Displacement $= ${d1} - ${d2}$ m ${dir[0]}`, 'Divide by the total time.'], errors: [err('distance', ex2(Q.of(d1 + d2, T)), 'Velocity uses displacement, which takes direction into account.')], solution: [md`$\dfrac{${d1 - d2}}{${T}} = ${answerTex(Ve)}$ (due ${dir[0]})`] }),
      ],
      params: { d1, d2, T },
    };
  },
  verify(inst) {
    const { d1, d2, T } = inst.params as Record<string, number>;
    expectClose(valOf(inst.parts[1].answer as ExactSpec), (d1 + d2) / T, 'speed');
    expectClose(valOf(inst.parts[2].answer as ExactSpec), (d1 - d2) / T, 'velocity');
  },
});

const turning = defineTemplate({
  id: 'sm1.9.distance-versus-displacement-turning',
  family: 'sm1.9.language',
  title: 'Distance travelled versus displacement when a particle turns round',
  spec: ['M7.1', 'M7.3'],
  chapter: 'SM1.9',
  sections: ['9.1', '9.4'],
  level: 'AS',
  paper: [3],
  difficulty: 3,
  marks: 7,
  time: 8,
  commands: ['Find'],
  tags: ['kinematics', 'suvat', 'distance', 'displacement'],
  generate(r) {
    const u = r.pick([6, 8, 10, 12, 14, 15, 18, 20]),
      a = r.pick([1, 2, 2.5, 3, 4, 5]);
    const tr = u / a;
    const T = Math.ceil(tr) + r.int(1, 4);
    const s = u * T - 0.5 * a * T * T;
    const dist = (u * u) / (2 * a) + 0.5 * a * (T - tr) ** 2;
    const Tr = ex2(tr, '\\text{s}'),
      S = ex2(s, '\\text{m}'),
      D = ex2(dist, '\\text{m}');
    return {
      stem: md`A particle $P$ moves along a straight line. At time $t = 0$ it passes through a point $O$ with velocity $${u}$ m s$^{-1}$. It has constant acceleration $${fmtNum(-a)}$ m s$^{-2}$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the time at which $P$ is instantaneously at rest.`, answer: Tr, scheme: [M1(md`$0 = ${u} - ${fmtNum(a)}t$`), A1(md`$t = ${fmtNum(tr)}$`)], hints: ['At rest means v = 0.', md`Use $v = u + at$ with $a = ${fmtNum(-a)}$.`, 'Solve for t.'], solution: [md`$0 = ${u} - ${fmtNum(a)}t \Rightarrow t = ${answerTex(Tr)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the displacement of $P$ from $O$ when $t = ${T}$.`, answer: S, scheme: [M1(md`$s = ${u}(${T}) - \frac{1}{2}(${fmtNum(a)})(${T})^{2}$`), A1(md`$${fmtNum(s)}$ m`)], hints: [md`$s = ut + \frac{1}{2}at^{2}$`, 'Remember a is negative.', 'A negative answer means P is on the other side of O.'], solution: [md`$s = ${u} \times ${T} - \frac{1}{2} \times ${fmtNum(a)} \times ${T}^{2} = ${answerTex(S)}$`] }),
        part({ label: 'c', marks: 3, prompt: md`Find the total distance travelled by $P$ in the first $${T}$ seconds.`, answer: D, scheme: [M1(md`Distance to the turning point: $\dfrac{${u}^{2}}{2 \times ${fmtNum(a)}} = ${fmtNum((u * u) / (2 * a))}$`), dM1('Adds the distance travelled back after turning'), A1(md`$${fmtNum(dist)}$ m`)], hints: ['P turns round, so distance is not the same as displacement.', md`Distance out to the turning point: $\dfrac{u^{2}}{2a}$.`, md`Then add the distance back in the remaining $${fmtNum(T - tr)}$ s.`], errors: [err('used-displacement', ex2(Math.abs(s)), 'P turns round: add the distance out and the distance back.')], solution: [md`Out: $${fmtNum((u * u) / (2 * a))}$ m. Back: $\frac{1}{2}(${fmtNum(a)})(${fmtNum(T - tr)})^{2} = ${fmtNum(0.5 * a * (T - tr) ** 2)}$ m.`, md`Total $= ${answerTex(D)}$`] }),
      ],
      params: { u, a, T },
    };
  },
  verify(inst) {
    const { u, a, T } = inst.params as Record<string, number>;
    let d = 0,
      x = 0;
    const n = 100000,
      h = T / n;
    for (let i = 0; i < n; i++) {
      const v = u - a * (i + 0.5) * h;
      d += Math.abs(v) * h;
      x += v * h;
    }
    expectClose(valOf(inst.parts[1].answer as ExactSpec), x, 'displacement', 1e-6);
    expectClose(valOf(inst.parts[2].answer as ExactSpec), d, 'distance', 1e-6);
  },
});

// ---------------------------------------------------------------- 9.2 velocity–time graphs
const vtTrapezium = defineTemplate({
  id: 'sm1.9.velocity-time-graph-trapezium',
  family: 'sm1.9.graphs',
  title: 'Velocity–time graph: accelerate, steady speed, decelerate',
  spec: ['M7.2', 'M7.3'],
  chapter: 'SM1.9',
  sections: ['9.2'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 7,
  time: 8,
  commands: ['Find'],
  tags: ['kinematics', 'velocity–time graphs', 'area', 'gradient', 'diagram'],
  generate(r) {
    const V = r.pick([8, 10, 12, 15, 16, 20, 24, 25, 30]),
      t1 = r.pick([4, 5, 6, 8, 10]),
      t3 = r.pick([5, 6, 8, 10, 12]),
      t2 = r.int(2, 20) * 5;
    const D = (V * t1) / 2 + V * t2 + (V * t3) / 2;
    const T = t1 + t2 + t3;
    const what = r.pick(['A train travels between two stations', 'A car travels along a straight road between two sets of traffic lights', 'A lift moves upwards between two floors', 'A cyclist rides along a straight path']);
    const A1v = ex2(Q.of(V, t1), MS2),
      Ds = ex2(D, '\\text{m}'),
      Dec = ex2(Q.of(V, t3), MS2);
    const f = (t: number) => (t <= t1 ? (V * t) / t1 : t <= t1 + t2 ? V : t <= T ? V * (1 - (t - t1 - t2) / t3) : 0);
    const svg = plot({ x: [0, T * 1.08], y: [0, V * 1.25], curves: [{ f, from: 0, to: T, cls: 'dg-line' }], vlines: [{ x: t1, dash: true, to: V }, { x: t1 + t2, dash: true, to: V }], xTicks: [{ v: t1, label: `${t1}` }, { v: t1 + t2, label: `${t1 + t2}` }, { v: T, label: `${T}` }], yTicks: [{ v: V, label: `${V}` }], axes: { x: 't (s)', y: 'v (m/s)' } });
    return {
      stem: md`${what}. It starts from rest and accelerates uniformly for $${t1}$ s to a speed of $${V}$ m s$^{-1}$. It travels at this speed for $${t2}$ s, then decelerates uniformly to rest in $${t3}$ s. The velocity–time graph is shown.`,
      diagram: { svg, alt: `Velocity–time graph: a trapezium rising to ${V} m/s at t = ${t1}, level until t = ${t1 + t2}, falling to zero at t = ${T}.` },
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the acceleration in the first $${t1}$ s.`, answer: A1v, scheme: [M1('Gradient of the first line'), A1(md`$${fmtNum(V / t1)}$ m s$^{-2}$`)], hints: ['Acceleration is the gradient of the v–t graph.', md`Gradient $= \dfrac{${V}}{${t1}}$`, 'Simplify.'], solution: [md`$a = \dfrac{${V}}{${t1}} = ${answerTex(A1v)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Find the total distance travelled.`, answer: Ds, scheme: [M1('Area under the graph'), A1('Correct trapezium or sum of areas'), A1(md`$${fmtNum(D)}$ m`)], hints: ['Distance is the area under the v–t graph.', 'Split into a triangle, rectangle and triangle — or use the trapezium formula.', md`$\frac{1}{2}(${t2} + ${T}) \times ${V}$`], errors: [err('rectangle', ex2(V * T), 'The graph is not a rectangle — the speeding up and slowing down parts are triangles.', 1)], solution: [md`Area $= \frac{1}{2}(${t2} + ${T}) \times ${V} = ${answerTex(Ds)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the magnitude of the deceleration.`, answer: Dec, scheme: [M1('Gradient of the last line'), A1(md`$${fmtNum(V / t3)}$ m s$^{-2}$`)], hints: ['Use the gradient of the final section.', md`$\dfrac{${V}}{${t3}}$`, 'Give the size of the deceleration.'], solution: [md`$\dfrac{${V}}{${t3}} = ${answerTex(Dec)}$`] }),
      ],
      params: { V, t1, t2, t3 },
    };
  },
  verify(inst) {
    const { V, t1, t2, t3 } = inst.params as Record<string, number>;
    const T = t1 + t2 + t3;
    const f = (t: number) => (t <= t1 ? (V * t) / t1 : t <= t1 + t2 ? V : V * (1 - (t - t1 - t2) / t3));
    let area = 0;
    const n = 60000;
    for (let i = 0; i < n; i++) area += f(((i + 0.5) * T) / n) * (T / n);
    expectClose(valOf(inst.parts[1].answer as ExactSpec), area, 'area', 1e-6);
  },
});

const vtFindUnknown = defineTemplate({
  id: 'sm1.9.velocity-time-unknown-time',
  family: 'sm1.9.graphs',
  title: 'Velocity–time graph: find an unknown time from the total distance',
  spec: ['M7.2'],
  chapter: 'SM1.9',
  sections: ['9.2'],
  level: 'AS',
  paper: [3],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find', 'Show that'],
  tags: ['kinematics', 'velocity–time graphs', 'area', 'equations'],
  generate(r) {
    const V = r.pick([10, 12, 14, 15, 16, 18, 20, 24]),
      t1 = r.pick([4, 5, 6, 8, 10]),
      T = r.pick([60, 80, 90, 100, 120, 150]);
    const k = r.int(2, Math.floor((T - t1) / 8)); // deceleration time
    const t2 = T - t1 - k;
    r.require(t2 > 5);
    const D = (V * (t2 + T)) / 2;
    const K = ex2(k, '\\text{s}'),
      Dc = ex2(Q.of(V, k), MS2);
    const what = r.pick(['A car', 'A tram', 'A runner', 'A motorbike']);
    return {
      stem: md`${what} starts from rest and accelerates uniformly for $${t1}$ s until its speed is $${V}$ m s$^{-1}$. It maintains this speed and then decelerates uniformly to rest. The whole journey takes $${T}$ s and covers $${fmtNum(D)}$ m. The deceleration lasts $T$ seconds.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find the value of $T$.`, answer: K, scheme: [M1(md`Trapezium area $\frac{1}{2}\left(\text{top} + ${T}\right) \times ${V}$ with top $= ${T} - ${t1} - T$`), dM1(md`Sets equal to $${fmtNum(D)}$ and solves`), A1(md`$T = ${k}$`)], hints: ['Sketch the v–t graph: it is a trapezium.', md`The top side has length $${T} - ${t1} - T$.`, md`Area $= \frac{1}{2}(\text{top} + ${T}) \times ${V} = ${fmtNum(D)}$`], solution: [md`$\frac{1}{2}\left(${T - t1} - T + ${T}\right) \times ${V} = ${fmtNum(D)}$`, md`$${2 * T - t1} - T = ${fmtNum((2 * D) / V)} \Rightarrow T = ${answerTex(K)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the deceleration.`, answer: Dc, scheme: [M1(md`$\dfrac{${V}}{T}$`), A1(md`$${Q.of(V, k).toLatex()}$ m s$^{-2}$`)], hints: ['Deceleration is the size of the gradient of the last section.', md`$\dfrac{${V}}{T}$`, 'Use your T.'], solution: [md`$\dfrac{${V}}{${k}} = ${answerTex(Dc)}$`] }),
      ],
      params: { V, t1, T, D },
    };
  },
  verify(inst) {
    const { V, t1, T, D } = inst.params as Record<string, number>;
    const k = valOf(inst.parts[0].answer as ExactSpec);
    const t2 = T - t1 - k;
    expectClose((V * t1) / 2 + V * t2 + (V * k) / 2, D, 'distance');
  },
});

const stGraph = defineTemplate({
  id: 'sm1.9.displacement-time-graph',
  family: 'sm1.9.graphs',
  title: 'Displacement–time graph: velocities, distance and average speed',
  spec: ['M7.2', 'M7.1'],
  chapter: 'SM1.9',
  sections: ['9.1'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 5,
  time: 6,
  commands: ['Find', 'Describe'],
  tags: ['kinematics', 'displacement–time graphs', 'gradient', 'diagram'],
  generate(r) {
    const s1 = r.int(3, 12) * 100,
      t1 = r.int(3, 10) * 60,
      tr = r.int(1, 5) * 60,
      t3 = r.int(4, 12) * 60,
      back = r.int(1, s1 / 100) * 100;
    const T = t1 + tr + t3;
    const end = s1 - back;
    const pts: [number, number][] = [
      [0, 0],
      [t1, s1],
      [t1 + tr, s1],
      [T, end],
    ];
    const f = (t: number) => {
      for (let i = 0; i < 3; i++) if (t <= pts[i + 1][0]) return pts[i][1] + ((pts[i + 1][1] - pts[i][1]) * (t - pts[i][0])) / (pts[i + 1][0] - pts[i][0]);
      return end;
    };
    const svg = plot({ x: [0, T * 1.08], y: [0, s1 * 1.2], curves: [{ f, from: 0, to: T, cls: 'dg-line' }], xTicks: [{ v: t1, label: `${t1}` }, { v: t1 + tr, label: `${t1 + tr}` }, { v: T, label: `${T}` }], yTicks: [{ v: s1, label: `${s1}` }, ...(end > 0 ? [{ v: end, label: `${end}` }] : [])], axes: { x: 't (s)', y: 's (m)' } });
    const V3 = ex2(Q.of(-back, t3), MS),
      Ds = ex2(s1 + back, '\\text{m}'),
      Av = ex2(Q.of(s1 + back, T), MS);
    return {
      stem: md`The displacement–time graph shows a walker's displacement $s$ metres from home, $t$ seconds after leaving.`,
      diagram: { svg, alt: `Displacement–time graph rising to ${s1} m at t = ${t1}, level until t = ${t1 + tr}, then falling to ${end} m at t = ${T}.` },
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the velocity of the walker during the final stage.`, answer: V3, scheme: [M1('Gradient of the final section'), A1(md`$${Q.of(-back, t3).toLatex()}$ m s$^{-1}$`)], hints: ['Velocity is the gradient of the s–t graph.', md`Change in $s$: $${end} - ${s1}$; change in $t$: $${t3}$.`, 'A negative velocity means moving back towards home.'], errors: [err('speed-not-velocity', ex2(Q.of(back, t3)), 'Velocity has a direction: the walker is moving back towards home, so it is negative.', 1)], solution: [md`$\dfrac{${end} - ${s1}}{${t3}} = ${answerTex(V3)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Find the total distance walked.`, answer: Ds, scheme: [B1(md`$${s1} + ${back} = ${s1 + back}$ m`)], hints: ['Distance does not depend on direction.', 'Add the distance out and the distance back.', 'The rest period adds no distance.'], solution: [md`$${s1} + ${back} = ${answerTex(Ds)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the average speed for the whole ${T} seconds.`, answer: Av, scheme: [M1('Total distance ÷ total time'), A1(md`$${Q.of(s1 + back, T).toLatex()}$ m s$^{-1}$`)], hints: ['Average speed = total distance ÷ total time.', 'Include the time spent resting.', md`$\dfrac{${s1 + back}}{${T}}$`], solution: [md`$\dfrac{${s1 + back}}{${T}} = ${answerTex(Av)}$`] }),
      ],
      params: { s1, back, T, t3 },
    };
  },
  verify(inst) {
    const { s1, back, T, t3 } = inst.params as Record<string, number>;
    expectClose(valOf(inst.parts[0].answer as ExactSpec) * t3, -back, 'gradient');
    expectClose(valOf(inst.parts[2].answer as ExactSpec) * T, s1 + back, 'average speed');
  },
});

// ---------------------------------------------------------------- 9.3–9.4 suvat
const suvat = defineTemplate({
  id: 'sm1.9.suvat-two-stages',
  family: 'sm1.9.suvat',
  title: 'Constant acceleration formulae: a journey in two stages',
  spec: ['M7.3'],
  chapter: 'SM1.9',
  sections: ['9.3', '9.4'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 7,
  time: 8,
  commands: ['Find'],
  tags: ['kinematics', 'suvat', 'constant acceleration'],
  generate(r) {
    const u = r.pick([2, 3, 4, 5, 6, 8, 10]),
      a = r.pick([0.5, 1, 1.5, 2, 2.5, 3]),
      t = r.pick([2, 4, 5, 6, 8, 10]);
    const v = u + a * t,
      s = u * t + 0.5 * a * t * t;
    const d = r.pick([10, 15, 20, 25, 40, 50, 60]);
    const dec = (v * v) / (2 * d);
    const what = r.pick(['A car', 'A cyclist', 'A skier', 'A train']);
    const V = ex2(v, MS),
      S = ex2(s, '\\text{m}'),
      Dc = ans.num(dec, { sf: 3 }, { unit: MS2 }),
      Tt = ans.num(v / dec, { sf: 3 }, { unit: '\\text{s}' });
    return {
      stem: md`${what} passes a point $A$ with speed $${u}$ m s$^{-1}$ and accelerates uniformly at $${fmtNum(a)}$ m s$^{-2}$ for $${t}$ s until it passes point $B$. It then decelerates uniformly and comes to rest $${d}$ m beyond $B$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the speed at $B$.`, answer: V, scheme: [M1(md`$v = u + at$`), A1(md`$${fmtNum(v)}$ m s$^{-1}$`)], hints: ['List s, u, v, a, t for the first stage.', md`$v = ${u} + ${fmtNum(a)} \times ${t}$`, 'Evaluate.'], solution: [md`$v = ${u} + ${fmtNum(a)} \times ${t} = ${answerTex(V)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the distance $AB$.`, answer: S, scheme: [M1(md`$s = ut + \frac{1}{2}at^{2}$`), A1(md`$${fmtNum(s)}$ m`)], hints: [md`Use $s = ut + \frac{1}{2}at^{2}$ or $s = \frac{1}{2}(u + v)t$.`, 'Substitute the first-stage values.', 'Evaluate.'], solution: [md`$s = ${u} \times ${t} + \frac{1}{2} \times ${fmtNum(a)} \times ${t}^{2} = ${answerTex(S)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the deceleration after $B$.`, answer: Dc, scheme: [M1(md`$0^{2} = ${fmtNum(v)}^{2} - 2a(${d})$`), A1(md`$${fmtSF(dec, 3)}$ m s$^{-2}$`)], hints: ['For the second stage: u = your speed at B, v = 0, s = ' + d + '.', md`$v^{2} = u^{2} + 2as$`, 'The acceleration is negative; give the size of the deceleration.'], solution: [md`$0 = ${fmtNum(v)}^{2} - 2a \times ${d} \Rightarrow a = ${answerTex(Dc)}$`] }),
        part({ label: 'd', marks: 1, prompt: md`Find the time taken to come to rest after passing $B$.`, answer: Tt, scheme: [B1(md`$${fmtSF(v / dec, 3)}$ s`)], hints: [md`$v = u + at$ with $v = 0$.`, md`Or $s = \frac{1}{2}(u + v)t$.`, 'Solve for t.'], solution: [md`$t = \dfrac{2 \times ${d}}{${fmtNum(v)}} = ${answerTex(Tt)}$`] }),
      ],
      params: { u, a, t, d },
    };
  },
  verify(inst) {
    const { u, a, t, d } = inst.params as Record<string, number>;
    const v = valOf(inst.parts[0].answer as ExactSpec);
    expectClose(v, u + a * t, 'v');
    const dec = valOf(inst.parts[2].answer as NumericSpec);
    expectClose(v * valOf(inst.parts[3].answer as NumericSpec) / 2, d, 'stopping distance');
    expectClose(v * v, 2 * dec * d, 'deceleration');
  },
});

const vertical = defineTemplate({
  id: 'sm1.9.vertical-motion-under-gravity',
  family: 'sm1.9.suvat',
  title: 'Vertical motion under gravity: thrown upwards from a height',
  spec: ['M7.3', 'M8.3'],
  chapter: 'SM1.9',
  sections: ['9.5'],
  level: 'AS',
  paper: [3],
  difficulty: 3,
  marks: 8,
  time: 10,
  commands: ['Find', 'State'],
  tags: ['kinematics', 'vertical motion', 'gravity', 'suvat', 'modelling'],
  generate(r) {
    const u = r.pick([4.9, 7, 9.8, 12, 14, 14.7, 19.6]),
      h = r.pick([0, 2, 5, 10, 15, 20, 24.5, 30]);
    const Hmax = h + (u * u) / (2 * G);
    const tUp = u / G;
    const tHit = (u + Math.sqrt(u * u + 2 * G * h)) / G;
    const vHit = Math.sqrt(u * u + 2 * G * h);
    const what = r.pick(['A ball is thrown vertically upwards', 'A stone is projected vertically upwards', 'A small parcel is thrown vertically upwards']);
    const Hm = ans.num(Hmax, ACC_G, { unit: '\\text{m}' }),
      Tu = ans.num(tUp, ACC_G, { unit: '\\text{s}' }),
      Th = ans.num(tHit, ACC_G, { unit: '\\text{s}' }),
      Vh = ans.num(vHit, ACC_G, { unit: MS });
    const opts = ['The object is modelled as a particle with no air resistance', 'The object is modelled as a rigid rod', 'The ground is modelled as smooth'];
    const C = ans.choice(opts, 0);
    return {
      stem: md`${what} with speed $${fmtNum(u)}$ m s$^{-1}$ from a point ${h ? md`$${fmtNum(h)}$ m above the ground` : 'on the ground'}. Take $g = 9.8$ m s$^{-2}$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the greatest height above the ground reached.`, answer: Hm, scheme: [M1(md`$0 = ${fmtNum(u)}^{2} - 2(9.8)s$`), A1(md`$${fmtSF(Hmax, 3)}$ m`)], hints: ['At the highest point, v = 0.', md`$v^{2} = u^{2} + 2as$ with $a = -9.8$.`, h ? md`Add the starting height $${fmtNum(h)}$ m.` : 'That is the height above the ground.'], errors: h ? [err('forgot-h', ans.num((u * u) / (2 * G), ACC_G), md`That is the height above the point of projection — add $${fmtNum(h)}$ m.`, 1)] : [], solution: [md`$s = \dfrac{${fmtNum(u)}^{2}}{2 \times 9.8} = ${fmtSF((u * u) / (2 * G), 4)}$ m above the point of projection`, md`Greatest height $= ${answerTex(Hm)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Find the time taken to reach the highest point.`, answer: Tu, scheme: [B1(md`$\dfrac{${fmtNum(u)}}{9.8} = ${fmtSF(tUp, 3)}$ s`)], hints: [md`$v = u + at$ with $v = 0$.`, md`$0 = ${fmtNum(u)} - 9.8t$`, 'Solve.'], solution: [md`$t = ${answerTex(Tu)}$`] }),
        part({ label: 'c', marks: 3, prompt: md`Find the time taken for it to hit the ground.`, answer: Th, scheme: [M1(md`$${h ? `-${fmtNum(h)}` : '0'} = ${fmtNum(u)}t - 4.9t^{2}$`), dM1('Solves the quadratic'), A1(md`$${fmtSF(tHit, 3)}$ s`)], hints: ['Take upwards as positive: the ground is ' + (h ? `${fmtNum(h)} m below the start, so s = −${fmtNum(h)}` : 'where s = 0 again') + '.', md`$s = ut + \frac{1}{2}at^{2}$ with $a = -9.8$.`, 'Choose the positive root.'], solution: [md`$${h ? `-${fmtNum(h)}` : '0'} = ${fmtNum(u)}t - 4.9t^{2} \Rightarrow t = ${answerTex(Th)}$`] }),
        part({ label: 'd', marks: 1, prompt: md`Find the speed with which it hits the ground.`, answer: Vh, scheme: [B1(md`$${fmtSF(vHit, 3)}$ m s$^{-1}$`)], hints: [md`$v^{2} = u^{2} + 2as$ with $s = ${h ? `-${fmtNum(h)}` : '0'}$.`, 'Or use v = u + at with your time.', 'Give the speed (positive).'], solution: [md`$v^{2} = ${fmtNum(u)}^{2} + 2(9.8)(${fmtNum(h)}) \Rightarrow v = ${answerTex(Vh)}$`] }),
        part({ label: 'e', marks: 1, prompt: md`State one modelling assumption you have made.`, answer: C, scheme: [B1('Particle / no air resistance / constant g')], hints: ['What have you ignored?', 'What shape is the object assumed to be?', 'Is g the same everywhere on the path?'], solution: [opts[0]] }),
      ],
      params: { u, h },
    };
  },
  verify(inst) {
    const { u, h } = inst.params as Record<string, number>;
    // step the motion numerically
    let y = h,
      v = u,
      t = 0,
      top = h;
    const dt = 1e-5;
    while (y >= 0) {
      v -= G * dt;
      y += v * dt + 0.5 * G * dt * dt;
      t += dt;
      top = Math.max(top, y);
    }
    expectClose(valOf(inst.parts[0].answer as NumericSpec), top, 'greatest height', 1e-3);
    expectClose(valOf(inst.parts[2].answer as NumericSpec), t, 'time to ground', 1e-3);
  },
});


const templates: Template[] = [avgSpeedVelocity, turning, vtTrapezium, vtFindUnknown, stGraph, suvat, vertical];
export default templates;
