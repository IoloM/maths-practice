/** Pure Year 1, Chapter 9 — sine and cosine rules, area, trig graphs and exact values. */
import { evaluate } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, ListSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const D3 = (v: number) => ans.num(v, { sf: 3 }, { unit: '^{\\circ}' });

function triangleSvg(a: number, b: number, C: number, labels: { A: string; B: string; C: string; a?: string; b?: string; c?: string }) {
  // place C at origin, CB along x-axis (length a), CA at angle C (length b)
  const Bx = a,
    Ax = b * Math.cos(rad(C)),
    Ay = b * Math.sin(rad(C));
  const xs = [0, Bx, Ax],
    ys = [0, 0, Ay];
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    maxY = Math.max(...ys);
  const s = 260 / Math.max(maxX - minX, maxY, 1);
  const P = (x: number, y: number) => [30 + (x - minX) * s, 230 - y * s];
  const [c0, b0, a0] = [P(0, 0), P(Bx, 0), P(Ax, Ay)];
  const mid = (p: number[], q: number[]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const t = (p: number[], txt: string, dx = 0, dy = 0) => `<text class="dg-label" x="${(p[0] + dx).toFixed(1)}" y="${(p[1] + dy).toFixed(1)}" text-anchor="middle">${txt}</text>`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 260" class="dg" role="img">`,
    `<polygon class="dg-line" style="fill:none" points="${[c0, b0, a0].map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}"/>`,
    t(c0, labels.C, -10, 14),
    t(b0, labels.B, 10, 14),
    t(a0, labels.A, 0, -8),
    labels.a ? t(mid(c0, b0), labels.a, 0, 18) : '',
    labels.b ? t(mid(c0, a0), labels.b, -16, 0) : '',
    labels.c ? t(mid(b0, a0), labels.c, 18, 0) : '',
    '</svg>',
  ].join('');
}

