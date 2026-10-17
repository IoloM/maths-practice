/** Pure Year 2, Chapter 5 — radians: arcs, sectors and segments, equations in radians, small angle approximations. */
import { Q } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { bisect, expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, ExprSpec, ListSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';
import { SPECIAL, piMultiple, piTex, solveTrigDeg, trigVal, type TrigF } from '../shared/trig';

const exq = (q: Q | number) => num(Q.from(q));
const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
const f2 = (n: number) => (Math.round(n * 10) / 10).toString();

/** Sector OAB of angle θ (radians), symmetric about the upward vertical; optionally shade the segment. */
function sectorSvg(theta: number, segment: boolean, rLabel: string, thLabel: string): string {
  const W = 300,
    H = 250,
    cx = 150,
    cy = theta > Math.PI ? 125 : 190,
    R = theta > Math.PI ? 95 : 150;
  const P = (phi: number, rr = R): [number, number] => [cx + rr * Math.cos(phi), cy - rr * Math.sin(phi)];
  const a1 = Math.PI / 2 - theta / 2,
    a2 = Math.PI / 2 + theta / 2;
  const [ax, ay] = P(a1),
    [bx, by] = P(a2);
  const large = theta > Math.PI ? 1 : 0;
  const arc = `A ${R} ${R} 0 ${large} 0 ${f2(bx)} ${f2(by)}`;
  const shade = segment ? `M ${f2(ax)} ${f2(ay)} ${arc} Z` : `M ${cx} ${cy} L ${f2(ax)} ${f2(ay)} ${arc} Z`;
  const [lx, ly] = P(a1, R / 2);
  const [tx, ty] = P(Math.PI / 2, Math.min(34, R / 4));
  const [Ax, Ay] = P(a1, R + 14),
    [Bx, By] = P(a2, R + 14);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="dg" role="img">`,
    `<path class="dg-shade" d="${shade}"/>`,
    `<path class="dg-curve" fill="none" d="M ${cx} ${cy} L ${f2(ax)} ${f2(ay)} ${arc} Z"/>`,
    segment ? `<line class="dg-line" x1="${f2(ax)}" y1="${f2(ay)}" x2="${f2(bx)}" y2="${f2(by)}"/>` : '',
    `<text class="dg-label" x="${cx}" y="${cy + 16}" text-anchor="middle">O</text>`,
    `<text class="dg-label" x="${f2(Ax)}" y="${f2(Ay + 5)}" text-anchor="middle">A</text>`,
    `<text class="dg-label" x="${f2(Bx)}" y="${f2(By + 5)}" text-anchor="middle">B</text>`,
    `<text class="dg-label" x="${f2(lx + 10)}" y="${f2(ly + 4)}">${rLabel}</text>`,
    `<text class="dg-label" x="${f2(tx)}" y="${f2(ty + 4)}" text-anchor="middle">${thLabel}</text>`,
    `</svg>`,
  ].join('');
}

// ---------------------------------------------------------------- 5.1–5.3 arcs, sectors and segments
const sector = defineTemplate({
  id: 'p2.5.arc-length-and-sector-area',
  family: 'p2.5.arcs-sectors',
  title: 'Arc length, sector area and perimeter in radians',
  spec: ['P5.1'],
  chapter: 'P2.5',
  sections: ['5.1', '5.2', '5.3'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 2,
  marks: 6,
  time: 6,
  commands: ['Find'],
  tags: ['radians', 'arc length', 'sector', 'diagram'],
  generate(r) {
    const rad = r.int(3, 15);
    const exact = r.bool(0.55);
    if (exact) {
      const deg = r.pick([30, 36, 40, 45, 60, 72, 75, 90, 108, 120, 135, 144, 150, 210, 240]);
      const q = piMultiple(deg);
      const Th = ans.exact(ex(piTex(q)), ['exact']);
      const Arc = ans.exact(ex(piTex(q.mul(rad))), ['exact'], { unit: '\\text{cm}' });
      const Area = ans.exact(ex(piTex(q.mul(Q.of(rad * rad, 2)))), ['exact'], { unit: '\\text{cm}^{2}' });
      const Per = ans.exact(ex(`${2 * rad} + ${piTex(q.mul(rad))}`), ['exact'], { unit: '\\text{cm}' });
      return {
        stem: md`The diagram shows a sector $OAB$ of a circle with centre $O$ and radius $${rad}$ cm. The angle $AOB$ is $${deg}^{\circ}$.`,
        diagram: { svg: sectorSvg(q.value * Math.PI, false, `${rad} cm`, `${deg}°`), alt: `Sector OAB with radius ${rad} cm and angle ${deg} degrees at O.` },
        parts: [
          part({ label: 'a', marks: 1, prompt: md`Write the angle $AOB$ in radians, as an exact multiple of $\pi$.`, answer: Th, scheme: [B1(md`$${piTex(q)}$`)], hints: [md`$180^{\circ} = \pi$ radians.`, md`Multiply by $\dfrac{\pi}{180}$.`, md`$\dfrac{${deg}}{180} = ${q.toLatex()}$`], solution: [md`$${deg} \times \dfrac{\pi}{180} = ${answerTex(Th)}$`] }),
          part({ label: 'b', marks: 2, prompt: md`Find the exact length of the arc $AB$.`, answer: Arc, scheme: [M1(md`$l = r\theta$ with $\theta$ in radians`), A1(md`$${piTex(q.mul(rad))}$ cm`)], hints: [md`Arc length $= r\theta$ (θ in radians).`, md`$r = ${rad}$, $\theta = ${piTex(q)}$`, 'Leave π in your answer.'], errors: [err('degrees-used', ans.exact(exq(rad * deg)), 'The formula l = rθ needs θ in radians, not degrees.')], solution: [md`$l = ${rad} \times ${piTex(q)} = ${answerTex(Arc)}$`] }),
          part({ label: 'c', marks: 2, prompt: md`Find the exact area of the sector.`, answer: Area, scheme: [M1(md`$A = \frac{1}{2}r^{2}\theta$`), A1(md`$${piTex(q.mul(Q.of(rad * rad, 2)))}$ cm$^{2}$`)], hints: [md`Sector area $= \frac{1}{2}r^{2}\theta$.`, md`$\frac{1}{2} \times ${rad}^{2} \times ${piTex(q)}$`, 'Simplify the fraction in front of π.'], errors: [err('no-half', ans.exact(ex(piTex(q.mul(rad * rad)))), 'Sector area is ½r²θ — you have missed the ½.', 1)], solution: [md`$A = \frac{1}{2} \times ${rad * rad} \times ${piTex(q)} = ${answerTex(Area)}$`] }),
          part({ label: 'd', marks: 1, prompt: md`Find the exact perimeter of the sector.`, answer: Per, scheme: [B1(md`$${2 * rad} + ${piTex(q.mul(rad))}$ cm`)], hints: ['The perimeter is two radii plus the arc.', md`$2 \times ${rad}$ + arc length`, 'Do not include the area!'], solution: [md`$P = 2 \times ${rad} + ${piTex(q.mul(rad))} = ${answerTex(Per)}$`] }),
        ],
        params: { rad, th: q.value * Math.PI },
      };
    }
    const th = r.pick([0.6, 0.8, 0.9, 1.1, 1.2, 1.4, 1.5, 1.8, 2.1, 2.4, 2.6]);
    const Arc = ans.num(rad * th, { sf: 3 }, { unit: '\\text{cm}' }),
      Area = ans.num(0.5 * rad * rad * th, { sf: 3 }, { unit: '\\text{cm}^{2}' }),
      Per = ans.num(2 * rad + rad * th, { sf: 3 }, { unit: '\\text{cm}' }),
      Deg = ans.num((th * 180) / Math.PI, { dp: 1 }, { unit: '^{\\circ}' });
    return {
      stem: md`The diagram shows a sector $OAB$ of a circle with centre $O$ and radius $${rad}$ cm. The angle $AOB$ is $${th}$ radians.`,
      diagram: { svg: sectorSvg(th, false, `${rad} cm`, `${th} rad`), alt: `Sector OAB with radius ${rad} cm and angle ${th} radians at O.` },
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the length of the arc $AB$.`, answer: Arc, scheme: [M1(md`$l = r\theta$`), A1(md`$${fmtNum(rad * th)}$ cm`)], hints: ['Arc length = rθ with θ in radians.', md`$${rad} \times ${th}$`, 'No conversion needed — the angle is already in radians.'], solution: [md`$l = ${rad} \times ${th} = ${answerTex(Arc)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the area of the sector.`, answer: Area, scheme: [M1(md`$\frac{1}{2}r^{2}\theta$`), A1(md`$${fmtNum(0.5 * rad * rad * th)}$ cm$^{2}$`)], hints: ['Sector area = ½r²θ.', md`$\frac{1}{2} \times ${rad}^{2} \times ${th}$`, 'Evaluate.'], errors: [err('no-half', ans.num(rad * rad * th, { sf: 3 }), 'Remember the ½ in ½r²θ.', 1)], solution: [md`$A = \frac{1}{2} \times ${rad * rad} \times ${th} = ${answerTex(Area)}$`] }),
        part({ label: 'c', marks: 1, prompt: md`Find the perimeter of the sector.`, answer: Per, scheme: [B1(md`$${fmtNum(2 * rad + rad * th)}$ cm`)], hints: ['Two radii and the arc.', md`$2 \times ${rad} + \text{arc}$`, 'Add them up.'], solution: [md`$P = ${2 * rad} + ${fmtNum(rad * th)} = ${answerTex(Per)}$`] }),
        part({ label: 'd', marks: 1, prompt: md`Convert the angle $AOB$ to degrees, to 1 decimal place.`, answer: Deg, scheme: [B1(md`$${fmtSF((th * 180) / Math.PI, 4)}^{\circ}$`)], hints: [md`$\pi$ radians $= 180^{\circ}$.`, md`Multiply by $\dfrac{180}{\pi}$.`, 'Round to 1 decimal place.'], solution: [md`$${th} \times \dfrac{180}{\pi} = ${answerTex(Deg)}$`] }),
      ],
      params: { rad, th },
    };
  },
  verify(inst) {
    const { rad, th } = inst.params as Record<string, number>;
    const vals = inst.parts.map((p) => valOf(p.answer as ExactSpec | NumericSpec));
    const arc = rad * th,
      area = 0.5 * rad * rad * th;
    expect(vals.some((v) => Math.abs(v - arc) < 1e-9), 'arc');
    expect(vals.some((v) => Math.abs(v - area) < 1e-9), 'area');
    expect(vals.some((v) => Math.abs(v - (2 * rad + arc)) < 1e-9), 'perimeter');
  },
});

