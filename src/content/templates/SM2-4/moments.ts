/** Mechanics Year 2, Chapter 4 — moments: rods on supports, tilting, and ladders (with SM2.7 static rigid bodies). */
import { Q } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { esc } from '../../../engine/core/svg';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, ExactSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, ACC_G, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { G } from '../shared/mech';

const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
const NG = (v: number) => ans.num(v, ACC_G, { unit: '\\text{N}' });

/** Horizontal rod AB with supports at the given positions (0..L) and optional labelled point loads. */
function rodSvg(L: number, supports: { x: number; label: string }[], loads: { x: number; label: string }[], marks: { x: number; label: string }[]): string {
  const X = (x: number) => 30 + (x / L) * 300;
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" class="dg" role="img">`];
  out.push(`<rect class="dg-curve" x="30" y="70" width="300" height="10" rx="2" fill="none"/>`);
  out.push(`<text class="dg-label" x="22" y="68" text-anchor="end">A</text><text class="dg-label" x="338" y="68">B</text>`);
  for (const s of supports) out.push(`<polygon class="dg-curve" fill="none" points="${X(s.x)},80 ${X(s.x) - 10},100 ${X(s.x) + 10},100"/><text class="dg-label" x="${X(s.x)}" y="116" text-anchor="middle">${esc(s.label)}</text>`);
  for (const l of loads) out.push(`<line class="dg-line" x1="${X(l.x)}" y1="80" x2="${X(l.x)}" y2="140" marker-end="url(#ah)"/><text class="dg-label" x="${X(l.x) + 4}" y="156">${esc(l.label)}</text>`);
  for (const m of marks) out.push(`<text class="dg-label dg-small" x="${X(m.x)}" y="58" text-anchor="middle">${esc(m.label)}</text>`);
  out.push(`<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="dg-arrow"/></marker></defs>`);
  out.push('</svg>');
  return out.join('');
}