const cosineSide = defineTemplate({
  id: 'p1.9.cosine-rule-side',
  family: 'p1.9.cosine-rule',
  title: 'Cosine rule: find a side',
  spec: ['P5.1'],
  chapter: 'P1.9',
  sections: ['9.1'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 3,
  time: 4,
  commands: ['Find'],
  tags: ['cosine rule', 'triangles'],
  generate(r) {
    const b = r.int(4, 15),
      c = r.int(4, 15),
      A = r.int(25, 140);
    const a = Math.sqrt(b * b + c * c - 2 * b * c * Math.cos(rad(A)));
    const S = ans.num(a, { sf: 3 }, { unit: '\\text{cm}' });
    return {
      stem: md`In triangle $ABC$, $AB = ${c}$ cm, $AC = ${b}$ cm and angle $BAC = ${A}^{\circ}$.`,
      diagram: { svg: triangleSvg(a, b, deg(Math.acos((a * a + b * b - c * c) / (2 * a * b))), { A: 'A', B: 'B', C: 'C', b: `${b} cm`, c: `${c} cm` }), alt: `Triangle ABC with AB = ${c} cm, AC = ${b} cm and angle A = ${A} degrees.` },
      parts: [part({ marks: 3, prompt: md`Find the length of $BC$, giving your answer to 3 significant figures.`, answer: S, scheme: [M1(md`$a^{2} = ${b}^{2} + ${c}^{2} - 2(${b})(${c})\cos ${A}^{\circ}$`), A1(md`$a^{2} = ${fmtSF(a * a, 5)}$`), A1(md`$${answerTex(S)}$`)], hints: ['Two sides and the angle between them: use the cosine rule.', md`$a^{2} = b^{2} + c^{2} - 2bc\cos A$`, 'Take the square root at the end.'], errors: [err('plus', ans.num(Math.sqrt(b * b + c * c + 2 * b * c * Math.cos(rad(A))), { sf: 3 }), 'The cosine rule has MINUS 2bc cos A.'), err('no-root', ans.num(a * a, { sf: 3 }), 'That is a². Take the square root.', 2)], solution: [md`$BC^{2} = ${b}^{2} + ${c}^{2} - 2(${b})(${c})\cos ${A}^{\circ} = ${fmtSF(a * a, 6)}$`, md`$BC = ${answerTex(S)}$`] })],
      params: { b, c, A },
    };
  },
  verify(inst) {
    const { b, c, A } = inst.params as Record<string, number>;
    const a = (inst.parts[0].answer as NumericSpec).value;
    // coordinate check: A at origin, B at (c, 0), C at (b cos A, b sin A)
    expectClose(Math.hypot(b * Math.cos(rad(A)) - c, b * Math.sin(rad(A))), a, 'distance BC');
  },
});

const cosineAngle = defineTemplate({
  id: 'p1.9.cosine-rule-angle',
  family: 'p1.9.cosine-rule',
  title: 'Cosine rule: find an angle',
  spec: ['P5.1'],
  chapter: 'P1.9',
  sections: ['9.1'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 3,
  time: 4,
  commands: ['Find'],
  tags: ['cosine rule', 'triangles', 'angles'],
  generate(r) {
    const a = r.int(3, 14),
      b = r.int(3, 14),
      c = r.int(3, 14);
    r.require(a + b > c + 0.5 && a + c > b + 0.5 && b + c > a + 0.5);
    const largest = Math.max(a, b, c) === c;
    const C = deg(Math.acos((a * a + b * b - c * c) / (2 * a * b)));
    const S = D3(C);
    return {
      stem: md`Triangle $ABC$ has $BC = ${a}$ cm, $AC = ${b}$ cm and $AB = ${c}$ cm.`,
      parts: [part({ marks: 3, prompt: md`Find the size of angle $ACB$, in degrees to 3 significant figures.`, answer: S, scheme: [M1(md`$\cos C = \dfrac{${a}^{2} + ${b}^{2} - ${c}^{2}}{2(${a})(${b})}$`), A1(md`$\cos C = ${fmtSF((a * a + b * b - c * c) / (2 * a * b), 4)}$`), A1(md`$${answerTex(S)}$`)], hints: ['Three sides known: rearrange the cosine rule.', md`$\cos C = \dfrac{a^{2} + b^{2} - c^{2}}{2ab}$`, md`The side opposite angle $C$ is $AB = ${c}$.`], errors: [err('wrong-opposite', D3(deg(Math.acos((a * a + c * c - b * b) / (2 * a * c)))), 'Use the side opposite the angle you want in the "minus" position.', 1)], solution: [md`$\cos C = \dfrac{${a * a} + ${b * b} - ${c * c}}{${2 * a * b}} = ${fmtSF((a * a + b * b - c * c) / (2 * a * b), 5)}$`, md`$C = ${answerTex(S)}$${largest ? ' (the largest angle, opposite the longest side)' : ''}`] })],
      params: { a, b, c },
    };
  },
  verify(inst) {
    const { a, b, c } = inst.params as Record<string, number>;
    const C = rad((inst.parts[0].answer as NumericSpec).value);
    expectClose(a * a + b * b - 2 * a * b * Math.cos(C), c * c, 'cosine rule back-substitution', 1e-9);
  },
});

const sineAmbiguous = defineTemplate({
  id: 'p1.9.sine-rule-ambiguous',
  family: 'p1.9.sine-rule',
  title: 'Sine rule: the ambiguous case',
  spec: ['P5.1'],
  chapter: 'P1.9',
  sections: ['9.2'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 4,
  time: 6,
  commands: ['Find'],
  tags: ['sine rule', 'ambiguous case', 'triangles'],
  generate(r) {
    const A = r.int(20, 60);
    const b = r.int(6, 15);
    const a = Number((b * Math.sin(rad(A)) + r.real(0.3, b * (1 - Math.sin(rad(A))) - 0.3, 1)).toFixed(1));
    r.require(a < b && a > b * Math.sin(rad(A)) + 0.2);
    const B1v = deg(Math.asin((b * Math.sin(rad(A))) / a));
    const B2v = 180 - B1v;
    r.require(B2v + A < 179);
    const L: ListSpec = ans.list([ans.num(B1v, { sf: 3 }), ans.num(B2v, { sf: 3 })], { v: 'B', angle: 'deg' });
    return {
      stem: md`In triangle $ABC$, $BC = ${fmtNum(a)}$ cm, $AC = ${b}$ cm and angle $BAC = ${A}^{\circ}$.`,
      parts: [part({ marks: 4, prompt: md`Find the two possible sizes of angle $ABC$, in degrees to 3 significant figures.`, answer: L, scheme: [M1(md`$\dfrac{\sin B}{${b}} = \dfrac{\sin ${A}^{\circ}}{${fmtNum(a)}}$`), A1(md`$B = ${fmtSF(B1v, 3)}^{\circ}$`), M1(md`$180^{\circ} - ${fmtSF(B1v, 3)}^{\circ}$`), A1(md`$${answerTex(L)}$`)], hints: ['Use the sine rule with the pair you know (a and A).', md`$\sin B = \dfrac{${b}\sin ${A}^{\circ}}{${fmtNum(a)}}$`, md`$\sin(180^{\circ} - B) = \sin B$, so there may be an obtuse answer too.`], errors: [err('acute-only', ans.list([ans.num(B1v, { sf: 3 })], { v: 'B', angle: 'deg' }), 'There is a second, obtuse, possibility: 180° − B.', 3)], solution: [md`$\sin B = \dfrac{${b}\sin ${A}^{\circ}}{${fmtNum(a)}} = ${fmtSF(Math.sin(rad(B1v)), 4)}$`, md`$B = ${fmtSF(B1v, 3)}^{\circ}$ or $180^{\circ} - ${fmtSF(B1v, 3)}^{\circ} = ${fmtSF(B2v, 3)}^{\circ}$`, md`$${answerTex(L)}$`] })],
      params: { a, b, A },
    };
  },
  verify(inst) {
    const { a, b, A } = inst.params as Record<string, number>;
    for (const it of (inst.parts[0].answer as ListSpec).items) {
      const B = rad((it as NumericSpec).value);
      expectClose(a / Math.sin(rad(A)), b / Math.sin(B), 'sine rule', 1e-9);
      expect(rad(A) + B < Math.PI, 'valid triangle');
    }
  },
});

const area = defineTemplate({
  id: 'p1.9.area-of-triangle',
  family: 'p1.9.area',
  title: 'Area of a triangle using ½ab sin C',
  spec: ['P5.1'],
  chapter: 'P1.9',
  sections: ['9.3'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find'],
  tags: ['area of triangle', 'sine', 'cosine rule'],
  generate(r) {
    const a = r.int(5, 14),
      b = r.int(5, 14),
      C = r.int(30, 130);
    const Ar = 0.5 * a * b * Math.sin(rad(C));
    const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(rad(C)));
    const A1v = ans.num(Ar, { sf: 3 }, { unit: '\\text{cm}^{2}' }),
      Cv = ans.num(c, { sf: 3 }, { unit: '\\text{cm}' });
    return {
      stem: md`In triangle $PQR$, $PQ = ${a}$ cm, $QR = ${b}$ cm and angle $PQR = ${C}^{\circ}$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the area of triangle $PQR$.`, answer: A1v, scheme: [M1(md`$\frac{1}{2}(${a})(${b})\sin ${C}^{\circ}$`), A1(md`$${answerTex(A1v)}$`)], hints: ['Area = ½ab sin C, using two sides and the angle between them.', md`The angle between $PQ$ and $QR$ is angle $Q$.`, md`$\frac{1}{2} \times ${a} \times ${b} \times \sin ${C}^{\circ}$`], errors: [err('no-half', ans.num(2 * Ar, { sf: 3 }), 'Remember the ½.', 1)], solution: [md`Area $= \frac{1}{2} \times ${a} \times ${b} \times \sin ${C}^{\circ} = ${answerTex(A1v)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Find the length of $PR$.`, answer: Cv, scheme: [M1('Cosine rule'), A1('Correct substitution'), A1(md`$${answerTex(Cv)}$`)], hints: ['Two sides and the included angle: cosine rule.', md`$PR^{2} = ${a}^{2} + ${b}^{2} - 2(${a})(${b})\cos ${C}^{\circ}$`, 'Square root at the end.'], solution: [md`$PR^{2} = ${a * a} + ${b * b} - ${2 * a * b}\cos ${C}^{\circ} = ${fmtSF(c * c, 5)}$, so $PR = ${answerTex(Cv)}$`] }),
      ],
      params: { a, b, C },
    };
  },
  verify(inst) {
    const { a, b, C } = inst.params as Record<string, number>;
    // Heron's formula as an independent area check
    const c = (inst.parts[1].answer as NumericSpec).value;
    const s = (a + b + c) / 2;
    expectClose(Math.sqrt(s * (s - a) * (s - b) * (s - c)), (inst.parts[0].answer as NumericSpec).value, "Heron's formula", 1e-9);
    void C;
  },
});

const graphFeatures = defineTemplate({
  id: 'p1.9.trig-graph-features',
  family: 'p1.9.trig-graphs',
  title: 'Maximum, minimum and period of a transformed trig graph',
  spec: ['P5.3', 'P2.9'],
  chapter: 'P1.9',
  sections: ['9.5', '9.6'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 4,
  time: 4,
  commands: ['Write down'],
  tags: ['trig graphs', 'period', 'transformations'],
  generate(r) {
    const a = r.intNZ(-5, 5),
      b = r.pick([2, 3, 4, 0.5]),
      c = r.int(-4, 6);
    const f = r.pick(['sin', 'cos'] as const);
    const bTex = b === 0.5 ? '\\frac{1}{2}' : String(b);
    const tex = `y = ${sumTex([[a, `\\${f} ${bTex}x`], [c, '']])}`.replace('\\sin \\frac{1}{2}x', '\\sin \\tfrac{1}{2}x');
    const Mx = ans.exact(ex(String(c + Math.abs(a)))),
      Mn = ans.exact(ex(String(c - Math.abs(a)))),
      P = ans.num(360 / b, { sf: 3 }, { unit: '^{\\circ}' });
    return {
      stem: md`The graph of $${tex}$ is drawn for $x$ in degrees.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: 'Write down the maximum value of y.', answer: Mx, scheme: [B1(md`$${c + Math.abs(a)}$`)], hints: [md`$${'\\' + f}$ takes values between $-1$ and $1$.`, md`So $${a}${'\\' + f}(\dots)$ ranges between $${-Math.abs(a)}$ and $${Math.abs(a)}$.`, md`Add $${c}$.`], solution: [md`Max $= ${c} + ${Math.abs(a)} = ${answerTex(Mx)}$`] }),
        part({ label: 'b', marks: 1, prompt: 'Write down the minimum value of y.', answer: Mn, scheme: [B1(md`$${c - Math.abs(a)}$`)], hints: ['Same idea as the maximum.', md`Lowest value of $${a}${'\\' + f}(\dots)$ is $${-Math.abs(a)}$.`, md`Add $${c}$.`], solution: [md`Min $= ${c} - ${Math.abs(a)} = ${answerTex(Mn)}$`] }),
        part({ label: 'c', marks: 2, prompt: 'Find the period of the graph, in degrees.', answer: P, scheme: [M1(md`$\frac{360^{\circ}}{${bTex}}$`), A1(md`$${answerTex(P)}$`)], hints: [md`$${'\\' + f} x$ has period $360^{\circ}$.`, md`$${'\\' + f}(kx)$ is a horizontal stretch by scale factor $\frac{1}{k}$.`, md`Period $= \frac{360}{${bTex}}$`], errors: [err('times', ans.num(360 * b, { sf: 3 }), 'Divide 360° by the coefficient of x — f(kx) squashes the graph.', 1)], solution: [md`Period $= \frac{360^{\circ}}{${bTex}} = ${answerTex(P)}$`] }),
      ],
      params: { a, b, c, f },
    };
  },
  verify(inst) {
    const { a, b, c, f } = inst.params as { a: number; b: number; c: number; f: string };
    const y = (x: number) => a * (f === 'sin' ? Math.sin(rad(b * x)) : Math.cos(rad(b * x))) + c;
    let mx = -Infinity,
      mn = Infinity;
    for (let x = 0; x < 720; x += 0.25) {
      mx = Math.max(mx, y(x));
      mn = Math.min(mn, y(x));
    }
    expectClose(evaluate((inst.parts[0].answer as ExactSpec).value), mx, 'max', 1e-6);
    expectClose(evaluate((inst.parts[1].answer as ExactSpec).value), mn, 'min', 1e-6);
    const P = (inst.parts[2].answer as NumericSpec).value;
    expectClose(y(17 + P), y(17), 'periodic', 1e-9);
  },
});

const graphIntercepts = defineTemplate({
  id: 'p1.9.trig-graph-intercepts',
  family: 'p1.9.trig-graphs',
  title: 'Where a translated trig graph crosses the axes',
  spec: ['P5.3', 'P2.9'],
  chapter: 'P1.9',
  sections: ['9.6'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 3,
  time: 4,
  commands: ['Find', 'Write down'],
  tags: ['trig graphs', 'translations', 'intercepts'],
  generate(r) {
    const f = r.pick(['sin', 'cos'] as const);
    const amp = r.pick([1, 2, 3, 5]);
    const alpha = r.pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85]) * r.sign();
    const xs: number[] = [];
    for (let x = 0; x <= 360; x++) {
      const v = f === 'sin' ? Math.sin(rad(x + alpha)) : Math.cos(rad(x + alpha));
      if (Math.abs(v) < 1e-12) xs.push(x);
    }
    r.require(xs.length >= 2);
    const L: ListSpec = ans.list(xs.map((x) => ans.num(x, { sf: 3 })), { v: 'x', angle: 'deg' });
    return {
      stem: md`The curve $C$ has equation $y = ${amp === 1 ? '' : amp}${'\\' + f}(x ${alpha < 0 ? '-' : '+'} ${Math.abs(alpha)}^{\circ})$, $0^{\circ} \leqslant x \leqslant 360^{\circ}$.`,
      parts: [part({ marks: 3, prompt: md`Find the $x$-coordinates of the points where $C$ meets the $x$-axis.`, answer: L, scheme: [M1(md`Uses the zeros of $${'\\' + f}$: $x ${alpha < 0 ? '-' : '+'} ${Math.abs(alpha)} = ${f === 'sin' ? '0, 180, 360, \\dots' : '90, 270, \\dots'}$`), A1('One correct'), A1(md`$${answerTex(L)}$`)], hints: [md`$${'\\' + f}\theta = 0$ when $\theta = ${f === 'sin' ? '0°, 180°, 360°, …' : '90°, 270°, …'}$`, md`Set $x ${alpha < 0 ? '-' : '+'} ${Math.abs(alpha)}$ equal to these values.`, 'Keep only the solutions between 0° and 360°.'], errors: [err('wrong-direction', ans.list(xs.map((x) => ans.num(((x + 2 * alpha) % 360 + 360) % 360, { sf: 3 })), { v: 'x', angle: 'deg' }), md`$f(x ${alpha < 0 ? '-' : '+'} ${Math.abs(alpha)})$ moves the graph ${alpha < 0 ? 'right' : 'left'} by $${Math.abs(alpha)}^{\circ}$.`, 1)], solution: [md`$${answerTex(L)}$`] })],
      params: { f, alpha },
    };
  },
  verify(inst) {
    const { f, alpha } = inst.params as { f: string; alpha: number };
    for (const it of (inst.parts[0].answer as ListSpec).items) {
      const x = (it as NumericSpec).value;
      expectClose(f === 'sin' ? Math.sin(rad(x + alpha)) : Math.cos(rad(x + alpha)), 0, 'zero', 1e-9);
    }
  },
});

void dM1;

const templates: Template[] = [cosineSide, cosineAngle, sineAmbiguous, area, graphFeatures, graphIntercepts];
export default templates;