const segment = defineTemplate({
  id: 'p2.5.segment-area-and-perimeter',
  family: 'p2.5.arcs-sectors',
  title: 'Area and perimeter of a segment',
  spec: ['P5.1'],
  chapter: 'P2.5',
  sections: ['5.3'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 7,
  time: 8,
  commands: ['Find'],
  tags: ['radians', 'segment', 'cosine rule', 'diagram'],
  generate(r) {
    const rad = r.int(4, 14);
    const th = r.pick([0.8, 1, 1.2, 1.3, 1.5, 1.7, 1.9, 2, 2.2, 2.5]);
    const tri = 0.5 * rad * rad * Math.sin(th),
      seg = 0.5 * rad * rad * (th - Math.sin(th)),
      chord = 2 * rad * Math.sin(th / 2),
      per = rad * th + chord;
    const T = ans.num(tri, { sf: 3 }, { unit: '\\text{cm}^{2}' }),
      S = ans.num(seg, { sf: 3 }, { unit: '\\text{cm}^{2}' }),
      P = ans.num(per, { sf: 3 }, { unit: '\\text{cm}' });
    return {
      stem: md`The diagram shows a sector $OAB$ of a circle with centre $O$, radius $${rad}$ cm and angle $AOB = ${th}$ radians. The shaded region is the segment bounded by the chord $AB$ and the arc $AB$.`,
      diagram: { svg: sectorSvg(th, true, `${rad} cm`, `${th}`), alt: `Sector OAB with the segment between chord AB and arc AB shaded.` },
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the area of triangle $OAB$.`, answer: T, scheme: [M1(md`$\frac{1}{2}r^{2}\sin\theta$`), A1(md`awrt $${fmtSF(tri, 3)}$`)], hints: ['Area of a triangle = ½ab sin C.', md`$\frac{1}{2} \times ${rad} \times ${rad} \times \sin ${th}$`, 'Make sure your calculator is in radian mode.'], errors: [err('degree-mode', ans.num(0.5 * rad * rad * Math.sin((th * Math.PI) / 180), { sf: 3 }), 'Your calculator is in degree mode — switch to radians.')], solution: [md`$\frac{1}{2} \times ${rad}^{2} \times \sin ${th} = ${answerTex(T)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the area of the shaded segment.`, answer: S, scheme: [M1('Sector area − triangle area'), A1(md`awrt $${fmtSF(seg, 3)}$`)], hints: ['Segment = sector − triangle.', md`Sector area $= \frac{1}{2} \times ${rad}^{2} \times ${th} = ${fmtNum(0.5 * rad * rad * th)}$`, 'Subtract your answer to (a).'], solution: [md`$\frac{1}{2}(${rad})^{2}(${th} - \sin ${th}) = ${answerTex(S)}$`] }),
        part({ label: 'c', marks: 3, prompt: md`Find the perimeter of the shaded segment.`, answer: P, scheme: [M1(md`Arc $= ${rad} \times ${th}$`), M1(md`Chord $AB$ by the cosine rule or $2r\sin\frac{\theta}{2}$`), A1(md`awrt $${fmtSF(per, 3)}$`)], hints: ['The perimeter is the arc plus the chord AB.', md`Arc length $= r\theta = ${fmtNum(rad * th)}$`, md`$AB^{2} = ${rad}^{2} + ${rad}^{2} - 2(${rad})(${rad})\cos ${th}$`], solution: [md`$AB = 2 \times ${rad}\sin ${fmtNum(th / 2)} = ${fmtSF(chord, 4)}$`, md`Perimeter $= ${fmtNum(rad * th)} + ${fmtSF(chord, 4)} = ${answerTex(P)}$`] }),
      ],
      params: { rad, th },
    };
  },
  verify(inst) {
    const { rad, th } = inst.params as Record<string, number>;
    const AB = Math.sqrt(2 * rad * rad - 2 * rad * rad * Math.cos(th));
    expectClose(valOf(inst.parts[2].answer as NumericSpec), rad * th + AB, 'perimeter via cosine rule');
    expectClose(valOf(inst.parts[1].answer as NumericSpec) + valOf(inst.parts[0].answer as NumericSpec), 0.5 * rad * rad * th, 'segment + triangle = sector');
  },
});

// ---------------------------------------------------------------- 5.4 trigonometric equations in radians
const radEquation = defineTemplate({
  id: 'p2.5.trig-equation-radians-exact',
  family: 'p2.5.equations',
  title: 'Solve f(bx + c) = k in radians, giving exact multiples of π',
  spec: ['P5.7', 'P5.3'],
  chapter: 'P2.5',
  sections: ['5.4'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Solve'],
  tags: ['trigonometric equations', 'radians', 'exact values'],
  generate(r) {
    const f = r.pick(['sin', 'cos', 'tan'] as const) as TrigF;
    const TAN_K = [1, -1, Math.sqrt(3), -Math.sqrt(3), 1 / Math.sqrt(3), -1 / Math.sqrt(3), 0];
    const SC_K = [0.5, -0.5, Math.SQRT1_2, -Math.SQRT1_2, Math.sqrt(3) / 2, -Math.sqrt(3) / 2, 0];
    const ks = SPECIAL.filter((sp) => (f === 'tan' ? TAN_K : SC_K).some((v) => Math.abs(v - sp.v) < 1e-12));
    const k = r.pick(ks);
    const b = r.pick([1, 2, 3]),
      cDeg = r.pick([0, 30, 45, 60, -30, -45, -60, 90, 120]);
    const hiDeg = r.pick([180, 360]);
    const sols = solveTrigDeg(f, k.v, b, cDeg, 0, hiDeg);
    r.require(sols.length >= 1 && sols.length <= 6);
    const L: ListSpec = ans.list(
      sols.map((d) => ans.exact(ex(piTex(piMultiple(d))), ['exact'])),
      { v: 'x', angle: 'rad' },
    );
    const inner = `${b === 1 ? '' : b}x${cDeg === 0 ? '' : ` ${cDeg < 0 ? '-' : '+'} ${piTex(piMultiple(Math.abs(cDeg)))}`}`;
    const hiTex = hiDeg === 180 ? '\\pi' : '2\\pi';
    const base = f === 'sin' ? Math.asin(k.v) : f === 'cos' ? Math.acos(k.v) : Math.atan(k.v);
    const baseTex = piTex(piMultiple((base * 180) / Math.PI));
    const lo2 = piTex(piMultiple(cDeg)),
      hi2 = piTex(piMultiple(b * hiDeg + cDeg));
    return {
      parts: [
        part({
          marks: 5,
          prompt: md`Solve, for $0 \leqslant x < ${hiTex}$, the equation $${'\\' + f}\left(${inner}\right) = ${k.tex}$, giving your answers as exact multiples of $\pi$.`,
          answer: L,
          scheme: [B1(md`Principal value $${baseTex}$`), M1(md`Uses the new interval $${lo2} \leqslant ${inner} < ${hi2}$`), M1('Finds further solutions using symmetry / periodicity'), dM1(md`Undoes the substitution: subtracts ${cDeg === 0 ? '0' : md`$${piTex(piMultiple(cDeg))}$`} and divides by $${b}$`), A1(md`$${answerTex(L)}$`)],
          hints: [md`Let $u = ${inner}$. Then $${lo2} \leqslant u < ${hi2}$.`, md`The principal value of $u$ is $${baseTex}$. Use the graph of $${'\\' + f}$ to find all the values of $u$ in the interval.`, md`Then solve $${inner} = u$ for each value.`],
          solution: [md`$u = ${inner}$, $${lo2} \leqslant u < ${hi2}$, principal value $${baseTex}$.`, md`$x = ${answerTex(L)}$`],
        }),
      ],
      params: { f, k: k.v, b, cDeg, hiDeg },
    };
  },
  verify(inst) {
    const { f, k, b, cDeg, hiDeg } = inst.params as { f: TrigF; k: number; b: number; cDeg: number; hiDeg: number };
    const xs = (inst.parts[0].answer as ListSpec).items.map(valOf);
    for (const x of xs) {
      expect(x >= -1e-12 && x < (hiDeg * Math.PI) / 180, 'in interval');
      expectClose(trigVal(f, (b * x * 180) / Math.PI + cDeg) + 3, k + 3, 'satisfies the equation', 1e-9);
    }
    // independent check: locate every root on a fine grid (ignoring tan's asymptote jumps)
    const g = (x: number) => trigVal(f, (b * x * 180) / Math.PI + cDeg) - k;
    const H = (hiDeg * Math.PI) / 180,
      N = 20000;
    const roots: number[] = [];
    for (let i = 0; i < N; i++) {
      const x0 = (H * i) / N,
        x1 = (H * (i + 1)) / N;
      const y0 = g(x0),
        y1 = g(x1);
      let rt: number | null = null;
      if (Math.abs(y0) < 1e-12) rt = x0;
      else if (y0 * y1 < 0 && Math.abs(y0 - y1) < 1) rt = bisect(g, x0, x1);
      if (rt !== null && rt < H - 1e-9 && !roots.some((q) => Math.abs(q - rt!) < 1e-6)) roots.push(rt);
    }
    expect(roots.length === xs.length, `found ${roots.length} roots for ${xs.length} answers`);
  },
});

// ---------------------------------------------------------------- 5.5 small angle approximations
const smallPoly = defineTemplate({
  id: 'p2.5.small-angle-quadratic-approximation',
  family: 'p2.5.small-angles',
  title: 'Small angle approximation of an expression as a + bθ + cθ²',
  spec: ['P5.2'],
  chapter: 'P2.5',
  sections: ['5.5'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Show that', 'Find'],
  tags: ['small angle approximations', 'radians'],
  generate(r) {
    const A = r.intNZ(-4, 5),
      k = r.pick([1, 2, 3]),
      B = r.int(-5, 5),
      m = r.pick([1, 2, 3]),
      C = r.pick([0, 0, 1, -1, 2]),
      n = r.pick([1, 2]);
    r.require(B * m + C * n !== 0);
    const trm = (c: number, fn: string, mult: number) => (c === 0 ? null : ([c, `\\${fn} ${mult === 1 ? '' : mult}\\theta`] as [number, string]));
    const fTex = sumTex([trm(A, 'cos', k), trm(B, 'sin', m), trm(C, 'tan', n)].filter((t): t is [number, string] => t !== null));
    const c2 = Q.of(-A * k * k, 2);
    const approx = sumTex([[A, ''], [B * m + C * n, '\\theta'], [c2, '\\theta^{2}']]);
    const E: ExprSpec = ans.expr(ex(approx), ['theta'], { domain: { theta: [-0.5, 0.5] } });
    const t0 = r.pick([0.05, 0.1, 0.15, 0.2]);
    const approxVal = A + (B * m + C * n) * t0 + c2.value * t0 * t0;
    const trueVal = A * Math.cos(k * t0) + B * Math.sin(m * t0) + C * Math.tan(n * t0);
    const V = ans.num(approxVal, { dp: 4 }, { alts: [trueVal] });
    return {
      stem: md`$\mathrm{f}(\theta) = ${fTex}$.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Given that $\theta$ is small and measured in radians, use small angle approximations to show that $\mathrm{f}(\theta) \approx a + b\theta + c\theta^{2}$, and find the values of $a$, $b$ and $c$. (Enter your approximation for $\mathrm{f}(\theta)$.)`, answer: E, scheme: [M1(md`$\cos ${k === 1 ? '' : k}\theta \approx 1 - \frac{${k === 1 ? '' : `${k * k}`}\theta^{2}}{2}$`), M1(md`$\sin ${m === 1 ? '' : m}\theta \approx ${m === 1 ? '' : m}\theta${C ? md`$, $\tan ${n === 1 ? '' : n}\theta \approx ${n === 1 ? '' : n}\theta` : ''}$`), A1(md`$${approx}$`)], hints: [md`For small $\theta$: $\sin\theta \approx \theta$, $\tan\theta \approx \theta$, $\cos\theta \approx 1 - \frac{\theta^{2}}{2}$.`, md`So $\cos ${k}\theta \approx 1 - \frac{(${k}\theta)^{2}}{2}$.`, 'Substitute each approximation and collect like terms.'], errors: [err('cos-one', ans.expr(ex(sumTex([[A, ''], [B * m + C * n, '\\theta']])), ['theta'], { domain: { theta: [-0.5, 0.5] } }), md`Use $\cos\theta \approx 1 - \frac{\theta^{2}}{2}$ — the question wants the $\theta^{2}$ term.`, 2)], solution: [md`$\mathrm{f}(\theta) \approx ${A}\left(1 - \frac{${k * k}\theta^{2}}{2}\right)${B ? md` ${B < 0 ? '-' : '+'} ${Math.abs(B)}(${m === 1 ? '' : m}\theta)` : ''}${C ? md` ${C < 0 ? '-' : '+'} ${Math.abs(C)}(${n === 1 ? '' : n}\theta)` : ''}$`, md`$= ${answerTex(E)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Hence find an approximate value of $\mathrm{f}(${t0})$, to 4 decimal places.`, answer: V, scheme: [M1(md`Substitutes $\theta = ${t0}$ into their approximation`), A1(md`$${fmtNum(approxVal, 4)}$`)], hints: ['Use your answer to (a).', md`Substitute $\theta = ${t0}$.`, 'Round to 4 decimal places.'], solution: [md`$${approx.replace(/\\theta/g, `(${t0})`)} = ${answerTex(V)}$`, md`(The exact value is $${fmtNum(trueVal, 6)}$.)`] }),
      ],
      params: { A, k, B, m, C, n, t0 },
    };
  },
  verify(inst) {
    const { A, k, B, m, C, n } = inst.params as Record<string, number>;
    const f = (t: number) => A * Math.cos(k * t) + B * Math.sin(m * t) + C * Math.tan(n * t);
    const e = (inst.parts[0].answer as ExprSpec).value;
    // error is O(θ³): halving θ divides the error by about 8
    const e1 = Math.abs(evaluate(e, { theta: 0.02 }) - f(0.02)),
      e2 = Math.abs(evaluate(e, { theta: 0.01 }) - f(0.01));
    expect(e2 < 5e-4 && (e1 < 1e-12 || e1 / e2 > 5), 'approximation is accurate to second order');
  },
});

const LIMITS = [
  { tex: (a: number, b: number) => `\\frac{1 - \\cos ${a === 1 ? '' : a}\\theta}{\\theta\\sin ${b === 1 ? '' : b}\\theta}`, val: (a: number, b: number) => Q.of(a * a, 2 * b), f: (a: number, b: number, t: number) => (1 - Math.cos(a * t)) / (t * Math.sin(b * t)), how: (a: number, b: number) => md`$\dfrac{\frac{${a === 1 ? '' : a * a}\theta^{2}}{2}}{${b === 1 ? '' : b}\theta^{2}}$` },
  { tex: (a: number, b: number) => `\\frac{\\theta\\tan ${a === 1 ? '' : a}\\theta}{1 - \\cos ${b === 1 ? '' : b}\\theta}`, val: (a: number, b: number) => Q.of(2 * a, b * b), f: (a: number, b: number, t: number) => (t * Math.tan(a * t)) / (1 - Math.cos(b * t)), how: (a: number, b: number) => md`$\dfrac{${a === 1 ? '' : a}\theta^{2}}{\frac{${b === 1 ? '' : b * b}\theta^{2}}{2}}$` },
  { tex: (a: number, b: number) => `\\frac{\\sin ${a === 1 ? '' : a}\\theta\\tan ${b === 1 ? '' : b}\\theta}{1 - \\cos 2\\theta}`, val: (a: number, b: number) => Q.of(a * b, 2), f: (a: number, b: number, t: number) => (Math.sin(a * t) * Math.tan(b * t)) / (1 - Math.cos(2 * t)), how: (a: number, b: number) => md`$\dfrac{${a * b === 1 ? '' : a * b}\theta^{2}}{2\theta^{2}}$` },
  { tex: (a: number, b: number) => `\\frac{\\sin ${a === 1 ? '' : a}\\theta + \\tan ${b === 1 ? '' : b}\\theta}{\\theta(2 + \\cos\\theta)}`, val: (a: number, b: number) => Q.of(a + b, 3), f: (a: number, b: number, t: number) => (Math.sin(a * t) + Math.tan(b * t)) / (t * (2 + Math.cos(t))), how: (a: number, b: number) => md`$\dfrac{${a + b}\theta}{\theta(2 + 1)}$` },
];

const smallLimit = defineTemplate({
  id: 'p2.5.small-angle-limit',
  family: 'p2.5.small-angles',
  title: 'Use small angle approximations to find a limiting value',
  spec: ['P5.2'],
  chapter: 'P2.5',
  sections: ['5.5'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 3,
  time: 4,
  commands: ['Show that', 'Find'],
  tags: ['small angle approximations', 'radians', 'limits'],
  generate(r) {
    const i = r.int(0, LIMITS.length - 1);
    const L = LIMITS[i];
    const a = r.int(1, 6),
      b = r.int(1, 5);
    r.require(a !== b || i === 3);
    const v = L.val(a, b);
    const V = ans.exact(exq(v));
    return {
      parts: [
        part({
          marks: 3,
          prompt: md`Given that $\theta$ is small and measured in radians, use small angle approximations to find the value that $\displaystyle ${L.tex(a, b)}$ approaches as $\theta \to 0$.`,
          answer: V,
          scheme: [M1('Replaces each trigonometric function with its small angle approximation'), M1('Simplifies, cancelling the powers of θ'), A1(md`$${v.toLatex()}$`)],
          hints: [md`$\sin k\theta \approx k\theta$, $\tan k\theta \approx k\theta$, $\cos k\theta \approx 1 - \frac{k^{2}\theta^{2}}{2}$.`, md`Note $1 - \cos k\theta \approx \frac{k^{2}\theta^{2}}{2}$.`, 'The powers of θ on top and bottom should cancel.'],
          solution: [md`$\displaystyle ${L.tex(a, b)} \approx $ ${L.how(a, b)} $= ${answerTex(V)}$`],
        }),
      ],
      params: { i, a, b },
    };
  },
  verify(inst) {
    const { i, a, b } = inst.params as Record<string, number>;
    expectClose(LIMITS[i].f(a, b, 1e-4), valOf(inst.parts[0].answer as ExactSpec), 'limit', 1e-6);
  },
});

const smallSolve = defineTemplate({
  id: 'p2.5.small-angle-approximate-solution',
  family: 'p2.5.small-angles',
  title: 'Approximate solution of a trig equation using small angles',
  spec: ['P5.2', 'P2.3'],
  chapter: 'P2.5',
  sections: ['5.5'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 5,
  time: 6,
  commands: ['Find', 'Show that'],
  tags: ['small angle approximations', 'quadratic', 'radians'],
  generate(r) {
    const A = r.pick([2, 3, 4, 5, 6]),
      B = r.int(1, 5);
    const t0 = r.pick([0.05, 0.08, 0.1, 0.12, 0.15, 0.2]);
    const V = Number(fmtNum(A * (1 - (t0 * t0) / 2) + B * t0, 3));
    // A(1 − θ²/2) + Bθ = V  →  (A/2)θ² − Bθ + (V − A) = 0
    const disc = B * B - 2 * A * (V - A);
    r.require(disc > 0);
    const small = (B - Math.sqrt(disc)) / A;
    r.require(small > 0.01 && small < 0.3);
    let truth = small;
    for (let i = 0; i < 40; i++) truth -= (A * Math.cos(truth) + B * Math.sin(truth) - V) / (-A * Math.sin(truth) + B * Math.cos(truth));
    const S = ans.num(small, { sf: 3 }, { alts: [truth] });
    const quad = sumTex([[Q.of(A, 2), '\\theta^{2}'], [-B, '\\theta'], [Q.from(Number(fmtNum(V - A, 6))), '']]);
    return {
      parts: [
        part({
          marks: 5,
          prompt: md`Given that $\theta$ is small, use small angle approximations to find an approximate solution of $${A}\cos\theta + ${B === 1 ? '' : B}\sin\theta = ${V}$, giving your answer to 3 significant figures.`,
          answer: S,
          scheme: [M1(md`$${A}\left(1 - \frac{\theta^{2}}{2}\right) + ${B === 1 ? '' : B}\theta = ${V}$`), A1(md`$${quad} = 0$`), M1('Solves the quadratic'), A1('Both roots'), A1(md`Chooses the small root $\theta \approx ${fmtSF(small, 3)}$`)],
          hints: [md`Use $\cos\theta \approx 1 - \frac{\theta^{2}}{2}$ and $\sin\theta \approx \theta$.`, md`This gives a quadratic in $\theta$: $${quad} = 0$.`, 'Solve it — only the small solution is consistent with θ being small.'],
          errors: [err('large-root', ans.num((B + Math.sqrt(disc)) / A, { sf: 3 }), 'That root is not small, so the approximations are not valid for it.', 4)],
          solution: [md`$${A} - \frac{${A}}{2}\theta^{2} + ${B === 1 ? '' : B}\theta = ${V} \Rightarrow ${quad} = 0$`, md`$\theta = ${fmtSF(small, 4)}$ or $${fmtSF((B + Math.sqrt(disc)) / A, 4)}$; θ is small so $\theta = ${answerTex(S)}$`],
        }),
      ],
      params: { A, B, V },
    };
  },
  verify(inst) {
    const { A, B, V } = inst.params as Record<string, number>;
    const t = valOf(inst.parts[0].answer as NumericSpec);
    expectClose(A * (1 - (t * t) / 2) + B * t, V, 'approximate equation');
    expect(Math.abs(A * Math.cos(t) + B * Math.sin(t) - V) < 0.01, 'close to the true equation');
  },
});

const templates: Template[] = [sector, segment, radEquation, smallPoly, smallLimit, smallSolve];
export default templates;