// ---------------------------------------------------------------- 4.1–4.3 uniform rod on two supports
const twoSupports = defineTemplate({
  id: 'sm2.4.uniform-rod-on-two-supports',
  family: 'sm2.4.moments',
  title: 'A uniform rod resting on two supports with a particle attached: find the reactions',
  spec: ['M9.1', 'M8.4'],
  chapter: 'SM2.4',
  sections: ['4.1', '4.2', '4.3'],
  level: 'A2',
  paper: [3],
  difficulty: 3,
  marks: 6,
  time: 8,
  commands: ['Find', 'State'],
  tags: ['moments', 'equilibrium', 'rigid bodies', 'reactions', 'diagram'],
  generate(r) {
    const L = r.pick([2, 3, 4, 5, 6, 8]);
    const c = Number(fmtNum((L * r.pick([0.1, 0.15, 0.2, 0.25])), 2)),
      dpos = Number(fmtNum(L * r.pick([0.6, 0.7, 0.75, 0.8, 0.9]), 2));
    const M = r.pick([4, 5, 8, 10, 12, 15, 20]),
      m = r.pick([2, 3, 5, 6, 8]);
    const e = Number(fmtNum(L * r.pick([0, 0.3, 0.4, 0.6, 0.85, 1]), 2));
    // moments about C: R_D (d − c) = M g (L/2 − c) + m g (e − c)
    const RD = (M * G * (L / 2 - c) + m * G * (e - c)) / (dpos - c);
    const RC = (M + m) * G - RD;
    r.require(RD > 1 && RC > 1);
    const what = r.pick(['A uniform plank', 'A uniform beam', 'A uniform rod']);
    const RDs = NG(RD),
      RCs = NG(RC);
    const opts = ['The rod is uniform, so its weight acts at its midpoint (and it is rigid, so it does not bend)', 'The rod is light, so its weight can be ignored', 'The supports are smooth, so there is no reaction'];
    const C: ChoiceSpec = ans.choice(opts, 0);
    const svg = rodSvg(L, [{ x: c, label: 'C' }, { x: dpos, label: 'D' }], [{ x: L / 2, label: `${M}g` }, { x: e, label: `${m}g` }], [{ x: c / 2, label: `${fmtNum(c)} m` }, { x: (dpos + L) / 2, label: `${fmtNum(L - dpos)} m` }]);
    return {
      stem: md`${what} $AB$ has length $${L}$ m and mass $${M}$ kg. It rests horizontally on two supports at $C$ and $D$, where $AC = ${fmtNum(c)}$ m and $DB = ${fmtNum(L - dpos)}$ m. A particle of mass $${m}$ kg is attached at the point $E$ on the ${what.split(' ')[2]}, where $AE = ${fmtNum(e)}$ m. Take $g = 9.8$ m s$^{-2}$.`,
      diagram: { svg, alt: `Horizontal ${what.split(' ')[2]} AB on supports C and D, with its weight at the midpoint and a particle at E.` },
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find the magnitude of the reaction at $D$.`, answer: RDs, scheme: [M1('Takes moments about C (or another point), with all relevant terms'), A1('Correct moments equation'), A1(md`$${fmtSF(RD, 3)}$ N`)], hints: ['Take moments about C so that the reaction at C has no moment.', md`Distances from C: weight of the ${what.split(' ')[2]} $${fmtNum(L / 2 - c)}$ m, particle $${fmtNum(e - c)}$ m, D $${fmtNum(dpos - c)}$ m.`, 'Clockwise moments = anticlockwise moments.'], errors: [err('no-particle', NG((M * G * (L / 2 - c)) / (dpos - c)), 'Include the moment of the particle as well.', 1)], solution: [md`About $C$: $R_{D} \times ${fmtNum(dpos - c)} = ${M}g \times ${fmtNum(L / 2 - c)} ${e - c < 0 ? '-' : '+'} ${m}g \times ${fmtNum(Math.abs(e - c))}$`, md`$R_{D} = ${answerTex(RDs)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the magnitude of the reaction at $C$.`, answer: RCs, scheme: [M1('Resolves vertically'), A1(md`$${fmtSF(RC, 3)}$ N`)], hints: ['Resolve vertically: the reactions balance the total weight.', md`$R_{C} + R_{D} = (${M} + ${m})g$`, 'Use your answer to (a).'], solution: [md`$R_{C} = ${M + m} \times 9.8 - ${fmtSF(RD, 4)} = ${answerTex(RCs)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`Explain how you have used the fact that the ${what.split(' ')[2]} is uniform.`, answer: C, scheme: [B1('Weight acts at the midpoint')], hints: ['Where does the weight of a uniform object act?', 'Think about the centre of mass.', 'What would change if it were not uniform?'], solution: [opts[0]] }),
      ],
      params: { L, c, dpos, M, m, e },
    };
  },
  verify(inst) {
    const { L, c, dpos, M, m, e } = inst.params as Record<string, number>;
    const RD = valOf(inst.parts[0].answer as NumericSpec),
      RC = valOf(inst.parts[1].answer as NumericSpec);
    expectClose(RC + RD, (M + m) * G, 'vertical equilibrium');
    // moments about A must also balance
    expectClose(RC * c + RD * dpos, M * G * (L / 2) + m * G * e, 'moments about A');
  },
});

