/** Mechanics Year 1, Chapter 8 — quantities and units, derived quantities, working with vectors. */
import { Q, surdSimplify } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, ExactSpec, NumericSpec, VectorSpec } from '../../../engine/marking/types';
import { A1, ACC_G, B1, M1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';
import { G } from '../shared/mech';

const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
const sq = (x: number) => (x < 0 ? `(${x})^{2}` : `${x}^{2}`);
const dec = (x: number) => ans.exact(num(Q.from(Number(fmtNum(x, 8)))), undefined, { allowDecimal: true });

// ---------------------------------------------------------------- 8.3 converting units
const conversions = defineTemplate({
  id: 'sm1.8.unit-conversions',
  family: 'sm1.8.units',
  title: 'Convert speeds, densities, areas and times into SI units',
  spec: ['M6.1'],
  chapter: 'SM1.8',
  sections: ['8.3'],
  level: 'AS',
  paper: [3],
  difficulty: 1,
  marks: 4,
  time: 4,
  commands: ['Find', 'Write down'],
  tags: ['units', 'SI units', 'conversion'],
  generate(r) {
    const kmh = r.pick([18, 36, 45, 54, 72, 90, 108, 126, 144]);
    const gcc = r.pick([0.8, 1.2, 2.7, 7.8, 11.3, 0.92, 1.05]);
    const cm2 = r.pick([250, 500, 1200, 3600, 75, 40]);
    const mins = r.pick([2.5, 4, 7.5, 12, 15, 20, 45]);
    const A = dec(kmh / 3.6),
      B = dec(gcc * 1000),
      C = dec(cm2 / 10000),
      D = dec(mins * 60);
    return {
      stem: 'Convert each quantity into SI units.',
      parts: [
        part({ label: 'a', marks: 1, prompt: md`A speed of $${kmh}$ km h$^{-1}$, in m s$^{-1}$.`, answer: A, scheme: [B1(md`$${fmtNum(kmh / 3.6)}$ m s$^{-1}$`)], hints: ['1 km = 1000 m and 1 h = 3600 s.', md`Multiply by $\dfrac{1000}{3600}$.`, 'Equivalently, divide by 3.6.'], errors: [err('times-3.6', dec(kmh * 3.6), 'To go from km/h to m/s, divide by 3.6.')], solution: [md`$${kmh} \times \dfrac{1000}{3600} = ${answerTex(A)}$ m s$^{-1}$`] }),
        part({ label: 'b', marks: 1, prompt: md`A density of $${gcc}$ g cm$^{-3}$, in kg m$^{-3}$.`, answer: B, scheme: [B1(md`$${fmtNum(gcc * 1000)}$ kg m$^{-3}$`)], hints: ['1 g = 0.001 kg.', md`$1\text{ cm}^{3} = 10^{-6}\text{ m}^{3}$`, md`So multiply by $\dfrac{0.001}{10^{-6}} = 1000$.`], solution: [md`$${gcc} \times 1000 = ${answerTex(B)}$ kg m$^{-3}$`] }),
        part({ label: 'c', marks: 1, prompt: md`An area of $${cm2}$ cm$^{2}$, in m$^{2}$.`, answer: C, scheme: [B1(md`$${fmtNum(cm2 / 10000)}$ m$^{2}$`)], hints: ['1 m = 100 cm.', md`So $1\text{ m}^{2} = 100^{2} = 10\,000\text{ cm}^{2}$.`, md`Divide by $10\,000$.`], errors: [err('divide-100', dec(cm2 / 100), 'Area units are squared: 1 m² = 10 000 cm².')], solution: [md`$${cm2} \div 10\,000 = ${answerTex(C)}$ m$^{2}$`] }),
        part({ label: 'd', marks: 1, prompt: md`A time of $${mins}$ minutes, in seconds.`, answer: D, scheme: [B1(md`$${fmtNum(mins * 60)}$ s`)], hints: ['1 minute = 60 s.', 'Multiply by 60.', 'The SI unit of time is the second.'], solution: [md`$${mins} \times 60 = ${answerTex(D)}$ s`] }),
      ],
      params: { kmh, gcc, cm2, mins },
    };
  },
  verify(inst) {
    const { kmh, gcc, cm2, mins } = inst.params as Record<string, number>;
    expectClose(valOf(inst.parts[0].answer as ExactSpec), (kmh * 1000) / 3600, 'speed');
    expectClose(valOf(inst.parts[1].answer as ExactSpec), (gcc / 1000) / 1e-6, 'density');
    expectClose(valOf(inst.parts[2].answer as ExactSpec), cm2 * 1e-4, 'area');
    expectClose(valOf(inst.parts[3].answer as ExactSpec), mins * 60, 'time');
  },
});

// ---------------------------------------------------------------- 8.3 derived quantities
const derived = defineTemplate({
  id: 'sm1.8.derived-quantities',
  family: 'sm1.8.units',
  title: 'Derived quantities in SI units: weight, average speed, acceleration',
  spec: ['M6.1', 'M8.3'],
  chapter: 'SM1.8',
  sections: ['8.3'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 6,
  time: 6,
  commands: ['Find', 'State'],
  tags: ['units', 'derived quantities', 'weight', 'speed', 'acceleration'],
  generate(r) {
    const m = r.pick([0.5, 1.2, 2.5, 4, 6, 15, 70, 250]);
    const km = r.pick([1.2, 2.4, 3, 4.5, 6, 9]),
      min = r.pick([4, 5, 6, 8, 10, 12, 15]);
    const u = r.pick([18, 36, 54]),
      v = u + r.pick([18, 36, 54]),
      t = r.pick([4, 5, 8, 10, 12, 20]);
    const W = ans.num(m * G, ACC_G, { unit: '\\text{N}' }),
      S = ans.num((km * 1000) / (min * 60), { sf: 3 }, { unit: '\\text{m s}^{-1}' }),
      A = ans.num(((v - u) / 3.6) / t, { sf: 3 }, { unit: '\\text{m s}^{-2}' });
    const opts = ['kg m s⁻²', 'kg m s⁻¹', 'kg m² s⁻²', 'm s⁻²'];
    const Ch: ChoiceSpec = ans.choice(opts, 0);
    return {
      stem: md`Take $g = 9.8$ m s$^{-2}$.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find the weight of a particle of mass $${m}$ kg.`, answer: W, scheme: [B1(md`$${m} \times 9.8 = ${fmtNum(m * G)}$ N`)], hints: ['Weight = mass × g.', md`$W = mg$`, 'Weight is a force, measured in newtons.'], errors: [err('mass-not-weight', ans.num(m, ACC_G), 'That is the mass in kg; weight is mg in newtons.')], solution: [md`$W = ${m} \times 9.8 = ${answerTex(W)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`A cyclist travels $${km}$ km in $${min}$ minutes. Find the average speed in m s$^{-1}$.`, answer: S, scheme: [M1('Converts both distance and time to SI units'), A1(md`$${fmtSF((km * 1000) / (min * 60), 3)}$ m s$^{-1}$`)], hints: [md`$${km}$ km $= ${fmtNum(km * 1000)}$ m and $${min}$ min $= ${min * 60}$ s.`, 'Average speed = distance ÷ time.', 'Divide.'], solution: [md`$\dfrac{${fmtNum(km * 1000)}}{${min * 60}} = ${answerTex(S)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`A car speeds up uniformly from $${u}$ km h$^{-1}$ to $${v}$ km h$^{-1}$ in $${t}$ s. Find its acceleration.`, answer: A, scheme: [M1('Converts the speeds to m s⁻¹'), A1(md`$${fmtSF(((v - u) / 3.6) / t, 3)}$ m s$^{-2}$`)], hints: [md`$${u}$ km h$^{-1}$ $= ${fmtNum(u / 3.6)}$ m s$^{-1}$, $${v}$ km h$^{-1}$ $= ${fmtNum(v / 3.6)}$ m s$^{-1}$.`, md`$a = \dfrac{v - u}{t}$`, 'Use SI units throughout.'], errors: [err('no-conversion', ans.num((v - u) / t, { sf: 3 }), 'Convert km/h into m/s before dividing by the time in seconds.')], solution: [md`$a = \dfrac{${fmtNum(v / 3.6)} - ${fmtNum(u / 3.6)}}{${t}} = ${answerTex(A)}$`] }),
        part({ label: 'd', marks: 1, prompt: md`The newton is a derived unit. State the newton in terms of the SI base units kg, m and s.`, answer: Ch, scheme: [B1('kg m s⁻²')], hints: ['Use F = ma.', 'Mass is in kg, acceleration in m s⁻².', 'Multiply the units.'], solution: ['1 N = 1 kg m s⁻², from F = ma.'] }),
      ],
      params: { m, km, min, u, v, t },
    };
  },
  verify(inst) {
    const { m, km, min, u, v, t } = inst.params as Record<string, number>;
    expectClose(valOf(inst.parts[0].answer as NumericSpec), m * 9.8, 'weight');
    expectClose(valOf(inst.parts[1].answer as NumericSpec), (km * 1000) / (min * 60), 'speed');
    expectClose(valOf(inst.parts[2].answer as NumericSpec), (((v - u) * 1000) / 3600) / t, 'acceleration');
  },
});

const mixedUnitsForce = defineTemplate({
  id: 'sm1.8.force-with-mixed-units',
  family: 'sm1.8.units',
  title: 'Resultant force from data in non-SI units',
  spec: ['M6.1', 'M8.2'],
  chapter: 'SM1.8',
  sections: ['8.1', '8.3'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 5,
  time: 6,
  commands: ['Find'],
  tags: ['units', 'conversion', "Newton's second law"],
  generate(r) {
    const grams = r.pick([200, 250, 400, 500, 750, 1500, 2500]);
    const u = r.pick([0, 18, 36]),
      v = u + r.pick([18, 27, 36, 45, 54]);
    const t = r.pick([2, 2.5, 4, 5, 8, 10]);
    const a = ((v - u) / 3.6) / t;
    const F = (grams / 1000) * a;
    const M = ans.exact(num(Q.from(grams / 1000)), undefined, { allowDecimal: true });
    const Av = ans.num(a, { sf: 3 }, { unit: '\\text{m s}^{-2}' }),
      Fv = ans.num(F, { sf: 3 }, { unit: '\\text{N}' });
    const what = r.pick(['A toy car', 'A model rocket on a horizontal track', 'A hockey puck', 'A remote-controlled drone moving horizontally']);
    return {
      stem: md`${what} of mass $${grams}$ g speeds up uniformly from $${u}$ km h$^{-1}$ to $${v}$ km h$^{-1}$ in $${t}$ seconds.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Write down the mass in kilograms.`, answer: M, scheme: [B1(md`$${fmtNum(grams / 1000)}$ kg`)], hints: ['1 kg = 1000 g.', 'Divide by 1000.', 'SI unit of mass is the kilogram.'], solution: [md`$${grams} \div 1000 = ${answerTex(M)}$ kg`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the acceleration.`, answer: Av, scheme: [M1('Converts speeds to m s⁻¹ and uses a = (v − u)/t'), A1(md`$${fmtSF(a, 3)}$ m s$^{-2}$`)], hints: ['Convert km/h to m/s by dividing by 3.6.', md`$a = \dfrac{v - u}{t}$`, 'Keep full accuracy.'], solution: [md`$a = \dfrac{${fmtNum(v / 3.6)} - ${fmtNum(u / 3.6)}}{${t}} = ${answerTex(Av)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the magnitude of the resultant force.`, answer: Fv, scheme: [M1(md`$F = ma$ with $m$ in kg`), A1(md`$${fmtSF(F, 3)}$ N`)], hints: ["Newton's second law: F = ma.", 'Use the mass in kg.', 'Use your acceleration from (b).'], errors: [err('grams', ans.num(grams * a, { sf: 3 }), 'Use the mass in kilograms, not grams.')], solution: [md`$F = ${fmtNum(grams / 1000)} \times ${fmtSF(a, 4)} = ${answerTex(Fv)}$`] }),
      ],
      params: { grams, u, v, t },
    };
  },
  verify(inst) {
    const { grams, u, v, t } = inst.params as Record<string, number>;
    const a = (((v - u) * 1000) / 3600) / t;
    expectClose(valOf(inst.parts[2].answer as NumericSpec), (grams / 1000) * a, 'force');
  },
});

// ---------------------------------------------------------------- 8.4 working with vectors: velocity
const velocityVector = defineTemplate({
  id: 'sm1.8.velocity-vector-speed-bearing',
  family: 'sm1.8.vectors',
  title: 'Velocity vectors: speed, bearing and displacement',
  spec: ['M7.1', 'P10.2'],
  chapter: 'SM1.8',
  sections: ['8.4'],
  level: 'AS',
  paper: [3],
  difficulty: 2,
  marks: 7,
  time: 8,
  commands: ['Find'],
  tags: ['vectors', 'velocity', 'speed', 'bearings', 'displacement'],
  generate(r) {
    const a = r.intNZ(-8, 8),
      b = r.intNZ(-8, 8);
    const t = r.int(2, 10);
    const p0 = [r.int(-10, 10), r.int(-10, 10)];
    const sp2 = a * a + b * b;
    const [k, s] = surdSimplify(sp2);
    const Sp = ans.exact(ex(s === 1 ? `${k}` : `${k === 1 ? '' : k}\\sqrt{${s}}`), ['exact']);
    const bearing = ((Math.atan2(a, b) * 180) / Math.PI + 360) % 360; // i = east, j = north
    const Br = ans.num(bearing, { dp: 1 }, { unit: '^{\\circ}' });
    const P = [p0[0] + a * t, p0[1] + b * t];
    const Pv: VectorSpec = ans.vec([ans.exact(num(P[0])), ans.exact(num(P[1]))]);
    const vTex = sumTex([[a, '\\mathbf{i}'], [b, '\\mathbf{j}']]);
    const what = r.pick(['A boat', 'A drone', 'A cyclist', 'A ship']);
    return {
      stem: md`In this question $\mathbf{i}$ and $\mathbf{j}$ are unit vectors due east and due north. ${what} moves with constant velocity $(${vTex})$ m s$^{-1}$. At time $t = 0$ it is at the point with position vector $(${sumTex([[p0[0], '\\mathbf{i}'], [p0[1], '\\mathbf{j}']])})$ m.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the exact speed.`, answer: Sp, scheme: [M1(md`$\sqrt{${sq(a)} + ${sq(b)}}$`), A1(md`$${answerTex(Sp)}$ m s$^{-1}$`)], hints: ['Speed is the magnitude of velocity.', md`$\sqrt{${a * a} + ${b * b}}$`, 'Simplify the surd.'], solution: [md`Speed $= \sqrt{${sp2}} = ${answerTex(Sp)}$ m s$^{-1}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Find the bearing on which it is moving, to 1 decimal place.`, answer: Br, scheme: [M1('Uses trigonometry on the components'), M1('Uses a sketch to choose the quadrant'), A1(md`$${bearing.toFixed(1)}^{\circ}$`)], hints: ['Bearings are measured clockwise from north.', 'Sketch the vector: east component ' + a + ', north component ' + b + '.', md`Reference angle: $\tan^{-1}\left|\dfrac{${a}}{${b}}\right|$, then adjust for the quadrant.`], solution: [md`The bearing is $${answerTex(Br)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find its position vector when $t = ${t}$.`, answer: Pv, scheme: [M1(md`$\mathbf{r} = \mathbf{r}_{0} + t\mathbf{v}$`), A1(md`$${sumTex([[P[0], '\\mathbf{i}'], [P[1], '\\mathbf{j}']])}$`)], hints: ['Position = start + time × velocity.', md`$\mathbf{r} = (${sumTex([[p0[0], '\\mathbf{i}'], [p0[1], '\\mathbf{j}']])}) + ${t}(${vTex})$`, 'Add the components.'], solution: [md`$\mathbf{r} = ${answerTex(Pv)}$`] }),
      ],
      params: { a, b, t, p0 },
    };
  },
  verify(inst) {
    const { a, b } = inst.params as { a: number; b: number };
    const brg = (valOf(inst.parts[1].answer as NumericSpec) * Math.PI) / 180;
    const sp = valOf(inst.parts[0].answer as ExactSpec);
    expectClose(sp * Math.sin(brg), a, 'east component');
    expectClose(sp * Math.cos(brg), b, 'north component');
    expect(sp > 0, 'speed');
  },
});

const templates: Template[] = [conversions, derived, mixedUnitsForce, velocityVector];
export default templates;