// ---------------------------------------------------------------- 4.4–4.5 non-uniform rod, centre of mass, tilting
const tilting = defineTemplate({
  id: 'sm2.4.non-uniform-rod-on-point-of-tilting',
  family: 'sm2.4.moments',
  title: 'Non-uniform rod on the point of tilting: find the centre of mass',
  spec: ['M9.1'],
  chapter: 'SM2.4',
  sections: ['4.4', '4.5'],
  level: 'A2',
  paper: [3],
  difficulty: 4,
  marks: 7,
  time: 9,
  commands: ['Find', 'Explain'],
  tags: ['moments', 'tilting', 'centre of mass', 'non-uniform rod', 'diagram'],
  generate(r) {
    const L = r.pick([3, 4, 5, 6, 8]);
    const c = r.pick([0.5, 1]),
      db = r.pick([0.5, 1, 1.5]);
    const dpos = L - db;
    const M = r.pick([10, 12, 15, 20, 24, 30]),
      m = r.pick([2, 3, 4, 5, 6, 8, 10]);
    // tilting about D when particle at B: M g (dpos − x) = m g (L − dpos)
    const x = Q.from(dpos).sub(Q.of(m).mul(Q.from(L - dpos)).div(M));
    r.require(x.value > c + 0.1 && x.value < dpos - 0.05 && x.d <= 20);
    const RD = (M + m) * G;
    const X = ans.exact(num(x), undefined, { allowDecimal: true, unit: '\\text{m}' }),
      Rs = NG(RD);
    const opts = ['The rod is about to turn about D, so it loses contact with C and the reaction at C is zero', 'The reaction at D is zero', 'The rod is about to slide, so friction is limiting'];
    const C: ChoiceSpec = ans.choice(opts, 0);
    const svg = rodSvg(L, [{ x: c, label: 'C' }, { x: dpos, label: 'D' }], [{ x: L, label: `${m}g` }], [{ x: c / 2, label: `${fmtNum(c)} m` }, { x: (dpos + L) / 2, label: `${fmtNum(db)} m` }]);
    return {
      stem: md`A non-uniform rod $AB$ has length $${L}$ m and mass $${M}$ kg. It rests horizontally on two supports at $C$ and $D$, where $AC = ${fmtNum(c)}$ m and $DB = ${fmtNum(db)}$ m. When a particle of mass $${m}$ kg is attached at $B$, the rod is on the point of tilting about $D$. Take $g = 9.8$ m s$^{-2}$.`,
      diagram: { svg, alt: `Rod AB on supports C and D with a particle hanging at end B.` },
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Explain what “on the point of tilting about $D$” tells you about the reaction at $C$.`, answer: C, scheme: [B1('Reaction at C is zero')], hints: ['If the rod is about to rotate about D, which support does it lift off?', 'A support that is not touching exerts no force.', 'So which reaction is zero?'], solution: [opts[0]] }),
        part({ label: 'b', marks: 4, prompt: md`Find the distance of the centre of mass of the rod from $A$.`, answer: X, scheme: [M1('Takes moments about D with R_C = 0'), A1(md`$${M}g(${fmtNum(dpos)} - x) = ${m}g \times ${fmtNum(db)}$`), dM1('Solves for x'), A1(md`$x = ${fmtNum(x.value, 4)}$ m`)], hints: [md`Let the centre of mass be $x$ m from $A$. Take moments about $D$.`, md`The weight $${M}g$ acts $(${fmtNum(dpos)} - x)$ m from $D$; the particle acts $${fmtNum(db)}$ m from $D$ on the other side.`, 'g cancels.'], errors: [err('measured-from-D', ans.exact(num(Q.from(dpos).sub(x)), undefined, { allowDecimal: true }), 'That is the distance from D — the question asks for the distance from A.', 2)], solution: [md`$${M}(${fmtNum(dpos)} - x) = ${m} \times ${fmtNum(db)} \Rightarrow x = ${answerTex(X)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the reaction at $D$ in this situation.`, answer: Rs, scheme: [M1('Resolves vertically with R_C = 0'), A1(md`$${fmtSF(RD, 3)}$ N`)], hints: ['Only one support is in contact.', 'It supports the whole weight.', md`$(${M} + ${m})g$`], solution: [md`$R_{D} = ${M + m} \times 9.8 = ${answerTex(Rs)}$`] }),
      ],
      params: { L, dpos, M, m },
    };
  },
  verify(inst) {
    const { L, dpos, M, m } = inst.params as Record<string, number>;
    const x = valOf(inst.parts[1].answer as ExactSpec);
    expectClose(M * (dpos - x), m * (L - dpos), 'moments about D');
    expect(x > 0 && x < L, 'on the rod');
  },
});

// ---------------------------------------------------------------- ladder against a smooth wall (SM2.7 static rigid bodies)
const TANS: [number, number, number][] = [
  [4, 3, 5],
  [12, 5, 13],
  [24, 7, 25],
  [15, 8, 17],
  [3, 2, 0],
  [2, 1, 0],
];

function ladderSvg(tan: number): string {
  const th = Math.atan(tan);
  const L = 170;
  const ax = 70,
    ay = 200,
    bx = ax + L * Math.cos(th),
    by = ay - L * Math.sin(th);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 230" class="dg" role="img">`,
    `<line class="dg-curve" x1="20" y1="${ay}" x2="${bx + 10}" y2="${ay}"/>`,
    `<line class="dg-curve" x1="${bx}" y1="${ay}" x2="${bx}" y2="10"/>`,
    `<line class="dg-line" x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" style="stroke-width:4"/>`,
    `<text class="dg-label" x="${ax - 6}" y="${ay + 18}">A</text><text class="dg-label" x="${bx - 18}" y="${by - 4}">B</text>`,
    `<text class="dg-label" x="${ax + 34}" y="${ay - 8}">θ</text>`,
    `</svg>`,
  ].join('');
}

const ladder = defineTemplate({
  id: 'sm2.4.ladder-limiting-equilibrium',
  family: 'sm2.4.ladders',
  title: 'Ladder against a smooth wall on rough ground: limiting equilibrium',
  spec: ['M9.1', 'M8.6', 'M8.4'],
  chapter: 'SM2.4',
  sections: ['4.3'],
  level: 'A2',
  paper: [3],
  difficulty: 5,
  marks: 9,
  time: 12,
  commands: ['Find', 'Show that', 'State'],
  tags: ['moments', 'ladders', 'friction', 'limiting equilibrium', 'rigid bodies', 'diagram'],
  generate(r) {
    const [o, a] = r.pick(TANS);
    const tan = Q.of(o, a);
    const M = r.pick([10, 15, 20, 25, 30]),
      withPerson = r.bool(0.6);
    const m = withPerson ? r.pick([50, 60, 70, 75, 80]) : 0;
    const k = withPerson ? r.pick([Q.of(1, 4), Q.of(1, 3), Q.of(1, 2), Q.of(2, 3), Q.of(3, 4)]) : Q.of(0);
    const Lm = r.pick([4, 5, 6, 8]);
    // moments about A: S L sinθ = M g (L/2) cosθ + m g (kL) cosθ  ⇒  S = g (M/2 + m k)/tanθ
    const SoverG = Q.of(M, 2).add(k.mul(m)).div(tan);
    const S = SoverG.value * G,
      R = (M + m) * G;
    const mu = SoverG.div(M + m);
    const Rs = NG(R),
      Ss = NG(S),
      Mu = ans.exact(num(mu), undefined, { allowDecimal: true });
    const opts = ['The ladder is a uniform rod, the wall is smooth, and the person is modelled as a particle', 'The ladder is light', 'The ground is smooth'];
    const C: ChoiceSpec = ans.choice(opts, 0);
    const where = withPerson ? md` A person of mass $${m}$ kg stands on the ladder at a point $${k.toLatex()}$ of the way up from $A$.` : '';
    return {
      stem: md`A uniform ladder $AB$, of length $${Lm}$ m and mass $${M}$ kg, rests with $A$ on rough horizontal ground and $B$ against a smooth vertical wall. The ladder makes an angle $\theta$ with the ground, where $\tan\theta = ${tan.toLatex()}$.${where} The ladder is in limiting equilibrium. Take $g = 9.8$ m s$^{-2}$.`,
      diagram: { svg: ladderSvg(tan.value), alt: 'A ladder AB leaning against a vertical wall, with its foot A on the ground at angle θ.' },
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find the normal reaction at $A$.`, answer: Rs, scheme: [B1(md`$R = ${M + m}g = ${fmtSF(R, 3)}$ N`)], hints: ['Resolve vertically.', 'The wall is smooth: its reaction is horizontal.', md`So $R = (${M}${withPerson ? ` + ${m}` : ''})g$.`], solution: [md`$R = ${M + m} \times 9.8 = ${answerTex(Rs)}$`] }),
        part({ label: 'b', marks: 4, prompt: md`Find the magnitude of the reaction at the wall.`, answer: Ss, scheme: [M1('Takes moments about A'), A1('Weight term(s) correct'), A1(md`$S \times ${Lm}\sin\theta$`), A1(md`$${fmtSF(S, 3)}$ N`)], hints: ['Take moments about A: friction and R at A then have no moment.', md`The ladder's weight acts at the midpoint: $${M}g \times ${fmtNum(Lm / 2)}\cos\theta$.`, md`Use $\sin\theta$ and $\cos\theta$ from $\tan\theta = ${tan.toLatex()}$.`], errors: [err('sin-cos-swapped', NG(SoverG.mul(tan).mul(tan).value * G), 'Check which trig ratio gives each perpendicular distance: horizontal distances use cos θ, the height uses sin θ.', 2)], solution: [md`About $A$: $S \times ${Lm}\sin\theta = ${M}g \times ${fmtNum(Lm / 2)}\cos\theta${withPerson ? ` + ${m}g \\times ${fmtNum(k.value * Lm)}\\cos\\theta` : ''}$`, md`$S = \dfrac{g(${M / 2}${withPerson ? ` + ${fmtNum(k.value * m)}` : ''})}{\tan\theta} = ${answerTex(Ss)}$`] }),
        part({ label: 'c', marks: 3, prompt: md`Find the coefficient of friction between the ladder and the ground.`, answer: Mu, scheme: [M1('Resolves horizontally: F = S'), M1(md`$F = \mu R$ (limiting)`), A1(md`$\mu = ${mu.toLatex()}$`)], hints: ['Resolve horizontally: friction balances the wall reaction.', 'In limiting equilibrium F = μR.', 'Divide your (b) by your (a).'], solution: [md`$F = S$, $\mu = \dfrac{F}{R} = \dfrac{${fmtSF(S, 4)}}{${fmtSF(R, 4)}} = ${answerTex(Mu)}$`] }),
        part({ label: 'd', marks: 1, prompt: md`State one modelling assumption you have made.`, answer: C, scheme: [B1('Sensible assumption')], hints: ['What have you assumed about the ladder?', 'What about the wall?', 'And the person, if there is one?'], solution: [opts[0]] }),
      ],
      params: { tan: tan.value, M, m, k: k.value, Lm },
    };
  },
  verify(inst) {
    const { tan, M, m, k, Lm } = inst.params as Record<string, number>;
    const th = Math.atan(tan);
    const R = valOf(inst.parts[0].answer as NumericSpec),
      S = valOf(inst.parts[1].answer as NumericSpec),
      mu = valOf(inst.parts[2].answer as ExactSpec);
    expectClose(R, (M + m) * G, 'vertical');
    // moments about B must balance too: R L cosθ = F L sinθ + M g (L/2) cosθ + m g (1 − k) L cosθ, with F = S
    expectClose(R * Lm * Math.cos(th), S * Lm * Math.sin(th) + M * G * (Lm / 2) * Math.cos(th) + m * G * (1 - k) * Lm * Math.cos(th), 'moments about B');
    expectClose(mu * R, S, 'limiting friction');
  },
});


const templates: Template[] = [twoSupports, tilting, ladder];
export default templates;
